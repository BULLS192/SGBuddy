/* V4.7 review-only ICS connector. Never publishes events without official detail review. */
import {readFileSync,writeFileSync} from 'node:fs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {parseIcs,publicCandidates} from '../lib/events-ical-v470.mjs';
const config=JSON.parse(readFileSync('data/event-feeds-v470.json','utf8'));
const path='data/events-review-queue-v470.json';
const existing=JSON.parse(readFileSync(path,'utf8'));
const mode=process.argv.includes('--write')?'write':'probe';
const today=singaporeDate(),candidates=[],diagnostics=[];
for(const source of config.feeds||[]){
 try{
  const u=new URL(source.url);
  if(u.protocol!=='https:'||new URL(source.publicPage).host!==u.host)throw Error('Host not allowlisted');
  const response=await fetch(u,{headers:{Accept:'text/calendar'},signal:AbortSignal.timeout(10000),redirect:'follow'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const type=response.headers.get('content-type')||'';
  if(!type.includes('calendar')&&!type.includes('text/plain'))throw Error('Not calendar content-type: '+type);
  const raw=await response.text();
  if(raw.length>source.maxBytes)throw Error('Calendar too large');
  const parsed=parseIcs(raw),pending=publicCandidates(parsed,source,today);
  candidates.push(...pending);
  diagnostics.push({feed:source.id,state:'ok',fetchedEntries:parsed.length,pendingReview:pending.length});
 }catch(err){
  diagnostics.push({feed:source.id,state:'unavailable',message:String(err?.message||err).slice(0,150)});
 }
}
const seen=new Set();
const sorted=candidates.filter(c=>{if(seen.has(c.id))return false;seen.add(c.id);return true}).sort((a,b)=>a.startDate.localeCompare(b.startDate)).slice(0,150);
console.log('SGBuddy event discovery diagnostics: '+JSON.stringify(diagnostics));
if(mode==='write'&&diagnostics.some(x=>x.state==='ok')){
 const prev=JSON.stringify(existing.candidates);
 const next=JSON.stringify(sorted);
 if(prev!==next){
  writeFileSync(path,JSON.stringify({schemaVersion:1,asOf:today,candidates:sorted,diagnostics},null,2)+'\n');
  console.log('Updated review queue with '+sorted.length+' unapproved candidates.');
 }else console.log('No new review candidates; no repository write.');
}
if(mode!=='write')console.log('Probe-only mode: no events written or auto-published.');
