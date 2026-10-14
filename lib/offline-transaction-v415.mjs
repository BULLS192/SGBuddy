/* V4.15 Wave 2: recovery journal stored in CacheStorage, never in the public shell.
 * Safely restore prior opt-in JSON after process termination mid-update.
 */
import {OFFLINE_CACHE} from './offline-packs-v480.mjs';
import {usableOfflineJson} from './offline-resilience-v415.mjs';
export const TXN_PREFIX='sgbuddy-offline-txn-v415-';
export const TXN_MARKER='/__sgbuddy_offline_txn_v415.json';
export function transactionName(pack){
 if(!/^[a-z][a-z0-9-]*$/.test(pack?.id||''))throw Error('invalid offline pack id');
 return TXN_PREFIX+pack.id;
}
const sameFiles=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
export async function recoverInterruptedPack(storage,pack){
 const name=transactionName(pack);
 if(!(await storage.keys()).includes(name))return {state:'none'};
 const journal=await storage.open(name);
 const manifestResponse=await journal.match(TXN_MARKER);
 // Marker is written only after the full backup has been staged; no public writes
 // are allowed before that point. An incomplete backup can safely be discarded.
 if(!manifestResponse){await storage.delete(name);return {state:'discarded'};}
 let manifest;
 try{manifest=await manifestResponse.json();}
 catch{return {state:'failed',reason:'invalid journal'};}
 if(manifest.version!==1||!sameFiles(manifest.files,pack.files)||!Array.isArray(manifest.existed)||manifest.existed.length!==pack.files.length||manifest.existed.some(v=>typeof v!=='boolean'))
  return {state:'failed',reason:'unrecognized journal'};
 try{
  // Validate backup before touching public data. An incomplete backup stays
  // available for diagnostics; never destroy personal or downloaded content.
  for(let i=0;i<pack.files.length;i++){
   if(manifest.existed[i]&&!await usableOfflineJson(await journal.match(pack.files[i])))
    return {state:'failed',reason:'incomplete backup'};
  }
  const current=await storage.open(OFFLINE_CACHE);
  for(let i=0;i<pack.files.length;i++){
   const file=pack.files[i],wasPresent=manifest.existed[i];
   if(wasPresent)await current.put(file,(await journal.match(file)).clone());
   else await current.delete(file);
  }
  await journal.delete(TXN_MARKER);
  await storage.delete(name);
  return {state:'restored',files:pack.files.length};
 }catch{return {state:'failed',reason:'restore failed'}}
}
export async function recoverAllInterruptedPacks(storage,packs){
 const rows=[];
 for(const pack of packs)rows.push({id:pack.id,...await recoverInterruptedPack(storage,pack)});
 return rows;
}
export async function durableOfflineUpdate(storage,pack,{fetchFile,validateFile}){
 const old=await recoverInterruptedPack(storage,pack);
 if(old.state==='failed')throw Error('offline recovery must be repaired first');
 if(typeof fetchFile!=='function'||typeof validateFile!=='function')throw Error('missing offline source validation');
 const fresh=[];
 for(const file of pack.files){
  if(!validateFile(file))throw Error('disallowed offline resource');
  const response=await fetchFile(file);
  if(!await usableOfflineJson(response))throw Error('invalid offline JSON: '+file);
  fresh.push({file,response});
 }
 const current=await storage.open(OFFLINE_CACHE),name=transactionName(pack);
 await storage.delete(name);
 const journal=await storage.open(name);
 const existed=[];
 try{
  for(const {file} of fresh){
   const before=await current.match(file);
   const valid=before&&await usableOfflineJson(before);
   existed.push(Boolean(valid));
   if(valid)await journal.put(file,before.clone());
  }
  // Last journal write is the commit intent. Crashes before this do not
  // affect the public cache; crashes after it are recovered on next launch.
  await journal.put(TXN_MARKER,new Response(JSON.stringify({
   version:1,files:pack.files,existed
  }),{headers:{'content-type':'application/json'}}));
 }catch(err){await storage.delete(name);throw err}
 try{
  for(const {file,response} of fresh)await current.put(file,response.clone());
  // Deleting the marker is the commit point. A crash after the marker is
  // removed leaves a valid new pack; a crash before it restores the old pack.
  await journal.delete(TXN_MARKER);
  try{await storage.delete(name)}catch{} // stale journal without marker is safe to discard at next boot
  return {ok:true,files:fresh.length};
 }catch(err){
  const recovered=await recoverInterruptedPack(storage,pack);
  if(recovered.state!=='restored')throw new Error('offline rollback incomplete; recovery required',{cause:err});
  throw err;
 }
}
