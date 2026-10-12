/* Generate a complete per-language, per-string HUMAN review worksheet for V3.7.
 * Review status is deliberately never fabricated. These translations are authored
 * candidates and require fluency + real-world context before approval. */
import {writeFileSync,readFileSync} from 'node:fs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CONTEXT_MESSAGES,CONTEXT_MODES,CONTEXT_FIELDS,CONTEXT_GLOBAL_KEYS} from '../lib/i18n-context-v370.mjs';
const rows=[];
const escapeCsv=value=>'"'+String(value??'').replaceAll('"','""')+'"';
const english=CONTEXT_MESSAGES.en;
for(const {code} of LOCALES.filter(x=>x.code!=='en')){
 const pack=CONTEXT_MESSAGES[code];
 for(const mode of CONTEXT_MODES){
  for(const key of CONTEXT_FIELDS){
   const src=english.modes[mode][key],candidate=pack.modes[mode][key];
   rows.push({locale:code,area:key.includes('places')?'places':'persona',messageKey:mode+'.'+key,sourceEnglish:src,candidateTranslation:candidate,critical:key==='placesCopy'?'source-backed place prioritization':'standard UX',status:'pending',reviewer:'',date:'',notes:''});
  }
 }
 for(const key of CONTEXT_GLOBAL_KEYS){
  rows.push({locale:code,area:key.startsWith('core')?'diagnostics':'journey_places',messageKey:key,sourceEnglish:english.globals[key],candidateTranslation:pack.globals[key],critical:key.startsWith('core')?'data-health indicator':'preserve provider name, route title and count',status:'pending',reviewer:'',date:'',notes:''});
 }
}
const keys=['locale','area','messageKey','sourceEnglish','candidateTranslation','critical','status','reviewer','date','notes'];
const csv=keys.join(',')+'\n'+rows.map(row=>keys.map(k=>escapeCsv(row[k])).join(',')).join('\n')+'\n';
const output=process.argv.find(x=>x.startsWith('--out='));
if(output)writeFileSync(output.slice(6),csv);
else console.log('V3.7 NATIVE SPEAKER REVIEW: '+rows.length+' untranslated-quality decisions across 11 non-English locales; all pending. Supply --out=filename.csv to export.');
if(rows.length!==11*52)throw Error('Incomplete native speaker export');
if(rows.some(x=>!x.candidateTranslation||x.status!=='pending'))throw Error('Translation or review status invalid');
