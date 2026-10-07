const SUPABASE_URL=String(process.env.SGBUDDY_SUPABASE_URL||'').replace(/\/$/,'');
const SERVICE_KEY=String(process.env.SGBUDDY_SUPABASE_SERVICE_ROLE_KEY||'');
const DATASET_ID='d_f2dc6f340fcf53007e18dad9df92d229';
const POLL='https://api-open.data.gov.sg/v1/public/api/datasets/'+DATASET_ID+'/poll-download';

if(!SUPABASE_URL||!SERVICE_KEY){
  console.error('Set SGBUDDY_SUPABASE_URL and SGBUDDY_SUPABASE_SERVICE_ROLE_KEY before running this ingestion script.');
  process.exit(1);
}
const headers={accept:'application/json'};
if(process.env.DATA_GOV_SG_API_KEY) headers['x-api-key']=process.env.DATA_GOV_SG_API_KEY;
const meta=await fetch(POLL,{headers}).then(async r=>{if(!r.ok)throw new Error('data.gov.sg '+r.status);return r.json()});
if(Number(meta?.code||0)!==0||!meta?.data?.url) throw new Error(meta?.errMsg||'Money-changer dataset not ready.');
const geo=await fetch(meta.data.url).then(async r=>{if(!r.ok)throw new Error('dataset '+r.status);return r.json()});
const restHeaders={apikey:SERVICE_KEY,Authorization:'Bearer '+SERVICE_KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'};
let written=0;
for(const feature of geo.features||[]){
  const p=feature?.properties||{},coords=feature?.geometry?.coordinates||[];
  const lon=Number(coords[0]),lat=Number(coords[1]);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<1.1||lat>1.5||lon<103.55||lon>104.1) continue;
  const externalId=String(p.OBJECTID_1||'').trim();
  if(!externalId) continue;
  const postal=String(p.BUSINESS_POSTALCODE??'').replace(/\D/g,'').padStart(6,'0')||null;
  const address=[p.BUSINESS_ADDRESS1,p.BUSINESS_ADDRESS2].filter(Boolean).join(', ');
  const place=[{
    slug:'mas-money-changer-'+externalId,
    name:String(p.NAME||'Money changer').trim(),
    aliases:[],
    kind:'fx',
    category:'Licensed money changer',
    address,
    postal_code:postal,
    geo:{type:'Point',coordinates:[lon,lat]},
    source_key:'mas_fid',
    source_ref:externalId,
    source_url:'https://data.gov.sg/datasets/'+DATASET_ID+'/view',
    verified_at:new Date().toISOString(),
    active:true,
    metadata:{business_registration_number:p.BUSINESS_REGISTRATION_NUMBER||null,dataset_id:DATASET_ID,dataset_updated_raw:p.FMEL_UPD_D||null},
  }];
  const placeResponse=await fetch(SUPABASE_URL+'/rest/v1/place_catalog?on_conflict=slug',{method:'POST',headers:restHeaders,body:JSON.stringify(place)});
  if(!placeResponse.ok) throw new Error('place upsert '+placeResponse.status+': '+await placeResponse.text());
  const saved=(await placeResponse.json())[0];
  const changer=[{
    place_id:saved.id,
    legal_name:String(p.NAME||'Money changer').trim(),
    licence_type:String(p.BUSINESS_TYPE||'Money-changing Licensee'),
    licence_status:'MAS listed',
    licence_reference:null,
    source_key:'mas_fid',
    verified_at:new Date().toISOString(),
    metadata:{business_registration_number:p.BUSINESS_REGISTRATION_NUMBER||null,source_ref:externalId,dataset_id:DATASET_ID},
  }];
  const changerResponse=await fetch(SUPABASE_URL+'/rest/v1/money_changers?on_conflict=place_id',{method:'POST',headers:restHeaders,body:JSON.stringify(changer)});
  if(!changerResponse.ok) throw new Error('money changer upsert '+changerResponse.status+': '+await changerResponse.text());
  written++;
}
console.log('Upserted '+written+' MAS money-changer locations.');
