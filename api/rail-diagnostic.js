import { getRailSchedule, getRailRealtime } from './lib/rail.js';

const plainLong=v=>{
  if(v==null)return null;
  if(typeof v==='object') return {keys:Object.keys(v),string:String(v),low:v.low??null,high:v.high??null,unsigned:v.unsigned??null};
  return {type:typeof v,value:v};
};

export default async function handler(req,res){
  try{
    const index=await getRailSchedule();
    const rt=await getRailRealtime();
    const station=index.stations.find(s=>(s.codes||[]).includes('EW4'));
    const stopSet=new Set(station?.stopIds||[]);
    const entities=(rt.feed.entity||[]).filter(e=>e.tripUpdate).slice(0,8);
    const samples=entities.map(e=>({
      id:e.id,
      trip:e.tripUpdate?.trip||null,
      timestamp:plainLong(e.tripUpdate?.timestamp),
      stops:(e.tripUpdate?.stopTimeUpdate||[]).slice(0,8).map(s=>({
        stopId:s.stopId||null,
        stopSequence:s.stopSequence??null,
        scheduleRelationship:s.scheduleRelationship??null,
        arrival:{time:plainLong(s.arrival?.time),delay:s.arrival?.delay??null},
        departure:{time:plainLong(s.departure?.time),delay:s.departure?.delay??null},
        assignedStopId:s.stopTimeProperties?.assignedStopId||null
      }))
    }));
    const matchCount=(rt.feed.entity||[]).filter(e=>(e.tripUpdate?.stopTimeUpdate||[]).some(s=>stopSet.has(s.stopId)||stopSet.has(s.stopTimeProperties?.assignedStopId))).length;
    res.status(200).json({
      station:station?{id:station.id,name:station.name,codes:station.codes,stopIds:station.stopIds,children:(station.children||[]).slice(0,12).map(c=>({stop_id:c.stop_id,stop_code:c.stop_code,platform_code:c.platform_code,parent_station:c.parent_station}))}:null,
      realtimeEntityCount:(rt.feed.entity||[]).length,
      exactStopIdMatchEntities:matchCount,
      samples
    });
  }catch(error){res.status(200).json({error:error.message,stack:String(error.stack||'').split('\n').slice(0,4)})}
}
