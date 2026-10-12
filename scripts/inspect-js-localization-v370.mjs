/* V3.7: deterministic review queue for first-party JS literal outputs.
 * This is an intentionally partial static text scan, not an application-wide
 * translation coverage denominator and not a provider-owned text translator. */
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {CONTEXT_MESSAGES} from '../lib/i18n-context-v370.mjs';
import {CLASSIFIED_MESSAGES} from '../lib/i18n-classified-v360.mjs';
import {AUDIT_MESSAGES} from '../lib/i18n-audit-v350.mjs';
const files=readdirSync('.').filter(f=>/^app.*\.js$/.test(f)).sort();
const englishStrings=new Set([
 ...Object.values(CONTEXT_MESSAGES.en.modes).flatMap(v=>Object.values(v)),
 ...Object.values(CONTEXT_MESSAGES.en.globals),
 ...Object.values(CLASSIFIED_MESSAGES.en),
 ...Object.values(AUDIT_MESSAGES.en)
]);
const patterns=[
 {type:'toast',regex:/\btoast\s*\(\s*(['"])([^'"\n]{6,220})\1/g},
 {type:'accountMessage',regex:/\baccountMessage\s*\(\s*(['"])([^'"\n]{6,220})\1/g},
 {type:'statusText',regex:/\.textContent\s*=\s*(['"])([^'"\n]{6,220})\1/g},
 {type:'htmlFragment',regex:/\.innerHTML\s*=\s*(['"])([^'"\n]{6,220})\1/g},
 {type:'placeholder',regex:/\.placeholder\s*=\s*(['"])([^'"\n]{6,220})\1/g},
 {type:'busyLabel',regex:/\bwithBusy\s*\([^,]+,\s*(['"])([^'"\n]{6,220})\1/g}
];
const excluded=item=>/^(https?:\/\/|\/#|\/api\/|<svg|<div|<span|<a |<button|<section|\{)/i.test(item)||
 /^(?:[\w-]+\.(?:js|json|mjs)|[0-9 .:;/=%?#&_-]+)$/.test(item);
function area(file,literal){
 const t=(file+' '+literal).toLowerCase();
 if(/health|pm2|psi|hazard|clinic|nea|hsa/.test(t))return 'health_weather';
 if(/bank|fx|currency|rate|money|pay|password|auth|account|sync/.test(t))return 'finance_account_privacy';
 if(/bus|rail|walk|driv|transport|trip|journey|route|taxi|station/.test(t))return 'transport';
 if(/hawker|food|eat|menu|stall|dish/.test(t))return 'food';
 if(/merli|buddy/.test(t))return 'merli';
 return 'general_ui';
}
const candidates=[];
for(const file of files){
 const code=readFileSync(file,'utf8');
 for(const {type,regex} of patterns){
  for(const match of code.matchAll(regex)){
   const message=match[2].trim();
   if(!/[A-Za-z]{3,}/.test(message)||excluded(message))continue;
   const line=code.slice(0,match.index).split('\n').length;
   const isReviewed=englishStrings.has(message);
   candidates.push({file,line,kind:type,message,classification:isReviewed?'authored_registered':'untriaged_literal',triageArea:area(file,message)});
  }
 }
}
const unique=new Map(candidates.map(x=>[x.file+':'+x.line+':'+x.kind+':'+x.message,x]));
const all=[...unique.values()];
const untriaged=all.filter(x=>x.classification==='untriaged_literal');
const reviewed=all.filter(x=>x.classification==='authored_registered');
const classes=Object.fromEntries([...new Set(untriaged.map(x=>x.triageArea))].map(k=>[k,untriaged.filter(x=>x.triageArea===k).length]));
const output={
 version:'3.7.0',wholeApplicationTranslationPercent:null,
 methodology:'Conservative JS literal scanner; excludes dynamic template strings, HTML attribute text, server responses and many conditional render paths. Untriaged means needs review, NOT verified untranslated.',
 scannedFiles:files,
 candidateCount:all.length,
 exactAuthoredMatches:reviewed.length,
 untriagedCount:untriaged.length,
 untriagedByArea:classes,
 untriagedSamples:untriaged.slice(0,200),
 highRiskReview:untriaged.filter(x=>['finance_account_privacy','health_weather','transport'].includes(x.triageArea)).slice(0,100),
 intentionalExclusions:['provider/operator data','government safety guidance','addresses and place names','freeform user input','template literal and indirect formatting without manual proof']
};
const out=process.argv.find(s=>s.startsWith('--out='));
if(out)writeFileSync(out.slice(6),JSON.stringify(output,null,2)+'\n');
if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(output,null,2)+'\n');
else console.log('V3.7 JS AUDIT: scanned '+files.length+' app JS files; '+all.length+' likely first-party literal candidates, '+untriaged.length+' review candidates (NOT confirmed untranslated). Risks by area: '+JSON.stringify(classes));
if(files.length<12)throw Error('Expected at least 12 app scripts for JS scan');
