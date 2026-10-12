/* SGBuddy V3.8 executable/conditional text inventory.
 * Read-only heuristics; no assertion that a found string is user-visible or
 * untranslated. Distinguish current executable modules from archived builds
 * and backend/provider text before requesting human classification. */
import fs from 'node:fs';
const read=file=>fs.readFileSync(file,'utf8');
const root=fs.readdirSync('.');
const allApp=root.filter(x=>/^app.*\.js$/.test(x)).sort();
const appActive=new Set(['app-v090.js']);
const pending=['app-v090.js'];
while(pending.length){
 const file=pending.pop();const source=read(file);
 for(const hit of source.matchAll(/\bimport\s*\(\s*['"]\/?(app[^'"]+\.js)['"]\s*\)/g)){
  const next=hit[1];if(!allApp.includes(next)||appActive.has(next))continue;
  appActive.add(next);pending.push(next);
 }
}
const groups={
 activeClient:[...appActive].sort(),
 archivedClient:allApp.filter(x=>!appActive.has(x)),
 backend:fs.readdirSync('api').filter(n=>n.endsWith('.js')).map(n=>'api/'+n).sort(),
 backendLibraries:fs.readdirSync('lib').filter(n=>n.endsWith('.js')).map(n=>'lib/'+n).sort()
};
const patterns=[
 {kind:'toast',expression:/\btoast\s*\(\s*(['"])([^'"\n]{4,220})\1/g},
 {kind:'accountMessage',expression:/\baccountMessage\s*\(\s*(['"])([^'"\n]{4,220})\1/g},
 {kind:'textContent',expression:/\.textContent\s*=\s*(['"])([^'"\n]{4,220})\1/g},
 {kind:'innerHTML',expression:/\.innerHTML\s*=\s*(['"])([^'"\n]{4,220})\1/g},
 {kind:'placeholder',expression:/\.placeholder\s*=\s*(['"])([^'"\n]{4,220})\1/g},
 {kind:'busy',expression:/\bwithBusy\s*\([^,]+,\s*(['"])([^'"\n]{4,220})\1/g},
 {kind:'serverError',expression:/\b(?:error|message|warning)\s*:\s*(['"])([^'"\n]{4,220})\1/g},
 {kind:'alert',expression:/\balert\s*\(\s*(['"])([^'"\n]{4,220})\1/g}
];
function candidate(text){
 return /[a-z]{3}/i.test(text)&&!/^https?:|^\/api\/|^<svg|^<div|^<button|^\{/.test(text)&&!/^\w+\.(?:js|json|mjs)$/.test(text);
}
const summary={};
for(const [group,files] of Object.entries(groups)){
 const hits=[];
 for(const file of files){
  const code=read(file);
  for(const {kind,expression} of patterns){
   for(const hit of code.matchAll(expression)){
    const value=hit[2].trim();
    if(!candidate(value))continue;
    const line=code.slice(0,hit.index).split('\n').length;
    hits.push({file,line,kind,value});
   }
  }
 }
 const unique=[...new Map(hits.map(x=>[x.file+':'+x.line+':'+x.kind,x])).values()];
 summary[group]={files,filesScanned:files.length,outputCandidates:unique.length,samples:unique.slice(0,35)};
}
export const dynamicInventory=summary;
export const dynamicAuditPolicy='All outputCandidates require source/visibility/locale classification. No literal is assumed untranslated. Archived-client candidates are NOT current screen coverage; backend and libraries may own provider data.';
