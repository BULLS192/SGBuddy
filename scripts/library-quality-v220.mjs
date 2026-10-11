/** V2.2 non-destructive directory quality and editorial verification queue.
 * "Official dataset" means source-backed, NOT that an establishment is currently open.
 * No write to application data, source provider, or production.
 */
import fs from 'node:fs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const datasets=[
 ['curated',read('data/discover-v120.json').places],
 ['official',read('data/official-places-v200.json').places],
 ['services',read('data/services-v210.json').places]
];
const stalls=read('data/food-stalls-v180.json').stalls;
const menus=read('data/vendor-menus-v210.json').items;
const now=new Date();
const ageDays=day=>{if(!day)return null;const n=Date.parse(day);return Number.isFinite(n)?Math.max(0,Math.floor((now-n)/86400000)):null};
const verifiedOperation=place=>place.operatingStatus==='confirmed-open'&&
 /^https:\/\//.test(place.operatingVerification?.sourceUrl||'')&&
 Number.isFinite(Date.parse(place.operatingVerification?.checkedOn||''))&&
 ageDays(place.operatingVerification.checkedOn)<=30;
const sources={recent:0,aging:0,historical:0,undated:0,curated:0};
const queue=[],identifiers=new Set(),duplicates=[],invalidOperatingClaims=[];
let verifiedLive=0,archivalSupermarkets=0,missingGeo=0,missingPostal=0;
const escapeCsv=v=>'"'+String(v??'').replaceAll('"','""').replace(/\r|\n/g,' ')+'"';
for(const [bucket,places] of datasets){
 for(const p of places){
  if(identifiers.has(p.id))duplicates.push(p.id);identifiers.add(p.id);
  const age=ageDays(p.sourceCoverageAsOf),archive=p.category==='Supermarket (historical licence)';
  if(archive)archivalSupermarkets++;
  if(p.lat==null||p.lon==null)missingGeo++;
  if(!p.postal)missingPostal++;
  if(bucket==='curated')sources.curated++;
  else if(age==null)sources.undated++;
  else if(age>730)sources.historical++;
  else if(age>365)sources.aging++;
  else sources.recent++;
  const isVerified=verifiedOperation(p);
  if(isVerified)verifiedLive++;
  if(p.operatingStatus==='confirmed-open'&&!isVerified)invalidOperatingClaims.push(p.id);
  // The review queue ranks risks, never assumes the place is still trading.
  if(!isVerified){
   const priority=archive?1:p.kind==='Healthcare'?2:age!=null&&age>730?3:age==null?4:5;
   queue.push({priority,id:p.id,name:p.name,category:p.category||p.kind,sourceCoverageAsOf:p.sourceCoverageAsOf||'',ageDays:age??'',postal:p.postal||'',sourceUrl:p.sourceUrl||'',action:archive?'Check current SFA licensing; retain as historical until confirmed':p.kind==='Healthcare'?'Check active provider record and CHAS/HSA where applicable':'Check current operation with responsible authority or establishment'});
  }
 }
}
if(duplicates.length||invalidOperatingClaims.length)throw Error('Duplicate IDs or unsupported live-operating claims: '+JSON.stringify({duplicates:duplicates.slice(0,10),invalidOperatingClaims:invalidOperatingClaims.slice(0,10)}));
queue.sort((a,b)=>a.priority-b.priority||String(a.name).localeCompare(String(b.name)));
const warnings=[];
if(sources.historical)warnings.push(sources.historical+' official source listings have coverage older than two years.');
if(archivalSupermarkets)warnings.push(archivalSupermarkets+' historic supermarket-licence rows must remain opted-out by default.');
if(!verifiedLive)warnings.push('Zero establishments have a current, independently evidenced operating-status verification; source provenance is not live status.');
if(stalls.some(x=>x.operatingStatus==='confirmed-open'))warnings.push('A hawker lead claims current operation; review its independent evidence.');
const output={
 schemaVersion:1,generatedAt:now.toISOString(),
 note:'Source coverage and editorial evidence only. NO proof of current operation is inferred from dataset snapshots, NEA award history, maps, or a price page.',
 directory:{total:[...datasets].reduce((n,[,rows])=>n+rows.length,0),byOrigin:Object.fromEntries(datasets.map(([key,rows])=>[key,rows.length])),sourceAge:sources,verifiedLive,archivalSupermarkets,missingGeo,missingPostal},
 food:{historicalAndEditorialLeads:stalls.length,neaHistoricalAwardLeads:stalls.filter(x=>/^nea-award-listed-20\d\d$/.test(x.reviewStatus)).length,
 historical2022:stalls.filter(x=>x.reviewStatus==='nea-award-listed-2022').length,
 historical2023:stalls.filter(x=>x.reviewStatus==='nea-award-listed-2023').length,
 withCentreId:stalls.filter(x=>/^SGP-/.test(x.centreId||'')).length,
 vendorPublishedMenuProducts:menus.length,currentlyAvailableConfirmed:0},
 queueSize:queue.length,prioritySample:queue.slice(0,25),warnings
};
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/library-quality-v220.json',JSON.stringify(output,null,2)+'\n');
const md=[
 '# SGBuddy V2.2 Library Quality — '+now.toISOString().slice(0,10),
 '',
 '**Source provenance is not live operating verification.** Historic supermarket licence records are excluded from Discover by default.',
 '',
 '| Metric | Count |','|---|---:|',
 ...Object.entries({...output.directory.byOrigin,...sources,verifiedLive,archivalSupermarkets,missingGeo,missingPostal,hawkerLeads:stalls.length,firstPartyMenuProducts:menus.length}).map(([key,n])=>'| '+key+' | '+n+' |'),
 '', '## Editorial priorities',
 ...warnings.map(w=>'- '+w),
 '',
 '## Verification queue','The queue is ordered by age and service risk, without automatically publishing changes.',
 '','| Priority | Record | Category | Source coverage |','|---|---|---|---|',
 ...queue.slice(0,35).map(p=>'| '+p.priority+' | '+String(p.name).replaceAll('|','/')+' | '+p.category+' | '+(p.sourceCoverageAsOf||'Unknown')+' |'),
 '',
 '## Verification standards',
 '- Current operation requires a dated establishment-specific official or first-party source, not simply presence in a static dataset.',
 '- CHAS participation must be checked against https://www.chas.sg/clinic-locator.',
 '- Food establishments and historical supermarket licences: https://www.sfa.gov.sg/tools-and-resources/track-records.',
 '- OneMap resolves an address, not active trading, business hours, pricing or halal certification.',
 '- Hawker awards certify historical awards, not current tenancy, menu, halal status or opening hours.'
].join('\n')+'\n';
fs.writeFileSync('reports/library-quality-v220.md',md);
const headers=['priority','id','name','category','sourceCoverageAsOf','ageDays','postal','sourceUrl','action'];
fs.writeFileSync('reports/library-verification-queue-v220.csv',[headers.join(','),...queue.map(x=>headers.map(k=>escapeCsv(x[k])).join(','))].join('\n')+'\n');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md);
console.log('V2.2 quality: '+output.directory.total+' records, '+verifiedLive+' verified operating, '+stalls.length+' stall leads; '+warnings.length+' warnings');
