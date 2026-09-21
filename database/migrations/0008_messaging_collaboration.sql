create table if not exists conversation_archives (
  conversation_id text not null references conversations(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  archived_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists conversation_notes (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  content text not null check (char_length(content) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table if not exists message_reactions (
  message_id text not null references messages(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists message_pins (
  message_id text primary key references messages(id) on delete cascade,
  conversation_id text not null references conversations(id) on delete cascade,
  pinned_by text not null references users(id) on delete cascade,
  pinned_at timestamptz not null default now()
);

create table if not exists message_reports (
  id text primary key,
  message_id text not null references messages(id) on delete cascade,
  conversation_id text not null references conversations(id) on delete cascade,
  reporter_id text not null references users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open','reviewed','resolved')),
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

create table if not exists blocked_users (
  blocker_id text not null references users(id) on delete cascade,
  blocked_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists message_attachments (
  id text primary key,
  message_id text not null references messages(id) on delete cascade,
  conversation_id text not null references conversations(id) on delete cascade,
  uploaded_by text not null references users(id) on delete cascade,
  object_key text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 255),
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);

create index if not exists conversation_archives_user_idx on conversation_archives (user_id, archived_at desc);
create index if not exists conversation_notes_user_idx on conversation_notes (user_id, updated_at desc);
create index if not exists message_reactions_message_idx on message_reactions (message_id, created_at);
create index if not exists message_pins_conversation_idx on message_pins (conversation_id, pinned_at desc);
create index if not exists message_reports_status_idx on message_reports (status, created_at desc);
create index if not exists message_attachments_conversation_idx on message_attachments (conversation_id, created_at desc);
create index if not exists messages_search_idx on messages using gin (to_tsvector('simple', coalesce(content,'')));
create table if not exists conversation_member_settings (
  conversation_id text not null references conversations(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  is_muted boolean not null default false,
  primary key (conversation_id, user_id)
);

create table if not exists conversation_typing (
  conversation_id text not null references conversations(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists conversation_typing_updated_idx on conversation_typing (conversation_id, updated_at desc);
