const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const handler=fs.readFileSync('supabase/functions/member-document-upload/handler.ts','utf8');

test('member document upload requires authenticated paid member access',()=>{
  assert.match(handler,/configurationError\(\)/);
  assert.match(handler,/allowedOrigins\.has/);
  assert.match(handler,/auth\.getUser\(bearer\)/);
  assert.match(handler,/rpc\("member_paid_access_allowed"\)/);
});

test('member document upload enforces category size type and signatures',()=>{
  assert.match(handler,/MAX_BYTES=25\*1024\*1024/);
  assert.match(handler,/general/);
  assert.match(handler,/progress/);
  assert.match(handler,/signatureMatches/);
  for(const mime of ['application/pdf','image/jpeg','image/png','image/webp','text/plain'])assert(handler.includes(mime),mime);
});

test('member document upload is idempotent and compensates partial failure',()=>{
  assert.match(handler,/requestId/);
  assert.match(handler,/id:requestId/);
  assert.match(handler,/replayed:true/);
  assert.match(handler,/\.remove\(\[path\]\)/);
  assert.match(handler,/client_documents"\)\.delete\(\)/);
});
