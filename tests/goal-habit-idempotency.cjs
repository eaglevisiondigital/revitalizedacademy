const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('goal form uses idempotent RPC and stable request identity',()=>{
  const start=js.indexOf('async function createGoal');
  const end=js.indexOf('function openHabitModal',start);
  const block=js.slice(start,end);
  assert.match(block,/create_my_goal_idempotent/);
  assert.match(block,/p_request_id:pendingGoalRequestId/);
  assert.match(block,/pendingGoalPayloadKey!==payloadKey/);
  assert.match(block,/crypto\.randomUUID\(\)/);
  assert.match(block,/submit\.disabled=true/);
  assert.match(block,/finally\{[\s\S]*submit\.disabled=false/);
});

test('habit form uses idempotent RPC and stable request identity',()=>{
  const start=js.indexOf('async function createHabit');
  const end=js.indexOf('async function updateAssignmentStatus',start);
  const block=js.slice(start,end);
  assert.match(block,/create_my_habit_idempotent/);
  assert.match(block,/p_request_id:pendingHabitRequestId/);
  assert.match(block,/pendingHabitPayloadKey!==payloadKey/);
  assert.match(block,/crypto\.randomUUID\(\)/);
  assert.match(block,/submit\.disabled=true/);
  assert.match(block,/finally\{[\s\S]*submit\.disabled=false/);
});

test('goal and habit retry state clears on modal close',()=>{
  const goal=js.slice(js.indexOf('function closeGoalModal'),js.indexOf('async function createGoal'));
  assert.match(goal,/pendingGoalRequestId=null/);
  assert.match(goal,/pendingGoalPayloadKey=null/);
  const habit=js.slice(js.indexOf('function closeHabitModal'),js.indexOf('async function createHabit'));
  assert.match(habit,/pendingHabitRequestId=null/);
  assert.match(habit,/pendingHabitPayloadKey=null/);
});
