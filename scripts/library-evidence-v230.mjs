/** Source quality and neighbourhood coverage: non-destructive, no automatic promotion. */
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const operators=read('data/operator-listings-v230.json').places;
const guides=read('data/guide-stalls-v230.json').stalls;
const menus=read('data/operator-menus-v230.json');
const neighbourhoods=read('data/neighbourhoods-v230.json').neighbourhoods;
const legacy=read('data/food-stalls-v180.json').stalls;
const vendor=read('data/vendor-menus-v210.json').items;
const now=Date.now();
const days=date=>{const d=Date.parse(date||'');return Number.isFinite(d)?Math.max(0,Math.floor((now-d)/86400000)):null};
const csv=v=>'"'+String(v??'').replaceAll('"','""').replace(/\r?\n/g,' ')+'"';
const byHost=items=>Object.fromEntries([...new Set(items.map(x=>new URL(x.sourceUrl).hostname))].map(host=>[host,items.filter(x=>new URL(x.sourceUrl).hostname===host).length]));
const stale=operators.filter(p=>days(p.sourceCheckedOn)==null||days(p.sourceCheckedOn)>90);
const oldGuide=guides.filter(p=>days(p.guideAsOf)==null||days(p.guideAsOf)>365);
const collisions=[],keys=new Set();
for(const p of operators){
 const key=p.operator+'|'+p.postal;
 if(keys.has(key))collisions.push(key);
 keys.add(key);
}
const matches=(place,n)=>{const x=[place.name,place.area,place.address,place.street,place.centreName].filter(Boolean).join(' ').toLowerCase();return n.aliases.some(a=>x.includes(a.toLowerCase()))};
const coverage=neighbourhoods.map(n=>({name:n.name,region:n.region,operatorLocations:operators.filter(p=>matches(p,n)).length,guideStalls:guides.filter(p=>matches(p,n)).length}));
const gap=coverage.filter(r=>r.operatorLocations+r.guideStalls===0);
const reviewQueue=[
 ...stale.map(x=>({id:x.id,name:x.name,review:'Operator address listing older than 90 days',sourceUrl:x.sourceUrl})),
 ...oldGuide.map(x=>({id:x.id,name:x.name,review:'MICHELIN guide listing older than 365 days',sourceUrl:x.sourceUrl})),
 ...gap.map(x=>({id:'NEIGH-'+x.name,name:x.name,review:'No V2.3 first-party operator or 2026-guide coverage — editorial priority',sourceUrl:''}))
];
const summary={
 schemaVersion:1,generatedAt:new Date(now).toISOString(),
 policy:'First-party operator listings and 2026 guide records establish provenance, never open-now, operating licence, tenancy or stock. Stale source dates do not get silently refreshed.',
 counts:{baselineDirectory:2949,operatorLocations:operators.length,directoryWithOperator:2949+operators.length,historicalHawkerLeads:legacy.length,guide2026HawkerStalls:guides.length,hawkerMenuItems:menus.hawkerMenus.length,legacyVendorMenus:vendor.length,newVendorMenus:menus.vendorMenus.length,neighbourhoods:neighbourhoods.length,liveOperationConfirmed:0},
 sourceBreakdown:byHost([...operators,...guides,...menus.hawkerMenus,...menus.vendorMenus]),
 neighbourhoodCoverage:coverage,
 flags:{duplicateOperatorPostal:collisions,olderThan90DayOperator:stale.length,guideOlderThan365Days:oldGuide.length,neighbourhoodsNeedingReview:gap.length},
 reviewQueue
};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/library-evidence-v230.json',JSON.stringify(summary,null,2)+'\n');
const md=['# SGBuddy V2.3 content quality — '+summary.generatedAt.slice(0,10),'','**Evidence ≠ current operation. 0 establishments individually confirmed open-now.**','','| Metric | Records |','|---|---:|',
 ...Object.entries(summary.counts).map(([key,v])=>'| '+key+' | '+v+' |'),
 '','## Neighbourhood evidence','| Area | Operator listings | Guide stalls |','|---|---:|---:|',
 ...coverage.map(x=>'| '+x.name+' | '+x.operatorLocations+' | '+x.guideStalls+' |'),
 '','## Review queue','Records needing attention: '+reviewQueue.length,'','## Policy',
 '- Do not infer current operation, licence, halal, allergens, menus or prices from address/source links.',
 '- Review store/operator addresses within 90 days; guide-recognised stalls within 365 days.',
 '- Run current CHAS/SFA verification separately; never promote historical government records automatically.',''].join('\n');
fs.writeFileSync('reports/library-evidence-v230.md',md);
const headers=['id','name','review','sourceUrl'];
fs.writeFileSync('reports/library-review-queue-v230.csv',[headers.join(','),...reviewQueue.map(x=>headers.map(k=>csv(x[k])).join(','))].join('\n')+'\n');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md);
if(collisions.length)throw Error('Duplicate operator + postal key: '+collisions.join(', '));
console.log('SGBuddy V2.3 evidence audit:',JSON.stringify(summary.counts),'; review queue',reviewQueue.length);
