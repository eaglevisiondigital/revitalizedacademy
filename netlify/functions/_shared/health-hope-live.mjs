import {createHash, createHmac, timingSafeEqual} from 'node:crypto';
import {HEALTH_HOPE_MEETING} from './health-hope-live-meeting.mjs';
import {acceptanceScope} from './health-hope-live-acceptance.mjs';

export class EventError extends Error {
  constructor(code, status = 503, retryable = false) {super(code); this.code = code; this.status = status; this.retryable = retryable;}
}
const hash = text => createHash('sha256').update(text).digest('hex');
const enabled = (env, key) => env.get(key) === 'true';
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex'}});
export const validJoinUrl = value => typeof value === 'string' && value.length <= 2048 && /^https:\/\/([a-z0-9-]+\.)?zoom\.us\/j\/[0-9]+(?:\?[^\s]*)?$/.test(value);
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
export async function readBody(request, limit = 16000) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw new EventError('json_required', 415);
  const reader = request.body?.getReader(); if (!reader) throw new EventError('invalid_request', 400);
  let size = 0; const chunks = [];
  for (;;) {const {done, value} = await reader.read(); if (done) break; size += value.length; if (size > limit) {await reader.cancel(); throw new EventError('request_too_large', 413);} chunks.push(Buffer.from(value));}
  const raw = Buffer.concat(chunks).toString('utf8');
  let body; try {body = JSON.parse(raw);} catch {throw new EventError('invalid_request', 400);}
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new EventError('invalid_request', 400);
  return {raw, body};
}
export function verifyZoom(raw, headers, secret, now = Date.now()) {
  if (!secret) return false;
  const timestamp = headers.get('x-zm-request-timestamp') || '', signature = headers.get('x-zm-signature') || '';
  if (!/^\d{10}$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300 || !/^v0=[a-f0-9]{64}$/.test(signature)) return false;
  const expected = 'v0=' + createHmac('sha256', secret).update('v0:' + timestamp + ':' + raw).digest('hex');
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
export function verifyResend(raw,headers,secret,now=Date.now()) {
  if(typeof secret!=='string'||!/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret))return false;
  const id=headers.get('svix-id')||'',stamp=headers.get('svix-timestamp')||'',signatures=headers.get('svix-signature')||'';
  if(!/^[A-Za-z0-9_-]{1,200}$/.test(id)||!/^\d{10}$/.test(stamp)||Math.abs(now/1000-Number(stamp))>300||signatures.length>2048)return false;
  const key=Buffer.from(secret.slice(6),'base64');if(key.length<16)return false;
  const expected=createHmac('sha256',key).update(id+'.'+stamp+'.'+raw).digest();
  return signatures.split(' ').some(value=>{if(!/^v1,[A-Za-z0-9+/]{43}=$/.test(value))return false;const actual=Buffer.from(value.slice(3),'base64');return actual.length===expected.length&&timingSafeEqual(actual,expected);});
}
export function eventSender(from,replyTo) {
  return typeof from==='string'&&!/[\x00-\x1f\x7f]/.test(from)&&/^ReVitalized Academy <[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@auth\.revitalizedacademy\.com>$/i.test(from)
    && typeof replyTo==='string'&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(replyTo)&&replyTo.length<=254;
}
export function zoomClient(env, fetcher = fetch) {
  let token = null, until = 0;
  async function accessToken() {
    if (token && until > Date.now() + 30000) return token;
    const account = env.get('RVA_HHL_ZOOM_ACCOUNT_ID'), id = env.get('RVA_HHL_ZOOM_CLIENT_ID'), secret = env.get('RVA_HHL_ZOOM_CLIENT_SECRET');
    if (!account || !id || !secret) throw new EventError('zoom_not_configured');
    let response; try {
      response = await fetcher('https://zoom.us/oauth/token', {method: 'POST', headers: {Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({grant_type: 'account_credentials', account_id: account}).toString(), signal: AbortSignal.timeout(10000), redirect: 'error'});
    } catch {throw new EventError('zoom_auth_unavailable');}
    if (!response.ok) throw new EventError('zoom_auth_unavailable');
    const data = await response.json();
    if (typeof data.access_token !== 'string' || !Number.isFinite(data.expires_in)) throw new EventError('zoom_auth_unavailable');
    token = data.access_token; until = Date.now() + data.expires_in * 1000; return token;
  }
  async function call(path, options = {}) {
    let response;
    try {response = await fetcher('https://api.zoom.us/v2' + path, {...options, headers: {Authorization: 'Bearer ' + await accessToken(), 'Content-Type': 'application/json'}, signal: AbortSignal.timeout(12000), redirect: 'error'});}
    catch (error) {throw error instanceof EventError ? error : new EventError(options.method === 'POST' ? 'zoom_outcome_uncertain' : 'zoom_unavailable', 503, options.method !== 'POST');}
    if (!response.ok && options.method === 'POST' && response.status >= 500) throw new EventError('zoom_outcome_uncertain');
    if (!response.ok) throw new EventError(response.status === 429 ? 'zoom_rate_limited' : 'zoom_request_failed', 503, response.status === 429 || response.status >= 500);
    return response.status === 204 ? {} : response.json();
  }
  async function meeting(id) {
    if (!/^\d{9,12}$/.test(id || '') || id !== env.get('RVA_HHL_ZOOM_MEETING_ID')) throw new EventError('zoom_meeting_mismatch', 409);
    const data = await call('/meetings/' + id);
    const settings = data.settings || {};
    if (String(data.id) !== id || data.type !== 8 || data.duration !== 30 || data.timezone !== 'America/New_York' || settings.registration_type !== 2 || settings.approval_type !== 0 || settings.registrants_email_notification !== false || settings.registrants_confirmation_email !== false || data.recurrence?.type !== 2 || data.recurrence?.repeat_interval !== 1 || data.recurrence?.weekly_days !== '5') throw new EventError('zoom_meeting_requires_review', 409);
    return data;
  }
  async function validateSession(job, snapshot = null) {
    const data = snapshot || await meeting(job.meeting_id);
    const occurrence = data.occurrences?.find(row => row.occurrence_id === job.occurrence_id && Date.parse(row.start_time) === Date.parse(job.starts_at) && row.status === 'available');
    if (!occurrence || occurrence.duration !== 30) throw new EventError('zoom_occurrence_requires_review', 409);
    return occurrence;
  }
  return {
    meeting, validateSession,
    async register(job) {
      await validateSession(job);
      // Look up the exact occurrence first. This reconciles an earlier success
      // without issuing another non-idempotent POST.
      const matches = []; let page = '';
      for (let n = 0; n < 10; n++) {
        const query = new URLSearchParams({occurrence_id: job.occurrence_id, page_size: '300', status: 'approved'}); if (page) query.set('next_page_token', page);
        const result = await call('/meetings/' + job.meeting_id + '/registrants?' + query);
        for (const item of result.registrants || []) if (String(item.email).trim().toLowerCase() === job.email) matches.push(item);
        page = result.next_page_token || ''; if (!page) break;
      }
      if (page || matches.length > 1) throw new EventError('zoom_identity_requires_review', 409);
      if (matches.length === 1) {
        const match = matches[0];
        if (String(match.first_name || '').trim().toLowerCase() !== String(job.first_name || '').trim().toLowerCase() || String(match.last_name || '').trim().toLowerCase() !== String(job.last_name || '').trim().toLowerCase()) throw new EventError('zoom_identity_requires_review',409);
        // GET registrants may omit a usable join URL. Never substitute a public
        // meeting URL or re-register just to obtain a private URL.
        if (!match.id || !validJoinUrl(match.join_url)) throw new EventError('zoom_join_info_requires_review', 409);
        return {registrant_id: match.id, join_url: match.join_url};
      }
      const data = await call('/meetings/' + job.meeting_id + '/registrants?occurrence_ids=' + encodeURIComponent(job.occurrence_id), {method: 'POST', body: JSON.stringify({email: job.email, first_name: job.first_name, last_name: job.last_name})});
      if (!data.registrant_id || !validJoinUrl(data.join_url)) throw new EventError('zoom_outcome_uncertain');
      return {registrant_id: data.registrant_id, join_url: data.join_url};
    }
  };
}
export function emailForJob(job) {
  const when = new Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'}).format(new Date(job.starts_at));
  if (job.kind !== 'cancellation' && !validJoinUrl(job.join_url)) throw new EventError('joining_info_requires_review');
  const subject = job.kind === 'cancellation' ? 'Health & Hope Live — session canceled' : job.kind === 'update' ? 'Health & Hope Live — your session has changed' : job.kind === 'reminder' ? 'Your Health & Hope Live session starts soon' : 'Your Health & Hope Live registration is confirmed';
  const joining = job.join_mode === 'manual' ? `Zoom joining link for this session:\n${job.join_url}\n\nThis is a shared recurring Zoom link. Your website registration is for the session above. Please do not share the joining information.` : `Your private joining link:\n${job.join_url}\n\nPlease keep this joining information private.`;
  const text = job.kind === 'cancellation' ? `ReVitalized Academy\n\nYour Health & Hope Live session scheduled for ${when} has been canceled.\n\nYou can choose another free session at https://revitalizedacademy.com/health-hope-live.\n\nJustyn & Elle Oliver` : `ReVitalized Academy\n\nHealth & Hope Live\n${when}\n30 minutes · Free · Zoom\n\n${joining}\n\nJustyn & Elle Oliver`;
  return {subject, text};
}
export function createHealthHopeApp(env, {fetcher = fetch, context = {}, now = () => Date.now()} = {}) {
  const origin = env.get('RVA_HHL_ORIGIN'), database = env.get('RVA_HHL_SUPABASE_URL');
  let deadline = Infinity;
  const transport = (url, options = {}) => fetcher(url, {...options, signal: Number.isFinite(deadline) ? AbortSignal.any([options.signal || new AbortController().signal, AbortSignal.timeout(Math.max(1, deadline - Date.now()))]) : options.signal});
  function configured() {
    const prod = origin === 'https://revitalizedacademy.com' && database === 'https://voalfpxiyznnqfcqcymd.supabase.co' && context.site?.id === 'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06';
    const local = env.get('RVA_HHL_MODE') === 'test' && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin || '') && /^http:\/\/127\.0\.0\.1:\d+$/.test(database || '') && context.site?.id === 'local-review';
    if (!prod && !local) throw new EventError('event_environment_unavailable');
  }
  async function rpc(name, args, jwt) {
    configured();
    const key = env.get(jwt ? 'RVA_HHL_SUPABASE_ANON_KEY' : 'RVA_HHL_SUPABASE_SERVICE_ROLE_KEY');
    if (!key) throw new EventError('event_database_unavailable');
    let response;
    try {response = await transport(database + '/rest/v1/rpc/' + name, {method: 'POST', headers: {apikey: key, Authorization: 'Bearer ' + (jwt || key), 'Content-Type': 'application/json'}, body: JSON.stringify(args), signal: AbortSignal.timeout(10000), redirect: 'error'});}
    catch {throw new EventError('event_database_unavailable');}
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const status = data.code === '42501' || response.status === 401 || response.status === 403 ? 403 : data.message === 'registration_rate_limited' ? 429 : 409;
      throw new EventError(status === 403 ? 'event_access_denied' : status === 429 ? 'registration_rate_limited' : 'event_request_unavailable', status);
    }
    return response.json();
  }
  const service = (action, data = {}) => rpc('hhl_service_command', {p_action: action, p_data: data});
  const staff = (jwt, action, data = {}) => rpc('hhl_staff_command', {p_action: action, p_data: data}, jwt);
  const zoom = zoomClient(env, transport);
  return {
    async handle(request) {
      try {
        const action = new URL(request.url).pathname.split('/').at(-1);
        if (request.method === 'GET' && action === 'sessions') {
          if (!enabled(env, 'RVA_HHL_REGISTRATION_ENABLED')) return json({sessions: [], timezone: 'America/New_York'});
          return json(await service('sessions'));
        }
        if (request.method !== 'POST') return json({error: 'method_not_allowed'}, 405);
        const {raw, body} = await readBody(request, ['zoom-webhook','email-webhook'].includes(action) ? 64000 : 16000);
        if(action==='email-webhook') {
          configured();if(!enabled(env,'RVA_HHL_NOTIFICATIONS_ENABLED'))throw new EventError('notifications_held');
          if(!verifyResend(raw,request.headers,env.get('RVA_HHL_RESEND_WEBHOOK_SECRET'),now()))throw new EventError('invalid_webhook',401);
          const status=({'email.delivered':'delivered','email.bounced':'bounced','email.complained':'complained','email.failed':'failed','email.suppressed':'suppressed'})[body.type];
          const tags=Array.isArray(body.data?.tags)?Object.fromEntries(body.data.tags.filter(t=>t&&typeof t.name==='string').map(t=>[t.name,t.value])):body.data?.tags;
          if(!status||tags?.event!=='health_hope_live')return json({received:true});
          if(!uuid(body.data?.email_id)||!uuid(tags.job_id))throw new EventError('invalid_webhook',400);
          return json(await service('mail-status',{event_key:hash('resend:'+request.headers.get('svix-id')),provider_id:body.data.email_id,job_id:tags.job_id,status}));
        }
        if (action === 'zoom-webhook') {
          configured();
          if (!enabled(env, 'RVA_HHL_ZOOM_ENABLED')) throw new EventError('zoom_held');
          const secret = env.get('RVA_HHL_ZOOM_WEBHOOK_SECRET');
          if (!secret || !env.get('RVA_HHL_ZOOM_ACCOUNT_ID') || !/^\d{9,12}$/.test(env.get('RVA_HHL_ZOOM_MEETING_ID') || '')) throw new EventError('zoom_not_configured');
          if (!verifyZoom(raw, request.headers, secret, now())) throw new EventError('invalid_webhook', 401);
          if (body.event === 'endpoint.url_validation') {
            const token = body.payload?.plainToken; if (typeof token !== 'string' || token.length > 200) throw new EventError('invalid_webhook', 400);
            return json({plainToken: token, encryptedToken: createHmac('sha256', secret).update(token).digest('hex')});
          }
          if (body.payload?.account_id !== env.get('RVA_HHL_ZOOM_ACCOUNT_ID')) throw new EventError('invalid_webhook_account', 403);
          const object = body.payload?.object;
          if (!object || String(object.id) !== env.get('RVA_HHL_ZOOM_MEETING_ID')) return json({received: true});
          if (['meeting.updated','meeting.deleted'].includes(body.event)) {
            const occurrence = object.occurrence_id;
            if (occurrence != null && (typeof occurrence !== 'string' || occurrence.length > 100)) throw new EventError('invalid_webhook',400);
            return json(await service('zoom-change',{event_key:hash(raw),kind:body.event==='meeting.deleted'?'deleted':'updated',meeting_id:String(object.id),occurrence_id:occurrence || null}));
          }
          if (body.event !== 'meeting.participant_joined') return json({received: true});
          const participant = object.participant || {};
          const stamp = Date.parse(participant.join_time);
          if (!Number.isFinite(stamp) || stamp > now() + 300000 || typeof object.uuid !== 'string' || object.uuid.length > 200) throw new EventError('invalid_webhook', 400);
          const registrant = participant.registrant_id;
          if (registrant != null && (typeof registrant !== 'string' || registrant.length > 200)) throw new EventError('invalid_webhook', 400);
          // Do not store Zoom raw payloads, display names or email guesses.
          return json(await service('attendance', {event_key: hash(raw), meeting_id: String(object.id), instance_uuid: object.uuid, registrant_id: registrant || null, observed_at: new Date(stamp).toISOString()}));
        }
        if (request.headers.get('origin') !== origin) throw new EventError('request_not_allowed', 403);
        if (action === 'register') {
          let acceptance=null,acceptanceJwt=null;
          if(enabled(env,'RVA_HHL_ACCEPTANCE_ENABLED')) {
            acceptance=acceptanceScope(env,now());
            if(!acceptance)throw new EventError('registration_held');
            const authorization=request.headers.get('authorization')||'';
            if(!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization))throw new EventError('sign_in_required',401);
            acceptanceJwt=authorization.slice(7);
            const scope=await staff(acceptanceJwt,'acceptance-info');
            if(!scope||Object.keys(acceptance).some(key=>scope[key]!==acceptance[key]))throw new EventError('event_access_denied',403);
          } else if (!enabled(env, 'RVA_HHL_REGISTRATION_ENABLED')) throw new EventError('registration_held');
          const allowed = ['request_id', 'session_id', 'first_name', 'last_name', 'email', 'event_notifications', 'marketing_requested', 'company_website', 'source'];
          if (Object.keys(body).some(key => !allowed.includes(key)) || !uuid(body.request_id) || !uuid(body.session_id) || !['first_name','last_name'].every(key => typeof body[key] === 'string' && body[key].trim().length >= 1 && body[key].length <= 100 && !/[\x00-\x1f\x7f]/.test(body[key])) || typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) || body.event_notifications !== true || typeof body.marketing_requested !== 'boolean' || body.source !== 'health_hope_live_website') throw new EventError('invalid_registration', 400);
          if (body.company_website) return json({received: true}, 202);
          if(acceptance&&(body.email.trim().toLowerCase()!==acceptance.email||body.session_id!==acceptance.session_id||body.request_id!==acceptance.request_id||body.marketing_requested!==false))throw new EventError('acceptance_scope_mismatch',403);
          const secret = env.get('RVA_HHL_RATE_SECRET'); if (!secret || !context.ip) throw new EventError('registration_protection_unavailable');
          const {company_website, ...input} = body;
          const registration={...input, guest_model_version: 'hhl-guest-v1', privacy_model_version: 'hhl-privacy-v1', ip_hash: createHmac('sha256', secret).update(context.ip).digest('hex')};
          return json(await (acceptance?staff(acceptanceJwt,'acceptance-register',registration):service('register',registration)),202);
        }
        if (action === 'staff') {
          const authorization = request.headers.get('authorization') || '';
          if (!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization)) throw new EventError('sign_in_required', 401);
          const jwt = authorization.slice(7);
          if (typeof body.action !== 'string' || !body.data || Array.isArray(body.data) || typeof body.data !== 'object') throw new EventError('invalid_request', 400);
          if (body.action === 'zoom-validate') {
            if (!enabled(env, 'RVA_HHL_ZOOM_ENABLED')) throw new EventError('zoom_held');
            // Only existing complete Owner/Admin CRM authority may inspect Zoom.
            const overview = await staff(jwt, 'overview');
            if (!overview.can_manage) throw new EventError('event_access_denied', 403);
            const session = overview.sessions.find(row => row.id === body.data.session_id);
            if (!session) throw new EventError('session_unavailable', 409);
            const input = {session_id: session.id, meeting_id: session.zoom_meeting_id, occurrence_id: session.zoom_occurrence_id, starts_at: session.starts_at};
            await zoom.validateSession(input); return json(await service('zoom-sync', input));
          }
          const allowed = ['overview','history','join-info','settings','session-save','review-list','identity-resolve','bind-instance','attendance-resolve','attendance-status','manual-attendance','guest-stage','privacy-overview','privacy-open','privacy-export','privacy-delete','privacy-provider-manifest','privacy-provider-attest','withdraw-consent','prepare-weekly'];
          if (!allowed.includes(body.action)) throw new EventError('invalid_request', 400);
          const data = {...body.data};
          const blankLink = data.manual_join_url == null || data.manual_join_url === '';
          // Existing staff commands still authorize/audit every draft write.
          // Never fill a joining link during publication or editing of a session.
          if (blankLink && (body.action === 'prepare-weekly' || body.action === 'session-save' && !data.id && data.status === 'draft' && data.join_mode === 'manual' && (!data.zoom_meeting_id || data.zoom_meeting_id === HEALTH_HOPE_MEETING.meeting_id))) {
            data.manual_join_url = HEALTH_HOPE_MEETING.join_url;
            if (body.action === 'session-save') data.zoom_meeting_id = HEALTH_HOPE_MEETING.meeting_id;
          }
          const result = await staff(jwt, body.action, data);
          // Setup metadata follows successful current manager authorization.
          // Public/session/registration responses never gain the joining link.
          if (body.action === 'overview' && result.can_manage === true) {
            const {join_url, ...setup} = HEALTH_HOPE_MEETING;
            const scope=acceptanceScope(env,now());
            const verified=scope?await staff(jwt,'acceptance-info'):null;
            const mayAccept=scope&&verified&&Object.keys(scope).every(key=>verified[key]===scope[key]);
            return json({...result, meeting_setup: setup,...(mayAccept?{acceptance_case:scope}:{})});
          }
          return json(result);
        }
        return json({error: 'not_found'}, 404);
      } catch (error) {return json({error: error instanceof EventError ? error.code : 'event_unavailable'}, error instanceof EventError ? error.status : 503);}
    },
    async retention() {
      if (!enabled(env,'RVA_HHL_RETENTION_ENABLED')) return {held:true};
      return service('privacy-maintain',{allow_retention:true});
    },
    async worker() {
      if (!enabled(env, 'RVA_HHL_WORKER_ENABLED') || (!enabled(env, 'RVA_HHL_ZOOM_ENABLED') && !enabled(env, 'RVA_HHL_NOTIFICATIONS_ENABLED'))) return {held: true, processed: 0};
      const acceptance=enabled(env,'RVA_HHL_ACCEPTANCE_ENABLED')?acceptanceScope(env,now()):null;
      if((enabled(env,'RVA_HHL_ACCEPTANCE_ENABLED')||env.get('RVA_HHL_DELIVERY_MODE')==='acceptance')&&!acceptance)return {held:true,processed:0};
      configured(); deadline = Date.now() + 23000; let processed = 0;
      if (!acceptance&&enabled(env,'RVA_HHL_ZOOM_ENABLED')) {
        const sessions = await service('zoom-sessions');
        if (sessions.length) {
          let snapshot;
          try {snapshot=await zoom.meeting(env.get('RVA_HHL_ZOOM_MEETING_ID'));}
          catch(error) {
            if(error instanceof EventError && error.code==='zoom_meeting_requires_review') for(const session of sessions) await service('zoom-change',{event_key:hash('provider-review:'+session.id+':'+session.revision),kind:'updated',meeting_id:session.meeting_id,occurrence_id:session.occurrence_id});
            return {processed:0,zoom_review_required:true};
          }
          for(const session of sessions) {
            try {await zoom.validateSession(session,snapshot);await service('zoom-sync',session);}
            catch {await service('zoom-change',{event_key:hash('occurrence-review:'+session.id+':'+session.revision),kind:'updated',meeting_id:session.meeting_id,occurrence_id:session.occurrence_id});}
          }
        }
      }
      for (let n = 0; n < 10 && Date.now() < deadline - 3000; n++) {
        if(acceptance&&!acceptanceScope(env,now()))break;
        const lease = await service(acceptance?'acceptance-claim':'claim', acceptance?{...acceptance,allow_notifications:enabled(env,'RVA_HHL_NOTIFICATIONS_ENABLED')}:{allow_zoom: enabled(env, 'RVA_HHL_ZOOM_ENABLED'), allow_notifications: enabled(env, 'RVA_HHL_NOTIFICATIONS_ENABLED')}); if (!lease) break;
        try {
          const job = await service('job', lease);
          if(acceptance&&(job.kind!=='confirmation'||job.email!==acceptance.email||job.session_id!==acceptance.session_id||job.revision!==acceptance.revision||job.join_mode!=='manual'))throw new EventError('acceptance_scope_mismatch');
          if (!Number.isFinite(Date.parse(job.expires_at)) || Date.parse(job.expires_at)<=now()) throw new EventError('event_retention_expired');
          if (job.kind === 'zoom') {
            if (!enabled(env, 'RVA_HHL_ZOOM_ENABLED')) throw new EventError('zoom_held');
            const result = await zoom.register(job); await service('finish', {...lease, state: 'done', ...result});
          } else {
            if (!enabled(env, 'RVA_HHL_NOTIFICATIONS_ENABLED')) throw new EventError('notifications_held');
            if (Date.parse(job.first_attempt_at) <= now() - 23 * 3600000) throw new EventError('notification_retry_window_expired');
            const key = env.get('RVA_HHL_RESEND_API_KEY'), from = env.get('RVA_HHL_EMAIL_FROM'), replyTo=env.get('RVA_HHL_EMAIL_REPLY_TO'); if (!key || !eventSender(from,replyTo) || !env.get('RVA_HHL_RESEND_WEBHOOK_SECRET')) throw new EventError('notifications_not_configured');
            const mail = emailForJob(job);
            if(acceptance&&!acceptanceScope(env,now()))throw new EventError('acceptance_window_expired');
            let response;
            try {response = await transport('https://api.resend.com/emails', {method: 'POST', headers: {Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'Idempotency-Key': 'hhl-' + job.id}, body: JSON.stringify({from, reply_to:replyTo, to: [job.email], tags:[{name:'event',value:'health_hope_live'},{name:'job_id',value:job.id}], ...mail}), signal: AbortSignal.timeout(10000), redirect: 'error'});}
            catch {throw new EventError('notification_retry_pending', 503, true);}
            if (!response.ok) throw new EventError('notification_delivery_pending', 503, response.status === 429 || response.status >= 500);
            const data = await response.json(); if (typeof data.id !== 'string' || data.id.length > 200) throw new EventError('notification_retry_pending', 503, true);
            await service('finish', {...lease, state: 'done', provider_id: data.id});
          }
          processed++;
        } catch (error) {
          const code = error instanceof EventError ? error.code : 'event_job_requires_review';
          // Never blindly retry a Zoom registration whose response is uncertain.
          try {await service('finish', {...lease, state: error instanceof EventError && error.retryable ? 'pending' : 'review', error: code});} catch {break;} // An expired lease is reconciled on the next claim; never re-send here.
        }
      }
      return {processed};
    }
  };
}
