/* V4.16: user-driven freshness evidence and safe selective plan, public data only. */
import {validateOfflineRequest} from './offline-packs-v480.mjs';
import {usableOfflineJson} from './offline-resilience-v415.mjs';
const strongTag=value=>/^"[^"]+"$/.test(String(value||'').trim())?String(value).trim():null;
export function compareOfflineEvidence(cached,remote){
 if(!cached||!remote?.ok)return {state:'unknown',evidence:'unavailable'};
 const cachedTag=strongTag(cached.headers?.get('etag'));
 const remoteTag=strongTag(remote.headers?.get('etag'));
 if(cachedTag&&remoteTag)return {state:cachedTag===remoteTag?'same':'changed',evidence:'strong-etag'};
 const oldDate=Date.parse(cached.headers?.get('last-modified')||'');
 const nextDate=Date.parse(remote.headers?.get('last-modified')||'');
 if(Number.isFinite(oldDate)&&Number.isFinite(nextDate)){
  if(nextDate>oldDate)return {state:'changed',evidence:'last-modified'};
  if(nextDate===oldDate)return {state:'same',evidence:'last-modified'};
 }
 return {state:'unknown',evidence:'unavailable'};
}
export const compareOfflineValidators=(cached,remote)=>compareOfflineEvidence(cached,remote).state;
export async function checkDownloadedPublicPacks(cache,packs,{origin,probe}){
 if(!cache||!origin||typeof probe!=='function')throw Error('invalid offline freshness checker');
 const rows=[];
 for(const pack of packs){
  const row={id:pack.id,present:0,same:0,changed:0,unknown:0,items:[]};
  for(const file of pack.files){
   if(!validateOfflineRequest(file,origin))throw Error('not allowlisted public data');
   const cached=await cache.match(file);
   if(!cached)continue; // Never probe a pack not previously opted into.
   row.present++;
   let result={state:'unknown',evidence:'damaged'};
   if(await usableOfflineJson(cached)){
    try{result=compareOfflineEvidence(cached,await probe(file));}catch{
     result={state:'unknown',evidence:'unavailable'};
    }
   }
   row[result.state]++;
   row.items.push({file,state:result.state,evidence:result.evidence});
  }
  rows.push(row);
 }
 return rows;
}
/* A fresh check is only advisory. The actual GET remains an explicit user action.
 * Unverified files are fetched, never silently classified as unchanged.
 */
export function planSelectiveOfflineUpdate(pack,inspected,checked){
 if(!checked||checked.id!==pack.id||!checked.present||!inspected.present)return {mode:'skip',files:[]};
 if(!inspected.complete)return {mode:'repair',files:[...pack.files]};
 const byFile=new Map(checked.items.map(x=>[x.file,x.state]));
 const files=pack.files.filter(file=>byFile.get(file)!=='same');
 return {mode:files.length?'selective':'skip',files};
}
