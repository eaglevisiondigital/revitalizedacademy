const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

function namesBetween(startMarker,endMarker){
  const start=js.indexOf(startMarker);
  const open=js.indexOf('const [',start);
  const end=js.indexOf(endMarker,open);
  return js.slice(open,end);
}

test('deferred query result destructuring matches secondary module set',()=>{
  const block=namesBetween('async function loadDeferredMemberModules',']=await Promise.all([');
  for(const name of [
    'journeyResult','householdResult','goalsResult','habitsResult','assignmentsResult','progressResult',
    'metricsResult','templateResult','mealPlanResult','mealsResult','fitnessPlanResult',
    'workoutsResult','groceryResult','coursesResult','resourcesResult','challengesResult',
    'healthConnectionsResult','communitySpacesResult','communityFeedResult','refuelResult',
    'documentsResult','coachingEntitlementsResult','companionTypesResult','companionRequestsResult',
    'healthPermissionsResult','healthSnapshotResult'
  ])assert(block.includes(name),name);
});

test('initial dashboard destructuring contains only the three first-screen results',()=>{
  const block=namesBetween('async function loadDashboard()',']=await Promise.all([');
  for(const name of ['bootstrapResult','dashboardResult','entitlementsResult'])assert(block.includes(name),name);
  for(const deferred of [
    'householdResult','goalsResult','habitsResult','assignmentsResult','progressResult','metricsResult',
    'mealPlanResult','mealsResult','fitnessPlanResult','workoutsResult','groceryResult','coursesResult',
    'resourcesResult','challengesResult','healthConnectionsResult','communitySpacesResult',
    'communityFeedResult','refuelResult','documentsResult','coachingEntitlementsResult',
    'companionTypesResult','companionRequestsResult','healthPermissionsResult','healthSnapshotResult'
  ])assert(!block.includes(deferred),deferred+' must be deferred');
});
