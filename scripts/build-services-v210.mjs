import fs from 'node:fs';
import crypto from 'node:crypto';
// Official geospatial snapshots; listing is NOT current operation or scheme participation.
const defs=[
 ['CHAS','MOH','d_548c33ea2d99e29ec63a7cc9edcccedc','Healthcare','CHAS clinic','geo','2024-06-06'],
 ['PHARMACY','HSA','d_bb92615f43de22933e4479558b1f6c36','Healthcare','Registered pharmacy','geo','2025-09-25'],
 ['POLYCLINIC','MOH','d_b22489c7dc4065b6e7e45f177fdb33be','Healthcare','Polyclinic','geo','2024-01-31'],
 ['SUPERMARKET','SFA','d_8a77ee0446716b2ce475a587004afc73','Essentials','Supermarket','kml','2024-06-06'],
 ['SOCIAL','MSF','d_22cfe2aed0bf20a679ab59bcaf0f8248','Essentials','Social Service Office','geo','2024-11-01']
].map(([key,agency,id,kind,category,format,asOf])=>({key,agency,id,kind,category,format,asOf}));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const clean=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const decode=s=>String(s??'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const norm=s=>clean(s).toLowerCase().replace(/[^a-z0-9]+/g,' ');
function field(p,...names){
 for(const name of names){
  const direct=p[name]??p[name.toLowerCase()]??p[name.toUpperCase()];
  if(direct!=null&&clean(direct))return decode(clean(direct));
  const rg=new RegExp('<th[^>]*>\\s*'+name+'\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>','i');
  const m=String(p.Description||p.DESCRIPTION||'').match(rg);
  if(m&&clean(m[1]))return decode(clean(m[1]));
 }
 return '';
}
function geofeatures(geo){
 if(geo.type!=='FeatureCollection'||!Array.isArray(geo.features))throw Error('Not a GEOJSON FeatureCollection');
 return geo.features.map((f,i)=>({p:f.properties||{},xy:f.geometry?.type==='Point'?f.geometry.coordinates:[],i}));
}
function kmlfeatures(xml){
 const matches=[...xml.matchAll(/<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/gi)];
 if(!matches.length)throw Error('KML did not contain Placemarks');
 const get=(s,n)=>decode(clean((s.match(new RegExp('<'+n+'\\b[^>]*>([\\s\\S]*?)<\\/'+n+'>','i'))||[])[1]||''));
 return matches.map((m,i)=>{
  const str=m[1],p={Name:get(str,'name'),Description:get(str,'description')};
  for(const x of str.matchAll(/<SimpleData\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/SimpleData>/gi))p[x[1]]=decode(clean(x[2]));
  for(const x of str.matchAll(/<Data\s+name="([^"]+)"[^>]*>[\s\S]*?<value>([\s\S]*?)<\/value>/gi))p[x[1]]=decode(clean(x[2]));
  return {p,xy:get(str,'coordinates').split(',').map(Number),i};
 });
}
async function fetchRows(src){
 const url='https://api-open.data.gov.sg/v1/public/api/datasets/'+src.id+'/poll-download';
 let poll;
 for(let attempt=0;attempt<5;attempt++){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),30000);
  try{poll=await fetch(url,{signal:c.signal})}finally{clearTimeout(t)}
  if(poll.status!==429)break;
  console.log(src.key+' 429; backoff '+(22+attempt*15)+'s');await pause((22+attempt*15)*1000);
 }
 if(!poll?.ok)throw Error('poll '+poll?.status);
 const resp=await poll.json(),link=resp?.data?.url;
 if(resp.code!==0||!link||new URL(link).protocol!=='https:')throw Error('No safe download link');
 const c=new AbortController(),t=setTimeout(()=>c.abort(),75000);
 try{
  const r=await fetch(link,{signal:c.signal});
  if(!r.ok)throw Error('download '+r.status);
  const body=await r.text();
  return src.format==='kml'?kmlfeatures(body):geofeatures(JSON.parse(body));
 }finally{clearTimeout(t)}
}
function place(row,src){
 const p=row.p,raw=field(p,...(src.key==='CHAS'?['HCI_NAME']:src.key==='PHARMACY'?['PHARMACY_NAME']:src.key==='SUPERMARKET'?['LICENCEE_NAME','LICENSEE_NAME','SUPERMARKET_NAME','TRADING_NAME','NAME_OF_LICENSEE','BUSINESS_NAME','NAME']:['NAME']));
 const name=src.key==='SUPERMARKET'&&/^kml_\d+$/i.test(raw)?field(p,'LICENCEE_NAME','LICENSEE_NAME','SUPERMARKET_NAME'):raw;
 if(!name||/^kml_\d+$/i.test(name)||name.length<4||name.length>140)return null;
 const lon=Number(row.xy?.[0]),lat=Number(row.xy?.[1]);
 if(!(lat>=1.12&&lat<=1.48&&lon>=103.58&&lon<=104.12))return null;
 const block=field(p,'BLK_HSE_NO','HOUSE_BLK_NO','ADDRESSBLOCKHOUSENUMBER','BLOCKHOUSENUMBER');
 const street=field(p,'STREET_NAME','ROAD_NAME','ADDRESSSTREETNAME','STREETNAME');
 const postal=field(p,'POSTAL_CD','POSTAL_CODE','POSTALCODE','ADDRESSPOSTALCODE','POSTAL');
 const addr=field(p,'ADDRESS','LOCATION')||[block,street].filter(Boolean).join(' ');
 const sourceRow=field(p,'HCI_CODE','OBJECTID_1','OBJECTID','INC_CRC','LICENCE_NO','LICENCE_NUMBER')||String(row.i);
 const id='SGS-'+crypto.createHash('sha256').update(src.id+'|'+sourceRow+'|'+norm(name)+'|'+postal).digest('hex').slice(0,16);
 return {id,name,kind:src.kind,kinds:[src.kind],category:src.category,area:'Singapore',street:street||null,address:[addr,/^\d{6}$/.test(postal)?'Singapore '+postal:''].filter(Boolean).join(', ')||null,postal:/^\d{6}$/.test(postal)?postal:null,
  lat:+lat.toFixed(7),lon:+lon.toFixed(7),modes:['resident','visitor','executive','student'],status:'official-source-snapshot',operatingStatus:'unverified',
  sourceAgency:src.agency,sourceDatasetId:src.id,sourceRecordId:sourceRow,sourceUrl:'https://data.gov.sg/datasets/'+src.id+'/view',sourceCoverageAsOf:src.asOf,
  notes:'Historical government dataset snapshot; verify current clinic scheme participation, licence, operating hours, stock and opening directly.'};
}
const sources=[],places=[],ids=new Set();
for(const src of defs){
 try{
  const rows=await fetchRows(src);let n=0;
  for(const row of rows){const p=place(row,src);if(p&&!ids.has(p.id)){places.push(p);ids.add(p.id);n++}}
  sources.push({key:src.key,agency:src.agency,datasetId:src.id,coverageAsOf:src.asOf,sourceRecords:rows.length,accepted:n,status:'ok'});
  console.log(src.key+' '+n+' / '+rows.length);
  if(src.key==='SUPERMARKET'&&n<5)console.log('SUPERMARKET sample keys: '+Object.keys(rows[0]?.p||{}).join(',')+'; HTML '+String(rows[0]?.p?.Description||'').slice(0,220));
 }catch(e){sources.push({key:src.key,status:'failed',error:String(e.message||e)});console.log(src.key+' failed '+String(e.message||e))}
 await pause(12000);
}
if(places.length<100||sources.filter(x=>x.status==='ok').length<3)throw Error('Insufficient source integrity: '+JSON.stringify(sources));
places.sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
const output={schemaVersion:1,updatedAt:new Date().toISOString(),sourcePolicy:'Snapshot only, not confirmation of current licensing, operating status, opening hours, participation, stock, tariffs or service availability.',counts:{total:places.length,byCategory:Object.fromEntries([...new Set(places.map(p=>p.category))].map(c=>[c,places.filter(p=>p.category===c).length]))},sources,places};
fs.writeFileSync('data/services-v210.json',JSON.stringify(output,null,2)+'\n');
console.log('Saved service directory',places.length,output.counts.byCategory);
