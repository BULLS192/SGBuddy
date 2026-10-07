import { get, put } from '@vercel/blob';

const PATH='sgbuddy/runtime/environment-last-good-v1.json';
let memory=null;

async function streamJson(stream){
  if(!stream)return null;
  try{return await new Response(stream).json()}catch{return null}
}

export async function readEnvironmentCache(){
  if(memory)return memory;
  if(!process.env.BLOB_READ_WRITE_TOKEN)return null;
  try{
    const result=await get(PATH,{access:'private',useCache:false});
    const parsed=await streamJson(result?.stream);
    if(parsed&&typeof parsed==='object'){memory=parsed;return parsed}
  }catch{}
  return null;
}

export async function writeEnvironmentCache(value){
  memory=value;
  if(!process.env.BLOB_READ_WRITE_TOKEN)return false;
  try{
    await put(PATH,JSON.stringify(value),{
      access:'private',
      addRandomSuffix:false,
      allowOverwrite:true,
      contentType:'application/json',
    });
    return true;
  }catch{return false}
}

export function cacheSignal(cache,key,value){
  if(value==null)return cache;
  return {...cache,[key]:{value,cachedAt:new Date().toISOString()}};
}

export function cachedSignal(cache,key,maxAgeMinutes){
  const row=cache?.[key];
  if(!row?.value||!row.cachedAt)return null;
  const ageMinutes=(Date.now()-Date.parse(row.cachedAt))/60000;
  if(!Number.isFinite(ageMinutes)||ageMinutes<0||ageMinutes>maxAgeMinutes)return null;
  return {value:row.value,ageMinutes:Math.round(ageMinutes),cachedAt:row.cachedAt};
}
