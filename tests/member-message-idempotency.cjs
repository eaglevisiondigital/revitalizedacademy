const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('member message send uses explicit client-generated idempotency keys',()=>{
  assert.match(js,/pendingMessageRequestId/);
  assert.match(js,/pendingMessageAttachmentRequestId/);
  assert.match(js,/id:requestId/);
  assert.match(js,/crypto\.randomUUID\(\)/);
});

test('duplicate message IDs are accepted only for the same sender conversation and body',()=>{
  const start=js.indexOf('async function createMemberMessageIdempotent');
  const end=js.indexOf('el("rm-message-form").addEventListener',start);
  const block=js.slice(start,end);
  assert.match(block,/error\?\.code!=="23505"/);
  assert.match(block,/existing\.conversation_id===conversationId/);
  assert.match(block,/existing\.sender_user_id===user\.id/);
  assert.match(block,/existing\.body===body/);
  assert.match(block,/Message retry identity conflict/);
});

test('message and attachment IDs persist through retry and clear after success or close',()=>{
  const formStart=js.indexOf('el("rm-message-form").addEventListener');
  const formEnd=js.indexOf('document.querySelectorAll("[data-message-close]")',formStart);
  const block=js.slice(formStart,formEnd);
  assert.match(block,/pendingMessageBody!==body/);
  assert.match(block,/pendingMessageAttachmentRequestId=crypto\.randomUUID\(\)/);
  assert.match(block,/uploadMessageAttachment\([\s\S]*pendingMessageAttachmentRequestId/);
  assert.match(block,/pendingMessageRequestId=null/);
  assert.match(block,/pendingMessageAttachmentRequestId=null/);

  const closeStart=js.indexOf('function closeConversation');
  const closeEnd=js.indexOf('let currentCourses',closeStart);
  const close=js.slice(closeStart,closeEnd);
  assert.match(close,/pendingMessageRequestId=null/);
  assert.match(close,/pendingMessageAttachmentRequestId=null/);
  assert.match(close,/pendingMessageBody=null/);
});

test('message submit is disabled while send is active',()=>{
  const start=js.indexOf('el("rm-message-form").addEventListener');
  const end=js.indexOf('document.querySelectorAll("[data-message-close]")',start);
  const block=js.slice(start,end);
  assert.match(block,/submit\.disabled=true/);
  assert.match(block,/finally\{[\s\S]*submit\.disabled=false/);
});
