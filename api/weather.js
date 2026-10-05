import { getWeather } from '../lib/weather.js';

export { getWeather };

export default async function handler(req,res){
  const lat=Number(req.query?.lat);
  const lon=Number(req.query?.lon);
  const weather=await getWeather({
    lat:Number.isFinite(lat)?lat:undefined,
    lon:Number.isFinite(lon)?lon:undefined,
  });
  res.status(200).json(weather);
}
