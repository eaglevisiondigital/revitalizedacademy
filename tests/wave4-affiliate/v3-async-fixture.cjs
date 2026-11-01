'use strict';
const A=require('../../tools/coach-companion-catalog/index.cjs');
const {createFictionalLookupAdapter}=require('../../tools/coach-companion-catalog/async-fixture-adapter.cjs');
const omit=(x,keys)=>Object.fromEntries(Object.entries(x).filter(([k])=>!keys.includes(k)));
function v3Fixture(){
 const H='a'.repeat(64),R='b'.repeat(64);const approval=()=>({state:'approved',receiptHash:R,targetHash:H,generation:1,scopes:['education']});
 const source={id:'fictional-async-source',version:'fictional-source-v1',sha256:H,dataClass:'fictional',category:'approved_education',speakerStatus:'founder_authored_document',attributionReceiptHash:H,approval:approval(),conflict:{state:'none'},audiences:['fictional_reviewer']};
 source.approval.targetHash=A.fingerprint(omit(source,['approval']));
 const claim={id:'fictional-async-claim',sourceId:source.id,sourceVersion:source.version,sourceHash:H,dataClass:'fictional',driver:'momentum_regimens',topic:'fictional-reflection',kind:'education',text:'SYNTHETIC ONLY: invented asynchronous educational fixture, not advice.',locator:'fictional paragraph 1',approval:approval(),conflict:{state:'none'},scope:'global',clinicalProtocol:false,safetyHold:false,audiences:['fictional_reviewer']};claim.sha256=A.fingerprint(omit(claim,['sha256','approval']));claim.approval.targetHash=claim.sha256;
 const catalog={schemaVersion:A.CATALOG_SCHEMA,dataClass:'fictional',version:'fictional-async-catalog-v1',foundationHash:H,approvalGeneration:1,sources:[source],claims:[claim]};catalog.sha256=A.fingerprint(catalog);
 const session={fixtureOnly:true,principal_ref:'fictional-reviewer-a',authorization_epoch:'fictional-epoch-a',authority_revision:1,audience:'fictional_reviewer',approval_generation:1,educationAllowed:true,transport_revision:'token-one'};
 const catalogSnapshot={fixtureOnly:true,authority_revision:1,audience:session.audience,approval_generation:1,catalog_id:'fictional-selected-catalog',catalog};
 const receipts={fixtureOnly:true,authority_revision:1,audience:session.audience,approval_generation:1,records:[{kind:'source',id:source.id,verdict:'approved',targetHash:source.approval.targetHash,receiptHash:R,generation:1},{kind:'claim',id:claim.id,verdict:'approved',targetHash:claim.sha256,receiptHash:R,generation:1}]};
 const hooks={},calls=[];
 const deps={mode:'fictional-preview',getSession:async()=>{calls.push('session');return structuredClone(session);},currentAuthority:()=>{calls.push('current');if(hooks.current)hooks.current();return structuredClone(session);},resolveCatalog:async args=>{calls.push('catalog');const snap=structuredClone(catalogSnapshot);if(hooks.catalog)await hooks.catalog(args);return snap;},resolveReceipts:async args=>{calls.push('receipts');const snap=structuredClone(receipts);if(hooks.receipts)await hooks.receipts(args);return snap;}};
 const adapter=createFictionalLookupAdapter(deps),request={catalog_id:catalogSnapshot.catalog_id,expected_catalog_version:catalog.version,expected_catalog_hash:catalog.sha256,expected_approval_generation:1,driver:claim.driver,topic:claim.topic,limit:1};
 return {adapter,deps,hooks,calls,session,catalogSnapshot,receipts,source,claim,catalog,request,bump(){session.authority_revision++;catalogSnapshot.authority_revision=receipts.authority_revision=session.authority_revision;}};
}
module.exports={v3Fixture};
