import "server-only";
import { sql } from "./neon";
import { paystack } from "./billing";
export async function runAdminMaintenance() {
  const [policy] = await sql.query(
    "select jsonb_object_agg(section,value)as value from platform_settings where section in('verification','trust-safety','escrow','billing')",
  );
  const policies = policy?.value || {};
  const [superAdmin] = await sql.query(
    "select id from users where admin_ops_role(id)='Super Admin'order by id limit 1",
  );
  const results = {
    published: 0,
    expired: 0,
    escalated: 0,
    reconciled: 0,
    released: 0,
    failed: 0,
  };
  const [published] = await sql.query(
    "with changed as(update cms_documents set status='published',updated_at=now(),version=version+1 where status='scheduled'and publish_at<=now()returning id,kind,title,version),events as(insert into admin_case_events(resource_type,resource_id,event_type,message)select case when kind='post'then 'blog'else 'cms'end,id,'scheduled_publish','Scheduled content published'from changed returning id),audited as(select admin_ops_audit(null,case when kind='post'then 'blog'else 'cms'end,id,'scheduled_publish','{\"status\":\"scheduled\"}',jsonb_build_object('status','published','version',version),'Scheduled publication timestamp reached',null,'{\"actorType\":\"maintenance_job\"}')from changed)select count(*)::int as count from changed cross join(select count(*)from audited)guard",
  );
  results.published = Number(published.count);
  const [expired] = await sql.query(
    "with changed as(update verification_requests set status='expired',updated_at=now(),version=version+1 where status='approved'and expires_at<=now()returning id,user_id),events as(insert into admin_case_events(resource_type,resource_id,event_type,message)select 'verification',id,'expired','Verification validity period ended'from changed returning id),audited as(select admin_ops_audit(null,'verification',id,'expired','{\"status\":\"approved\"}','{\"status\":\"expired\"}','Verification validity period ended',null,'{\"actorType\":\"maintenance_job\"}')from changed)select count(*)::int as count from changed cross join(select count(*)from audited)guard",
  );
  results.expired = Number(expired.count);
  await sql.query(
    "update users u set is_verified=false,updated_at=now()where is_verified and exists(select 1 from verification_requests v where v.user_id=u.id)and exists(select 1 from jsonb_array_elements_text(coalesce((select value->'requiredTypes'from platform_settings where section='verification'),'[\"identity\"]'))required(type)where not exists(select 1 from verification_requests v where v.user_id=u.id and v.verification_type=required.type and v.status='approved'and(v.expires_at is null or v.expires_at>now())))",
  );
  for (const [table, area] of [
    ["support_tickets", "support"],
    ["platform_reports", "reports"],
    ["admin_dispute_cases", "disputes"],
  ]) {
    const [updated] = await sql.query(
      `with prior as(select * from ${table} where status not in('resolved','closed','dismissed','escalated')and updated_at<now()-$1::integer*interval '1 day'for update),changed as(update ${table} target set status='escalated',updated_at=now()from prior where target.${area === "disputes" ? "exchange_id" : "id"}=prior.${area === "disputes" ? "exchange_id" : "id"} returning target.${area === "disputes" ? "exchange_id" : "id"} as id,prior.status as previous),events as(insert into admin_case_events(resource_type,resource_id,event_type,message)select $2,id,'auto_escalated','Case exceeded the configured response window'from changed returning id),audited as(select admin_ops_audit(null,$2,id,'auto_escalated',jsonb_build_object('status',previous),'{"status":"escalated"}','Configured response window exceeded',null,'{"actorType":"maintenance_job"}')from changed)select count(*)::int as count from changed cross join(select count(*)from audited)guard`,
      [Number(policies["trust-safety"]?.escalationDays || 7), area],
    );
    results.escalated += Number(updated.count);
  }
  const pending = await sql.query(
    "select o.id,o.user_id,o.provider_id,o.transaction_id,o.amount,b.currency from admin_billing_operations o join billing_events b on b.id=o.transaction_id and b.user_id=o.user_id where o.operation_type='refund'and o.state in('submitted','needs_reconciliation')and o.provider_id is not null order by o.created_at limit 50",
  );
  for (const operation of pending) {
    try {
      const response = (await paystack(
        "/refund/" + encodeURIComponent(String(operation.provider_id)),
      )) as Record<string, unknown>;
      if (
        String(response.id) !== String(operation.provider_id) ||
        Number(response.amount) !== Number(operation.amount) ||
        response.currency !== operation.currency
      )
        throw new Error("Provider refund does not match the recorded intent");
      if (response.status === "processed") {
        await sql.query(
          "with changed as(update admin_billing_operations set state='completed',result=$2::jsonb,updated_at=now()where id=$1 and state in('submitted','needs_reconciliation')returning *),event as(insert into billing_events(id,user_id,provider,event_type,description,amount,currency)select 'refund-'||id,user_id,'paystack','refund','Provider-confirmed refund',-amount,$3 from changed on conflict do nothing returning id)select admin_ops_audit(null,'subscriptions',user_id,'refund_confirmed',null,$2::jsonb,'Refund confirmed by provider reconciliation',null,'{\"actorType\":\"maintenance_job\"}')from changed",
          [
            operation.id,
            JSON.stringify({
              status: response.status,
              id: response.id,
              amount: response.amount,
              currency: response.currency,
            }),
            response.currency,
          ],
        );
        results.reconciled++;
      } else if (response.status === "failed")
        await sql.query(
          "with changed as(update admin_billing_operations set state='rejected',updated_at=now()where id=$1 and state in('submitted','needs_reconciliation')returning *)select admin_ops_audit(null,'subscriptions',user_id,'refund_failed',null,'{\"state\":\"rejected\"}','Provider reported a failed refund',null,'{\"actorType\":\"maintenance_job\"}')from changed",
          [operation.id],
        );
    } catch {
      results.failed++;
    }
  }
  if (policies.escrow?.autoRelease === true && superAdmin) {
    const eligible = await sql.query(
      "select e.id from exchanges e join escrows s on s.exchange_id=e.id where e.status='in_review'and e.reveal_at<now()-$1::integer*interval '1 day'and e.admin_hold is null and s.admin_hold is null and s.status<>'disputed'and(select count(*)from exchange_review_decisions d where d.exchange_id=e.id and d.review_round=e.review_round and d.decision='accept'and d.revealed_at is not null and(e.is_mutual or d.reviewer_id=e.requester_id))>=(case when e.is_mutual then 2 else 1 end)limit 50",
      [Number(policies.escrow.reviewDays || 7)],
    );
    for (const exchange of eligible)
      try {
        await sql.query(
          "select admin_ops_mutate($1,'escrow',(select id from escrows where exchange_id=$2),'release','{\"confirmed\":true}','Automatic release after accepted reviews and the platform review period',$3,'{\"actorType\":\"maintenance_job\"}')",
          [superAdmin.id, exchange.id, crypto.randomUUID()],
        );
        results.released++;
      } catch {
        results.failed++;
      }
  }
  await sql.query(
    "with flagged as(update marketplace_requests r set admin_flag='Automated report threshold reached'where admin_flag is null and(select count(*)from platform_reports p where p.resource_type='marketplace'and p.resource_id=r.id and p.status in('open','under_review','escalated'))>=$1 returning id)select admin_ops_audit(null,'marketplace',id,'auto_flag',jsonb_build_object('flag',null),jsonb_build_object('flag','Automated report threshold reached'),'Reporting threshold reached',null,'{\"actorType\":\"maintenance_job\"}')from flagged",
    [Number(policies["trust-safety"]?.flagThreshold || 3)],
  );
  await sql.query("delete from cms_view_events where day<current_date-31");
  await sql.query(
    "update users u set payload=payload||'{\"subscriptionTier\":\"free\"}'where exists(select 1 from billing_accounts b where b.user_id=u.id and b.subscription_status='attention'and b.past_due_since<=now()-$1::integer*interval '1 day')",
    [Number(policies.billing?.failedPaymentGraceDays ?? 7)],
  );
  return results;
}
