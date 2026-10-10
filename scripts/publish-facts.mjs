/**
 * SGBuddy editorial publisher.
 * Example: node scripts/publish-facts.mjs content/facts-approved.json
 * Accepts ONLY status=verified, immutable source links and unique normalized claims.
 * No network scraping, no automatic "verification" assertions.
 */
import fs from 'node:fs';
import path from 'node:path';
const input=process.argv[2]||'content/facts-approved.json';
const output=process.argv[3]||'data/facts-published.json';
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(rows))throw new Error('Input must be a JSON array');
const modes=new Set(['resident','visitor','executive','student','new_in_sg']);
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const accepted=[],ids=new Set(),claims=new Set();
let pending=0;
for(const row of rows){
  if(!row||row.status!=='verified'){pending++;continue}
  if(!/^FACT-[a-zA-Z0-9_-]{3,40}$/.test(String(row.id||'')))throw new Error('Bad fact ID: '+String(row.id));
  if(ids.has(row.id))throw new Error('Duplicate ID: '+row.id);
  ids.add(row.id);
  const text=String(row.text||'').trim(),key=normalize(text);
  if(text.length<15||text.length>600)throw new Error('Bad claim length: '+row.id);
  if(claims.has(key))throw new Error('Duplicate claim: '+row.id);
  claims.add(key);
  const u=new URL(row.sourceUrl);
  if(u.protocol!=='https:'||!u.hostname.includes('.'))throw new Error('Non-HTTPS primary source: '+row.id);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(row.verifiedOn||''))||Number.isNaN(Date.parse(row.verifiedOn+'T00:00:00Z')))throw new Error('Missing review date: '+row.id);
  if(!String(row.reviewedBy||'').trim())throw new Error('Missing reviewer: '+row.id);
  if(row.reviewMethod!=='primary-source-check')throw new Error('Claim needs primary-source review: '+row.id);
  if(String(row.evidenceNote||'').trim().length<12)throw new Error('Missing source evidence note: '+row.id);
  if(!Array.isArray(row.modes)||row.modes.length===0||row.modes.some(x=>!modes.has(x)))throw new Error('Invalid persona tags: '+row.id);
  accepted.push({id:row.id,theme:String(row.theme||'Singapore'),text,sourceUrl:u.href,modes:[...new Set(row.modes)],verifiedOn:row.verifiedOn,reviewedBy:row.reviewedBy,reviewMethod:row.reviewMethod,evidenceNote:row.evidenceNote,status:'verified'});
}
accepted.sort((a,b)=>a.id.localeCompare(b.id));
const bundle={schemaVersion:3,publishedOn:new Date().toISOString().slice(0,10),verifiedCount:accepted.length,facts:accepted};
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(bundle,null,2)+'\n');
console.log('Published '+accepted.length+' independently approved facts; excluded '+pending+' pending candidates -> '+output);
