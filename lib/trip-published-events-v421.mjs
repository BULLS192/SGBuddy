/* V4.21 Wave 2 — recommendations from the PUBLISHED, verified Singapore Events feed only.
 * No review queue, raw scraper records, seat availability or booking claims.
 */
import {dayDate} from './trip-v260.mjs';
import {matchingEventDay} from './events-explore-v414.mjs';
import {isValidDay} from './events-v470.mjs';
import {publishedSourceState} from './events-discovery-v418.mjs';
export function tripPublishedEvents(trip,events,sources,today,{limit=8}={}){
 if(!isValidDay(today)||!Array.isArray(trip?.days)||!isValidDay(trip.startDate)||!Array.isArray(events)||!Array.isArray(sources))return [];
 const start=trip.startDate,end=dayDate(start,trip.days.length-1);
 if(!end)return [];
 const planned=new Set(trip.days.flatMap(day=>Array.isArray(day)?day.map(s=>s?.place?.id):[]));
 const out=[],ids=new Set(),cap=Math.max(0,Math.min(12,Number.isInteger(limit)?limit:8));
 for(const e of events.slice(0,500)){
  if(out.length>=cap)break;
  if(!e||e.status!=='scheduled'||!e.verificationMethod||!isValidDay(e.verifiedAt)||!isValidDay(e.startDate)||!isValidDay(e.endDate)||e.endDate<e.startDate||e.endDate<today)continue;
  if(!/^[-a-z0-9]{6,90}$/.test(e.id||'')||ids.has(e.id)||planned.has('sgbuddy-event-'+e.id))continue;
  if(e.startDate>end||e.endDate<start)continue;
  const state=publishedSourceState(e,today,sources);
  if(state!=='snapshot'&&state!=='review-needed')continue;
  const dayIndex=matchingEventDay(trip,e);
  if(dayIndex<0||!String(e.title||'').trim()||!String(e.venue||'').trim())continue;
  ids.add(e.id);
  out.push({id:e.id,event:e,dayIndex,day:dayDate(start,dayIndex),sourceState:state});
 }
 return out.sort((a,b)=>a.dayIndex-b.dayIndex||a.event.startDate.localeCompare(b.event.startDate)||a.event.title.localeCompare(b.event.title));
}
