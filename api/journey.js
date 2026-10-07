import { hasLtaKey } from '../lib/lta.js';
import { planJourney, searchJourneyPlaces } from '../lib/journey.js';
import { searchSingaporeAddresses, hasOneMapCredentials } from '../lib/onemap.js';

const etaCache=new Map();
const ETA_TTL=5*60*1000;
async function pool(items,limit,worker){
  const out=new Array(items.length);let next=0;
  async function run(){while(next<items.length){const i=next++;out[i]=await worker(items[i],i)}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},run));
  return out;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  if(!hasLtaKey()) return res.status(503).json({error:'LTA data is not configured',code:'NO_LTA_KEY'});

  const action=String(req.query.action||'').trim();

  if(action==='geocode'){
    const q=String(req.query.q||'').trim();
    if(q.length<2)return res.status(200).json({ok:true,query:q,configured:hasOneMapCredentials(),items:[]});
    try{
      const authoritative=await searchSingaporeAddresses(q,{limit:8});
      if(authoritative.items.length)return res.status(200).json({ok:true,...authoritative});
      const fallback=await searchJourneyPlaces(q,{limit:8});
      const addressLike=(fallback.suggestions||[]).filter(x=>!['bus-stop','station','rail'].includes(String(x.type||'').toLowerCase()));
      const items=addressLike.map(x=>({
        label:x.label||x.value,address:x.address||x.value||x.label,postal:x.postal||null,
        lat:Number.isFinite(Number(x.lat))?Number(x.lat):null,lon:Number.isFinite(Number(x.lon))?Number(x.lon):null,
        source:'SGBuddy catalog',verified:false,
      }));
      return res.status(200).json({ok:true,query:q,configured:hasOneMapCredentials(),items});
    }catch(error){return res.status(502).json({ok:false,error:error.message,configured:hasOneMapCredentials(),items:[]})}
  }

  if(action==='place-etas'){
    const lat=Number(req.query.lat),lon=Number(req.query.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))return res.status(400).json({ok:false,error:'Valid lat/lon required'});
    const names=String(req.query.names||'').split('|').map(x=>String(x||'').trim()).filter(Boolean).slice(0,20);
    if(!names.length)return res.status(200).json({ok:true,items:[]});
    const key=[lat.toFixed(3),lon.toFixed(3),names.join('|')].join(':');
    const prior=etaCache.get(key);if(prior&&Date.now()-prior.at<ETA_TTL)return res.status(200).json(prior.value);
    const rows=await pool(names,3,async name=>{
      try{
        const p=await planJourney({originLat:lat,originLon:lon,to:name,includeWeather:false});
        const o=p?.options?.[0];
        return {name,ok:Boolean(p?.ok&&o),minutes:o?.totalMinutes??null,mode:o?.mode||null,title:o?.title||null,realtime:Boolean(o?.realtime),destination:p?.destination||null};
      }catch(error){return {name,ok:false,error:error.message,minutes:null}}
    });
    const value={ok:true,generatedAt:new Date().toISOString(),items:rows};
    etaCache.set(key,{at:Date.now(),value});
    res.setHeader('Cache-Control','public, max-age=60, s-maxage=300, stale-while-revalidate=300');
    return res.status(200).json(value);
  }

  const search=String(req.query.search||'').trim();
  if(search){try{return res.status(200).json(await searchJourneyPlaces(search,{limit:8}))}catch(error){return res.status(500).json({error:error.message||'Place search failed',code:'PLACE_SEARCH_ERROR'})}}
  const to=String(req.query.to||'').trim();
  const from=String(req.query.from||'').trim();
  const originLat=Number(req.query.lat);
  const originLon=Number(req.query.lon);

  if(!to) return res.status(400).json({error:'Destination is required',code:'DESTINATION_REQUIRED'});

  try{
    const result=await planJourney({
      from,
      to,
      originLat:Number.isFinite(originLat)?originLat:undefined,
      originLon:Number.isFinite(originLon)?originLon:undefined,
      arriveBy:req.query.arriveBy?String(req.query.arriveBy):undefined,
    });
    if(!result.ok){
      const status=result.code==='UNRESOLVED_DESTINATION'?422:400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  }catch(error){
    return res.status(500).json({error:error.message||'Journey planning failed',code:'JOURNEY_ERROR'});
  }
}
