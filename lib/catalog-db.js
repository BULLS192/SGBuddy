const SUPABASE_URL=String(process.env.SGBUDDY_SUPABASE_URL||'').replace(/\/$/,'');
const SUPABASE_KEY=String(process.env.SGBUDDY_SUPABASE_PUBLISHABLE_KEY||'');

export const hasCatalogDatabase=()=>Boolean(SUPABASE_URL&&SUPABASE_KEY);

async function rpc(name,body={}){
  if(!hasCatalogDatabase()) return null;
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{
      apikey:SUPABASE_KEY,
      'Content-Type':'application/json',
      Accept:'application/json',
    },
    body:JSON.stringify(body),
    cache:'no-store',
  });
  if(!response.ok){
    const message=await response.text().catch(()=>response.statusText);
    throw new Error(`catalog rpc ${name} returned ${response.status}: ${message.slice(0,160)}`);
  }
  return response.json();
}

export async function searchCatalogPlaces(query,{limit=8}={}){
  if(!hasCatalogDatabase()) return [];
  const rows=await rpc('search_public_places',{
    search_text:String(query||''),
    result_limit:Math.max(1,Math.min(Number(limit)||8,20)),
  });
  return (Array.isArray(rows)?rows:[]).map(row=>({
    type:row.kind==='transport'?'place':row.kind,
    label:row.name,
    subtitle:row.category||row.kind||'Place',
    value:row.name,
    slug:row.slug,
    lat:Number(row.latitude),
    lon:Number(row.longitude),
    aliases:Array.isArray(row.aliases)?row.aliases:[],
    source:'supabase',
    sourceKey:row.source_key,
  }));
}

export async function catalogStats(){
  if(!hasCatalogDatabase()) return null;
  return rpc('public_catalog_stats',{});
}

export async function findCatalogPlace(query){
  const q=String(query||'').trim().toLowerCase();
  if(!q) return null;
  const rows=await searchCatalogPlaces(query,{limit:8});
  const exact=rows.find(row=>
    String(row.label||'').toLowerCase()===q ||
    (row.aliases||[]).some(alias=>String(alias).toLowerCase()===q)
  );
  if(!exact) return null;
  return {
    type:exact.type==='transport'?'place':exact.type,
    label:exact.label,
    name:exact.label,
    lat:exact.lat,
    lon:exact.lon,
    source:exact.source,
    sourceKey:exact.sourceKey,
    slug:exact.slug,
  };
}
