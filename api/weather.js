import { demoWeather } from './lib/demo.js';
export async function getWeather(){
  try{
    const headers={accept:'application/json'}; if(process.env.DATA_GOV_SG_API_KEY) headers['x-api-key']=process.env.DATA_GOV_SG_API_KEY;
    const r=await fetch('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',{headers,next:{revalidate:300}});
    if(!r.ok) throw new Error(`weather returned ${r.status}`);
    const p=await r.json();
    const data=p.data||p; const rows=data.items||data.records||[]; const latest=rows[0]||data;
    const forecasts=latest.forecasts||latest.area_metadata||[];
    const first=forecasts[0]||{};
    return {source:'live',summary:first.forecast||latest.general?.forecast||'Forecast available',area:first.area||'Singapore',forecast:first.forecast||latest.general?.forecast||'See forecast'};
  }catch(e){return {...demoWeather,source:'demo-fallback',error:e.message};}
}
export default async function handler(req,res){res.status(200).json(await getWeather())}
