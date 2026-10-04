import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { hasLtaKey, lta, haversine } from './lta.js';

const MAX_DATASET_BYTES = 64 * 1024 * 1024;
const STATION_CODE_RE = /(NS|EW|CG|NE|CC|CE|DT|TE|BP|STC|SE|SW|PTC|PE|PW)\d+[A-Z]?/gi;

let scheduleCache = { expiresAt: 0, value: null };
let schedulePromise = null;
let realtimeCache = { expiresAt: 0, value: null };
let realtimePromise = null;

const asNumber = value => {
  if (value === null || value === undefined) return undefined;
  const n = Number(value?.toString?.() ?? value);
  return Number.isFinite(n) ? n : undefined;
};

const codesFrom = (...values) => {
  const set = new Set();
  for (const value of values) {
    for (const match of String(value || '').toUpperCase().matchAll(STATION_CODE_RE)) set.add(match[0]);
  }
  return [...set];
};

export const normalizeLine = raw => {
  const x = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (x.startsWith('EWL') || x === 'EW') return 'EWL';
  if (x.startsWith('CGL') || x === 'CG') return 'CGL';
  if (x.startsWith('NSL') || x === 'NS') return 'NSL';
  if (x.startsWith('NEL') || x === 'NE') return 'NEL';
  if (x.startsWith('CCL') || x === 'CC') return 'CCL';
  if (x.startsWith('CEL') || x === 'CE') return 'CEL';
  if (x.startsWith('DTL') || x === 'DT') return 'DTL';
  if (x.startsWith('TEL') || x === 'TE') return 'TEL';
  if (x.startsWith('BPL') || x === 'BP') return 'BPL';
  if (x.startsWith('SLRT') || /^(STC|SE|SW)/.test(x)) return 'SLRT';
  if (x.startsWith('PLRT') || /^(PTC|PE|PW)/.test(x)) return 'PLRT';
  return String(raw || '').toUpperCase();
};

async function getDatasetLink(endpoint) {
  const payload = await lta(`/${endpoint}`);
  const item = Array.isArray(payload.value) ? payload.value[0] : null;
  if (!item?.link) throw new Error(`${endpoint} returned no download link`);
  const url = new URL(item.link);
  if (url.protocol !== 'https:') throw new Error(`${endpoint} returned a non-HTTPS download link`);
  return { link: item.link, timestamp: item.timestamp || null };
}

async function downloadBuffer(url) {
  const response = await fetch(url, { headers: { accept: '*/*' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`Rail dataset download returned ${response.status}`);
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_DATASET_BYTES) throw new Error('Rail dataset is larger than the configured safety limit');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_DATASET_BYTES) throw new Error('Rail dataset is larger than the configured safety limit');
  return buffer;
}

function csvFromZip(zip, name) {
  const entry = zip.getEntry(name) || zip.getEntries().find(e => e.entryName.endsWith(`/${name}`));
  if (!entry) return [];
  return parse(entry.getData().toString('utf8').replace(/^\uFEFF/, ''), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
}

function buildScheduleIndex(buffer) {
  const zip = new AdmZip(buffer);
  const stops = csvFromZip(zip, 'stops.txt');
  const routes = csvFromZip(zip, 'routes.txt');
  const trips = csvFromZip(zip, 'trips.txt');

  const stopById = new Map(stops.map(s => [s.stop_id, s]));
  const routeById = new Map(routes.map(r => [r.route_id, {
    id: r.route_id,
    shortName: r.route_short_name || r.route_long_name || r.route_id,
    longName: r.route_long_name || r.route_short_name || r.route_id,
    line: normalizeLine(r.route_short_name || r.route_id),
    color: /^[0-9A-Fa-f]{6}$/.test(r.route_color || '') ? `#${r.route_color}` : null,
  }]));
  const tripById = new Map(trips.map(t => [t.trip_id, {
    routeId: t.route_id,
    headsign: t.trip_headsign || '',
    directionId: t.direction_id || '',
  }]));

  const stationMap = new Map();
  for (const stop of stops) {
    const rootId = stop.parent_station || stop.stop_id;
    const parent = stopById.get(rootId) || stop;
    if (!stationMap.has(rootId)) {
      stationMap.set(rootId, {
        id: rootId,
        name: parent.stop_name || stop.stop_name || rootId,
        codes: new Set(codesFrom(parent.stop_code, parent.stop_id, parent.stop_name)),
        stopIds: new Set([rootId]),
        children: [],
        latValues: [],
        lonValues: [],
      });
    }
    const station = stationMap.get(rootId);
    station.stopIds.add(stop.stop_id);
    codesFrom(stop.stop_code, stop.stop_id, stop.stop_name).forEach(c => station.codes.add(c));
    station.children.push(stop);
    const lat = Number(stop.stop_lat || parent.stop_lat);
    const lon = Number(stop.stop_lon || parent.stop_lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      station.latValues.push(lat);
      station.lonValues.push(lon);
    }
  }

  const stations = [...stationMap.values()].map(s => ({
    id: s.id,
    name: s.name,
    codes: [...s.codes],
    stopIds: [...s.stopIds],
    children: s.children,
    lat: s.latValues.length ? s.latValues.reduce((a,b)=>a+b,0)/s.latValues.length : null,
    lon: s.lonValues.length ? s.lonValues.reduce((a,b)=>a+b,0)/s.lonValues.length : null,
  })).filter(s => s.codes.length || s.children.some(c => c.location_type === '1'));

  const stationByStopId = new Map();
  for (const station of stations) for (const id of station.stopIds) stationByStopId.set(id, station);

  return { stations, stationByStopId, stopById, routeById, tripById };
}

export async function getRailSchedule() {
  if (!hasLtaKey()) throw new Error('LTA_ACCOUNT_KEY is not configured');
  if (scheduleCache.value && Date.now() < scheduleCache.expiresAt) return scheduleCache.value;
  if (schedulePromise) return schedulePromise;
  schedulePromise = (async () => {
    const { link, timestamp } = await getDatasetLink('GTFSScheduleTrain');
    const buffer = await downloadBuffer(link);
    const value = { ...buildScheduleIndex(buffer), timestamp };
    scheduleCache = { value, expiresAt: Date.now() + 6 * 60 * 60 * 1000 };
    return value;
  })();
  try { return await schedulePromise; } finally { schedulePromise = null; }
}

export async function getRailRealtime() {
  if (!hasLtaKey()) throw new Error('LTA_ACCOUNT_KEY is not configured');
  if (realtimeCache.value && Date.now() < realtimeCache.expiresAt) return realtimeCache.value;
  if (realtimePromise) return realtimePromise;
  realtimePromise = (async () => {
    const { link, timestamp } = await getDatasetLink('GTFSRealtimeTrainTripUpdates');
    const buffer = await downloadBuffer(link);
    let feed;
    try {
      feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    } catch {
      throw new Error('Could not decode LTA GTFS-Realtime train feed');
    }
    const value = { feed, timestamp };
    realtimeCache = { value, expiresAt: Date.now() + 15 * 1000 };
    return value;
  })();
  try { return await realtimePromise; } finally { realtimePromise = null; }
}

function stationForStopId(index, stopId) {
  if (!stopId) return null;
  if (index.stationByStopId.has(stopId)) return index.stationByStopId.get(stopId);
  const code = codesFrom(stopId)[0];
  if (!code) return null;
  return index.stations.find(s => s.codes.includes(code)) || null;
}

function destinationFor(index, update, staticTrip) {
  const updates = update.stopTimeUpdate || [];
  const final = updates[updates.length - 1];
  const station = stationForStopId(index, final?.stopId);
  if (station?.name) return station.name;
  return staticTrip?.headsign || (station?.codes?.[0] || 'Train destination');
}

function predictedSeconds(stopUpdate) {
  return asNumber(stopUpdate?.departure?.time) ?? asNumber(stopUpdate?.arrival?.time);
}

function departureForStation(index, station, entity, nowSeconds) {
  const update = entity.tripUpdate;
  if (!update) return null;
  const stopSet = new Set(station.stopIds);
  const stopUpdate = (update.stopTimeUpdate || []).find(s => stopSet.has(s.stopId) || codesFrom(s.stopId).some(c => station.codes.includes(c)));
  if (!stopUpdate) return null;
  const epoch = predictedSeconds(stopUpdate);
  if (!epoch) return null;
  const minutes = Math.ceil((epoch - nowSeconds) / 60);
  if (minutes < 0 || minutes > 90) return null;
  const staticTrip = index.tripById.get(update.trip?.tripId || '');
  const routeId = update.trip?.routeId || staticTrip?.routeId || '';
  const route = index.routeById.get(routeId) || { line: normalizeLine(routeId), shortName: routeId, longName: routeId, color: null };
  const stopMeta = index.stopById.get(stopUpdate.stopId);
  const cancelled = [3, 7].includes(Number(update.trip?.scheduleRelationship));
  if (cancelled) return null;
  return {
    line: route.line || route.shortName || 'MRT',
    lineName: route.longName || route.shortName || route.line || 'Train',
    color: route.color,
    destination: destinationFor(index, update, staticTrip),
    platform: stopMeta?.platform_code || null,
    minutes,
    predictedAt: new Date(epoch * 1000).toISOString(),
    tripId: update.trip?.tripId || entity.id,
  };
}

export function findStations(index, { lat, lon, query, limit = 2 } = {}) {
  if (query) {
    const q = String(query).trim().toUpperCase();
    const exactCode = index.stations.filter(s => s.codes.some(c => c.toUpperCase() === q));
    const byName = index.stations.filter(s => s.name.toUpperCase().includes(q) || s.codes.some(c => c.toUpperCase().includes(q)));
    return [...new Map([...exactCode, ...byName].map(s => [s.id, s])).values()].slice(0, limit);
  }
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return index.stations.filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lon))
      .map(s => ({ ...s, distance: haversine(lat, lon, s.lat, s.lon) }))
      .sort((a,b) => a.distance - b.distance).slice(0, limit);
  }
  return [];
}

export async function railDepartures(options = {}) {
  const index = await getRailSchedule();
  const { feed, timestamp } = await getRailRealtime();
  const stations = findStations(index, options);
  const nowSeconds = Date.now() / 1000;
  const out = stations.map(station => {
    const departures = (feed.entity || [])
      .map(entity => departureForStation(index, station, entity, nowSeconds))
      .filter(Boolean)
      .sort((a,b) => a.minutes - b.minutes)
      .filter((d, i, arr) => arr.findIndex(x => x.tripId === d.tripId) === i)
      .slice(0, 12);
    return {
      id: station.id,
      name: station.name,
      codes: station.codes,
      lat: station.lat,
      lon: station.lon,
      distance: station.distance != null ? Math.round(station.distance) : null,
      departures,
    };
  });
  return { source: 'live', feedTimestamp: timestamp, stations: out };
}
