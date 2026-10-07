
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Spec = {
  key:string; dataset:string; kind:string; category:string; description:string;
  scores:Record<string,number>; format:"geojson"|"kml";
};

const SOURCES:Record<string,Spec>={
  hawker:{key:"nea_hawker_geo",dataset:"d_4a086da0a5553be1d89383cd90d07ecd",kind:"food",category:"Hawker centre",description:"Government-listed hawker centre.",scores:{resident:94,visitor:96,executive:76,new_in_sg:96},format:"geojson"},
  parks:{key:"nparks_parks_geo",dataset:"d_0542d48f0991541706b58059381a6eca",kind:"poi",category:"Park",description:"NParks-managed park.",scores:{resident:90,visitor:82,executive:58,new_in_sg:90},format:"geojson"},
  libraries:{key:"nlb_libraries_geo",dataset:"d_27b8dae65d9ca1539e14d09578b17cbf",kind:"education",category:"Library",description:"National Library Board location.",scores:{resident:82,visitor:42,executive:46,new_in_sg:86},format:"geojson"},
  community:{key:"pa_community_clubs_geo",dataset:"d_f706de1427279e61fe41e89e24d440fa",kind:"service",category:"Community club",description:"People's Association community location.",scores:{resident:88,visitor:28,executive:40,new_in_sg:98},format:"geojson"},
  health:{key:"moh_chas_geo",dataset:"d_548c33ea2d99e29ec63a7cc9edcccedc",kind:"health",category:"CHAS clinic",description:"MOH-listed CHAS clinic.",scores:{resident:96,visitor:58,executive:72,new_in_sg:98},format:"geojson"},
  childcare:{key:"ecda_childcare_geo",dataset:"d_5d668e3f544335f8028f546827b773b4",kind:"service",category:"Childcare",description:"ECDA-listed child care service.",scores:{resident:84,visitor:5,executive:15,new_in_sg:86},format:"geojson"},
  supermarkets:{key:"sfa_supermarkets_kml",dataset:"d_8a77ee0446716b2ce475a587004afc73",kind:"shopping",category:"Supermarket",description:"SFA-listed supermarket.",scores:{resident:99,visitor:62,executive:62,new_in_sg:99},format:"kml"},
};

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SECRET_KEYS=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
const SECRET_KEY=SECRET_KEYS.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const apiHeaders=()=>({apikey:SECRET_KEY,"Content-Type":"application/json",Accept:"application/json"});

function decode(s:string){
  return String(s||"").replace(/<br\s*\/?>/gi," ").replace(/<[^>]+>/g," ")
    .replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
    .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
}
function attrs(html:string){
  const out:Record<string,string>={}; const re=/<th[^>]*>(.*?)<\/th>\s*<td[^>]*>(.*?)<\/td>/gis; let m;
  while((m=re.exec(String(html||"")))){const k=decode(m[1]).toUpperCase().replace(/\s+/g,"_");const v=decode(m[2]);if(k&&v)out[k]=v}
  const dataRe=/<Data[^>]+name=["']([^"']+)["'][^>]*>[\s\S]*?<value>([\s\S]*?)<\/value>[\s\S]*?<\/Data>/gi;
  while((m=dataRe.exec(String(html||"")))){const k=decode(m[1]).toUpperCase().replace(/\s+/g,"_");const v=decode(m[2]);if(k&&v)out[k]=v}
  return out;
}
function cleanSlug(s:string){return String(s||"place").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,90)||"place"}
function validCoord(lon:any,lat:any){return Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&Number(lat)>=1&&Number(lat)<=1.6&&Number(lon)>=103.4&&Number(lon)<=104.2}
function makeAddress(a:Record<string,string>){
  const block=a.ADDRESSBLOCKHOUSENUMBER||a.BLK_HSE_NO||"";
  const street=a.ADDRESSSTREETNAME||a.STREET_NAME||"";
  const building=a.ADDRESSBUILDINGNAME||a.BUILDING_NAME||"";
  const base=[block,street].filter(Boolean).join(" ").trim();
  return [base,building].filter(Boolean).join(", ").trim()||null;
}
function rowFromFeature(spec:Spec,f:any,index:number){
  if(f?.geometry?.type!=="Point")return null;
  const [lon,lat]=f.geometry.coordinates||[]; if(!validCoord(lon,lat))return null;
  const p=f.properties||{}, a={...attrs(p.Description||p.DESCRIPTION||""),...Object.fromEntries(Object.entries(p).map(([k,v])=>[k.toUpperCase(),v==null?"":String(v)]))};
  const name=decode(a.HCI_NAME||a.NAME||a.ADDRESSBUILDINGNAME||p.Name||p.NAME||"");
  if(!name||/^kml_\d+$/i.test(name))return null;
  const ref=String(a.OBJECTID||a.HCI_CODE||a.INC_CRC||`${index}-${name}`);
  const postal=String(a.ADDRESSPOSTALCODE||a.POSTAL_CD||"").replace(/\D/g,"").slice(0,6)||null;
  const address=makeAddress(a);
  const sourceUrl=`https://data.gov.sg/datasets/${spec.dataset}/view`;
  return {
    slug:`${spec.key}-${cleanSlug(ref)}`,name,aliases:[],kind:spec.kind,category:spec.category,
    geo:`POINT(${Number(lon)} ${Number(lat)})`,description:decode(a.DESCRIPTION)||spec.description,
    address,postal_code:postal,source_key:spec.key,source_ref:ref,source_url:sourceUrl,
    verified_at:new Date().toISOString(),active:true,
    metadata:{persona_scores:spec.scores,catalog_layer:"official_place_index",dataset_id:spec.dataset,official:true}
  };
}
function parseGeoJson(spec:Spec,text:string){
  const j=JSON.parse(text); const fs=Array.isArray(j?.features)?j.features:[];
  return fs.map((f:any,i:number)=>rowFromFeature(spec,f,i)).filter(Boolean);
}
function tag(block:string,name:string){const m=block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`,"i"));return m?decode(m[1].replace(/^<!\[CDATA\[|\]\]>$/g,"")):""}
function parseKml(spec:Spec,text:string){
  const blocks=text.match(/<Placemark\b[\s\S]*?<\/Placemark>/gi)||[]; const rows:any[]=[];
  blocks.forEach((b,i)=>{
    const coord=(b.match(/<coordinates[^>]*>\s*([^<]+)\s*<\/coordinates>/i)||[])[1]||"";
    const [lon,lat]=coord.trim().split(",").map(Number); if(!validCoord(lon,lat))return;
    const extra=attrs(b); const name=tag(b,"name")||extra.NAME||extra.LICENCE_NAME||extra.BUSINESS_NAME; if(!name)return;
    const ref=String(extra.OBJECTID||extra.LICENCE_NO||extra.INC_CRC||`${i}-${name}`);
    const postal=String(extra.ADDRESSPOSTALCODE||extra.POSTALCODE||extra.POSTAL_CD||"").replace(/\D/g,"").slice(0,6)||null;
    rows.push({slug:`${spec.key}-${cleanSlug(ref)}`,name,aliases:[],kind:spec.kind,category:spec.category,
      geo:`POINT(${lon} ${lat})`,description:spec.description,address:makeAddress(extra),postal_code:postal,
      source_key:spec.key,source_ref:ref,source_url:`https://data.gov.sg/datasets/${spec.dataset}/view`,
      verified_at:new Date().toISOString(),active:true,metadata:{persona_scores:spec.scores,catalog_layer:"official_place_index",dataset_id:spec.dataset,official:true}});
  });
  return rows;
}
async function rest(path:string,init:RequestInit={}){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...apiHeaders(),...(init.headers||{})}});
  if(!r.ok)throw new Error(`${path} ${r.status}: ${(await r.text()).slice(0,300)}`);
  const text=await r.text(); return text?JSON.parse(text):null;
}
async function syncSource(spec:Spec){
  const prior=await rest(`data_sources?source_key=eq.${encodeURIComponent(spec.key)}&select=last_verified_at,default_ttl_seconds&limit=1`);
  const row=prior?.[0], ttl=Math.max(3600,Number(row?.default_ttl_seconds)||86400);
  const last=Date.parse(row?.last_verified_at||"");
  if(Number.isFinite(last)&&Date.now()-last<ttl*1000)return {source:spec.key,skipped:true,reason:"fresh",lastVerifiedAt:row.last_verified_at};

  const poll=await fetch(`https://api-open.data.gov.sg/v1/public/api/datasets/${spec.dataset}/poll-download`,{headers:{Accept:"application/json"}});
  if(!poll.ok)throw new Error(`poll ${spec.dataset} ${poll.status}`);
  const pj=await poll.json(); if(Number(pj?.code||0)!==0||!pj?.data?.url)throw new Error(pj?.errMsg||`No download URL for ${spec.dataset}`);
  const file=await fetch(pj.data.url); if(!file.ok)throw new Error(`download ${spec.dataset} ${file.status}`);
  const text=await file.text();
  const rows=spec.format==="kml"?parseKml(spec,text):parseGeoJson(spec,text);
  for(let i=0;i<rows.length;i+=200){
    await rest("place_catalog?on_conflict=slug",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows.slice(i,i+200))});
  }
  await rest(`data_sources?source_key=eq.${encodeURIComponent(spec.key)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({last_verified_at:new Date().toISOString(),updated_at:new Date().toISOString()})});
  return {source:spec.key,skipped:false,count:rows.length};
}

Deno.serve(async(req)=>{
  if(!SECRET_KEY)return Response.json({ok:false,error:"Missing Supabase secret key"},{status:500});
  const url=new URL(req.url), source=url.searchParams.get("source")||"";
  if(source==="all"){
    const results=[]; for(const spec of Object.values(SOURCES)){try{results.push(await syncSource(spec))}catch(error){results.push({source:spec.key,error:String(error)})}}
    return Response.json({ok:true,results});
  }
  const spec=SOURCES[source]; if(!spec)return Response.json({ok:false,error:"Unknown source",allowed:Object.keys(SOURCES)},{status:400});
  try{return Response.json({ok:true,result:await syncSource(spec)},{headers:{"Cache-Control":"no-store"}})}
  catch(error){return Response.json({ok:false,source:spec.key,error:String(error)},{status:500})}
});
