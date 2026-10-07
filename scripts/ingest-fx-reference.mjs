const SUPABASE_URL=String(process.env.SGBUDDY_SUPABASE_URL||'').replace(/\/$/,'');
const SERVICE_KEY=String(process.env.SGBUDDY_SUPABASE_SERVICE_ROLE_KEY||'');
const ECB_URL='https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const CURRENCIES=['USD','EUR','GBP','AUD','JPY','CNY','MYR','IDR','THB','KRW','INR','BRL'];

if(!SUPABASE_URL||!SERVICE_KEY){
  console.error('Set SGBUDDY_SUPABASE_URL and SGBUDDY_SUPABASE_SERVICE_ROLE_KEY before running this ingestion script.');
  process.exit(1);
}
function parse(xml){
  const date=(xml.match(/time=['"]([^'"]+)['"]/)||[])[1];
  const rates={EUR:1};
  for(const m of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)) rates[m[1]]=Number(m[2]);
  if(!date||!rates.SGD) throw new Error('ECB feed missing date or SGD.');
  return {date,rates};
}
const xml=await fetch(ECB_URL).then(async r=>{if(!r.ok)throw new Error('ECB '+r.status);return r.text()});
const {date,rates}=parse(xml);
const observedAt=date+'T16:00:00+01:00';
const expiresAt=new Date(Date.parse(observedAt)+36*60*60*1000).toISOString();
const rows=CURRENCIES.filter(c=>c==='EUR'||Number.isFinite(rates[c])).map(currency=>({
  base_currency:'SGD',
  quote_currency:currency,
  rate:(currency==='EUR'?1:rates[currency])/rates.SGD,
  provider:'European Central Bank reference rates',
  observed_at:observedAt,
  expires_at:expiresAt,
  metadata:{rate_date:date,provider_type:'reference',transaction_rate:false},
}));
const response=await fetch(SUPABASE_URL+'/rest/v1/fx_rate_snapshots',{
  method:'POST',
  headers:{apikey:SERVICE_KEY,Authorization:'Bearer '+SERVICE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},
  body:JSON.stringify(rows),
});
if(!response.ok) throw new Error('Supabase FX insert '+response.status+': '+await response.text());
console.log('Inserted '+rows.length+' SGD reference-rate snapshots for '+date+'.');
