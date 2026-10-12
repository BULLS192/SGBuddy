/* SGBuddy V3.8: repository-wide LOCALIZATION INVENTORY, not a speculative
 * whole-app translated percentage. Classify source-authored vs protected data,
 * and distinguish provably untranslated source fallbacks from unreviewed slots.
 * Deterministic, offline and read-only; no translation or provider requests.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {factTranslation} from '../lib/i18n-facts-v310.mjs';
import {appContentTranslation} from '../lib/i18n-app-content-v312.mjs';
import {dishTranslation} from '../lib/i18n-dishes-v311.mjs';
import {stallNoteTranslation} from '../lib/i18n-stall-notes-v311.mjs';
import {localizedGuide,localizedCheck} from '../lib/i18n-guides-v280.mjs';
import {dynamicInventory,dynamicAuditPolicy} from './audit-dynamic-v380.mjs';

const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const read=file=>fs.readFileSync(file,'utf8');
const list=folder=>fs.readdirSync(folder).sort();
const dataFiles=list('data').filter(n=>n.endsWith('.json')).map(n=>'data/'+n);
const localeCodes=LOCALES.map(x=>x.code);
const en='en';
const source=json('data/facts-published.json');
const apps=json('data/everyday-apps-v240.json').catalogue;
const dishes=json('data/singapore-dishes-v180.json').dishes;
const stalls=json('data/food-stalls-v180.json').stalls;
const travel=json('data/travel-essentials-v250.json');
const facts=source.facts.filter(x=>x.status==='verified');
const registered=jsonFrom('scripts/localization-inventory-v340.mjs');
const later=jsonFrom('scripts/coverage-audit-v350.mjs');
const review360=jsonFrom('scripts/localization-review-v360.mjs');
const previousJS=jsonFrom('scripts/inspect-js-localization-v370.mjs');
function jsonFrom(command){return JSON.parse(execFileSync(process.execPath,[command,'--json'],{encoding:'utf8',maxBuffer:20*1024*1024}));}
const baseKeys=registered.completion.en.declaredKeys;
const registeredCount=baseKeys+later.reviewedUniqueKeys+review360.newCataloguedKeys+52+12+16+11;
assert.equal(registeredCount,432,'Registered dictionary baseline changed: update audit for new translation pack');
const publishedSourceIds=new Set();
const measuredRows=[];
const add=(bucket,id,original,check,origin)=> {
 if(typeof original!=='string'||!original.trim())return;
 measuredRows.push({bucket,id,original:original.trim(),check,origin});
 publishedSourceIds.add(origin+':'+id);
};
for(const fact of facts)add('publishedFacts',fact.id,fact.text,(locale)=>factTranslation(locale,fact), 'data/facts-published.json');
for(const app of apps)for(const field of ['summary','purpose']){
 add('appEditorial',app.id+'.'+field,app[field],locale=>appContentTranslation(locale,app,field),'data/everyday-apps-v240.json');
}
for(const dish of dishes)add('dishDescriptions',dish.id,dish.description,locale=>dishTranslation(locale,dish),'data/singapore-dishes-v180.json');
for(const stall of stalls)add('stallNotes',stall.id,stall.notes,locale=>stallNoteTranslation(locale,stall),'data/food-stalls-v180.json');
for(const guide of travel.guides||[])for(const field of ['title','copy']){
 add('travelGuides',guide.id+'.'+field,guide.en?.[field],locale=>locale==='en'?guide.en?.[field]:localizedGuide(guide,locale)?.[field],'data/travel-essentials-v250.json');
}
for(const step of travel.checklist||[]){
 add('travelChecklist',step.id,step.en,locale=>locale==='en'?step.en:localizedCheck(step,locale),'data/travel-essentials-v250.json');
}
for(const app of travel.catalogue||[])for(const field of ['summary','purpose','accountNeeded']){
 add('travelAppEditorial',app.id+'.'+field,app[field],locale=>{
  if(locale==='en')return app[field];
  return appContentTranslation(locale,app,field)|| (locale==='zh-CN'?app.zh?.[field]:null);
 },'data/travel-essentials-v250.json');
}
const validText=s=>typeof s==='string'&&s.trim().length>=5&&/[A-Za-zÀ-ÿ\u4E00-\u9FA5]/.test(s);
const potentialFields=new Set(['title','intro','description','summary','purpose','copy','text','notes','note','caution','accountNeeded','editorialPolicy','policy','sourcePolicy','trustPolicy','serviceDistinction','evidenceNote','label','verifiedScope','notice','guide','recommendation','warning','disclaimer','faq','subtitle','details','operatingNote','why']);
const protectedFields=new Set(['id','name','nameInSource','source','sourceUrl','sourceUrls','url','ios','android','address','postal','street','lat','lon','latitude','longitude','publisher','operator','vendor','centreName','sourceAgency','sourceRecordId','sourceDatasetId','verifiedOn','reviewedOn','updatedAt','updatedOn','sourceCheckedOn','area','region','phone','hours','openingHours','category','status','referenceUrl','modes','kind','kinds','cuisine','meal','sourceContext','observedOn','guideAsOf','cataloguedOn','reviewDate','priceSource']);
const skipPrefixes=['data/facts-published.json::facts.', 'data/everyday-apps-v240.json::catalogue.', 'data/singapore-dishes-v180.json::dishes.', 'data/food-stalls-v180.json::stalls.', 'data/travel-essentials-v250.json::guides.', 'data/travel-essentials-v250.json::checklist.', 'data/travel-essentials-v250.json::catalogue.'];
const coveredFields={
 'data/facts-published.json':new Set(['text']),
 'data/everyday-apps-v240.json':new Set(['summary','purpose']),
 'data/singapore-dishes-v180.json':new Set(['description']),
 'data/food-stalls-v180.json':new Set(['notes']),
 'data/travel-essentials-v250.json':new Set(['summary','purpose','accountNeeded','title','copy'])
};
const unresolvedRecords=[];
const protectedSummary={};
const duplicateCandidates=new Map();
const skipMeta=/^(?:https?:|\/api\/|\d+[.-]\d+|[0-9]{4}-[0-9]{2}-[0-9]{2})/;
function countProtected(file,key){
 if(!protectedSummary[file])protectedSummary[file]={};
 protectedSummary[file][key]=(protectedSummary[file][key]||0)+1;
}
function crawl(file,value,route=[],recordId=null){
 if(Array.isArray(value)){value.forEach((x,i)=>crawl(file,x,route.concat(String(i)),x?.id||recordId));return}
 if(value&&typeof value==='object'){
  for(const [field,next] of Object.entries(value))crawl(file,next,route.concat(field),value.id||recordId);
  return;
 }
 const field=route.at(-1),fieldPath=route.join('.');
 if(!validText(value)||skipMeta.test(value))return;
 if(route.some(x=>['en','zh','zh-CN','zh-TW'].includes(x)))return; // registered source or translated record
 if(protectedFields.has(field)||/(?:Url|Uri|Id|Code|Ref|Date|At)$/.test(field)){countProtected(file,field);return}
 if(!potentialFields.has(field)){countProtected(file,'unclassified:'+field);return}
 if((coveredFields[file]?.has(field))&&skipPrefixes.some(p=>p.startsWith(file+'::')&&fieldPath.startsWith(p.slice(file.length+2).split('.')[0]+'.')))return;
 const original=String(value).replace(/\s+/g,' ').trim();
 const dedupKey=file+'|'+field+'|'+original;
 const prev=duplicateCandidates.get(dedupKey);
 if(prev){prev.occurrences++;return}
 const item={file,field,recordId,fieldPath,original,occurrences:1,owner:'unreviewed',reason:'Editorial-like field; needs manual visibility/source-provenance classification before translation percentage'};
 duplicateCandidates.set(dedupKey,item);unresolvedRecords.push(item);
}
for(const file of dataFiles)crawl(file,json(file));
function infoFor(locale){
 const english=locale==='en';
 const packs={};
 for(const key of ['publishedFacts','appEditorial','dishDescriptions','stallNotes','travelGuides','travelChecklist','travelAppEditorial']){
  const group=measuredRows.filter(x=>x.bucket===key);
  const translated=english?group.length:group.filter(x=>{
   const text=x.check(locale);
   return typeof text==='string'&&text.trim()&&text.trim()!==x.original;
  }).length;
  packs[key]={total:group.length,confirmedLocalized:translated,knownSourceFallback:english?0:group.length-translated};
 }
 const registry=registered.completion[locale]||{};
 const registeredFilled=(registry.filledKeys||0)+(later.locales?.[locale]?.registeredFilled??(registry.filledKeys||0)+later.reviewedUniqueKeys)-(registry.filledKeys||0)+
  (review360.locales?.find(x=>x.locale===locale)?.populated??review360.newCataloguedKeys)+52+12+16+11;
 // Only count populating registered messages, not native-speaker quality or runtime reach.
 packs.authoredUiCatalogue={total:registeredCount,confirmedLocalized:english?registeredCount:registeredFilled,knownSourceFallback:registeredCount-registeredFilled};
 const total=Object.values(packs).reduce((n,p)=>n+p.total,0);
 const done=Object.values(packs).reduce((n,p)=>n+p.confirmedLocalized,0);
 return {locale,knownAuthoredInventory:{total,filledOrLocalized:done,knownFallbacks:total-done,percentOfClassifiedItems:english?null:Number((100*done/total).toFixed(1))},byArea:packs};
}
const reports=Object.fromEntries(localeCodes.map(code=>[code,infoFor(code)]));
const html=read('index.html');
const sourceLiteralHits=[...html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').matchAll(/>([^<>]{3,320})</g)];
const htmlCandidates=sourceLiteralHits.map(m=>m[1].replace(/\s+/g,' ').trim()).filter(s=>/[A-Za-z]{3}/.test(s)&&!s.includes('{{')).length;
const scriptFiles=list('.').filter(n=>/^app.*\.js$/.test(n));
const imported=new Set(['app-v090.js']),front=['app-v090.js'];
while(front.length){
 const f=front.pop();
 if(!fs.existsSync(f))continue;
 const src=read(f);
 for(const x of src.matchAll(/\bimport\s*\(\s*['"]\/?(app[^'"]+\.js)['"]\s*\)/g)){
  const child=x[1];
  if(!imported.has(child)&&fs.existsSync(child)){imported.add(child);front.push(child)}
 }
}
const activeScripts=[...imported].sort(),archivedScripts=scriptFiles.filter(x=>!imported.has(x));
const audit={
 version:'3.8.0',
 repositoryScope:{dataFiles:dataFiles.length,dataPaths:dataFiles,appJSFiles:scriptFiles.length,activeAppScripts:activeScripts,archivedAppScripts:archivedScripts,htmlEntry:'index.html',activeApiJsFiles:list('api').filter(x=>x.endsWith('.js')).length},
 denominatorPolicy:'Known authored and currently source-locked content only. Other UI text, conditional JS outputs, external/provider content and editorial fields are NOT silently called localized or untranslated.',
 globalWholeAppCompletionPercent:null,
 previouslySuggestedEstimate:{approximate:70,verified:false,includeInMeasurement:false},
 locales:reports,
 classifiedEligibleEntries:measuredRows.length+registeredCount,
 identifiedEditorialUnknown:{uniqueTextFields:unresolvedRecords.length,recordOccurrences:unresolvedRecords.reduce((a,x)=>a+x.occurrences,0),byFile:Object.fromEntries(dataFiles.map(file=>[file,unresolvedRecords.filter(x=>x.file===file).length])),reviewQueue:unresolvedRecords.map(({file,field,recordId,fieldPath,original,occurrences})=>({file,field,recordId,fieldPath,excerpt:original.slice(0,220),occurrences})),examples:unresolvedRecords.slice(0,60).map(({file,field,recordId,original,occurrences})=>({file,field,recordId,excerpt:original.slice(0,140),occurrences}))},
 sourceOwnedProtectedFieldCounts:protectedSummary,
 executableTextAudit:{groups:dynamicInventory,policy:dynamicAuditPolicy},
 unclassifiedJsAudit:{scannedAppFiles:previousJS.scannedFiles.length,likelyOutputLiteralCandidates:previousJS.candidateCount,needsManualClassification:previousJS.untriagedCount,scopeNote:'V3.7 scanner includes archived builds. V3.8 splits active UI and backend candidates, but neither count is an untranslated denominator.'},
 staticHtml:{initialTextNodesCandidateCount:htmlCandidates,policy:'Review only; already translated by runtime, provider-owned or conditionally replaced nodes cannot be counted from HTML alone'},
 nativeSpeakerReview:{v360TopicCells:33,v370StringCells:572,approvedV370:0,editorialStatus:'PENDING',policy:'Dictionary population is not fluent/native-speaker sign-off.'},
 reviewPriority:['Classify currently active JS and API-generated UI output messages','Review unclassified source editorial field ownership and whether displayed','Resolve English source fallback in facts/apps/dishes/stalls/guides per locale','Native-speaker approve and regression test translated critical information','Instrument conditional screens and Merli responses in browser to establish a true end-to-end denominator'],
 caution:'A 70% entire-app figure is an earlier estimate, NOT established by this inventory. Only percentOfClassifiedItems is a measured percentage of known-authored inventory.'
};
if(localeCodes.length!==12||audit.repositoryScope.dataFiles!==16||audit.classifiedEligibleEntries<393)throw Error('Unexpected inventory coverage drift');
for(const [code,r] of Object.entries(reports)){
 if(r.knownAuthoredInventory.total!==reports.en.knownAuthoredInventory.total)throw Error('Denominator differs '+code);
 if(r.knownAuthoredInventory.filledOrLocalized>r.knownAuthoredInventory.total)throw Error('Overcount '+code);
}
const output=JSON.stringify(audit,null,2)+'\n';
const dest=process.argv.find(x=>x.startsWith('--out='));
if(dest)fs.writeFileSync(dest.slice(6),output);
if(process.argv.includes('--json'))process.stdout.write(output);
else {
 console.log('V3.8 whole-repository localization inventory: '+audit.repositoryScope.dataFiles+' JSON datasets, '+audit.repositoryScope.activeAppScripts.length+' live app scripts, '+audit.repositoryScope.archivedAppScripts.length+' archived versions.');
 console.log('Measured authored inventory: '+audit.classifiedEligibleEntries+' reference units, not the whole app.');
 for(const code of localeCodes){const q=reports[code].knownAuthoredInventory;console.log(code+': '+q.filledOrLocalized+'/'+q.total+' ('+(q.percentOfClassifiedItems??'English source')+'%) of CLASSIFIED authored units');}
 console.log('Unclassified editorial fields: '+unresolvedRecords.length+', active JS candidates: '+dynamicInventory.activeClient.outputCandidates+', backend and lib candidates: '+(dynamicInventory.backend.outputCandidates+dynamicInventory.backendLibraries.outputCandidates)+', static HTML review candidates: '+htmlCandidates);
 console.log('Whole-app percent remains UNVERIFIED; no misleading global number is output.');
}
