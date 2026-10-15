// Pure preparation only: no provider, SMTP, queue insertion or send method.
const {createHash}=require('node:crypto');
function prepareRoadmapReady({origin,reportId,version,checksum,state}){
 if(!['https://beta.revitalizedacademy.com','https://revitalizedacademy.com'].includes(origin)||!/^[-0-9a-f]{36}$/i.test(reportId)||!Number.isSafeInteger(version)||version<1||!/^[0-9a-f]{64}$/.test(checksum)||state!=='released')throw Error('Verified released version required');
 const link=`${origin}/member/roadmap/`; // Authentication and verified claim; never bearer access.
 return Object.freeze({delivery:'held',subject:'Your Vitality Roadmap is ready',text:`Your private Vitality Roadmap is ready. Sign in with your verified ReVitalized account, or connect your existing assessment after account setup.\n\nOpen My Vitality Roadmap: ${link}\n\nYour Roadmap is free to access.`,html:`<!doctype html><html lang="en"><head><title>Your Vitality Roadmap is ready</title></head><body><h1>Your Vitality Roadmap is ready</h1><p>Sign in with your verified ReVitalized account to view your private report.</p><p><a href="${link}">Open My Vitality Roadmap</a></p><p>Your Roadmap is free to access. Connect your existing assessment after verified account setup if needed.</p></body></html>`,attachments:[],idempotencyKey:createHash('sha256').update(`${origin}:${reportId}:${version}:${checksum}`).digest('hex')});
}
module.exports={prepareRoadmapReady};
