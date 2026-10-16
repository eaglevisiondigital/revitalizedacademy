'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pw = require(process.env.RVA_PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve('roadmap-b21-dist');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const results = [];
const assets = [
  'js/vitality-roadmap-view.js', 'js/vitality-roadmap-b2-engine.js',
  'js/vitality-roadmap-b2-scenarios.js', 'js/vitality-roadmap-b2-source-map.js',
  'portal/portal-roadmap-review.js', 'portal/portal-roadmap-b2-workbench.js',
  'js/vitality-roadmap-b21-engine.js', 'js/vitality-roadmap-b21-scenarios.js',
  'portal/portal-roadmap-b21-workbench.js'
];
async function fixture(page) {
  await page.route('**/*', route => route.request().isNavigationRequest()
    ? route.fulfill({contentType: 'text/html', body: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>'})
    : route.abort());
  await page.goto('https://b21.fixture.invalid');
  await page.setContent('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><section id="vitality-assessments-panel"></section></body></html>');
  for (const file of ['css/vitality-roadmap-workspace.css', 'css/vitality-roadmap-b2-workbench.css', 'css/vitality-roadmap-b21-workbench.css']) await page.addStyleTag({content: read(file)});
  await page.evaluate(() => {
    window.RVA_ENV = {environment: 'staging'};
    window.active = true; window.delay = false; window.identity = 'A'; window.calls = [];
    window.RA_PORTAL = {
      createAuthenticatedTaskGuard() {
        let epoch = 0;
        return {begin: () => window.active ? ++epoch : null, current: t => window.active && epoch === t, cancel: () => ++epoch};
      },
      authClient: {rpc: async (name, args) => {
        window.calls.push({name, args});
        const id = window.identity;
        if (window.deny) return {error: {code: '42501'}};
        if (window.delay) await new Promise(resolve => { window.resolveDelayed = resolve; });
        if (name === 'list_vitality_roadmap_preparation') return {data: [{report_id: 'synthetic-report', participant_name: 'Synthetic ' + id}]};
        if (name === 'get_vitality_roadmap_preparation') return {data: {
          questionnaire_version: 'secure-snapshot-v1', source: {pathway: 'Adult', assessment_for: 'Myself', answers: {
            water_intake_consistency: [{type: 'select-one', value: 'Often'}],
            hydration_proficiency: [{type: 'select-one', value: 'Very confident'}],
            hydration_strong_thirst_frequency: [{type: 'select-one', value: 'Often'}],
            hydration_other: [{type: 'textarea', value: 'PRIVATE ' + id + ' SOURCE ANSWER <img src=x onerror=window.untrustedExecuted=true>'}]
          }}
        }};
        throw Error('Unexpected write or RPC: ' + name);
      }}
    };
  });
  for (const file of assets) await page.addScriptTag({content: read(file)});
}
async function overflow(page) {
  const values = await page.evaluate(() => {
    const modal = document.querySelector('[aria-label="B2.1 fictional founder calibration"]');
    return {page: document.documentElement.scrollWidth <= innerWidth + 1, modal: !modal || modal.scrollWidth <= modal.clientWidth + 1};
  });
  assert.deepEqual(values, {page: true, modal: true});
}
(async () => {
  for (const engine of ['chromium', 'webkit']) {
    const browser = await pw[engine].launch(engine === 'chromium' ? {executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'} : {});
    try {
      for (const viewport of [{width: 1440, height: 1000}, {width: 768, height: 1024}, {width: 390, height: 844}]) {
        const context = await browser.newContext({viewport, acceptDownloads: true});
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); });
        await fixture(page);
        const launch = page.getByRole('button', {name: 'B2.1 founder calibration · Candidate / Not Approved', exact: true});
        const dialog = page.getByRole('dialog', {name: 'B2.1 fictional founder calibration'});
        await launch.click();
        await dialog.waitFor();
        assert.equal(await page.getByLabel('Fictional assessment', {exact: true}).locator('option').count(), 50);
        assert.equal(await page.locator('[data-b21-driver]').count(), 12);
        assert.match(await dialog.innerText(), /Candidate \/ Not Approved/);
        await overflow(page);
        await page.getByRole('button', {name: 'Candidate rules & definitions', exact: true}).click();
        await overflow(page);
        await page.getByLabel('Worst-concern weight', {exact: true}).fill('0.6');
        await page.getByLabel('Reason for comparison change', {exact: true}).fill('Fictional browser regression comparison');
        await page.getByRole('button', {name: 'Apply B2.1 comparison revision', exact: true}).click();
        assert.match(await dialog.innerText(), /revision 1/i);
        await page.getByRole('button', {name: 'Actual source · Unscored', exact: true}).click();
        await page.getByLabel('Authorized source for coverage only', {exact: true}).selectOption('synthetic-report');
        await page.getByText('Overall: not calculated. All real-source scores and stages withheld.', {exact: true}).waitFor();
        assert.equal(await dialog.locator('details').count(), 12);
        await dialog.locator('details summary').first().click();
        assert.match(await dialog.innerText(), /PRIVATE A SOURCE ANSWER/);
        assert.equal(await dialog.locator('img').count(), 0);
        assert.equal(await page.evaluate(() => !!window.untrustedExecuted), false);
        await overflow(page);
        await page.getByRole('button', {name: 'Corrections & review packet', exact: true}).click();
        await page.getByLabel('Founder comparison decision', {exact: true}).selectOption('agree');
        await page.getByLabel('Reason / independent judgment', {exact: true}).fill('Synthetic regression review only; not founder approval');
        await overflow(page);
        const downloadEvent = page.waitForEvent('download');
        await page.getByRole('button', {name: 'Download B2.1 fictional review packet', exact: true}).click();
        const download = await downloadEvent;
        const exported = fs.readFileSync(await download.path(), 'utf8');
        const packet = JSON.parse(exported);
        assert.equal(packet.policyApproved, false);
        assert.equal(packet.releaseEligible, false);
        assert.equal(packet.authenticatedSignoff, false);
        assert.doesNotMatch(exported, /PRIVATE [AB] SOURCE ANSWER/);
        await page.screenshot({path: `/private/tmp/rva-roadmap-b21-${engine}-${viewport.width}.png`, fullPage: true});
        await page.keyboard.press('Escape');
        assert.equal(await dialog.count(), 0);
        assert.equal(await launch.evaluate(element => element === document.activeElement), true);
        await launch.click();
        await page.getByRole('button', {name: 'Actual source · Unscored', exact: true}).click();
        await page.evaluate(() => { window.delay = true; });
        await page.getByLabel('Authorized source for coverage only', {exact: true}).selectOption('synthetic-report');
        await page.waitForFunction(() => typeof window.resolveDelayed === 'function');
        await page.evaluate(() => { window.active = false; document.dispatchEvent(new Event('ra:staff-access-reset')); window.resolveDelayed(); });
        await page.waitForTimeout(30);
        assert.equal(await dialog.count(), 0);
        assert.doesNotMatch(await page.locator('body').innerText(), /PRIVATE A/);
        await page.evaluate(() => { window.delay = false; window.identity = 'B'; window.active = true; });
        await launch.click();
        await page.getByRole('button', {name: 'Actual source · Unscored', exact: true}).click();
        await page.getByLabel('Authorized source for coverage only', {exact: true}).selectOption('synthetic-report');
        await page.getByText('Overall: not calculated. All real-source scores and stages withheld.', {exact: true}).waitFor();
        await dialog.locator('details summary').first().click();
        assert.match(await dialog.innerText(), /PRIVATE B SOURCE ANSWER/);
        assert.doesNotMatch(await dialog.innerText(), /PRIVATE A SOURCE ANSWER/);
        await page.keyboard.press('Escape');
        await page.evaluate(() => { window.deny = true; });
        await launch.click();
        await page.getByText('Verified private-health permission and contact scope are required.', {exact: true}).waitFor();
        assert.equal(await dialog.count(), 0);
        const calls = await page.evaluate(() => window.calls);
        assert.ok(calls.every(call => ['list_vitality_roadmap_preparation', 'get_vitality_roadmap_preparation'].includes(call.name)));
        assert.deepEqual(errors, []);
        results.push({engine, viewport, cases: 50, drivers: 12, responsive: true, exportPrivacy: true, staleSessionDenied: true, accountIsolation: true, deniedAccess: true, hostedWrites: 0, consoleWarningsErrors: errors});
        await context.close();
      }
    } finally { await browser.close(); }
  }
  console.log(JSON.stringify({passed: results.length, results}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
