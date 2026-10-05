-- Notification history, durable action state, event delivery, and scheduled producers.
alter table notifications add column if not exists requires_action boolean not null default false;
alter table notifications add column if not exists action_resolved_at timestamptz;
alter table notifications add column if not exists related_user_id text references users(id) on delete set null;
alter table notifications add column if not exists group_key text;
alter table notifications add column if not exists why text;
create table if not exists notification_event_catalog (
 event_type text primary key, label text not null, category text not null, priority text not null,
 action_label text, why text not null, requires_action boolean not null, acknowledge boolean not null
);
create index if not exists notifications_history_idx on notifications(user_id,created_at desc,id desc) where in_app_enabled;
create index if not exists notifications_actions_idx on notifications(user_id,related_id) where requires_action;
create table if not exists notification_digest_deliveries (
 user_id text not null references users(id) on delete cascade, period text not null,
 claimed_at timestamptz, sent_at timestamptz, attempts integer not null default 0, primary key(user_id,period)
);
create table if not exists notification_member_checks (
 user_id text primary key references users(id) on delete cascade, checked_at timestamptz not null default now()
);
create table if not exists notification_achievement_awards (
 user_id text not null references users(id) on delete cascade, achievement_id text not null, awarded_at timestamptz not null default now(), primary key(user_id,achievement_id)
);
create table if not exists notification_announcements (
 id text primary key, author_id text references users(id) on delete set null, event_type text not null,
 title text not null, message text not null, link text, publish_at timestamptz not null default now(), published_at timestamptz
);
create table if not exists sign_in_failure_windows (
 key text primary key, window_at timestamptz not null default now(), attempts integer not null default 0
);
alter table marketplace_requests add column if not exists expires_at timestamptz;
create index if not exists marketplace_requests_expiry_idx on marketplace_requests(expires_at) where status='open';

create or replace function notification_needs_action(n notifications) returns boolean language sql stable as $$
 select n.requires_action and n.action_resolved_at is null and case
 when n.notification_type='exchange_request' then exists(select 1 from exchange_requests r where r.id=n.related_id and r.receiver_id=n.user_id and r.status='pending')
 when n.notification_type='application_received' then exists(select 1 from marketplace_applications a join marketplace_requests r on r.id=a.request_id where r.requester_id=n.user_id and r.status='open' and a.status in('pending','shortlisted') and case when n.payload->>'applicationId' is not null then a.id=n.payload->>'applicationId' else r.id=n.related_id end)
 when n.notification_type='proposal_updated' and n.payload->>'applicationId' is not null then exists(select 1 from marketplace_applications a join marketplace_requests r on r.id=a.request_id where a.id=n.payload->>'applicationId' and r.requester_id=n.user_id and r.status='open' and a.status in('pending','shortlisted'))
 when n.notification_type in('application_accepted','proposal_updated','exchange_approval_reminder') then exists(select 1 from exchanges e join exchange_contracts c on c.exchange_id=e.id where e.id=n.related_id and n.user_id in(e.requester_id,e.provider_id) and e.status='pending_proposal' and not exists(select 1 from exchange_contract_approvals a where a.exchange_id=e.id and a.user_id=n.user_id and a.contract_fingerprint=c.contract_fingerprint))
 when n.notification_type in('file_uploaded','review_waiting','exchange_review_reminder') then exists(select 1 from exchanges e where e.id=n.related_id and n.user_id in(e.requester_id,e.provider_id) and e.status='in_review' and (e.is_mutual or n.user_id=e.requester_id) and not exists(select 1 from exchange_review_decisions d where d.exchange_id=e.id and d.review_round=e.review_round and d.reviewer_id=n.user_id))
 when n.notification_type='revision_requested' then exists(select 1 from exchanges e where e.id=n.related_id and e.status='revision_requested' and n.user_id in(e.requester_id,e.provider_id) and coalesce(e.payload->'pendingSubmissions',jsonb_build_array(e.provider_id)) ? n.user_id)
 when n.notification_type='exchange_completed' then exists(select 1 from exchanges e where e.id=n.related_id and e.status='completed' and n.user_id in(e.requester_id,e.provider_id) and not exists(select 1 from reviews r where r.exchange_id=e.id and r.reviewer_id=n.user_id))
 when n.notification_type='dispute_opened' then exists(select 1 from escrows s join exchanges e on e.id=s.exchange_id where e.id=n.related_id and n.user_id in(e.requester_id,e.provider_id) and s.status='disputed')
 when n.notification_type='payment_failed' then exists(select 1 from billing_accounts b where b.user_id=n.user_id and b.subscription_status in('attention','past_due'))
 when n.notification_type='subscription_renewal_reminder' then exists(select 1 from billing_accounts b where b.user_id=n.user_id and b.subscription_status='active' and b.renewal_at>now() and b.renewal_at<=now()+interval '3 days' and b.renewal_at::text=coalesce(n.payload->>'renewalAt',b.renewal_at::text))
 when n.notification_type='profile_incomplete' then exists(select 1 from users u where u.id=n.user_id and coalesce(u.profile_completion,0)<80 and (coalesce(u.photo_url,'')='' or coalesce(u.bio,'')='' or not exists(select 1 from portfolio_items p where p.user_id=u.id)))
 when n.notification_type='request_expiring' then exists(select 1 from marketplace_requests r where r.id=n.related_id and r.requester_id=n.user_id and r.status='open' and r.expires_at>now() and r.expires_at<=now()+interval '1 day')
 when n.notification_type='milestone_reminder' then exists(select 1 from exchange_milestones m join exchanges e on e.id=m.exchange_id where e.id=n.related_id and n.user_id in(e.requester_id,e.provider_id) and e.status in('in_progress','revision_requested') and m.status<>'completed')
 else true end
$$;

create or replace function notification_event_channel(p jsonb,kind text,event text) returns boolean language plpgsql stable as $$
declare k text; legacy text;
begin
 if exists(select 1 from notification_event_catalog where event_type=event and category='Security') then return true; end if;
 k:=settings_notification_category(event);
 legacy:=case k when 'applications' then 'exchangeActivity' when 'messages' then 'messages' when 'reviews' then 'reviews' when 'trustScore' then 'reviews' when 'marketplace' then 'marketplace' when 'announcements' then 'community' else 'exchangeActivity' end;
 return coalesce((p->'events'->kind->>event)::boolean,(p->'channels'->kind->>k)::boolean,
  coalesce((p->'deliveryMethod'->>kind)::boolean,kind='inApp') and coalesce((p->>legacy)::boolean,true));
end $$;

create or replace function enrich_notification_event() returns trigger language plpgsql as $$
declare event_meta notification_event_catalog; exchange_key text; actor text;
begin
 select * into event_meta from notification_event_catalog where event_type=new.notification_type;
 if found then
  new.category:=event_meta.category; new.priority:=event_meta.priority; new.requires_action:=event_meta.requires_action;
  new.why:=coalesce(new.why,event_meta.why); new.action_label:=coalesce(event_meta.action_label,new.action_label);
 end if;
 if new.notification_type='exchange_completed' and new.related_id is not null then new.link:='/reviews/leave/'||new.related_id; end if;
 exchange_key:=substring(new.link from '^/exchanges/([^/]+)');
 if exchange_key is null and new.category='Messages' then select e.id into exchange_key from conversations c join exchanges e on e.id=c.context_id or e.id=c.id where c.id=new.related_id and c.conversation_type='exchange' and new.user_id in(e.requester_id,e.provider_id);end if;
 actor:=coalesce(new.related_user_id,new.payload->>'actorId');
 if actor is null and exchange_key is not null then select case when requester_id=new.user_id then provider_id else requester_id end into actor from exchanges where id=exchange_key and new.user_id in(requester_id,provider_id); end if;
 if actor is null and new.notification_type='application_received' then select applicant_id into actor from marketplace_applications where id=new.payload->>'applicationId'; end if;
 if actor is null and new.notification_type='exchange_request' then select sender_id into actor from exchange_requests where id=new.related_id; end if;
 new.related_user_id:=actor;
 new.group_key:=coalesce(new.group_key,case when exchange_key is not null then 'exchange:'||exchange_key||':'||coalesce(actor,'workspace') when new.category='Messages' and new.related_id is not null then 'conversation:'||new.related_id||':'||coalesce(actor,'member') end);
 new.in_app_enabled:=notification_event_channel((select payload->'notificationPreferences' from users where id=new.user_id),'inApp',new.notification_type);
 new.created_at:=coalesce(new.created_at,now());
 return new;
end $$;
drop trigger if exists notifications_zcatalog on notifications;
create trigger notifications_zcatalog before insert on notifications for each row execute function enrich_notification_event();

create or replace function enqueue_notification_email() returns trigger language plpgsql as $$
declare p jsonb; frequency text; due timestamptz; q jsonb; local_now timestamp; local_due timestamp; start_time time; end_time time; morning time; tz text; security boolean;
begin
 select payload->'notificationPreferences' into p from users where id=new.user_id;
 security:=new.category='Security';
 if not notification_event_channel(p,'email',new.notification_type) then return new; end if;
 frequency:=case when new.category='Messages' then nullif(p->>'messageFrequency','default') end;
 frequency:=coalesce(frequency,p->>'digest','instant');
 if not security and frequency='never' then return new; end if;
 due:=now();q:=p->'quietHours';tz:=coalesce(q->>'timeZone',(select time_zone from users where id=new.user_id),'UTC');
 if not exists(select 1 from pg_timezone_names where name=tz) then tz:='UTC'; end if;
 if not security then
  morning:=coalesce(p->'dailySummary'->>'time','08:00')::time;local_now:=now() at time zone tz;
  if frequency='daily' then local_due:=local_now::date+morning;if local_due<=local_now then local_due:=local_due+interval '1 day'; end if;due:=local_due at time zone tz;
  elsif frequency='weekly' then local_due:=date_trunc('week',local_now)+morning;if local_due<=local_now then local_due:=local_due+interval '7 days'; end if;due:=local_due at time zone tz; end if;
  if coalesce((q->>'enabled')::boolean,false) then
   local_due:=due at time zone tz;start_time:=coalesce(q->>'start','22:00')::time;end_time:=coalesce(q->>'end','07:00')::time;
   if (start_time<end_time and local_due::time>=start_time and local_due::time<end_time) or (start_time>end_time and (local_due::time>=start_time or local_due::time<end_time)) then due:=(local_due::date+end_time+case when start_time>end_time and local_due::time>=start_time then interval '1 day' else interval '0 days' end) at time zone tz;end if;
  end if;
 end if;
 insert into notification_email_queue(notification_id,user_id,due_at) values(new.id,new.user_id,due) on conflict do nothing;
 return new;
end $$;

create or replace function publish_member_notification(p_key text,p_user text,p_type text,p_title text,p_message text,p_link text,p_related text default null,p_data jsonb default '{}') returns void language sql as $$
 insert into notifications(id,source_path,user_id,notification_type,title,message,link,related_id,created_at,payload)
 select 'event-'||md5(p_key||':'||p_user),'events/'||p_key||'/'||p_user,p_user,p_type,p_title,p_message,p_link,p_related,now(),p_data from users where id=p_user and coalesce(account_status,'active')='active'
 on conflict do nothing
$$;

create or replace function notify_member_account_changes() returns trigger language plpgsql as $$
begin
 if new.email is distinct from old.email and old.email is not null and new.email is not null then perform publish_member_notification('email:'||new.id||':'||new.email||':'||now()::text,new.id,'email_changed','Email changed successfully','Your verified email address was updated.','/settings/security');end if;
 if new.trust_score is distinct from old.trust_score then perform publish_member_notification('trust:'||new.id||':'||old.trust_score||':'||new.trust_score||':'||now()::text,new.id,case when new.trust_score>old.trust_score then 'trust_score_increased' else 'trust_score_decreased' end,'Trust Score updated','Your Trust Score changed from '||old.trust_score||' to '||new.trust_score||'.','/profile',null,jsonb_build_object('oldScore',old.trust_score,'score',new.trust_score));end if;
 return new;
end $$;
drop trigger if exists users_notification_changes on users;
create trigger users_notification_changes after update of email,trust_score on users for each row execute function notify_member_account_changes();

create or replace function notify_member_billing_event() returns trigger language plpgsql as $$
begin
 perform publish_member_notification('billing:'||new.id,new.user_id,case when new.event_type='renewal' then 'subscription_renewed' else 'subscription_started' end,case when new.event_type='renewal' then 'Subscription renewed' else 'Subscription confirmed' end,new.description||'. '||new.currency||' '||to_char(new.amount/100.0,'FM999999990.00')||'.','/settings/billing',new.id);
 return new;
end $$;
drop trigger if exists billing_events_notification on billing_events;
create trigger billing_events_notification after insert on billing_events for each row execute function notify_member_billing_event();
create or replace function notify_member_payment_failure() returns trigger language plpgsql as $$
begin
 if new.subscription_status in('attention','past_due') and (tg_op='INSERT' or old.subscription_status is distinct from new.subscription_status) then perform publish_member_notification('payment-failed:'||new.user_id||':'||now()::text,new.user_id,'payment_failed','Subscription payment failed','Update your payment method to keep your subscription active.','/settings/billing');end if;return new;
end $$;
drop trigger if exists billing_accounts_notification on billing_accounts;
create trigger billing_accounts_notification after insert or update of subscription_status on billing_accounts for each row execute function notify_member_payment_failure();
create or replace function notify_member_refund() returns trigger language plpgsql as $$
begin
 if new.entry_type='Refunded' then perform publish_member_notification('refund:'||new.id,new.user_id,'escrow_refunded','Escrow refunded',coalesce(new.description,'Your reserved hours were refunded.')||' ('||new.amount||' Skill Hours).','/wallet/ledger',new.exchange_id);end if;return new;
end $$;
drop trigger if exists ledger_refund_notification on ledger_entries;
create trigger ledger_refund_notification after insert on ledger_entries for each row execute function notify_member_refund();
create or replace function notify_member_proposal_change() returns trigger language plpgsql as $$
declare target text;
begin
 if new.status in('pending','shortlisted') and (new.cover_message is distinct from old.cover_message or new.estimated_hours is distinct from old.estimated_hours or new.offered_hours is distinct from old.offered_hours) then select requester_id into target from marketplace_requests where id=new.request_id;perform publish_member_notification('proposal:'||new.id||':'||now()::text,target,'proposal_updated','Proposal updated','An applicant updated their proposed work. Review the application before making a decision.','/dashboard/requests/'||new.request_id,new.request_id,jsonb_build_object('applicationId',new.id,'actorId',new.applicant_id));end if;return new;
end $$;
drop trigger if exists applications_proposal_notification on marketplace_applications;
create trigger applications_proposal_notification after update on marketplace_applications for each row execute function notify_member_proposal_change();

create or replace function notify_exchange_ready_for_review() returns trigger language plpgsql as $$
begin
 if new.status='in_review' and old.status is distinct from new.status then
  perform publish_member_notification('review-ready:'||new.id||':'||new.review_round,new.requester_id,'review_waiting','Your review is required','The deliverables for "'||new.title||'" are ready. Your private review is needed before completion.','/exchanges/'||new.id||'/files',new.id);
  if new.is_mutual then perform publish_member_notification('review-ready:'||new.id||':'||new.review_round,new.provider_id,'review_waiting','Your review is required','The deliverables for "'||new.title||'" are ready. Your private review is needed before completion.','/exchanges/'||new.id||'/files',new.id);end if;
 end if;return new;
end $$;
drop trigger if exists exchange_review_ready_notification on exchanges;
create trigger exchange_review_ready_notification after update of status on exchanges for each row execute function notify_exchange_ready_for_review();
create or replace function sync_marketplace_expiry() returns trigger language plpgsql as $$
begin
 if new.payload ? 'expiresAt' then new.expires_at:=nullif(new.payload->>'expiresAt','')::timestamptz;end if;return new;
end $$;
drop trigger if exists marketplace_expiry on marketplace_requests;
create trigger marketplace_expiry before insert or update of payload on marketplace_requests for each row execute function sync_marketplace_expiry();

create or replace function record_member_security_state(p_user text,p_state jsonb) returns void language plpgsql as $$
declare previous jsonb;
begin
 select payload->'securitySnapshot' into previous from users where id=p_user for update;
 if previous is not null then
  if p_state->>'passwordVersion' is distinct from previous->>'passwordVersion' then perform publish_member_notification('password:'||p_user||':'||coalesce(p_state->>'passwordVersion','0'),p_user,'password_updated','Password updated','Your account password was updated. Review your security settings if you did not make this change.','/settings/security');end if;
  if jsonb_array_length(coalesce(p_state->'factors','[]'))>jsonb_array_length(coalesce(previous->'factors','[]')) then perform publish_member_notification('mfa-enabled:'||p_user||':'||md5(p_state::text),p_user,'two_factor_enabled','Two-factor authentication enabled','An authenticator was added to your account.','/settings/security');
  elsif jsonb_array_length(coalesce(p_state->'factors','[]'))<jsonb_array_length(coalesce(previous->'factors','[]')) then perform publish_member_notification('mfa-disabled:'||p_user||':'||md5(previous::text)||':'||now()::text,p_user,'two_factor_disabled','Authenticator removed','An authenticator was removed from your account.','/settings/security');end if;
 end if;
 update users set payload=jsonb_set(payload,'{securitySnapshot}',p_state) where id=p_user;
end $$;

create or replace function generate_notification_reminders() returns integer language plpgsql as $$
declare count_new integer; day_key text:=to_char(now() at time zone 'UTC','YYYY-MM-DD');
begin
 with candidates as (
  select e.id related,e.title,e.requester_id uid,'exchange_review_reminder' kind,'Your partner is waiting for your review' title_text,'Review the deliverables for "'||e.title||'" to move this exchange forward.' message_text,'/exchanges/'||e.id||'/files' href from exchanges e where e.status='in_review' and e.updated_at<now()-interval '1 day' and not exists(select 1 from exchange_review_decisions d where d.exchange_id=e.id and d.review_round=e.review_round and d.reviewer_id=e.requester_id)
  union all select e.id,e.title,e.provider_id,'exchange_review_reminder','Your partner is waiting for your review','Review the deliverables for "'||e.title||'" to move this exchange forward.','/exchanges/'||e.id||'/files' from exchanges e where e.is_mutual and e.status='in_review' and e.updated_at<now()-interval '1 day' and not exists(select 1 from exchange_review_decisions d where d.exchange_id=e.id and d.review_round=e.review_round and d.reviewer_id=e.provider_id)
  union all select e.id,e.title,p.uid,'exchange_approval_reminder','Your contract is waiting for approval','Review and approve the contract for "'||e.title||'" before work begins.','/exchanges/'||e.id||'/start' from exchanges e join exchange_contracts c on c.exchange_id=e.id cross join lateral (values(e.requester_id),(e.provider_id)) p(uid) where e.status='pending_proposal' and e.updated_at<now()-interval '1 day' and not exists(select 1 from exchange_contract_approvals a where a.exchange_id=e.id and a.user_id=p.uid and a.contract_fingerprint=c.contract_fingerprint)
  union all select e.id,e.title,e.provider_id,'milestone_reminder','Only one milestone remains','Complete the remaining milestone for "'||e.title||'".','/exchanges/'||e.id||'/milestones' from exchanges e where e.status='in_progress' and e.updated_at<now()-interval '1 day' and (select count(*) from exchange_milestones m where m.exchange_id=e.id and m.status<>'completed')=1
  union all select r.id,r.title,r.requester_id,'request_expiring','Your request expires soon','Extend "'||r.title||'" if you still want applications.','/marketplace/'||r.id||'/edit' from marketplace_requests r where r.status='open' and r.expires_at>now() and r.expires_at<=now()+interval '1 day'
  union all select null,null,b.user_id,'subscription_renewal_reminder','Your subscription renews soon','Review your payment method and upcoming renewal in Billing.','/settings/billing' from billing_accounts b where b.subscription_status='active' and b.renewal_at>now() and b.renewal_at<=now()+interval '3 days'
  union all select null,null,u.id,'inactive_reminder','Your collaborators may be waiting','You have been away for at least five days. Check your messages and active exchanges.','/dashboard' from users u where u.last_active_at<now()-interval '5 days' and exists(select 1 from exchanges e where u.id in(e.requester_id,e.provider_id) and e.status not in('completed','cancelled')) and not exists(select 1 from notifications n where n.user_id=u.id and n.notification_type='inactive_reminder' and n.created_at>now()-interval '7 days')
  union all select null,null,u.id,'profile_incomplete','Complete your profile','Add your skills, a photo, and portfolio work to improve discoverability.','/profile' from users u where u.onboarded and coalesce(u.profile_completion,0)<80 and (coalesce(u.photo_url,'')='' or coalesce(u.bio,'')='' or not exists(select 1 from portfolio_items p where p.user_id=u.id)) and not exists(select 1 from notifications n where n.user_id=u.id and n.notification_type='profile_incomplete' and n.created_at>now()-interval '7 days')
 ), inserted as (
 insert into notifications(id,source_path,user_id,notification_type,title,message,link,related_id,created_at,payload)
 select 'reminder-'||md5(c.kind||':'||coalesce(c.related,'account')||':'||c.uid||':'||day_key),'reminders/'||c.kind||'/'||coalesce(c.related,'account')||'/'||c.uid||'/'||day_key,c.uid,c.kind,c.title_text,c.message_text,c.href,c.related,now(),'{}'::jsonb from candidates c join users u on u.id=c.uid where coalesce(u.account_status,'active')='active' on conflict do nothing returning id
 ) select count(*) into count_new from inserted;
 return count_new;
end $$;

insert into notification_event_catalog(event_type,label,category,priority,action_label,why,requires_action,acknowledge) values
('exchange_request','Exchange requests','Exchanges','High','Review request','Accept or decline this request so your partner can plan their work.',true,false),
('request_update','Request decisions','Exchanges','Normal','View exchange','Your collaboration request has a new decision.',false,false),
('application_received','Applications received','Marketplace','High','Review application','Review this application to decide who to collaborate with.',true,false),
('application_accepted','Applications accepted','Exchanges','High','Review contract','Both members must approve the contract before work can begin.',true,false),
('proposal_updated','Proposal changes','Exchanges','High','Review proposal','Review the updated terms before confirming your collaboration.',true,false),
('exchange_started','Exchanges started','Exchanges','Normal','Open workspace','Your contract is approved and the workspace is ready for work.',false,false),
('milestone_completed','Milestones completed','Exchanges','Normal','Review milestone','This milestone moves your exchange closer to delivery.',false,false),
('milestone_added','Milestones added','Exchanges','Normal','View milestone','Check the milestone and its deadline to plan your next steps.',false,false),
('milestone_updated','Milestone changes','Exchanges','Normal','View milestone','Your exchange plan has changed.',false,false),
('file_uploaded','Deliverables uploaded','Exchanges','High','Review deliverables','When all submissions are ready, reviewing them moves the exchange toward completion.',true,false),
('revision_requested','Revisions requested','Exchanges','High','Submit revisions','Submit the requested changes so your partner can review again.',true,false),
('review_waiting','Review requests','Exchanges','High','Review now','Your decision is needed before this exchange can proceed.',true,false),
('exchange_completed','Exchanges completed','Exchanges','Normal','Leave review','A review helps your partner build trust with future collaborators.',true,false),
('exchange_cancelled','Exchanges cancelled','Exchanges','Normal','View exchange','Check the workspace and ledger for the final outcome.',false,false),
('dispute_opened','Disputes opened','Exchanges','Critical','View dispute','Review the dispute and provide the information needed for a fair resolution.',true,false),
('dispute_resolved','Dispute decisions','Exchanges','High','View resolution','The decision explains the outcome and any ledger adjustment.',false,false),
('message_received','New messages','Messages','Normal','Read message','Read your partner''s message to keep your collaboration moving.',false,false),
('new_match','Recommended opportunities','Marketplace','Normal','View opportunity','This opportunity matches skills on your profile.',false,false),
('saved_request_updated','Saved request changes','Marketplace','Normal','Open request','Check the updated requirements before deciding to apply.',false,false),
('request_expiring','Requests expiring','Marketplace','High','Extend request','Extend the request if you still want to receive applications.',true,false),
('new_professional','Relevant new professionals','Marketplace','Low','View profile','A verified member in your region offers skills relevant to your profile.',false,false),
('hours_earned','Skill Hours earned','Ledger','Normal','View ledger','Your completed work has increased your available Skill Hours.',false,false),
('hours_reserved','Skill Hours reserved','Ledger','Normal','View ledger','These hours are held for an active exchange.',false,false),
('hours_released','Skill Hours released','Ledger','Normal','View transaction','Review the transaction to see how your balance changed.',false,false),
('admin_adjustment','Balance adjustments','Ledger','Normal','View details','The ledger records the reason for this adjustment.',false,false),
('escrow_refunded','Escrow refunds','Billing','Normal','View transaction','Reserved hours have been returned to your balance.',false,false),
('new_review','Reviews received','Reviews','Normal','Read review','Your partner''s feedback contributes to your reputation.',false,false),
('skill_endorsement','Skill endorsements','Reviews','Normal','View profile','Your collaborator has recognized skills you demonstrated.',false,false),
('trust_score_increased','Trust Score increases','Trust Score','Normal','See why','Your record of reliable collaboration has improved.',false,false),
('trust_score_decreased','Trust Score decreases','Trust Score','High','See why','Review your recent feedback and account standing.',false,false),
('achievement_unlocked','Achievements unlocked','Achievements','Normal','View badge','This badge recognizes a meaningful collaboration milestone.',false,false),
('weekly_streak','Collaboration streaks','Achievements','Normal','View achievements','Your consistent collaboration is building a strong track record.',false,false),
('verification_approved','Verification decisions','Account','Normal','View profile','Your account is now recognized as a Verified Member.',false,false),
('profile_incomplete','Profile completion reminders','Account','Low','Complete profile','A complete profile helps members understand your skills and discover your work.',true,false),
('email_changed','Email changes','Security','Critical','Review security','If you did not make this change, secure your account immediately.',true,true),
('password_updated','Password changes','Security','High','Review security','Your sign-in password has changed. Review security if this was unexpected.',true,true),
('two_factor_enabled','Two-factor enabled','Security','Normal','View security','Your authenticator adds protection to future sign-ins.',false,false),
('two_factor_disabled','Two-factor disabled','Security','Critical','Review security','Your account no longer has this additional sign-in protection.',true,true),
('security_alert','New sign-ins','Security','Critical','Review activity','Confirm this was you; sign out unfamiliar devices and secure your account.',true,true),
('failed_login_attempts','Repeated failed sign-ins','Security','Critical','Secure account','Repeated unsuccessful attempts were verified by your sign-in provider.',true,true),
('subscription_renewed','Subscription renewals','Billing','Normal','View billing','Your subscription payment and receipt are available in Billing.',false,false),
('subscription_started','Subscription confirmations','Billing','Normal','View billing','Your subscription is confirmed and the payment receipt is available.',false,false),
('payment_failed','Payment failures','Billing','Critical','Update payment method','Update your payment method to keep your subscription active.',true,false),
('subscription_renewal_reminder','Upcoming renewals','Billing','High','Manage subscription','Review your subscription before the next renewal.',true,false),
('exchange_review_reminder','Waiting review reminders','Exchanges','High','Review now','Your partner is waiting for your review decision.',true,false),
('exchange_approval_reminder','Waiting contract reminders','Exchanges','High','Review contract','Your partner cannot begin until the contract is approved.',true,false),
('milestone_reminder','Remaining milestone reminders','Exchanges','Normal','View milestones','Completing the remaining milestone will move your exchange toward delivery.',true,false),
('inactive_reminder','Collaboration check-ins','Account','Low','Open dashboard','Check your messages and active exchanges to keep partners informed.',false,false),
('welcome_members','New member summaries','Community','Low','Explore marketplace','Explore the community''s newest collaborators.',false,false),
('community_update','Community announcements','Community','Low','Read more','Stay informed about opportunities to connect with other members.',false,false),
('community_event','Community events','Community','Low','Register','Join members for a scheduled community event.',false,false),
('newsletter','Newsletters','Community','Low','Read newsletter','Catch up on news and opportunities across Weave.',false,false),
('platform_update','Platform announcements','System','Low','Read more','Learn about changes that affect how you use Weave.',false,false),
('maintenance','Scheduled maintenance','System','Normal','View details','Plan your work around this maintenance window.',false,false),
('feature_released','New features','System','Low','Read more','Explore the new tools available in Weave.',false,false),
('bug_fix','Bug fixes','System','Low','Read more','This update improves the reliability of your workspace.',false,false),
('performance_update','Performance updates','System','Low','Read more','This update improves how Weave runs.',false,false),
('system','Other system updates','System','Low','Open resource','Check the details for any effect on your account.',false,false)
on conflict(event_type) do update set label=excluded.label,category=excluded.category,priority=excluded.priority,action_label=excluded.action_label,why=excluded.why,requires_action=excluded.requires_action,acknowledge=excluded.acknowledge;
update notifications n set category=c.category,priority=c.priority,action_label=c.action_label,requires_action=c.requires_action,why=coalesce(n.why,c.why),link=case when n.notification_type='exchange_completed' and n.related_id is not null then '/reviews/leave/'||n.related_id else n.link end from notification_event_catalog c where n.notification_type=c.event_type;

-- Expiry applies immediately, including the interval between scheduled maintenance runs.
create or replace function reject_expired_marketplace_work() returns trigger language plpgsql as $$
declare request_key text;
begin
 request_key:=case when tg_table_name='marketplace_applications' then to_jsonb(new)->>'request_id' else to_jsonb(new)->>'marketplace_request_id' end;
 if request_key is not null and exists(select 1 from marketplace_requests where id=request_key and (status='expired' or expires_at<=now())) then raise exception 'This request has expired. The owner must extend it before new work can begin.';end if;
 return new;
end $$;
drop trigger if exists applications_expiry_guard on marketplace_applications;
create trigger applications_expiry_guard before insert on marketplace_applications for each row execute function reject_expired_marketplace_work();
drop trigger if exists exchanges_expiry_guard on exchanges;
create trigger exchanges_expiry_guard before insert on exchanges for each row execute function reject_expired_marketplace_work();

-- Account erasure keeps required platform records while removing delivery and preference metadata.
create or replace function erase_member_notification_metadata() returns trigger language plpgsql as $$
begin
 if new.account_status='deleted' and old.account_status is distinct from new.account_status then
  delete from notification_digest_deliveries where user_id=new.id;
  delete from notification_member_checks where user_id=new.id;
  delete from notification_achievement_awards where user_id=new.id;
  delete from sign_in_failure_windows where key='member:'||new.id;
  update notification_announcements set author_id=null where author_id=new.id;
 end if;return new;
end $$;
drop trigger if exists users_erase_notification_metadata on users;
create trigger users_erase_notification_metadata after update of account_status on users for each row execute function erase_member_notification_metadata();
update notifications set in_app_enabled=true where category='Security';
