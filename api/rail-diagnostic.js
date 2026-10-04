import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { lta } from './lib/lta.js';
import { getRailSchedule } from './lib/rail.js';

export default async function handler(req,res){
  try{
    const index=await getRailSchedule();
    const station=index.stations.find(s=>(s.codes||[]).includes('EW4'));
    const meta=await lta('/GTFSRealtimeTrainTripUpdates');
    const item=Array.isArray(meta.value)?meta.value[0]:null;
    if(!item?.link) return res.status(200).json({error:'No realtime link',metaShape:{keys:Object.keys(meta||{}),valueType:Array.isArray(meta.value)?'array':typeof meta.value,valueLength:Array.isArray(meta.value)?meta.value.length:null}});
    const r=await fetch(item.link,{headers:{accept:'*/*'},cache:'no-store'});
    const ab=await r.arrayBuffer();
    const buffer=Buffer.from(ab);
    let feed=null,decodeError=null;
    try{feed=GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer))}catch(e){decodeError=e.message}
    res.status(200).json({
      station:station?{id:station.id,name:station.name,codes:station.codes,stopIds:station.stopIds}:null,
      meta:{timestamp:item.timestamp||null,linkHost:new URL(item.link).host,linkPath:new URL(item.link).pathname},
      file:{status:r.status,contentType:r.headers.get('content-type'),contentLength:r.headers.get('content-length'),byteLength:buffer.byteLength,first16Hex:buffer.subarray(0,16).toString('hex')},
      decode:{error:decodeError,feedKeys:feed?Object.keys(feed):[],header:feed?.header||null,entityCount:feed?.entity?.length??null,firstEntityKeys:feed?.entity?.[0]?Object.keys(feed.entity[0]):[]}
    });
  }catch(error){res.status(200).json({error:error.message,stack:String(error.stack||'').split('\n').slice(0,5)})}
}
