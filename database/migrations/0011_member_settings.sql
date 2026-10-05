-- Member settings: apply to an isolated Neon branch before production.
alter table blocked_users add column if not exists reason text not null default '';
create table if not exists user_integrations (
  user_id text not null references users(id) on delete cascade,
  provider text not null,
  account_name text not null,
  profile_url text,
  permissions jsonb not null default '[]',
  connected_at timestamptz not null default now(),
  last_used_at timestamptz,
  primary key(user_id,provider)
);
create table if not exists billing_accounts (
  user_id text primary key references users(id) on delete cascade,
  provider text not null check(provider in ('paystack','stripe')),
  customer_id text,
  subscription_id text,
  subscription_status text not null default 'free',
  renewal_at timestamptz,
  amount integer,
  currency text,
  payment_method jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists billing_events (
  id text primary key,
  user_id text not null references users(id),
  provider text not null,
  event_type text not null,
  description text not null,
  amount integer not null default 0,
  currency text not null,
  invoice_url text,
  occurred_at timestamptz not null default now()
);
create index if not exists billing_events_member_idx on billing_events(user_id,occurred_at desc);
create table if not exists billing_checkouts (
  reference text primary key,
  user_id text not null references users(id),
  expected_amount integer not null,
  expected_currency text not null,
  plan_code text not null,
  created_at timestamptz not null default now(),
  authorization_url text,
  expires_at timestamptz not null default now()+interval '30 minutes',
  verified_at timestamptz
);
create or replace function reserve_member_checkout(p_user text,p_reference text,p_amount integer,p_currency text,p_plan text) returns billing_checkouts language plpgsql as $$
declare checkout billing_checkouts;
begin
 perform 1 from users where id=p_user and coalesce(account_status,'active')='active' for update;
 if not found then raise exception 'Account is unavailable'; end if;
 if exists(select 1 from billing_accounts where user_id=p_user and subscription_status in('active','non-renewing','attention')) then raise exception 'Manage your current subscription before starting another one'; end if;
 select * into checkout from billing_checkouts where user_id=p_user and verified_at is null and expires_at>now() order by created_at desc limit 1;
 if found then return checkout; end if;
 insert into billing_checkouts(reference,user_id,expected_amount,expected_currency,plan_code) values(p_reference,p_user,p_amount,p_currency,p_plan) returning * into checkout;
 return checkout;
end $$;
create table if not exists account_deletion_requests (
  user_id text primary key references users(id),
  requested_at timestamptz not null default now(),
  delete_after timestamptz not null default now()+interval '14 days',
  completed_at timestamptz,
  claimed_at timestamptz,
  auth_deleted_at timestamptz,
  storage_deleted_at timestamptz,
  error text
);
create table if not exists notification_email_queue (
  notification_id text primary key references notifications(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  due_at timestamptz not null,
  claimed_at timestamptz,
  sent_at timestamptz,
  attempts integer not null default 0
);
create index if not exists notification_email_due_idx on notification_email_queue(due_at) where sent_at is null;

create or replace function claim_member_deletions() returns setof account_deletion_requests language sql as $$
 with due as (
    select u.id from users u join account_deletion_requests d on d.user_id=u.id
    where u.account_status in('deletion_pending','deletion_processing') and d.completed_at is null and d.delete_after<=now()
      and (d.claimed_at is null or d.claimed_at<now()-interval '30 minutes')
      and not exists(select 1 from exchanges e where u.id in(e.requester_id,e.provider_id) and e.status not in('completed','cancelled'))
    order by d.delete_after limit 5 for update of u,d skip locked
  ), users_claimed as(update users u set account_status='deletion_processing',updated_at=now() from due where u.id=due.id returning u.id)
  update account_deletion_requests d set claimed_at=now(),error=null from users_claimed u where d.user_id=u.id returning d.*
$$;

create or replace function guard_member_message_contact() returns trigger language plpgsql as $$
declare recipient text; u users; mode text; kind text;
begin
 if new.sender_id is null or new.message_type not in('text','attachment') then return new; end if;
 select conversation_type into kind from conversations where id=new.conversation_id;
 if not exists(select 1 from conversation_participants where conversation_id=new.conversation_id and user_id=new.sender_id) then raise exception 'Sender is not a conversation participant'; end if;
 for recipient in select user_id from conversation_participants where conversation_id=new.conversation_id and user_id<>new.sender_id order by user_id loop
   select * into u from users where id=recipient for share;
   if exists(select 1 from blocked_users where (blocker_id=recipient and blocked_id=new.sender_id) or (blocker_id=new.sender_id and blocked_id=recipient)) then raise exception 'Messaging is unavailable for this conversation'; end if;
   if kind='direct' then
     mode:=coalesce(u.payload->'privacy'->>'contactPreferences','everyone');
     if coalesce(u.account_status,'active')<>'active' or mode='nobody'
       or (mode='verified' and not exists(select 1 from users where id=new.sender_id and is_verified))
       or (mode='collaborators' and not exists(select 1 from exchanges where (requester_id=new.sender_id and provider_id=recipient) or (provider_id=new.sender_id and requester_id=recipient))) then raise exception 'This member is not accepting contact from your account'; end if;
   end if;
 end loop;
 return new;
end $$;
drop trigger if exists messages_member_contact on messages;
create trigger messages_member_contact before insert on messages for each row execute function guard_member_message_contact();

create or replace function settings_notification_category(p_type text) returns text language sql immutable as $$
 select case
 when p_type ~ 'application|exchange_request|request_update' then 'applications'
 when p_type ~ 'message' then 'messages'
 when p_type ~ 'trust_score' then 'trustScore'
 when p_type ~ 'review|endorsement|achievement' then 'reviews'
 when p_type ~ 'hours|admin_adjustment' then 'skillHours'
 when p_type ~ 'match|saved_request|request_expiring|professional' then 'marketplace'
 when p_type ~ 'exchange|milestone|file_uploaded|revision|dispute' then 'escrow'
 else 'announcements' end
$$;
create or replace function apply_notification_channel_settings() returns trigger language plpgsql as $$
declare p jsonb;
begin
 select payload->'notificationPreferences' into p from users where id=new.user_id;
 if new.notification_type <> 'security_alert' and p->'channels'->'inApp' is not null then
   new.in_app_enabled := coalesce((p->'channels'->'inApp'->>settings_notification_category(new.notification_type))::boolean,true);
 end if;
 return new;
end $$;
drop trigger if exists notifications_settings_channels on notifications;
create trigger notifications_settings_channels before insert on notifications for each row execute function apply_notification_channel_settings();

create or replace function enqueue_notification_email() returns trigger language plpgsql as $$
declare p jsonb; k text; enabled boolean; due timestamptz; q jsonb; local_due timestamp; start_time time; end_time time; tz text; legacy_key text;
begin
 select payload->'notificationPreferences' into p from users where id=new.user_id;
 k := settings_notification_category(new.notification_type);
 legacy_key := case k when 'applications' then 'exchangeActivity' when 'messages' then 'messages' when 'reviews' then 'reviews' when 'trustScore' then 'reviews' when 'marketplace' then 'marketplace' when 'announcements' then 'community' else 'exchangeActivity' end;
 enabled := coalesce((p->'channels'->'email'->>k)::boolean,coalesce((p->'deliveryMethod'->>'email')::boolean,false) and coalesce((p->>legacy_key)::boolean,true));
 if not enabled or (p->>'digest'='never' and new.notification_type<>'security_alert') then return new; end if;
 due := now();
 q := p->'quietHours'; tz := coalesce(q->>'timeZone','UTC');
 if new.notification_type<>'security_alert' then
   if p->>'digest'='daily' then due := (date_trunc('day',now() at time zone tz) + interval '1 day') at time zone tz;
   elsif p->>'digest'='weekly' then due := (date_trunc('week',now() at time zone tz) + interval '7 days') at time zone tz; end if;
   if coalesce((q->>'enabled')::boolean,false) then
     local_due := due at time zone tz; start_time := (q->>'start')::time; end_time := (q->>'end')::time;
     if (start_time<end_time and local_due::time>=start_time and local_due::time<end_time) or
       (start_time>end_time and (local_due::time>=start_time or local_due::time<end_time)) then
       due := (local_due::date + end_time + case when start_time>end_time and local_due::time>=start_time then interval '1 day' else interval '0 days' end) at time zone tz;
     end if;
   end if;
 end if;
 insert into notification_email_queue(notification_id,user_id,due_at) values(new.id,new.user_id,due) on conflict do nothing;
 return new;
end $$;
drop trigger if exists notifications_settings_email on notifications;
create trigger notifications_settings_email after insert on notifications for each row execute function enqueue_notification_email();

create or replace function change_member_account_state(p_user text,p_action text) returns void language plpgsql as $$
declare u users; active_count integer;
begin
 select * into u from users where id=p_user for update;
 if not found or coalesce(u.account_status,'active')<>'active' then raise exception 'Account is unavailable'; end if;
 if p_action='pause' or p_action='resume' then
   update users set payload=payload||jsonb_build_object('marketplacePaused',p_action='pause'),updated_at=now() where id=p_user;
 elsif p_action='deactivate' or p_action='delete' then
   if p_action='delete' then
     select count(*) into active_count from exchanges where p_user in(requester_id,provider_id) and status not in('completed','cancelled');
     if active_count>0 or exists(select 1 from escrows e join exchanges x on x.id=e.exchange_id where p_user in(x.requester_id,x.provider_id) and e.status='disputed') then raise exception 'Complete or cancel active exchanges and resolve pending disputes before deletion'; end if;
     if exists(select 1 from billing_accounts where user_id=p_user and subscription_status in('active','non-renewing','attention','trialing','past_due')) then raise exception 'Cancel your subscription and wait until it expires before deleting your account'; end if;
     insert into account_deletion_requests(user_id) values(p_user) on conflict(user_id) do update set requested_at=now(),delete_after=now()+interval '14 days',completed_at=null,error=null;
   end if;
   update users set account_status=case when p_action='delete' then 'deletion_pending' else 'deactivated' end,updated_at=now() where id=p_user;
   delete from user_devices where user_id=p_user;
 else raise exception 'Invalid account action'; end if;
end $$;

-- Serializes capacity and deletion checks with exchange creation/start.
create or replace function guard_member_exchange_preferences() returns trigger language plpgsql as $$
declare u users; participant text; p jsonb; capacity integer; active_count integer;
begin
 if new.status in('completed','cancelled') then return new; end if;
 if tg_op='UPDATE' and new.requester_id is not distinct from old.requester_id and new.provider_id is not distinct from old.provider_id and old.status not in('completed','cancelled') then return new; end if;
 for participant in select x from unnest(array[new.requester_id,new.provider_id]) x order by x loop
   select * into u from users where id=participant for update;
   if not found or coalesce(u.account_status,'active')<>'active' then raise exception 'A participant is unavailable'; end if;
   p:=coalesce(u.payload->'preferences','{}');
   if coalesce((p->>'openToReciprocalOnly')::boolean,false) and not new.is_mutual then raise exception 'This member accepts reciprocal exchanges only'; end if;
   capacity:=coalesce((p->>'maxConcurrentExchanges')::integer,3);
   select count(*) into active_count from exchanges where participant in(requester_id,provider_id) and status not in('completed','cancelled') and id<>new.id;
   if active_count>=capacity then raise exception 'A participant has reached their concurrent exchange limit'; end if;
 end loop;
 return new;
end $$;
drop trigger if exists exchanges_member_preferences on exchanges;
create trigger exchanges_member_preferences before insert or update of status,requester_id,provider_id on exchanges for each row execute function guard_member_exchange_preferences();

-- Keep a stable anonymized member ID for ledger/audit records. Personal content is removed.
create or replace function finalize_member_deletion(p_user text) returns void language plpgsql as $$
declare u users;
begin
 select * into u from users where id=p_user for update;
 if not found or u.account_status<>'deletion_processing' or not exists(select 1 from account_deletion_requests where user_id=p_user and delete_after<=now() and completed_at is null and auth_deleted_at is not null and storage_deleted_at is not null) then raise exception 'Deletion is not due or external cleanup is incomplete'; end if;
 if exists(select 1 from exchanges where p_user in(requester_id,provider_id) and status not in('completed','cancelled')) then raise exception 'Active exchanges prevent deletion'; end if;
 delete from portfolio_items where user_id=p_user;
 delete from user_integrations where user_id=p_user;
 delete from user_devices where user_id=p_user;
 delete from notifications where user_id=p_user;
 delete from blocked_users where blocker_id=p_user or blocked_id=p_user;
 delete from saved_items where user_id=p_user;
 delete from conversation_notes where user_id=p_user;
 delete from conversation_archives where user_id=p_user;
 delete from message_reactions where user_id=p_user;
 delete from message_attachments where uploaded_by=p_user;
 delete from conversation_typing where user_id=p_user;
 delete from conversation_member_settings where user_id=p_user;
 delete from exchange_notes where user_id=p_user;
 update conversations c set last_message='[Deleted member message]',payload='{}' where exists(select 1 from messages m where m.conversation_id=c.id and m.sender_id=p_user and m.created_at=c.last_message_at);
 update messages set content='[Deleted member message]',metadata='{}',payload='{}' where sender_id=p_user;
 update marketplace_requests set title='[Deleted request]',description='',attachments='[]',payload='{}',status='closed' where requester_id=p_user;
 update marketplace_applications set cover_message='',portfolio_links='{}',payload='{}' where applicant_id=p_user;
 update exchange_requests set message='',payload='{}' where sender_id=p_user;
 update reviews set comment='',payload='{}' where reviewer_id=p_user;
 update billing_accounts set payment_method=null,customer_id=null,subscription_id=null where user_id=p_user;
 delete from firebase_storage_objects where owner_id=p_user;
 update users set email=null,username=null,full_name='Deleted member',photo_url=null,bio=null,headline=null,profession=null,country=null,time_zone=null,account_status='deleted',is_verified=false,payload='{}',updated_at=now() where id=p_user;
 update account_deletion_requests set completed_at=now(),error=null where user_id=p_user;
end $$;
