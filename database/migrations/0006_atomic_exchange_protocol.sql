alter table marketplace_applications add column if not exists hour_difference_choice text;
alter table marketplace_applications add column if not exists difference_deliverables jsonb not null default '[]'::jsonb;

alter table exchanges add column if not exists review_round integer not null default 1;
alter table exchanges add column if not exists reveal_at timestamptz;
alter table exchanges add column if not exists files_released_at timestamptz;

alter table exchange_deliveries add column if not exists review_round integer not null default 1;
alter table exchange_deliveries add column if not exists is_current boolean not null default false;

with ranked as (
  select id,row_number() over(partition by exchange_id,submitted_by order by submitted_at desc nulls last,version desc,id desc) as position
  from exchange_deliveries
)
update exchange_deliveries d set is_current=(ranked.position=1) from ranked where ranked.id=d.id;

create unique index if not exists exchange_deliveries_current_submitter_unique
  on exchange_deliveries(exchange_id,submitted_by) where is_current;
create index if not exists exchange_deliveries_review_idx
  on exchange_deliveries(exchange_id,review_round,is_current);

create table if not exists exchange_contracts (
  exchange_id text primary key references exchanges(id) on delete cascade,
  version integer not null default 1,
  exchange_type text not null check(exchange_type in ('standard','mutual')),
  requester_id text not null references users(id),
  provider_id text not null references users(id),
  requester_deliverables jsonb not null default '[]'::jsonb,
  provider_deliverables jsonb not null default '[]'::jsonb,
  requester_pays_hours integer not null check(requester_pays_hours > 0),
  provider_pays_hours integer not null default 0 check(provider_pays_hours >= 0),
  hour_difference integer not null default 0,
  difference_resolution text check(difference_resolution in ('none','waived','deliverables_increased')),
  deadline_at timestamptz,
  terms jsonb not null default '{}'::jsonb,
  contract_fingerprint text not null,
  created_at timestamptz not null default now()
);

create table if not exists exchange_contract_approvals (
  exchange_id text not null references exchange_contracts(exchange_id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  contract_fingerprint text not null,
  approved_at timestamptz not null default now(),
  primary key(exchange_id,user_id)
);

create table if not exists exchange_review_decisions (
  id text primary key,
  exchange_id text not null references exchanges(id) on delete cascade,
  review_round integer not null,
  reviewer_id text not null references users(id) on delete cascade,
  decision text not null check(decision in ('accept','revision')),
  feedback text,
  created_at timestamptz not null default now(),
  revealed_at timestamptz,
  unique(exchange_id,review_round,reviewer_id)
);

create index if not exists exchange_review_decisions_exchange_idx
  on exchange_review_decisions(exchange_id,review_round);

create or replace function prevent_exchange_contract_mutation()
returns trigger language plpgsql as $$
begin
  if tg_op='DELETE' and pg_trigger_depth()>1 then return old; end if;
  raise exception 'Exchange contracts are immutable';
end;
$$;

drop trigger if exists exchange_contracts_immutable on exchange_contracts;
create trigger exchange_contracts_immutable before update or delete on exchange_contracts
for each row execute function prevent_exchange_contract_mutation();

create or replace function create_exchange_from_application(
  p_actor_id text, p_application_id text, p_exchange_id text, p_escrow_id text,
  p_requester_ledger_id text, p_provider_ledger_id text, p_activity_id text,
  p_notification_id text, p_now timestamptz
) returns text language plpgsql as $$
declare
  v_app marketplace_applications%rowtype;
  v_request marketplace_requests%rowtype;
  v_requester_hours integer;
  v_original_requester_hours integer;
  v_provider_hours integer;
  v_original_provider_hours integer;
  v_mutual boolean;
  v_resolution text;
  v_requester_deliverables jsonb;
  v_provider_deliverables jsonb;
  v_contract jsonb;
  v_fingerprint text;
  v_offer_text text;
  v_hour_difference integer;
begin
  select * into v_app from marketplace_applications where id=p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  if v_app.status not in ('pending','shortlisted') then raise exception 'Application cannot be accepted'; end if;
  select * into v_request from marketplace_requests where id=v_app.request_id for update;
  if not found then raise exception 'Associated request not found'; end if;
  if v_request.requester_id<>p_actor_id then raise exception 'Unauthorized'; end if;
  if v_request.status<>'open' then raise exception 'Request is no longer open'; end if;
  if v_app.applicant_id is null or v_app.applicant_id=p_actor_id then raise exception 'Invalid applicant'; end if;

  v_mutual := v_request.is_mutual;
  if v_app.is_mutual_proposal<>v_mutual then raise exception 'Application exchange type does not match the request'; end if;
  v_requester_hours := v_app.estimated_hours;
  v_original_requester_hours := v_requester_hours;
  if v_requester_hours is null or v_requester_hours<1 or v_requester_hours>10000 then raise exception 'Invalid provider hours'; end if;
  v_provider_deliverables := case when v_mutual then coalesce(v_app.payload->'offeredDeliverables','[]'::jsonb) else coalesce(v_request.deliverables,'[]'::jsonb) end;
  if jsonb_typeof(v_provider_deliverables)<>'array' or jsonb_array_length(v_provider_deliverables)=0 then raise exception 'Provider deliverables are required'; end if;

  if v_mutual then
    v_offer_text := coalesce(v_request.payload->>'offeredHours','');
    if v_offer_text !~ '[0-9]+' then raise exception 'The requester offer must include a numeric hour estimate'; end if;
    v_original_provider_hours := (regexp_match(v_offer_text,'([0-9]+)'))[1]::integer;
    if v_original_provider_hours<1 or v_original_provider_hours>10000 then raise exception 'Invalid requester offer hours'; end if;
    v_hour_difference := abs(v_original_requester_hours-v_original_provider_hours);
    v_resolution := case when v_hour_difference=0 then 'none' when coalesce(v_app.hour_difference_choice,v_app.payload->>'hourDifferenceChoice','waive')='increase_deliverables' then 'deliverables_increased' else 'waived' end;
    v_provider_hours := v_original_provider_hours;
    v_requester_deliverables := coalesce(v_request.payload->'offeredDeliverables','[]'::jsonb);
    if v_resolution='deliverables_increased' then
      if jsonb_array_length(coalesce(v_app.difference_deliverables,v_app.payload->'differenceDeliverables','[]'::jsonb))=0 then raise exception 'Added deliverables are required to balance the exchange'; end if;
      if v_original_requester_hours>v_original_provider_hours then
        v_requester_deliverables := v_requester_deliverables || coalesce(v_app.difference_deliverables,v_app.payload->'differenceDeliverables','[]'::jsonb);
        v_provider_hours := v_original_requester_hours;
      elsif v_original_requester_hours<v_original_provider_hours then
        v_provider_deliverables := v_provider_deliverables || coalesce(v_app.difference_deliverables,v_app.payload->'differenceDeliverables','[]'::jsonb);
        v_requester_hours := v_original_provider_hours;
      end if;
    end if;
    if jsonb_array_length(v_requester_deliverables)=0 then raise exception 'Requester deliverables are required'; end if;
  else
    v_original_provider_hours := 0;
    v_provider_hours := 0;
    v_resolution := 'none';
    v_hour_difference := 0;
    v_requester_deliverables := '[]'::jsonb;
  end if;

  v_contract := jsonb_build_object(
    'version',1,'exchangeType',case when v_mutual then 'mutual' else 'standard' end,
    'requesterId',p_actor_id,'providerId',v_app.applicant_id,
    'requesterDeliverables',v_requester_deliverables,'providerDeliverables',v_provider_deliverables,
    'requesterPaysHours',v_requester_hours,'providerPaysHours',v_provider_hours,
    'originalProviderOfferHours',v_original_provider_hours,
    'hourDifference',v_hour_difference,'differenceResolution',v_resolution,
    'deadline',v_app.estimated_completion_at,'terms',jsonb_build_object('revisionsIncluded',2,'commitReveal',true,'independentDecisions',true)
  );
  v_fingerprint := md5(v_contract::text);

  insert into exchanges(id,marketplace_request_id,marketplace_application_id,requester_id,provider_id,title,skill_hours,requester_escrow_hours,provider_escrow_hours,status,is_mutual,deadline_at,progress,review_round,created_at,updated_at,payload)
  values(p_exchange_id,v_request.id,v_app.id,p_actor_id,v_app.applicant_id,v_request.title,v_requester_hours,v_requester_hours,v_provider_hours,'pending_proposal',v_mutual,v_app.estimated_completion_at,0,1,p_now,p_now,
    jsonb_build_object('requestId',v_request.id,'applicationId',v_app.id,'title',v_request.title,'requesterId',p_actor_id,'providerId',v_app.applicant_id,
      'participants',jsonb_build_array(p_actor_id,v_app.applicant_id),'skillHours',v_requester_hours,'requesterEscrowHours',v_requester_hours,'providerEscrowHours',v_provider_hours,
      'status','pending_proposal','isMutual',v_mutual,'deadline',v_app.estimated_completion_at,'progress',0,'reviewRound',1,'contractFingerprint',v_fingerprint,
      'providerDeliverables',v_provider_deliverables,'requesterDeliverables',v_requester_deliverables,'contractApprovals',jsonb_build_array(p_actor_id),'createdAt',p_now,'updatedAt',p_now));

  insert into exchange_contracts(exchange_id,exchange_type,requester_id,provider_id,requester_deliverables,provider_deliverables,requester_pays_hours,provider_pays_hours,hour_difference,difference_resolution,deadline_at,terms,contract_fingerprint,created_at)
  values(p_exchange_id,case when v_mutual then 'mutual' else 'standard' end,p_actor_id,v_app.applicant_id,v_requester_deliverables,v_provider_deliverables,v_requester_hours,v_provider_hours,v_hour_difference,v_resolution,v_app.estimated_completion_at,v_contract->'terms',v_fingerprint,p_now);
  insert into exchange_contract_approvals(exchange_id,user_id,contract_fingerprint,approved_at) values(p_exchange_id,p_actor_id,v_fingerprint,p_now);

  update marketplace_applications set status='accepted',updated_at=p_now,payload=payload || jsonb_build_object('status','accepted','exchangeId',p_exchange_id,'updatedAt',p_now) where id=v_app.id;
  update marketplace_requests set status='in_progress',updated_at=p_now,payload=payload || jsonb_build_object('status','in_progress','updatedAt',p_now) where id=v_request.id;
  insert into exchange_activity(id,exchange_id,actor_id,event_type,description,occurred_at,payload)
    values(p_activity_id,p_exchange_id,p_actor_id,'contract_proposed','Requester approved the final exchange contract. Waiting for the provider.',p_now,jsonb_build_object('type','contract_proposed','description','Requester approved the final exchange contract. Waiting for the provider.','timestamp',p_now));
  insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
    values(p_notification_id,'notifications/'||p_notification_id,v_app.applicant_id,'application_accepted','Contract Ready for Approval','Your proposal for "'||v_request.title||'" was selected. Review and approve the final contract before work begins.',false,false,'/exchanges/'||p_exchange_id||'/start',p_exchange_id,p_now,
      jsonb_build_object('type','application_accepted','title','Contract Ready for Approval','message','Review and approve the final contract before work begins.','isRead',false,'link','/exchanges/'||p_exchange_id||'/start','createdAt',p_now));
  return p_exchange_id;
end;
$$;

create or replace function approve_exchange_contract(
  p_actor_id text,p_exchange_id text,p_escrow_id text,p_requester_ledger_id text,p_provider_ledger_id text,
  p_activity_id text,p_requester_notification_id text,p_provider_notification_id text,p_now timestamptz
) returns text language plpgsql as $$
declare
  v_exchange exchanges%rowtype;
  v_contract exchange_contracts%rowtype;
  v_requester users%rowtype;
  v_provider users%rowtype;
  v_approval_count integer;
  v_participants jsonb;
  v_timeline jsonb;
  v_pending jsonb;
begin
  select * into v_exchange from exchanges where id=p_exchange_id for update;
  if not found then raise exception 'Exchange not found'; end if;
  if p_actor_id not in (v_exchange.requester_id,v_exchange.provider_id) then raise exception 'Unauthorized'; end if;
  if v_exchange.status<>'pending_proposal' then
    if v_exchange.status='in_progress' then return 'active'; end if;
    raise exception 'Contract can no longer be approved';
  end if;
  select * into v_contract from exchange_contracts where exchange_id=p_exchange_id;
  if not found then raise exception 'Contract not found'; end if;
  insert into exchange_contract_approvals(exchange_id,user_id,contract_fingerprint,approved_at)
    values(p_exchange_id,p_actor_id,v_contract.contract_fingerprint,p_now) on conflict(exchange_id,user_id) do nothing;
  select count(*) into v_approval_count from exchange_contract_approvals where exchange_id=p_exchange_id and user_id in(v_exchange.requester_id,v_exchange.provider_id) and contract_fingerprint=v_contract.contract_fingerprint;
  if v_approval_count<2 then
    update exchanges set updated_at=p_now,payload=payload || jsonb_build_object('contractApprovals',(select jsonb_agg(user_id) from exchange_contract_approvals where exchange_id=p_exchange_id),'updatedAt',p_now) where id=p_exchange_id;
    return 'waiting';
  end if;

  perform id from users where id in(v_exchange.requester_id,v_exchange.provider_id) order by id for update;
  select * into v_requester from users where id=v_exchange.requester_id;
  select * into v_provider from users where id=v_exchange.provider_id;
  if v_requester.id is null or v_provider.id is null then raise exception 'Exchange participant not found'; end if;
  if v_requester.skill_hours<v_contract.requester_pays_hours then raise exception 'Requester has insufficient Skill Hours'; end if;
  if v_exchange.is_mutual and v_provider.skill_hours<v_contract.provider_pays_hours then raise exception 'Provider has insufficient Skill Hours'; end if;

  update users set skill_hours=skill_hours-v_contract.requester_pays_hours,updated_at=p_now,payload=payload || jsonb_build_object('skillHours',skill_hours-v_contract.requester_pays_hours,'updatedAt',p_now) where id=v_exchange.requester_id;
  if v_exchange.is_mutual then
    update users set skill_hours=skill_hours-v_contract.provider_pays_hours,updated_at=p_now,payload=payload || jsonb_build_object('skillHours',skill_hours-v_contract.provider_pays_hours,'updatedAt',p_now) where id=v_exchange.provider_id;
  end if;

  v_pending := case when v_exchange.is_mutual then jsonb_build_array(v_exchange.requester_id,v_exchange.provider_id) else jsonb_build_array(v_exchange.provider_id) end;
  v_participants := jsonb_build_object(
    v_exchange.requester_id,jsonb_build_object('userId',v_exchange.requester_id,'role','requester','skillHoursReserved',v_contract.requester_pays_hours,'securityDepositAmount',0,'depositStatus','received','deliverablesStatus','pending','approvalStatus','pending','commitments',v_contract.requester_deliverables),
    v_exchange.provider_id,jsonb_build_object('userId',v_exchange.provider_id,'role','provider','skillHoursReserved',case when v_exchange.is_mutual then v_contract.provider_pays_hours else 0 end,'securityDepositAmount',0,'depositStatus','received','deliverablesStatus','pending','approvalStatus','pending','commitments',v_contract.provider_deliverables));
  v_timeline := jsonb_build_array(jsonb_build_object('id',p_activity_id,'type','created','message','Both parties approved the contract. Skill Hours are reserved.','timestamp',p_now,'actorId',p_actor_id));
  insert into escrows(id,exchange_id,status,participants,timeline,created_at,updated_at,payload)
    values(p_escrow_id,p_exchange_id,'locked',v_participants,v_timeline,p_now,p_now,jsonb_build_object('exchangeId',p_exchange_id,'status','locked','participants',v_participants,'participantIds',jsonb_build_array(v_exchange.requester_id,v_exchange.provider_id),'timeline',v_timeline,'createdAt',p_now,'updatedAt',p_now));

  insert into ledger_entries(id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
    values(p_requester_ledger_id,'transactions',v_exchange.requester_id,p_exchange_id,v_exchange.provider_id,'Reserved','Active',-v_contract.requester_pays_hours,v_requester.skill_hours,v_requester.skill_hours-v_contract.requester_pays_hours,'Escrow for: '||v_exchange.title,'Hours are locked until the atomic exchange completes.',p_now,
      jsonb_build_object('userId',v_exchange.requester_id,'date',p_now,'type','Reserved','description','Escrow for: '||v_exchange.title,'exchangeId',p_exchange_id,'amount',-v_contract.requester_pays_hours,'balanceBefore',v_requester.skill_hours,'balanceAfter',v_requester.skill_hours-v_contract.requester_pays_hours,'status','Active','linkedUserId',v_exchange.provider_id,'notes','Hours are locked until the atomic exchange completes.'));
  if v_exchange.is_mutual then
    insert into ledger_entries(id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
      values(p_provider_ledger_id,'transactions',v_exchange.provider_id,p_exchange_id,v_exchange.requester_id,'Reserved','Active',-v_contract.provider_pays_hours,v_provider.skill_hours,v_provider.skill_hours-v_contract.provider_pays_hours,'Mutual escrow for: '||v_exchange.title,'Hours are locked until the atomic exchange completes.',p_now,
        jsonb_build_object('userId',v_exchange.provider_id,'date',p_now,'type','Reserved','description','Mutual escrow for: '||v_exchange.title,'exchangeId',p_exchange_id,'amount',-v_contract.provider_pays_hours,'balanceBefore',v_provider.skill_hours,'balanceAfter',v_provider.skill_hours-v_contract.provider_pays_hours,'status','Active','linkedUserId',v_exchange.requester_id,'notes','Hours are locked until the atomic exchange completes.'));
  end if;

  update exchanges set status='in_progress',updated_at=p_now,payload=payload || jsonb_build_object('status','in_progress','escrowId',p_escrow_id,'escrowStatus','reserved','pendingSubmissions',v_pending,'contractApprovals',jsonb_build_array(v_exchange.requester_id,v_exchange.provider_id),'updatedAt',p_now) where id=p_exchange_id;
  insert into exchange_activity(id,exchange_id,actor_id,event_type,description,occurred_at,payload)
    values(p_activity_id,p_exchange_id,p_actor_id,'contract_approved','Both participants approved the immutable contract. Work can begin.',p_now,jsonb_build_object('type','contract_approved','description','Both participants approved the immutable contract. Work can begin.','timestamp',p_now));
  insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values
    (p_requester_notification_id,'notifications/'||p_requester_notification_id,v_exchange.requester_id,'exchange_started','Exchange Started','Both participants approved "'||v_exchange.title||'". Skill Hours are reserved and the workspace is active.',false,false,'/exchanges/'||p_exchange_id,p_exchange_id,p_now,jsonb_build_object('type','exchange_started','title','Exchange Started','message','Both participants approved the contract.','isRead',false,'link','/exchanges/'||p_exchange_id,'createdAt',p_now)),
    (p_provider_notification_id,'notifications/'||p_provider_notification_id,v_exchange.provider_id,'exchange_started','Exchange Started','Both participants approved "'||v_exchange.title||'". Skill Hours are reserved and the workspace is active.',false,false,'/exchanges/'||p_exchange_id,p_exchange_id,p_now,jsonb_build_object('type','exchange_started','title','Exchange Started','message','Both participants approved the contract.','isRead',false,'link','/exchanges/'||p_exchange_id,'createdAt',p_now));
  return 'active';
end;
$$;

create or replace function submit_exchange_delivery(
  p_actor_id text,p_exchange_id text,p_delivery_id text,p_activity_id text,p_notification_id text,p_files jsonb,p_comments text,p_now timestamptz
) returns integer language plpgsql as $$
declare
  v_exchange exchanges%rowtype;
  v_version integer;
  v_pending jsonb;
  v_remaining jsonb;
  v_status text;
  v_other_user_id text;
  v_participants jsonb;
begin
  select * into v_exchange from exchanges where id=p_exchange_id for update;
  if not found then raise exception 'Exchange not found'; end if;
  if p_actor_id not in(v_exchange.requester_id,v_exchange.provider_id) then raise exception 'You are not part of this exchange'; end if;
  if v_exchange.status not in('in_progress','revision_requested') then raise exception 'Deliverables cannot be submitted in the current exchange state'; end if;
  if not v_exchange.is_mutual and p_actor_id<>v_exchange.provider_id then raise exception 'Only the provider can submit deliverables'; end if;
  if jsonb_typeof(p_files)<>'array' or jsonb_array_length(p_files)<1 or jsonb_array_length(p_files)>20 then raise exception 'Invalid delivery files'; end if;
  v_pending := coalesce(v_exchange.payload->'pendingSubmissions',case when v_exchange.is_mutual then jsonb_build_array(v_exchange.requester_id,v_exchange.provider_id) else jsonb_build_array(v_exchange.provider_id) end);
  if not v_pending ? p_actor_id then raise exception 'You have already submitted for this review round'; end if;

  select coalesce(max(version),0)+1 into v_version from exchange_deliveries where exchange_id=p_exchange_id;
  update exchange_deliveries set is_current=false where exchange_id=p_exchange_id and submitted_by=p_actor_id and is_current;
  insert into exchange_deliveries(id,exchange_id,submitted_by,version,review_round,is_current,files,comments,submitted_at,payload)
    values(p_delivery_id,p_exchange_id,p_actor_id,v_version,v_exchange.review_round,true,p_files,p_comments,p_now,jsonb_build_object('version',v_version,'reviewRound',v_exchange.review_round,'files',p_files,'comments',p_comments,'submittedBy',p_actor_id,'uploadedAt',p_now));
  select coalesce(jsonb_agg(value),'[]'::jsonb) into v_remaining from jsonb_array_elements(v_pending) where value<>to_jsonb(p_actor_id);
  v_status := case when jsonb_array_length(v_remaining)=0 then 'in_review' else v_exchange.status end;
  v_other_user_id := case when p_actor_id=v_exchange.provider_id then v_exchange.requester_id else v_exchange.provider_id end;

  update exchanges set status=v_status,reveal_at=case when v_status='in_review' then p_now else null end,updated_at=p_now,payload=payload || jsonb_build_object(
    'status',v_status,'pendingSubmissions',v_remaining,'reviewRound',v_exchange.review_round,'revealAt',case when v_status='in_review' then to_jsonb(p_now) else 'null'::jsonb end,
    case when p_actor_id=provider_id then 'providerSubmittedAt' else 'requesterSubmittedAt' end,p_now,'updatedAt',p_now) where id=p_exchange_id;
  select jsonb_set(participants,array[p_actor_id,'deliverablesStatus'],'"submitted"'::jsonb,true) into v_participants from escrows where exchange_id=p_exchange_id for update;
  if v_participants is not null then update escrows set participants=v_participants,updated_at=p_now,payload=jsonb_set(payload,'{participants}',v_participants,true) where exchange_id=p_exchange_id; end if;
  insert into exchange_activity(id,exchange_id,actor_id,event_type,description,occurred_at,payload)
    values(p_activity_id,p_exchange_id,p_actor_id,'files_uploaded',case when v_status='in_review' then 'All required deliverables were committed. Secure review is open.' else 'A participant committed deliverables. The files remain sealed.' end,p_now,jsonb_build_object('type','files_uploaded','description',case when v_status='in_review' then 'All required deliverables were committed. Secure review is open.' else 'A participant committed deliverables. The files remain sealed.' end,'timestamp',p_now));
  insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
    values(p_notification_id,'notifications/'||p_notification_id,v_other_user_id,'file_uploaded',case when v_status='in_review' then 'Secure Review Ready' else 'Deliverables Committed' end,case when v_status='in_review' then 'All required work for "'||v_exchange.title||'" is ready for private review.' else 'The other participant submitted work for "'||v_exchange.title||'". Files remain sealed until all required submissions arrive.' end,false,false,'/exchanges/'||p_exchange_id||'/files',p_exchange_id,p_now,jsonb_build_object('type','file_uploaded','title',case when v_status='in_review' then 'Secure Review Ready' else 'Deliverables Committed' end,'message',case when v_status='in_review' then 'Secure review is ready.' else 'Files remain sealed.' end,'isRead',false,'link','/exchanges/'||p_exchange_id||'/files','createdAt',p_now));
  return v_version;
end;
$$;

create or replace function record_exchange_review_decision(
  p_actor_id text,p_exchange_id text,p_decision_id text,p_decision text,p_feedback text,p_activity_id text,
  p_provider_ledger_id text,p_requester_ledger_id text,p_provider_notification_id text,p_requester_notification_id text,p_now timestamptz
) returns text language plpgsql as $$
declare
  v_exchange exchanges%rowtype;
  v_required integer;
  v_count integer;
  v_revisions integer;
  v_affected jsonb;
  v_result text;
begin
  select * into v_exchange from exchanges where id=p_exchange_id for update;
  if not found then raise exception 'Exchange not found'; end if;
  if p_actor_id not in(v_exchange.requester_id,v_exchange.provider_id) then raise exception 'Unauthorized'; end if;
  if not v_exchange.is_mutual and p_actor_id<>v_exchange.requester_id then raise exception 'Only the requester reviews a standard exchange'; end if;
  if v_exchange.status<>'in_review' or v_exchange.reveal_at is null then raise exception 'The exchange is not ready for review'; end if;
  if p_decision not in('accept','revision') then raise exception 'Invalid review decision'; end if;
  if p_decision='revision' and (p_feedback is null or length(trim(p_feedback))<3 or length(p_feedback)>3000) then raise exception 'Revision feedback is required'; end if;
  insert into exchange_review_decisions(id,exchange_id,review_round,reviewer_id,decision,feedback,created_at)
    values(p_decision_id,p_exchange_id,v_exchange.review_round,p_actor_id,p_decision,case when p_decision='revision' then trim(p_feedback) else null end,p_now);
  v_required := case when v_exchange.is_mutual then 2 else 1 end;
  select count(*),count(*) filter(where decision='revision') into v_count,v_revisions from exchange_review_decisions where exchange_id=p_exchange_id and review_round=v_exchange.review_round;
  if v_count<v_required then return 'waiting'; end if;
  update exchange_review_decisions set revealed_at=p_now where exchange_id=p_exchange_id and review_round=v_exchange.review_round;

  if v_revisions>0 then
    select jsonb_agg(distinct case when reviewer_id=v_exchange.requester_id then v_exchange.provider_id else v_exchange.requester_id end) into v_affected
      from exchange_review_decisions where exchange_id=p_exchange_id and review_round=v_exchange.review_round and decision='revision';
    update exchanges set status='revision_requested',review_round=review_round+1,reveal_at=null,updated_at=p_now,payload=(payload - 'providerAcceptedAt' - 'requesterAcceptedAt') || jsonb_build_object(
      'status','revision_requested','reviewRound',review_round+1,'pendingSubmissions',v_affected,'revealAt',null,'lastReviewOutcome','revision_requested',
      'revisionFeedback',(select jsonb_agg(jsonb_build_object('reviewerId',reviewer_id,'feedback',feedback)) from exchange_review_decisions where exchange_id=p_exchange_id and review_round=v_exchange.review_round and decision='revision'),
      'providerSubmittedAt',case when v_affected ? v_exchange.provider_id then null else payload->'providerSubmittedAt' end,
      'requesterSubmittedAt',case when v_affected ? v_exchange.requester_id then null else payload->'requesterSubmittedAt' end,'updatedAt',p_now) where id=p_exchange_id;
    insert into exchange_activity(id,exchange_id,actor_id,event_type,description,occurred_at,payload)
      values(p_activity_id,p_exchange_id,null,'revision_requested','The independent review is complete. Revisions were requested and files remain locked.',p_now,jsonb_build_object('type','revision_requested','description','The independent review is complete. Revisions were requested and files remain locked.','timestamp',p_now));
    if v_affected ? v_exchange.provider_id then
      insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values(p_provider_notification_id,'notifications/'||p_provider_notification_id,v_exchange.provider_id,'revision_requested','Revisions Requested','Review feedback is ready for "'||v_exchange.title||'".',false,false,'/exchanges/'||p_exchange_id||'/files',p_exchange_id,p_now,jsonb_build_object('type','revision_requested','title','Revisions Requested','message','Review feedback is ready.','isRead',false,'link','/exchanges/'||p_exchange_id||'/files','createdAt',p_now));
    end if;
    if v_affected ? v_exchange.requester_id then
      insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values(p_requester_notification_id,'notifications/'||p_requester_notification_id,v_exchange.requester_id,'revision_requested','Revisions Requested','Review feedback is ready for "'||v_exchange.title||'".',false,false,'/exchanges/'||p_exchange_id||'/files',p_exchange_id,p_now,jsonb_build_object('type','revision_requested','title','Revisions Requested','message','Review feedback is ready.','isRead',false,'link','/exchanges/'||p_exchange_id||'/files','createdAt',p_now));
    end if;
    return 'revision_requested';
  end if;

  if v_exchange.is_mutual then
    perform complete_exchange_delivery(v_exchange.requester_id,p_exchange_id,p_activity_id||'-requester',p_provider_ledger_id,p_requester_ledger_id,p_provider_notification_id,p_requester_notification_id,p_now);
    v_result := complete_exchange_delivery(v_exchange.provider_id,p_exchange_id,p_activity_id||'-provider',p_provider_ledger_id,p_requester_ledger_id,p_provider_notification_id,p_requester_notification_id,p_now);
  else
    v_result := complete_exchange_delivery(v_exchange.requester_id,p_exchange_id,p_activity_id,p_provider_ledger_id,p_requester_ledger_id,p_provider_notification_id,p_requester_notification_id,p_now);
  end if;
  if v_result<>'completed' then raise exception 'Atomic settlement did not complete'; end if;
  update exchanges set files_released_at=p_now,payload=payload || jsonb_build_object('filesReleasedAt',p_now,'lastReviewOutcome','accepted','updatedAt',p_now) where id=p_exchange_id;
  return 'completed';
end;
$$;
