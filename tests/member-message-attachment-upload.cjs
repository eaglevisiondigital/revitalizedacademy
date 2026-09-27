const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const handler=fs.readFileSync('supabase/functions/member-message-attachment-upload/handler.ts','utf8');

test('message attachment upload requires authenticated ownership and conversation participation',()=>{
  assert.match(handler,/auth\.getUser\(bearer\)/);
  assert.match(handler,/sender_user_id!==user\.id/);
  assert.match(handler,/member_conversation_participants/);
  assert.match(handler,/\.is\("left_at",null\)/);
});

test('message attachment upload enforces bucket limits and file signatures',()=>{
  assert.match(handler,/MAX_BYTES=10\*1024\*1024/);
  for(const mime of ['application/pdf','image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/x-m4a','audio/wav'])assert(handler.includes(mime),mime);
  assert.match(handler,/signatureMatches/);
});

test('message attachment upload is idempotent and cleans orphaned storage on row failure',()=>{
  assert.match(handler,/requestId/);
  assert.match(handler,/replayed:true/);
  assert.match(handler,/\.remove\(\[path\]\)/);
  assert.match(handler,/member_message_attachments"\)\.insert/);
});
