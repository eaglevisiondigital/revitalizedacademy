'use strict';
// Independent synthetic probes. These do not supply real auth/consent or certify a backend.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const api=require('../../js/rva-affiliate-share-contract.cjs');
const {fixture}=require('../wave2-affiliate/fixtures.cjs');
const source=fs.readFileSync('portal/portal-referrals.js','utf8');
const shell='<div id="referral-admin-panel" hidden></div><div id="referral-admin-list"></div><button id="referral-admin-new-program"></button><form id="referral-program-form"></form><div id="referral-program-modal" class="hidden"></div>';
for(const payload of ['<svg onload="window.__injected=true"></svg>','</div><iframe src="https://never-request.invalid"></iframe>','<script>window.__injected=true</script>'])test('actual staff error source renders adversarial message as literal data: '+payload.split('>')[0],async()=>{
 const dom=new JSDOM(shell,{runScripts:'outside-only',url:'https://qa.invalid/portal/'}),w=dom.window;
 try{
  w.__injected=false;w.RA_PORTAL={hasPermission:()=>true,authClient:{from:()=>({select:()=>({order:async()=>({error:{message:payload}}),maybeSingle:async()=>({data:{}})})})}};
  w.setTimeout=()=>0;w.eval(source);w.document.dispatchEvent(new w.Event('ra:dashboard-loaded'));
  await new Promise(resolve=>setImmediate(resolve));
  const node=w.document.getElementById('referral-admin-list');assert.equal(node.textContent,'Referral data could not be loaded. '+payload);assert.equal(node.querySelectorAll('svg,img,script,iframe,[onload],[onerror]').length,0);assert.equal(w.__injected,false);
 }finally{dom.window.close();}
});
test('documented trust limit: self-consistent fictional flags are accepted without a signature or backend Auth',()=>{
 const f=fixture();f.context.user_id=f.profile.user_id='forged-fixture-user';f.context.contact_id=f.profile.contact_id='forged-fixture-contact';
 assert.equal(api.shareIntent(f).campaign_id,f.campaign.id);assert(!Object.hasOwn(f,'signature'));assert(!Object.hasOwn(f,'approval_receipt'));
 // Expected characterization, not an authorization bypass claim: caller must reauthorize server snapshots.
});
test('documented trust limit: caller-controlled policy can authorize another fictional destination',()=>{
 const f=fixture();f.policy.destination_urls=['https://caller-selected.invalid/enroll'];f.campaign.destination_url=f.policy.destination_urls[0];f.profile.share_url=f.campaign.destination_url+'?ref='+f.profile.referral_code;
 assert.equal(new URL(api.shareIntent(f).referral_url).origin,'https://caller-selected.invalid');
});
test('documented trust limit: old caller clock cannot establish current revocation/expiry authority',()=>{
 const f=fixture();assert.equal(api.shareIntent(f).channel,'email');f.context.now='2026-11-04T00:00:00Z';assert.throws(()=>api.shareIntent(f),/not_current/);
});
test('private referral fields remain absent even under nested and prototype-carried extras',()=>{
 const f=fixture();Object.setPrototypeOf(f.referral,{private_notes:'fictional-never-project'});f.referral.contact_id='fictional-never-project';f.referral.health={diagnosis:'fictional-never-project'};
 assert.deepEqual(Object.keys(api.projectReferral(f)).sort(),['referral_id','status']);assert(!JSON.stringify(api.projectReferral(f)).includes('never-project'));
});
test('no payout/settlement/earning side effect can be selected as a touchpoint',()=>{
 for(const event_type of ['payment.settled','commission.earned','payout.requested','credit.redeemed']){const f=fixture();f.event.event_type=event_type;assert.throws(()=>api.recordTouchpoint(f),/unsupported_event/);assert.equal(f.state.events.length,0);}
});
test('separate consumers of identical prior state expose no durable concurrency claim',()=>{
 const f=fixture(),a=api.recordTouchpoint(f),b=api.recordTouchpoint(f);assert.equal(a.duplicate,false);assert.equal(b.duplicate,false);assert.equal(f.state.events.length,0);assert.equal(a.state.events.length,1);assert.equal(b.state.events.length,1);
});
test('different scope cannot reuse prior touchpoint state',()=>{
 const f=fixture();f.state.scope_id='foreign-fixture-scope';assert.throws(()=>api.recordTouchpoint(f),/wrong_state_scope/);
});
