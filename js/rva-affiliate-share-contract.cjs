'use strict';

// Opt-in projection/validation only. No registration, provider, storage or financial I/O.
// Callers must supply reauthorized server snapshots. This is not an auth/RLS boundary.
const VERSION = 'rva-affiliate-share-v1';
const CHANNELS = Object.freeze(['email', 'sms', 'dm', 'social']);
const STAGES = Object.freeze(['referred', 'engaged', 'applicant', 'converted', 'cancelled', 'ineligible']);
function fail(code) { throw new Error(code); }
function id(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(value)) fail('invalid_id');
  return value;
}
function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) fail('invalid_time');
  const time = Date.parse(value);
  if (!Number.isFinite(time)) fail('invalid_time');
  return time;
}
function text(value, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) fail('invalid_text');
  return value;
}
function contextTime(context, profile) {
  if (context?.enabled !== true || context.authenticated !== true) fail('share_disabled');
  id(context.scope_id); id(context.user_id); id(context.contact_id);
  if (profile?.user_id !== context.user_id || profile.contact_id !== context.contact_id) fail('wrong_affiliate');
  if (profile.referral_profile_status !== 'active') fail('inactive_affiliate');
  return instant(context.now);
}
function activeWindow(record, now) {
  if (record.revoked_at != null || now < instant(record.starts_at) || now >= instant(record.expires_at)) fail('not_current');
}
function allowed(list, value) { return Array.isArray(list) && list.includes(value); }
function secureURL(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\s\\\u0000-\u001f\u007f]/.test(value)) fail('unsafe_url');
  let url;
  try { url = new URL(value); } catch { fail('unsafe_url'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || !url.hostname || /%(?:0[0-9a-f]|1[0-9a-f]|7f|2f|5c)/i.test(value)) fail('unsafe_url');
  return url;
}
function approvedDestination(policy, value) {
  const url = secureURL(value);
  if (!allowed(policy?.destination_urls, url.href) || url.search) fail('unapproved_destination');
  return url;
}
function approvedAsset(policy, value) {
  const url = secureURL(value);
  if (!allowed(policy?.asset_origins, url.origin) || url.search) fail('unapproved_asset');
  return url.href;
}
function shareIntent({ context, profile, policy, campaign, creative, channel }) {
  const now = contextTime(context, profile);
  if (!CHANNELS.includes(channel)) fail('invalid_channel');
  if (campaign?.status !== 'published' || !Number.isSafeInteger(campaign.revision) || campaign.revision < 1 || campaign.approved_revision !== campaign.revision) fail('unapproved_campaign');
  id(campaign.id); activeWindow(campaign, now);
  if (!allowed(campaign.channels, channel) || !allowed(campaign.markets, context.market)) fail('channel_or_market_denied');
  if (creative?.status !== 'approved' || !Number.isSafeInteger(creative.revision) || creative.revision < 1 || creative.approved_revision !== creative.revision) fail('unapproved_creative');
  id(creative.id); activeWindow(creative, now);
  if (creative.campaign_id !== campaign.id || creative.campaign_revision !== campaign.revision) fail('stale_creative');
  if (!allowed(creative.channels, channel) || !allowed(creative.markets, context.market)) fail('channel_or_market_denied');
  if (!['image', 'video', 'pdf'].includes(creative.media_type)) fail('invalid_media_type');
  const copy = creative.copy?.[channel];
  if (!copy || copy.approved_revision !== creative.revision) fail('unapproved_copy');
  const body = text(copy.text, 4000), disclosure = text(campaign.disclosure, 1000);
  const destination = approvedDestination(policy, campaign.destination_url);
  const current = secureURL(profile.share_url);
  const code = profile.referral_code;
  if (typeof code !== 'string' || !/^RVA-[A-Z0-9]{6,40}$/.test(code)) fail('invalid_referral_code');
  // Existing my_ambassador_center link has exactly one own ref query parameter.
  if (current.origin !== destination.origin || current.pathname !== destination.pathname ||
      [...current.searchParams].length !== 1 || current.searchParams.get('ref') !== code) fail('wrong_referral_link');
  destination.searchParams.set('ref', code);
  destination.searchParams.set('rva_campaign', campaign.id);
  destination.searchParams.set('rva_creative', creative.id);
  destination.searchParams.set('rva_channel', channel);
  const link = destination.href;
  return Object.freeze({
    version: VERSION, channel, campaign_id: campaign.id, campaign_revision: campaign.revision,
    creative_id: creative.id, creative_revision: creative.revision, media_type: creative.media_type,
    asset_url: approvedAsset(policy, creative.asset_url),
    copy_text: `${body}\n\n${disclosure}\n\n${link}`, referral_url: link,
    // Payload for a future approved QR encoder. This module does not render a QR image.
    qr_payload: link
  });
}
function projectReferral({ context, profile, referral, disclosure }) {
  const now = contextTime(context, profile);
  id(referral?.referral_id);
  if (referral.referrer_contact_id !== context.contact_id) fail('wrong_affiliate');
  if (disclosure?.approved !== true || disclosure.viewer_user_id !== context.user_id ||
      disclosure.viewer_contact_id !== context.contact_id || disclosure.referral_id !== referral.referral_id ||
      disclosure.revoked_at != null || now < instant(disclosure.starts_at) || now >= instant(disclosure.expires_at)) fail('disclosure_denied');
  if (!STAGES.includes(referral.status) || !allowed(disclosure.statuses, referral.status)) fail('disclosure_denied');
  // Explicit allowlist: no person names, contact methods, health, notes, rewards or metadata.
  return Object.freeze({ referral_id: referral.referral_id, status: referral.status });
}
function normalizedEvent(event, now) {
  if (!event || !['share.created', 'share.clicked', 'appointment.booked'].includes(event.event_type)) fail('unsupported_event');
  id(event.event_id); id(event.producer); id(event.campaign_id); id(event.creative_id);
  if (instant(event.occurred_at) > now) fail('future_event');
  return Object.freeze({ event_id: event.event_id, producer: event.producer, event_type: event.event_type,
    campaign_id: event.campaign_id, creative_id: event.creative_id, occurred_at: event.occurred_at });
}
function recordTouchpoint({ context, profile, state, event, trackingConsent }) {
  const now = contextTime(context, profile);
  if (trackingConsent?.approved !== true || trackingConsent.revoked_at != null ||
      trackingConsent.scope_id !== context.scope_id || trackingConsent.user_id !== context.user_id ||
      now < instant(trackingConsent.starts_at) || now >= instant(trackingConsent.expires_at)) fail('tracking_denied');
  if (!state || state.version !== VERSION || !Array.isArray(state.events) || state.events.length > 1000) fail('invalid_state');
  if (state.scope_id !== context.scope_id || state.user_id !== context.user_id || state.contact_id !== context.contact_id) fail('wrong_state_scope');
  if (event?.referrer_contact_id !== context.contact_id) fail('wrong_affiliate');
  // Reproject prior state too: do not propagate caller-added private fields on replay.
  const events = state.events.map(row => normalizedEvent(row, now));
  const keys = events.map(row => JSON.stringify([row.event_id, row.producer, row.event_type]));
  if (new Set(keys).size !== keys.length) fail('invalid_state');
  const normalized = normalizedEvent(event, now);
  const previous = events.find(row => row.event_id === event.event_id && row.producer === event.producer && row.event_type === event.event_type);
  if (previous && JSON.stringify(previous) !== JSON.stringify(normalized)) fail('event_conflict');
  if (!previous && events.length === 1000) fail('capacity_reached');
  if (!previous) events.push(normalized);
  const next = Object.freeze({ version: VERSION, scope_id: context.scope_id, user_id: context.user_id,
    contact_id: context.contact_id, events: Object.freeze(events) });
  return Object.freeze({ state: next, duplicate: Boolean(previous) });
}
module.exports = Object.freeze({ VERSION, CHANNELS, shareIntent, projectReferral, recordTouchpoint });
