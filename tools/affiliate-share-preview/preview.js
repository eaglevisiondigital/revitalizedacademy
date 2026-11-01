'use strict';
(() => {
 const el=id=>document.getElementById(id);let epoch=0,manifest=null,scenarioReady=Promise.resolve(),eventId=null,scenarioSequence=0,sourceReviewSequence=0,reviewedPreview=false;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('rva-fictional-preview-reset'):null;
 // Broadcast carries no identity/data/approval; it only clears stale synthetic views.
 if(channel)channel.onmessage=()=>{clear('Fixture changed in another local tab.');busy(true);const sequence=++scenarioSequence;scenarioReady=scenarioReady.catch(()=>{}).then(()=>bootstrap(sequence)).then(()=>{if(sequence===scenarioSequence)busy(false);}).catch(()=>{if(sequence===scenarioSequence)clear('Local fixture unavailable; choose a scenario to retry.');});};
 addEventListener('pagehide',()=>channel?.close());
 function clear(message='Preview cleared.') {
  epoch++;sourceReviewSequence++;eventId=null;reviewedPreview=false;el('preview').hidden=true;el('copy').value='';el('url').value='';el('qr').removeAttribute('src');el('qr-note').textContent='';el('status').textContent=message;
  el('referral-result').textContent='';el('event-result').textContent='';el('education-result').replaceChildren();el('progress-result').replaceChildren();el('source-review-result').replaceChildren();
 }
 async function json(url,data){const response=await fetch(url,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{});const result=await response.json();if(!response.ok)throw Error('local_unavailable');return result;}
 function busy(yes){for(const id of ['prepare','referral','record','lookup','progress-read','source-review','reviewed-prepare'])el(id).disabled=yes;}
 async function bootstrap(sequence){const value=await json('/api/bootstrap');if(sequence!==scenarioSequence)return;manifest=value;el('state').value=manifest.state;if(el('driver').options.length===0)for(const driver of manifest.drivers){const option=document.createElement('option');option.value=driver;option.textContent=driver.replaceAll('_',' ');el('driver').append(option);}}
 busy(true);const initialSequence=++scenarioSequence;scenarioReady=bootstrap(initialSequence).then(()=>{if(initialSequence===scenarioSequence)busy(false);}).catch(()=>{if(initialSequence===scenarioSequence)clear('Local fixture unavailable; choose a scenario to retry.');});
 el('state').addEventListener('change',()=>{
  clear();busy(true);const sequence=++scenarioSequence,state=el('state').value;
  // Serialize scenario transitions across tabs/requests; selectors are not authentication.
  scenarioReady=scenarioReady.catch(()=>{}).then(()=>json('/api/scenario',{state})).then(value=>{if(sequence===scenarioSequence){manifest=value;el('state').value=value.state;busy(false);channel?.postMessage('fixture_changed');}}).catch(()=>{if(sequence===scenarioSequence)clear('Fixture change unavailable; choose a scenario to retry.');});
 });
 el('channel').addEventListener('change',()=>clear());el('driver').addEventListener('change',()=>{if(reviewedPreview){clear('Reviewed package cleared: Driver changed.');return;}epoch++;el('education-result').replaceChildren();el('source-review-result').replaceChildren();});
 el('progress-persona').addEventListener('change',()=>{epoch++;el('progress-result').replaceChildren();});
 el('progress-read').addEventListener('click',async()=>{const run=epoch,persona=el('progress-persona').value;el('progress-result').replaceChildren();try{await scenarioReady;const r=await json('/api/progress',{persona});if(run!==epoch||persona!==el('progress-persona').value)return;
  if(r.status!=='ready'){el('progress-result').textContent='Held: '+(r.reason||'unavailable');return;}
  const lines=['Fictional '+r.view+' dashboard — read only','Habits: '+r.habits.map(h=>h.title+' ('+(h.completed_today?'complete':'not marked complete')+')').join('; '),'Goals: '+r.goals.map(g=>g.title+' ('+g.status+')').join('; '),'Active habit days: '+(r.weekly.habit_days??'Unknown'),'Progress entries: '+(r.weekly.progress_entries??'Unknown'),'Coaching allowance: '+(r.allowance.remaining===null?'Unknown / needs review':r.allowance.remaining+' '+r.allowance.unit+' remaining')+'; '+r.allowance.status,'No clinical scores, financial effects or household information.'];
  for(const text of lines){const p=document.createElement('p');p.textContent=text;el('progress-result').append(p);}
 }catch{if(run===epoch)el('progress-result').textContent='Local progress unavailable; no changes were made.';}});

 el('source-review').addEventListener('click',async()=>{
  const request=++sourceReviewSequence,run=epoch,driver=el('driver').value,selectedChannel=el('channel').value;el('source-review-result').replaceChildren();
  try{await scenarioReady;const r=await json('/api/source-review',{authority_revision:manifest.authority_revision,campaign_id:manifest.share.campaign_id,creative_id:manifest.share.creative_id,campaign_revision:manifest.share.expected_campaign_revision,creative_revision:manifest.share.expected_creative_revision,catalog_id:manifest.education.catalog_id,catalog_version:manifest.education.expected_catalog_version,catalog_hash:manifest.education.expected_catalog_hash,approval_generation:manifest.education.expected_approval_generation,channel:selectedChannel,driver});if(run!==epoch||request!==sourceReviewSequence)return;
   if(r.status!=='ready'){clear('Held: '+(r.reason||'unavailable'));el('source-review-result').textContent='Held: '+(r.reason||'unavailable');return;}
   const lines=['Fictional source review — read only',r.copy,'Campaign revision '+r.pins.campaign_revision+'; creative revision '+r.pins.creative_revision+'; catalog '+r.pins.catalog_version+' / SHA256 '+r.pins.catalog_hash,'Own fictional referral: '+r.referral.status,'Event consent: '+r.boundaries.trackingConsent+'. This lookup records no share, click, completed viewing or conversion.',r.explanation];
   for(const row of r.education)lines.push(row.text,'Source '+row.citation.sourceId+' / '+row.citation.sourceVersion+' / '+row.citation.locator+' / SHA256 '+row.citation.sourceHash+' / claim '+row.citation.claimHash);
   for(const text of lines){const p=document.createElement('p');p.textContent=text;el('source-review-result').append(p);}
  }catch{if(run===epoch&&request===sourceReviewSequence)el('source-review-result').textContent='Local source review unavailable; nothing recorded.';}
 });
 function reviewSelectors(driver,selectedChannel){return {authority_revision:manifest.authority_revision,campaign_id:manifest.share.campaign_id,creative_id:manifest.share.creative_id,campaign_revision:manifest.share.expected_campaign_revision,creative_revision:manifest.share.expected_creative_revision,catalog_id:manifest.education.catalog_id,catalog_version:manifest.education.expected_catalog_version,catalog_hash:manifest.education.expected_catalog_hash,approval_generation:manifest.education.expected_approval_generation,channel:selectedChannel,driver};}
 el('reviewed-prepare').addEventListener('click',async()=>{
  clear('Preparing coherent fictional package…');const run=epoch,driver=el('driver').value,selectedChannel=el('channel').value;reviewedPreview=true;
  try{await scenarioReady;const r=await json('/api/reviewed-preview',reviewSelectors(driver,selectedChannel));if(run!==epoch)return;
   if(r.status!=='ready'){clear('Held: '+(r.reason||'unavailable'));return;}
   el('copy').value=r.copy;el('url').value=r.url;el('qr').src=r.qr_data_url;el('qr-note').textContent='Actual QR for this exact reviewed fictional URL; fingerprint '+r.composition_hash;el('preview').hidden=false;el('status').textContent='Reviewed fictional package ready.';
   const lines=['One coherent fictional package — '+driver.replaceAll('_',' '),'Composition SHA256 '+r.composition_hash,r.explanation,'Own fictional referral: '+r.referral.status,'Event consent: '+r.boundaries.trackingConsent+'. No event recorded.'];
   for(const row of r.education)lines.push(row.text,'Source '+row.citation.sourceId+' / '+row.citation.sourceVersion+' / '+row.citation.locator+' / SHA256 '+row.citation.sourceHash+' / claim '+row.citation.claimHash);
   for(const text of lines){const p=document.createElement('p');p.textContent=text;el('source-review-result').append(p);}
  }catch{if(run===epoch)clear('Reviewed package unavailable; nothing recorded.');}
 });
 el('select-copy').addEventListener('click',()=>{if(!el('preview').hidden){el('copy').focus();el('copy').select();}});
 el('prepare').addEventListener('click',async()=>{
  clear('Preparing fictional preview…');const run=epoch;
  try{await scenarioReady;const result=await json('/api/preview',{channel:el('channel').value,state:el('state').value});if(run!==epoch)return;
   if(result.status!=='ready'){clear('Held: '+(result.reason||result.error||'unavailable'));return;}
   el('copy').value=result.copy;el('url').value=result.url;el('qr').src=result.qr_data_url;el('qr-note').textContent='Actual QR, '+result.modules+' modules; four-module quiet zone. No send or navigation.';el('preview').hidden=false;el('status').textContent='Fictional preview ready.';
  }catch{if(run===epoch)clear('Local preview unavailable.');}
 });
 el('referral').addEventListener('click',async()=>{const run=epoch;try{await scenarioReady;const r=await json('/api/share',manifest.referral);if(run===epoch)el('referral-result').textContent=r.status==='ready'?'Fictional referral: '+r.referral.referral_id+' — '+r.referral.status:'Held: '+(r.reason||'unavailable');}catch{if(run===epoch)el('referral-result').textContent='Local referral unavailable.';}});
 el('record').addEventListener('click',async()=>{
  if(el('preview').hidden)return;const run=epoch;
  // Retain one event ID for retries of this exact visible preview, including uncertain network responses.
  if(!eventId)eventId='fictional-event-'+crypto.randomUUID();const id=eventId;
  try{await scenarioReady;const r=await json('/api/share',{...manifest.share,action:'touchpoint',channel:el('channel').value,event_id:id,event_type:'share.created'});if(run===epoch)el('event-result').textContent=r.status==='recorded'?'Synthetic event '+(r.duplicate?'already recorded':'recorded')+'; count '+r.event_count+'. In-memory only.':'Held: '+(r.reason||'unavailable');}catch{if(run===epoch)el('event-result').textContent='Response unavailable; retry uses the same event ID.';}
 });
 el('lookup').addEventListener('click',async()=>{const run=epoch;el('education-result').replaceChildren();try{await scenarioReady;const r=await json('/api/education',{...manifest.education,driver:el('driver').value});if(run!==epoch)return;
  if(r.status!=='supported_education'){el('education-result').textContent='Held/no support: '+r.status;return;}
  for(const row of r.results){const article=document.createElement('article'),p=document.createElement('p'),citation=document.createElement('p');p.textContent=row.text;citation.textContent='Source '+row.citation.sourceId+' / '+row.citation.sourceVersion+' / '+row.citation.locator+' / SHA256 '+row.citation.sourceHash+' / claim '+row.citation.claimHash;article.append(p,citation);el('education-result').append(article);}
 }catch{if(run===epoch)el('education-result').textContent='Local education unavailable.';}});
})();
