-- Existing Neon installations created the guard under its original name.
-- Rename only the database objects; escrow rows are not modified.
do $$
begin
  if to_regprocedure('public.strip_escrow_payload_duplicates()') is not null then
    if to_regprocedure('public.normalize_escrow_payload()') is not null then
      raise exception 'Both escrow payload guard functions exist';
    end if;
    execute 'alter function public.strip_escrow_payload_duplicates() rename to normalize_escrow_payload';
  end if;

  if exists (
    select 1 from pg_trigger
    where tgrelid = 'public.escrows'::regclass
      and tgname = 'escrows_strip_payload_duplicates'
  ) then
    if exists (
      select 1 from pg_trigger
      where tgrelid = 'public.escrows'::regclass
        and tgname = 'escrows_normalize_payload'
    ) then
      raise exception 'Both escrow payload guard triggers exist';
    end if;
    execute 'alter trigger escrows_strip_payload_duplicates on public.escrows rename to escrows_normalize_payload';
  end if;
end;
$$;
