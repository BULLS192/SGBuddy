const BASE = 'https://datamall2.mytransport.sg/ltaodataservice';
export const hasLtaKey = () => Boolean(process.env.LTA_ACCOUNT_KEY);
export async function lta(path, params = {}, cacheSeconds = 0) {
  if (!hasLtaKey()) throw Object.assign(new Error('LTA_ACCOUNT_KEY is not configured'), { code:'NO_LTA_KEY' });
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v)); });
  const res = await fetch(url, {
    headers: { AccountKey: process.env.LTA_ACCOUNT_KEY, accept:'application/json' },
    ...(cacheSeconds ? { next:{ revalidate: cacheSeconds } } : { cache:'no-store' })
  });
  if (!res.ok) throw new Error(`LTA ${path} returned ${res.status}`);
  return res.json();
}
export const minutesUntil = iso => {
  if (!iso) return null;
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 60000));
};
export const haversine = (a,b,c,d) => {
  const R=6371000, p=x=>x*Math.PI/180;
  const dLat=p(c-a), dLon=p(d-b);
  const q=Math.sin(dLat/2)**2+Math.cos(p(a))*Math.cos(p(c))*Math.sin(dLon/2)**2;
  return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
};
let stopCache = { at:0, data:null };
export async function allBusStops() {
  if (stopCache.data && Date.now()-stopCache.at < 86400000) return stopCache.data;
  const rows=[];
  for (let skip=0; skip<10000; skip+=500) {
    const payload = await lta('/BusStops', { '$skip': skip }, 86400);
    const batch = payload.value || [];
    rows.push(...batch);
    if (batch.length < 500) break;
  }
  stopCache={at:Date.now(),data:rows};
  return rows;
}
let routeCache = { at:0, data:null };
export async function allBusRoutes() {
  if (routeCache.data && Date.now()-routeCache.at < 86400000) return routeCache.data;
  const rows=[];
  for (let skip=0; skip<30000; skip+=500) {
    const payload = await lta('/BusRoutes', { '$skip': skip }, 86400);
    const batch = payload.value || [];
    rows.push(...batch);
    if (batch.length < 500) break;
  }
  routeCache={at:Date.now(),data:rows};
  return rows;
}

export async function busArrivals(code) {
  const p=await lta('/v3/BusArrival',{BusStopCode:code});
  return (p.Services||[]).map(s=>({
    no:s.ServiceNo, operator:s.Operator,
    eta:[s.NextBus,s.NextBus2,s.NextBus3].map(b=>minutesUntil(b?.EstimatedArrival)),
    load:[s.NextBus?.Load,s.NextBus2?.Load,s.NextBus3?.Load],
    monitored:[s.NextBus?.Monitored,s.NextBus2?.Monitored,s.NextBus3?.Monitored]
  }));
}
