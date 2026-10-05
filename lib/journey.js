import { allBusRoutes, allBusStops, busArrivals, haversine } from './lta.js';
import { findStations, getRailSchedule, normalizeLine, railDepartures } from './rail.js';
import { geocodeSingapore, hasOneMapCredentials } from './onemap.js';

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
    const steps=[];
    if(item.preWalk) steps.push({type:'walk',minutes:item.preWalk,distanceM:rounded(item.originEntry.distance),text:`Walk to ${board.label}`});
    steps.push({
      type:'bus',
      service,
      direction:item.group.direction,
      minutes:item.rideMinutes,
      waitMinutes:wait,
      from:board,
      to:alight,
      stops:item.endIndex-item.startIndex,
      text:`Take bus ${service} from ${board.label} to ${alight.label}`,
    });
    if(item.postWalk) steps.push({type:'walk',minutes:item.postWalk,distanceM:rounded(item.destinationEntry.distance),text:`Walk to ${destination.label}`});
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
      steps:walk?[{type:'walk',minutes:walk,text:`Walk via ${originAccess.station.name}`}]:[],
    };
  }

  const wait=await nextRailWait(originAccess.station,path.segments[0]);
  const preWalk=walkMinutes(originAccess.distance);
  const postWalk=walkMinutes(destinationAccess.distance);
  const total=preWalk+wait.minutes+path.rideMinutes+path.transferMinutes+postWalk;
  const steps=[];
  if(preWalk) steps.push({type:'walk',minutes:preWalk,distanceM:rounded(originAccess.distance),text:`Walk to ${originAccess.station.name} MRT/LRT`});

  for(const [i,segment] of path.segments.entries()){
    if(i>0) steps.push({type:'transfer',minutes:TRANSFER_PENALTY_MINUTES,text:`Transfer to ${segment.line}`});
    steps.push({
      ...segment,
      platform:i===0?wait.platform:null,
      waitMinutes:i===0?wait.minutes:null,
      text:`Take ${segment.line} from ${segment.from.name} to ${segment.to.name}`,
    });
  }
  if(postWalk) steps.push({type:'walk',minutes:postWalk,distanceM:rounded(destinationAccess.distance),text:`Walk to ${destination.label}`});

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

function publicPlace(place){
  if(!place) return null;
  const {type,label,name,address,postal,code,codes,lat,lon}=place;
  return {type,label,name,address,postal,code,codes,lat,lon};
}

export async function planJourney({from,to,originLat,originLon}={}){
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
        : 'Native address search needs OneMap credentials. MRT/LRT station names/codes and 5-digit bus stop codes already work without them.',
      geocodingConfigured:hasOneMapCredentials(),
      destination:publicPlace(destination),
    };
  }

  const options=[];
  const liveBusCache=new Map();
  const [rail,buses,mixed]=await Promise.all([
    railOption(index,origin,destination),
    directBusOptions(origin,destination,busStops,busRoutes,liveBusCache),
    mixedBusRailOptions(index,origin,destination,busStops,busRoutes,liveBusCache),
  ]);
  if(rail&&rail.totalMinutes>0) options.push(rail);
  options.push(...buses,...mixed);
  const seenOptions=new Set();
  const ranked=options
    .sort((a,b)=>a.totalMinutes-b.totalMinutes)
    .filter(option=>{
      const signature=(option.steps||[]).filter(s=>s.type==='bus'||s.type==='rail').map(s=>s.type==='bus'?'B'+s.service:'R'+s.line).join('>');
      if(!signature||seenOptions.has(signature)) return false;
      seenOptions.add(signature);
      return true;
    });
  options.length=0;
  options.push(...ranked);

  const generatedAt=new Date();
  const withArrival=options.slice(0,3).map((option,i)=>({
    ...option,
    rank:i+1,
    recommended:i===0,
    arrivalAt:new Date(generatedAt.getTime()+option.totalMinutes*60000).toISOString(),
  }));

  return {
    ok:true,
    source:'live',
    generatedAt:generatedAt.toISOString(),
    origin:publicPlace(origin),
    destination:publicPlace(destination),
    geocodingConfigured:hasOneMapCredentials(),
    options:withArrival,
    recommendedId:withArrival[0]?.id||null,
    limitations:[
      'Walking time is estimated from straight-line distance with a routing allowance.',
      'Wave 4.1 compares rail, direct-bus, bus-to-rail, and rail-to-bus routes. Two-sided bus → rail → bus and multi-bus transfers remain a later expansion.',
      ...(hasOneMapCredentials()?[]:['Street-address search will become native after OneMap credentials are configured.']),
    ],
  };
}
