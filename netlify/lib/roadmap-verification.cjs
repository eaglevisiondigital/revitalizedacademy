'use strict';
// Caller JWT only. No source logging, service credentials, arbitrary proxy or AI.
const config = require('../../config/production.json');
const origin = 'https://revitalizedacademy.com';
const actions = new Set(['authorize', 'search', 'status', 'check', 'contact', 'attest']);
function createHandler({fetch: request = fetch} = {}) {
  return async (req, context) => {
    const reply = (status, body) => Response.json(body, {status, headers: {
      'Cache-Control': 'private, no-store, max-age=0', 'Netlify-CDN-Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Authorization, Origin'
    }});
    if (context?.site?.id !== 'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06' || context?.deploy?.context !== 'production' ||
        new URL(req.url).origin !== origin || req.headers.get('origin') !== origin || new URL(req.url).search) return reply(403, {unavailable: true});
    if (req.method !== 'POST') return reply(405, {unavailable: true});
    const bearer = req.headers.get('authorization');
    if (!/^Bearer [A-Za-z0-9_.-]+$/.test(bearer || '')) return reply(401, {unavailable: true});
    if (!req.headers.get('content-type')?.startsWith('application/json')) return reply(415, {unavailable: true});
    try {
      const raw = await req.text();
      if (raw.length > 6000) return reply(413, {unavailable: true});
      const body = JSON.parse(raw);
      if (!body || Array.isArray(body) || !actions.has(body.action) || Object.keys(body).some(k => !['action', 'payload'].includes(k))) return reply(400, {unavailable: true});
      const result = await request(config.supabaseUrl + '/rest/v1/rpc/roadmap_b42', {
        method: 'POST', headers: {apikey: config.supabaseKey, Authorization: bearer, 'Content-Type': 'application/json'},
        body: JSON.stringify({p_action: body.action, p_payload: body.payload || {}}), redirect: 'error', signal: AbortSignal.timeout(12000)
      });
      if (!result.ok) {
        const error = await result.json().catch(() => ({}));
        return reply(200, {unavailable: true, conflict: error.code === '40001', invalid: error.code === '22023'});
      }
      return reply(200, await result.json());
    } catch { return reply(503, {unavailable: true}); }
  };
}
module.exports = {createHandler};
