'use strict';
(() => {
 const el=id=>document.getElementById(id);let epoch=0,manifest=null,scenarioReady=Promise.resolve(),eventId=null,scenarioSequence=0;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('rva-fictional-preview-reset'):null;
 // Broadcast carries no identity/data/approval; it only clears stale synthetic views.
 if(channel)channel.onmessage=()=>{clear('Fixture changed in another local tab.');busy(true);const sequence=++scenarioSequence;scenarioReady=scenarioReady.catch(()=>{}).then(()=>bootstrap(sequence)).then(()=>{if(sequence===scenarioSequence)busy(false);}).catch(()=>{if(sequence===scenarioSequence)clear('Local fixture unavailable; choose a scenario to retry.');});};
 addEventListener('pagehide',()=>channel?.close());
 function clear(message='Preview cleared.') {
  epoch++;eventId=null;el('preview').hidden=true;el('copy').value='';el('url').value='';el('qr').removeAttribute('src');el('qr-note').textContent='';el('status').textContent=message;
  el('referral-result').textContent='';el('event-result').textContent='';el('education-result').replaceChildren();
 }
 async function json(url,data){const response=await fetch(url,data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{});const result=await response.json();if(!response.ok)throw Error('local_unavailable');return result;}
 function busy(yes){for(const id of ['prepare','referral','record','lookup'])el(id).disabled=yes;}
 async function bootstrap(sequence){const value=await json('/api/bootstrap');if(sequence!==scenarioSequence)return;manifest=value;el('state').value=manifest.state;if(el('driver').options.length===0)for(const driver of manifest.drivers){const option=document.createElement('option');option.value=driver;option.textContent=driver.replaceAll('_',' ');el('driver').append(option);}}
 busy(true);const initialSequence=++scenarioSequence;scenarioReady=bootstrap(initialSequence).then(()=>{if(initialSequence===scenarioSequence)busy(false);}).catch(()=>{if(initialSequence===scenarioSequence)clear('Local fixture unavailable; choose a scenario to retry.');});
 el('state').addEventListener('change',()=>{
  clear();busy(true);const sequence=++scenarioSequence,state=el('state').value;
  // Serialize scenario transitions across tabs/requests; selectors are not authentication.
  scenarioReady=scenarioReady.catch(()=>{}).then(()=>json('/api/scenario',{state})).then(value=>{if(sequence===scenarioSequence){manifest=value;el('state').value=value.state;busy(false);channel?.postMessage('fixture_changed');}}).catch(()=>{if(sequence===scenarioSequence)clear('Fixture change unavailable; choose a scenario to retry.');});
 });
 el('channel').addEventListener('change',()=>clear());el('driver').addEventListener('change',()=>{epoch++;el('education-result').replaceChildren();});
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
