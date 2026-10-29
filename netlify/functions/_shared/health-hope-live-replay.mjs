// Optional replay presentation. Upcoming Zoom joining information is independent.
export const REPLAY_VERSION = 'hhl-previous-week-replay-v1';
export function youtubeUrl(input) {
  if (typeof input !== 'string' || input.length > 2048 || /[\u0000-\u0020\u007f]/.test(input)) return null;
  let u; try {u=new URL(input);} catch {return null;}
  if (u.protocol!=='https:' || u.username || u.password || u.port || !['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname)) return null;
  const id=u.hostname==='youtu.be'?(/^\/([\w-]{11})$/.exec(u.pathname)||[])[1]:u.pathname==='/watch'?u.searchParams.get('v'):(/^\/live\/([\w-]{11})$/.exec(u.pathname)||[])[1];
  if (!/^[A-Za-z0-9_-]{11}$/.test(id||'') || u.searchParams.getAll('v').length>1) return null;
  return 'https://www.youtube.com/watch?v='+id;
}
export async function verifyReplayAvailability(input,fetcher=fetch) {
  const url=youtubeUrl(input);if(!url)throw Error('invalid_replay_url');
  const r=await fetcher('https://www.youtube.com/oembed?url='+encodeURIComponent(url)+'&format=json',{method:'GET',redirect:'error',signal:AbortSignal.timeout(3000)});
  if(!r.ok)throw Error('replay_not_available');const d=await r.json();
  if(d.type!=='video'||d.provider_name!=='YouTube')throw Error('replay_not_available');
  // Public metadata is only an availability check. Staff must attest that the
  // video is the approved, playable recording, not a future premiere or draft.
  return url;
}
export function replayForJob(job) {
  const r=job.replay;if(!r||typeof r!=='object'||youtubeUrl(r.url)!==r.url)return null;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(r.source_date||'')||!/^\d{4}-\d{2}-\d{2}$/.test(r.upcoming_date||''))return null;
  const next=Date.parse(r.upcoming_date+'T12:00:00Z'),prior=Date.parse(r.source_date+'T12:00:00Z');
  if(!Number.isFinite(next)||next-prior!==7*86400000)return null;
  return r;
}
export function replayText(job) {
  const r=replayForJob(job);return r?`\n\nWatch Last Week's Replay\nRecording from ${r.source_date}\n${r.url}\n\nThis is the previous session's recording. Your upcoming live Zoom invitation remains above.`:'';
}
export const invitationHelp='If you have questions, contact the person who shared or invited you to Health & Hope Live.';
