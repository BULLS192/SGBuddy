/** Food Wave 2.6 report: editorial intake only, no automatic source promotion. */
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base=read('data/food-stalls-v180.json').stalls,guide=read('data/guide-stalls-v230.json').stalls,extra=read('data/food-leads-v261.json').stalls;
const dining=read('data/dining-services-v261.json');
const all=[...guide,...extra,...base],byArea={};
const days=stamp=>{const t=Date.parse(stamp||'');return Number.isFinite(t)?Math.floor((Date.now()-t)/86400000):null};
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const seen=new Set(),duplicates=[],retained=[];
for(const x of all){
 const key=norm(x.name);
 if(seen.has(key)){duplicates.push({id:x.id,name:x.name});continue}
 seen.add(key);retained.push(x);
}
for(const x of retained){const area=x.area||'Unspecified';byArea[area]=(byArea[area]||0)+1}
const needsUnit=extra.filter(x=>!x.stallNumber&&!x.address),oldSource=extra.filter(x=>days(x.guideAsOf)>180);
const queue=[
 ...needsUnit.map(x=>({id:x.id,name:x.name,area:x.area,task:'Find authoritative current centre/stall address, unit and live tenancy',sourceUrl:x.sourceUrl})),
 ...oldSource.map(x=>({id:x.id,name:x.name,area:x.area,task:'Review 2026 guide selection and check current listing status',sourceUrl:x.sourceUrl})),
 ...dining.additions.filter(x=>!x.ios||!x.android).map(x=>({id:x.id,name:x.name,area:'Apps',task:'Check missing official mobile app-store URL(s); do not invent links',sourceUrl:x.sourceUrl}))
];
const output={schemaVersion:1,generatedAt:new Date().toISOString(),
 policy:'Guide or media listing is not confirmation that a stall is currently trading. No in-app review scraping, rating claims, unlicensed media or confirmed reservations. Never infer halal certification or exact menus.',
 counts:{legacyLeads:base.length,original2026Guide:guide.length,additional2026Guide:extra.length,foodCardsAfterDeduplication:retained.length,unverifiedCurrentOperation:retained.filter(x=>x.operatingStatus==='unverified').length,additionalExactUnitsKnown:extra.filter(x=>x.stallNumber).length,diningAddedAppsAndServices:dining.additions.length,diningEnhancedExisting:dining.enhancements.length,serviceGroups:dining.services.length,reviewQueue:queue.length},
 byArea:Object.fromEntries(Object.entries(byArea).sort((a,b)=>b[1]-a[1])),
 duplicateSuppressed:duplicates,
 reviewQueue:queue};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/food-discovery-v261.json',JSON.stringify(output,null,2)+'\n');
const md=['# SGBuddy Food V2.6 editorial coverage — '+output.generatedAt.slice(0,10),'',
 'All new food stall leads have dated 2026 editorial sources. Operating hours, specific stall units, live menus, current prices and dietary status remain unknown unless evidenced separately.','',
 '| Measure | Count |','|---|---:|',
 ...Object.entries(output.counts).map(([k,v])=>'| '+k+' | '+v+' |'),'',
 '## Most covered neighbourhoods','| Area | Leads |','|---|---:|',
 ...Object.entries(output.byArea).slice(0,26).map(([k,v])=>'| '+k+' | '+v+' |'), '',
 '## Editorial follow-up','- Verify stall numbers against current operators/NEA rather than guessing from a centre name.',
 '- Do not republish reviews, photographs, restaurant ratings or discount claims from other publishers.',
 '- Provider links are handoffs: opening Chope or Eatigo does not reserve a table.',
 '- Check dates, current venue operation and exact merchant eligibility before marking verified.',
 '', 'Pending review tasks: '+queue.length].join('\n');
fs.writeFileSync('reports/food-discovery-v261.md',md+'\n');
const cols=['id','name','area','task','sourceUrl'],csv=v=>'"'+String(v??'').replaceAll('"','""').replace(/\n/g,' ')+'"';
fs.writeFileSync('reports/food-review-v261.csv',[cols.join(','),...queue.map(x=>cols.map(k=>csv(x[k])).join(','))].join('\n')+'\n');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md);
console.log('SGBuddy Food V2.6 editorial audit',JSON.stringify(output.counts));
