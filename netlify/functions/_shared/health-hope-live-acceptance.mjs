// Disabled by default. A public-hold acceptance case has one recipient/session/
// idempotency key and a maximum thirty-minute server-controlled lifetime.
export function acceptanceScope(env,now=Date.now()) {
  if(env.get('RVA_HHL_ACCEPTANCE_ENABLED')!=='true'||env.get('RVA_HHL_REGISTRATION_ENABLED')==='true')return null;
  const email=env.get('RVA_HHL_ACCEPTANCE_EMAIL'),session_id=env.get('RVA_HHL_ACCEPTANCE_SESSION_ID'),request_id=env.get('RVA_HHL_ACCEPTANCE_REQUEST_ID'),operator_id=env.get('RVA_HHL_ACCEPTANCE_OPERATOR_ID');
  const starts_at=env.get('RVA_HHL_ACCEPTANCE_STARTS_AT'),expires_at=env.get('RVA_HHL_ACCEPTANCE_EXPIRES_AT'),start=Date.parse(starts_at),end=Date.parse(expires_at);
  const revision=Number(env.get('RVA_HHL_ACCEPTANCE_SESSION_REVISION'));
  const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
  if(typeof email!=='string'||email.length>254||!/^([^\s@<>]+)@[^\s@<>]+\.[^\s@<>]+$/.test(email)||email!==email.toLowerCase().trim()||!uuid.test(operator_id||'')||!uuid.test(session_id||'')||!uuid.test(request_id||'')||!Number.isSafeInteger(revision)||revision<1||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>1800000||now<start||now>=end)return null;
  return {email,session_id,request_id,operator_id,revision,starts_at,expires_at};
}
