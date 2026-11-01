'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const base='5926b915f60b1be6d009c94362b91356a303cb33';
const before=p=>cp.execFileSync('git',['show',base+':'+p],{encoding:'utf8'});
function strip(s){for(const [a,b]of [['  async function markHabit(row) {','  function openGoalModal(){'],['  function openGoalModal(){','  function closeGoalModal(){'],['  async function createGoal(event){','  function openHabitModal(){'],['  function openHabitModal(){','  function closeHabitModal(){'],['  async function createHabit(event){','  async function updateAssignmentStatus('],['  el("rm-progress-form").addEventListener("submit", async (event) => {','  el("rm-checkin-form").addEventListener(']]){const start=s.indexOf(a),end=s.indexOf(b,start);assert(start>=0&&end>start);s=s.slice(0,start)+'/* OWNED HANDLER BLOCK */\n'+s.slice(end);}return s;}
test('all member source outside six approved mutation handlers and two exact modal-open functions stays byte-identical',()=>{assert.equal(strip(fs.readFileSync('member/member110.js','utf8')),strip(before('member/member110.js')));const pins=require('./source-pins.json'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');for(const [file,sha]of Object.entries(pins.baselineSource))assert.equal(hash(before(file)),sha);for(const [file,sha]of Object.entries(pins.currentSource))assert.equal(hash(fs.readFileSync(file)),sha);});
test('Coach source outside exact loader/clear/sequence/contact-close contract stays byte-identical',()=>{
 function stripCoach(s){s=s.replace('  let coachingLoadSequence = 0;\n','');const helper=s.indexOf('  function clearCoachingState(');if(helper>=0)s=s.slice(0,helper)+s.slice(s.indexOf('  async function loadCoaching(',helper));for(const [a,b]of [['  async function loadCoaching(','  function empty('],['  document.addEventListener("ra:contact-closed", () => {','  el("client-manage-coaching")']]){const start=s.indexOf(a),end=s.indexOf(b,start);assert(start>=0&&end>start);s=s.slice(0,start)+'/* EXACT OWNED COACH BLOCK */\n'+s.slice(end);}return s;}
 assert.equal(stripCoach(fs.readFileSync('portal/portal-coaching.js','utf8')),stripCoach(before('portal/portal-coaching.js')));
});
test('tracked runtime changes remain restricted to two cleared files; no branding/schema/Auth change',()=>{
 // Scope this lane assertion to application/protected source, not other lanes' additive tools and evidence.
 // The Master combined-scope check separately validates all changed paths.
 const changed=cp.execFileSync('git',['diff',base,'--name-only'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const runtime=p=>/^(member|portal|js|supabase|netlify|functions|assets|css|styles|payments)\//.test(p)||/^[^/]+\.(html|css|js|cjs|mjs|sql)$/.test(p)||/^(netlify\.toml|_headers|_redirects|package(?:-lock)?\.json)$/.test(p);
 assert.deepEqual(changed.filter(runtime).filter(p=>!['member/member110.js','portal/portal-coaching.js'].includes(p)),[]);
});
