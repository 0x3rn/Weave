-- Escrow state lives in relational columns. Keep payload only for legacy extra metadata.
drop trigger if exists escrows_strip_payload_duplicates on escrows;
drop function if exists strip_escrow_payload_duplicates();

create or replace function normalize_escrow_payload()
returns trigger language plpgsql as $$
begin
  new.payload := coalesce(new.payload, '{}'::jsonb) - array[
    'id', 'exchangeId', 'status', 'participants', 'participantIds',
    'timeline', 'dispute', 'createdAt', 'updatedAt'
  ];
  return new;
end;
$$;

drop trigger if exists escrows_normalize_payload on escrows;
create trigger escrows_normalize_payload
before insert or update on escrows
for each row execute function normalize_escrow_payload();

-- Preserve any legacy metadata while removing copies of authoritative fields.
update escrows set payload = payload - array[
  'id', 'exchangeId', 'status', 'participants', 'participantIds',
  'timeline', 'dispute', 'createdAt', 'updatedAt'
] where payload ?| array[
  'id', 'exchangeId', 'status', 'participants', 'participantIds',
  'timeline', 'dispute', 'createdAt', 'updatedAt'
];
