import { planJourney } from '../lib/journey.js';

const cache=new Map();
const TTL=5*60*1000;
const clean=s=>String(s||'').trim();

async function pool(items,limit,worker){
  const out=new Array(items.length);let next=0;
  async function run(){while(next<items.length){const i=next++;out[i]=await worker(items[i],i)}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},run));
  return out;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','public, max-age=60, s-maxage=300, stale-while-revalidate=300');
  const lat=Number(req.query?.lat),lon=Number(req.query?.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon))return res.status(400).json({ok:false,error:'Valid lat/lon required'});
  const names=String(req.query?.names||'').split('|').map(clean).filter(Boolean).slice(0,20);
  if(!names.length)return res.status(200).json({ok:true,items:[]});
  const key=[lat.toFixed(3),lon.toFixed(3),names.join('|')].join(':');
  const prior=cache.get(key);if(prior&&Date.now()-prior.at<TTL)return res.status(200).json(prior.value);
  const rows=await pool(names,3,async name=>{
    try{
      const p=await planJourney({originLat:lat,originLon:lon,to:name,includeWeather:false});
      const o=p?.options?.[0];
      return {name,ok:Boolean(p?.ok&&o),minutes:o?.totalMinutes??null,mode:o?.mode||null,title:o?.title||null,realtime:Boolean(o?.realtime),destination:p?.destination||null};
    }catch(error){return {name,ok:false,error:error.message,minutes:null}}
  });
  const value={ok:true,generatedAt:new Date().toISOString(),items:rows};
  cache.set(key,{at:Date.now(),value});
  return res.status(200).json(value);
}
