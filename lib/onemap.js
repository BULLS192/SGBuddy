let cachedToken={value:null,expiresAt:0};

export const hasOneMapCredentials=()=>Boolean(
  process.env.ONEMAP_TOKEN ||
  (process.env.ONEMAP_API_EMAIL && process.env.ONEMAP_API_PASSWORD)
);

async function requestToken(){
  if(process.env.ONEMAP_TOKEN) return {value:process.env.ONEMAP_TOKEN,expiresAt:Date.now()+30*60*1000};
  if(!process.env.ONEMAP_API_EMAIL || !process.env.ONEMAP_API_PASSWORD) return null;
  const response=await fetch('https://www.onemap.gov.sg/api/auth/post/getToken',{
    method:'POST',
    headers:{'Content-Type':'application/json',accept:'application/json'},
    body:JSON.stringify({
      email:process.env.ONEMAP_API_EMAIL,
      password:process.env.ONEMAP_API_PASSWORD
    }),
    cache:'no-store'
  });
  if(!response.ok) throw new Error(`OneMap authentication returned ${response.status}`);
  const payload=await response.json();
  if(!payload.access_token) throw new Error('OneMap authentication returned no access token');
  const expiry=Number(payload.expiry_timestamp||0)*1000;
  return {value:payload.access_token,expiresAt:expiry||Date.now()+2*24*60*60*1000};
}

async function accessToken(force=false){
  if(!force && cachedToken.value && Date.now()<cachedToken.expiresAt-5*60*1000) return cachedToken.value;
  const next=await requestToken();
  if(!next) return null;
  cachedToken=next;
  return next.value;
}

async function search(query,forceRefresh=false){
  const token=await accessToken(forceRefresh);
  if(!token) return null;
  const url=new URL('https://www.onemap.gov.sg/api/common/elastic/search');
  url.searchParams.set('searchVal',String(query));
  url.searchParams.set('returnGeom','Y');
  url.searchParams.set('getAddrDetails','Y');
  url.searchParams.set('pageNum','1');
  const response=await fetch(url,{headers:{Authorization:token,accept:'application/json'},cache:'no-store'});
  if(!response.ok) throw new Error(`OneMap search returned ${response.status}`);
  return response.json();
}

export async function geocodeSingapore(query){
  const q=String(query||'').trim();
  if(!q || !hasOneMapCredentials()) return null;
  let payload=await search(q,false);
  if(payload?.error && process.env.ONEMAP_API_EMAIL && process.env.ONEMAP_API_PASSWORD){
    cachedToken={value:null,expiresAt:0};
    payload=await search(q,true);
  }
  if(payload?.error) throw new Error(payload.error);
  const row=payload?.results?.[0];
  if(!row) return null;
  const lat=Number(row.LATITUDE),lon=Number(row.LONGITUDE||row.LONGTITUDE);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)) return null;
  return {
    type:'address',
    label:row.BUILDING&&row.BUILDING!=='NIL'?row.BUILDING:(row.SEARCHVAL||q),
    address:row.ADDRESS||row.SEARCHVAL||q,
    postal:row.POSTAL||null,
    lat,lon,
  };
}
