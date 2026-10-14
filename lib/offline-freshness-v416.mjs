/* V4.16 Wave 1: read-only, user-initiated freshness probes for downloaded public JSON. */
import {validateOfflineRequest} from './offline-packs-v480.mjs';
import {usableOfflineJson} from './offline-resilience-v415.mjs';
const strongTag=v=>/^"[^"]+"$/.test(String(v||'').trim())?String(v).trim():null;
export function compareOfflineValidators(cached,remote){
 if(!cached||!remote?.ok)return 'unknown';
 const a=strongTag(cached.headers?.get('etag')),b=strongTag(remote.headers?.get('etag'));
 if(a&&b)return a===b?'same':'changed';
 const oldDate=Date.parse(cached.headers?.get('last-modified')||'');
 const newDate=Date.parse(remote.headers?.get('last-modified')||'');
 if(Number.isFinite(oldDate)&&Number.isFinite(newDate)){
  if(newDate>oldDate)return 'changed';
  if(newDate===oldDate)return 'same';
 }
 return 'unknown';
}
export async function checkDownloadedPublicPacks(cache,packs,{origin,probe}){
 if(!cache||!origin||typeof probe!=='function')throw Error('invalid offline freshness checker');
 const rows=[];
 for(const pack of packs){
  const row={id:pack.id,present:0,same:0,changed:0,unknown:0};
  for(const path of pack.files){
   if(!validateOfflineRequest(path,origin))throw Error('not allowlisted public data');
   const cached=await cache.match(path);
   if(!cached)continue; // Do not probe packs the user never downloaded.
   row.present++;
   if(!await usableOfflineJson(cached)){row.unknown++;continue;} // Corrupt body is never called unchanged.
   let state='unknown';
   try{state=compareOfflineValidators(cached,await probe(path))}catch{}
   row[state]++;
  }
  rows.push(row);
 }
 return rows;
}
