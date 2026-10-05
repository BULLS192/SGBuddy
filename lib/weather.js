import { demoWeather } from './demo.js';
import { haversine } from './lta.js';

const RAIN_RE=/\b(rain|showers?|thunder|storm|drizzle)\b/i;

async function fetchWeatherFeed(){
  const headers={accept:'application/json'};
  if(process.env.DATA_GOV_SG_API_KEY) headers['x-api-key']=process.env.DATA_GOV_SG_API_KEY;
  const response=await fetch('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',{
    headers,
    next:{revalidate:300}
  });
  if(!response.ok) throw new Error(`weather returned ${response.status}`);
  const payload=await response.json();
  const data=payload.data||payload;
  const rows=data.items||data.records||[];
  const latest=rows[0]||data;
  return {
    latest,
    metadata:Array.isArray(data.area_metadata)?data.area_metadata:[],
    forecasts:Array.isArray(latest?.forecasts)?latest.forecasts:[],
  };
}

function nearestArea(metadata,lat,lon){
  if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))) return null;
  return metadata
    .map(item=>{
      const p=item.label_location||{};
      const latitude=Number(p.latitude),longitude=Number(p.longitude);
      return Number.isFinite(latitude)&&Number.isFinite(longitude)
        ? {...item,distance:haversine(Number(lat),Number(lon),latitude,longitude)}
        : null;
    })
    .filter(Boolean)
    .sort((a,b)=>a.distance-b.distance)[0]||null;
}

function forecastFor(feed,place){
  const area=nearestArea(feed.metadata,place?.lat,place?.lon);
  const row=area?feed.forecasts.find(x=>x.area===area.name):feed.forecasts[0];
  const forecast=row?.forecast||feed.latest?.general?.forecast||'Forecast available';
  return {
    area:row?.area||area?.name||'Singapore',
    forecast,
    rain:RAIN_RE.test(forecast),
    distanceM:area?.distance!=null?Math.round(area.distance):null,
  };
}

export async function getWeather({lat,lon}={}){
  try{
    const feed=await fetchWeatherFeed();
    const point=forecastFor(feed,{lat,lon});
    return {
      source:'live',
      summary:point.forecast,
      area:point.area,
      forecast:point.forecast,
      rain:point.rain,
      validPeriod:feed.latest?.valid_period||null,
      updatedAt:feed.latest?.update_timestamp||feed.latest?.timestamp||null,
    };
  }catch(error){
    return {...demoWeather,source:'demo-fallback',rain:RAIN_RE.test(demoWeather?.forecast||demoWeather?.summary||''),error:error.message};
  }
}

export async function getJourneyWeather(origin,destination){
  try{
    const feed=await fetchWeatherFeed();
    const originForecast=forecastFor(feed,origin);
    const destinationForecast=forecastFor(feed,destination);
    return {
      source:'live',
      origin:originForecast,
      destination:destinationForecast,
      rain:Boolean(originForecast.rain||destinationForecast.rain),
      validPeriod:feed.latest?.valid_period||null,
      updatedAt:feed.latest?.update_timestamp||feed.latest?.timestamp||null,
    };
  }catch(error){
    return {
      source:'unavailable',
      origin:null,
      destination:null,
      rain:false,
      error:error.message,
    };
  }
}
