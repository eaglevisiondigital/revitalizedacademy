'use strict';
const { VERSION } = require('../../js/rva-affiliate-share-contract.cjs');
// Invented configuration only. Not an approved RVA campaign, consent or compensation policy.
function fixture() {
  const starts_at = '2026-11-01T00:00:00Z', expires_at = '2026-11-03T00:00:00Z';
  const channels = ['email', 'sms', 'dm', 'social'];
  return {
    context: { enabled: true, authenticated: true, scope_id: 'fictional-rva', user_id: 'fictional-user-a',
      contact_id: 'fictional-contact-a', market: 'CA', now: '2026-11-01T12:00:00Z' },
    profile: { user_id: 'fictional-user-a', contact_id: 'fictional-contact-a', referral_profile_status: 'active',
      referral_code: 'RVA-FICTIONAL001', share_url: 'https://academy.invalid/enroll?ref=RVA-FICTIONAL001' },
    policy: { destination_urls: ['https://academy.invalid/enroll'], asset_origins: ['https://media.invalid'] },
    campaign: { id: 'fictional-campaign', status: 'published', revision: 2, approved_revision: 2,
      starts_at, expires_at, revoked_at: null, channels, markets: ['CA'],
      destination_url: 'https://academy.invalid/enroll', disclosure: 'Fictional approved disclosure for testing only.' },
    creative: { id: 'fictional-creative', campaign_id: 'fictional-campaign', campaign_revision: 2,
      status: 'approved', revision: 4, approved_revision: 4, starts_at, expires_at, revoked_at: null,
      channels, markets: ['CA'], media_type: 'pdf', asset_url: 'https://media.invalid/resource.pdf',
      copy: Object.fromEntries(channels.map(c => [c, { approved_revision: 4, text: 'Fictional resource for ' + c + '.' }])) },
    channel: 'email',
    referral: { referral_id: 'fictional-referral', referrer_contact_id: 'fictional-contact-a', status: 'engaged',
      referred_email: 'invented@example.invalid', assessment_answers: 'NEVER PROJECT', notes: 'NEVER PROJECT',
      reward_value: 123, metadata: { secret: 'NEVER PROJECT' } },
    disclosure: { approved: true, viewer_user_id: 'fictional-user-a', viewer_contact_id: 'fictional-contact-a',
      referral_id: 'fictional-referral', revoked_at: null, starts_at, expires_at, statuses: ['engaged'] },
    trackingConsent: { approved: true, scope_id: 'fictional-rva', user_id: 'fictional-user-a', revoked_at: null, starts_at, expires_at },
    state: { version: VERSION, scope_id: 'fictional-rva', user_id: 'fictional-user-a', contact_id: 'fictional-contact-a', events: [] },
    event: { event_id: 'fictional-event', producer: 'fictional-adapter', event_type: 'share.clicked',
      referrer_contact_id: 'fictional-contact-a', campaign_id: 'fictional-campaign', creative_id: 'fictional-creative',
      occurred_at: '2026-11-01T11:59:59Z', assessment_answers: 'NEVER PROJECT' }
  };
}
module.exports = { fixture };
