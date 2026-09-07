-- Initial relational schema for the Firestore-to-Neon migration.
-- Apply this file to a fresh Neon branch before enabling MIGRATION_APPLY.

create table if not exists users (
  id text primary key,
  email text,
  username text,
  full_name text,
  photo_url text,
  profession text,
  headline text,
  bio text,
  country text,
  time_zone text,
  skill_hours integer not null default 0,
  trust_score integer not null default 0,
  role text,
  account_status text,
  is_verified boolean not null default false,
  onboarded boolean not null default false,
  profile_completion integer,
  created_at timestamptz,
  last_active_at timestamptz,
  updated_at timestamptz,
  payload jsonb not null default '{}'::jsonb
);

create unique index if not exists users_email_unique on users (lower(email)) where email is not null;
create unique index if not exists users_username_unique on users (lower(username)) where username is not null;

create table if not exists invite_applications (
  id text primary key,
  email text,
  full_name text,
  status text,
  submitted_at timestamptz,
  approved_at timestamptz,
  payload jsonb not null
);

create table if not exists invites (
  id text primary key,
  code text,
  email text,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  payload jsonb not null
);

create unique index if not exists invites_code_unique on invites (code) where code is not null;

create table if not exists marketplace_requests (
  id text primary key,
  requester_id text references users(id) on delete set null,
  title text,
  description text,
  category text,
  skills_required text[] not null default '{}',
  deliverables jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  estimated_hours text,
  exchange_type text,
  timeline text,
  status text,
  is_mutual boolean not null default false,
  applicants_count integer not null default 0,
  created_at timestamptz,
  updated_at timestamptz,
  payload jsonb not null
);

create index if not exists marketplace_requests_browse_idx on marketplace_requests (status, category, created_at desc);
create index if not exists marketplace_requests_requester_idx on marketplace_requests (requester_id, created_at desc);

create table if not exists marketplace_applications (
  id text primary key,
  request_id text references marketplace_requests(id) on delete cascade,
  applicant_id text references users(id) on delete set null,
  cover_message text,
  portfolio_links text[] not null default '{}',
  availability text,
  estimated_hours integer,
  status text,
  is_mutual_proposal boolean not null default false,
  offered_hours integer,
  estimated_completion_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  payload jsonb not null
);

create unique index if not exists marketplace_applications_request_applicant_unique
  on marketplace_applications (request_id, applicant_id) where request_id is not null and applicant_id is not null;

create table if not exists exchange_requests (
  id text primary key,
  sender_id text references users(id) on delete set null,
  receiver_id text references users(id) on delete set null,
  skill_needed text,
  date_options jsonb not null default '[]'::jsonb,
  time_needed text,
  hours_needed integer,
  message text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  payload jsonb not null
);

create index if not exists exchange_requests_sender_idx on exchange_requests (sender_id, created_at desc);
create index if not exists exchange_requests_receiver_idx on exchange_requests (receiver_id, created_at desc);

create table if not exists exchanges (
  id text primary key,
  marketplace_request_id text references marketplace_requests(id) on delete set null,
  marketplace_application_id text references marketplace_applications(id) on delete set null,
  requester_id text references users(id) on delete set null,
  provider_id text references users(id) on delete set null,
  title text,
  skill_hours integer not null default 0,
  requester_escrow_hours integer not null default 0,
  provider_escrow_hours integer not null default 0,
  status text not null,
  is_mutual boolean not null default false,
  deadline_at timestamptz,
  progress integer,
  created_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz,
  payload jsonb not null
);

create index if not exists exchanges_requester_idx on exchanges (requester_id, status, updated_at desc);
create index if not exists exchanges_provider_idx on exchanges (provider_id, status, updated_at desc);

create table if not exists exchange_deliveries (
  id text primary key,
  exchange_id text not null references exchanges(id) on delete cascade,
  submitted_by text references users(id) on delete set null,
  version integer,
  files jsonb not null default '[]'::jsonb,
  comments text,
  submitted_at timestamptz,
  payload jsonb not null
);

create table if not exists exchange_activity (
  id text primary key,
  exchange_id text not null references exchanges(id) on delete cascade,
  actor_id text references users(id) on delete set null,
  event_type text,
  description text,
  occurred_at timestamptz,
  payload jsonb not null
);

create table if not exists escrows (
  id text primary key,
  exchange_id text references exchanges(id) on delete set null,
  status text,
  participants jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  dispute jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  payload jsonb not null
);

create unique index if not exists escrows_exchange_unique on escrows (exchange_id) where exchange_id is not null;

create table if not exists ledger_entries (
  id text primary key,
  source_collection text not null,
  user_id text references users(id) on delete set null,
  exchange_id text references exchanges(id) on delete set null,
  related_user_id text references users(id) on delete set null,
  entry_type text,
  entry_status text,
  amount integer not null default 0,
  balance_before integer,
  balance_after integer,
  description text,
  notes text,
  occurred_at timestamptz,
  payload jsonb not null
);

create index if not exists ledger_entries_user_idx on ledger_entries (user_id, occurred_at desc);
create index if not exists ledger_entries_exchange_idx on ledger_entries (exchange_id, occurred_at desc);

create table if not exists conversations (
  id text primary key,
  conversation_type text,
  context_id text,
  last_message text,
  last_message_at timestamptz,
  unread_counts jsonb not null default '{}'::jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  payload jsonb not null
);

create table if not exists conversation_participants (
  conversation_id text not null references conversations(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id text primary key,
  conversation_id text not null,
  sender_id text references users(id) on delete set null,
  message_type text,
  content text,
  metadata jsonb,
  read_by text[] not null default '{}',
  created_at timestamptz,
  payload jsonb not null
);

create index if not exists messages_conversation_idx on messages (conversation_id, created_at);

create table if not exists reviews (
  id text primary key,
  exchange_id text references exchanges(id) on delete set null,
  reviewer_id text references users(id) on delete set null,
  target_user_id text references users(id) on delete set null,
  rating smallint check (rating between 1 and 5),
  comment text,
  is_positive boolean,
  created_at timestamptz,
  payload jsonb not null
);

create unique index if not exists reviews_exchange_reviewer_unique on reviews (exchange_id, reviewer_id)
  where exchange_id is not null and reviewer_id is not null;

create table if not exists notifications (
  id text primary key,
  source_path text not null unique,
  user_id text references users(id) on delete cascade,
  notification_type text,
  category text,
  priority text,
  title text,
  message text,
  is_read boolean not null default false,
  is_archived boolean not null default false,
  link text,
  related_id text,
  created_at timestamptz,
  payload jsonb not null
);

create index if not exists notifications_user_idx on notifications (user_id, is_read, created_at desc);

create table if not exists user_devices (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  os text,
  browser text,
  device_type text,
  ip text,
  last_active_at timestamptz,
  payload jsonb not null
);

create table if not exists portfolio_items (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  title text,
  description text,
  image_url text,
  link text,
  technologies text[] not null default '{}',
  created_at timestamptz,
  payload jsonb not null
);

create table if not exists saved_items (
  user_id text not null references users(id) on delete cascade,
  target_id text not null,
  target_type text,
  saved_at timestamptz,
  payload jsonb not null,
  primary key (user_id, target_id)
);

create table if not exists firebase_storage_objects (
  path text primary key,
  bucket text not null,
  owner_id text references users(id) on delete set null,
  content_type text,
  size_bytes bigint,
  source_url text,
  created_at timestamptz,
  updated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists firebase_storage_objects_owner_idx on firebase_storage_objects (owner_id);
