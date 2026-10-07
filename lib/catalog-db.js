const SUPABASE_URL=String(process.env.SGBUDDY_SUPABASE_URL||'').replace(/\/$/,'');
const SUPABASE_KEY=String(process.env.SGBUDDY_SUPABASE_PUBLISHABLE_KEY||'');

export const hasCatalogDatabase=()=>Boolean(SUPABASE_URL&&SUPABASE_KEY);

async function rpc(name,body={}){
  if(!hasCatalogDatabase()) return null;
  const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/'+name,{
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
    throw new Error('catalog rpc '+name+' returned '+response.status+': '+message.slice(0,160));
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

export async function listFeaturedPlaces({limit=20}={}){
  if(!hasCatalogDatabase()) return [];
  const rows=await rpc('list_public_featured_places',{result_limit:Math.max(1,Math.min(Number(limit)||20,40))});
  return Array.isArray(rows)?rows:[];
}

export async function nearbyPublicMoneyChangers({lat,lon,query='',limit=12}={}){
  if(!hasCatalogDatabase()) return [];
  const rows=await rpc('nearby_public_money_changers',{
    latitude:Number.isFinite(Number(lat))?Number(lat):null,
    longitude:Number.isFinite(Number(lon))?Number(lon):null,
    search_text:String(query||''),
    result_limit:Math.max(1,Math.min(Number(limit)||12,30)),
  });
  return (Array.isArray(rows)?rows:[]).map(row=>({
    sourceRef:row.source_ref,
    name:row.name,
    legalName:row.legal_name,
    licenceType:row.licence_type,
    licenceStatus:row.licence_status,
    licenceReference:row.licence_reference,
    businessRegistrationNumber:row.business_registration_number||null,
    address:row.address,
    postalCode:row.postal_code,
    lat:Number(row.latitude),
    lon:Number(row.longitude),
    distanceM:row.distance_m==null?null:Number(row.distance_m),
    lastVerifiedAt:row.verified_at,
    source:'SGBuddy Supabase catalog / MAS',
    sourceUrl:row.source_url,
    quoteStatus:'No live shop buy/sell quote supplied by MAS.',
  }));
}

export async function listPersonaPlaces({persona='resident',category='',lat,lon,query='',limit=80}={}){
  if(!hasCatalogDatabase()) return [];
  const rows=await rpc('list_persona_places',{
    persona:String(persona||'resident'),
    category_filter:String(category||'')||null,
    latitude:Number.isFinite(Number(lat))?Number(lat):null,
    longitude:Number.isFinite(Number(lon))?Number(lon):null,
    search_text:String(query||'')||null,
    result_limit:Math.max(1,Math.min(Number(limit)||80,200)),
  });
  return (Array.isArray(rows)?rows:[]).map(row=>({
    slug:row.slug,name:row.name,kind:row.kind,category:row.category||row.kind||'Place',
    description:row.description||'',address:row.address||'',postalCode:row.postal_code||null,
    lat:Number(row.latitude),lon:Number(row.longitude),
    distanceM:row.distance_m==null?null:Number(row.distance_m),
    personaScore:Number(row.persona_score)||0,
    sourceKey:row.source_key,sourceUrl:row.source_url||null,
    metadata:row.metadata||{},verifiedAt:row.verified_at||null,
  }));
}
