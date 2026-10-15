/* SGBuddy V4.20 Wave 1 — read-only, device-local trip intelligence.
 * No predictive ETAs, invented coordinates, map API calls or auto-booking.
 */
import {dayOverview,dayRouteUrl} from './trip-v260.mjs';
const key=v=>String(v??'').trim().toLocaleLowerCase();
const own=(x,name)=>Object.prototype.hasOwnProperty.call(x,name);
export function tripOverview(trip){
 const days=Array.isArray(trip?.days)?trip.days:[];
 let plannedDays=0,totalStops=0,timed=0,timeConflicts=0,missingAddresses=0;
 const byPlace=new Map();
 for(let d=0;d<days.length;d++){
  const day=Array.isArray(days[d])?days[d]:[];
  if(day.length)plannedDays++;
  const stats=dayOverview(trip,d);
  totalStops+=stats.count;timed+=stats.timed;
  timeConflicts+=stats.timeConflicts;missingAddresses+=stats.missingAddress;
  for(const stop of day){
   const place=stop?.place,placeKey=key(place?.id);
   if(!placeKey)continue;
   if(!byPlace.has(placeKey))byPlace.set(placeKey,{id:String(place.id),name:String(place.name||''),days:new Set()});
   byPlace.get(placeKey).days.add(d+1);
  }
 }
 const repeated=[...byPlace.values()].filter(p=>p.days.size>1).map(p=>({id:p.id,name:p.name,days:[...p.days]}));
 return {totalDays:days.length,plannedDays,totalStops,timed,timeConflicts,missingAddresses,repeated};
}
/* Routes for long days cover every stop, using a common endpoint between segments.
   URLs are external Google Maps estimates, not SGBuddy journey-time assertions. */
export function dayRouteSegments(trip,dayIndex,{mode='walking',maxStops=5}={}){
 const day=trip?.days?.[dayIndex];
 if(!Array.isArray(day)||day.length<2||!['walking','driving'].includes(mode))return [];
 const cap=Math.min(5,Math.max(2,Number.isInteger(maxStops)?maxStops:5)),step=cap-1,parts=[];
 for(let i=0;i<day.length-1;i+=step){
  const slice=day.slice(i,i+cap);
  const url=dayRouteUrl({days:[slice]},0,{mode,maxStops:cap});
  if(!url)return []; // Do not present an incomplete route sequence.
  parts.push({number:parts.length+1,from:i+1,to:i+slice.length,url});
 }
 return parts;
}
/* Recommendations are exact area-label matches to first-party directory entries.
   No proximity, hours, admission or route accuracy is inferred. */
export function suggestDayPlaces(trip,dayIndex,catalogue,{limit=3}={}){
 const day=trip?.days?.[dayIndex];
 if(!Array.isArray(day)||!day.length||!Array.isArray(catalogue))return [];
 const counts=new Map();
 for(const stop of day){const area=key(stop?.place?.area);if(area)counts.set(area,(counts.get(area)||0)+1)}
 if(!counts.size)return [];
 const target=[...counts].sort((a,b)=>b[1]-a[1])[0][0];
 const planned=new Set((trip.days||[]).flatMap(d=>(Array.isArray(d)?d:[]).map(x=>key(x?.place?.id))));
 const out=[],seen=new Set(),cap=Math.max(0,Math.min(3,Number.isInteger(limit)?limit:3));
 for(const p of catalogue.slice(0,2000)){
  if(out.length>=cap)break;
  const id=key(p?.id);
  if(!id||!String(p?.name||'').trim()||key(p?.area)!==target||planned.has(id)||seen.has(id))continue;
  if(['needs-review','cancelled','postponed'].includes(p?.status)||key(p?.kind)==='event')continue;
  seen.add(id);out.push(p);
 }
 return out;
}
