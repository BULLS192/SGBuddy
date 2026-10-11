/* SGBuddy V2.7 — unencrypted, bounded share snapshots; no backend or live collaboration. */
import {newTrip,addStop,editStop,MAX_DAYS,MAX_STOPS} from './trip-v260.mjs';
export const SHARE_PARAM='sgtrip',SHARE_VERSION=1,MAX_LINK_CHARS=7500,MAX_FILE_BYTES=60000;
const bounded=(v,max)=>String(v??'').slice(0,max);
const dateValid=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function snapshot(trip){
 if(!trip||!dateValid(trip.startDate)||!Array.isArray(trip.days)||trip.days.length<1||trip.days.length>MAX_DAYS)throw Error('Invalid trip');
 const days=trip.days.map(day=>{
  if(!Array.isArray(day)||day.length>MAX_STOPS)throw Error('Too many stops on one day');
  return day.map(s=>{
   const p=s?.place;if(!p||!p.id||!p.name)throw Error('Invalid place');
   return [bounded(p.id,110),bounded(p.name,140),bounded(p.kind,80),bounded(p.area,100),bounded(p.address,230),bounded(s.time,5),bounded(s.note,280),s.done===true?1:0];
  });
 });
 return {v:SHARE_VERSION,n:bounded(trip.name,90),s:trip.startDate,d:days};
}
export function fromSnapshot(raw){
 if(!raw||typeof raw!=='object'||raw.v!==SHARE_VERSION||!dateValid(raw.s)||!Array.isArray(raw.d)||raw.d.length<1||raw.d.length>MAX_DAYS)throw Error('Unrecognized or invalid SGBuddy itinerary');
 const trip=newTrip(bounded(raw.n,90),raw.s,raw.d.length);
 for(let i=0;i<raw.d.length;i++){
  const day=raw.d[i];if(!Array.isArray(day)||day.length>MAX_STOPS)throw Error('Trip exceeds the per-day limit');
  for(const entry of day){
   if(!Array.isArray(entry)||entry.length!==8||entry.some((x,j)=>j<7&&typeof x!=='string'))throw Error('Invalid stop format');
   const [id,name,kind,area,address,time,note,done]=entry;
   if(!id||!name||id.length>110||name.length>140||kind.length>80||area.length>100||address.length>230||note.length>280||(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)&&time!==''))throw Error('Stop data outside permitted limits');
   if(!addStop(trip,i,{id,name,kind,area,address,status:'shared-copy'}))throw Error('Duplicate or invalid stop in shared trip');
   const stop=trip.days[i].at(-1);
   editStop(stop,'time',time);editStop(stop,'note',note);editStop(stop,'done',done===1);
  }
 }
 return trip;
}
const b64bytes=bytes=>{let s='';for(let i=0;i<bytes.length;i+=4096)s+=String.fromCharCode(...bytes.subarray(i,i+4096));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const unb64=s=>{if(typeof s!=='string'||!s||s.length>MAX_LINK_CHARS||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Invalid share link');const raw=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));return Uint8Array.from(raw,ch=>ch.charCodeAt(0))};
export function encodeTrip(trip){const encoded=b64bytes(new TextEncoder().encode(JSON.stringify(snapshot(trip))));if(encoded.length>MAX_LINK_CHARS)throw Error('This itinerary is too long for a link. Export the trip file instead.');return encoded}
export function decodeTrip(code){let raw;try{raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(unb64(code)))}catch{throw Error('This SGBuddy share link is invalid or corrupted.')}return fromSnapshot(raw)}
export function buildTripUrl(originPath,trip){
 const url=new URL(originPath);
 if(url.protocol!=='https:'&&url.protocol!=='http:')throw Error('Invalid host');
 url.search='';
 url.hash=new URLSearchParams({[SHARE_PARAM]:encodeTrip(trip)}).toString();
 return url.href;
}
export function getLinkCode(hash){
 if(typeof hash!=='string'||hash.length>MAX_LINK_CHARS+100||!hash.startsWith('#'))return null;
 const params=new URLSearchParams(hash.slice(1));
 return params.get(SHARE_PARAM);
}
export function stripShareHash(locationUrl){
 const url=new URL(locationUrl);
 const params=new URLSearchParams(url.hash.slice(1));
 params.delete(SHARE_PARAM);
 url.hash=params.toString();
 return url.pathname+url.search+url.hash;
}
export function exportTripJSON(trip){return JSON.stringify({format:'sgbuddy.trip',version:SHARE_VERSION,trip:snapshot(trip)},null,2)}
export function importTripJSON(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_FILE_BYTES)throw Error('Trip file too large');let data;try{data=JSON.parse(text)}catch{throw Error('Trip file is not valid JSON')}if(data?.format!=='sgbuddy.trip'||data.version!==SHARE_VERSION)throw Error('Unsupported trip file format');return fromSnapshot(data.trip)}
