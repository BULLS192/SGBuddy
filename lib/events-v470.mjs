/* SGBuddy V4.7: deterministic Singapore-local event filtering; no live-ticket claims. */
import {singaporeDate} from './calendar-v460.mjs';
import {duplicateOf} from './events-identity-v414.mjs';
export const EVENT_CATEGORIES=Object.freeze(['arts','culture','market','family','exhibition','sports','outdoors','music','food','community']);
export const ADMISSION_TYPES=Object.freeze(['free','ticketed','registration','check']);
const dayPattern=/^\d{4}-\d{2}-\d{2}$/;
export function isValidDay(day){
 if(typeof day!=='string'||!dayPattern.test(day))return false;
 const d=new Date(day+'T12:00:00+08:00');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===day;
}
export function weekendWindow(day=singaporeDate()){
 if(!isValidDay(day))throw Error('Invalid Singapore-local day');
 const noon=new Date(day+'T12:00:00+08:00');
 const weekday=noon.getUTCDay(); // Singapore noon is 04:00 UTC: weekday agrees with SG day.
 const plus=weekday===6?0:weekday===0?-1:(6-weekday);
 const saturday=new Date(noon.getTime()+plus*86400000);
 const sunday=new Date(saturday.getTime()+86400000);
 const sgDay=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 return {start:sgDay(saturday),end:sgDay(sunday)};
}
export function normalizedKey(event){
 return [event.title,event.venue,event.startDate].map(x=>String(x||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'')).join(':');
}
export function validateEvent(event,sourceIds){
 if(!event||typeof event!=='object'||!/^[-a-z0-9]{6,90}$/.test(event.id||''))return false;
 if(!isValidDay(event.startDate)||!isValidDay(event.endDate)||event.endDate<event.startDate)return false;
 if(!['scheduled','cancelled','postponed'].includes(event.status))return false;
 if(!sourceIds.has(event.sourceId)||!EVENT_CATEGORIES.includes(event.category)||!ADMISSION_TYPES.includes(event.admission))return false;
 if(!event.title||!event.venue||!event.summary||!isValidDay(event.verifiedAt))return false;
 try{const url=new URL(event.sourceUrl);if(url.protocol!=='https:')return false;}catch{return false}
 return true;
}
export function compileEvents(intake,sources,asOf='2026-10-13'){
 if(!isValidDay(asOf))throw Error('Invalid snapshot day');
 const sourceIds=new Set((sources.sources||[]).map(s=>s.id));
 const seen=new Set(),output=[],rejected=[];
 for(const event of intake.events||[]){
  if(!validateEvent(event,sourceIds)){rejected.push({id:event?.id||null,reason:'invalid'});continue}
  if(event.status!=='scheduled'){rejected.push({id:event.id,reason:event.status});continue}
  if(event.endDate<asOf){rejected.push({id:event.id,reason:'expired'});continue}
  const key=normalizedKey(event);
  if(seen.has(key)||duplicateOf(event,output)){rejected.push({id:event.id,reason:'duplicate'});continue}
  seen.add(key);output.push(event);
 }
 output.sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title));
 return {schemaVersion:1,asOf,timezone:'Asia/Singapore',sourceCount:sourceIds.size,events:output,rejected};
}
export function upcomingEvents(events,day=singaporeDate(),filter='upcoming',mode='visitor'){
 const win=weekendWindow(day);
 return (events||[]).filter(event=>{
  if(event.status!=='scheduled'||event.endDate<day)return false;
  if(filter==='weekend'&&!(event.startDate<=win.end&&event.endDate>=win.start))return false;
  if(filter==='free'&&event.admission!=='free')return false;
  if(filter==='family'&&event.category!=='family')return false;
  if(filter==='markets'&&event.category!=='market')return false;
  return true;
 }).sort((a,b)=>{
  const aMatch=a.audiences?.includes(mode)?0:1,bMatch=b.audiences?.includes(mode)?0:1;
  return aMatch-bMatch||a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title);
 });
}
export function eventFreshness(event,day=singaporeDate(),maxDays=14){
 const days=(Date.parse(day+'T12:00:00+08:00')-Date.parse(event.verifiedAt+'T12:00:00+08:00'))/86400000;
 return days>maxDays?'review-needed':days<0?'invalid':'snapshot';
}
