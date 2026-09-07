alter table firebase_storage_objects
  add column if not exists target_bucket text,
  add column if not exists target_key text,
  add column if not exists sha256 text,
  add column if not exists migrated_at timestamptz;

create unique index if not exists firebase_storage_objects_target_unique
  on firebase_storage_objects (target_bucket, target_key)
  where target_bucket is not null and target_key is not null;
