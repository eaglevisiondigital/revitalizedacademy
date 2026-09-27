const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const handler=fs.readFileSync('supabase/functions/progress-photo-upload/handler.ts','utf8');

test('progress photo upload Edge handler enforces environment auth and paid member access',()=>{
  assert.match(handler,/configurationError\(\)/);
  assert.match(handler,/allowedOrigins\.has/);
  assert.match(handler,/auth\.getUser\(bearer\)/);
  assert.match(handler,/rpc\("member_paid_access_allowed"\)/);
  assert.match(handler,/client_access/);
});

test('progress photo upload validates type size signature and contact-scoped path',()=>{
  assert.match(handler,/MAX_FILE_BYTES=15\*1024\*1024/);
  for(const mime of ['image/jpeg','image/png','image/webp'])assert(handler.includes(mime),mime);
  assert.match(handler,/signatureMatches/);
  assert.match(handler,/access\.contact_id/);
  assert.doesNotMatch(handler,/getPublicUrl|publicUrl/);
});

test('progress photo upload compensates storage and database on partial failure',()=>{
  assert.match(handler,/uploadedPaths/);
  assert.match(handler,/\.remove\(uploadedPaths\)/);
  assert.match(handler,/progress_photo_sets"\)\.delete\(\)/);
  assert.match(handler,/await cleanup\(\)/);
});
