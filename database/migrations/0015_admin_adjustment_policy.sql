-- Apply platform Skill Hour adjustment policy to the existing Users action.
-- Existing idempotent retries return their original result before policy checks.
create or replace function admin_adjust_skill_hours(p_actor text,p_user text,p_amount integer,p_reason text,p_operation text) returns integer language plpgsql as $$
declare u users; previous admin_audit_events; entry_id text; balance integer;
begin
 perform assert_platform_admin(p_actor);
 if p_amount is null or p_amount=0 or abs(p_amount::bigint)>10000 or p_reason is null or length(trim(p_reason))=0 or length(p_reason)>500 or p_operation is null or p_operation !~ '^[a-f0-9-]{36}$' then raise exception 'Invalid adjustment'; end if;
 perform pg_advisory_xact_lock(hashtext(p_actor||'/'||p_operation));
 select * into previous from admin_audit_events where actor_id=p_actor and event_type='hours_adjusted' and operation_id=p_operation;
 if found then
   if previous.resource_id<>p_user or previous.metadata->>'amount'<>p_amount::text or previous.metadata->>'reason'<>trim(p_reason) then raise exception 'This operation was already used for another adjustment'; end if;
   return (previous.metadata->>'balance')::integer;
 end if;
 if coalesce((select (value->>'manualAdjustmentsEnabled')::boolean from platform_settings where section='skill-hours'),true)=false then raise exception 'Manual adjustments are disabled'; end if;
 if abs(p_amount::bigint)>coalesce((select (value->>'adjustmentLimit')::integer from platform_settings where section='skill-hours'),10000) then raise exception 'Invalid adjustment amount'; end if;
 select * into u from users where id=p_user for update;
 if not found or coalesce(u.account_status,'active') in('deleted','deletion_pending','deletion_processing') then raise exception 'Account is unavailable'; end if;
 balance:=u.skill_hours+p_amount;
 if balance<0 then raise exception 'Adjustment would make the balance negative'; end if;
 entry_id:='admin-'||p_actor||'-'||p_operation;
 update users set skill_hours=balance,updated_at=now(),payload=payload||jsonb_build_object('skillHours',balance,'updatedAt',now()) where id=p_user;
 insert into ledger_entries(id,source_collection,user_id,related_user_id,entry_type,entry_status,amount,balance_before,balance_after,description,occurred_at,payload)
   values(entry_id,'skill_ledger',p_user,p_actor,'Admin Correction','Completed',p_amount,u.skill_hours,balance,trim(p_reason),now(),jsonb_build_object('userId',p_user,'amount',p_amount,'type','Admin Correction','status','Completed','description',trim(p_reason),'balanceBefore',u.skill_hours,'balanceAfter',balance,'createdAt',now()));
 insert into notifications(id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,related_id,created_at,payload)
   values(entry_id||'-notification','ledger/'||entry_id||'/notification',p_user,'admin_adjustment','Skill Hour balance adjusted',trim(p_reason),false,false,'/wallet/ledger',entry_id,now(),'{}');
 insert into admin_audit_events(actor_id,event_type,resource_id,description,operation_id,metadata)
   values(p_actor,'hours_adjusted',p_user,'Member Skill Hours adjusted',p_operation,jsonb_build_object('amount',p_amount,'reason',trim(p_reason),'balance',balance));
 return balance;
end $$;
