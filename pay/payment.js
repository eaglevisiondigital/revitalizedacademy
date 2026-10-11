(()=>{'use strict';
 const $=id=>document.getElementById(id),path=location.pathname.split('/').filter(Boolean),token=path[1],webinar=token==='webinar';
 const client=window.supabase?.createClient(window.RVA_PUBLIC_CONFIG.supabaseUrl,window.RVA_PUBLIC_CONFIG.supabaseKey);
 const money=n=>'$'+(Number(n)/100).toFixed(2)+' CAD';let busy=false;
 const messages={link_unavailable:'This payment link is unavailable. Contact ReVitalized Academy for help.',payments_unavailable:'Checkout is not available yet. Please contact ReVitalized Academy.',country_route_unavailable:'U.S. checkout is not available yet. Canadian checkout uses CAD.',payment_processing:'Your payment is being checked. Please do not pay again. Use Check Payment Status or contact support.',existing_request_requires_recovery:'Please use your existing payment link or contact ReVitalized Academy for help.',verified_sign_in_required:'Sign in to your own verified member account before updating a stored payment method.',nothing_due:'There is no payment due on this link.',webinar_full:'This webinar is full.',webinar_unconfigured:'Webinar checkout is not available yet.'};
 function status(t){$('payment-status').textContent=t;}
 async function api(action,data={}){
  const session=client?(await client.auth.getSession()).data.session:null;
  const res=await fetch('/api/payments/'+action,{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify({token:!webinar?token:undefined,...data}),cache:'no-store'});
  const j=await res.json();if(!res.ok)throw Error(messages[j.error]||'We could not complete this step. Please contact ReVitalized Academy before retrying a payment.');return j;
 }
 function render(r){
  $('payment-details').hidden=false;$('payment-description').textContent=r.description;$('payment-date').textContent=r.event_date_label||'';$('payment-name').textContent=r.payer_name;
  const paid=Number(r.paid_cents),remaining=r.contract_total_cents===null?null:Math.max(0,r.contract_total_cents-paid);
  const due=r.schedule.find(i=>['pending','failed','past_due'].includes(i.status)&&new Date(i.due_at)<=new Date());
  const values=[['Payment Plan',r.plan==='monthly'?'Monthly recurring':r.plan==='installments'?r.schedule.length+' installments':'One payment'],
   [r.plan==='monthly'?'Monthly Payment':'Total Investment',money(r.monthly_amount_cents??r.contract_total_cents)],['Paid',money(paid)],['Scheduled',money(r.scheduled_cents)],['Due Now',money(due?.amount_cents||0)],
   ['Remaining Balance',remaining===null?'Recurring monthly schedule':money(remaining)],['Next Payment',r.next_due_at?new Date(r.next_due_at).toLocaleDateString():'None scheduled']];
  $('payment-totals').replaceChildren();for(const[k,v]of values){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;$('payment-totals').append(dt,dd);}
  $('payment-schedule').replaceChildren();for(const i of r.schedule){const li=document.createElement('li');li.textContent=money(i.amount_cents)+' — '+new Date(i.due_at).toLocaleDateString()+' — '+i.status.replaceAll('_',' ');$('payment-schedule').append(li);}
  $('payment-recurring').textContent=r.plan==='monthly'?'Recurring monthly billing: '+money(r.monthly_amount_cents)+'. Status: '+r.recurring_state+'.':'';
  $('payment-disclosure').textContent=r.checkout_disclosure||'';
  $('payment-terms').replaceChildren();for(const[label,url]of [['Terms / Cancellation',r.terms_url],['Refund Policy',r.refund_url]])if(url&&/^https:\/\//.test(url)){const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';$('payment-terms').append(a,document.createTextNode(' '));}
  const complete=r.schedule.every(i=>['paid','settled','refunded','voided'].includes(i.status));
  const outstanding=r.schedule.find(i=>!['paid','settled','refunded','voided'].includes(i.status));
  $('payment-begin').hidden=complete||r.plan==='monthly'&&['active','subscription_processing','attention'].includes(r.recurring_state)||outstanding&&!['pending','failed','past_due'].includes(outstanding.status);$('payment-consent').hidden=$('payment-begin').hidden;
  $('payment-update-card').hidden=r.plan==='one_time';
  if(r.provider_mode==='sandbox')$('payment-description').textContent='Sandbox — '+r.description;
  status(['paid','settled'].includes(r.status)?'Payment received. Thank you.':r.status==='review'?'Your payment requires review. Please contact ReVitalized Academy before paying again.':'Payment status: '+r.status.replaceAll('_',' ')+'.');
 }
 async function run(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);status('Working securely…');try{await fn();}catch(e){status(e.message);}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}}
 function providerPost(form){
  if(!/^https:\/\/(test|accept)\.authorize\.net\/(payment\/payment|customer\/(addPayment|manage))$/.test(form.url)||typeof form.token!=='string')throw Error('Secure card entry is unavailable.');
  const f=document.createElement('form');f.method='POST';f.action=form.url;const input=document.createElement('input');input.type='hidden';input.name='token';input.value=form.token;f.append(input);document.body.append(f);f.submit();
 }
 $('webinar-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{const data=Object.fromEntries(new FormData(e.target));data.nonce=crypto.randomUUID();const result=await api('webinar-start',data);location.assign(result.url);});});
 $('payment-begin').addEventListener('click',()=>run(async()=>{if(!$('consent').checked)throw Error('Please review and authorize the displayed payment schedule.');providerPost(await api('begin',{consent:true}));}));
 $('payment-refresh').addEventListener('click',()=>run(async()=>render(await api('refresh'))));
 $('payment-update-card').addEventListener('click',()=>run(async()=>providerPost(await api('update-card'))));
 if(webinar){$('webinar-entry').hidden=false;status('Canadian checkout — $50 CAD.');}else if(/^[A-Za-z0-9_-]{43}$/.test(token||''))run(async()=>render(await api(location.search?'refresh':'summary')));else status(messages.link_unavailable);
})();
