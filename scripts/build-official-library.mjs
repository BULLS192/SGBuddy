/**
 * SGBuddy official-source library build.
 * Downloads five public Singapore government GEOJSON datasets into a separate,
 * versioned source snapshot. Never treats a map record as proof of current
 * operating hours, accessible entrances, pricing, or business tenancy.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const DATASETS=[
 {code:'NEA_HAWKER',agency:'NEA',id:'d_4a086da0a5553be1d89383cd90d07ecd',kind:'Eat',label:'Hawker centres',mode:['resident','visitor','executive','student']},
 {code:'NPARKS_PARKS',agency:'NParks',id:'d_77d7ec97be83d44f61b85454f844382f',kind:'Do',label:'Parks and reserves',mode:['resident','visitor','executive','student']},
 {code:'NLB_LIBRARY',agency:'NLB',id:'d_27b8dae65d9ca1539e14d09578b17cbf',kind:'Essentials',label:'Public libraries',mode:['resident','student','visitor','executive']},
 {code:'PA_CC',agency:'PA',id:'d_9de02d3fb33d96da1855f4fbef549a0f',kind:'Essentials',label:'Community clubs',mode:['resident','student','executive','visitor']},
 {code:'SPORTSG',agency:'Sport Singapore',id:'d_9b87bab59d036a60fad2a91530e10773',kind:'Essentials',label:'Sports facilities',mode:['resident','student','visitor','executive']}
];
const norm=t=>String(t||'').normalize('NFKC').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').replace(/\b(the|singapore)\b/g,'').trim().replace(/\s+/g,' ');
const safeText=t=>String(t||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
function htmlDecode(s){return String(s||'').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function propFromHtml(html,key){
 const tr=String(html||'').match(new RegExp('<th[^>]*>\\s*'+key+'\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>','i'));
 return tr?htmlDecode(safeText(tr[1])):'';
}
function getField(p,key){
 let v=p[key]??p[key.toLowerCase()]??p[key.charAt(0)+key.slice(1).toLowerCase()];
 if(v==null||v==='')v=propFromHtml(p.Description||p.DESCRIPTION,key);
 return safeText(v);
}
function coords(geom){
 if(!geom)return null;
 if(geom.type==='Point'){const [lon,lat]=geom.coordinates||[];return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon}:null}
 // A representative point for browsing, NOT a pedestrian entrance or routing point.
 let ring=geom.coordinates;
 while(Array.isArray(ring)&&Array.isArray(ring[0])&&Array.isArray(ring[0][0]))ring=ring[0];
 if(!Array.isArray(ring)||ring.length<2)return null;
 const part=ring.slice(0,Math.min(ring.length,5000));
 let x=0,y=0,n=0;
 for(const c of part){if(Number.isFinite(c?.[0])&&Number.isFinite(c?.[1])){x+=c[0];y+=c[1];n++}}
 return n?{lon:x/n,lat:y/n}:null;
}
function goodCoords(c){return c&&c.lat>=1.12&&c.lat<=1.48&&c.lon>=103.58&&c.lon<=104.12}
function canonicalName(p,kind){
 let name=getField(p,'NAME');
 if(/^(kml_\d+|\d+|nil|unknown)$/i.test(name)||!name)name=getField(p,'ADDRESSBUILDINGNAME');
 if(!name||name.length<4||name.length>120)return '';
 // Avoid parks administrative parcels, generic street geometry and invalid records.
 if(kind==='Do'&&/^(unnamed|parcel|road reserve|roadside|green verge|landscape plot)/i.test(name))return '';
 return name;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function pull(dataset){
 const poll='https://api-open.data.gov.sg/v1/public/api/datasets/'+dataset.id+'/poll-download';
 let response;
 for(let attempt=0;attempt<5;attempt++){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
  try{response=await fetch(poll,{headers:{Accept:'application/json'},signal:controller.signal})}finally{clearTimeout(timeout)}
  if(response.status!==429)break;
  const delay=36000+(attempt*12000);
  console.warn(dataset.code+' rate limited; waiting '+delay+'ms before retry '+(attempt+1));
  await sleep(delay);
 }
 if(!response?.ok)throw Error('poll '+(response?.status??'unavailable'));
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000);
 try{
  const payload=await response.json();
  if(payload.code!==0||!payload.data?.url)throw Error('poll payload invalid '+JSON.stringify(payload).slice(0,250));
  const target=new URL(payload.data.url);
  if(target.protocol!=='https:')throw Error('insecure source download');
  const data=await fetch(target,{signal:controller.signal});
  if(!data.ok)throw Error('download '+data.status);
  const body=await data.json();
  if(body.type!=='FeatureCollection'||!Array.isArray(body.features))throw Error('Not a GEOJSON FeatureCollection');
  return body;
 }finally{clearTimeout(timeout)}
}
function record(p,f,d,sourceRow){
 const name=canonicalName(p,d.kind);
 const location=coords(f.geometry);
 if(!name||!goodCoords(location))return null;
 const normalized=norm(name);if(normalized.length<4)return null;
 const sourceId=String(getField(p,'OBJECTID')||getField(p,'OBJECTID_1')||getField(p,'INC_CRC')||sourceRow);
 const digest=crypto.createHash('sha256').update(d.code+':'+normalized+':'+sourceId).digest('hex').slice(0,12);
 const block=getField(p,'ADDRESSBLOCKHOUSENUMBER');
 const road=getField(p,'ADDRESSSTREETNAME');
 const postal=getField(p,'ADDRESSPOSTALCODE')||getField(p,'POSTALCODE');
 const building=getField(p,'ADDRESSBUILDINGNAME');
 const a= getField(p,'ADDRESS')||[block,road].filter(Boolean).join(' ');
 const address=[a,/^\d{6}$/.test(postal)?'Singapore '+postal:''].filter(Boolean).join(', ');
 const status=getField(p,'STATUS');
 return {
  id:'SGO-'+digest,
  name,kind:d.kind,kinds:[d.kind],area:'Singapore',street:road||null,category:d.label,
  modes:d.mode,lat:Number(location.lat.toFixed(7)),lon:Number(location.lon.toFixed(7)),
  address:address||null,postal:/^\d{6}$/.test(postal)?postal:null,
  sourceDatasetId:d.id,sourceAgency:d.agency,sourceRecordId:sourceId,
  sourceUrl:'https://data.gov.sg/datasets/'+d.id+'/view',
  status:'official-source-snapshot',operatingStatus:'unverified',
  nameInSource:true,sourceReportedStatus:status||null,
  coordinatesKind:f.geometry?.type==='Point'?'point':'indicative-polygon-centroid',
  notes:'Government directory snapshot. Exact public entrance, current operating status, access, hours and fees are not verified.'
 };
}
const log=[],all=[],seen=new Set();
for(const d of DATASETS){
 try{
  const features=(await pull(d)).features;
  let accepted=0,skipped=0;
  for(let i=0;i<features.length;i++){
   const item=record(features[i].properties||{},features[i],d,i);
   if(!item){skipped++;continue}
   const key=d.code+':'+norm(item.name);
   if(seen.has(key)){skipped++;continue}
   seen.add(key);all.push(item);accepted++;
  }
  log.push({agency:d.agency,datasetId:d.id,records:features.length,accepted,skipped,status:'ok'});
  console.log(d.code+' '+accepted+' records accepted of '+features.length);
  await sleep(15000);
 }catch(e){log.push({agency:d.agency,datasetId:d.id,status:'failed',error:String(e.message||e).slice(0,230)});console.warn(d.code+' failed',e.message)}
}
const ok=log.filter(x=>x.status==='ok').length;
if(ok<3||all.length<100)throw Error('Too few official datasets/places; not publishing partial library: '+JSON.stringify(log));
const existing=JSON.parse(fs.readFileSync('data/discover-v120.json','utf8')).places||[];
const names=new Set(existing.map(p=>norm(p.name)));
const dedup=all.filter(p=>!names.has(norm(p.name)));
dedup.sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name));
const result={schemaVersion:1,updatedAt:new Date().toISOString(),sourcePolicy:'Official government geospatial source; snapshots may be old. A source record does not confirm operating hours, entry gates, existence today, accessibility, tenant occupancy, stall menus, or prices.',counts:{sourceRows:all.length,baseCurated:existing.length,added:dedup.length,totalUniqueApprox:existing.length+dedup.length,byKind:Object.fromEntries([...new Set(dedup.map(x=>x.kind))].map(k=>[k,dedup.filter(p=>p.kind===k).length]))},sources:log,places:dedup};
fs.writeFileSync('data/official-places-v200.json',JSON.stringify(result,null,2)+'\n');
console.log('Official source snapshot complete: '+dedup.length+' additional places; '+ok+' government sources.');
