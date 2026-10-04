import { hasLtaKey, lta } from '../lib/lta.js';
import { demoTraffic } from '../lib/demo.js';
export async function getTraffic(){
  if(!hasLtaKey()) return demoTraffic;
  const p=await lta('/TrafficIncidents'); const rows=p.value||[];
  return {source:'live',count:rows.length,incidents:rows.slice(0,12).map(x=>({type:x.Type,message:x.Message,latitude:x.Latitude,longitude:x.Longitude}))};
}
export default async function handler(req,res){try{res.status(200).json(await getTraffic())}catch(e){res.status(200).json({...demoTraffic,source:'demo-fallback',error:e.message})}}
