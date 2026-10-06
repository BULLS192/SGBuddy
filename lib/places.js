const normalize=value=>String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
export const CURATED_PLACES=[
{name:'Jewel Changi Airport',aliases:['jewel','jewel changi','changi jewel'],category:'Attraction / Mall',lat:1.360208,lon:103.989759},
{name:'Changi Airport Terminal 1',aliases:['changi t1','terminal 1','airport t1'],category:'Airport',lat:1.36442,lon:103.991531},
{name:'Changi Airport Terminal 2',aliases:['changi t2','terminal 2','airport t2'],category:'Airport',lat:1.355567,lon:103.989869},
{name:'Changi Airport Terminal 3',aliases:['changi t3','terminal 3','airport t3'],category:'Airport',lat:1.356774,lon:103.986233},
{name:'Changi Airport Terminal 4',aliases:['changi t4','terminal 4','airport t4'],category:'Airport',lat:1.338604,lon:103.983198},
{name:'Marina Bay Sands',aliases:['mbs','marina bay sands hotel'],category:'Landmark',lat:1.283399,lon:103.860722},
{name:'Gardens by the Bay',aliases:['gardens by bay','gbtb','supertree grove'],category:'Attraction',lat:1.281568,lon:103.863613},
{name:'Merlion Park',aliases:['merlion'],category:'Landmark',lat:1.286788,lon:103.854519},
{name:'Esplanade',aliases:['esplanade theatres','the durian'],category:'Arts',lat:1.289692,lon:103.855321},
{name:'Suntec City',aliases:['suntec','suntec convention centre'],category:'Mall / Convention',lat:1.293574,lon:103.857244},
{name:'Singapore Flyer',aliases:['flyer'],category:'Attraction',lat:1.289297,lon:103.863137},
{name:'Orchard Road',aliases:['orchard','ion orchard'],category:'Shopping',lat:1.304041,lon:103.831944},
{name:'Bugis Junction',aliases:['bugis'],category:'Shopping',lat:1.299557,lon:103.855363},
{name:'VivoCity',aliases:['vivocity','vivo city'],category:'Mall',lat:1.264371,lon:103.822238},
{name:'Sentosa',aliases:['sentosa island'],category:'Attraction',lat:1.249404,lon:103.830321},
{name:'Universal Studios Singapore',aliases:['uss','universal studios','universal studios singapore'],category:'Attraction',lat:1.254042,lon:103.823809},
{name:'Singapore Zoo',aliases:['zoo','mandai zoo','singapore zoological gardens'],category:'Attraction',lat:1.404344,lon:103.793023},
{name:'Night Safari',aliases:['night safari singapore'],category:'Attraction',lat:1.402347,lon:103.788953},
{name:'Bird Paradise',aliases:['mandai bird paradise','bird park'],category:'Attraction',lat:1.41197,lon:103.78565},
{name:'National University of Singapore',aliases:['nus','national university singapore'],category:'University',lat:1.296643,lon:103.776394},
{name:'Nanyang Technological University',aliases:['ntu','nanyang tech'],category:'University',lat:1.348309,lon:103.683119},
{name:'National Stadium',aliases:['singapore national stadium','sports hub','singapore sports hub'],category:'Stadium',lat:1.304038,lon:103.874327},
{name:'Singapore Expo',aliases:['expo','singapore expo convention'],category:'Convention',lat:1.334761,lon:103.959036},
];
const itemScore=(query,name,aliases=[])=>{const q=normalize(query),terms=[name,...aliases].map(normalize);if(!q)return 0;if(terms.includes(q))return 100;if(terms.some(x=>x.startsWith(q)))return 90;if(terms.some(x=>x.includes(q)))return 78;const words=q.split(' ').filter(Boolean);if(words.length>1&&terms.some(x=>words.every(w=>x.includes(w))))return 70;return 0};
export function findKnownPlace(query){const q=normalize(query);if(!q)return null;const exact=CURATED_PLACES.find(p=>[p.name,...p.aliases].map(normalize).includes(q));return exact?{type:'poi',label:exact.name,name:exact.name,category:exact.category,lat:exact.lat,lon:exact.lon}:null}
export function searchPlaces(query,{index,busStops=[],limit=8}={}){const q=normalize(query);if(!q)return [];const out=[];for(const place of CURATED_PLACES){const score=itemScore(q,place.name,place.aliases);if(score)out.push({score,type:'poi',label:place.name,subtitle:place.category,value:place.name,lat:place.lat,lon:place.lon})}for(const station of index?.stations||[]){const code=station.codes?.[0]||station.id;const codeMatch=(station.codes||[]).some(c=>normalize(c)===q);const score=codeMatch?99:itemScore(q,station.name,station.codes||[]);if(score)out.push({score:score+1,type:'station',label:station.name,subtitle:(station.codes||[]).join(' · ')+' · MRT/LRT',value:code,code,lat:station.lat,lon:station.lon})}for(const stop of busStops){const code=String(stop.BusStopCode||'');const name=stop.Description||`Bus Stop ${code}`;const road=stop.RoadName||'';let score=code===q?100:itemScore(q,name,[road,code]);if(!score)continue;if(code===q)score=102;out.push({score,type:'bus-stop',label:name,subtitle:`Stop ${code}${road?' · '+road:''}`,value:code,code,lat:Number(stop.Latitude),lon:Number(stop.Longitude)})}const seen=new Set();return out.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label)).filter(item=>{const key=item.type+'|'+item.value;if(seen.has(key))return false;seen.add(key);return true}).slice(0,limit).map(({score,...item})=>item)}
