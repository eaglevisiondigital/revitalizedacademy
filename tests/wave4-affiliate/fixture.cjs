'use strict';
const {fixture}=require('../wave2-affiliate/fixtures.cjs');
const {createFixtureAdapter}=require('../../tools/affiliate-share-preview/adapter.cjs');
const clone=x=>structuredClone(x);
function adapterFixture(){
 const f=fixture();f.policy.destination_urls=['https://academy.synthetic.invalid/enroll'];f.policy.asset_origins=['https://media.synthetic.invalid'];f.profile.share_url='https://academy.synthetic.invalid/enroll?ref='+f.profile.referral_code;f.campaign.destination_url=f.policy.destination_urls[0];f.creative.asset_url='https://media.synthetic.invalid/fictional-resource.pdf';
 const session={fixtureOnly:true,authenticated:true,scope_id:f.context.scope_id,user_id:f.context.user_id,contact_id:f.context.contact_id,market:f.context.market,role:'affiliate',allowed_actions:['share','referral','touchpoint'],authorization_epoch:'fixture-epoch-a',authority_revision:1,transport_revision:'transport-1'};
 const share={fixtureOnly:true,authority_revision:1,scope_id:session.scope_id,profile:f.profile,policy:f.policy,campaign:f.campaign,creative:f.creative,trackingConsent:f.trackingConsent};
 // Resolver itself returns only a minimum referral projection, never a private contact row.
 const referral={fixtureOnly:true,authority_revision:1,scope_id:session.scope_id,profile:f.profile,referral:{referral_id:f.referral.referral_id,referrer_contact_id:f.referral.referrer_contact_id,status:f.referral.status},disclosure:f.disclosure};
 const hooks={},calls=[];let now=f.context.now;
 const deps={mode:'fictional-preview',getSession:async()=>{calls.push({kind:'session'});const value=clone(session);if(hooks.session)await hooks.session();return value;},currentAuthority:()=>{calls.push({kind:'current'});return clone(session);},resolveShare:async args=>{calls.push({kind:'share',args});const value=clone(share);if(hooks.share)await hooks.share();return value;},resolveReferral:async args=>{calls.push({kind:'referral',args});const value=clone(referral);if(hooks.referral)await hooks.referral();return value;},clock:()=>{if(hooks.clock)hooks.clock();return now;}};
 const adapter=createFixtureAdapter(deps);
 function bump(){session.authority_revision++;share.authority_revision=referral.authority_revision=session.authority_revision;}
 function identity(suffix){session.user_id='fictional-user-'+suffix;session.contact_id='fictional-contact-'+suffix;share.profile.user_id=session.user_id;share.profile.contact_id=session.contact_id;share.trackingConsent.user_id=session.user_id;referral.disclosure.viewer_user_id=session.user_id;referral.disclosure.viewer_contact_id=session.contact_id;referral.referral.referrer_contact_id=session.contact_id;bump();}
 return {adapter,deps,session,share,referral,hooks,calls,bump,identity,setNow:value=>now=value,shareRequest:{action:'share',campaign_id:share.campaign.id,creative_id:share.creative.id,expected_campaign_revision:2,expected_creative_revision:4,channel:'email'},referralRequest:{action:'referral',referral_id:referral.referral.referral_id}};
}
function touch(f,id='fictional-event',changes={}){return {...f.shareRequest,action:'touchpoint',event_id:id,event_type:'share.clicked',...changes};}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
module.exports={adapterFixture,touch,deferred};
