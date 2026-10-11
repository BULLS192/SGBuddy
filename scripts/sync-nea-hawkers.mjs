/** NEA Hawker Centres (GEOJSON) source importer.
 * Usage: node scripts/sync-nea-hawkers.mjs
 * Writes a source snapshot for review. It does NOT assert today's operating status.
 * Public dataset coverage may be older than the updated-at timestamp.
 */
import fs from 'node:fs';
import {normalizePlace} from '../lib/discover-geo.js';
const datasetId='d_4a086da0a5553be1d89383cd90d07ecd';
const datasetUrl='https://data.gov.sg/datasets/'+datasetId+'/view';
const endpoint='https://api-open.data.gov.sg/v1/public/api/datasets/'+datasetId+'/poll-download';
const resp=await fetch(endpoint,{headers:{accept:'application/json'},signal:AbortSignal.timeout(16000)});
if(!resp.ok)throw Error('NEA dataset download lookup failed: '+resp.status);
const payload=await resp.json();
if(payload.code!==0||!/^https:\/\//.test(payload.data?.url||''))throw Error('NEA dataset did not provide a validated download URL');
const target=new URL(payload.data.url);
if(!target.hostname.endsWith('.gov.sg')&&!target.hostname.endsWith('.amazonaws.com'))throw Error('Unexpected dataset download host: '+target.hostname);
const got=await fetch(target,{signal:AbortSignal.timeout(30000)});
if(!got.ok)throw Error('Dataset download failed: '+got.status);
const geo=await got.json();
if(geo.type!=='FeatureCollection'||!Array.isArray(geo.features))throw Error('Expected NEA GeoJSON FeatureCollection');
const known=JSON.parse(fs.readFileSync('data/discover-v120.json','utf8')).places.filter(p=>p.kind==='Eat');
const byName=new Map(known.map(p=>[normalizePlace(p.name),p]));
function coordinates(feature){const g=feature.geometry||{};const xy=g.type==='Point'?g.coordinates:null;return Array.isArray(xy)&&xy.length>=2&&Number(xy[0])>103&&Number(xy[0])<105&&Number(xy[1])>1&&Number(xy[1])<2?{lat:xy[1],lon:xy[0]}:null}
const rows=geo.features.map((f,i)=>{
 const p=f.properties||{},name=String(p.NAME||p.Name||p.name||p.DESCRIPTION||'').trim();
 if(!name)return null;
 const matched=byName.get(normalizePlace(name));
 const postal=String(p.ADDRESSPOSTALCODE||'').trim();
 const road=String(p.ADDRESSSTREETNAME||'').trim();
 const block=String(p.ADDRESSBLOCKHOUSENUMBER||'').trim();
 return {sourceRecordId:String(p.OBJECTID||i),name,matchedCatalogId:matched?.id||null,
  postal:/^\d{6}$/.test(postal)?postal:null,
  address:[block,road,/^\d{6}$/.test(postal)?'Singapore '+postal:''].filter(Boolean).join(' ')||null,
  coords:coordinates(f),sourceStatus:String(p.STATUS||'').trim()||'not supplied',
  venueTradingStatus:'unverified',sourceUrl:datasetUrl,
  reviewStatus:'nea-source-candidate'};
}).filter(Boolean);
const index=new Set();for(const row of rows){const key=normalizePlace(row.name);if(index.has(key))throw Error('Duplicate named centre in source: '+row.name);index.add(key)}
const snapshot={schemaVersion:1,source:'NEA via data.gov.sg Hawker Centres GEOJSON',datasetId,downloadedAt:new Date().toISOString(),notice:'Official dataset listing is not proof an individual hawker or stall is trading today. Address and postcode need OneMap cross-check. Snapshot must be reviewed before promotion.',count:rows.length,matchedToDirectory:rows.filter(x=>x.matchedCatalogId).length,centres:rows};
fs.writeFileSync('data/nea-hawkers-import.json',JSON.stringify(snapshot,null,2)+'\n');
console.log('NEA snapshot saved',snapshot.count,'centres;',snapshot.matchedToDirectory,'matched names in local catalog');
