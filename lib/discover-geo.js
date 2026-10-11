/* Conservative OneMap place matcher. A matching address is NOT proof a venue is open. */
export function normalizePlace(value){
 return String(value||'').normalize('NFKC').toLowerCase().replace(/&/g,' and ')
 .replace(/[^a-z0-9]+/g,' ').replace(/\b(the|singapore|sg)\b/g,' ').replace(/\s+/g,' ').trim();
}
export function matchingConfidence(name,area,row){
 const expected=normalizePlace(name),aliases=[row.label,row.building,row.address,row.searchVal].filter(Boolean).map(normalizePlace);
 if(!expected || !aliases.length)return {score:0,reason:'no-entity-match'};
 if(aliases.some(v=>v===expected))return {score:1,reason:'exact-name'};
 if(aliases.some(v=>v.startsWith(expected+' ')||v.includes(' '+expected+' ')))return {score:.94,reason:'name-contained'};
 const e=new Set(expected.split(' ').filter(t=>t.length>2&&!['food','centre','market','hawker','shopping','mall','park'].includes(t)));
 if(!e.size)return {score:0,reason:'generic-name'};
 const areaParts=normalizePlace(area).split(' ').filter(t=>t.length>2);
 let best=0;
 for(const t of aliases){
   const tokens=new Set(t.split(' '));
   const covered=[...e].filter(k=>tokens.has(k)).length/e.size;
   const distinct=e.size>=2;
   const areaContext=areaParts.some(v=>tokens.has(v));
   best=Math.max(best,distinct&&covered===1?(areaContext?.89:.83):covered>=.75&&areaContext?.76:0);
 }
 return {score:best,reason:best>=.89?'tokens-and-area':best>0?'partial-name':'no-entity-match'};
}
export function selectOneMapMatch(place,items=[]){
 const ranked=items.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&x.lat>1.12&&x.lat<1.49&&x.lon>103.58&&x.lon<104.12)
 .map(row=>({...row,match:matchingConfidence(place.name,place.area,row)})).sort((a,b)=>b.match.score-a.match.score);
 const first=ranked[0];
 if(!first)return {status:'not-found',confidence:0,match:null};
 // Require a strong entity match, NOT merely a successful OneMap street result.
 if(first.match.score<.89)return {status:'ambiguous',confidence:first.match.score,match:null,candidateCount:ranked.length};
 if(ranked[1]&&ranked[1].match.score>=first.match.score&&ranked[1].postal!==first.postal)return {status:'ambiguous',confidence:first.match.score,match:null,candidateCount:ranked.length};
 return {status:'address-matched',confidence:first.match.score,
 match:{label:first.label,address:first.address,postal:first.postal||null,lat:first.lat,lon:first.lon}};
}
