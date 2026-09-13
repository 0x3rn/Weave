create or replace function create_exchange_from_application(
  p_actor_id text, p_application_id text, p_exchange_id text, p_escrow_id text,
  p_requester_ledger_id text, p_provider_ledger_id text, p_activity_id text,
  p_notification_id text, p_now timestamptz
) returns text language plpgsql as $$
declare
  v_app marketplace_applications%rowtype;
  v_request marketplace_requests%rowtype;
  v_requester users%rowtype;
  v_provider users%rowtype;
  v_required integer;
  v_mutual_hours integer;
  v_mutual boolean;
  v_exchange_payload jsonb;
  v_participants jsonb;
  v_timeline jsonb;
begin
  select * into v_app from marketplace_applications where id=p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  if v_app.status not in ('pending','shortlisted') then raise exception 'Application cannot be accepted'; end if;
  select * into v_request from marketplace_requests where id=v_app.request_id for update;
  if not found then raise exception 'Associated request not found'; end if;
  if v_request.requester_id<>p_actor_id then raise exception 'Unauthorized'; end if;
  if v_request.status<>'open' then raise exception 'Request is no longer open'; end if;

  perform id from users where id in (p_actor_id,v_app.applicant_id) order by id for update;
  select * into v_requester from users where id=p_actor_id;
  select * into v_provider from users where id=v_app.applicant_id;
  if v_requester.id is null then raise exception 'Requester profile not found'; end if;
  if v_provider.id is null then raise exception 'Applicant profile not found'; end if;
  v_required := v_app.estimated_hours;
  v_mutual := v_app.is_mutual_proposal;
  v_mutual_hours := coalesce(v_app.offered_hours,v_required);
  if v_required is null or v_required<=0 or v_required>10000 then raise exception 'Invalid exchange hours'; end if;
  if v_mutual and (v_mutual_hours is null or v_mutual_hours<=0 or v_mutual_hours>10000) then raise exception 'Invalid mutual exchange hours'; end if;
  if v_requester.skill_hours<v_required then raise exception 'Insufficient Skill Hours'; end if;
  if v_mutual and v_provider.skill_hours<v_mutual_hours then raise exception 'The applicant does not have enough Skill Hours'; end if;

  update users set skill_hours=skill_hours-v_required, updated_at=p_now,
    payload=payload || jsonb_build_object('skillHours',skill_hours-v_required,'updatedAt',p_now)
    where id=p_actor_id;
  if v_mutual then
    update users set skill_hours=skill_hours-v_mutual_hours, updated_at=p_now,
      payload=payload || jsonb_build_object('skillHours',skill_hours-v_mutual_hours,'updatedAt',p_now)
      where id=v_app.applicant_id;
  end if;

  v_exchange_payload := jsonb_build_object(
    'requestId',v_request.id,'applicationId',v_app.id,'title',v_request.title,
    'requesterId',p_actor_id,'providerId',v_app.applicant_id,
    'participants',jsonb_build_array(p_actor_id,v_app.applicant_id),
    'skillHours',v_required,'requesterEscrowHours',v_required,
    'providerEscrowHours',case when v_mutual then v_mutual_hours else 0 end,
    'status','in_progress','escrowId',p_escrow_id,'escrowStatus','reserved',
    'deliverables',coalesce(v_request.deliverables,'[]'::jsonb),
    'deadline',coalesce(v_app.estimated_completion_at::text,''),'progress',0,
    'createdAt',p_now,'updatedAt',p_now,'isMutual',v_mutual
  );
  if v_mutual then
    v_exchange_payload := v_exchange_payload || jsonb_build_object(
      'providerEscrowStatus','reserved','requesterEscrowStatus','reserved',
      'providerDeliverables',coalesce(v_request.deliverables,'[]'::jsonb),
      'requesterDeliverables',coalesce(v_app.payload->'offeredDeliverables','[]'::jsonb)
    );
  end if;
  insert into exchanges (id,marketplace_request_id,marketplace_application_id,requester_id,provider_id,title,skill_hours,requester_escrow_hours,provider_escrow_hours,status,is_mutual,deadline_at,progress,created_at,updated_at,payload)
    values (p_exchange_id,v_request.id,v_app.id,p_actor_id,v_app.applicant_id,v_request.title,v_required,v_required,case when v_mutual then v_mutual_hours else 0 end,'in_progress',v_mutual,v_app.estimated_completion_at,0,p_now,p_now,v_exchange_payload);

  v_participants := jsonb_build_object(
    p_actor_id,jsonb_build_object('userId',p_actor_id,'role','requester','skillHoursReserved',v_required,'securityDepositAmount',0,'depositStatus','received','deliverablesStatus','pending','approvalStatus','pending','commitments',coalesce(v_request.payload->'offeredDeliverables','["Complete required deliverables"]'::jsonb)),
    v_app.applicant_id,jsonb_build_object('userId',v_app.applicant_id,'role','provider','skillHoursReserved',case when v_mutual then v_mutual_hours else 0 end,'securityDepositAmount',0,'depositStatus','received','deliverablesStatus','pending','approvalStatus','pending','commitments',coalesce(v_request.deliverables,'["Complete required deliverables"]'::jsonb))
  );
  v_timeline := jsonb_build_array(jsonb_build_object('id',p_activity_id,'type','created','message','Skill Hours reserved and exchange activated.','timestamp',p_now,'actorId',p_actor_id));
  insert into escrows (id,exchange_id,status,participants,timeline,created_at,updated_at,payload)
    values (p_escrow_id,p_exchange_id,'locked',v_participants,v_timeline,p_now,p_now,jsonb_build_object('exchangeId',p_exchange_id,'status','locked','participants',v_participants,'participantIds',jsonb_build_array(p_actor_id,v_app.applicant_id),'timeline',v_timeline,'createdAt',p_now,'updatedAt',p_now));

  insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
    values (p_requester_ledger_id,'transactions',p_actor_id,p_exchange_id,v_app.applicant_id,'Reserved','Active',-v_required,v_requester.skill_hours,v_requester.skill_hours-v_required,'Escrow for: '||v_request.title,'Hours are locked in escrow until the exchange is completed.',p_now,
      jsonb_build_object('userId',p_actor_id,'date',p_now,'type','Reserved','description','Escrow for: '||v_request.title,'exchangeId',p_exchange_id,'amount',-v_required,'balanceBefore',v_requester.skill_hours,'balanceAfter',v_requester.skill_hours-v_required,'status','Active','linkedUserId',v_app.applicant_id,'linkedUserName',coalesce(v_provider.full_name,v_provider.username,'Unknown'),'linkedUserAvatar',v_provider.photo_url,'notes','Hours are locked in escrow until the exchange is completed.'));
  if v_mutual then
    insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
      values (p_provider_ledger_id,'transactions',v_app.applicant_id,p_exchange_id,p_actor_id,'Reserved','Active',-v_mutual_hours,v_provider.skill_hours,v_provider.skill_hours-v_mutual_hours,'Mutual Escrow for: '||v_request.title,'Hours are locked in escrow until the exchange is completed.',p_now,
        jsonb_build_object('userId',v_app.applicant_id,'date',p_now,'type','Reserved','description','Mutual Escrow for: '||v_request.title,'exchangeId',p_exchange_id,'amount',-v_mutual_hours,'balanceBefore',v_provider.skill_hours,'balanceAfter',v_provider.skill_hours-v_mutual_hours,'status','Active','linkedUserId',p_actor_id,'linkedUserName',coalesce(v_requester.full_name,v_requester.username,'Unknown'),'linkedUserAvatar',v_requester.photo_url,'notes','Hours are locked in escrow until the exchange is completed.'));
  end if;
  update marketplace_applications set status='accepted',updated_at=p_now,payload=payload || jsonb_build_object('status','accepted','updatedAt',p_now) where id=v_app.id;
  update marketplace_requests set status='in_progress',updated_at=p_now,payload=payload || jsonb_build_object('status','in_progress','updatedAt',p_now) where id=v_request.id;
  insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload) values (p_activity_id,p_exchange_id,p_actor_id,'created','Exchange created and Skill Hours escrowed.',p_now,jsonb_build_object('type','created','description','Exchange created and Skill Hours escrowed.','timestamp',p_now));
  insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
    values (p_notification_id,'notifications/'||p_notification_id,v_app.applicant_id,'application_accepted','Proposal Accepted!','Your application for '''||v_request.title||''' was accepted. Your workspace is ready.',false,false,'/exchanges/'||p_exchange_id,p_exchange_id,p_now,
      jsonb_build_object('type','application_accepted','title','Proposal Accepted!','message','Your application for '''||v_request.title||''' was accepted. Your workspace is ready.','isRead',false,'link','/exchanges/'||p_exchange_id,'createdAt',p_now));
  insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
    values (p_requester_ledger_id||'-notification','ledger/'||p_requester_ledger_id||'/notification',p_actor_id,'hours_reserved','Skill Hours reserved',v_required||' Skill Hours were reserved for "'||v_request.title||'".',false,false,'/wallet/ledger',p_exchange_id,p_now,
      jsonb_build_object('type','hours_reserved','title','Skill Hours reserved','message',v_required||' Skill Hours were reserved for this exchange.','isRead',false,'link','/wallet/ledger','relatedId',p_exchange_id,'createdAt',p_now));
  if v_mutual then
    insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
      values (p_provider_ledger_id||'-notification','ledger/'||p_provider_ledger_id||'/notification',v_app.applicant_id,'hours_reserved','Skill Hours reserved',v_mutual_hours||' Skill Hours were reserved for "'||v_request.title||'".',false,false,'/wallet/ledger',p_exchange_id,p_now,
        jsonb_build_object('type','hours_reserved','title','Skill Hours reserved','message',v_mutual_hours||' Skill Hours were reserved for this exchange.','isRead',false,'link','/wallet/ledger','relatedId',p_exchange_id,'createdAt',p_now));
  end if;
  return p_exchange_id;
end;
$$;

create or replace function complete_exchange_delivery(
  p_actor_id text, p_exchange_id text, p_activity_id text,
  p_provider_ledger_id text, p_requester_ledger_id text,
  p_provider_notification_id text, p_requester_notification_id text,
  p_now timestamptz
) returns text language plpgsql as $$
declare
  v_exchange exchanges%rowtype;
  v_provider users%rowtype;
  v_requester users%rowtype;
  v_is_provider boolean;
  v_is_requester boolean;
  v_provider_accepted boolean;
  v_requester_accepted boolean;
  v_req_amount integer;
  v_prov_amount integer;
  v_description text;
begin
  select * into v_exchange from exchanges where id=p_exchange_id for update;
  if not found then raise exception 'Exchange not found'; end if;
  v_is_provider := p_actor_id=v_exchange.provider_id;
  v_is_requester := p_actor_id=v_exchange.requester_id;
  if not v_is_provider and not v_is_requester then raise exception 'You are not part of this exchange'; end if;
  if not v_exchange.is_mutual and not v_is_requester then raise exception 'Only the requester can accept delivery in a standard exchange'; end if;
  if v_exchange.status<>'in_review' then raise exception 'Exchange cannot be completed in its current state'; end if;
  if coalesce(v_exchange.payload->>'providerSubmittedAt','')='' or (v_exchange.is_mutual and coalesce(v_exchange.payload->>'requesterSubmittedAt','')='') then raise exception 'All required deliverables must be submitted before approval'; end if;

  v_provider_accepted := coalesce(v_exchange.payload->>'providerAcceptedAt','')<>'' or v_is_provider;
  v_requester_accepted := coalesce(v_exchange.payload->>'requesterAcceptedAt','')<>'' or v_is_requester;
  if v_exchange.is_mutual and not (v_provider_accepted and v_requester_accepted) then
    update exchanges set updated_at=p_now,payload=payload || case when v_is_provider then jsonb_build_object('providerAcceptedAt',p_now,'updatedAt',p_now) else jsonb_build_object('requesterAcceptedAt',p_now,'updatedAt',p_now) end where id=p_exchange_id;
    insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload) values (p_activity_id,p_exchange_id,p_actor_id,'proposal_accepted',case when v_is_provider then 'Provider' else 'Requester' end||' accepted the delivery. Waiting for the other party to accept.',p_now,jsonb_build_object('type','proposal_accepted','description',case when v_is_provider then 'Provider' else 'Requester' end||' accepted the delivery. Waiting for the other party to accept.','timestamp',p_now));
    return 'pending';
  end if;

  perform id from users where id in (v_exchange.requester_id,v_exchange.provider_id) order by id for update;
  select * into v_provider from users where id=v_exchange.provider_id;
  select * into v_requester from users where id=v_exchange.requester_id;
  if v_provider.id is null or v_requester.id is null then raise exception 'User not found'; end if;
  v_req_amount := v_exchange.requester_escrow_hours;
  v_prov_amount := v_exchange.provider_escrow_hours;
  if v_req_amount<=0 or v_prov_amount<0 or (v_exchange.is_mutual and v_prov_amount<=0) then raise exception 'Invalid escrow state'; end if;

  update users set skill_hours=skill_hours+v_req_amount,updated_at=p_now,payload=payload || jsonb_build_object('skillHours',skill_hours+v_req_amount,'stats',coalesce(payload->'stats','{}'::jsonb) || jsonb_build_object('skillHoursEarned',coalesce((payload#>>'{stats,skillHoursEarned}')::int,0)+v_req_amount,'exchangesCompleted',coalesce((payload#>>'{stats,exchangesCompleted}')::int,0)+1)) where id=v_exchange.provider_id;
  update users set skill_hours=skill_hours+v_prov_amount,updated_at=p_now,payload=payload || jsonb_build_object('skillHours',skill_hours+v_prov_amount,'stats',coalesce(payload->'stats','{}'::jsonb) || jsonb_build_object('skillHoursEarned',coalesce((payload#>>'{stats,skillHoursEarned}')::int,0)+v_prov_amount,'skillHoursSpent',coalesce((payload#>>'{stats,skillHoursSpent}')::int,0)+v_req_amount,'exchangesCompleted',coalesce((payload#>>'{stats,exchangesCompleted}')::int,0)+1)) where id=v_exchange.requester_id;

  insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
    values (p_provider_ledger_id,'transactions',v_exchange.provider_id,p_exchange_id,v_exchange.requester_id,'Earned','Completed',v_req_amount,v_provider.skill_hours,v_provider.skill_hours+v_req_amount,'Payment for: '||v_exchange.title,'Skill hours released from escrow.',p_now,
      jsonb_build_object('userId',v_exchange.provider_id,'date',p_now,'type','Earned','description','Payment for: '||v_exchange.title,'exchangeId',p_exchange_id,'amount',v_req_amount,'balanceBefore',v_provider.skill_hours,'balanceAfter',v_provider.skill_hours+v_req_amount,'status','Completed','linkedUserId',v_exchange.requester_id,'linkedUserName',coalesce(v_requester.full_name,v_requester.username,'Unknown'),'linkedUserAvatar',v_requester.photo_url,'notes','Skill hours released from escrow.'));
  if v_exchange.is_mutual then
    insert into ledger_entries (id,source_collection,user_id,exchange_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,notes,occurred_at,payload)
      values (p_requester_ledger_id,'transactions',v_exchange.requester_id,p_exchange_id,v_exchange.provider_id,'Earned','Completed',v_prov_amount,v_requester.skill_hours,v_requester.skill_hours+v_prov_amount,'Mutual Payment for: '||v_exchange.title,'Skill hours released from mutual escrow.',p_now,
        jsonb_build_object('userId',v_exchange.requester_id,'date',p_now,'type','Earned','description','Mutual Payment for: '||v_exchange.title,'exchangeId',p_exchange_id,'amount',v_prov_amount,'balanceBefore',v_requester.skill_hours,'balanceAfter',v_requester.skill_hours+v_prov_amount,'status','Completed','linkedUserId',v_exchange.provider_id,'linkedUserName',coalesce(v_provider.full_name,v_provider.username,'Unknown'),'linkedUserAvatar',v_provider.photo_url,'notes','Skill hours released from mutual escrow.'));
  end if;
  update exchanges set status='completed',completed_at=p_now,updated_at=p_now,payload=payload || jsonb_build_object('status','completed','escrowStatus','released','providerEscrowStatus',case when is_mutual then 'released' else payload->>'providerEscrowStatus' end,'requesterEscrowStatus',case when is_mutual then 'released' else payload->>'requesterEscrowStatus' end,'providerAcceptedAt',case when v_is_provider then p_now else payload->'providerAcceptedAt' end,'requesterAcceptedAt',case when v_is_requester then p_now else payload->'requesterAcceptedAt' end,'completedAt',p_now,'updatedAt',p_now) where id=p_exchange_id;
  update escrows set status='released',updated_at=p_now,payload=payload || jsonb_build_object('status','released','updatedAt',p_now) where exchange_id=p_exchange_id;
  update marketplace_requests set status='completed',updated_at=p_now,payload=payload || jsonb_build_object('status','completed','updatedAt',p_now) where id=v_exchange.marketplace_request_id;
  v_description := case when v_exchange.is_mutual then 'Both parties accepted deliveries. Exchange completed.' else 'Requester accepted the delivery. Escrow has been released.' end;
  insert into exchange_activity (id,exchange_id,actor_id,event_type,description,occurred_at,payload) values (p_activity_id,p_exchange_id,p_actor_id,'completed',v_description,p_now,jsonb_build_object('type','completed','description',v_description,'timestamp',p_now));
  insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values (p_provider_notification_id,'notifications/'||p_provider_notification_id,v_exchange.provider_id,'exchange_completed','Exchange Completed!','Your work for "'||v_exchange.title||'" was accepted. '||v_req_amount||' Skill Hours have been added to your ledger.',false,false,'/exchanges/'||p_exchange_id,p_exchange_id,p_now,jsonb_build_object('type','exchange_completed','title','Exchange Completed!','message','Your work was accepted.','isRead',false,'link','/exchanges/'||p_exchange_id,'createdAt',p_now));
  if v_req_amount > 0 then
    insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values (p_provider_ledger_id||'-notification','ledger/'||p_provider_ledger_id||'/notification',v_exchange.provider_id,'hours_earned','Skill Hours earned',v_req_amount||' Skill Hours were added to your ledger.',false,false,'/wallet/ledger',p_exchange_id,p_now,jsonb_build_object('type','hours_earned','title','Skill Hours earned','message',v_req_amount||' Skill Hours were added to your ledger.','isRead',false,'link','/wallet/ledger','relatedId',p_exchange_id,'createdAt',p_now));
  end if;
  if v_exchange.is_mutual then
    insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values (p_requester_notification_id,'notifications/'||p_requester_notification_id,v_exchange.requester_id,'exchange_completed','Exchange Completed!','The mutual exchange "'||v_exchange.title||'" is complete. '||v_prov_amount||' Skill Hours have been added to your ledger.',false,false,'/exchanges/'||p_exchange_id,p_exchange_id,p_now,jsonb_build_object('type','exchange_completed','title','Exchange Completed!','message','The mutual exchange is complete.','isRead',false,'link','/exchanges/'||p_exchange_id,'createdAt',p_now));
    if v_prov_amount > 0 then
      insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload) values (p_requester_ledger_id||'-notification','ledger/'||p_requester_ledger_id||'/notification',v_exchange.requester_id,'hours_earned','Skill Hours earned',v_prov_amount||' Skill Hours were added to your ledger.',false,false,'/wallet/ledger',p_exchange_id,p_now,jsonb_build_object('type','hours_earned','title','Skill Hours earned','message',v_prov_amount||' Skill Hours were added to your ledger.','isRead',false,'link','/wallet/ledger','relatedId',p_exchange_id,'createdAt',p_now));
    end if;
  end if;
  return 'completed';
end;
$$;
