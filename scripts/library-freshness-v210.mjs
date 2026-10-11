/** Non-destructive source freshness / content regression audit.
 * Produces a review report. Never asserts a place or stall is operating today.
 */
import fs from 'node:fs';
const read=(p,fallback=null)=>{try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{return fallback}};
const now=new Date(),today=now.toISOString().slice(0,10);
const services=read('data/services-v210.json',{places:[],sources:[]});
const places=read('data/official-places-v200.json',{places:[],sources:[]});
const curated=read('data/discover-v120.json',{places:[],apps:[]});
const stalls=read('data/food-stalls-v180.json',{stalls:[]});
const dishes=read('data/singapore-dishes-v180.json',{dishes:[]});
const menus=read('data/vendor-menus-v210.json',{items:[]});
const facts=read('data/facts-published.json',{facts:[]});
const prev=read('reports/library-freshness-v210.json');
const allSources=[...places.sources,...services.sources];
const sourceRows=allSources.map(s=>{
 const coverage=s.coverageAsOf||s.asOf||null,ageDays=coverage?Math.floor((now-new Date(coverage))/86400000):null;
 return {agency:s.agency||s.key,datasetId:s.datasetId||null,status:s.status||'not-provided',coverageAsOf:coverage,coverageAgeDays:Number.isFinite(ageDays)?ageDays:null,
 recordsImported:s.accepted??0,review:s.status!=='ok'?'source-fetch-failed':ageDays==null?'coverage-date-missing':ageDays>730?'historical-source-older-than-two-years':ageDays>365?'source-over-one-year-old':'currentish-source-snapshot-not-live'};
});
const counts={
 curatedPlaces:curated.places.length,officialPlaces:places.places.length,services:services.places.length,
 physicalPlaceEntries:curated.places.length+places.places.length+services.places.length,
 stallCandidates:stalls.stalls.length,dishVocabulary:dishes.dishes.length,
 vendorMenuItems:menus.items.length,
 sourceCheckedFacts:facts.facts.length,usefulApps:curated.apps.length
};
const sourceKeys=[...new Set([...places.places,...services.places].map(p=>p.id))];
const oldKeys=new Set(prev?.recordIds||[]);
const added=prev?sourceKeys.filter(x=>!oldKeys.has(x)):[],current=new Set(sourceKeys),removed=prev?(prev.recordIds||[]).filter(x=>!current.has(x)):[];
const warnings=[];
if(sourceRows.some(x=>x.status!=='ok'))warnings.push('One or more official datasets failed or were unavailable at their last attempted refresh.');
if(sourceRows.some(x=>x.review==='historical-source-older-than-two-years'))warnings.push('Some original datasets cover periods more than two years old. Source download date must not substitute for coverage date.');
if(removed.length>Math.max(20,Math.round(oldKeys.size*.12)))warnings.push('Large source-record reduction since prior report; investigate before promotion.');
if(services.places.length<500)warnings.push('Health/essentials source coverage reduced to fewer than 500 records.');
if(menus.items.some(x=>x.priceSgd!=null))warnings.push('Published vendor menu prices are snapshots, not live quotations.');
const summary={schemaVersion:1,generatedAt:now.toISOString(),checkedDate:today,status:warnings.some(x=>/reduction|reduced|failed/.test(x))?'review-required':'information',
 labels:'This is a snapshot-source health report, NOT verification that every listed establishment or menu item is open or available.',
 counts,delta:{addedCount:added.length,removedCount:removed.length,addedIds:added.slice(0,150),removedIds:removed.slice(0,150)},sources:sourceRows,warnings,
 recordIds:sourceKeys.sort()};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/library-freshness-v210.json',JSON.stringify(summary,null,2)+'\n');
const md=['# SGBuddy Library Source Freshness · '+today,'','**Status:** '+summary.status,'',
 '| Collection | Records |','|---|---:|',...Object.entries(counts).map(([k,v])=>'| '+k+' | '+v+' |'),
 '','## Source health','| Agency | Original coverage | Age (days) | Records | Review |','|---|---|---:|---:|---|',
 ...sourceRows.map(x=>'| '+x.agency+' | '+(x.coverageAsOf||'Unknown')+' | '+(x.coverageAgeDays??'—')+' | '+x.recordsImported+' | '+x.review+' |'),
 '','## Changes since prior report','Source ID additions: '+added.length+'; removals: '+removed.length+'.','','## Warnings',...(warnings.length?warnings.map(x=>'- '+x):['- No critical import regression found; historical coverage still requires current operator checks.']),'',
 '## Editorial next actions','- Verify business operating status with venue/operator before stating it is open.',
 '- Verify dietary certification via MUIS; never infer from vendor name or cuisine.',
 '- Verify current CHAS eligibility with the official clinic locator.',
 '- Review additions/removals and update vendor menus if first-party source changed.'
].join('\n')+'\n';
fs.writeFileSync('reports/library-freshness-v210.md',md);
console.log('Freshness report '+summary.status+':',JSON.stringify(counts),'warn',warnings.length);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md);
