/* V4.9 official venue review collector.
 * Respect robots.txt; cap requests; accept only official, dated source pages;
 * never publish unreviewed records or turn a retailer offer into a public event.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {extractVenueLinks,parseVenueDetail,robotsAllows} from '../lib/events-public-html-v490.mjs';
import {normalizeReview} from '../lib/events-feeds-v480.mjs';
const paths={sources:'data/event-venue-sources-v490.json',queue:'data/events-review-queue-v470.json'};
const config=JSON.parse(readFileSync(paths.sources,'utf8')),before=JSON.parse(readFileSync(paths.queue,'utf8'));
const today=singaporeDate(),write=process.argv.includes('--write'),summary=[];
const all=(before.candidates||[]).filter(c=>c.endDate>=today);
const headers={'User-Agent':'SGBuddy-Events/1.0 (review-only; once per day; no auto-publication)','Accept':'text/html, text/plain'};
async function bounded(url,source,type='html'){
 const u=new URL(url);
 if(u.protocol!=='https:'||u.hostname!==source.host)throw Error('Host not allowlisted');
 const r=await fetch(u,{redirect:'follow',signal:AbortSignal.timeout(8500),headers});
 const target=new URL(r.url);
 if(target.hostname!==source.host||target.protocol!=='https:')throw Error('Disallowed redirect');
 if(!r.ok)throw Error('HTTP '+r.status);
 if(type==='html'&&!String(r.headers.get('content-type')||'').includes('text/html'))throw Error('Not HTML');
 const declared=Number(r.headers.get('content-length')||'0');if(declared>source.maxBytes)throw Error('Response too large');
 const body=await r.text();
 if(body.length>source.maxBytes)throw Error('Content exceeded byte limit');
 return body;
}
async function policies(source){
 const url='https://'+source.host+'/robots.txt';
 try{
  const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(6000),headers});
  if(r.status===404||r.status===410)return {allowed:true,body:''};
  if(!r.ok||new URL(r.url).hostname!==source.host)return {allowed:false,reason:'Robots unavailable or redirected'};
  const body=await r.text();
  if(body.length>150000)return {allowed:false,reason:'Oversized robots policy'};
  return {allowed:true,body};
 }catch{return {allowed:false,reason:'Robots could not be checked'}}
}
for(const source of config.sources){
 const status={source:source.id,kind:source.kind,reviewOnly:true};
 try{
  const bot=await policies(source);
  if(!bot.allowed||!robotsAllows(bot.body,new URL(source.url).pathname))throw Error(bot.reason||'Robots disallow listing');
  const html=await bounded(source.url,source);
  const links=extractVenueLinks(html,source).slice(0,source.maxDetails);
  status.links=links.length;
  const found=[];
  for(const link of links){
   if(!robotsAllows(bot.body,new URL(link).pathname)){status.robotsSkipped=(status.robotsSkipped||0)+1;continue}
   try{
    const text=await bounded(link,source);
    const event=parseVenueDetail(text,source,link,today);
    if(event)found.push(event);
   }catch{status.unreadableDetails=(status.unreadableDetails||0)+1}
  }
  // Do not clear the prior queue if the venue page suddenly returns no eligible records.
  if(found.length){
   const foundIds=new Set(found.map(x=>x.id));
   const retained=all.filter(x=>x.sourceId!==source.sourceId||!foundIds.has(x.id));
   all.splice(0,all.length,...retained,...found);
  }
  status.state='reachable';status.reviewCandidates=found.length;
 }catch(err){status.state='unavailable';status.message=String(err?.message||err).slice(0,160)}
 summary.push(status);
}
const next=normalizeReview(all,today);
console.log('V4.9 official venue discovery: '+JSON.stringify(summary));
console.log('Total review-only candidates '+next.length+' (including retained external feeds)');
if(write){
 if(JSON.stringify(before.candidates)!==JSON.stringify(next)){
  writeFileSync(paths.queue,JSON.stringify({schemaVersion:2,asOf:today,candidates:next,diagnostics:summary},null,2)+'\n');
  console.log('Review-only queue changed; no publication');
 }else console.log('Review queue unchanged; skip write/commit');
}else console.log('Probe only; no repository writes');
