/* Deterministic translation coverage audit. It does not claim a whole-app percentage.
 * Scoped dictionaries are measured exactly. Raw English string discovery produces
 * an explicit *review queue*, not a translated/untranslated total for the product. */
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {SHELL_KEYS,shellLocale} from '../lib/i18n-shell-v281.mjs';
import {CORE_LABEL_KEYS,coreUi} from '../lib/i18n-interface-v290.mjs';
import {EXTENDED_KEYS,extendedUi} from '../lib/i18n-extended-v300.mjs';
import {EXPLAINER_KEYS,EXPLAINERS} from '../lib/i18n-explainers-v300.mjs';
import {MERLI_MESSAGE_KEYS,MERLI_MESSAGES} from '../lib/i18n-merli-replies-v315.mjs';
import {APP_STATUS_KEYS,APP_STATUS} from '../lib/i18n-app-status-v315.mjs';
import {RUNTIME_KEYS,RUNTIME_MESSAGES} from '../lib/i18n-runtime-v320.mjs';
import {PLACE_RUNTIME_KEYS,PLACE_RUNTIME_MESSAGES} from '../lib/i18n-place-eta-v320.mjs';
import {SYSTEM_KEYS,SYSTEM_MESSAGES} from '../lib/i18n-system-v330.mjs';
const packs=[
 {name:'coreShell',keys:SHELL_KEYS,get:shellLocale},
 {name:'interfaceControls',keys:CORE_LABEL_KEYS,get:coreUi},
 {name:'discoveryAndFoodUI',keys:EXTENDED_KEYS,get:extendedUi},
 {name:'guidance',keys:EXPLAINER_KEYS,get:code=>EXPLAINERS[code]},
 {name:'merliTemplates',keys:MERLI_MESSAGE_KEYS,get:code=>MERLI_MESSAGES[code]},
 {name:'appStatuses',keys:APP_STATUS_KEYS,get:code=>APP_STATUS[code]},
 {name:'accountWeatherJourney',keys:RUNTIME_KEYS,get:code=>RUNTIME_MESSAGES[code]},
 {name:'placeETA',keys:PLACE_RUNTIME_KEYS,get:code=>PLACE_RUNTIME_MESSAGES[code]},
 {name:'accountAndComparisonUI',keys:SYSTEM_KEYS,get:code=>SYSTEM_MESSAGES[code]}
];
const completeness={};
for(const {code} of LOCALES){
 const byPack={};
 for(const pack of packs){
  const dictionary=pack.get(code)||{};
  const missing=pack.keys.filter(key=>!String(dictionary[key]||'').trim());
  byPack[pack.name]={defined:pack.keys.length,translated:pack.keys.length-missing.length,missing};
 }
 const values=Object.values(byPack);
 completeness[code]={
  byPack,declaredKeys:values.reduce((a,x)=>a+x.defined,0),
  filledKeys:values.reduce((a,x)=>a+x.translated,0),
  missingKeys:values.flatMap(x=>x.missing)
 };
}
// A deliberately conservative extractor for first-party literal UI strings only.
// Dynamic templates, HTML fragments and server/API text need manual review; ratios
// from this heuristic are NOT whole-app coverage and must not be presented as such.
const sourceFiles=['app-v090.js','app-v110.js','app-v120.js','app-ux-v160.js','app-ux-v170.js','app-v140.js'];
const knownEnglish=new Set(packs.flatMap(p=>p.keys.map(k=>String(p.get('en')?.[k]||''))));
const patterns=[
 /\btoast\s*\(\s*(['"])([^'"\n]{8,150})\1/g,
 /\baccountMessage\s*\(\s*(['"])([^'"\n]{8,150})\1/g,
 /\.textContent\s*=\s*(['"])([^'"\n]{8,150})\1/g,
 /\.placeholder\s*=\s*(['"])([^'"\n]{8,150})\1/g
];
const candidates=[];
for(const path of sourceFiles){
 const source=readFileSync(path,'utf8');
 const lineNumber=index=>source.slice(0,index).split('\n').length;
 for(const re of patterns){
  for(const hit of source.matchAll(re)){
   const message=hit[2].trim();
   if(!/[a-z]{3,}/i.test(message))continue;
   if(/^(?:https?:|\/api\/|sgc-|#|data-|[\w-]+\.(?:json|js|mjs))/.test(message))continue;
   candidates.push({path,line:lineNumber(hit.index),message,declared:knownEnglish.has(message)});
  }
 }
}
const unique=new Map(candidates.map(x=>[x.path+':'+x.line+':'+x.message,x]));
const samples=[...unique.values()].filter(x=>!x.declared).slice(0,100);
let contentSnapshot={};
try {
 const prior=JSON.parse(execFileSync(process.execPath,['scripts/localization-report-v310.mjs','--json'],{encoding:'utf8'}));
 contentSnapshot={version:prior.version,sourceCounts:prior.sourceCounts,taxonomySourceKeys:prior.taxonomySourceKeys,staleFacts:prior.staleTranslations?.length,appSourceFallbacks:prior.locales?.['zh-CN']?.fallbackAppSummaries};
} catch(e){contentSnapshot={unavailable:String(e.message).slice(0,160)}}
const report={
 version:'3.3.0',
 methodology:'Exact coverage for registered, authored dictionaries. Heuristic app-string queue is neither exhaustive nor a whole-product denominator.',
 doesNotRepresentOverallPercent:true,
 locales:LOCALES.map(x=>x.code),packs:packs.map(p=>({name:p.name,keys:p.keys.length})),
 completion:completeness,sourceLockedContent:contentSnapshot,
 englishLiteralAudit:{scannedFiles:sourceFiles,uniqueLiteralCandidates:unique.size,uncoveredExamples:samples,limitations:'Does not inspect server responses, built HTML fragments, most templates, platform dialogs, dynamically supplied data or native-speaker quality.'},
 nextPriorities:['untranslated account, weather and transport interactions outside declared packs','provider-specific requirements and eligibility','long-form Merli replies','native-speaker review of safety-critical disclosures']
};
const output=JSON.stringify(report,null,2)+'\n';
const out=process.argv.find(x=>x.startsWith('--out='));
if(out)writeFileSync(out.slice(6),output);
if(process.argv.includes('--json'))process.stdout.write(output);
else {
 console.log('SGBuddy V3.3 LOCALIZATION INVENTORY (scoped, not full-app coverage)');
 console.log('Key groups: '+packs.map(x=>x.name+':'+x.keys.length).join(', '));
 console.log('Each locale registered: '+completeness.en.filledKeys+' / '+completeness.en.declaredKeys+' keys.');
 console.log('Unresolved first-party literal review examples: '+samples.length+' (not a global denominator).');
 console.log('This inventory DOES NOT justify a whole-product translation percentage.');
}
if(Object.values(completeness).some(x=>x.missingKeys.length))process.exitCode=1;
