/* V3.9 conservative classification, per candidate, not an overall percentage.
 * File/line and source-record evidence survive to JSON and review CSV.
 * Automatic buckets are TRIAGE decisions, NOT a human source-ownership signoff.
 */
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {RUNTIME_MESSAGES} from '../lib/i18n-runtime-v320.mjs';
import {SYSTEM_MESSAGES} from '../lib/i18n-system-v330.mjs';
import {AUDIT_MESSAGES} from '../lib/i18n-audit-v350.mjs';
import {CLASSIFIED_MESSAGES} from '../lib/i18n-classified-v360.mjs';
import {CONTEXT_MESSAGES} from '../lib/i18n-context-v370.mjs';
import {FALLBACK_SOURCE,FALLBACK_KEYS} from '../lib/i18n-fallback-v390.mjs';
import {FOOD_STATUS_MESSAGES} from '../lib/i18n-food-status-v400.mjs';
import {DISCOVER_STATUS_MESSAGES} from '../lib/i18n-discover-status-v400.mjs';
const raw=execFileSync(process.execPath,['scripts/audit-app-v380.mjs','--json'],{encoding:'utf8',maxBuffer:30*1024*1024});
const report=JSON.parse(raw);
const englishKnown=new Set([
 ...Object.values(RUNTIME_MESSAGES.en),
 ...Object.values(SYSTEM_MESSAGES.en),
 ...Object.values(AUDIT_MESSAGES.en),
 ...Object.values(CLASSIFIED_MESSAGES.en),
 ...Object.values(CONTEXT_MESSAGES.en.globals),
 ...Object.values(CONTEXT_MESSAGES.en.modes).flatMap(Object.values),
 ...Object.values(FALLBACK_SOURCE),
 ...Object.values(FOOD_STATUS_MESSAGES.en),
 ...Object.values(DISCOVER_STATUS_MESSAGES.en)
].filter(s=>typeof s==='string'));
const knownTemplates=Object.values(FALLBACK_SOURCE).filter(s=>s.includes('{count}')||s.includes('{areas}'));
const canonicalRegex=template=>new RegExp('^'+String(template).replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\{(?:count|areas)\\\}/g,'[0-9]+')+'$');
const safeTemplates=knownTemplates.map(canonicalRegex);
const covered=new Set(FALLBACK_KEYS.map(k=>FALLBACK_SOURCE[k]));
function classifyClient(item){
 const value=item.value.trim(),file=item.file;
 let decision,reason;
 if(covered.has(value)||safeTemplates.some(rx=>rx.test(value))){
  decision='v390_exact_source_localized';reason='Explicit V3.9 authored UI fallback key; exact source guard in DOM';
 }else if(englishKnown.has(value)){
  decision='registered_source_review_runtime';reason='Known source text already in authored UI packs; runtime reachability must still be checked';
 }else if(/^v\d+\.\d+\.\d+(?:-dev)?$/.test(value)){
  decision='developer_metadata';reason='Version marker, not language guidance';
 }else if(/^</.test(value)){
  decision='markup_needs_child_node_review';reason='HTML fragment contains potential UI text; cannot assert coverage from regex';
 }else if(item.kind==='serverError'){
  decision='safety_or_error_authorship_review';reason='Error/caution may be first-party or source-backed; source lock and legal intent required';
 }else if(/^(?:Bus:|MRT:|OneMap|Google Maps|SGBuddy profile|PSI|PM2\.5)/.test(value)){
  decision='mixed_provider_context_review';reason='Message may embed identifiers, operator values or platform names';
 }else if(item.kind==='toast'||item.kind==='accountMessage'||item.kind==='textContent'||item.kind==='placeholder'||item.kind==='busy'){
  decision='authored_ui_requires_translation_review';reason='Appears in client message position; check reachability and existing message rendering';
 }else{
  decision='requires_visibility_and_source_review';reason='Static scan alone cannot establish translated or untranslated status';
 }
 return {...item,decision,reason,reviewStatus:'unreviewed'};
}
function classifyEditorial(item){
 const f=item.file,k=item.field;
 let decision,reason;
 if(/\/official-places|\/services-v210|\/operator-listings|\/operator-menus|\/vendor-menus|\/nea-closures/.test(f)){
  decision='source_backed_mixed';reason='Official/operator snapshot may mix raw provenance and SGBuddy narration; preserve until source-field review';
 }else if(/^(?:accountNeeded|caution|notes|editorialPolicy|safety|warning|disclaimer|policy|trustPolicy)$/.test(k)){
  decision='authored_safety_or_policy_review';reason='Potential eligibility, dietary, payment or source caveat; do not auto-translate';
 }else if(/\/discover-v120|\/facts-published/.test(f)){
  decision='editorial_or_duplicate_record_review';reason='Review screen reachability and canonical fact ID before adding a counted key';
 }else{
  decision='authored_editorial_requires_review';reason='Potential SGBuddy-controlled copy; classify authorship and display before translation';
 }
 return {...item,decision,reason,reviewStatus:'unreviewed'};
}
const client=(report.executableTextAudit.groups.activeClient.reviewQueue||[]).map(classifyClient);
const server=[...(report.executableTextAudit.groups.backend.reviewQueue||[]),...(report.executableTextAudit.groups.backendLibraries.reviewQueue||[])].map(item=>({
 ...item,decision:'backend_source_and_visibility_review',reason:'Transport/weather/provider or API text; classify origin before any translation',reviewStatus:'unreviewed'
}));
const editorial=(report.identifiedEditorialUnknown.reviewQueue||[]).map(classifyEditorial);
const summary=rows=>Object.fromEntries([...new Set(rows.map(x=>x.decision))].sort().map(k=>[k,rows.filter(x=>x.decision===k).length]));
const output={
 version:'3.9.0',wholeAppTranslationPercent:null,classificationStatus:'machine-triaged; ownership and translated-state NOT human-approved',
 sourceCommitScope:'SGBuddy V3.8 source-linked audit, 16 JSON sources, active JavaScript and API',
 policy:'Unknown text is not automatically counted untranslated. Registered source does not certify rendered locale. Source-protected text must remain original.',
 client:{scanned:client.length,byDecision:summary(client),items:client},
 server:{scanned:server.length,byDecision:summary(server),items:server},
 editorial:{scanned:editorial.length,byDecision:summary(editorial),items:editorial},
 unmeasured:{conditionalTemplates:'not exhaustively enumerated',nativeReview:'pending',realDevicePwa:'pending',longFormMerli:'not exhaustively audited'},
 classifiedContentBaseline:report.locales
};
if(client.length!==report.executableTextAudit.groups.activeClient.outputCandidates)throw Error('Client candidates omitted');
if(server.length!==report.executableTextAudit.groups.backend.outputCandidates+report.executableTextAudit.groups.backendLibraries.outputCandidates)throw Error('Server candidates omitted');
if(editorial.length!==report.identifiedEditorialUnknown.uniqueTextFields)throw Error('Editorial candidates omitted');
const serialized=JSON.stringify(output,null,2)+'\n';
const out=process.argv.find(s=>s.startsWith('--out='));
if(out)writeFileSync(out.slice(6),serialized);
if(process.argv.includes('--json'))process.stdout.write(serialized);
else console.log('V3.9 TRIAGE PASS: '+client.length+' active UI, '+editorial.length+' editorial, '+server.length+' API/backend candidates individually categorized. Known V3.9 reviewed UI sources: '+client.filter(x=>x.decision==='v390_exact_source_localized').length+'. Whole-app percent is null.');
