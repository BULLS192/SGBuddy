import { hasLtaKey } from './lib/lta.js';
import { railDepartures } from './lib/rail.js';
import { demoRail } from './lib/demo.js';

export default async function handler(req, res) {
  const query = String(req.query.station || '').trim();
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!query && (!Number.isFinite(lat) || !Number.isFinite(lon))) {
    return res.status(400).json({ error: 'Provide station, or lat and lon.' });
  }
  if (!hasLtaKey()) return res.status(200).json(demoRail(query));
  try {
    const payload = await railDepartures(query ? { query, limit: 3 } : { lat, lon, limit: 2 });
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(200).json({ ...demoRail(query), source: 'demo-fallback', error: error.message });
  }
}
