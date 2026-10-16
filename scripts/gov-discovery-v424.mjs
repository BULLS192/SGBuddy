/* V4.24 official newsroom discovery. Candidate-only; NEVER writes approved notices. */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {officialUrl} from '../lib/essentials-v424.mjs';
const FEED=new URL('../data/gov-notices-v424.json',import.meta.url);
const matchers={
  ica:/\/news-and-publications\/newsroom\/(media-release|article|feature)\//i,
  mom:/\/newsroom\/(press-releases|announcements)\//i,
  moe:/\/news\/(press-releases|parliamentary-replies|speeches)\//i,
  lta:/\/newsroom\/20\d{2}\//i,
  nea:/\/media\/news\/(news|advisories)\//i,
  iras:/\/news-events\/newsroom\/.+/i
};
function decode(input){
 return String(input).replace(/<[^>]*>/g,' ').replace(/&(?:amp|nbsp|quot|apos|lt|gt);/gi,m=>({'&amp;':'&','&nbsp;':' ','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'}[m.toLowerCase()]||m))
 .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code))).replace(/\s+/g,' ').trim();
}
export function extractCandidates(html,source){
 const rule=matchers[source.id];if(!rule)return [];
 const found=new Map();
 for(const a of String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)){
  const href=a[1].match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];if(!href)continue;
  let full;try{full=new URL(href,source.url)}catch{continue}
  const normalized=officialUrl(full.href);if(!normalized||!rule.test(full.pathname))continue;
  full.hash='';full.search='';const url=full.href;
  const title=decode(a[2]);if(title.length<22||title.length>240||/^(read more|learn more|details)$/i.test(title))continue;
  if(!found.has(url))found.set(url,{title,url,agency:source.agency,sourceId:source.id,reviewStatus:'needs-review'});
  if(found.size>=50)break;
 }
 return [...found.values()];
}
export async function collectSources(sources,loader=async url=>{
 const response=await fetch(url,{headers:{'User-Agent':'SGBuddy-Gov-Source-Review/4.24 (+https://sgbuddy.omnidite.com)'},signal:AbortSignal.timeout(14000)});
 if(!response.ok)throw Error('HTTP '+response.status);return response.text();
}){
 const coverage=[],found=new Map();
 for(const source of sources){
  try{
   if(!officialUrl(source.url))throw Error('unapproved source host');
   const html=await loader(source.url);
   const rows=extractCandidates(html,source);
   for(const row of rows)found.set(row.url,row);
   coverage.push({agency:source.agency,ok:true,candidates:rows.length});
  }catch(error){coverage.push({agency:source.agency,ok:false,error:String(error?.message||error).slice(0,200),candidates:0})}
 }
 return {coverage,candidates:[...found.values()]};
}
async function main(){
 const args=process.argv.slice(2);if(!args.includes('--output'))return;
 const path=args[args.indexOf('--output')+1];if(!path)throw Error('--output requires a file path');
 const feed=JSON.parse(await readFile(FEED,'utf8'));
 const result=await collectSources(feed.sources||[]);
 const already=new Set((feed.notices||[]).map(x=>x.sourceUrl));
 const candidates=result.candidates.filter(x=>!already.has(x.url)).slice(0,120);
 const output={generatedAt:new Date().toISOString(),sourceOfTruth:'official agency links only',status:'not-approved-for-publication',coverage:result.coverage,candidates};
 await writeFile(path,JSON.stringify(output,null,2)+'\n');
 const healthy=result.coverage.filter(x=>x.ok).length;
 process.stdout.write('Government newsroom review: '+healthy+'/'+result.coverage.length+' sources reachable; '+candidates.length+' unapproved candidates\n');
 for(const row of result.coverage)process.stdout.write('- '+row.agency+': '+(row.ok?row.candidates+' candidates':row.error)+'\n');
 if(!healthy)process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main().catch(error=>{console.error(error);process.exitCode=1});
