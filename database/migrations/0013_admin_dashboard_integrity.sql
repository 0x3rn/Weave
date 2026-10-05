-- Admin operations use canonical roles and durable, non-personal audit records.
create table if not exists admin_audit_events (
 id bigserial primary key,
 actor_id text references users(id),
 event_type text not null,
 resource_id text not null,
 description text not null,
 metadata jsonb not null default '{}'::jsonb,
 operation_id text,
 source_key text unique,
 occurred_at timestamptz not null default now(),
 unique(actor_id,event_type,operation_id)
);
create index if not exists admin_audit_events_time_idx on admin_audit_events(occurred_at desc,id desc);
create or replace function audit_invite_submission() returns trigger language plpgsql as $$
begin
 insert into admin_audit_events(event_type,resource_id,description,source_key,occurred_at)
 values('invite_submitted',new.id,'Invite application submitted','invite-submitted/'||new.id,coalesce(new.submitted_at,now()))
 on conflict(source_key) do nothing;
 return new;
end $$;
drop trigger if exists invite_submission_audit on invite_applications;
create trigger invite_submission_audit after insert on invite_applications for each row execute function audit_invite_submission();
insert into admin_audit_events(event_type,resource_id,description,source_key,occurred_at)
 select 'invite_submitted',id,'Invite application submitted','invite-submitted/'||id,submitted_at from invite_applications where submitted_at is not null on conflict(source_key) do nothing;
insert into admin_audit_events(event_type,resource_id,description,source_key,occurred_at)
 select 'invite_approved',a.id,'Invite application approved','invite-approved/'||a.id,a.approved_at from invite_applications a
 where a.approved_at is not null and not exists(select 1 from admin_audit_events e where e.event_type='invite_approved' and e.resource_id=a.id)
 on conflict(source_key) do nothing;

create or replace function assert_platform_admin(p_actor text) returns void language plpgsql as $$
begin
 if not exists(select 1 from users where id=p_actor and coalesce(account_status,'active')='active'
   and coalesce(role,case when payload->'isAdmin'='true'::jsonb then 'Admin' else 'Member' end)='Admin') then raise exception 'Forbidden'; end if;
end $$;

-- All linked-invite operations lock the application before the code.
create or replace function admin_approve_invite(p_actor text,p_application text,p_id text,p_code text,p_settings jsonb,p_days integer)
 returns invites language plpgsql as $$
declare a invite_applications; i invites; expiry timestamptz;
begin
 perform assert_platform_admin(p_actor);
 if p_days is not null and (p_days<1 or p_days>365) then raise exception 'Invalid expiry'; end if;
 if jsonb_typeof(p_settings->'startingHours') is distinct from 'number' or (p_settings->>'startingHours')::numeric not between 0 and 10000
   or (p_settings->>'startingHours')::numeric<>trunc((p_settings->>'startingHours')::numeric)
   or jsonb_typeof(p_settings->'badge') is distinct from 'boolean' then raise exception 'Invalid approval settings'; end if;
 select * into a from invite_applications where id=p_application for update;
 if not found then raise exception 'Application not found'; end if;
 if exists(select 1 from invites where payload->>'inviteApplicationId'=p_application and status='used') then raise exception 'This applicant already registered'; end if;
 if a.status='approved' then
   select * into i from invites where payload->>'inviteApplicationId'=p_application and status='pending'
     and (expires_at is null or expires_at>now()) order by created_at desc limit 1 for update;
   if found then return i; end if;
 end if;
 update invites set status='revoked',payload=payload||jsonb_build_object('status','revoked','revokedAt',now())
   where payload->>'inviteApplicationId'=p_application and status not in('used','revoked');
 expiry:=case when p_days is null then null else now()+p_days*interval '1 day' end;
 insert into invites(id,code,email,status,created_at,expires_at,payload)
 values(p_id,p_code,lower(a.email),'pending',now(),expiry,jsonb_build_object('inviteApplicationId',a.id,'approvedSettings',p_settings)) returning * into i;
 update invite_applications set status='approved',approved_at=now(),payload=payload||jsonb_build_object('status','approved','approvedAt',now(),'approvedSettings',p_settings) where id=a.id;
 insert into admin_audit_events(actor_id,event_type,resource_id,description) values(p_actor,'invite_approved',a.id,'Invite application approved');
 return i;
end $$;

create or replace function admin_reject_invite(p_actor text,p_application text,p_reason text,p_feedback text)
 returns invite_applications language plpgsql as $$
declare a invite_applications;
begin
 perform assert_platform_admin(p_actor);
 if p_reason is null or p_feedback is null or length(trim(p_reason))=0 or length(p_reason)>500 or length(p_feedback)>2000 then raise exception 'Invalid rejection'; end if;
 select * into a from invite_applications where id=p_application for update;
 if not found then raise exception 'Application not found'; end if;
 if exists(select 1 from invites where payload->>'inviteApplicationId'=a.id and status='used') then raise exception 'This applicant already registered. Manage the member account instead.'; end if;
 update invites set status='revoked',payload=payload||jsonb_build_object('status','revoked','revokedAt',now())
   where payload->>'inviteApplicationId'=a.id and status not in('used','revoked');
 update invite_applications set status='rejected',payload=payload||jsonb_build_object('status','rejected','rejectionReason',trim(p_reason),'rejectionFeedback',trim(p_feedback),'rejectedAt',now()) where id=a.id returning * into a;
 insert into admin_audit_events(actor_id,event_type,resource_id,description) values(p_actor,'invite_rejected',a.id,'Invite application rejected');
 return a;
end $$;

create or replace function admin_extend_invite(p_actor text,p_id text,p_days integer) returns invites language plpgsql as $$
declare i invites; app_id text;
begin
 perform assert_platform_admin(p_actor);
 if p_days is null or p_days not between 1 and 365 then raise exception 'Invalid extension'; end if;
 select payload->>'inviteApplicationId' into app_id from invites where id=p_id;
 if app_id is not null then
   perform 1 from invite_applications where id=app_id and status='approved' for update;
   if not found then raise exception 'Application is not approved'; end if;
 end if;
 select * into i from invites where id=p_id for update;
 if not found then raise exception 'Invite not found'; end if;
 if coalesce(i.status,'') not in('pending','expired') then raise exception 'Cannot extend a used or revoked invite'; end if;
 update invites set expires_at=greatest(coalesce(i.expires_at,now()),now())+p_days*interval '1 day',status='pending',
   payload=payload||jsonb_build_object('status','pending') where id=p_id returning * into i;
 update invites set payload=payload||jsonb_build_object('expiresAt',i.expires_at) where id=p_id;
 insert into admin_audit_events(actor_id,event_type,resource_id,description) values(p_actor,'invite_extended',p_id,'Invite expiration extended');
 return i;
end $$;

-- Registration rechecks the decision under the same lock as rejection/approval.
create or replace function claim_member_invite(p_code text,p_uid text,p_email text,p_data jsonb) returns text language plpgsql as $$
declare i invites; a invite_applications; app_id text; settings jsonb; hours integer; badge boolean; data jsonb;
begin
 select payload->>'inviteApplicationId' into app_id from invites where code=p_code;
 if app_id is not null then
   select * into a from invite_applications where id=app_id for update;
   if not found or a.status is distinct from 'approved' then raise exception 'This application is not approved'; end if;
 end if;
 select * into i from invites where code=p_code for update;
 if not found or i.status is distinct from 'pending' or (i.expires_at is not null and i.expires_at<=now()) or p_email is null or lower(i.email) is distinct from lower(p_email) then raise exception 'This invitation is no longer valid'; end if;
 settings:=coalesce(i.payload->'approvedSettings',a.payload->'approvedSettings','{"startingHours":5,"badge":false}'::jsonb);
 hours:=greatest(0,least(10000,coalesce((settings->>'startingHours')::integer,5)));
 badge:=coalesce(settings->'badge'='true'::jsonb,false);
 data:=(p_data-'adminNotes'-'internalNotes'-'isAdmin'-'role')||jsonb_build_object('email',lower(p_email),'skillHours',hours,'isVerified',badge,'createdAt',now());
 insert into users(id,email,full_name,profession,country,time_zone,skill_hours,is_verified,account_status,role,created_at,updated_at,payload)
 values(p_uid,lower(p_email),data->>'fullName',data->>'profession',data->>'country',data->>'timeZone',hours,badge,'active','Member',now(),now(),data);
 update invites set status='used',payload=payload||jsonb_build_object('status','used','usedAt',now(),'userId',p_uid) where id=i.id;
 insert into admin_audit_events(event_type,resource_id,description) values('invite_claimed',i.id,'Invited member registered');
 return p_uid;
end $$;

create or replace function admin_update_member(p_actor text,p_user text,p_action text,p_value jsonb) returns users language plpgsql as $$
declare u users; value text;
begin
 perform pg_advisory_xact_lock(hashtext('weave/admin-account-controls'));
 perform assert_platform_admin(p_actor);
 select * into u from users where id=p_user for update;
 if not found then raise exception 'User not found'; end if;
 if coalesce(u.account_status,'active') in('deleted','deletion_pending','deletion_processing') then raise exception 'Use the account recovery process for this account'; end if;
 if p_action='status' or p_action='delete' then
   value:=p_value#>>'{}';
   if p_user=p_actor and (p_action='delete' or value<>'active') then raise exception 'You cannot suspend, ban, or delete your own admin account'; end if;
   if coalesce(u.role,case when u.payload->'isAdmin'='true'::jsonb then 'Admin' else 'Member' end)='Admin'
     and (p_action='delete' or value<>'active') and (select count(*) from users where coalesce(account_status,'active')='active' and coalesce(role,case when payload->'isAdmin'='true'::jsonb then 'Admin' else 'Member' end)='Admin')<=1 then raise exception 'At least one active administrator must remain'; end if;
 end if;
 if p_action='status' then
   if jsonb_typeof(p_value) is distinct from 'string' or value is null or value not in('active','suspended','banned') then raise exception 'Invalid status'; end if;
   if coalesce(u.account_status,'active') not in('active','suspended','banned') then raise exception 'Use the account recovery process for this account'; end if;
   update users set account_status=value,payload=payload||jsonb_build_object('status',value),updated_at=now() where id=p_user;
   if value<>'active' then delete from user_devices where user_id=p_user; end if;
 elsif p_action='verification' then
   if jsonb_typeof(p_value) is distinct from 'boolean' then raise exception 'Invalid verification value'; end if;
   update users set is_verified=(p_value#>>'{}')::boolean,payload=payload||jsonb_build_object('isVerified',p_value),updated_at=now() where id=p_user;
 elsif p_action='notes' then
   if jsonb_typeof(p_value) is distinct from 'string' or length(p_value#>>'{}')>5000 then raise exception 'Invalid notes'; end if;
   update users set payload=payload||jsonb_build_object('adminNotes',p_value),updated_at=now() where id=p_user;
 elsif p_action='delete' then
   perform change_member_account_state(p_user,'delete');
 else raise exception 'Invalid admin operation'; end if;
 insert into admin_audit_events(actor_id,event_type,resource_id,description,metadata)
   values(p_actor,'user_'||p_action,p_user,case p_action when 'notes' then 'Private member notes updated' when 'verification' then 'Member verification updated' when 'delete' then 'Member deletion scheduled' else 'Member status updated' end,
     case when p_action in('status','verification') then jsonb_build_object('value',p_value) else '{}'::jsonb end);
 select * into u from users where id=p_user;
 return u;
end $$;

create or replace function admin_adjust_skill_hours(p_actor text,p_user text,p_amount integer,p_reason text,p_operation text) returns integer language plpgsql as $$
declare u users; previous admin_audit_events; entry_id text; balance integer;
begin
 perform assert_platform_admin(p_actor);
 if p_amount is null or p_amount=0 or abs(p_amount::bigint)>10000 or p_reason is null or length(trim(p_reason))=0 or length(p_reason)>500 or p_operation is null or p_operation !~ '^[a-f0-9-]{36}$' then raise exception 'Invalid adjustment'; end if;
 perform pg_advisory_xact_lock(hashtext(p_actor||'/'||p_operation));
 select * into previous from admin_audit_events where actor_id=p_actor and event_type='hours_adjusted' and operation_id=p_operation;
 if found then
   if previous.resource_id<>p_user or previous.metadata->>'amount'<>p_amount::text or previous.metadata->>'reason'<>trim(p_reason) then raise exception 'This operation was already used for another adjustment'; end if;
   return (previous.metadata->>'balance')::integer;
 end if;
 select * into u from users where id=p_user for update;
 if not found or coalesce(u.account_status,'active') in('deleted','deletion_pending','deletion_processing') then raise exception 'Account is unavailable'; end if;
 balance:=u.skill_hours+p_amount;
 if balance<0 then raise exception 'Adjustment would make the balance negative'; end if;
 entry_id:='admin-'||p_actor||'-'||p_operation;
 update users set skill_hours=balance,updated_at=now(),payload=payload||jsonb_build_object('skillHours',balance,'updatedAt',now()) where id=p_user;
 insert into ledger_entries(id,source_collection,user_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,occurred_at,payload)
   values(entry_id,'skill_ledger',p_user,p_actor,'Admin Correction','Completed',p_amount,u.skill_hours,balance,trim(p_reason),now(),jsonb_build_object('userId',p_user,'amount',p_amount,'type','Admin Correction','status','Completed','description',trim(p_reason),'balanceBefore',u.skill_hours,'balanceAfter',balance,'createdAt',now()));
 insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
   values(entry_id||'-notification','ledger/'||entry_id||'/notification',p_user,'admin_adjustment','Skill Hour balance adjusted',trim(p_reason),false,false,'/wallet/ledger',entry_id,now(),'{}');
 insert into admin_audit_events(actor_id,event_type,resource_id,description,operation_id,metadata)
   values(p_actor,'hours_adjusted',p_user,'Member Skill Hours adjusted',p_operation,jsonb_build_object('amount',p_amount,'reason',trim(p_reason),'balance',balance));
 return balance;
end $$;
