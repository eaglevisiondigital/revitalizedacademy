const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const read=(path)=>fs.readFileSync(path,'utf8');

test('sidebar shell does not invoke current Account module when portal-account owns the click',()=>{
  const shell=read('portal/portal-shell.js');
  assert.match(shell,/if\(window\.RA_ACCOUNT\?\.open\)return;/);
  assert.doesNotMatch(shell,/await\s+window\.RA_ACCOUNT\.open\(\)/);
});

test('current account module owns both header and sidebar Account entry points',()=>{
  const account=read('portal/portal-account.js');
  assert.match(account,/const header=byId\("account-button"\)/);
  assert.match(account,/const side=qs\("\.ra-sidebar-footer \.ra-nav-item"\)/);
  assert.match(account,/header\.onclick=/);
  assert.match(account,/side\.onclick=/);
  assert.match(account,/window\.RA_ACCOUNT=\{open:openAccount,close:closeAccount\}/);
});

test('legacy portal Account handler is guarded when current module exists',()=>{
  const core=read('portal/portal.js');
  assert.match(core,/if \(window\.RA_ACCOUNT\?\.open\) return;/);
});
