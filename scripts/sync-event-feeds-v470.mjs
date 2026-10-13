/* V4.8 review-only source ingestion: verified publication is never automatic.
 * Preserve review candidates across individual upstream outages and do not
 * rewrite files when new results are unchanged (budget/CI-friendly).
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {fromFeed,normalizeReview} from '../lib/events-feeds-v480.mjs';
const configuration=JSON.parse(readFileSync('data/event-feeds-v470.json','utf8'));
const path='data/events-review-queue-v470.json';
const existing=JSON.parse(readFileSync(path,'utf8'));
const today=singaporeDate(),probe=!process.argv.includes('--write'),outcomes=[];
const retained=(existing.candidates||[]).filter(c=>c.endDate>=today);
for(const feed of configuration.feeds){
 const url=new URL(feed.url),official=new URL(feed.publicPage);
 if(url.protocol!=='https:'||url.hostname!==official.hostname)throw Error('Unapproved publisher host '+feed.id);
 try{
  const response=await fetch(url,{headers:{Accept:feed.format==='rss'?'application/rss+xml, application/xml':'application/json'},redirect:'follow',signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const destination=new URL(response.url);
  if(destination.protocol!=='https:'||destination.hostname!==official.hostname)throw Error('Unapproved cross-host redirect');
  const type=response.headers.get('content-type')||'';
  const claimed=Number(response.headers.get('content-length')||'0');
  if(claimed>feed.maxBytes)throw Error('Feed too large');
  const raw=await response.text();
  if(raw.length>feed.maxBytes)throw Error('Feed exceeds maximum size');
  // Diagnostics describe only public publisher feed schema, never the full payload.
  if(!probe){ /* no payload logging in scheduled writes */ }
  else if(feed.format==='squarespace-json'){
   const j=JSON.parse(raw),first=(j.items||j.collection?.items||[])[0]||null;
   console.log('Publisher shape '+feed.id+': '+JSON.stringify({root:Object.keys(j).slice(0,20),items:j.items?.length||j.collection?.items?.length||0,upcomingType:typeof j.upcoming,upcomingKeys:j.upcoming&&typeof j.upcoming==='object'?Object.keys(j.upcoming).slice(0,15):[],upcomingLength:j.upcoming?.length,calendarKeys:j.calendarView&&typeof j.calendarView==='object'?Object.keys(j.calendarView).slice(0,20):[],collectionKeys:j.collection&&typeof j.collection==='object'?Object.keys(j.collection).slice(0,20):[],firstKeys:first?Object.keys(first).slice(0,24):[],structuredKeys:first?.structuredContent?Object.keys(first.structuredContent):[],dates:first?{start:first.startDate,structuredStart:first.structuredContent?.startDate,fullUrl:first.fullUrl}:null}));
  }else if(feed.format==='rss'){
   console.log('Publisher shape '+feed.id+': '+JSON.stringify({bytes:raw.length,items:raw.split('<item').length-1,firstItem:raw.slice(raw.indexOf('<item'),raw.indexOf('</item>')+7).slice(0,350)}));
  }
  const candidates=fromFeed(raw,feed,today,type);
  const other=retained.filter(c=>c.sourceId!==feed.sourceId);
  retained.splice(0,retained.length,...other,...candidates);
  outcomes.push({feed:feed.id,state:'reachable',candidateCount:candidates.length,format:feed.format});
 }catch(error){
  outcomes.push({feed:feed.id,state:'unavailable',message:String(error?.message||error).slice(0,130)});
 }
}
const approvedIds=new Set(configuration.feeds.map(x=>x.sourceId));
// Preserve all other sources: venue HTML candidates must not be erased by the feed-only job.
const reviewed=normalizeReview(retained,today);
console.log('Official publisher feed review: '+JSON.stringify(outcomes));
console.log('Pending manual review: '+reviewed.length);
if(probe){console.log('Probe mode; no writes.');process.exit(0)}
if(JSON.stringify(existing.candidates)!==JSON.stringify(reviewed)){
 writeFileSync(path,JSON.stringify({schemaVersion:2,asOf:today,candidates:reviewed,diagnostics:outcomes},null,2)+'\n');
 console.log('Review queue updated, no events auto-published.');
}else console.log('No review-candidate changes; skip write.');
