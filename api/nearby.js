import { allBusStops, busArrivals, haversine, hasLtaKey } from '../lib/lta.js';
import { demoNearby } from '../lib/demo.js';
export default async function handler(req,res){
  try{
    if(!hasLtaKey()) return res.status(200).json(demoNearby);
    const lat=Number(req.query.lat), lon=Number(req.query.lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)) return res.status(400).json({error:'lat and lon are required'});
    const all=await allBusStops();
    const nearest=all.map(s=>({raw:s,d:haversine(lat,lon,Number(s.Latitude),Number(s.Longitude))})).sort((a,b)=>a.d-b.d).slice(0,5);
    const stops=await Promise.all(nearest.map(async x=>({
      code:x.raw.BusStopCode,
      name:x.raw.Description,
      roadName:x.raw.RoadName||null,
      lat:Number(x.raw.Latitude),
      lon:Number(x.raw.Longitude),
      distance:Math.round(x.d),
      services:await busArrivals(x.raw.BusStopCode)
    })));
    res.status(200).json({source:'live',location:{lat,lon},stops});
  }catch(e){res.status(200).json({...demoNearby,source:'demo-fallback',error:e.message});}
}
