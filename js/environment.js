/* Public configuration only. The build supplies RVA_PUBLIC_CONFIG; no implicit environment. */
(function (root) {
  'use strict';
  const productionRef = 'voalfpxiyznnqfcqcymd';
  const productionOrigins = ['https://revitalizedacademy.com', 'https://www.revitalizedacademy.com', 'https://revitalizedacademy.netlify.app'];
  function resolve(input) {
    if (!input || !['production', 'staging', 'local'].includes(input.environment)) throw Error('RVA environment must be explicitly configured');
    const c = {};
    for (const k of ['environment','supabaseUrl','supabaseKey','appOrigin','paymentMode','publicSiteOrigin','onboardingOrigin','authOrigin','recoveryOrigin','signupOrigin','signerOrigin','notificationOrigin','edgeBaseUrl']) if (input[k] !== undefined) c[k] = input[k];
    const fallbackOrigins = Array.isArray(input.fallbackOrigins) ? input.fallbackOrigins : [];
    if (fallbackOrigins.length > 3 || fallbackOrigins.some(value => typeof value !== 'string')) throw Error('Invalid RVA fallback origins');
    for (const k of ['supabaseUrl', 'supabaseKey', 'appOrigin', 'paymentMode']) if (!c[k]) throw Error('Missing RVA configuration: ' + k);
    const local = c.environment === 'local';
    function origin(value) {
      const u = new URL(value);
      if (u.origin !== value || u.username || u.password || (u.protocol !== 'https:' && !(local && u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname)))) throw Error('Invalid RVA origin: ' + value);
      return value;
    }
    origin(c.supabaseUrl); origin(c.appOrigin);
    const host = new URL(c.supabaseUrl).hostname;
    if (!local && !/^[a-z]{20}\.supabase\.co$/.test(host)) throw Error('A hosted Supabase project URL is required');
    c.projectRef = host.split('.')[0];
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(c.supabaseKey)) {
      let payload; try { payload = JSON.parse(atob(c.supabaseKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { throw Error('Only a publishable or anon key is allowed in browser configuration'); }
      if (payload.role !== 'anon' || (!local && payload.ref !== c.projectRef)) throw Error('Browser key must be anon for the configured project');
    }
    for (const k of ['publicSiteOrigin', 'onboardingOrigin', 'authOrigin', 'recoveryOrigin', 'signupOrigin', 'signerOrigin', 'notificationOrigin']) {
      c[k] = origin(c[k] || c.appOrigin);
      if (c.environment !== 'production' && c[k] !== c.appOrigin) throw Error('Isolated environment origins must match appOrigin: ' + k);
    }
    c.edgeBaseUrl = c.edgeBaseUrl || c.supabaseUrl + '/functions/v1';
    if (c.edgeBaseUrl !== c.supabaseUrl + '/functions/v1') throw Error('Edge URL must belong to the configured Supabase project');
    c.onboardingUrl = c.onboardingOrigin + '/member/onboarding/';
    c.signupRedirect = c.signupOrigin + '/member/onboarding/';
    c.recoveryRedirect = c.recoveryOrigin + '/portal/password-reset.html';
    c.staffRedirect = c.authOrigin + '/portal/';
    c.signerUrl = c.signerOrigin + '/member/onboarding/';
    if (c.environment !== 'production') {
      if (c.projectRef === productionRef || productionOrigins.includes(c.appOrigin)) throw Error('Isolated environment refuses production bindings');
      if (c.paymentMode !== 'synthetic') throw Error('Only synthetic payments are approved outside production');
      for (const value of fallbackOrigins) {
        origin(value);
        if (productionOrigins.includes(value) || new URL(value).hostname.endsWith('.supabase.co')) throw Error('Isolated environment refuses unsafe fallback origin');
      }
    } else if (c.projectRef !== productionRef || !productionOrigins.includes(c.appOrigin) || c.paymentMode !== 'existing') throw Error('Production configuration does not match the known mapping');
    c.allowedOrigins = Object.freeze(c.environment === 'production' ? [...productionOrigins] : [...new Set([c.appOrigin, ...fallbackOrigins])]);
    return Object.freeze(c);
  }
  function paymentUrl(value, c) {
    if (c.paymentMode !== 'existing') return null; // Provider sandbox requires a separately approved adapter.
    try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; }
  }
  if (typeof module === 'object' && module.exports) module.exports = { resolve, paymentUrl };
  else {
    try {
      const c = resolve(root.RVA_PUBLIC_CONFIG);
      if (!c.allowedOrigins.includes(root.location.origin)) throw Error('This host is not allowed by the RVA environment');
      root.RVA_ENV = c;
      root.RVA_PAYMENT_URL = value => paymentUrl(value, c);
    } catch (error) {
      root.addEventListener('DOMContentLoaded', () => {
        const warning = root.document.createElement('p'); warning.setAttribute('role', 'alert');
        warning.textContent = 'Environment configuration unavailable. Account connections are disabled.';
        root.document.body.prepend(warning);
      });
      throw error;
    }
  }
})(typeof window === 'object' ? window : globalThis);
