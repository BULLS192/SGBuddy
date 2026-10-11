/* Review-only first-party evidence check; NEVER updates place operatingStatus.
   Operator pages can be stale or unavailable. Match postal code and location
   as distinct evidence; a 200 response alone is not branch verification.
 */
import fs from 'node:fs';
const bundle=JSON.parse(fs.readFileSync('data/operator-listings-v220.json','utf8'));
const urls=[...new Set(bundle.places.map(x=>x.sourceUrl)),'https://www.chas.sg/clinic-locator','https://chiewkee.com/our-menu/'];
const state=new Map();
for(const url of urls){
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  let r;
  try{r=await fetch(url,{headers:{'user-agent':'SGBuddy source audit bot (read only)'},signal:controller.signal,redirect:'follow'})}finally{clearTimeout(timeout)}
  if(!r.ok){state.set(url,{status:'http-error',httpStatus:r.status});continue}
  const html=await r.text();
  state.set(url,{status:'fetched',httpStatus:r.status,body:html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' '),bytes:html.length});
 }catch(e){state.set(url,{status:'unavailable',reason:String(e.message||e).slice(0,120)})}
}
const results=bundle.places.map(p=>{
 const source=state.get(p.sourceUrl);
 const postalVisible=source?.status==='fetched'&&new RegExp('(?:\\b|Singapore\\s*)'+p.postal+'\\b').test(source.body);
 const reportedHoursVisible=!!(p.sourceReportedHours&&source?.status==='fetched');
 return {id:p.id,name:p.name,postal:p.postal,sourceUrl:p.sourceUrl,sourceStatus:source?.status||'unavailable',postalVisibleOnOperatorPage:Boolean(postalVisible),
  locationCheckStatus:postalVisible?'operator-postcode-present':'manual-review-needed',hoursNotAudited:reportedHoursVisible,operatingStatus:'NOT_VERIFIED_LIVE'};
});
const counters={total:results.length,postcodesMatched:results.filter(x=>x.postalVisibleOnOperatorPage).length,manualReview:results.filter(x=>!x.postalVisibleOnOperatorPage).length};
const checks={schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Online operator source content and visible postal code only; not branch open-now, not an onsite audit, not clinic licence verification.',sources:urls.map(url=>({url,status:state.get(url)?.status||'unavailable',httpStatus:state.get(url)?.httpStatus||null})),counts:counters,results,
 clinicalNote:'CHAS locator reachability alone is not verification of specific clinic participation. Branch-level CHAS status remains unverified unless name AND postal/address match a current authorized registry export.'};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/operator-source-audit-v220.json',JSON.stringify(checks,null,2)+'\n');
const summary=[
 '# SGBuddy operator source audit',
 'Checked: '+checks.checkedAt,'','Sources checked: '+urls.length,'Postcodes on operator pages: '+counters.postcodesMatched+'/'+counters.total,
 'Manual review: '+counters.manualReview,'','## Source availability',
 ...checks.sources.map(x=>'- '+x.url+' — '+x.status),
 '','## Important',
 'A postal match only supports the branch address appearing on that site. It cannot prove open-now status or license validity.',
 'CHAS eligibility is not inferred from the legacy MOH dataset; use https://www.chas.sg/clinic-locator.',
 '', '## Missing branch evidence',...results.filter(x=>!x.postalVisibleOnOperatorPage).map(x=>'- '+x.name+' · '+x.postal)
].join('\n')+'\n';
fs.writeFileSync('reports/operator-source-audit-v220.md',summary);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
console.log('Operator source outcomes:',JSON.stringify(checks.sources));
console.log('Operator web audit:',JSON.stringify(counters));
