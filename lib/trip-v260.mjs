/* SGBuddy V2.6 — pure, bounded, device-local trip model. */
export const STORE_KEY='sgbuddy-my-trips-v260';
export const MAX_TRIPS=8,MAX_DAYS=14,MAX_STOPS=30;
const clean=(v,max=120)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
const isoDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const id=()=>globalThis.crypto?.randomUUID?.()||('t'+Date.now().toString(36)+Math.random().toString(36).slice(2,11));
export function dayDate(start,index){if(!isoDate(start))return '';const date=new Date(start+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+index);return date.toISOString().slice(0,10)}
export function newTrip(name,date,days=3){if(!isoDate(date))throw Error('Choose a valid starting date');const count=Math.max(1,Math.min(MAX_DAYS,Number(days)||3));return{id:id(),name:clean(name,90)||'My Singapore trip',startDate:date,days:Array.from({length:count},()=>[]),createdAt:new Date().toISOString()}}
export function validPlace(place){
 if(!place||typeof place!=='object')return null;
 const name=clean(place.name,140),placeId=clean(place.id,110);
 if(!name||!placeId)return null;
 return{id:placeId,name,kind:clean(place.kind,80),area:clean(place.area,100),address:clean(place.address,230),sourceUrl:(/^https:\/\//.test(String(place.sourceUrl||''))?clean(place.sourceUrl,350):''),status:clean(place.status,60)};
}
export function addStop(trip,dayIndex,place){
 const value=validPlace(place),day=trip?.days?.[dayIndex];if(!value||!Array.isArray(day))return false;
 if(day.length>=MAX_STOPS||day.some(stop=>stop.place.id===value.id))return false;
 day.push({key:id(),place:value,time:'',note:'',done:false});return true;
}
export function moveStop(trip,dayIndex,stopIndex,direction){
 const src=trip?.days?.[dayIndex],to=stopIndex+direction;
 if(!Array.isArray(src)||to<0||to>=src.length||stopIndex<0)return false;
 [src[to],src[stopIndex]]=[src[stopIndex],src[to]];return true;
}
export function moveDay(trip,fromIndex,stopIndex,toIndex){
 const from=trip?.days?.[fromIndex],to=trip?.days?.[toIndex];
 if(!Array.isArray(from)||!Array.isArray(to)||!from[stopIndex]||to.length>=MAX_STOPS)return false;
 if(fromIndex===toIndex)return false;
 const [stop]=from.splice(stopIndex,1);to.push(stop);return true;
}
export function editStop(stop,field,value){
 if(!stop)return false;
 if(field==='time'){const v=String(value||'');if(v&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))return false;stop.time=v;return true}
 if(field==='note'){stop.note=clean(value,280);return true}
 if(field==='done'){stop.done=Boolean(value);return true}
 return false;
}
export function hydrate(raw){
 const input=raw&&typeof raw==='object'?raw:{},items=Array.isArray(input.trips)?input.trips:[];
 const trips=items.slice(0,MAX_TRIPS).flatMap(t=>{
  if(!t||!isoDate(t.startDate)||!Array.isArray(t.days)||!t.days.length)return [];
  const days=t.days.slice(0,MAX_DAYS).map(day=>(Array.isArray(day)?day:[]).slice(0,MAX_STOPS).flatMap(s=>{
   const place=validPlace(s?.place);if(!place)return [];
   return [{key:clean(s.key,90)||id(),place,time:/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time||'')?s.time:'',note:clean(s.note,280),done:s.done===true}];
  }));
  return [{id:clean(t.id,90)||id(),name:clean(t.name,90)||'My Singapore trip',startDate:t.startDate,days,createdAt:clean(t.createdAt,30)}];
 });
 const activeId=trips.some(t=>t.id===input.activeId)?input.activeId:trips[0]?.id||null;
 return {schemaVersion:1,activeId,trips};
}
export function shareText(trip){
 if(!trip)return '';
 const lines=[trip.name,'Singapore itinerary · '+trip.startDate+' · '+trip.days.length+' day(s)',''];
 trip.days.forEach((day,i)=>{
  lines.push('Day '+(i+1)+' — '+dayDate(trip.startDate,i));
  if(!day.length)lines.push('  No stops planned');
  day.forEach((s,j)=>{
   lines.push('  '+(j+1)+'. '+(s.time?s.time+' · ':'')+s.place.name+(s.place.area?' · '+s.place.area:''));
   if(s.place.address)lines.push('     '+s.place.address);
   if(s.note)lines.push('     Note: '+s.note);
  });
  lines.push('');
 });
 lines.push('Plan only. Check venue hours, access and transport before visiting. No reservations are made.');
 return lines.join('\n');
}
