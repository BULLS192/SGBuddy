/* SGBuddy V4.14: source-registry regional discovery; no invented GPS distances. */
import {dayDate,validPlace} from './trip-v260.mjs';
import {isValidDay} from './events-v470.mjs';
export const EVENT_AREAS=Object.freeze(['all','central','east','west','north','south','islandwide']);
export const EVENT_CATEGORIES_FILTER=Object.freeze(['all','arts','culture','market','family','exhibition','sports','outdoors','music','food','community']);
export function sourceArea(event,sources=[]){
 const source=(sources||[]).find(s=>s.id===event?.sourceId);
 const value=String(source?.area||'').toLowerCase();
 return EVENT_AREAS.includes(value)&&value!=='all'?value:null;
}
export function filterEventsByAreaCategory(events,sources=[],area='all',category='all'){
 if(!EVENT_AREAS.includes(area)||!EVENT_CATEGORIES_FILTER.includes(category))return [];
 return (Array.isArray(events)?events:[]).filter(e=>
  (area==='all'||sourceArea(e,sources)===area)&&
  (category==='all'||e.category===category));
}
/* Match a multi-day event to the date actually represented by My Trip; never add it
 * to an arbitrary itinerary day just because a trip exists. */
export function matchingEventDay(trip,event){
 if(!Array.isArray(trip?.days)||!isValidDay(event?.startDate)||!isValidDay(event?.endDate)||event.endDate<event.startDate)return -1;
 return trip.days.findIndex((_,index)=>{
  const day=dayDate(trip.startDate,index);
  return day>=event.startDate&&day<=event.endDate;
 });
}
export function eventFallbackDate(event,today){
 if(!isValidDay(today)||!isValidDay(event?.startDate)||!isValidDay(event?.endDate)||event.endDate<today||event.endDate<event.startDate)return null;
 return event.startDate>=today?event.startDate:today;
}
export function eventTripPlace(event){
 if(!event||event.status!=='scheduled'||!/^[-a-z0-9]{6,90}$/.test(event.id||'')||typeof event.title!=='string'||!event.title.trim())return null;
 try{if(new URL(event.sourceUrl).protocol!=='https:')return null}catch{return null}
 return validPlace({id:'sgbuddy-event-'+event.id,name:event.title,
  kind:'Event',area:event.venue||'Singapore',address:event.venue||'',
  sourceUrl:event.sourceUrl,status:'official-event-snapshot'});
}
