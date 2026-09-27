const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('Ask ReVitalized loads and renders member feedback state',()=>{
  assert.match(js,/from\("my_companion_feedback"\)/);
  assert.match(js,/feedbackByRequest=new Map/);
  assert.match(js,/renderAskReVitalized\([\s\S]*latestCompanionFeedback/);
});

test('feedback only renders for answered or resolved responses with final answers',()=>{
  const start=js.indexOf('function renderAskReVitalized');
  const end=js.indexOf('async function submitAskFeedback',start);
  const block=js.slice(start,end);
  assert.match(block,/\["answered","resolved"\]\.includes\(row\.status\)&&row\.final_answer/);
});

test('member feedback saves through existing invoker RPC',()=>{
  const start=js.indexOf('async function submitAskFeedback');
  const end=js.indexOf('async function submitAskReVitalized',start);
  const block=js.slice(start,end);
  assert.match(block,/rpc\("submit_my_companion_feedback"/);
  for(const param of ['p_request_id','p_helpful','p_feedback_reason','p_comment'])assert(block.includes(param),param);
});

test('Needs Review exposes only backend-approved reasons',()=>{
  const start=js.indexOf('function renderAskReVitalized');
  const end=js.indexOf('async function submitAskFeedback',start);
  const block=js.slice(start,end);
  for(const reason of ['not_relevant','unclear','incorrect','missing_context','too_generic','needs_coach','other'])assert(block.includes(reason),reason);
});
