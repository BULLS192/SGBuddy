/** Import historic NEA supermarket-licence registry, retaining address without inventing coords. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parse} from 'csv-parse/sync';
const datasetId='d_11edd0117280c5776651d7891114c88c';
const sourceUrl='https://data.gov.sg/datasets/'+datasetId+'/view';
const urls=[
 'https://api-open.data.gov.sg/v1/public/api/datasets/'+datasetId+'/poll-download',
 'https://data.gov.sg/api/action/datastore_search?resource_id='+datasetId+'&limit=1000'
];
async function pull(){
 let last='';
 for(const [i,url] of urls.entries()){
  try{
   const res=await fetch(url,{signal:AbortSignal.timeout(40000)});
   if(!res.ok){last='HTTP '+res.status;continue}
   const raw=await res.json();
   if(i===1&&raw.result?.records)return raw.result.records;
   const download=raw?.data?.url;
   if(!download||new URL(download).protocol!=='https:'){last='no download link';continue}
   const rr=await fetch(download,{signal:AbortSignal.timeout(50000)});if(!rr.ok){last='download '+rr.status;continue}
   const text=await rr.text();
   return parse(text,{columns:true,skip_empty_lines:true,bom:true,relax_quotes:true});
  }catch(e){last=String(e.message||e)}
 }
 throw Error('NEA legacy supermarket table not retrievable: '+last);
}
const rows=await pull();
const canon=s=>String(s??'').trim(),find=(p,...keys)=>{for(const k of keys){const v=p[k]??p[k.toUpperCase()]??p[k.toLowerCase()];if(canon(v))return canon(v)}return ''};
const shops=[];
for(let i=0;i<rows.length;i++){
 const r=rows[i];
 const license=find(r,'licence_num','licence_number');
 const name=find(r,'licensee_name','licensee','licensee name');
 const building=find(r,'building_name'),block=find(r,'block_house_num');
 const street=find(r,'street_name'),postal=find(r,'postal_code');
 if(!name||!street||!/^\\d{6}$/.test(postal))continue;
 const id='SGS-'+crypto.createHash('sha256').update(datasetId+'|'+(license||i)+'|'+postal).digest('hex').slice(0,16);
 shops.push({id,name,kind:'Essentials',kinds:['Essentials'],category:'Supermarket (historical licence)',area:'Singapore',
  street,address:[block,street,'Singapore '+postal].filter(Boolean).join(', '),postal,
  lat:null,lon:null,modes:['resident','visitor','executive','student'],
  status:'official-source-snapshot',operatingStatus:'unverified',sourceAgency:'NEA',sourceDatasetId:datasetId,
  sourceRecordId:license||String(i),sourceUrl,sourceCoverageAsOf:'2016-06-27',
  notes:'Historic supermarket licence record only, not a current 2026 licence, opening status, map coordinate or brand-directory confirmation.'});
}
if(shops.length<30)throw Error('Unexpectedly low supermarket coverage: '+shops.length);
const p='data/services-v210.json',bundle=JSON.parse(fs.readFileSync(p,'utf8'));
const before=new Set(bundle.places.map(x=>x.id));
bundle.places.push(...shops.filter(x=>!before.has(x.id)));
bundle.places.sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
bundle.counts.total=bundle.places.length;
bundle.counts.byCategory['Supermarket (historical licence)']=shops.length;
bundle.sources=bundle.sources.filter(x=>x.key!=='SUPERMARKET');
bundle.sources.push({key:'SUPERMARKET',agency:'NEA',datasetId,coverageAsOf:'2016-06-27',sourceRecords:rows.length,accepted:shops.length,status:'ok',note:'Historical licence register without coordinates; not a current SFA licence lookup.'});
bundle.updatedAt=new Date().toISOString();
fs.writeFileSync(p,JSON.stringify(bundle,null,2)+'\n');
console.log('Imported '+shops.length+' historical supermarket license addresses; no live store claim.');
