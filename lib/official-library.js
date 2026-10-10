/* Official Singapore geospatial data importer. Listings do not certify current hours or operation. */
import {parse as parseCsv} from 'csv-parse/sync';
export const SOURCES=[
 {code:'NEA_HAWKERS',agency:'NEA',category:'Eat',kind:'Hawker centres',id:'d_4a086da0a5553be1d89383cd90d07ecd',coverage:'2025-11',format:'geojson'},
 {code:'NPARKS_PARKS',agency:'NParks',category:'Do',kind:'Parks & nature',id:'d_77d7ec97be83d44f61b85454f844382f',coverage:'2025-11',format:'geojson'},
 {code:'PA_CLUBS',agency:"People's Association",category:'Do',kind:'Community clubs',id:'d_9de02d3fb33d96da1855f4fbef549a0f',coverage:'2025-09',format:'geojson'},
 {code:'STB_ATTRACTIONS',agency:'STB',category:'Do',kind:'Attractions (historical listing)',id:'d_0f2f47515425404e6c9d2a040dd87354',coverage:'2018-06',format:'geojson'},
 {code:'SPORT_FACILITIES',agency:'Sport Singapore',category:'Do',kind:'Sport facilities',id:'d_2cfb0867cdeb2b7303068995699dc33b',coverage:'2024',format:'csv'}
];
const trim=x=>String(x??'').trim();
const clean=s=>trim(s).replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
function prop(p,key){
 const normal=x=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
 const found=Object.entries(p||{}).find(([k])=>normal(k)===normal(key));
 if(found&&found[1]!=null&&typeof found[1]!=='object')return trim(found[1]);
 const html=String(p?.Description||p?.description||'');
 const regex=new RegExp('<th[^>]*>\\s*'+key+'\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>','i');
 const m=html.match(regex);return m?clean(m[1]):'';
}
function geoPoint(geometry,p){
 const coords=geometry?.coordinates;
 if(geometry?.type==='Point'&&Array.isArray(coords))return coords;
 if(geometry?.type==='MultiPoint'&&Array.isArray(coords))return coords[0];
 let values=[];
 const flatten=(x,d=0)=>{if(d>8||values.length>12000)return;if(Array.isArray(x)&&x.length>=2&&Number.isFinite(+x[0])&&Number.isFinite(+x[1])){values.push(x);return}if(Array.isArray(x))for(const y of x)flatten(y,d+1)};
 if(coords)flatten(coords);
 if(values.length){
  let minLo=Infinity,maxLo=-Infinity,minLa=Infinity,maxLa=-Infinity;
  for(const [lo,la] of values){minLo=Math.min(minLo,+lo);maxLo=Math.max(maxLo,+lo);minLa=Math.min(minLa,+la);maxLa=Math.max(maxLa,+la)}
  return [(minLo+maxLo)/2,(minLa+maxLa)/2];
 }
 return [Number(prop(p,'LONGITUDE')||prop(p,'LONGTITUDE')),Number(prop(p,'LATITUDE'))];
}
const isSG=a=>Array.isArray(a)&&a.length>=2&&Number.isFinite(+a[0])&&Number.isFinite(+a[1])&&+a[1]>=1.10&&+a[1]<=1.52&&+a[0]>=103.55&&+a[0]<=104.16;
export const nameKey=x=>trim(x).normalize('NFKC').toLowerCase().replace(/&/g,'and').replace(/\b(food (centre|center)|hawker centre|market and food centre)\b/g,'food').replace(/[^a-z0-9]+/g,' ').trim();
const inactive=/\b(closed|demolished|proposed|under construction|upcoming|future|planned|not in operation|permanently closed)\b/i;
export function normalizeRecords(source,data){
 const features=source.format==='csv'
 ?(Array.isArray(data)?data:parseCsv(String(data),{columns:true,skip_empty_lines:true,relax_quotes:true})).map(p=>({properties:p,geometry:null}))
 :Array.isArray(data?.features)?data.features:[];
 const seen=new Set(),rows=[];
 for(const feature of features.slice(0,30000)){
  const p=feature?.properties||{};
  const raw=source.code==='STB_ATTRACTIONS'?prop(p,'PAGETITLE')
   :source.code==='SPORT_FACILITIES'?prop(p,'VENUE_NAME')||prop(p,'FACILITY_NAME')||prop(p,'NAME')||prop(p,'FACILITY')||prop(p,'VENUE')
   :prop(p,'NAME');
  const name=clean(raw),canonical=nameKey(name);
  if(!name||name.length<4||name.length>130||name==='kml_1'||!canonical)continue;
  const status=prop(p,'STATUS');
  if(inactive.test(status))continue;
  const point=geoPoint(feature.geometry,p);
  if(!isSG(point)||seen.has(canonical))continue;
  seen.add(canonical);
  const [lon,lat]=point.map(Number);
  const postal=prop(p,'ADDRESSPOSTALCODE')||prop(p,'POSTALCODE')||prop(p,'POSTAL_CODE');
  const street=prop(p,'ADDRESSSTREETNAME')||prop(p,'ADDRESS')||prop(p,'ROAD_NAME');
  const block=prop(p,'ADDRESSBLOCKHOUSENUMBER');
  const id=source.code+'-'+(prop(p,'OBJECTID')||prop(p,'OBJECTID_1')||canonical.replace(/\s+/g,'-')).slice(0,80);
  rows.push({id,name,category:source.category,kind:source.kind,area:street||'Singapore',
   address:[block,street].filter(Boolean).join(' ').trim(),postal:/^\d{6}$/.test(postal)?postal:'',
   lat:+lat.toFixed(6),lon:+lon.toFixed(6),agency:source.agency,sourceCode:source.code,
   sourceUrl:'https://data.gov.sg/datasets/'+source.id+'/view',sourceCoverage:source.coverage,
   freshness:source.code==='STB_ATTRACTIONS'?'historical-recheck':'dataset-listed',
   locationPrecision:['Polygon','MultiPolygon'].includes(feature.geometry?.type)?'indicative-boundary-centre':'source-point',
   hoursVerified:false,pricesVerified:false,listingStatus:status||'not independently checked'});
 }
 return rows;
}
function safeDownload(raw){
 const u=new URL(raw),h=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||!(h==='data.gov.sg'||h.endsWith('.data.gov.sg')||h.endsWith('.amazonaws.com')||h.endsWith('.cloudfront.net')||h.endsWith('.blob.core.windows.net')))
  throw new Error('Untrusted data.gov.sg download host');
 return u.href;
}
async function fetchText(fetcher,url,ms=8500){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
 try{const r=await fetcher(url,{signal:c.signal,headers:{accept:'application/json,text/csv,*/*'}});if(!r.ok)throw new Error('HTTP '+r.status);return await r.text()}finally{clearTimeout(t)}
}
export async function fetchSource(source,fetcher=fetch){
 const poll='https://api-open.data.gov.sg/v1/public/api/datasets/'+source.id+'/poll-download';
 const meta=JSON.parse(await fetchText(fetcher,poll));
 if(meta.code!==0||!meta.data?.url)throw new Error('Download unavailable: '+(meta.errMsg||meta.code));
 const raw=await fetchText(fetcher,safeDownload(meta.data.url),source.code==='NPARKS_PARKS'?13500:9500);
 return normalizeRecords(source,source.format==='csv'?raw:JSON.parse(raw));
}
export function consolidate(results){
 const seen=new Set(),places=[],sources=[];
 for(const entry of results){
  const s=entry.source,rows=entry.rows||[];
  sources.push({code:s.code,agency:s.agency,coverage:s.coverage,count:rows.length,status:entry.error?'unavailable':'loaded',error:entry.error||null,sourceUrl:'https://data.gov.sg/datasets/'+s.id+'/view'});
  for(const p of rows){
   const k=nameKey(p.name)+'|'+Math.round(p.lat*300)+'|'+Math.round(p.lon*300);
   if(seen.has(k))continue;seen.add(k);places.push(p);
  }
 }
 return {schemaVersion:1,source:'Singapore government datasets',checkedAt:new Date().toISOString(),sources,counts:{total:places.length,eat:places.filter(x=>x.category==='Eat').length,do:places.filter(x=>x.category==='Do').length},places};
}
export async function buildLibrary(fetcher=fetch){
 const results=await Promise.all(SOURCES.map(async source=>{try{return {source,rows:await fetchSource(source,fetcher)}}catch(e){return {source,rows:[],error:String(e?.message||e).slice(0,150)}}}));
 return consolidate(results);
}
