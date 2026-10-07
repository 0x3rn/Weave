-- Shared operations, explicit staff permissions, private cases, and append-only audits.
create table if not exists admin_roles(name text primary key,permissions jsonb not null);
insert into admin_roles(name,permissions) values
 ('Super Admin','["*"]'),
 ('Operations Admin','["verification.read","verification.write","verification.sensitive","marketplace.read","marketplace.write","exchanges.read","exchanges.write","exchanges.messages","escrow.read","escrow.settle","disputes.read","disputes.write","reports.read","reports.write","audit.read"]'),
 ('Support Admin','["support.read","support.write","reports.read","reports.write","verification.read","exchanges.read","disputes.read","audit.read"]'),
 ('Finance Admin','["subscriptions.read","subscriptions.provider","escrow.read","escrow.settle","ledger.read","ledger.adjust","analytics.read","audit.read"]'),
 ('Content Admin','["cms.read","cms.write","blog.read","blog.write","announcements.read","announcements.write"]'),
 ('Analyst','["analytics.read","marketplace.read","exchanges.read","escrow.read","ledger.read","subscriptions.read","reports.read","disputes.read","audit.read"]')
 on conflict(name) do nothing;
create table if not exists admin_staff_roles(user_id text primary key references users(id),role_name text not null references admin_roles(name),enabled boolean not null default true,assigned_by text references users(id),updated_at timestamptz not null default now());
create table if not exists platform_settings(section text primary key,value jsonb not null default '{}',updated_by text references users(id),updated_at timestamptz not null default now());
insert into platform_settings(section,value) values
 ('general','{"platformName":"Weave","contactEmail":"","supportEmail":"","timeZone":"UTC","currency":"USD","maintenance":false}'),
 ('verification','{"requiredTypes":["identity"],"validityDays":365,"documentsRequired":true}'),
 ('marketplace','{"approvalRequired":false,"expirationDays":30,"applicationLimit":100,"featuredEnabled":true}'),
 ('exchanges','{"minHours":1,"maxHours":10000,"maxDurationDays":365,"revisionLimit":2,"oneWayEnabled":true,"mutualEnabled":true}'),
 ('escrow','{"feePercent":0,"securityDepositEnabled":false,"reviewDays":7,"disputeDays":14,"autoRelease":false}'),
 ('skill-hours','{"manualAdjustmentsEnabled":true,"adjustmentLimit":10000}'),
 ('trust-safety','{"flagThreshold":3,"escalationDays":7,"messageInspection":false}'),
 ('notifications','{"reminderDays":1,"digestHour":8,"emailTemplate":"{{title}}\n\n{{message}}\n\n{{url}}"}'),
 ('billing','{"invoicePrefix":"WEAVE","refundWindowDays":30,"failedPaymentGraceDays":7}'),
 ('cms','{"announcement":"","contactInformation":"","socialLinks":[],"legalLinks":[]}'),
 ('security','{"adminSessionHours":24,"requireAdminMfa":false}')
 on conflict(section) do nothing;
alter table admin_audit_events add column if not exists resource_type text;
alter table admin_audit_events add column if not exists before_state jsonb;
alter table admin_audit_events add column if not exists after_state jsonb;
alter table admin_audit_events add column if not exists reason text;
alter table admin_audit_events add column if not exists request_context jsonb not null default '{}';
create index if not exists admin_audit_resource_idx on admin_audit_events(resource_type,resource_id,occurred_at desc);
create table if not exists admin_operation_receipts(actor_id text references users(id),operation_id text,request_hash text not null,result jsonb not null,created_at timestamptz not null default now(),primary key(actor_id,operation_id));
create table if not exists verification_requests(id text primary key,user_id text not null references users(id),verification_type text not null,status text not null default 'pending' check(status in('pending','under_review','needs_information','approved','rejected','expired','flagged','suspended')),statement text not null,documents jsonb not null default '[]',reviewer_id text references users(id),risk_flag text,reason text,submitted_at timestamptz not null default now(),updated_at timestamptz not null default now(),expires_at timestamptz,version integer not null default 1);
create unique index if not exists verification_one_open_idx on verification_requests(user_id,verification_type) where status in('pending','under_review','needs_information','flagged');
create index if not exists verification_review_idx on verification_requests(status,submitted_at desc,id);
create table if not exists admin_case_events(id bigserial primary key,resource_type text not null,resource_id text not null,actor_id text references users(id),event_type text not null,message text not null,is_internal boolean not null default false,attachments jsonb not null default '[]',created_at timestamptz not null default now());
create index if not exists admin_case_events_resource_idx on admin_case_events(resource_type,resource_id,created_at,id);
create table if not exists platform_reports(id text primary key,reporter_id text references users(id),resource_type text not null,resource_id text not null,reported_user_id text references users(id),category text not null,description text not null,evidence jsonb not null default '[]',priority text not null default 'normal',status text not null default 'open',assigned_to text references users(id),resolution text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),source_key text unique);
insert into platform_reports(id,reporter_id,resource_type,resource_id,reported_user_id,category,description,status,created_at,source_key)
 select 'message-'||r.id,r.reporter_id,'message',r.message_id,m.sender_id,'message',r.reason,r.status,r.created_at,'message/'||r.id from message_reports r join messages m on m.id=r.message_id where not exists(select 1 from platform_reports p where p.source_key='message/'||r.id) on conflict(source_key) do nothing;
create table if not exists admin_dispute_cases(exchange_id text primary key references exchanges(id),status text not null default 'new',priority text not null default 'high',assigned_to text references users(id),reason text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
insert into admin_dispute_cases(exchange_id,status,reason,created_at)
 select e.id,case when e.status='disputed' then 'new' else 'resolved' end,coalesce(s.dispute->>'reason',e.payload->'dispute'->>'reason','Other'),coalesce(s.updated_at,e.updated_at,now()) from exchanges e join escrows s on s.exchange_id=e.id where s.dispute is not null and s.dispute<>'{}'::jsonb on conflict(exchange_id) do nothing;
create table if not exists support_tickets(id text primary key,user_id text not null references users(id),subject text not null,category text not null,priority text not null default 'normal',status text not null default 'open',assigned_to text references users(id),related_type text,related_id text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index if not exists support_inbox_idx on support_tickets(status,updated_at desc,id);
create table if not exists cms_documents(id text primary key,kind text not null check(kind in('page','post','faq','navigation','global')),title text not null,slug text not null,status text not null default 'draft' check(status in('draft','published','scheduled','archived')),content text not null default '',excerpt text not null default '',seo_title text not null default '',seo_description text not null default '',featured_image text,og_image text,canonical_url text,author_id text references users(id),category text not null default '',tags text[] not null default '{}',publish_at timestamptz,sort_order integer not null default 0,placement text,links jsonb not null default '[]',views bigint not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),version integer not null default 1,unique(kind,slug));
create index if not exists cms_published_idx on cms_documents(kind,status,publish_at desc,id);
create table if not exists cms_taxonomy(id text primary key,kind text not null check(kind in('category','author')),name text not null,slug text not null,bio text not null default '',user_id text references users(id),unique(kind,slug));
insert into cms_taxonomy(id,kind,name,slug)values('category-updates','category','Weave Updates','weave-updates'),('category-community','category','Community','community'),('category-guides','category','Guides','guides'),('category-safety','category','Trust & Safety','trust-safety') on conflict do nothing;
create table if not exists admin_billing_operations(id text primary key,actor_id text references users(id),user_id text references users(id),operation_type text not null,reason text not null,amount integer,transaction_id text,state text not null default 'pending',provider_id text,result jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table billing_accounts add column if not exists billing_interval text;
alter table billing_accounts add column if not exists past_due_since timestamptz;
create table if not exists platform_plans(id text primary key,name text not null,provider_plan_code text,features jsonb not null default '[]',enabled boolean not null default true,updated_at timestamptz not null default now());
alter table platform_plans add column if not exists amount integer;
alter table platform_plans add column if not exists currency text;
alter table platform_plans add column if not exists billing_interval text;
insert into platform_plans(id,name,features)values('verified','Verified','["Verified badge","Verified marketplace access"]') on conflict do nothing;
alter table marketplace_requests add column if not exists admin_flag text;
alter table marketplace_requests add column if not exists admin_previous_status text;
alter table marketplace_requests add column if not exists is_featured boolean not null default false;
alter table exchanges add column if not exists admin_hold text;
alter table escrows add column if not exists admin_hold text;

create or replace function admin_ops_role(p_actor text) returns text language sql stable as $$
 select case when s.user_id is not null then case when s.enabled then s.role_name end
 when coalesce(u.role,case when u.payload->'isAdmin'='true'::jsonb then 'Admin' else 'Member' end)='Admin' then 'Super Admin' end
 from users u left join admin_staff_roles s on s.user_id=u.id where u.id=p_actor and coalesce(u.account_status,'active')='active';
$$;
create or replace function admin_ops_can(p_actor text,p_permission text) returns boolean language sql stable as $$
 select coalesce((select permissions ? '*' or permissions ? p_permission from admin_roles where name=admin_ops_role(p_actor)),false);
$$;
create or replace function admin_ops_assert(p_actor text,p_permission text) returns void language plpgsql as $$
begin if not admin_ops_can(p_actor,p_permission) then raise exception 'Forbidden'; end if; end $$;
-- Legacy pages retain their existing workflows, limited to administrators with full legacy management rights.
create or replace function assert_platform_admin(p_actor text) returns void language plpgsql as $$
begin perform admin_ops_assert(p_actor,'legacy.manage'); end $$;
create or replace function admin_ops_audit(p_actor text,p_type text,p_id text,p_action text,p_before jsonb,p_after jsonb,p_reason text,p_operation text,p_context jsonb) returns void language plpgsql as $$
begin
 insert into admin_audit_events(actor_id,event_type,resource_id,description,resource_type,before_state,after_state,reason,operation_id,request_context)
 values(p_actor,'ops_'||p_type||'_'||p_action,p_id,initcap(replace(p_action,'_',' '))||' '||replace(p_type,'_',' '),p_type,
 p_before-'documents'-'statement'-'evidence'-'description'-'content'-'payment_method'-'payload'-'notes',
 p_after-'documents'-'statement'-'evidence'-'description'-'content'-'payment_method'-'payload'-'notes',
 case when p_action in('note','reply') then 'Private case entry recorded' else p_reason end,p_operation,coalesce(p_context,'{}'));
end $$;

-- Claim the provider intent before an external mutation. Uncertain intents block a second charge/refund.
create or replace function admin_ops_claim_billing(p_actor text,p_operation text,p_user text,p_action text,p_reason text,p_amount integer,p_transaction text,p_context jsonb) returns jsonb language plpgsql as $$
declare previous admin_billing_operations; paid integer; reserved integer;
begin
 perform admin_ops_assert(p_actor,'subscriptions.provider');
 perform pg_advisory_xact_lock(hashtext('billing/'||p_user));
 select * into previous from admin_billing_operations where id=p_operation;
 if found then
  if previous.actor_id<>p_actor or previous.user_id<>p_user or previous.operation_type<>p_action or previous.reason<>p_reason or previous.amount is distinct from p_amount or previous.transaction_id is distinct from p_transaction then raise exception 'Operation identifier reused'; end if;
  return jsonb_build_object('duplicate',true,'state',previous.state);
 end if;
 if exists(select 1 from admin_billing_operations where user_id=p_user and state in('pending','needs_reconciliation')) then raise exception 'A provider operation needs reconciliation before further changes'; end if;
 if p_action='refund' then
  select amount into paid from billing_events where user_id=p_user and id=p_transaction and event_type='payment';
  select coalesce(sum(amount),0) into reserved from admin_billing_operations where user_id=p_user and transaction_id=p_transaction and operation_type='refund' and state not in('failed','rejected');
  if paid is null or p_amount is null or p_amount<=0 or p_amount>paid-reserved then raise exception 'Refund exceeds remaining recorded payment'; end if;
 end if;
 insert into admin_billing_operations(id,actor_id,user_id,operation_type,reason,amount,transaction_id) values(p_operation,p_actor,p_user,p_action,p_reason,p_amount,p_transaction);
 perform admin_ops_audit(p_actor,'subscriptions',p_user,'provider_intent',null,jsonb_build_object('action',p_action,'amount',p_amount,'transaction',p_transaction),p_reason,p_operation,p_context);
 return '{"duplicate":false}'::jsonb;
end $$;

create table if not exists admin_alert_reads(user_id text references users(id),alert_id text,read_at timestamptz not null default now(),primary key(user_id,alert_id));
create table if not exists cms_view_events(document_id text references cms_documents(id)on delete cascade,visitor_hash text,day date not null default current_date,primary key(document_id,visitor_hash,day));
create unique index if not exists report_one_open_idx on platform_reports(reporter_id,resource_type,resource_id) where status in('open','under_review','escalated') and source_key is null;
create index if not exists reports_inbox_idx on platform_reports(status,created_at desc);

create or replace function admin_member_policy_guard() returns trigger language plpgsql as $$
declare policy jsonb; total integer;
begin
 if current_setting('weave.admin_operation',true)='on' then return new; end if;
 if tg_table_name in('marketplace_requests','marketplace_applications','exchanges') and coalesce((select (value->>'maintenance')::boolean from platform_settings where section='general'),false) then raise exception 'Weave is temporarily in maintenance mode'; end if;
 if tg_table_name='marketplace_requests' then
  select value into policy from platform_settings where section='marketplace';
  if coalesce(new.status,'open')='open' and coalesce((policy->>'approvalRequired')::boolean,false) then new.status:='pending_review'; new.payload:=new.payload||'{"status":"pending_review"}'; end if;
  new.expires_at:=least(new.expires_at,coalesce(new.created_at,now())+coalesce((policy->>'expirationDays')::integer,30)*interval '1 day');
 elsif tg_table_name='marketplace_applications' then
  perform id from marketplace_requests where id=new.request_id for update;
  if exists(select 1 from marketplace_requests where id=new.request_id and expires_at<=now())then raise exception 'Request has expired';end if;
  if not exists(select 1 from marketplace_requests where id=new.request_id and status='open' and (expires_at is null or expires_at>now())) then raise exception 'Request is unavailable for applications'; end if;
  select count(*) into total from marketplace_applications where request_id=new.request_id;
  if total>=coalesce((select (value->>'applicationLimit')::integer from platform_settings where section='marketplace'),100) then raise exception 'This request reached its application limit'; end if;
 elsif tg_table_name='exchanges' then
  select value into policy from platform_settings where section='exchanges';
  if new.status not in('completed','cancelled')and(new.skill_hours<coalesce((policy->>'minHours')::integer,1) or new.skill_hours>coalesce((policy->>'maxHours')::integer,10000)) then raise exception 'Skill Hours are outside platform limits'; end if;
  if (new.is_mutual and not coalesce((policy->>'mutualEnabled')::boolean,true)) or (not new.is_mutual and not coalesce((policy->>'oneWayEnabled')::boolean,true)) then raise exception 'This exchange type is disabled'; end if;
  if new.deadline_at>now()+coalesce((policy->>'maxDurationDays')::integer,365)*interval '1 day' then raise exception 'Exchange deadline exceeds platform limits'; end if;
 elsif tg_table_name in('support_tickets','platform_reports','verification_requests') then
  perform pg_advisory_xact_lock(hashtext('intake/'||coalesce(to_jsonb(new)->>'user_id',to_jsonb(new)->>'reporter_id')));
  if tg_table_name='support_tickets' then select count(*) into total from support_tickets where user_id=new.user_id and created_at>now()-interval '1 day';
  elsif tg_table_name='verification_requests' then select count(*) into total from verification_requests where user_id=new.user_id and submitted_at>now()-interval '1 day';
  else select count(*) into total from platform_reports where reporter_id=new.reporter_id and created_at>now()-interval '1 day'; end if;
  if total>=10 then raise exception 'Daily submission limit reached'; end if;
 end if;
 return new;
end $$;
drop trigger if exists marketplace_platform_policy on marketplace_requests;
create trigger marketplace_platform_policy before insert on marketplace_requests for each row execute function admin_member_policy_guard();
drop trigger if exists application_platform_policy on marketplace_applications;
create trigger application_platform_policy before insert on marketplace_applications for each row execute function admin_member_policy_guard();
drop trigger if exists exchange_platform_policy on exchanges;
create trigger exchange_platform_policy before insert on exchanges for each row execute function admin_member_policy_guard();
drop trigger if exists contract_platform_policy on exchange_contracts;
drop trigger if exists support_submission_limit on support_tickets;
create trigger support_submission_limit before insert on support_tickets for each row execute function admin_member_policy_guard();
drop trigger if exists report_submission_limit on platform_reports;
create trigger report_submission_limit before insert on platform_reports for each row execute function admin_member_policy_guard();
drop trigger if exists verification_submission_limit on verification_requests;
create trigger verification_submission_limit before insert on verification_requests for each row execute function admin_member_policy_guard();
create or replace function preserve_admin_audit() returns trigger language plpgsql as $$
begin raise exception 'Audit records are append-only'; end $$;
drop trigger if exists admin_audit_immutable on admin_audit_events;
create trigger admin_audit_immutable before update or delete on admin_audit_events for each row execute function preserve_admin_audit();

-- Member workflows cannot modify a frozen/paused exchange or settle a held escrow.
create or replace function guard_admin_exchange_hold() returns trigger language plpgsql as $$
declare eid text; held text;
begin
 if current_setting('weave.admin_operation',true)='on' then return new; end if;
 if tg_table_name='exchanges' then
  if old.admin_hold is not null and (new.status is distinct from old.status or new.review_round is distinct from old.review_round or new.deadline_at is distinct from old.deadline_at or new.admin_hold is distinct from old.admin_hold) then raise exception 'This exchange is on an administrative hold'; end if;
 else
  eid:=case when tg_table_name='escrows' then new.exchange_id else new.exchange_id end;
  select admin_hold into held from exchanges where id=eid for share;
  if held is not null then raise exception 'This exchange is on an administrative hold'; end if;
  if tg_table_name='escrows' then
   if old.admin_hold is not null and new.status is distinct from old.status then raise exception 'Escrow settlement is frozen'; end if;
  end if;
 end if;
 return new;
end $$;
drop trigger if exists exchange_admin_hold_guard on exchanges;
create trigger exchange_admin_hold_guard before update on exchanges for each row execute function guard_admin_exchange_hold();
drop trigger if exists escrow_admin_hold_guard on escrows;
create trigger escrow_admin_hold_guard before update on escrows for each row execute function guard_admin_exchange_hold();
drop trigger if exists delivery_admin_hold_guard on exchange_deliveries;
create trigger delivery_admin_hold_guard before insert or update on exchange_deliveries for each row execute function guard_admin_exchange_hold();
drop trigger if exists review_admin_hold_guard on exchange_review_decisions;
create trigger review_admin_hold_guard before insert on exchange_review_decisions for each row execute function guard_admin_exchange_hold();

-- Keep member-submitted message reports and disputes in the shared operations inbox.
create or replace function sync_admin_operational_cases() returns trigger language plpgsql as $$
begin
 if tg_table_name='message_reports' then
  insert into platform_reports(id,reporter_id,resource_type,resource_id,reported_user_id,category,description,status,created_at,source_key)
  values('message-'||new.id,new.reporter_id,'message',new.message_id,(select sender_id from messages where id=new.message_id),'message',new.reason,new.status,new.created_at,'message/'||new.id) on conflict(source_key) do update set status=excluded.status,updated_at=now();
 elsif new.status='disputed' then
  insert into admin_dispute_cases(exchange_id,reason)values(new.id,coalesce(new.payload->'dispute'->>'reason','Other'))on conflict do nothing;
 end if;
 return new;
end $$;
drop trigger if exists message_report_ops_sync on message_reports;
create trigger message_report_ops_sync after insert or update on message_reports for each row execute function sync_admin_operational_cases();
drop trigger if exists exchange_dispute_ops_sync on exchanges;
create trigger exchange_dispute_ops_sync after insert or update of status on exchanges for each row execute function sync_admin_operational_cases();

create or replace function admin_ops_settle(p_actor text,p_exchange text,p_mode text,p_provider_award integer,p_requester_award integer,p_reason text,p_operation text) returns jsonb language plpgsql as $$
declare e exchanges; s escrows; u users; requester_held integer; provider_held integer; credit integer; target text; result_status text; uid text;
begin
 perform admin_ops_assert(p_actor,'escrow.settle');
 select * into e from exchanges where id=p_exchange for update;
 if not found or e.status in('completed','cancelled') then raise exception 'Exchange is already settled or unavailable'; end if;
 select * into s from escrows where exchange_id=e.id for update;
 if not found then
  if p_mode<>'refund' or e.status not in('pending_proposal','negotiating') then raise exception 'No funded escrow found'; end if;
  update exchanges set status='cancelled',admin_hold=null,updated_at=now(),payload=payload||'{"status":"cancelled"}' where id=e.id;
  update marketplace_requests set status='cancelled',updated_at=now(),payload=payload||'{"status":"cancelled"}'where id=e.marketplace_request_id and status='in_progress';
  return '{"status":"cancelled","providerCredit":0,"requesterCredit":0}'::jsonb;
 end if;
 if s.status in('released','refunded','cancelled') then raise exception 'Escrow is already settled'; end if;
 if exists(select 1 from jsonb_each(s.participants) p where coalesce((p.value->>'securityDepositAmount')::numeric,0)>0 and p.value->>'depositStatus'='received') then raise exception 'Cash deposits require confirmed provider settlement; they cannot be marked returned through Skill Hour controls'; end if;
 requester_held:=coalesce((s.participants->e.requester_id->>'skillHoursReserved')::integer,0);
 provider_held:=coalesce((s.participants->e.provider_id->>'skillHoursReserved')::integer,0);
 if requester_held<>e.requester_escrow_hours or provider_held<>e.provider_escrow_hours then raise exception 'Escrow reserves differ from the exchange; investigate before settlement'; end if;
 if p_mode='release' then
  if e.status<>'in_review' or e.reveal_at is null or s.status='disputed' or e.admin_hold is not null or s.admin_hold is not null then raise exception 'Release conditions are not met'; end if;
  if not exists(select 1 from exchange_contracts where exchange_id=e.id)or(select count(*)from exchange_deliveries where exchange_id=e.id and review_round=e.review_round and is_current)<(case when e.is_mutual then 2 else 1 end)then raise exception 'An agreed contract and current deliverables are required';end if;
  if (select count(*) from exchange_review_decisions where exchange_id=e.id and review_round=e.review_round and decision='accept' and revealed_at is not null and reviewer_id in(e.requester_id,e.provider_id)and(e.is_mutual or reviewer_id=e.requester_id)) < (case when e.is_mutual then 2 else 1 end) then raise exception 'Independent review approval is required'; end if;
  p_provider_award:=requester_held; p_requester_award:=provider_held;
 elsif p_mode='refund' then
  if e.status='disputed' or s.status='disputed' then raise exception 'Resolve the dispute before refunding'; end if;
  p_provider_award:=0; p_requester_award:=0;
 elsif p_mode='resolve' then
  perform admin_ops_assert(p_actor,'disputes.write');
  if e.status<>'disputed' or s.status<>'disputed' then raise exception 'No active dispute'; end if;
 else raise exception 'Invalid settlement'; end if;
 if p_provider_award is null or p_requester_award is null or p_provider_award not between 0 and requester_held or p_requester_award not between 0 and provider_held then raise exception 'Awards exceed actual reserves'; end if;
 if e.requester_id=e.provider_id or (select count(*) from users where id in(e.requester_id,e.provider_id))<>2 then raise exception 'Both escrow participants must exist'; end if;
 perform id from users where id in(e.requester_id,e.provider_id) order by id for update;
 for uid in select id from users where id in(e.requester_id,e.provider_id) order by id loop
  select * into u from users where id=uid;
  credit:=case when uid=e.provider_id then p_provider_award+provider_held-p_requester_award else p_requester_award+requester_held-p_provider_award end;
  if credit>0 then
   update users set skill_hours=skill_hours+credit,updated_at=now(),payload=payload||jsonb_build_object('skillHours',skill_hours+credit) where id=uid;
   insert into ledger_entries(id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
   values('settle-'||p_operation||'-'||uid,'admin_settlement',uid,e.id,p_actor,case p_mode when 'resolve' then 'Dispute Resolution' when 'refund' then 'Refunded' else 'Released' end,'Completed',credit,u.skill_hours,u.skill_hours+credit,p_reason,p_reason,now(),jsonb_build_object('adminId',p_actor,'operationId',p_operation));
  end if;
  perform publish_member_notification('admin-settle:'||p_operation,uid,'dispute_resolved','Exchange settlement recorded',p_reason,'/exchanges/'||e.id,e.id);
 end loop;
 result_status:=case when p_provider_award=0 and p_requester_award=0 then 'cancelled' else 'completed' end;
 update ledger_entries set entry_status='Completed' where exchange_id=e.id and entry_type='Reserved' and entry_status='Active';
 update exchanges set status=result_status,admin_hold=null,completed_at=case when result_status='completed' then now() else completed_at end,files_released_at=case when result_status='completed' then now() else files_released_at end,updated_at=now(),payload=payload||jsonb_build_object('status',result_status,'resolutionReason',p_reason,'resolvedBy',p_actor) where id=e.id;
 update escrows set status=case when result_status='cancelled' then 'refunded' else 'released' end,admin_hold=null,updated_at=now(),dispute=coalesce(dispute,'{}')||jsonb_build_object('status','resolved','resolvedBy',p_actor,'resolutionNotes',p_reason,'resolvedAt',now(),'providerAward',p_provider_award,'requesterAward',p_requester_award) where id=s.id;
 update admin_dispute_cases set status='resolved',reason=p_reason,updated_at=now() where exchange_id=e.id;
 update marketplace_requests set status=result_status,updated_at=now(),payload=payload||jsonb_build_object('status',result_status) where id=e.marketplace_request_id;
 insert into exchange_activity(id,exchange_id,actor_id,event_type,description,occurred_at,payload)values('admin-settle-'||p_operation,e.id,p_actor,'admin_settlement',p_reason,now(),'{}');
 return jsonb_build_object('status',result_status,'providerCredit',p_provider_award+provider_held-p_requester_award,'requesterCredit',p_requester_award+requester_held-p_provider_award);
end $$;

create or replace function admin_ops_mutate(p_actor text,p_area text,p_id text,p_action text,p_data jsonb,p_reason text,p_operation text,p_context jsonb default '{}') returns jsonb language plpgsql as $$
declare permission text; before_value jsonb; after_value jsonb; receipt admin_operation_receipts; fingerprint text; v verification_requests; e exchanges; report platform_reports; ticket support_tickets; d cms_documents; u users; original ledger_entries; amount integer; balance integer; target text; previous_status text; expiry timestamptz; count_supers integer;
begin
 permission:=case p_area when 'escrow' then 'escrow.settle' when 'skill-ledger' then 'ledger.adjust' when 'settings' then 'settings.write' when 'roles' then 'roles.manage' when 'subscriptions' then 'subscriptions.provider' else p_area||'.write' end;
 perform admin_ops_assert(p_actor,permission);
 if p_reason is null or length(trim(p_reason))<3 or length(p_reason)>5000 or p_operation is null or p_operation !~ '^[a-f0-9-]{36}$' or jsonb_typeof(p_data) is distinct from 'object' then raise exception 'Reason and valid operation details are required'; end if;
 fingerprint:=md5(jsonb_build_array(p_area,p_id,p_action,p_data,trim(p_reason))::text);
 perform pg_advisory_xact_lock(hashtext(p_actor||'/'||p_operation));
 select * into receipt from admin_operation_receipts where actor_id=p_actor and operation_id=p_operation;
 if found then if receipt.request_hash<>fingerprint then raise exception 'Operation identifier was reused with different details'; end if; return receipt.result; end if;
 perform set_config('weave.admin_operation','on',true);
 if p_action='note' and p_area in('verification','marketplace','exchanges','escrow','disputes','reports','support','subscriptions','skill-ledger') then
  after_value:='{"noted":true}';
 elsif p_area='verification' then
  select * into v from verification_requests where id=p_id for update; if not found then raise exception 'Verification request not found'; end if;
  before_value:=to_jsonb(v)-'documents'-'statement';
  target:=case p_action when 'approve' then 'approved' when 'reject' then 'rejected' when 'request_information' then 'needs_information' when 'review' then 'under_review' when 'flag' then 'flagged' when 'suspend' then 'suspended' else null end;
  if target is null then raise exception 'Invalid verification decision'; end if;
  if target in('approved','rejected','needs_information') and v.status not in('pending','under_review','flagged','needs_information') then raise exception 'Request is no longer awaiting a decision'; end if;
  if target='approved' and (select coalesce(account_status,'active') from users where id=v.user_id)<>'active' then raise exception 'Member account is unavailable'; end if;
  expiry:=case when target='approved' then now()+coalesce((select (value->>'validityDays')::integer from platform_settings where section='verification'),365)*interval '1 day' else v.expires_at end;
  update verification_requests set status=target,reviewer_id=p_actor,reason=p_reason,risk_flag=case when target='flagged' then p_reason else risk_flag end,expires_at=expiry,updated_at=now(),version=version+1 where id=v.id returning to_jsonb(verification_requests)-'documents'-'statement' into after_value;
  update users set is_verified=not exists(select 1 from jsonb_array_elements_text(coalesce((select value->'requiredTypes'from platform_settings where section='verification'),'["identity"]'))required(type)where not exists(select 1 from verification_requests r where r.user_id=v.user_id and r.verification_type=required.type and r.status='approved'and(r.expires_at is null or r.expires_at>now()))),updated_at=now() where id=v.user_id;
  perform publish_member_notification('verification:'||p_operation,v.user_id,case when target='approved' then 'verification_approved' else 'account_update' end,'Verification '||replace(target,'_',' '),p_reason,'/verification',v.id);
 elsif p_area='marketplace' then
  select to_jsonb(r) into before_value from marketplace_requests r where id=p_id for update; if not found then raise exception 'Request not found'; end if;
  previous_status:=before_value->>'status';
  if p_action='feature' then
   if coalesce((p_data->>'featured')::boolean,true)and not coalesce((select (value->>'featuredEnabled')::boolean from platform_settings where section='marketplace'),true)then raise exception 'Featured listings are disabled';end if;
   update marketplace_requests set is_featured=coalesce((p_data->>'featured')::boolean,true) where id=p_id;
  elsif p_action='flag' then update marketplace_requests set admin_flag=p_reason where id=p_id;
  elsif p_action='clear_flag' then update marketplace_requests set admin_flag=null where id=p_id;
  else
   target:=case p_action when 'approve' then 'open' when 'hide' then 'hidden' when 'pause' then 'paused' when 'remove' then 'removed' when 'restore' then coalesce(nullif(before_value->>'admin_previous_status',''),'open') else null end;
   if target is null or previous_status in('completed','in_progress') then raise exception 'This request cannot be moderated into that state'; end if;
   if p_action='restore' and previous_status not in('hidden','paused','removed') then raise exception 'Request is not hidden, paused, or removed'; end if;
   if target='open' and (before_value->>'expires_at')::timestamptz<=now() then target:='expired'; end if;
   update marketplace_requests set admin_previous_status=case when p_action in('hide','pause','remove') and status not in('hidden','paused','removed') then status else admin_previous_status end,status=target,updated_at=now(),payload=payload||jsonb_build_object('status',target) where id=p_id;
  end if;
  select to_jsonb(r)-'payload' into after_value from marketplace_requests r where id=p_id;
  before_value:=before_value-'payload';
 elsif p_area in('exchanges','escrow','disputes') then
  target:=case when p_area='escrow' then (select exchange_id from escrows where id=p_id) else p_id end;
  select * into e from exchanges where id=target for update; if not found then raise exception 'Exchange not found'; end if;
  before_value:=to_jsonb(e)-'payload';
  if p_area='escrow' then select to_jsonb(s)-'payload' into before_value from escrows s where s.exchange_id=e.id for update; end if;
  if p_action in('release','refund','resolve','cancel') then
   if p_data->'confirmed' is distinct from 'true'::jsonb then raise exception 'Settlement confirmation is required'; end if;
   if p_action='cancel' then perform admin_ops_assert(p_actor,'escrow.settle'); end if;
   after_value:=admin_ops_settle(p_actor,e.id,case p_action when 'cancel' then 'refund' else p_action end,(p_data->>'providerAward')::integer,(p_data->>'requesterAward')::integer,p_reason,p_operation);
  elsif p_action in('pause','freeze','resume') then
   if e.status in('completed','cancelled') then raise exception 'Exchange is already settled'; end if;
   if p_area='escrow' then update escrows set admin_hold=case when p_action='resume' then null else p_action end,updated_at=now() where exchange_id=e.id;
   else update exchanges set admin_hold=case when p_action='resume' then null else p_action end,updated_at=now() where id=e.id; end if;
  elsif p_action='extend' then
   expiry:=(p_data->>'deadline')::timestamptz;
   if expiry is null or expiry<=greatest(coalesce(e.deadline_at,now()),now()) or expiry>now()+interval '365 days' or e.status in('completed','cancelled') then raise exception 'Choose a later deadline within one year'; end if;
   update exchanges set deadline_at=expiry,updated_at=now(),payload=payload||jsonb_build_object('deadline',expiry) where id=e.id;
  elsif p_action='open_dispute' then
   if e.status in('completed','cancelled','disputed') or not exists(select 1 from escrows where exchange_id=e.id and status not in('released','refunded')) then raise exception 'Exchange cannot be disputed'; end if;
   update exchanges set status='disputed',updated_at=now(),payload=payload||jsonb_build_object('status','disputed','dispute',jsonb_build_object('reason',p_reason,'openedBy',p_actor,'openedAt',now())) where id=e.id;
   update escrows set status='disputed',dispute=jsonb_build_object('reason',p_reason,'openedBy',p_actor,'openedAt',now(),'status','open'),updated_at=now() where exchange_id=e.id;
  elsif p_area='disputes' and p_action='triage' then
   select to_jsonb(c) into before_value from admin_dispute_cases c where c.exchange_id=e.id for update;
   if p_data->>'status' not in('new','under_review','awaiting_response','escalated') or p_data->>'priority' not in('low','normal','high','critical') or e.status<>'disputed' then raise exception 'Invalid dispute triage'; end if;
   if nullif(p_data->>'assignedTo','') is not null and not admin_ops_can(p_data->>'assignedTo','disputes.write') then raise exception 'Assignee lacks dispute permissions'; end if;
   update admin_dispute_cases set status=p_data->>'status',priority=p_data->>'priority',assigned_to=nullif(p_data->>'assignedTo',''),updated_at=now() where exchange_id=e.id;
   select to_jsonb(c) into after_value from admin_dispute_cases c where c.exchange_id=e.id;
  else raise exception 'Invalid exchange operation'; end if;
  if after_value is null then
   if p_area='escrow' then select to_jsonb(s)-'payload' into after_value from escrows s where s.exchange_id=e.id;
   else select to_jsonb(x)-'payload' into after_value from exchanges x where id=e.id; end if;
  end if;
  insert into exchange_activity(id,exchange_id,actor_id,event_type,description,occurred_at,payload) values('ops-'||p_operation,e.id,p_actor,'admin_'||p_action,p_reason,now(),'{}') on conflict do nothing;
 elsif p_area='skill-ledger' then
  if p_data->'confirmed' is distinct from 'true'::jsonb then raise exception 'Adjustment confirmation is required'; end if;
  if coalesce((select (value->>'manualAdjustmentsEnabled')::boolean from platform_settings where section='skill-hours'),true)=false then raise exception 'Manual adjustments are disabled'; end if;
  if p_action='reverse' then
   select * into original from ledger_entries where id=p_id for update; if not found then raise exception 'Transaction not found'; end if;
   if original.source_collection not in('admin_operations','skill_ledger') or original.entry_type not in('Admin Adjustment','Admin Correction','Correction') then raise exception 'Only standalone manual corrections can be reversed; exchange transactions require escrow/dispute settlement'; end if;
   if exists(select 1 from ledger_entries where payload->>'reversalOf'=original.id) then raise exception 'Transaction already reversed'; end if;
   amount:=-original.amount; target:=original.user_id;
  elsif p_action='adjust' then target:=p_data->>'memberId'; amount:=(p_data->>'amount')::integer;
  else raise exception 'Invalid ledger operation'; end if;
  if amount is null or amount=0 or abs(amount::bigint)>coalesce((select (value->>'adjustmentLimit')::integer from platform_settings where section='skill-hours'),10000) then raise exception 'Invalid adjustment amount'; end if;
  select * into u from users where id=target for update; if not found or coalesce(u.account_status,'active') in('deleted','deletion_pending','deletion_processing') then raise exception 'Member account is unavailable'; end if;
  balance:=u.skill_hours+amount; if balance<0 then raise exception 'Adjustment would make balance negative'; end if;
  before_value:=jsonb_build_object('memberId',u.id,'balance',u.skill_hours);
  update users set skill_hours=balance,payload=payload||jsonb_build_object('skillHours',balance),updated_at=now() where id=u.id;
  insert into ledger_entries(id,source_collection,user_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload) values('ops-ledger-'||p_operation,'admin_operations',u.id,p_actor,case p_action when 'reverse' then 'Reversal' else 'Admin Adjustment' end,'Completed',amount,u.skill_hours,balance,p_reason,coalesce(p_data->>'internalNote',''),now(),jsonb_build_object('adminId',p_actor,'reversalOf',case when p_action='reverse' then original.id end));
  perform publish_member_notification('hours:'||p_operation,u.id,'admin_adjustment','Skill Hour adjustment',p_reason,'/wallet/ledger','ops-ledger-'||p_operation);
  after_value:=jsonb_build_object('transactionId','ops-ledger-'||p_operation,'memberId',u.id,'balance',balance,'amount',amount);
 elsif p_area='reports' then
  select * into report from platform_reports where id=p_id for update; if not found then raise exception 'Report not found'; end if;
  before_value:=to_jsonb(report)-'description'-'evidence';
  if p_action='triage' then
   if p_data->>'status' not in('open','under_review','escalated') or p_data->>'priority' not in('low','normal','high','critical') then raise exception 'Invalid report triage'; end if;
   if nullif(p_data->>'assignedTo','') is not null and not admin_ops_can(p_data->>'assignedTo','reports.write') then raise exception 'Assignee lacks report permissions'; end if;
   update platform_reports set status=p_data->>'status',priority=p_data->>'priority',assigned_to=nullif(p_data->>'assignedTo',''),updated_at=now() where id=report.id;
  elsif p_action in('dismiss','resolve','warn','hide','remove','restrict','suspend','create_dispute') then
   if report.status in('resolved','dismissed') then raise exception 'Report is already resolved'; end if;
   if p_action='warn' then
    if report.reported_user_id is null then raise exception 'This report has no member to warn'; end if;
    perform publish_member_notification('warning:'||p_operation,report.reported_user_id,'account_update','Platform warning',p_reason,'/support/contact',report.id);
   elsif p_action in('restrict','suspend') then
    perform admin_ops_assert(p_actor,'reports.write');
    perform pg_advisory_xact_lock(hashtext('weave/admin-account-controls'));
    if report.reported_user_id is null or report.reported_user_id=p_actor or admin_ops_role(report.reported_user_id) is not null then raise exception 'Staff accounts require Super Admin member controls'; end if;
    update users set account_status='suspended',updated_at=now(),payload=payload||'{"status":"suspended"}' where id=report.reported_user_id and coalesce(account_status,'active')='active';
    if not found then raise exception 'Member account cannot be restricted'; end if;
    delete from user_devices where user_id=report.reported_user_id;
   elsif p_action in('hide','remove') then
    if report.resource_type='marketplace' then
     perform admin_ops_assert(p_actor,'marketplace.write');
     update marketplace_requests set admin_previous_status=case when status in('hidden','paused','removed') then admin_previous_status else status end,status=case when p_action='hide' then 'hidden' else 'removed' end,updated_at=now(),payload=payload||jsonb_build_object('status',case when p_action='hide' then 'hidden' else 'removed' end) where id=report.resource_id and status not in('completed','in_progress');
    elsif report.resource_type='message' then
     perform admin_ops_assert(p_actor,'exchanges.messages');
     if coalesce((select (value->>'messageInspection')::boolean from platform_settings where section='trust-safety'),false)=false then raise exception 'Message moderation requires the investigation policy'; end if;
     update messages set content='[Removed by moderation]',payload=payload-'content' where id=report.resource_id;
    elsif report.resource_type='review' then update reviews set comment='[Removed by moderation]',payload=payload-'comment' where id=report.resource_id;
    elsif report.resource_type='content' then perform admin_ops_assert(p_actor,'cms.write');update cms_documents set status='archived',updated_at=now() where id=report.resource_id;
    else raise exception 'Use the linked resource controls for this report type'; end if;
    if not found then raise exception 'Reported resource was not eligible for moderation'; end if;
   elsif p_action='create_dispute' then
    perform admin_ops_assert(p_actor,'disputes.write');
    if report.resource_type<>'exchange' then raise exception 'Report must reference an exchange'; end if;
    update exchanges set status='disputed',payload=payload||jsonb_build_object('status','disputed','dispute',jsonb_build_object('reason',p_reason,'openedBy',p_actor,'openedAt',now())) where id=report.resource_id and status not in('completed','cancelled');
    if not found then raise exception 'Exchange cannot be disputed'; end if;
    update escrows set status='disputed',dispute=jsonb_build_object('reason',p_reason,'status','open'),updated_at=now() where exchange_id=report.resource_id and status not in('released','refunded');
    if not found then raise exception 'No funded escrow found'; end if;
   end if;
   update platform_reports set status=case when p_action='dismiss' then 'dismissed' else 'resolved' end,resolution=p_action||': '||p_reason,updated_at=now() where id=report.id;
  else raise exception 'Invalid report action'; end if;
  if report.source_key like 'message/%' then update message_reports set status=(select status from platform_reports where id=report.id) where id=substring(report.source_key from 9); end if;
  select to_jsonb(r)-'description'-'evidence' into after_value from platform_reports r where id=report.id;
 elsif p_area='support' then
  select * into ticket from support_tickets where id=p_id for update; if not found then raise exception 'Ticket not found'; end if;
  before_value:=to_jsonb(ticket);
  if p_action='reply' then
   insert into admin_case_events(resource_type,resource_id,actor_id,event_type,message,is_internal,attachments)values('support',ticket.id,p_actor,'reply',p_reason,false,coalesce(p_data->'attachments','[]'));
   update support_tickets set status='awaiting_user',updated_at=now() where id=ticket.id;
   perform publish_member_notification('support:'||p_operation,ticket.user_id,'account_update','Support replied to your ticket',ticket.subject,'/support/contact',ticket.id);
  elsif p_action='triage' then
   if p_data->>'status' not in('open','assigned','awaiting_user','awaiting_admin','resolved','closed','escalated') or p_data->>'priority' not in('low','normal','high','critical') then raise exception 'Invalid ticket triage'; end if;
   if nullif(p_data->>'assignedTo','') is not null and not admin_ops_can(p_data->>'assignedTo','support.write') then raise exception 'Assignee lacks support permissions'; end if;
   update support_tickets set status=p_data->>'status',priority=p_data->>'priority',assigned_to=nullif(p_data->>'assignedTo',''),updated_at=now() where id=ticket.id;
  else raise exception 'Invalid ticket action'; end if;
  select to_jsonb(t) into after_value from support_tickets t where id=ticket.id;
 elsif p_area in('cms','blog') then
  select * into d from cms_documents where id=p_id for update;
  if found then
   if (p_area='blog')<>(d.kind='post') then raise exception 'Content belongs to another administrative area'; end if;
   if (p_data->>'version')::integer is distinct from d.version then raise exception 'Content changed since it was opened. Reload before saving'; end if;
   before_value:=to_jsonb(d);
  end if;
  if p_action<>'save' or p_data->>'kind' not in('page','post','faq','navigation','global') or (p_area='blog')<>(p_data->>'kind'='post') or p_data->>'status' not in('draft','published','scheduled','archived') or length(trim(p_data->>'title')) not between 1 and 200 or p_data->>'slug' !~ '^[a-z0-9]+(?:[-/][a-z0-9]+)*$' or length(p_data->>'content')>100000 then raise exception 'Invalid content'; end if;
  if p_data->>'status'='scheduled' and ((p_data->>'publishAt')::timestamptz is null or (p_data->>'publishAt')::timestamptz<=now()) then raise exception 'Scheduled publishing requires a future date'; end if;
  insert into cms_documents(id,kind,title,slug,status,content,excerpt,seo_title,seo_description,featured_image,og_image,canonical_url,author_id,category,tags,publish_at,sort_order,placement,links)
  values(p_id,p_data->>'kind',p_data->>'title',p_data->>'slug',p_data->>'status',coalesce(p_data->>'content',''),coalesce(p_data->>'excerpt',''),coalesce(p_data->>'seoTitle',''),coalesce(p_data->>'seoDescription',''),nullif(p_data->>'featuredImage',''),nullif(p_data->>'ogImage',''),nullif(p_data->>'canonicalUrl',''),coalesce(nullif(p_data->>'authorId',''),p_actor),coalesce(p_data->>'category',''),array(select jsonb_array_elements_text(coalesce(p_data->'tags','[]'))),case when p_data->>'status'='published' then case when d.status='published' then coalesce(d.publish_at,now()) else now()end else nullif(p_data->>'publishAt','')::timestamptz end,coalesce((p_data->>'sortOrder')::integer,0),nullif(p_data->>'placement',''),coalesce(p_data->'links','[]'))
  on conflict(id) do update set title=excluded.title,slug=excluded.slug,status=excluded.status,content=excluded.content,excerpt=excluded.excerpt,seo_title=excluded.seo_title,seo_description=excluded.seo_description,featured_image=excluded.featured_image,og_image=excluded.og_image,canonical_url=excluded.canonical_url,author_id=excluded.author_id,category=excluded.category,tags=excluded.tags,publish_at=excluded.publish_at,sort_order=excluded.sort_order,placement=excluded.placement,links=excluded.links,updated_at=now(),version=cms_documents.version+1;
  select to_jsonb(x) into after_value from cms_documents x where id=p_id;
 elsif p_area='settings' and p_action='save' then
  select value into before_value from platform_settings where section=p_id for update; if not found then raise exception 'Unknown settings section'; end if;
  update platform_settings set value=p_data,updated_by=p_actor,updated_at=now() where section=p_id;
  after_value:=p_data;
 elsif p_area='roles' and p_action='assign' then
  perform pg_advisory_xact_lock(hashtext('weave/admin-account-controls'));
  if p_data->>'role' not in(select name from admin_roles) or jsonb_typeof(p_data->'enabled') is distinct from 'boolean' or not exists(select 1 from users where id=p_id and coalesce(account_status,'active')='active') then raise exception 'Invalid staff assignment'; end if;
  select to_jsonb(s) into before_value from admin_staff_roles s where user_id=p_id;
  select count(*) into count_supers from users where admin_ops_role(id)='Super Admin';
  if admin_ops_role(p_id)='Super Admin' and (p_data->>'role'<>'Super Admin' or p_data->'enabled'='false'::jsonb) and count_supers<=1 then raise exception 'At least one active Super Admin must remain'; end if;
  insert into admin_staff_roles(user_id,role_name,enabled,assigned_by)values(p_id,p_data->>'role',(p_data->>'enabled')::boolean,p_actor)on conflict(user_id)do update set role_name=excluded.role_name,enabled=excluded.enabled,assigned_by=p_actor,updated_at=now();
  select to_jsonb(s) into after_value from admin_staff_roles s where user_id=p_id;
 else raise exception 'Unsupported admin action'; end if;
 if p_action<>'reply' then
  insert into admin_case_events(resource_type,resource_id,actor_id,event_type,message,is_internal)values(p_area,p_id,p_actor,p_action,p_reason,p_action in('note','flag'));
 end if;
 perform admin_ops_audit(p_actor,p_area,p_id,p_action,before_value,after_value,trim(p_reason),p_operation,p_context);
 after_value:=coalesce(after_value,'{}')||jsonb_build_object('success',true);
 insert into admin_operation_receipts(actor_id,operation_id,request_hash,result)values(p_actor,p_operation,fingerprint,after_value);
 return after_value;
end $$;

-- Snapshot new contract policies before their canonical fingerprint is calculated.
do $$
declare definition text; routine record;
begin
 for routine in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname='create_exchange_from_application' loop
  definition:=pg_get_functiondef(routine.oid);
  if position('''revisionsIncluded'',2' in definition)>0 then
   definition:=replace(definition,'''revisionsIncluded'',2','''revisionsIncluded'',coalesce((select (value->>''revisionLimit'')::integer from platform_settings where section=''exchanges''),2),''reviewDays'',coalesce((select (value->>''reviewDays'')::integer from platform_settings where section=''escrow''),7),''disputeDays'',coalesce((select (value->>''disputeDays'')::integer from platform_settings where section=''escrow''),14)');
   execute definition;
  end if;
 end loop;
 for routine in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname='generate_notification_reminders' loop
  definition:=pg_get_functiondef(routine.oid);
  definition:=replace(definition,'e.updated_at<now()-interval ''1 day''','e.updated_at<now()-coalesce((select (value->>''reminderDays'')::integer from platform_settings where section=''notifications''),1)*interval ''1 day''');
  execute definition;
 end loop;
end $$;

create or replace function admin_review_policy_guard()returns trigger language plpgsql as $$
declare included integer; round_number integer;
begin
 if new.decision='revision'then
  select coalesce((terms->>'revisionsIncluded')::integer,2)into included from exchange_contracts where exchange_id=new.exchange_id;
  select review_round into round_number from exchanges where id=new.exchange_id;
  if round_number>coalesce(included,2)then raise exception 'The agreed revision limit is reached; open a dispute to resolve further changes';end if;
 end if;
 return new;
end $$;
drop trigger if exists exchange_agreed_revision_policy on exchange_review_decisions;
create trigger exchange_agreed_revision_policy before insert on exchange_review_decisions for each row execute function admin_review_policy_guard();

create or replace function admin_deleted_member_cleanup()returns trigger language plpgsql as $$
begin
 if new.account_status='deleted'and old.account_status is distinct from 'deleted'then
  update verification_requests set statement='',documents='[]',reason=null,risk_flag=null where user_id=new.id;
  update admin_case_events c set message='[Deleted member content]',attachments='[]'where actor_id=new.id;
  update platform_reports set description='[Deleted member content]',evidence='[]'where reporter_id=new.id;
  delete from admin_alert_reads where user_id=new.id;
  update admin_staff_roles set enabled=false where user_id=new.id;
 end if;
 return new;
end $$;
drop trigger if exists deleted_member_admin_cleanup on users;
create trigger deleted_member_admin_cleanup after update of account_status on users for each row execute function admin_deleted_member_cleanup();
