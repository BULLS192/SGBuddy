/* SGBuddy V2.4 — offline-safe editorial app catalogue audit, no auto-publishing. */
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('data/everyday-apps-v240.json','utf8'));
const rows=data.catalogue,now=Date.now();
const age=d=>{const t=Date.parse(d||'');return Number.isFinite(t)?Math.floor((now-t)/86400000):null};
const by=(fn)=>Object.fromEntries([...new Set(rows.map(fn))].sort().map(v=>[v,rows.filter(x=>fn(x)===v).length]));
const counts={
 total:rows.length,
 mobileApps:rows.filter(x=>x.kind==='mobile-app').length,
 webServices:rows.filter(x=>x.kind==='web-service').length,
 iosLinked:rows.filter(x=>x.ios).length,
 androidLinked:rows.filter(x=>x.android).length,
 uniqueWithDirectStoreLink:rows.filter(x=>x.ios||x.android).length,
 sourcePagesNotRevalidatedLive:rows.length
};
const byCategory=by(x=>x.category);
const byImportance=by(x=>x.importance);
const personas=['resident','visitor','executive','student'];
const byPersona=Object.fromEntries(personas.map(m=>[m,rows.filter(x=>x.modes.includes(m)).length]));
const queue=rows.filter(x=>x.kind==='mobile-app'&&!x.ios&&!x.android).map(x=>({id:x.id,name:x.name,priority:x.importance,category:x.category,need:'Verify exact iOS/Android listing from publisher and official developer',sourceUrl:x.sourceUrl}));
const stale=rows.filter(x=>age(x.cataloguedOn)===null||age(x.cataloguedOn)>90).map(x=>({id:x.id,name:x.name,need:'Re-review catalogue and publisher links after 90 days',sourceUrl:x.sourceUrl}));
const out={
 schemaVersion:1,generatedAt:new Date().toISOString(),
 notice:'Editorial catalogue, not evidence of active app listings, app-store availability, subscription prices, or account eligibility. Checking a publisher homepage is not validation of an app-store download.',
 counts,byCategory,byImportance,byPersona,
 queueMissingOfficialStoreLinks:queue.length,
 queueStaleEditorialReview:stale.length,
 reviewQueue:[...queue,...stale]
};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/apps-quality-v240.json',JSON.stringify(out,null,2)+'\n');
const markdown=[
 '# SGBuddy V2.4 — Apps & Digital Services Quality Report',
 '',
 'Generated '+out.generatedAt+'. Catalogue-only review; no installs, bank sign-in or live checks.',
 '',
 '| Metric | Count |','|---|---:|',...Object.entries(counts).map(([k,v])=>'| '+k+' | '+v+' |'),
 '',
 '## Category breadth','| Category | Count |','|---|---:|',...Object.entries(byCategory).map(([k,v])=>'| '+k+' | '+v+' |'),
 '',
 '## By SGBuddy mode','| Mode | Entries |','|---|---:|',...Object.entries(byPersona).map(([k,v])=>'| '+k+' | '+v+' |'),
 '',
 '## Trust and disclosure',
 '- Install through the first-party publisher page, or a store deep-link known to identify the correct developer.',
 '- No guessed marketplace links; missing store deep-links are manual-review queue items.',
 '- Do not claim linked services are official app-store downloads unless a valid store URL is present.',
 '- Never accept banking passwords, Singpass login details or OTPs inside SGBuddy.',
 '- CDC Vouchers, OneService via LifeSG, onePA and MySkillsFuture are distinguished from downloadable apps.',
 '- Catalogue dates mark editorial entry creation, **not** a confirmed live store review.',
 '',
 '## Next review steps',
 '- Add publisher-confirmed iOS and Android store URLs only after matching developer identities.',
 '- Re-check newly consolidated app ecosystem and services quarterly; remove outdated or merged entries.',
 '- Review user-reported broken links before publishing changes.',
 ''
].join('\n');
fs.writeFileSync('reports/apps-quality-v240.md',markdown);
const csv=v=>'"'+String(v??'').replaceAll('"','""').replace(/\r?\n/g,' ')+'"';
const cols=['id','name','priority','category','need','sourceUrl'];
fs.writeFileSync('reports/apps-review-v240.csv',[cols.join(','),...out.reviewQueue.map(x=>cols.map(k=>csv(x[k])).join(','))].join('\n')+'\n');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown);
console.log('SGBuddy V2.4 App Library evidence:',JSON.stringify(counts),'; official store link gaps:',queue.length);
