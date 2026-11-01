'use strict';
(() => {
  const el=id=>document.getElementById(id);let epoch=0;
  function clear(message='Preview cleared.') {
    epoch++;el('preview').hidden=true;el('copy').value='';el('url').value='';
    el('qr').removeAttribute('src');el('qr-note').textContent='';el('status').textContent=message;
  }
  for(const id of ['state','channel'])el(id).addEventListener('change',()=>clear());
  el('select-copy').addEventListener('click',()=>{if(!el('preview').hidden){el('copy').focus();el('copy').select();}});
  el('prepare').addEventListener('click',async()=>{
    clear('Preparing fictional preview…');const run=epoch;
    try {
      const response=await fetch('/api/preview',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({channel:el('channel').value,state:el('state').value})});
      const result=await response.json();if(run!==epoch)return;
      if(!response.ok || result.status!=='ready'){clear('Held: '+(result.reason||result.error||'unavailable'));return;}
      el('copy').value=result.copy;el('url').value=result.url;el('qr').src=result.qr_data_url;
      el('qr-note').textContent='Actual QR, '+result.modules+' modules; four-module quiet zone. No send or navigation.';
      el('preview').hidden=false;el('status').textContent='Fictional preview ready.';
    } catch {if(run===epoch)clear('Local preview unavailable.');}
  });
})();
