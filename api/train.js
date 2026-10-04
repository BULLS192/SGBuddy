import { hasLtaKey, lta } from '../lib/lta.js';
import { demoTrain } from '../lib/demo.js';

export async function getTrain(){
  if(!hasLtaKey()) return demoTrain;
  const p=await lta('/TrainServiceAlerts');
  const raw=p.value;
  const records=Array.isArray(raw) ? raw : raw ? [raw] : [];
  const disrupted=records.filter(x=>Number(x.Status)===2);
  const disruptions=[];
  for(const record of disrupted){
    const messages=Array.isArray(record.Message) ? record.Message : record.Message ? [record.Message] : [];
    const segments=Array.isArray(record.AffectedSegments) ? record.AffectedSegments : [];
    if(segments.length){
      for(const segment of segments) disruptions.push({
        line:segment.Line,
        direction:segment.Direction,
        stations:segment.Stations,
        message:messages[0]?.Content||'Service disruption'
      });
    }else{
      disruptions.push({line:record.Line,direction:record.Direction,stations:record.Stations,message:messages[0]?.Content||record.Message?.Content||'Service disruption'});
    }
  }
  return {source:'live',status:disrupted.length?2:1,summary:disrupted.length?`${disruptions.length||disrupted.length} disruption${(disruptions.length||disrupted.length)>1?'s':''}`:'Normal service',disruptions};
}
export default async function handler(req,res){try{res.status(200).json(await getTrain())}catch(e){res.status(200).json({...demoTrain,source:'demo-fallback',error:e.message})}}
