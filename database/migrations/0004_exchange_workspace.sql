create table if not exists exchange_milestones (
  id text primary key,
  exchange_id text not null references exchanges(id) on delete cascade,
  created_by text references users(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending','in_progress','completed')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exchange_milestones_exchange_idx
  on exchange_milestones (exchange_id, position, created_at);

create table if not exists exchange_notes (
  exchange_id text not null references exchanges(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (exchange_id, user_id)
);

create or replace function cancel_exchange_before_work(
  p_actor_id text,
  p_exchange_id text,
  p_requester_refund_id text,
  p_provider_refund_id text,
  p_activity_id text,
  p_requester_notification_id text,
  p_provider_notification_id text,
  p_reason text,
  p_now timestamptz
) returns text language plpgsql as $$
declare
  v_exchange exchanges%rowtype;
  v_requester users%rowtype;
  v_provider users%rowtype;
begin
  select * into v_exchange from exchanges where id=p_exchange_id for update;
  if not found then raise exception 'Exchange not found'; end if;
  if p_actor_id not in (v_exchange.requester_id, v_exchange.provider_id) then raise exception 'Unauthorized'; end if;
  if v_exchange.status <> 'in_progress' then raise exception 'This exchange can no longer be cancelled'; end if;
  if exists(select 1 from exchange_deliveries where exchange_id=p_exchange_id) then raise exception 'Work has already been submitted. Open a dispute if you need help.'; end if;

  perform id from users where id in (v_exchange.requester_id,v_exchange.provider_id) order by id for update;
  select * into v_requester from users where id=v_exchange.requester_id;
  select * into v_provider from users where id=v_exchange.provider_id;
  if v_requester.id is null or v_provider.id is null then raise exception 'Exchange participant not found'; end if;

  update users set skill_hours=skill_hours+v_exchange.requester_escrow_hours,updated_at=p_now,
    payload=payload || jsonb_build_object('skillHours',skill_hours+v_exchange.requester_escrow_hours,'updatedAt',p_now)
    where id=v_exchange.requester_id;
  insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
    values (p_requester_refund_id,'transactions',v_exchange.requester_id,p_exchange_id,v_exchange.provider_id,'Refunded','Completed',v_exchange.requester_escrow_hours,v_requester.skill_hours,v_requester.skill_hours+v_exchange.requester_escrow_hours,'Refund for: '||v_exchange.title,p_reason,p_now,
      jsonb_build_object('userId',v_exchange.requester_id,'date',p_now,'type','Refunded','description','Refund for: '||v_exchange.title,'exchangeId',p_exchange_id,'amount',v_exchange.requester_escrow_hours,'balanceBefore',v_requester.skill_hours,'balanceAfter',v_requester.skill_hours+v_exchange.requester_escrow_hours,'status','Completed','linkedUserId',v_exchange.provider_id,'notes',p_reason));

  if v_exchange.provider_escrow_hours > 0 then
    update users set skill_hours=skill_hours+v_exchange.provider_escrow_hours,updated_at=p_now,
      payload=payload || jsonb_build_object('skillHours',skill_hours+v_exchange.provider_escrow_hours,'updatedAt',p_now)
      where id=v_exchange.provider_id;
    insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
      values (p_provider_refund_id,'transactions',v_exchange.provider_id,p_exchange_id,v_exchange.requester_id,'Refunded','Completed',v_exchange.provider_escrow_hours,v_provider.skill_hours,v_provider.skill_hours+v_exchange.provider_escrow_hours,'Refund for: '||v_exchange.title,p_reason,p_now,
        jsonb_build_object('userId',v_exchange.provider_id,'date',p_now,'type','Refunded','description','Refund for: '||v_exchange.title,'exchangeId',p_exchange_id,'amount',v_exchange.provider_escrow_hours,'balanceBefore',v_provider.skill_hours,'balanceAfter',v_provider.skill_hours+v_exchange.provider_escrow_hours,'status','Completed','linkedUserId',v_exchange.requester_id,'notes',p_reason));
  end if;

  update ledger_entries set entry_status='Cancelled',notes=coalesce(notes,'')||' Cancelled: '||p_reason,
    payload=payload || jsonb_build_object('status','Cancelled','cancellationReason',p_reason)
    where exchange_id=p_exchange_id and entry_type='Reserved' and entry_status='Active';
  update exchanges set status='cancelled',completed_at=p_now,updated_at=p_now,
    payload=payload || jsonb_build_object('status','cancelled','escrowStatus','refunded','cancellationReason',p_reason,'cancelledBy',p_actor_id,'cancelledAt',p_now,'updatedAt',p_now)
    where id=p_exchange_id;
  update escrows set status='refunded',updated_at=p_now,
    payload=payload || jsonb_build_object('status','refunded','cancellationReason',p_reason,'updatedAt',p_now)
    where exchange_id=p_exchange_id;
  update marketplace_requests set status='open',updated_at=p_now,payload=payload || jsonb_build_object('status','open','updatedAt',p_now)
    where id=v_exchange.marketplace_request_id;
  update marketplace_applications set status='rejected',updated_at=p_now,payload=payload || jsonb_build_object('status','rejected','updatedAt',p_now)
    where id=v_exchange.marketplace_application_id;
  insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload)
    values (p_activity_id,p_exchange_id,p_actor_id,'cancelled','Exchange cancelled before work began. Skill Hours were refunded. Reason: '||p_reason,p_now,
      jsonb_build_object('type','cancelled','description','Exchange cancelled before work began. Skill Hours were refunded.','reason',p_reason,'timestamp',p_now));
  insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
    values
      (p_requester_notification_id,'notifications/'||p_requester_notification_id,v_exchange.requester_id,'exchange_cancelled','Exchange Cancelled','The exchange "'||v_exchange.title||'" was cancelled and reserved Skill Hours were refunded.',false,false,'/exchanges/'||p_exchange_id,p_exchange_id,p_now,jsonb_build_object('type','exchange_cancelled','title','Exchange Cancelled','message','Reserved Skill Hours were refunded.','isRead',false,'link','/exchanges/'||p_exchange_id,'createdAt',p_now)),
      (p_provider_notification_id,'notifications/'||p_provider_notification_id,v_exchange.provider_id,'exchange_cancelled','Exchange Cancelled','The exchange "'||v_exchange.title||'" was cancelled and reserved Skill Hours were refunded.',false,false,'/exchanges/'||p_exchange_id,p_exchange_id,p_now,jsonb_build_object('type','exchange_cancelled','title','Exchange Cancelled','message','Reserved Skill Hours were refunded.','isRead',false,'link','/exchanges/'||p_exchange_id,'createdAt',p_now));
  return p_exchange_id;
end;
$$;

create or replace function submit_exchange_delivery(
  p_actor_id text,
  p_exchange_id text,
  p_delivery_id text,
  p_activity_id text,
  p_notification_id text,
  p_files jsonb,
  p_comments text,
  p_now timestamptz
) returns integer language plpgsql as $$
declare
  v_exchange exchanges%rowtype;
  v_version integer;
  v_status text;
  v_other_user_id text;
  v_actor_label text;
  v_provider_submitted boolean;
  v_requester_submitted boolean;
  v_delivery jsonb;
  v_participants jsonb;
begin
  select * into v_exchange from exchanges where id=p_exchange_id for update;
  if not found then raise exception 'Exchange not found'; end if;
  if p_actor_id<>v_exchange.requester_id and p_actor_id<>v_exchange.provider_id then raise exception 'You are not part of this exchange'; end if;
  if v_exchange.status not in ('in_progress','revision_requested') then raise exception 'Deliverables cannot be submitted in the current exchange state'; end if;
  if not v_exchange.is_mutual and p_actor_id<>v_exchange.provider_id then raise exception 'Only the provider can submit deliverables'; end if;

  select coalesce(max(version),0)+1 into v_version from exchange_deliveries where exchange_id=p_exchange_id;
  v_provider_submitted := coalesce(v_exchange.payload->>'providerSubmittedAt','')<>'' or p_actor_id=v_exchange.provider_id;
  v_requester_submitted := coalesce(v_exchange.payload->>'requesterSubmittedAt','')<>'' or p_actor_id=v_exchange.requester_id;
  v_status := case when not v_exchange.is_mutual or (v_provider_submitted and v_requester_submitted) then 'in_review' else v_exchange.status end;
  v_other_user_id := case when p_actor_id=v_exchange.provider_id then v_exchange.requester_id else v_exchange.provider_id end;
  v_actor_label := case when p_actor_id=v_exchange.provider_id then 'Provider' else 'Requester' end;
  v_delivery := jsonb_build_object('version',v_version,'files',p_files,'comments',p_comments,'submittedBy',p_actor_id,'uploadedAt',p_now);

  insert into exchange_deliveries (id,exchange_id,submitted_by,version,files,comments,submitted_at,payload)
    values (p_delivery_id,p_exchange_id,p_actor_id,v_version,p_files,p_comments,p_now,v_delivery);

  update exchanges set status=v_status,updated_at=p_now,
    payload=payload || jsonb_build_object(
      'status',v_status,
      'updatedAt',p_now,
      case when p_actor_id=provider_id then 'providerSubmittedAt' else 'requesterSubmittedAt' end,p_now
    )
    where id=p_exchange_id;

  select jsonb_set(participants,array[p_actor_id,'deliverablesStatus'],'"submitted"'::jsonb,true)
    into v_participants from escrows where exchange_id=p_exchange_id for update;
  if v_participants is not null then
    update escrows set participants=v_participants,updated_at=p_now,
      payload=jsonb_set(payload,'{participants}',v_participants,true) where exchange_id=p_exchange_id;
  end if;

  insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload)
    values (p_activity_id,p_exchange_id,p_actor_id,'files_uploaded',v_actor_label||' submitted deliverables (Version '||v_version||').',p_now,
      jsonb_build_object('type','files_uploaded','description',v_actor_label||' submitted deliverables (Version '||v_version||').','timestamp',p_now));

  insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
    values (p_notification_id,'users/'||v_other_user_id||'/notifications/'||p_notification_id,v_other_user_id,'file_uploaded','Work Submitted',
      'Deliverables have been submitted for '''||v_exchange.title||'''. Check your workspace.',false,false,'/exchanges/'||p_exchange_id||'/files',p_exchange_id,p_now,
      jsonb_build_object('type','file_uploaded','title','Work Submitted','message','Deliverables have been submitted. Check your workspace.','isRead',false,'link','/exchanges/'||p_exchange_id||'/files','createdAt',p_now));

  return v_version;
end;
$$;

create or replace function resolve_exchange_dispute(
  p_admin_id text,
  p_exchange_id text,
  p_provider_award integer,
  p_requester_award integer,
  p_notes text,
  p_provider_ledger_id text,
  p_requester_ledger_id text,
  p_activity_id text,
  p_provider_notification_id text,
  p_requester_notification_id text,
  p_now timestamptz
) returns text language plpgsql as $$
declare
  v_exchange exchanges%rowtype;
  v_provider users%rowtype;
  v_requester users%rowtype;
  v_provider_credit integer;
  v_requester_credit integer;
  v_outcome text;
  v_exchange_status text;
  v_escrow_status text;
  v_dispute jsonb;
begin
  if not exists(select 1 from users where id=p_admin_id and (role='Admin' or coalesce((payload->>'isAdmin')::boolean,false))) then raise exception 'Forbidden'; end if;
  if p_notes is null or length(trim(p_notes))<3 or length(p_notes)>5000 then raise exception 'Resolution notes are required'; end if;
  select * into v_exchange from exchanges where id=p_exchange_id for update;
  if not found then raise exception 'Exchange not found'; end if;
  if v_exchange.status<>'disputed' then raise exception 'Exchange is not under dispute'; end if;
  if p_provider_award<0 or p_provider_award>v_exchange.requester_escrow_hours or p_requester_award<0 or p_requester_award>v_exchange.provider_escrow_hours then raise exception 'Resolution exceeds the held Skill Hours'; end if;
  if not exists(select 1 from escrows where exchange_id=p_exchange_id and status='disputed' for update) then raise exception 'Disputed escrow not found'; end if;

  perform id from users where id in (v_exchange.requester_id,v_exchange.provider_id) order by id for update;
  select * into v_provider from users where id=v_exchange.provider_id;
  select * into v_requester from users where id=v_exchange.requester_id;
  if v_provider.id is null or v_requester.id is null then raise exception 'Exchange participant not found'; end if;

  v_provider_credit := p_provider_award + (v_exchange.provider_escrow_hours-p_requester_award);
  v_requester_credit := p_requester_award + (v_exchange.requester_escrow_hours-p_provider_award);
  v_outcome := case
    when p_provider_award=v_exchange.requester_escrow_hours and p_requester_award=v_exchange.provider_escrow_hours then 'released'
    when p_provider_award=0 and p_requester_award=0 then 'refunded'
    else 'partial'
  end;
  v_exchange_status := case when v_outcome='refunded' then 'cancelled' else 'completed' end;
  v_escrow_status := case when v_outcome='refunded' then 'refunded' else 'released' end;

  update users set skill_hours=skill_hours+v_provider_credit,updated_at=p_now,
    payload=payload || jsonb_build_object('skillHours',skill_hours+v_provider_credit,'updatedAt',p_now)
    where id=v_exchange.provider_id;
  update users set skill_hours=skill_hours+v_requester_credit,updated_at=p_now,
    payload=payload || jsonb_build_object('skillHours',skill_hours+v_requester_credit,'updatedAt',p_now)
    where id=v_exchange.requester_id;

  if v_provider_credit>0 then
    insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
      values (p_provider_ledger_id,'dispute_resolution',v_exchange.provider_id,p_exchange_id,v_exchange.requester_id,'Dispute Resolution','Completed',v_provider_credit,v_provider.skill_hours,v_provider.skill_hours+v_provider_credit,'Dispute resolution for: '||v_exchange.title,trim(p_notes),p_now,
        jsonb_build_object('userId',v_exchange.provider_id,'exchangeId',p_exchange_id,'amount',v_provider_credit,'awardedHours',p_provider_award,'refundedHours',v_exchange.provider_escrow_hours-p_requester_award,'type','Dispute Resolution','status','Completed','notes',trim(p_notes),'date',p_now));
  end if;
  if v_requester_credit>0 then
    insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
      values (p_requester_ledger_id,'dispute_resolution',v_exchange.requester_id,p_exchange_id,v_exchange.provider_id,'Dispute Resolution','Completed',v_requester_credit,v_requester.skill_hours,v_requester.skill_hours+v_requester_credit,'Dispute resolution for: '||v_exchange.title,trim(p_notes),p_now,
        jsonb_build_object('userId',v_exchange.requester_id,'exchangeId',p_exchange_id,'amount',v_requester_credit,'awardedHours',p_requester_award,'refundedHours',v_exchange.requester_escrow_hours-p_provider_award,'type','Dispute Resolution','status','Completed','notes',trim(p_notes),'date',p_now));
  end if;
  update ledger_entries set entry_status='Completed',payload=payload || jsonb_build_object('status','Completed','resolvedAt',p_now)
    where exchange_id=p_exchange_id and entry_type='Reserved' and entry_status='Active';

  v_dispute := coalesce(v_exchange.payload->'dispute','{}'::jsonb) || jsonb_build_object('status','resolved','outcome',v_outcome,'providerAward',p_provider_award,'requesterAward',p_requester_award,'resolutionNotes',trim(p_notes),'resolvedBy',p_admin_id,'resolvedAt',p_now);
  update exchanges set status=v_exchange_status,completed_at=case when v_exchange_status='completed' then p_now else completed_at end,updated_at=p_now,
    payload=payload || jsonb_build_object('status',v_exchange_status,'escrowStatus',v_escrow_status,'dispute',v_dispute,'completedAt',case when v_exchange_status='completed' then to_jsonb(p_now) else payload->'completedAt' end,'updatedAt',p_now)
    where id=p_exchange_id;
  update escrows set status=v_escrow_status,dispute=v_dispute,updated_at=p_now,
    payload=payload || jsonb_build_object('status',v_escrow_status,'dispute',v_dispute,'updatedAt',p_now)
    where exchange_id=p_exchange_id;
  update marketplace_requests set status=case when v_exchange_status='completed' then 'completed' else 'cancelled' end,updated_at=p_now,
    payload=payload || jsonb_build_object('status',case when v_exchange_status='completed' then 'completed' else 'cancelled' end,'updatedAt',p_now)
    where id=v_exchange.marketplace_request_id;

  insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload)
    values (p_activity_id,p_exchange_id,p_admin_id,'dispute_resolved','Dispute resolved: '||v_outcome||'.',p_now,jsonb_build_object('type','dispute_resolved','description','Dispute resolved: '||v_outcome||'.','timestamp',p_now));
  insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
    values
      (p_provider_notification_id,'users/'||v_exchange.provider_id||'/notifications/'||p_provider_notification_id,v_exchange.provider_id,'dispute_resolved','Dispute Resolved','The dispute for "'||v_exchange.title||'" was resolved ('||v_outcome||').',false,false,'/exchanges/'||p_exchange_id,p_exchange_id,p_now,jsonb_build_object('type','dispute_resolved','title','Dispute Resolved','message','Your dispute was resolved.','isRead',false,'link','/exchanges/'||p_exchange_id,'createdAt',p_now)),
      (p_requester_notification_id,'users/'||v_exchange.requester_id||'/notifications/'||p_requester_notification_id,v_exchange.requester_id,'dispute_resolved','Dispute Resolved','The dispute for "'||v_exchange.title||'" was resolved ('||v_outcome||').',false,false,'/exchanges/'||p_exchange_id,p_exchange_id,p_now,jsonb_build_object('type','dispute_resolved','title','Dispute Resolved','message','Your dispute was resolved.','isRead',false,'link','/exchanges/'||p_exchange_id,'createdAt',p_now));

  return v_outcome;
end;
$$;
