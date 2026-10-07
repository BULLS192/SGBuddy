import { allBusRoutes, allBusStops, busArrivals, haversine } from './lta.js';
import { findStations, getRailSchedule, normalizeLine, railDepartures } from './rail.js';
import { geocodeSingapore, hasOneMapCredentials, walkingRoute, drivingRoute } from './onemap.js';
import { getJourneyWeather } from './weather.js';
import { findKnownPlace, searchPlaces } from './places.js';
import { findCatalogPlace, searchCatalogPlaces } from './catalog-db.js';

const WALK_SPEED_METRES_PER_MINUTE=75;
const WALK_ROUTE_FACTOR=1.22;
const TRANSFER_PENALTY_MINUTES=5;
const MAX_NEARBY_BUS_STOPS=4;

let railGraphCache={timestamp:null,value:null};
let busIndexCache={at:0,value:null};

const finite=value=>Number.isFinite(Number(value));
const rounded=value=>Math.max(0,Math.round(Number(value)||0));
const walkMinutes=metres=>Math.max(0,Math.ceil((Math.max(0,Number(metres)||0)*WALK_ROUTE_FACTOR)/WALK_SPEED_METRES_PER_MINUTE));

function gtfsSeconds(value){
  const parts=String(value||'').split(':').map(Number);
  if(parts.length!==3||parts.some(n=>!Number.isFinite(n))) return null;
  return parts[0]*3600+parts[1]*60+parts[2];
}

function stationSummary(station){
  return {
    type:'station',
    id:station.id,
    code:station.codes?.[0]||station.id,
    codes:station.codes||[],
    label:station.name,
    name:station.name,
    lat:station.lat,
    lon:station.lon,
  };
}

function busStopSummary(stop){
  return {
    type:'bus-stop',
    code:String(stop.BusStopCode),
    label:stop.Description||`Bus Stop ${stop.BusStopCode}`,
    name:stop.Description||`Bus Stop ${stop.BusStopCode}`,
    roadName:stop.RoadName||null,
    lat:Number(stop.Latitude),
    lon:Number(stop.Longitude),
  };
}

function coordinateSummary(lat,lon,label='Current location'){
  return {type:'coordinate',label,lat:Number(lat),lon:Number(lon)};
}
function mapPoint(place,label){
  if(!finite(place?.lat)||!finite(place?.lon)) return null;
  return {lat:Number(place.lat),lon:Number(place.lon),label:label||place.label||place.name||place.code||''};
}
function pathPoints(...places){return places.map(place=>mapPoint(place)).filter(Boolean)}

async function resolvePlace({query,lat,lon,label},index,busStops){
  if(finite(lat)&&finite(lon)) return coordinateSummary(lat,lon,label||'Current location');
  const q=String(query||'').trim();
  if(!q) return null;

  if(/^\d{5}$/.test(q)){
    const stop=busStops.find(s=>String(s.BusStopCode)===q);
    if(stop) return busStopSummary(stop);
  }

  const station=findStations(index,{query:q,limit:1})[0];
  if(station) return stationSummary(station);

  const databasePlace=await findCatalogPlace(q).catch(()=>null);
  if(databasePlace) return databasePlace;

  const known=findKnownPlace(q);
  if(known) return known;

  const geo=await geocodeSingapore(q);
  if(geo) return geo;
  return {type:'unresolved',label:q,query:q};
}

function nearestBusStops(busStops,place,limit=MAX_NEARBY_BUS_STOPS){
  if(place?.type==='bus-stop'){
    const row=busStops.find(s=>String(s.BusStopCode)===String(place.code));
    return row?[{stop:row,distance:0}]:[];
  }
  if(!finite(place?.lat)||!finite(place?.lon)) return [];
  return busStops
    .filter(s=>finite(s.Latitude)&&finite(s.Longitude))
    .map(stop=>({stop,distance:haversine(Number(place.lat),Number(place.lon),Number(stop.Latitude),Number(stop.Longitude))}))
    .sort((a,b)=>a.distance-b.distance)
    .slice(0,limit);
}

function nearestStation(index,place){
  if(place?.type==='station'){
    const station=index.stations.find(s=>s.id===place.id)||index.stations.find(s=>s.codes?.includes(place.code));
    return station?{station,distance:0}:null;
  }
  if(!finite(place?.lat)||!finite(place?.lon)) return null;
  const station=findStations(index,{lat:Number(place.lat),lon:Number(place.lon),limit:1})[0];
  return station?{station,distance:Number(station.distance)||0}:null;
}

function nearbyStations(index,place,limit=4,maxDistance=6000){
  if(place?.type==='station'){
    const exact=nearestStation(index,place);
    return exact?[exact]:[];
  }
  if(!finite(place?.lat)||!finite(place?.lon)) return [];
  return index.stations
    .filter(s=>finite(s.lat)&&finite(s.lon))
    .map(station=>({station,distance:haversine(Number(place.lat),Number(place.lon),Number(station.lat),Number(station.lon))}))
    .filter(x=>x.distance<=maxDistance)
    .sort((a,b)=>a.distance-b.distance)
    .slice(0,limit);
}

function buildRailGraph(index){
  if(railGraphCache.value&&railGraphCache.timestamp===index.timestamp) return railGraphCache.value;
  const adjacency=new Map();
  const stationById=new Map(index.stations.map(s=>[s.id,s]));
  const bestEdge=new Map();

  for(const [tripId,items] of index.stopTimesByTripId||[]){
    const trip=index.tripById.get(tripId);
    if(!trip) continue;
    const route=index.routeById.get(trip.routeId)||{
      line:normalizeLine(trip.routeId),
      shortName:trip.routeId,
      longName:trip.routeId,
    };

    const compressed=[];
    for(const item of items){
      const station=index.stationByStopId.get(item.stopId);
      if(!station) continue;
      const last=compressed[compressed.length-1];
      if(last?.station.id===station.id){
        last.arrival=item.arrival||last.arrival;
        last.departure=item.departure||last.departure;
        continue;
      }
      compressed.push({station,arrival:item.arrival,departure:item.departure});
    }

    for(let i=0;i<compressed.length-1;i++){
      const a=compressed[i],b=compressed[i+1];
      const aTime=gtfsSeconds(a.departure||a.arrival);
      const bTime=gtfsSeconds(b.arrival||b.departure);
      let minutes=aTime!=null&&bTime!=null?Math.ceil(Math.max(60,bTime-aTime)/60):3;
      if(minutes>20) minutes=3;
      const edge={
        from:a.station.id,
        to:b.station.id,
        line:route.line||route.shortName||'MRT',
        lineName:route.longName||route.shortName||route.line||'Train',
        headsign:trip.headsign||'',
        minutes:Math.max(1,minutes),
      };
      const key=`${edge.from}|${edge.to}|${edge.line}`;
      const prior=bestEdge.get(key);
      if(!prior||edge.minutes<prior.minutes) bestEdge.set(key,edge);
    }
  }

  for(const edge of bestEdge.values()){
    if(!adjacency.has(edge.from)) adjacency.set(edge.from,[]);
    adjacency.get(edge.from).push(edge);
  }

  const value={adjacency,stationById};
  railGraphCache={timestamp:index.timestamp,value};
  return value;
}

function railPath(index,originStation,destinationStation){
  if(!originStation||!destinationStation) return null;
  if(originStation.id===destinationStation.id) return {cost:0,rideMinutes:0,transferMinutes:0,transfers:0,segments:[]};

  const {adjacency,stationById}=buildRailGraph(index);
  const startKey=`${originStation.id}|`;
  const dist=new Map([[startKey,0]]);
  const prev=new Map();
  const queue=[{key:startKey,node:originStation.id,line:'',cost:0}];
  let bestDestination=null;

  while(queue.length){
    queue.sort((a,b)=>a.cost-b.cost);
    const current=queue.shift();
    if(current.cost!==dist.get(current.key)) continue;
    if(current.node===destinationStation.id){bestDestination=current;break}

    for(const edge of adjacency.get(current.node)||[]){
      const transfer=current.line&&current.line!==edge.line?TRANSFER_PENALTY_MINUTES:0;
      const nextCost=current.cost+edge.minutes+transfer;
      const nextKey=`${edge.to}|${edge.line}`;
      if(nextCost>=(dist.get(nextKey)??Infinity)) continue;
      dist.set(nextKey,nextCost);
      prev.set(nextKey,{parentKey:current.key,edge,transfer});
      queue.push({key:nextKey,node:edge.to,line:edge.line,cost:nextCost});
    }
  }

  if(!bestDestination) return null;
  const legs=[];
  let key=bestDestination.key;
  while(key!==startKey){
    const step=prev.get(key);
    if(!step) break;
    legs.push(step);
    key=step.parentKey;
  }
  legs.reverse();

  const segments=[];
  let transferMinutes=0;
  let rideMinutes=0;
  for(const step of legs){
    const edge=step.edge;
    transferMinutes+=step.transfer;
    rideMinutes+=edge.minutes;
    const from=stationById.get(edge.from),to=stationById.get(edge.to);
    const prior=segments[segments.length-1];
    if(prior&&prior.line===edge.line){
      prior.to=stationSummary(to);
      prior.path.push(stationSummary(to));
      prior.minutes+=edge.minutes;
      prior.stops+=1;
      if(!prior.headsign&&edge.headsign) prior.headsign=edge.headsign;
    }else{
      segments.push({
        type:'rail',
        line:edge.line,
        lineName:edge.lineName,
        headsign:edge.headsign,
        from:stationSummary(from),
        to:stationSummary(to),
        path:[stationSummary(from),stationSummary(to)],
        minutes:edge.minutes,
        stops:1,
        transferBefore:step.transfer,
      });
    }
  }

  return {
    cost:bestDestination.cost,
    rideMinutes,
    transferMinutes,
    transfers:Math.max(0,segments.length-1),
    segments,
  };
}

async function nextRailWait(originStation,firstSegment){
  if(!originStation||!firstSegment) return {minutes:0,realtime:false,platform:null};
  try{
    const query=originStation.codes?.[0]||originStation.name;
    const board=await railDepartures({query,limit:1});
    const station=board.stations?.[0];
    const sameLine=(station?.departures||[]).filter(d=>normalizeLine(d.line)===normalizeLine(firstSegment.line));
    const departure=(sameLine.length?sameLine:station?.departures||[]).sort((a,b)=>a.minutes-b.minutes)[0];
    if(!departure) return {minutes:4,realtime:false,platform:null};
    return {
      minutes:Math.max(0,Number(departure.minutes)||0),
      realtime:departure.realtime===true,
      platform:departure.platform||null,
      destination:departure.destination||null,
    };
  }catch{
    return {minutes:4,realtime:false,platform:null};
  }
}

function buildBusRouteIndex(rows){
  if(busIndexCache.value&&Date.now()-busIndexCache.at<86400000) return busIndexCache.value;
  const groups=new Map();
  for(const row of rows){
    const service=String(row.ServiceNo||'').trim();
    const direction=Number(row.Direction||1);
    const stopCode=String(row.BusStopCode||'').trim();
    const sequence=Number(row.StopSequence||0);
    if(!service||!/^\d{5}$/.test(stopCode)||!Number.isFinite(sequence)) continue;
    const key=`${service}|${direction}`;
    if(!groups.has(key)) groups.set(key,{service,direction,stops:[]});
    groups.get(key).stops.push({
      code:stopCode,
      sequence,
      distanceKm:finite(row.Distance)?Number(row.Distance):null,
    });
  }
  const byOrigin=new Map();
  for(const group of groups.values()){
    group.stops.sort((a,b)=>a.sequence-b.sequence);
    const positions=new Map(group.stops.map((s,i)=>[s.code,i]));
    group.positions=positions;
    for(let i=0;i<group.stops.length;i++){
      const code=group.stops[i].code;
      if(!byOrigin.has(code)) byOrigin.set(code,[]);
      byOrigin.get(code).push({group,index:i});
    }
  }
  const value={groups,byOrigin};
  busIndexCache={at:Date.now(),value};
  return value;
}

function estimateBusRideMinutes(group,startIndex,endIndex){
  const stops=Math.max(1,endIndex-startIndex);
  const start=group.stops[startIndex],end=group.stops[endIndex];
  const km=start.distanceKm!=null&&end.distanceKm!=null?Math.max(0,end.distanceKm-start.distanceKm):null;
  const byStops=stops*1.75;
  const byDistance=km!=null?km*2.6:0;
  return Math.max(3,Math.ceil(Math.max(byStops,byDistance)));
}

async function directBusOptions(origin,destination,busStops,busRoutes,liveCache=new Map()){
  const originStops=nearestBusStops(busStops,origin);
  const destinationStops=nearestBusStops(busStops,destination);
  if(!originStops.length||!destinationStops.length) return [];

  const destinationByCode=new Map(destinationStops.map(x=>[String(x.stop.BusStopCode),x]));
  const busStopByCode=new Map(busStops.map(stop=>[String(stop.BusStopCode),stop]));
  const index=buildBusRouteIndex(busRoutes);
  const rough=[];

  for(const originEntry of originStops){
    const originCode=String(originEntry.stop.BusStopCode);
    for(const routeEntry of index.byOrigin.get(originCode)||[]){
      const {group,index:startIndex}=routeEntry;
      for(const [destinationCode,destinationEntry] of destinationByCode){
        const endIndex=group.positions.get(destinationCode);
        if(endIndex==null||endIndex<=startIndex) continue;
        const rideMinutes=estimateBusRideMinutes(group,startIndex,endIndex);
        rough.push({
          group,startIndex,endIndex,
          originEntry,destinationEntry,
          rideMinutes,
          preWalk:walkMinutes(originEntry.distance),
          postWalk:walkMinutes(destinationEntry.distance),
          roughTotal:walkMinutes(originEntry.distance)+rideMinutes+walkMinutes(destinationEntry.distance)+6,
        });
      }
    }
  }

  rough.sort((a,b)=>a.roughTotal-b.roughTotal);
  const shortlist=rough.slice(0,8);
  for(const item of shortlist){
    const code=String(item.originEntry.stop.BusStopCode);
    if(liveCache.has(code)) continue;
    try{liveCache.set(code,await busArrivals(code))}catch{liveCache.set(code,[])}
  }

  const options=[];
  const seen=new Set();
  for(const item of shortlist){
    const service=item.group.service;
    const key=`${service}|${item.group.direction}|${item.originEntry.stop.BusStopCode}|${item.destinationEntry.stop.BusStopCode}`;
    if(seen.has(key)) continue;
    seen.add(key);
    const live=(liveCache.get(String(item.originEntry.stop.BusStopCode))||[]).find(s=>String(s.no)===service);
    const wait=live?.eta?.find(x=>x!=null);
    if(wait==null) continue;
    const total=item.preWalk+wait+item.rideMinutes+item.postWalk;
    const board=busStopSummary(item.originEntry.stop);
    const alight=busStopSummary(item.destinationEntry.stop);
    const busPath=item.group.stops.slice(item.startIndex,item.endIndex+1).map(s=>busStopByCode.get(s.code)).filter(Boolean).map(busStopSummary).map(mapPoint).filter(Boolean);
    const steps=[];
    if(item.preWalk) steps.push({type:'walk',minutes:item.preWalk,distanceM:rounded(item.originEntry.distance),path:pathPoints(origin,board),text:`Walk to ${board.label}`});
    steps.push({
      type:'bus',
      service,
      direction:item.group.direction,
      minutes:item.rideMinutes,
      waitMinutes:wait,
      from:board,
      to:alight,
      path:busPath,
      stops:item.endIndex-item.startIndex,
      text:`Take bus ${service} from ${board.label} to ${alight.label}`,
    });
    if(item.postWalk) steps.push({type:'walk',minutes:item.postWalk,distanceM:rounded(item.destinationEntry.distance),path:pathPoints(alight,destination),text:`Walk to ${destination.label}`});
    options.push({
      id:`bus-${service}-${board.code}-${alight.code}`,
      mode:'bus',
      title:`Bus ${service}`,
      totalMinutes:total,
      waitMinutes:wait,
      walkMinutes:item.preWalk+item.postWalk,
      rideMinutes:item.rideMinutes,
      transfers:0,
      realtime:true,
      steps,
    });
  }
  return options.sort((a,b)=>a.totalMinutes-b.totalMinutes).slice(0,2);
}

async function railOption(index,origin,destination){
  const originAccess=nearestStation(index,origin);
  const destinationAccess=nearestStation(index,destination);
  if(!originAccess||!destinationAccess) return null;
  const path=railPath(index,originAccess.station,destinationAccess.station);
  if(!path) return null;

  if(path.segments.length===0){
    const walk=walkMinutes((originAccess.distance||0)+(destinationAccess.distance||0));
    return {
      id:`rail-${originAccess.station.id}`,
      mode:'walk',
      title:originAccess.station.name,
      totalMinutes:walk,
      waitMinutes:0,
      walkMinutes:walk,
      rideMinutes:0,
      transfers:0,
      realtime:false,
      steps:walk?[{type:'walk',minutes:walk,path:pathPoints(origin,destination),text:`Walk via ${originAccess.station.name}`}]:[],
    };
  }

  const wait=await nextRailWait(originAccess.station,path.segments[0]);
  const preWalk=walkMinutes(originAccess.distance);
  const postWalk=walkMinutes(destinationAccess.distance);
  const total=preWalk+wait.minutes+path.rideMinutes+path.transferMinutes+postWalk;
  const steps=[];
  if(preWalk) steps.push({type:'walk',minutes:preWalk,distanceM:rounded(originAccess.distance),path:pathPoints(origin,stationSummary(originAccess.station)),text:`Walk to ${originAccess.station.name} MRT/LRT`});

  for(const [i,segment] of path.segments.entries()){
    if(i>0) steps.push({type:'transfer',minutes:TRANSFER_PENALTY_MINUTES,text:`Transfer to ${segment.line}`});
    steps.push({
      ...segment,
      platform:i===0?wait.platform:null,
      waitMinutes:i===0?wait.minutes:null,
      text:`Take ${segment.line} from ${segment.from.name} to ${segment.to.name}`,
    });
  }
  if(postWalk) steps.push({type:'walk',minutes:postWalk,distanceM:rounded(destinationAccess.distance),path:pathPoints(stationSummary(destinationAccess.station),destination),text:`Walk to ${destination.label}`});

  return {
    id:`rail-${originAccess.station.id}-${destinationAccess.station.id}`,
    mode:'rail',
    title:path.transfers?`${path.segments[0].line} + ${path.transfers} transfer${path.transfers===1?'':'s'}`:path.segments[0].line,
    totalMinutes:total,
    waitMinutes:wait.minutes,
    walkMinutes:preWalk+postWalk,
    rideMinutes:path.rideMinutes,
    transferMinutes:path.transferMinutes,
    transfers:path.transfers,
    realtime:wait.realtime,
    originStation:stationSummary(originAccess.station),
    destinationStation:stationSummary(destinationAccess.station),
    steps,
  };
}

function mergeMixedOption(first,second,{title,id}){
  const steps=[...(first.steps||[]),...(second.steps||[])];
  return {
    id,
    mode:'mixed',
    title,
    totalMinutes:(first.totalMinutes||0)+(second.totalMinutes||0),
    waitMinutes:(first.waitMinutes||0)+(second.waitMinutes||0),
    walkMinutes:(first.walkMinutes||0)+(second.walkMinutes||0),
    rideMinutes:(first.rideMinutes||0)+(second.rideMinutes||0),
    transferMinutes:(first.transferMinutes||0)+(second.transferMinutes||0),
    transfers:(first.transfers||0)+(second.transfers||0)+1,
    realtime:Boolean(first.realtime||second.realtime),
    steps,
  };
}

async function mixedBusRailOptions(index,origin,destination,busStops,busRoutes,liveCache){
  const options=[];
  const destinationRail=nearestStation(index,destination);
  const originRail=nearestStation(index,origin);

  if(destinationRail){
    for(const access of nearbyStations(index,origin,4,6500)){
      if((access.distance||0)<350) continue;
      const station=stationSummary(access.station);
      const [feeders,rail]=await Promise.all([
        directBusOptions(origin,station,busStops,busRoutes,liveCache),
        railOption(index,station,destination),
      ]);
      const feeder=feeders[0];
      if(!feeder||!rail||rail.rideMinutes<=0) continue;
      const busService=feeder.steps?.find(s=>s.type==='bus')?.service||'bus';
      const railLine=rail.steps?.find(s=>s.type==='rail')?.line||'MRT';
      options.push(mergeMixedOption(feeder,rail,{
        id:`mixed-bus-rail-${busService}-${access.station.id}`,
        title:`Bus ${busService} → ${railLine}`,
      }));
    }
  }

  if(originRail){
    for(const access of nearbyStations(index,destination,4,6500)){
      if((access.distance||0)<350) continue;
      const station=stationSummary(access.station);
      const [rail,feeders]=await Promise.all([
        railOption(index,origin,station),
        directBusOptions(station,destination,busStops,busRoutes,liveCache),
      ]);
      const feeder=feeders[0];
      if(!rail||rail.rideMinutes<=0||!feeder) continue;
      const railLine=rail.steps?.find(s=>s.type==='rail')?.line||'MRT';
      const busService=feeder.steps?.find(s=>s.type==='bus')?.service||'bus';
      options.push(mergeMixedOption(rail,feeder,{
        id:`mixed-rail-bus-${access.station.id}-${busService}`,
        title:`${railLine} → Bus ${busService}`,
      }));
    }
  }

  const seen=new Set();
  return options
    .sort((a,b)=>a.totalMinutes-b.totalMinutes)
    .filter(option=>{
      const signature=(option.steps||[]).filter(s=>s.type==='bus'||s.type==='rail').map(s=>s.type==='bus'?'B'+s.service:'R'+s.line).join('>');
      if(seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .slice(0,3);
}

function weatherRank(option,weather){
  const walk=Math.max(0,Number(option.walkMinutes)||0);
  const text=`${weather?.origin?.forecast||''} ${weather?.destination?.forecast||''}`;
  const severe=/thundery|heavy rain|heavy showers/i.test(text);
  const rainy=Boolean(weather?.rain);
  const factor=severe?0.9:rainy?0.55:0;
  const penalty=rainy?Math.min(15,Math.ceil(walk*factor)):0;
  return {
    ...option,
    weatherPenaltyMinutes:penalty,
    weatherAware:penalty>0,
    rankingMinutes:(Number(option.totalMinutes)||0)+penalty,
  };
}

function timingForOption(option,generatedAt,arriveBy){
  const now=generatedAt instanceof Date?generatedAt:new Date(generatedAt);
  const requested=arriveBy?new Date(arriveBy):null;
  const total=Math.max(0,Number(option.totalMinutes)||0);
  if(!requested||!Number.isFinite(requested.getTime())){
    return {
      ...option,
      timingMode:'leave-now',
      arrivalAt:new Date(now.getTime()+total*60000).toISOString(),
      leaveAt:now.toISOString(),
      bufferMinutes:0,
      leaveNow:true,
      lateByMinutes:0,
    };
  }

  const buffer=5+Math.min(6,(Number(option.transfers)||0)*2)+(option.weatherAware?4:0);
  const idealLeave=new Date(requested.getTime()-(total+buffer)*60000);
  const leaveNow=idealLeave.getTime()<=now.getTime();
  const actualLeave=leaveNow?now:idealLeave;
  const arrival=new Date(actualLeave.getTime()+total*60000);
  const lateBy=Math.max(0,Math.ceil((arrival.getTime()-requested.getTime())/60000));
  const spare=Math.max(0,Math.floor((requested.getTime()-arrival.getTime())/60000));
  return {
    ...option,
    timingMode:'arrive-by',
    requestedArrivalAt:requested.toISOString(),
    leaveAt:idealLeave.toISOString(),
    arrivalAt:arrival.toISOString(),
    bufferMinutes:buffer,
    leaveNow,
    lateByMinutes:lateBy,
    spareMinutes:spare,
  };
}

export async function searchJourneyPlaces(query,{limit=8}={}){
  const q=String(query||'').trim();
  if(!q)return {ok:true,query:q,suggestions:[],geocodingConfigured:hasOneMapCredentials(),catalogSource:'none'};
  const index=await getRailSchedule();
  const [busStops,databaseSuggestions]=await Promise.all([
    allBusStops(),
    searchCatalogPlaces(q,{limit}).catch(()=>[]),
  ]);
  const localSuggestions=searchPlaces(q,{index,busStops,limit});
  const seen=new Set(),suggestions=[];
  for(const item of [...databaseSuggestions,...localSuggestions]){
    const key=String(item.value||item.label||'').toLowerCase();
    if(!key||seen.has(key))continue;
    seen.add(key);
    suggestions.push(item);
    if(suggestions.length>=limit)break;
  }
  return {
    ok:true,
    query:q,
    suggestions,
    geocodingConfigured:hasOneMapCredentials(),
    catalogSource:databaseSuggestions.length?'supabase+live':'local-fallback',
  };
}
function publicPlace(place){
  if(!place) return null;
  const {type,label,name,address,postal,code,codes,lat,lon}=place;
  return {type,label,name,address,postal,code,codes,lat,lon};
}

async function refineWalking(option){
  if(!hasOneMapCredentials()||!option?.steps?.length)return option;
  const steps=[];
  for(const step of option.steps){
    if(step.type!=='walk'||!step.path?.[0]||!step.path?.[step.path.length-1]){steps.push(step);continue}
    const routed=await walkingRoute(step.path[0],step.path[step.path.length-1]).catch(()=>null);
    steps.push(routed?{...step,minutes:routed.minutes,distanceM:routed.distanceM,routingSource:routed.source}:step);
  }
  const walkMinutesTotal=steps.filter(s=>s.type==='walk').reduce((n,s)=>n+(Number(s.minutes)||0),0);
  const ride=steps.filter(s=>s.type==='bus'||s.type==='rail').reduce((n,s)=>n+(Number(s.minutes)||0),0);
  const waits=Number(option.waitMinutes)||0,transfers=steps.filter(s=>s.type==='transfer').reduce((n,s)=>n+(Number(s.minutes)||0),0);
  return {...option,steps,walkMinutes:walkMinutesTotal,rideMinutes:ride,transferMinutes:transfers,totalMinutes:walkMinutesTotal+ride+waits+transfers,walkingSource:'OneMap'};
}

export async function planJourney({from,to,originLat,originLon,arriveBy,includeWeather=true}={}){
  const index=await getRailSchedule();
  const [busStops,busRoutes]=await Promise.all([allBusStops(),allBusRoutes()]);
  const origin=await resolvePlace({
    query:from,
    lat:originLat,
    lon:originLon,
    label:finite(originLat)&&finite(originLon)?'Current location':undefined,
  },index,busStops);
  const destination=await resolvePlace({query:to},index,busStops);

  if(!origin){
    return {
      ok:false,
      code:'ORIGIN_REQUIRED',
      error:'Use your location or enter an MRT/LRT station, bus stop code, or Singapore address.',
      geocodingConfigured:hasOneMapCredentials(),
    };
  }
  if(!destination||destination.type==='unresolved'){
    return {
      ok:false,
      code:'UNRESOLVED_DESTINATION',
      error:hasOneMapCredentials()
        ? `SGBuddy could not resolve “${String(to||'').trim()}”. Try a more specific Singapore place, MRT/LRT station, or 5-digit bus stop code.`
        : 'SGBuddy can search common Singapore destinations, MRT/LRT stations and bus stops. A full arbitrary street address still needs OneMap credentials.',
      geocodingConfigured:hasOneMapCredentials(),
      destination:publicPlace(destination),
    };
  }

  const options=[];
  const liveBusCache=new Map();
  const [rail,buses,mixed,weather]=await Promise.all([
    railOption(index,origin,destination),
    directBusOptions(origin,destination,busStops,busRoutes,liveBusCache),
    mixedBusRailOptions(index,origin,destination,busStops,busRoutes,liveBusCache),
    includeWeather?getJourneyWeather(origin,destination):Promise.resolve({source:'skipped',rain:false,origin:null,destination:null}),
  ]);
  if(rail&&rail.totalMinutes>0) options.push(rail);
  options.push(...buses,...mixed);
  const refined=hasOneMapCredentials()?await Promise.all(options.map(refineWalking)):options;

  const seenOptions=new Set();
  const unique=refined.filter(option=>{
    const signature=(option.steps||[]).filter(s=>s.type==='bus'||s.type==='rail').map(s=>s.type==='bus'?'B'+s.service:'R'+s.line).join('>');
    if(!signature||seenOptions.has(signature)) return false;
    seenOptions.add(signature);
    return true;
  });

  const generatedAt=new Date();
  const requestedArrival=arriveBy&&Number.isFinite(new Date(arriveBy).getTime())?new Date(arriveBy):null;
  const withArrival=unique
    .map(option=>weatherRank(option,weather))
    .sort((a,b)=>(a.rankingMinutes-b.rankingMinutes)||(a.totalMinutes-b.totalMinutes))
    .slice(0,3)
    .map((option,i)=>({
      ...timingForOption(option,generatedAt,requestedArrival),
      rank:i+1,
      recommended:i===0,
    }));

  return {
    ok:true,
    source:'live',
    generatedAt:generatedAt.toISOString(),
    origin:publicPlace(origin),
    destination:publicPlace(destination),
    geocodingConfigured:hasOneMapCredentials(),
    timingMode:requestedArrival?'arrive-by':'leave-now',
    requestedArrivalAt:requestedArrival?.toISOString()||null,
    weather,
    weatherAware:Boolean(weather?.rain),
    options:withArrival,
    recommendedId:withArrival[0]?.id||null,
    limitations:[
      hasOneMapCredentials()?'Walking legs use OneMap walking-route distance/time where available.':'Walking time uses a routing allowance until OneMap credentials are configured.',
      'Wave 4.2 ranks rail, direct-bus, bus-to-rail, and rail-to-bus routes with a walking-exposure penalty when rain is forecast near the trip endpoints.',
      ...(hasOneMapCredentials()?[]:['Common Singapore destinations are native now; arbitrary street-address search still needs OneMap credentials.']),
    ],
  };
}

export async function compareJourneyModes({from,to,originLat,originLon}={}){
  const publicPlan=await planJourney({from,to,originLat,originLon,includeWeather:false});
  if(!publicPlan?.ok||!publicPlan.origin||!publicPlan.destination)return publicPlan;
  const transit=publicPlan.options?.[0]||null;
  const a=publicPlan.origin,b=publicPlan.destination;
  const straight=finite(a.lat)&&finite(a.lon)&&finite(b.lat)&&finite(b.lon)
    ? haversine(Number(a.lat),Number(a.lon),Number(b.lat),Number(b.lon))
    : null;
  const routed=await drivingRoute(a,b).catch(()=>null);
  const roadDistance=routed?.distanceM??(straight==null?null:Math.round(straight*1.27));
  const roadMinutes=routed?.minutes??(roadDistance==null?null:Math.max(6,Math.ceil((roadDistance/1000)/28*60)));
  const drive=roadMinutes==null?null:{
    mode:'drive',label:'Drive',minutes:roadMinutes+5,movementMinutes:roadMinutes,parkingAllowanceMinutes:5,
    distanceM:roadDistance,routed:Boolean(routed),source:routed?.source||'SGBuddy road-time estimate',
    note:routed?'Road route plus a 5-minute parking/walk allowance. This is not live parking availability.':'Estimated from distance plus a 5-minute parking/walk allowance; not live traffic or parking data.'
  };
  const rideshare=roadMinutes==null?null:{
    mode:'rideshare',label:'Taxi / rideshare',minutesLow:roadMinutes+4,minutesHigh:roadMinutes+8,movementMinutes:roadMinutes,
    pickupLowMinutes:4,pickupHighMinutes:8,distanceM:roadDistance,routed:Boolean(routed),source:routed?.source||'SGBuddy road-time estimate',
    note:'Includes a 4–8 minute pickup allowance. No live Grab/Gojek/CDG fare, surge or vehicle availability is implied.'
  };
  const publicTransport=transit?{
    mode:'public',label:'Public transport',minutes:transit.totalMinutes,title:transit.title,routeMode:transit.mode,
    walkMinutes:transit.walkMinutes||0,transfers:transit.transfers||0,realtime:Boolean(transit.realtime),
    source:transit.realtime?'Live bus + scheduled rail':'Scheduled/public-transport estimate',
    note:'Uses SGBuddy bus/rail routing; rail timing is scheduled unless specifically marked realtime.'
  }:null;
  const candidates=[
    publicTransport&&{mode:'public',minutes:publicTransport.minutes},
    drive&&{mode:'drive',minutes:drive.minutes},
    rideshare&&{mode:'rideshare',minutes:(rideshare.minutesLow+rideshare.minutesHigh)/2},
  ].filter(Boolean).sort((x,y)=>x.minutes-y.minutes);
  return {
    ok:true,generatedAt:new Date().toISOString(),origin:publicPlan.origin,destination:publicPlan.destination,
    publicTransport,drive,rideshare,fastestEstimate:candidates[0]?.mode||null,roadRoutingConfigured:hasOneMapCredentials(),
    disclaimer:'Mode comparison is for planning. Driving/rideshare does not include a live provider quote, surge pricing, parking availability, or guaranteed traffic conditions.'
  };
}
