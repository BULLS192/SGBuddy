/* V4.15 Wave 1 — verified JSON cache and recoverable writes, first-party opt-in packs only. */
export async function usableOfflineJson(response){
 if(!response?.ok||!String(response.headers?.get('content-type')||'').toLowerCase().includes('json'))return false;
 try{
  const data=await response.clone().json();
  return !!data&&typeof data==='object'&&!(Object.hasOwn(data,'error')&&Object.keys(data).length===1);
 }catch{return false}
}
export function offlineAge(iso,now=new Date(),days=14){
 const n=Date.parse(iso||''),current=+new Date(now);
 if(!Number.isFinite(n)||!Number.isFinite(current)||n>current+86400000)return 'unknown';
 return current-n>days*86400000?'stale':'recent';
}
export async function inspectOfflinePack(cache,pack,stamp,now=new Date()){
 let present=0,valid=0;
 for(const file of pack.files){
  const r=await cache.match(file);
  if(r){present++;if(await usableOfflineJson(r))valid++;}
 }
 return {present,valid,total:pack.files.length,complete:valid===pack.files.length,
  damaged:present>valid,partial:present>0&&valid<pack.files.length,freshness:offlineAge(stamp,now)};
}
export async function estimateOfflineStorage(storage){
 if(typeof storage?.estimate!=='function')return {supported:false};
 try{const {usage,quota}=await storage.estimate();
  if(!Number.isFinite(usage)||!Number.isFinite(quota)||quota<=0)return {supported:false};
  const ratio=Math.min(1,Math.max(0,usage/quota));
  return {supported:true,usage,quota,ratio,low:ratio>=.85};
 }catch{return {supported:false}}
}
export async function updateOfflinePack(cache,pack,{fetchFile,validateFile}){
 if(!cache||!pack?.files?.length||typeof fetchFile!=='function'||typeof validateFile!=='function')throw Error('invalid offline pack');
 const pending=[];
 for(const file of pack.files){
  if(!validateFile(file))throw Error('disallowed resource');
  const response=await fetchFile(file);
  if(!await usableOfflineJson(response))throw Error('invalid JSON: '+file);
  pending.push({file,response});
 }
 const originals=new Map(await Promise.all(pending.map(async x=>[x.file,await cache.match(x.file)])));
 const updated=[];
 try{
  for(const item of pending){await cache.put(item.file,item.response.clone());updated.push(item.file);}
 }catch(error){
  let failed=false;
  for(const file of updated){
   try{const old=originals.get(file);if(old)await cache.put(file,old.clone());else await cache.delete(file)}
   catch{failed=true}
  }
  if(failed)throw new Error('rollback incomplete: offline cache may need repair',{cause:error});
  throw error;
 }
 return {ok:true,files:updated.length};
}
