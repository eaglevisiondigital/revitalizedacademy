import {createHash, randomBytes, createHmac, timingSafeEqual} from 'node:crypto';

export class PaymentError extends Error {
  constructor(code, status=400) { super(code); this.code=code; this.status=status; }
}
export const hash = value => createHash('sha256').update(value).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export const tokenHash = value => {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value||'')) throw new PaymentError('link_unavailable',404);
  return hash(value);
};
export function cents(value) {
  const s=String(value);
  if (!/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/.test(s)) throw new PaymentError('invalid_amount');
  const [a,b='']=s.split('.'); const n=Number(a)*100+Number(b.padEnd(2,'0'));
  if (!Number.isSafeInteger(n)||n<=0||n>2000000000) throw new PaymentError('invalid_amount');
  return n;
}
export const decimal = n => { if(!Number.isSafeInteger(n)||n<0)throw new PaymentError('invalid_amount'); return (n/100).toFixed(2); };
export function equalSplit(total,count) {
  if(!Number.isInteger(total)||total<=0||![2,3,4].includes(count))throw new PaymentError('invalid_plan');
  const base=Math.floor(total/count); return Array.from({length:count},(_,i)=>base+(i<total%count?1:0));
}
export function validatePlan(spec,now=new Date()) {
  if (!['webinar','program_plan','coaching','custom'].includes(spec.product)) throw new PaymentError('invalid_product');
  const approvedRoute=(spec.country==='CA'&&spec.currency==='CAD'&&spec.route==='CA_AUTHORIZE_NET')||
    (spec.country==='US'&&spec.currency==='USD'&&spec.route==='US_AUTHORIZE_NET')||
    (spec.country==='GB'&&spec.currency==='GBP'&&spec.route==='GB_PAYMENT_PROVIDER_PENDING');
  if (!approvedRoute) throw new PaymentError('country_route_unavailable');
  if(spec.product==='program_plan'&&!/^holistic_foundations_(monthly_flex|3_month|annual_established)$/.test(spec.plan_code||''))throw new PaymentError('invalid_plan');
  const preset={webinar:5000}[spec.product];
  const total=preset??spec.total_cents;
  if(!Number.isInteger(total)||total<=0||total>2000000000)throw new PaymentError('invalid_amount');
  const mode=spec.mode;
  if(spec.product==='webinar'&&mode!=='one_time')throw new PaymentError('invalid_plan');
  if(!['one_time','monthly','installments'].includes(mode)||mode==='monthly'&&spec.product!=='program_plan')throw new PaymentError('invalid_plan');
  const items=spec.schedule;
  if(!Array.isArray(items)||(mode==='installments'?![2,3,4].includes(items.length):items.length!==1))throw new PaymentError('invalid_schedule');
  let sum=0,last=0;
  for (const item of items) {
    if(!Number.isInteger(item.amount_cents)||item.amount_cents<=0)throw new PaymentError('invalid_amount');
    const due=Date.parse(item.due_at); if(!Number.isFinite(due)||due<now.getTime()-300000||due<last)throw new PaymentError('invalid_due_date');
    last=due;sum+=item.amount_cents;
  }
  if(sum!==total)throw new PaymentError('unbalanced_plan');
  if(spec.expires_at&&(Date.parse(spec.expires_at)<=now.getTime()||!Number.isFinite(Date.parse(spec.expires_at))))throw new PaymentError('invalid_expiration');
  return {...spec,total_cents:total,mode};
}
export function verifySignature(raw,signature,key) {
  if(!/^[0-9a-f]{128}$/i.test(key||'')||!/^sha512=[0-9a-f]{128}$/i.test(signature||''))return false;
  const actual=Buffer.from(signature.slice(7),'hex');
  const expected=createHmac('sha512',Buffer.from(key,'hex')).update(raw).digest();
  return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function nextMonth(value) {
  const d=new Date(value),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);
  const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString();
}
// Only these provider fields may cross into persistence. Never persist raw responses.
export function transactionMetadata(tx,mode) {
  if(!/^\d+$/.test(String(tx.transId||'')))throw new PaymentError('invalid_provider_transaction',502);
  const states={authorizedPendingCapture:'authorized',capturedPendingSettlement:'paid',settledSuccessfully:'settled',declined:'failed',expired:'failed',voided:'voided',refundPendingSettlement:'refunded',refundSettledSuccessfully:'refunded',FDSPendingReview:'pending',FDSAuthorizedPendingReview:'pending'};
  const status=states[tx.transactionStatus]; if(!status)throw new PaymentError('provider_state_requires_review',409);
  const card=tx.payment?.creditCard; const masked=card?.cardNumber||'';
  if(masked&&!/^(?:X|\*)+\d{4}$/i.test(masked))throw new PaymentError('unexpected_card_data',502);
  return {provider_transaction_id:String(tx.transId),reference:tx.order?.invoiceNumber||null,subscription_id:tx.subscription?.id?String(tx.subscription.id):null,pay_number:tx.subscription?.payNum?Number(tx.subscription.payNum):null,
    amount_cents:cents(Number(tx.settleAmount)>0?tx.settleAmount:tx.authAmount),status,provider_mode:mode,merchant_route:'CA_AUTHORIZE_NET',currency:'CAD',provider_currency:tx.currencyCode||null,
    original_transaction_id:tx.refTransId?String(tx.refTransId):null,last_four:masked?masked.slice(-4):null,card_brand:card?.cardType?.slice(0,30)||null,occurred_at:tx.submitTimeUTC||new Date().toISOString()};
}
