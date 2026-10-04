import { hasLtaKey, lta } from './lib/lta.js';
import { demoTrain } from './lib/demo.js';
export async function getTrain(){
  if(!hasLtaKey()) return demoTrain;
  const p=await lta('/TrainServiceAlerts');
  const rows=p.value||[];
  const disrupted=rows.filter(x=>Number(x.Status)===2);
  return {source:'live',status:disrupted.length?2:1,summary:disrupted.length?`${disrupted.length} disruption${disrupted.length>1?'s':''}`:'Normal service',disruptions:disrupted.map(x=>({line:x.Line,direction:x.Direction,stations:x.Stations,message:x.Message?.[0]?.Content||x.Message?.Content||'Service disruption'}))};
}
export default async function handler(req,res){try{res.status(200).json(await getTrain())}catch(e){res.status(200).json({...demoTrain,source:'demo-fallback',error:e.message})}}
