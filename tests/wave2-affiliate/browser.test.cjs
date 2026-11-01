'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), cp = require('node:child_process');
const { chromium, webkit } = require('playwright');
const { fixture } = require('./fixtures.cjs');
const current = fs.readFileSync('portal/portal-referrals.js', 'utf8');
const baseline = cp.execFileSync('git', ['show', 'fc6737415da36b4306afa0060a525eca2f1131ca:portal/portal-referrals.js'], { encoding: 'utf8' });
const contractSource = fs.readFileSync('js/rva-affiliate-share-contract.cjs', 'utf8');
const payload = '<img src="data:," onerror="window.__injected=true">';
const shell = '<div id="referral-admin-panel" hidden></div><div id="referral-admin-list"></div><button id="referral-admin-new-program"></button><form id="referral-program-form"></form><div id="referral-program-modal" class="hidden"></div>';
async function loadReferral(page, source) {
  await page.setContent(shell);
  await page.evaluate(({ source, payload }) => {
    window.__injected = false;
    window.RA_PORTAL = {
      hasPermission: () => true,
      authClient: { from: () => ({ select: () => ({
        order: async () => ({ error: { message: payload } }),
        maybeSingle: async () => ({ data: {} })
      }) }) }
    };
    const original = window.setTimeout;
    window.setTimeout = () => 0; // Suppress the real startup timer; dispatch the exact handler below.
    (0, eval)(source);
    window.setTimeout = original;
    document.dispatchEvent(new Event('ra:dashboard-loaded'));
  }, { source, payload });
  await page.waitForFunction(() => document.getElementById('referral-admin-list').textContent.includes('Referral data could not be loaded.'));
}
for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
  for (const width of [1440, 768, 390]) {
    test(`${name} ${width}px baseline injection proof, fixed error DOM, opt-in share/CRM fixture`, async () => {
      const browser = await engine.launch({ headless: true, ...(name === 'Chromium' && process.env.RVA_TEST_CHROMIUM_EXECUTABLE ? { executablePath: process.env.RVA_TEST_CHROMIUM_EXECUTABLE } : {}) });
      const network = [], errors = [];
      try {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        page.on('pageerror', err => errors.push(err.message));
        await page.route('**/*', route => { network.push(route.request().url()); return route.abort(); });
        await loadReferral(page, baseline);
        assert.equal(await page.locator('#referral-admin-list img').count(), 1);
        await page.waitForFunction(() => window.__injected === true);
        // New page: no stale event listeners or injected state from the baseline reproduction.
        await page.close();
        const fixed = await browser.newPage({ viewport: { width, height: 900 } });
        fixed.on('pageerror', err => errors.push(err.message));
        await fixed.route('**/*', route => { network.push(route.request().url()); return route.abort(); });
        await loadReferral(fixed, current);
        assert.equal(await fixed.locator('#referral-admin-list img').count(), 0);
        assert.equal(await fixed.evaluate(() => window.__injected), false);
        assert.equal(await fixed.locator('#referral-admin-list .empty-state').textContent(), 'Referral data could not be loaded. ' + payload);
        await fixed.setContent('<label>Fictional share channel<select id="channel"><option>email</option><option>sms</option><option>dm</option><option>social</option></select></label><button id="prepare">Prepare approved copy</button><textarea id="copy" style="box-sizing:border-box;width:100%" aria-label="Approved copy" readonly></textarea><output id="qr" style="overflow-wrap:anywhere"></output><p id="status" role="status"></p><div id="crm"></div>');
        await fixed.evaluate(({ source, f }) => {
          const module = { exports: {} }; eval(source);
          const contract = module.exports;
          document.getElementById('prepare').addEventListener('click', () => {
            try {
              const result = contract.shareIntent({ ...f, channel: document.getElementById('channel').value });
              document.getElementById('copy').value = result.copy_text;
              document.getElementById('copy').select();
              document.getElementById('qr').textContent = result.qr_payload;
              document.getElementById('crm').textContent = JSON.stringify(contract.projectReferral(f));
              document.getElementById('status').textContent = 'Fictional copy prepared; QR input only.';
            } catch (error) {
              document.getElementById('copy').value = '';
              document.getElementById('qr').textContent = '';
              document.getElementById('crm').textContent = '';
              document.getElementById('status').textContent = error.message;
            }
          });
          window.revokeFixtureCreative = () => { f.creative.revoked_at = f.context.now; };
          window.switchFixtureAccount = () => { f.context.user_id = 'fictional-user-b'; };
        }, { source: contractSource, f: fixture() });
        for (const channel of ['email', 'sms', 'dm', 'social']) {
          await fixed.selectOption('#channel', channel);
          await fixed.click('#prepare');
          const copy = await fixed.inputValue('#copy'), qr = await fixed.locator('#qr').textContent();
          assert.ok(copy.includes(`Fictional resource for ${channel}.`));
          assert.ok(copy.includes('Fictional approved disclosure'));
          assert.equal(new URL(qr).searchParams.get('rva_channel'), channel);
          assert.equal(new URL(qr).searchParams.get('ref'), 'RVA-FICTIONAL001');
          assert.equal(await fixed.locator('#crm').textContent(), '{"referral_id":"fictional-referral","status":"engaged"}');
          assert.equal(await fixed.evaluate(() => document.getElementById('copy').selectionEnd > 0), true);
        }
        await fixed.evaluate(() => window.revokeFixtureCreative());
        await fixed.click('#prepare');
        assert.equal(await fixed.inputValue('#copy'), '');
        assert.equal(await fixed.locator('#qr').textContent(), '');
        assert.equal(await fixed.locator('#crm').textContent(), '');
        assert.equal(await fixed.locator('#status').textContent(), 'not_current');
        await fixed.evaluate(() => window.switchFixtureAccount());
        await fixed.click('#prepare');
        assert.equal(await fixed.locator('#status').textContent(), 'wrong_affiliate');
        assert.equal(await fixed.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        assert.deepEqual(network.filter(url => !url.startsWith('data:')), []);
      } finally { await browser.close(); }
    });
  }
}
