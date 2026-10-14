/* V4.18 published-only discovery. Never read the editorial review queue in the client. */
import {isValidDay,upcomingEvents,eventFreshness} from './events-v470.mjs';
const HORIZONS={today:1,next7:7,next30:30};
const daysAfter=(day,n)=>new Date(Date.parse(day+'T12:00:00+08:00')+n*86400000).toISOString().slice(0,10);
export const DISCOVERY_FILTERS=Object.freeze(['today','weekend','next7','next30','upcoming','free','markets','family']);
export function publishedDiscovery(events,day,filter='weekend',mode='visitor',query='',sources=[]){
 if(!isValidDay(day)||!DISCOVERY_FILTERS.includes(filter))return [];
 const horizon=HORIZONS[filter];
 const list=upcomingEvents(Array.isArray(events)?events:[],day,horizon?'upcoming':filter,mode);
 const max=horizon?daysAfter(day,horizon-1):null;
 const needle=String(query??'').trim().normalize('NFKC').toLocaleLowerCase().slice(0,80);
 const registry=new Map((Array.isArray(sources)?sources:[]).map(s=>[s.id,String(s.name||'')]));
 return list.filter(e=>{
  if(max&&!(e.startDate<=max&&e.endDate>=day))return false;
  // Old review/candidate records are never visible, even if accidentally mixed into a payload.
  if(e.status!=='scheduled'||!e.verificationMethod||!isValidDay(e.verifiedAt))return false;
  if(!needle)return true;
  return [e.title,e.venue,e.summary,registry.get(e.sourceId)].some(v=>
   String(v||'').normalize('NFKC').toLocaleLowerCase().includes(needle));
 });
}
export function publishedSourceState(event,day,sources=[]){
 if(!isValidDay(day)||!event||event.status!=='scheduled'||!isValidDay(event.verifiedAt))
  return 'unverified';
 const publisher=(sources||[]).find(s=>s.id===event.sourceId);
 const host=value=>{try{return new URL(value).hostname.toLowerCase().replace(/^www\./,'')}catch{return ''}};
 if(!publisher||!host(event.sourceUrl)||host(event.sourceUrl)!==host(publisher.url))return 'source-review';
 return eventFreshness(event,day)==='snapshot'?'snapshot':'review-needed';
}
