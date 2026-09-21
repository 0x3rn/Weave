-- Preserve an append-only record of any legacy ledger status updates.
-- Existing workflow functions can still request a status transition, but the
-- original financial entry remains unchanged and the transition is auditable.
create table if not exists ledger_entry_events (
  id bigserial primary key,
  ledger_entry_id text not null references ledger_entries(id) on delete cascade,
  event_type text not null,
  previous_entry jsonb not null,
  requested_entry jsonb not null,
  occurred_at timestamptz not null default now()
);

create index if not exists ledger_entry_events_entry_idx
  on ledger_entry_events (ledger_entry_id, occurred_at desc, id desc);

create or replace function preserve_ledger_entry_update()
returns trigger language plpgsql as $$
begin
  if row(to_jsonb(old)) is distinct from row(to_jsonb(new)) then
    insert into ledger_entry_events(ledger_entry_id,event_type,previous_entry,requested_entry)
      values(old.id,'status_transition',to_jsonb(old),to_jsonb(new));
  end if;
  return old;
end;
$$;

drop trigger if exists ledger_entries_preserve_update on ledger_entries;
create trigger ledger_entries_preserve_update
  before update on ledger_entries
  for each row execute function preserve_ledger_entry_update();
