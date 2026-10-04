import { getTrain } from './train.js';
import { getTraffic } from './traffic.js';
import { getWeather } from './weather.js';
export default async function handler(req,res){
  const [rail,traffic,weather]=await Promise.all([getTrain(),getTraffic(),getWeather()]);
  res.status(200).json({schema:'sg-companion.snapshot.v1',generatedAt:new Date().toISOString(),rail,traffic,weather});
}
