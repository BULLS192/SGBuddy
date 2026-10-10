/** Batch OneMap address audit — never mark trading status as verified.
 * Usage (credentials already in env):
 *   node scripts/verify-directory.mjs --limit=25 --offset=0
 *   node scripts/verify-directory.mjs --limit=267 --delay=1200
 * Review results before importing any addresses into the permanent catalog.
 */
import fs from 'node:fs';
import {hasOneMapCredentials,searchSingaporeAddresses} from '../lib/onemap.js';
import {selectOneMapMatch} from '../lib/discover-geo.js';
if(!hasOneMapCredentials()){console.error('OneMap credentials not configured; no speculative address data will be written.');process.exit(2)}
const args=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('=')));
const limit=Math.min(300,Math.max(1,Number(args.limit)||25)),offset=Math.max(0,Number(args.offset)||0);
const delay=Math.max(900,Number(args.delay)||1200);
const directory=JSON.parse(fs.readFileSync('data/discover-v120.json','utf8'));
const selected=directory.places.slice(offset,offset+limit);
const outPath='data/place-address-audit.json';
let before={};try{before=JSON.parse(fs.readFileSync(outPath,'utf8'))}catch{}
const entries=new Map((before.items||[]).map(x=>[x.id,x]));
const pause=ms=>new Promise(done=>setTimeout(done,ms));
for(const p of selected){
 let result={id:p.id,name:p.name,area:p.area,status:'unavailable',operationalStatus:'unverified',checkedAt:new Date().toISOString(),address:null};
 try{
   const search=await searchSingaporeAddresses(p.name,{limit:10});
   const ranked=selectOneMapMatch(p,search.items);
   result={...result,status:ranked.status,matchConfidence:ranked.confidence,address:ranked.match||null};
 }catch(error){result.status='provider-unavailable';result.note=String(error.message||'OneMap error').slice(0,120)}
 entries.set(p.id,result);
 // Save after each query to prevent losing earlier work if a rate limit interrupts.
 fs.writeFileSync(outPath,JSON.stringify({schemaVersion:1,source:'OneMap Search API',note:'Matched address does not imply the business is currently open, and ambiguous matches are withheld.',items:[...entries.values()].sort((a,b)=>a.id.localeCompare(b.id))},null,2)+'\n');
 await pause(delay);
}
console.log('Address audit complete',JSON.stringify({checked:selected.length,matched:[...entries.values()].filter(x=>x.status==='address-matched').length,output:outPath}));
