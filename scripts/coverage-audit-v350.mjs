/* V3.5 reviewed *screen-sample* audit, not app-wide multilingual percentage.
 * Tracks every mapped V3.5 screen slot, reportable weighting and unclassified English
 * HTML controls. Source-owned service data is explicitly excluded. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {AUDIT_KEYS,AUDIT_SURFACES,AUDIT_MESSAGES,AUDIT_ENGLISH,auditText} from '../lib/i18n-audit-v350.mjs';
const root=readFileSync('index.html','utf8'),merli=readFileSync('app-v140.js','utf8'),ux=readFileSync('app-ux-v170.js','utf8');
const baselines=JSON.parse(execFileSync(process.execPath,['scripts/localization-inventory-v340.mjs','--json'],{encoding:'utf8'}));
const regions=Object.fromEntries(Object.entries(AUDIT_SURFACES).map(([screen,slots])=>{
 const list=slots.map(([selector,key,weight])=>{
  const relevant=selector==='#uxMerliMore'?ux:selector==='#buddyReply'?merli:root;
  const targetExists=relevant.includes(selector.slice(1));
  assert.ok(targetExists,screen+': selector not present in source '+selector);
  assert.ok(AUDIT_KEYS.includes(key),screen+': unknown audited key '+key);
  assert.ok(AUDIT_ENGLISH[key],screen+': missing canonical English '+key);
  return {selector,key,weight,sourceExists:targetExists};
 });
 return [screen,{slots:list,weight:list.reduce((a,v)=>a+v.weight,0)}];
}));
const weightedTotal=Object.values(regions).reduce((sum,reg)=>sum+reg.weight,0);
const byLocale={};
for(const {code} of LOCALES){
 const pack=AUDIT_MESSAGES[code];
 assert.equal(Object.keys(pack||{}).length,AUDIT_KEYS.length,code+' incomplete catalogue');
 const screens={};let localizedWeight=0,flaggedWeight=0;
 for(const [screen,{slots,weight}] of Object.entries(regions)){
  const items=slots.map(({key,weight,selector})=>{
   const actual=String(pack[key]||'').trim(),canonical=String(AUDIT_ENGLISH[key]||'').trim();
   const missing=!actual,unchanged=code!=='en'&&actual===canonical;
   const complete=!missing;
   if(complete)localizedWeight+=weight;
   if(unchanged)flaggedWeight+=weight;
   return {selector,key,weight,complete,unchanged,sourceOwned:false};
  });
  screens[screen]={weight,filled:items.filter(x=>x.complete).reduce((a,x)=>a+x.weight,0),untranslatedReview:items.filter(x=>x.unchanged).map(x=>x.key),items};
 }
 byLocale[code]={
  registeredKeys:baselines.completion[code].declaredKeys+AUDIT_KEYS.length,
  registeredFilled:baselines.completion[code].filledKeys+AUDIT_KEYS.filter(k=>!!pack[k]?.trim()).length,
  reviewedScreenWeight:weightedTotal,reviewedFilledWeight:localizedWeight,
  reviewedScreenPopulationPercent:Math.round(localizedWeight/weightedTotal*1000)/10,
  unchangedEnglishReviewWeight:flaggedWeight,screens
 };
}
// Candidates intentionally preserved: these carry source/operator-owned values,
// official statements, identifying data, live states or money rates.
const protectedIds=[
 'envSource','envPsi','envPm25','envRain','envWind','envTemp',
 'fxRateMeta','moneySourceNote','moneyChangerResults','accountEmailDisplay',
 'profileId','v110CompareResults','tripFrom','tripTo','moneyChangerSearch'
];
const reviewed=new Set(Object.values(regions).flatMap(x=>x.slots.map(y=>y.selector.replace(/^#/,'')).filter(Boolean)));
const knownMapper=['app-i18n-v290.js','app-i18n-v300.js','app-i18n-system-v330.js','app-i18n-dynamic-v340.js'].map(x=>readFileSync(x,'utf8')).join('\n');
const allStatic=[...root.matchAll(/<[^>]+\bid="([A-Za-z][\w-]+)"[^>]*>([^<>]{2,220})<\/[^>]+>/g)]
 .map(x=>({id:x[1],message:x[2].replace(/\s+/g,' ').trim()}))
 .filter(x=>/[a-z]{3,}/i.test(x.message)&&!/^[-–—0-9·]+$/.test(x.message));
const unmatched=allStatic.filter(x=>!reviewed.has(x.id)&&!protectedIds.includes(x.id)&&!knownMapper.includes('#'+x.id)).slice(0,150);
const result={
 version:'3.5.0',scope:'Reviewed first-party V3.5 UI screen slots; not a whole application translation denominator',
 wholeApplicationCoveragePercent:null,
 methodology:'Weights are fixed editorial priorities (1=secondary, 2=primary). Populated translations within this inspected V3.5 sample, not screen-wide, visual, semantic or native-speaker assurance. English is the canonical baseline, not a translated language.',
 reviewedSlots:Object.values(regions).reduce((a,v)=>a+v.slots.length,0),
 reviewedUniqueKeys:AUDIT_KEYS.length,
 reviewedWeightedPoints:weightedTotal,
 screens:Object.fromEntries(Object.entries(regions).map(([k,v])=>[k,{slots:v.slots.length,weight:v.weight}])),
 registeredCatalogues:baselines.packs.length+1,
 registeredKeysPerLocale:baselines.completion.en.declaredKeys+AUDIT_KEYS.length,
 priorCandidateLiterals:baselines.englishLiteralAudit?.uncoveredExamples?.length||0,
 protectedSourceIds:protectedIds,
 htmlReviewQueue:unmatched,
 htmlReviewedCandidates:allStatic.length,
 locales:byLocale
};
const json=JSON.stringify(result,null,2)+'\n';
const out=process.argv.find(x=>x.startsWith('--out='));
if(out)writeFileSync(out.slice('--out='.length),json);
if(process.argv.includes('--json'))process.stdout.write(json);
else {
 console.log('V3.5 SCREEN AUDIT: '+result.reviewedSlots+' reviewed slots across '+Object.keys(regions).length+' UI zones; '+weightedTotal+' weighted points');
 console.log('REGISTERED CATALOGUES: '+result.registeredKeysPerLocale+' authored entries per locale, English included.');
 for(const {code} of LOCALES)console.log(code+': '+byLocale[code].reviewedFilledWeight+'/'+weightedTotal+' reviewed weight ('+byLocale[code].reviewedScreenPopulationPercent+'% of V3.5 reviewed sample); '+byLocale[code].unchangedEnglishReviewWeight+' unchanged-English weighted points');
 console.log('UNCLASSIFIED HTML CONTROL QUEUE: '+unmatched.length+' candidate slots. This report does NOT provide whole-app coverage.');
}
if(Object.values(byLocale).some(v=>v.reviewedFilledWeight!==weightedTotal))process.exitCode=1;
