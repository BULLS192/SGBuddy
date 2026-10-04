import { allBusStops, busArrivals, hasLtaKey } from './lib/lta.js';
import { demoNearby } from './lib/demo.js';

export default async function handler(req,res){
  const code=String(req.query.stop||'').trim();
  if(!/^\d{5}$/.test(code)) return res.status(400).json({error:'A 5-digit bus stop code is required'});
  try{
    if(!hasLtaKey()){
      const demo=demoNearby.stops.find(s=>s.code===code)||{code,name:`Bus Stop ${code}`,distance:null,lat:null,lon:null,services:demoNearby.stops[0].services};
      return res.status(200).json({source:'demo',stop:demo});
    }
    const [services,allStops]=await Promise.all([busArrivals(code),allBusStops()]);
    const row=allStops.find(s=>String(s.BusStopCode)===code);
    res.status(200).json({source:'live',stop:{
      code,
      name:row?.Description||`Bus Stop ${code}`,
      roadName:row?.RoadName||null,
      lat:Number.isFinite(Number(row?.Latitude))?Number(row.Latitude):null,
      lon:Number.isFinite(Number(row?.Longitude))?Number(row.Longitude):null,
      distance:null,
      services
    }});
  }catch(e){res.status(500).json({error:e.message});}
}
