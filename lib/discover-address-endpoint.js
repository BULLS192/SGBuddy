import {readFileSync} from 'node:fs';
import {hasOneMapCredentials,searchSingaporeAddresses} from './onemap.js';
import {selectOneMapMatch} from './discover-geo.js';

// Single-place, server-side OneMap lookup. Never trust a name-only geocoder hit as proof
// that a stall or business currently operates. Token stays on Vercel server.
const directory=JSON.parse(readFileSync(new URL('../data/discover-v120.json',import.meta.url),'utf8'));
const places=new Map(directory.places.map(p=>[p.id,p]));
const cache=new Map(),TTL=12*60*60*1000;
export async function handleDiscoverAddress(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({ok:false,code:'METHOD_NOT_ALLOWED'});
 const id=String(req.query?.id||'').trim();
 if(!/^SGP-\d{4,5}$/.test(id)||!places.has(id))return res.status(404).json({ok:false,code:'UNKNOWN_PLACE'});
 const place=places.get(id);
 if(!hasOneMapCredentials())return res.status(200).json({ok:true,id,status:'not-configured',source:'OneMap',address:null,operationalStatus:'unverified'});
 const hit=cache.get(id);if(hit&&Date.now()-hit.at<TTL)return res.status(200).json(hit.data);
 try{
   const searches=[place.name,place.name+', '+place.area];
   let result={status:'not-found',confidence:0,match:null};
   for(const query of searches){
     const matches=await searchSingaporeAddresses(query,{limit:10});
     const proposed=selectOneMapMatch(place,matches.items||[]);
     if(proposed.status==='address-matched'){result=proposed;break}
     if(proposed.status==='ambiguous')result=proposed;
   }
   const payload={ok:true,id,name:place.name,status:result.status,
     confidence:result.confidence||0,source:'OneMap Search API',checkedAt:new Date().toISOString(),
     address:result.match||null,operationalStatus:'unverified',
     note:result.status==='address-matched'?'An address/name match only. Trading status, hours and stall tenants are not confirmed.':'No sufficiently precise venue-name match; do not navigate to guessed coordinates.'};
   cache.set(id,{at:Date.now(),data:payload});
   if(cache.size>450)cache.delete(cache.keys().next().value);
   return res.status(200).json(payload);
 }catch(err){
   return res.status(502).json({ok:false,id,status:'provider-unavailable',source:'OneMap',address:null,operationalStatus:'unverified',error:'OneMap address lookup is temporarily unavailable'});
 }
}
