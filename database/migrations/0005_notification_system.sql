alter table notifications add column if not exists action_label text;
alter table notifications add column if not exists in_app_enabled boolean not null default true;

create index if not exists notifications_active_user_idx
  on notifications (user_id, is_read, created_at desc)
  where is_archived = false and in_app_enabled = true;

create or replace function normalize_notification()
returns trigger
language plpgsql
as $$
declare
  v_preferences jsonb;
  v_category_key text;
  v_category_enabled boolean;
  v_in_app_enabled boolean;
begin
  new.category := coalesce(new.category, case new.notification_type
    when 'exchange_request' then 'Exchanges'
    when 'request_update' then 'Exchanges'
    when 'application_received' then 'Marketplace'
    when 'application_accepted' then 'Marketplace'
    when 'exchange_started' then 'Exchanges'
    when 'milestone_completed' then 'Exchanges'
    when 'milestone_added' then 'Exchanges'
    when 'milestone_updated' then 'Exchanges'
    when 'file_uploaded' then 'Exchanges'
    when 'revision_requested' then 'Exchanges'
    when 'review_waiting' then 'Reviews'
    when 'exchange_completed' then 'Exchanges'
    when 'exchange_cancelled' then 'Exchanges'
    when 'dispute_opened' then 'Exchanges'
    when 'dispute_resolved' then 'Exchanges'
    when 'message_received' then 'Messages'
    when 'new_match' then 'Marketplace'
    when 'saved_request_updated' then 'Marketplace'
    when 'request_expiring' then 'Marketplace'
    when 'new_professional' then 'Marketplace'
    when 'hours_earned' then 'Ledger'
    when 'hours_reserved' then 'Ledger'
    when 'hours_released' then 'Ledger'
    when 'admin_adjustment' then 'Ledger'
    when 'new_review' then 'Reviews'
    when 'skill_endorsement' then 'Reviews'
    when 'trust_score_increased' then 'Trust Score'
    when 'achievement_unlocked' then 'Achievements'
    when 'verification_approved' then 'Account'
    when 'profile_incomplete' then 'Account'
    when 'subscription_renewed' then 'Billing'
    when 'payment_failed' then 'Billing'
    when 'security_alert' then 'Security'
    when 'community_update' then 'Community'
    else 'System'
  end);

  new.priority := coalesce(new.priority, case new.notification_type
    when 'security_alert' then 'Critical'
    when 'payment_failed' then 'Critical'
    when 'exchange_request' then 'High'
    when 'application_received' then 'High'
    when 'application_accepted' then 'High'
    when 'file_uploaded' then 'High'
    when 'revision_requested' then 'High'
    when 'review_waiting' then 'High'
    when 'request_expiring' then 'High'
    when 'dispute_opened' then 'Critical'
    when 'dispute_resolved' then 'High'
    else 'Normal'
  end);

  new.action_label := coalesce(new.action_label, case new.notification_type
    when 'exchange_request' then 'Review request'
    when 'request_update' then 'View exchange'
    when 'application_received' then 'Review application'
    when 'application_accepted' then 'Open exchange'
    when 'exchange_started' then 'Open workspace'
    when 'milestone_completed' then 'View milestone'
    when 'milestone_added' then 'View milestone'
    when 'milestone_updated' then 'View milestone'
    when 'file_uploaded' then 'Review files'
    when 'revision_requested' then 'View revisions'
    when 'review_waiting' then 'Leave review'
    when 'exchange_completed' then 'View exchange'
    when 'exchange_cancelled' then 'View exchange'
    when 'dispute_opened' then 'View dispute'
    when 'dispute_resolved' then 'View resolution'
    when 'message_received' then 'Read message'
    when 'new_match' then 'View match'
    when 'saved_request_updated' then 'View request'
    when 'request_expiring' then 'Review request'
    when 'hours_earned' then 'View ledger'
    when 'hours_reserved' then 'View ledger'
    when 'hours_released' then 'View ledger'
    when 'admin_adjustment' then 'View ledger'
    when 'new_review' then 'View review'
    when 'skill_endorsement' then 'View profile'
    when 'trust_score_increased' then 'View profile'
    when 'achievement_unlocked' then 'View achievement'
    when 'profile_incomplete' then 'Complete profile'
    when 'verification_approved' then 'View profile'
    when 'payment_failed' then 'Update billing'
    when 'security_alert' then 'Review activity'
    else null
  end);

  select coalesce(payload->'notificationPreferences', '{}'::jsonb)
    into v_preferences from users where id = new.user_id;
  v_category_key := case new.category
    when 'Exchanges' then 'exchangeActivity'
    when 'Marketplace' then 'marketplace'
    when 'Messages' then 'messages'
    when 'Reviews' then 'reviews'
    when 'Trust Score' then 'reviews'
    when 'Achievements' then 'reviews'
    when 'Community' then 'community'
    else null
  end;
  v_category_enabled := case
    when new.category = 'Security' then true
    when v_category_key is null then true
    when v_preferences ? v_category_key then lower(coalesce(v_preferences->>v_category_key, 'true')) not in ('false', '0', 'off', 'no')
    else true
  end;
  v_in_app_enabled := case
    when new.category = 'Security' then true
    when v_preferences->'deliveryMethod' ? 'inApp'
      then lower(coalesce(v_preferences->'deliveryMethod'->>'inApp', 'true')) not in ('false', '0', 'off', 'no')
    else true
  end;
  new.in_app_enabled := v_category_enabled and v_in_app_enabled;
  new.payload := coalesce(new.payload, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'category', new.category,
    'priority', new.priority,
    'actionLabel', new.action_label,
    'isArchived', new.is_archived,
    'isRead', new.is_read
  ));
  return new;
end;
$$;

drop trigger if exists notifications_normalize_before_write on notifications;
create trigger notifications_normalize_before_write
before insert or update of notification_type, category, priority, action_label, user_id, payload
on notifications
for each row execute function normalize_notification();

update notifications set notification_type = case lower(title)
  when 'new application received' then 'application_received'
  when 'proposal accepted!' then 'application_accepted'
  when 'work submitted' then 'file_uploaded'
  when 'exchange cancelled' then 'exchange_cancelled'
  when 'dispute opened' then 'dispute_opened'
  when 'dispute resolved' then 'dispute_resolved'
  when 'milestone added' then 'milestone_added'
  when 'milestone updated' then 'milestone_updated'
  else notification_type
end,
category = null,
priority = null,
action_label = null
where notification_type = 'request_update';

update notifications
set notification_type = notification_type
where category is null or priority is null or action_label is null;
