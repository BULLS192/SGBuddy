import { demoWeather } from './demo.js';
import { haversine } from './lta.js';
import { readEnvironmentCache, writeEnvironmentCache, cacheSignal, cachedSignal } from './weather-cache.js';

const BASE='https://api-open.data.gov.sg/v2/real-time/api';
const RAIN_RE=/\b(rain|showers?|thunder|storm|drizzle)\b/i;
const REGION_POINTS={
  west:{lat:1.3574,lon:103.7000},
  north:{lat:1.4180,lon:103.8200},
  central:{lat:1.3574,lon:103.8200},
  south:{lat:1.2959,lon:103.8200},
  east:{lat:1.3574,lon:103.9400},
};

function headers(){
  const out={accept:'application/json'};
  if(process.env.DATA_GOV_SG_API_KEY) out['x-api-key']=process.env.DATA_GOV_SG_API_KEY;
  return out;
}
async function fetchJson(path,ttl=60){
  const response=await fetch(BASE+path,{headers:headers(),next:{revalidate:ttl}});
  if(!response.ok) throw new Error(path+' returned '+response.status);
  const payload=await response.json();
  if(Number(payload?.code||0)!==0) throw new Error(payload?.errorMsg||payload?.errMsg||path+' failed');
  return payload;
}
async function settled(path,ttl){
  try{return {ok:true,value:await fetchJson(path,ttl)}}
  catch(firstError){
    await new Promise(resolve=>setTimeout(resolve,120));
    try{return {ok:true,value:await fetchJson(path,ttl)}}
    catch(secondError){return {ok:false,error:secondError.message||firstError.message}}
  }
}
function latestRow(payload){
  const data=payload?.data||payload||{};
  const rows=data.readings||data.items||data.records||[];
  return Array.isArray(rows)&&rows.length?rows[rows.length-1]:data;
}
function nearestArea(metadata,lat,lon){
  if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))) return null;
  return (metadata||[]).map(item=>{
    const p=item.label_location||item.labelLocation||item.location||{};
    const latitude=Number(p.latitude),longitude=Number(p.longitude);
    return Number.isFinite(latitude)&&Number.isFinite(longitude)
      ? {...item,distance:haversine(Number(lat),Number(lon),latitude,longitude)}
      : null;
  }).filter(Boolean).sort((a,b)=>a.distance-b.distance)[0]||null;
}
function forecastFor(payload,lat,lon){
  const data=payload?.data||payload||{};
  const rows=data.items||data.records||[];
  const latest=Array.isArray(rows)&&rows.length?rows[rows.length-1]:data;
  const metadata=data.area_metadata||data.areaMetadata||[];
  const forecasts=latest?.forecasts||[];
  const area=nearestArea(metadata,lat,lon);
  const row=area?forecasts.find(x=>x.area===area.name):forecasts[0];
  const forecast=row?.forecast||latest?.general?.forecast?.text||latest?.general?.forecast||'Forecast available';
  return {
    area:row?.area||area?.name||'Singapore',
    forecast:String(forecast),
    rain:RAIN_RE.test(String(forecast)),
    distanceM:area?.distance!=null?Math.round(area.distance):null,
    validPeriod:latest?.valid_period||latest?.validPeriod||latest?.general?.validPeriod||null,
    updatedAt:latest?.update_timestamp||latest?.updatedTimestamp||latest?.timestamp||null,
  };
}
function stationReading(payload,lat,lon){
  if(!payload) return null;
  const data=payload.data||payload;
  const stations=Array.isArray(data.stations)?data.stations:[];
  const row=latestRow(payload);
  const values=Array.isArray(row?.data)?row.data:[];
  const valueById=new Map(values.map(x=>[String(x.stationId||x.station_id||x.id),Number(x.value)]));
  const candidates=stations.map(s=>{
    const id=String(s.id||s.stationId||s.deviceId||'');
    const p=s.location||{};
    const latitude=Number(p.latitude),longitude=Number(p.longitude),value=valueById.get(id);
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(value)) return null;
    const distance=Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))
      ? haversine(Number(lat),Number(lon),latitude,longitude)
      : 0;
    return {stationId:id,station:s.name||id,value,distanceM:Math.round(distance),timestamp:row?.timestamp||null,unit:data.readingUnit||null};
  }).filter(Boolean).sort((a,b)=>a.distanceM-b.distanceM);
  return candidates[0]||null;
}
function regionName(lat,lon){
  if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))) return 'central';
  return Object.entries(REGION_POINTS).map(([name,p])=>({
    name,d:haversine(Number(lat),Number(lon),p.lat,p.lon)
  })).sort((a,b)=>a.d-b.d)[0]?.name||'central';
}
function findReadingMap(readings,needles){
  if(!readings||typeof readings!=='object') return null;
  for(const [key,value] of Object.entries(readings)){
    const norm=key.toLowerCase().replace(/[^a-z0-9]/g,'');
    if(needles.some(n=>norm.includes(n))&&value&&typeof value==='object') return value;
  }
  return null;
}
function regionalReading(payload,kind,lat,lon){
  if(!payload) return null;
  const row=latestRow(payload);
  const readings=row?.readings||row?.data||row||{};
  const map=kind==='psi'
    ? findReadingMap(readings,['psitwentyfourhourly','psi24'])
    : findReadingMap(readings,['pm25onehourly','pm251hour','pm25']);
  if(!map) return null;
  const region=regionName(lat,lon);
  const numericEntries=Object.entries(map).filter(([,v])=>Number.isFinite(Number(v))).map(([k,v])=>[k,Number(v)]);
  if(!numericEntries.length) return null;
  const selected=Number.isFinite(Number(map[region]))?Number(map[region]):numericEntries.find(([k])=>k==='national')?.[1]??numericEntries[0][1];
  const overall=Math.max(...numericEntries.filter(([k])=>k!=='national').map(([,v])=>v),selected);
  return {
    region,
    value:selected,
    overall,
    regions:Object.fromEntries(numericEntries),
    updatedAt:row?.updatedTimestamp||row?.update_timestamp||row?.timestamp||null,
  };
}
function psiCategory(value){
  const n=Number(value);
  if(!Number.isFinite(n)) return null;
  if(n<=50) return 'Good';
  if(n<=100) return 'Moderate';
  if(n<=200) return 'Unhealthy';
  if(n<=300) return 'Very Unhealthy';
  return 'Hazardous';
}
function dayForecast(payload,lat,lon){
  if(!payload) return null;
  const row=latestRow(payload);
  const general=row?.general||{};
  const region=regionName(lat,lon);
  return {
    region,
    forecast:general?.forecast?.text||general?.forecast||null,
    temperatureLowC:Number.isFinite(Number(general?.temperature?.low))?Number(general.temperature.low):null,
    temperatureHighC:Number.isFinite(Number(general?.temperature?.high))?Number(general.temperature.high):null,
    humidityLowPct:Number.isFinite(Number(general?.relativeHumidity?.low))?Number(general.relativeHumidity.low):null,
    humidityHighPct:Number.isFinite(Number(general?.relativeHumidity?.high))?Number(general.relativeHumidity.high):null,
    windDirection:general?.wind?.direction||null,
    windLowKmh:Number.isFinite(Number(general?.wind?.speed?.low))?Number(general.wind.speed.low):null,
    windHighKmh:Number.isFinite(Number(general?.wind?.speed?.high))?Number(general.wind.speed.high):null,
    validPeriod:general?.validPeriod||null,
    periods:(row?.periods||[]).map(p=>({
      period:p?.timePeriod?.text||null,
      forecast:p?.regions?.[region]?.text||null,
      code:p?.regions?.[region]?.code||null,
    })).filter(x=>x.forecast),
    updatedAt:row?.updatedTimestamp||row?.timestamp||null,
  };
}
function pm25Band(value){
  const n=Number(value);
  if(!Number.isFinite(n))return null;
  if(n<=55)return {band:1,label:'Normal'};
  if(n<=150)return {band:2,label:'Elevated'};
  if(n<=250)return {band:3,label:'High'};
  return {band:4,label:'Very High'};
}
function travelRisk({forecast,temperature,rainfall,wind,psi,pm25}){
  let score=0;
  const signals=[];
  const text=String(forecast?.forecast||'');
  if(/thunder|heavy rain|heavy showers|storm/i.test(text)){score+=3;signals.push('Thunder/heavy-rain risk');}
  else if(forecast?.rain){score+=2;signals.push('Rain expected nearby');}
  if(Number(rainfall?.value)>0){score+=1;signals.push('Rain detected at nearby station');}
  if(Number(temperature?.value)>=34){score+=1;signals.push('High heat');}
  if(Number(wind?.value)>=20){score+=1;signals.push('Strong wind');}
  if(Number(psi?.overall)>100){score+=3;signals.push('24h PSI is Unhealthy or worse');}
  else if(Number(psi?.overall)>50){score+=1;signals.push('24h PSI is Moderate');}
  const pm=pm25Band(pm25?.overall);
  if(pm?.band===2){score+=2;signals.push('1h PM2.5 is Elevated');}
  else if(pm?.band===3){score+=4;signals.push('1h PM2.5 is High');}
  else if(pm?.band===4){score+=5;signals.push('1h PM2.5 is Very High');}
  const airKnown=Boolean(psi||pm25);
  let level=score>=4?'high':score>=2?'watch':'low';
  if(!airKnown&&score===0)level='unknown';
  const message=level==='high'
    ? 'Conditions warrant extra care; reduce exposed outdoor travel where practical.'
    : level==='watch'
      ? 'Conditions are manageable, but one or more signals may affect the easiest trip.'
      : level==='unknown'
        ? 'Weather signals look manageable, but current air-quality data is incomplete.'
        : 'No major weather or air-quality travel risk is indicated by the latest feeds.';
  return {level,score,message,signals,airQualityKnown:airKnown};
}

async function fetchAllWeather(lat,lon){
  const previous=await readEnvironmentCache()||{};
  const [two,temp,humidity,rainfall,windSpeed,windDirection,psi,pm25,day]=await Promise.all([
    settled('/two-hr-forecast',300),
    settled('/air-temperature',60),
    settled('/relative-humidity',60),
    settled('/rainfall',60),
    settled('/wind-speed',60),
    settled('/wind-direction',60),
    settled('/psi',60),
    settled('/pm25',60),
    settled('/twenty-four-hr-forecast',300),
  ]);

  const staleSignals=[];
  const ages={};
  function resolve(key,result,parser,maxAgeMinutes,fallback){
    if(result.ok){
      const value=parser(result.value);
      if(value!=null)return {value,fromCache:false};
    }
    const cached=cachedSignal(previous,key,maxAgeMinutes);
    if(cached){
      staleSignals.push(key);
      ages[key]=cached.ageMinutes;
      return {value:cached.value,fromCache:true};
    }
    return {value:fallback??null,fromCache:false};
  }

  const forecastR=resolve('forecast',two,p=>forecastFor(p,lat,lon),90,{area:'Singapore',forecast:'Weather feed partially unavailable',rain:false,validPeriod:null,updatedAt:null});
  const tempR=resolve('temperature',temp,p=>stationReading(p,lat,lon),45,null);
  const humidityR=resolve('humidity',humidity,p=>stationReading(p,lat,lon),45,null);
  const rainfallR=resolve('rainfall',rainfall,p=>stationReading(p,lat,lon),20,null);
  const windR=resolve('wind',windSpeed,p=>stationReading(p,lat,lon),45,null);
  const directionR=resolve('windDirection',windDirection,p=>stationReading(p,lat,lon),45,null);
  const psiR=resolve('psi',psi,p=>regionalReading(p,'psi',lat,lon),120,null);
  const pm25R=resolve('pm25',pm25,p=>regionalReading(p,'pm25',lat,lon),90,null);
  const dayR=resolve('day24',day,p=>dayForecast(p,lat,lon),360,null);

  const forecast=forecastR.value;
  const temperature=tempR.value;
  const humidityValue=humidityR.value;
  const rainfallValue=rainfallR.value;
  const wind=windR.value;
  const direction=directionR.value;
  const psiValue=psiR.value;
  const pm25Value=pm25R.value;
  const day24=dayR.value;

  let nextCache={...previous};
  if(two.ok)nextCache=cacheSignal(nextCache,'forecast',forecast);
  if(temp.ok&&temperature)nextCache=cacheSignal(nextCache,'temperature',temperature);
  if(humidity.ok&&humidityValue)nextCache=cacheSignal(nextCache,'humidity',humidityValue);
  if(rainfall.ok&&rainfallValue)nextCache=cacheSignal(nextCache,'rainfall',rainfallValue);
  if(windSpeed.ok&&wind)nextCache=cacheSignal(nextCache,'wind',wind);
  if(windDirection.ok&&direction)nextCache=cacheSignal(nextCache,'windDirection',direction);
  if(psi.ok&&psiValue)nextCache=cacheSignal(nextCache,'psi',psiValue);
  if(pm25.ok&&pm25Value)nextCache=cacheSignal(nextCache,'pm25',pm25Value);
  if(day.ok&&day24)nextCache=cacheSignal(nextCache,'day24',day24);
  writeEnvironmentCache(nextCache).catch(()=>{});

  const missing=[
    ['2h forecast',forecast],['temperature',temperature],['humidity',humidityValue],['rainfall',rainfallValue],
    ['wind speed',wind],['wind direction',direction],['24h PSI',psiValue],['1h PM2.5',pm25Value],['24h forecast',day24],
  ].filter(([,v])=>v==null).map(([name])=>name);

  const risk=travelRisk({forecast,temperature,rainfall:rainfallValue,wind,psi:psiValue,pm25:pm25Value});
  const pmBand=pm25Band(pm25Value?.value);
  const source=staleSignals.length?'live-with-last-good':'live';
  const qualityStatus=missing.length===9?'unavailable':missing.length||staleSignals.length?'partial':'complete';

  return {
    source,
    provider:'NEA / data.gov.sg',
    summary:forecast?.forecast||'Weather unavailable',
    area:forecast?.area||'Singapore',
    forecast:forecast?.forecast||'Weather unavailable',
    rain:Boolean(forecast?.rain||Number(rainfallValue?.value)>0),
    validPeriod:forecast?.validPeriod||null,
    updatedAt:forecast?.updatedAt||temperature?.timestamp||new Date().toISOString(),
    conditions:{
      temperatureC:temperature?.value??null,
      humidityPct:humidityValue?.value??null,
      rainfallMm:rainfallValue?.value??null,
      windSpeedKnots:wind?.value??null,
      windDirectionDeg:direction?.value??null,
      stations:{temperature:temperature?.station||null,humidity:humidityValue?.station||null,rainfall:rainfallValue?.station||null,wind:wind?.station||null},
    },
    airQuality:{
      region:psiValue?.region||pm25Value?.region||regionName(lat,lon),
      psi24h:psiValue?{value:psiValue.value,overall:psiValue.overall,category:psiCategory(psiValue.overall),regions:psiValue.regions,updatedAt:psiValue.updatedAt}:null,
      pm25OneHour:pm25Value?{value:pm25Value.value,overall:pm25Value.overall,unit:'µg/m³',band:pmBand?.band||null,category:pmBand?.label||null,regions:pm25Value.regions,updatedAt:pm25Value.updatedAt}:null,
      interpretation:psiValue
        ? '24-hour PSI: '+psiCategory(psiValue.overall)+'.'+(pmBand?' Current 1-hour PM2.5: '+pmBand.label+' (Band '+pmBand.band+').':'')
        : pmBand
          ? '24-hour PSI is temporarily unavailable. Current 1-hour PM2.5: '+pmBand.label+' (Band '+pmBand.band+').'
          : 'Air-quality readings are temporarily unavailable.',
      terminology:'1-hour PM2.5 is a concentration reading, not a 1-hour PSI.',
    },
    day24,
    travelRisk:risk,
    dataQuality:{
      status:qualityStatus,
      unavailableSignals:missing,
      staleSignals,
      signalAgesMinutes:ages,
      lastGoodFallbackUsed:staleSignals.length>0,
      checkedAt:new Date().toISOString(),
    },
  };
}
export async function getWeather({lat,lon}={}){
  try{return await fetchAllWeather(lat,lon)}
  catch(error){
    return {
      ...demoWeather,
      source:'demo-fallback',
      provider:'SGBuddy fallback',
      rain:RAIN_RE.test(demoWeather?.forecast||demoWeather?.summary||''),
      conditions:null,
      airQuality:null,
      day24:null,
      travelRisk:{level:'unknown',score:0,message:'Live environmental feeds are unavailable.',signals:[]},
      dataQuality:{status:'unavailable',unavailableSignals:['weather'],checkedAt:new Date().toISOString()},
      error:error.message,
    };
  }
}

export async function getJourneyWeather(origin,destination){
  try{
    const [originWeather,destinationWeather]=await Promise.all([
      fetchAllWeather(origin?.lat,origin?.lon),
      fetchAllWeather(destination?.lat,destination?.lon),
    ]);
    return {
      source:'live',
      origin:{area:originWeather.area,forecast:originWeather.forecast,rain:originWeather.rain},
      destination:{area:destinationWeather.area,forecast:destinationWeather.forecast,rain:destinationWeather.rain},
      rain:Boolean(originWeather.rain||destinationWeather.rain),
      airQuality:destinationWeather.airQuality,
      travelRisk:destinationWeather.travelRisk,
      validPeriod:destinationWeather.validPeriod,
      updatedAt:destinationWeather.updatedAt,
    };
  }catch(error){
    return {source:'unavailable',origin:null,destination:null,rain:false,error:error.message};
  }
}
