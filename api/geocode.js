import { searchSingaporeAddresses, hasOneMapCredentials } from '../lib/onemap.js';
import { searchJourneyPlaces } from '../lib/journey.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const q=String(req.query?.q||'').trim();
  if(q.length<2)return res.status(200).json({ok:true,query:q,configured:hasOneMapCredentials(),items:[]});
  try{
    const authoritative=await searchSingaporeAddresses(q,{limit:8});
    if(authoritative.items.length)return res.status(200).json({ok:true,...authoritative});
    const fallback=await searchJourneyPlaces(q,{limit:8});
    const items=(fallback.suggestions||[]).map(x=>({
      label:x.label||x.value,address:x.address||x.value||x.label,postal:x.postal||null,
      lat:Number.isFinite(Number(x.lat))?Number(x.lat):null,lon:Number.isFinite(Number(x.lon))?Number(x.lon):null,
      source:'SGBuddy catalog',verified:false,
    }));
    return res.status(200).json({ok:true,query:q,configured:hasOneMapCredentials(),items});
  }catch(error){
    return res.status(502).json({ok:false,error:error.message,configured:hasOneMapCredentials(),items:[]});
  }
}
