import { getTrain } from './train.js';
import { getTraffic } from './traffic.js';
import { getWeather } from './weather.js';
import { hasLtaKey } from '../lib/lta.js';
export default async function handler(req,res){
  const [rail,traffic,weather]=await Promise.all([getTrain(),getTraffic(),getWeather()]);
  res.status(200).json({
    schema:'sgbuddy.snapshot.v3',
    generatedAt:new Date().toISOString(),
    capabilities:{liveLta:hasLtaKey(),railRealtime:hasLtaKey(),busRealtime:hasLtaKey(),expandedEnvironment:true,airQuality:true},
    rail,traffic,weather,
    links:{rail:'/api/rail?station=EW4',nearby:'/api/rail?lat={lat}&lon={lon}'}
  });
}
