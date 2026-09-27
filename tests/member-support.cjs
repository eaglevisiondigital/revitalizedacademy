const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const handler=fs.readFileSync('supabase/functions/member-support/handler.ts','utf8');

test('member support uses lifecycle access states instead of paid-access gate',()=>{
  for(const status of ['ready','invited','onboarding','active','payment_suspended'])assert(handler.includes('"'+status+'"'),status);
  assert.doesNotMatch(handler,/member_paid_access_allowed/);
  const statusLine=handler.match(/const SUPPORT_STATUSES=new Set\(\[(.*?)\]\);/)?.[1]||"";
  assert(!statusLine.split(",").map(x=>x.replace(/["\s]/g,"")).includes("suspended"));
  assert(!statusLine.split(",").map(x=>x.replace(/["\s]/g,"")).includes("inactive"));
});

test('member support reuses the existing support conversation model',()=>{
  assert.match(handler,/conversation_type:"support"/);
  assert.match(handler,/participant_type:"member"/);
  assert.match(handler,/member_conversation_participants/);
  assert.match(handler,/member_messages/);
});

test('support send is idempotent and constrained',()=>{
  assert.match(handler,/message\.length>8000/);
  assert.match(handler,/Valid message request ID required/);
  assert.match(handler,/\.eq\("id",requestId\)/);
  assert.match(handler,/replayed:true/);
});

test('member support authenticates and scopes by current user client_access',()=>{
  assert.match(handler,/auth\.getUser\(bearer\)/);
  assert.match(handler,/\.eq\("user_id",user\.id\)/);
  assert.match(handler,/contact_id:access\.contact_id/);
});


test('member support uses deterministic conversation identity to avoid duplicate support threads',()=>{
  assert.match(handler,/supportConversationId/);
  assert.match(handler,/revitalized-support:/);
  assert.match(handler,/onConflict:"id",ignoreDuplicates:true/);
});
