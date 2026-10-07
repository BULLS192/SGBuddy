import { haversine } from './lta.js';
import { nearbyPublicMoneyChangers } from './catalog-db.js';

const ECB_URL='https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const MAS_DATASET_ID='d_f2dc6f340fcf53007e18dad9df92d229';
const MAS_DOWNLOAD='https://api-open.data.gov.sg/v1/public/api/datasets/'+MAS_DATASET_ID+'/poll-download';
export const SUPPORTED_CURRENCIES=['SGD','USD','EUR','GBP','AUD','JPY','CNY','MYR','IDR','THB','KRW','INR','BRL'];

let fxCache=null;
let fxCacheAt=0;
let changerCache=null;
let changerCacheAt=0;

function dataGovHeaders(){
  const headers={accept:'application/json'};
  if(process.env.DATA_GOV_SG_API_KEY) headers['x-api-key']=process.env.DATA_GOV_SG_API_KEY;
  return headers;
}
function parseEcbXml(xml){
  const time=(xml.match(/time=['"]([^'"]+)['"]/)||[])[1]||null;
  const rates={EUR:1};
  for(const match of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)){
    rates[match[1]]=Number(match[2]);
  }
  if(!rates.SGD) throw new Error('ECB response did not include SGD');
  return {date:time,rates};
}
export async function getReferenceRates(){
  if(fxCache&&Date.now()-fxCacheAt<30*60*1000) return fxCache;
  const response=await fetch(ECB_URL,{headers:{accept:'application/xml,text/xml'},next:{revalidate:1800}});
  if(!response.ok) throw new Error('ECB reference-rate feed returned '+response.status);
  const parsed=parseEcbXml(await response.text());
  const available=Object.fromEntries(SUPPORTED_CURRENCIES.filter(c=>Number.isFinite(parsed.rates[c])).map(c=>[c,parsed.rates[c]]));
  fxCache={
    provider:'European Central Bank',
    providerType:'reference',
    base:'EUR',
    date:parsed.date,
    rates:available,
    allRates:parsed.rates,
    retrievedAt:new Date().toISOString(),
    disclaimer:'Reference rate for information only; it is not a live dealer or money-changer buy/sell quote.',
  };
  fxCacheAt=Date.now();
  return fxCache;
}
export async function convertReference(amount,from='SGD',to='USD'){
  const source=String(from||'SGD').toUpperCase(),target=String(to||'USD').toUpperCase();
  const value=Number(amount);
  if(!Number.isFinite(value)||value<0) throw new Error('Enter a valid non-negative amount.');
  if(!SUPPORTED_CURRENCIES.includes(source)||!SUPPORTED_CURRENCIES.includes(target)) throw new Error('Unsupported currency.');
  const feed=await getReferenceRates();
  const sr=source==='EUR'?1:feed.allRates[source];
  const tr=target==='EUR'?1:feed.allRates[target];
  if(!Number.isFinite(sr)||!Number.isFinite(tr)) throw new Error('Reference rate unavailable for that currency pair.');
  const rate=tr/sr;
  return {
    amount:value,from:source,to:target,rate,result:value*rate,
    observedAt:feed.retrievedAt,
    rateDate:feed.date,
    provider:feed.provider,
    providerType:feed.providerType,
    sourceUrl:'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html',
    disclaimer:feed.disclaimer,
  };
}
function normalizePostal(value){
  const s=String(value??'').replace(/\D/g,'');
  return s?s.padStart(6,'0'):null;
}
function normalizeChanger(feature){
  const p=feature?.properties||{};
  const coords=feature?.geometry?.coordinates||[];
  const lon=Number(coords[0]),lat=Number(coords[1]);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<1.1||lat>1.5||lon<103.55||lon>104.1) return null;
  const address=[p.BUSINESS_ADDRESS1,p.BUSINESS_ADDRESS2].filter(Boolean).join(', ');
  return {
    sourceRef:String(p.OBJECTID_1||''),
    name:String(p.NAME||'Money changer').trim(),
    legalName:String(p.NAME||'Money changer').trim(),
    licenceType:String(p.BUSINESS_TYPE||'Money-changing Licensee'),
    licenceStatus:'MAS listed',
    licenceReference:null,
    businessRegistrationNumber:p.BUSINESS_REGISTRATION_NUMBER?String(p.BUSINESS_REGISTRATION_NUMBER):null,
    address,
    postalCode:normalizePostal(p.BUSINESS_POSTALCODE),
    lat,lon,
    lastVerifiedAt:p.FMEL_UPD_D?String(p.FMEL_UPD_D):null,
    source:'MAS / data.gov.sg money changer locations',
    sourceUrl:'https://data.gov.sg/datasets/'+MAS_DATASET_ID+'/view',
    quoteStatus:'No live shop buy/sell quote supplied by MAS.',
  };
}
async function fetchMasChangers(){
  if(changerCache&&Date.now()-changerCacheAt<6*60*60*1000) return changerCache;
  const meta=await fetch(MAS_DOWNLOAD,{headers:dataGovHeaders(),next:{revalidate:21600}});
  if(!meta.ok) throw new Error('MAS money-changer catalogue returned '+meta.status);
  const payload=await meta.json();
  if(Number(payload?.code||0)!==0||!payload?.data?.url) throw new Error(payload?.errMsg||'MAS dataset download is not ready.');
  const download=await fetch(payload.data.url,{headers:{accept:'application/geo+json,application/json'},next:{revalidate:21600}});
  if(!download.ok) throw new Error('MAS money-changer dataset download returned '+download.status);
  const geo=await download.json();
  changerCache=(geo?.features||[]).map(normalizeChanger).filter(Boolean);
  changerCacheAt=Date.now();
  return changerCache;
}
function filterAndRank(rows,{lat,lon,query,limit=12}={}){
  const q=String(query||'').trim().toLowerCase();
  const hasPoint=Number.isFinite(Number(lat))&&Number.isFinite(Number(lon));
  return rows.map(row=>{
    const distanceM=hasPoint?Math.round(haversine(Number(lat),Number(lon),Number(row.lat),Number(row.lon))):null;
    return {...row,distanceM};
  }).filter(row=>{
    if(!q) return true;
    return [row.name,row.legalName,row.address,row.postalCode].some(v=>String(v||'').toLowerCase().includes(q));
  }).sort((a,b)=>{
    if(hasPoint) return (a.distanceM??Infinity)-(b.distanceM??Infinity);
    return a.name.localeCompare(b.name);
  }).slice(0,Math.max(1,Math.min(Number(limit)||12,30)));
}
export async function getMoneyChangers({lat,lon,query,limit=12}={}){
  try{
    const rows=await nearbyPublicMoneyChangers({lat,lon,query,limit});
    if(Array.isArray(rows)&&rows.length) return {source:'supabase',items:rows};
  }catch{}
  const official=await fetchMasChangers();
  return {source:'mas-live-directory',items:filterAndRank(official,{lat,lon,query,limit})};
}
