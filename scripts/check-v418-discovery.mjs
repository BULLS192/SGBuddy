/* V4.18 functional and publication safeguards with deterministic Singapore dates. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publishedDiscovery,publishedSourceState,DISCOVERY_FILTERS} from '../lib/events-discovery-v418.mjs';
import {DISCOVERY_KEYS,DISCOVERY_TEXT,discoveryText} from '../lib/events-discovery-i18n-v418.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {eventsSourceHealth} from '../lib/events-source-health-v418.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const published=read('data/events-v470.json'),queue=read('data/events-review-queue-v470.json'),sources=read('data/event-sources-v470.json');
assert.deepEqual(DISCOVERY_FILTERS,['today','weekend','next7','next30','upcoming','free','markets','family']);
const day='2026-10-14';
const mini=[
 {id:'valid-today',title:'Singapore EXPO Today',venue:'Singapore EXPO',summary:'For families',
  sourceId:'expo',sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/valid-today/',startDate:day,endDate:day,
  verifiedAt:day,verificationMethod:'official_venue_page',category:'family',admission:'free',audiences:['visitor'],status:'scheduled'},
 {id:'valid-week',title:'Culture Week',venue:'Suntec',summary:'Market festival',
  sourceId:'suntec-convention',sourceUrl:'https://www.suntecsingapore.com/visit-events/culture-week',startDate:'2026-10-19',endDate:'2026-10-24',
  verifiedAt:day,verificationMethod:'official_venue_page',category:'culture',admission:'check',audiences:['resident'],status:'scheduled'},
 {id:'valid-month',title:'Exhibition Later',venue:'Suntec',summary:'Exhibition',
  sourceId:'suntec-convention',sourceUrl:'https://www.suntecsingapore.com/visit-events/exhibition-later',startDate:'2026-11-04',endDate:'2026-11-04',
  verifiedAt:day,verificationMethod:'official_venue_page',category:'exhibition',admission:'ticketed',audiences:['visitor'],status:'scheduled'},
 {id:'review-ghost',title:'Unapproved discovery',venue:'Expo',summary:'Unverified',
  sourceId:'expo',sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/review-ghost/',
  startDate:day,endDate:day,verifiedAt:day,verificationMethod:'',category:'family',admission:'free',status:'needs-review'}
];
const ids=(filter,query='')=>publishedDiscovery(mini,day,filter,'visitor',query,sources.sources).map(x=>x.id).sort();
assert.deepEqual(ids('today'),['valid-today']);
assert.deepEqual(ids('next7'),['valid-today','valid-week']);
assert.deepEqual(ids('next30'),['valid-month','valid-today','valid-week']);
assert.deepEqual(ids('next7','SINGAPORE EXPO'),['valid-today']);
assert.deepEqual(ids('next30','Suntec'),['valid-month','valid-week']);
assert.deepEqual(ids('next7','unapproved'),[]);
assert.deepEqual(ids('next7','nonsense'),[]);
assert.deepEqual(ids('incorrect'),[]);
assert.equal(publishedSourceState(mini[0],day,sources.sources),'snapshot');
assert.equal(publishedSourceState({...mini[0],verifiedAt:'2026-09-01'},day,sources.sources),'review-needed');
assert.equal(publishedSourceState({...mini[0],sourceUrl:'https://example.com/event'},day,sources.sources),'source-review');
assert.equal(publishedSourceState(mini[3],day,sources.sources),'unverified');
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES){
 assert.equal(Object.keys(DISCOVERY_TEXT[code]||{}).length,DISCOVERY_KEYS.length,'Locale '+code);
 for(const key of DISCOVERY_KEYS)assert.ok(discoveryText(code,key,{count:1,date:day}).trim().length>=2,'Missing '+key+' '+code);
}
const report=eventsSourceHealth({published,queue,sources,day});
assert.equal(report.listed,published.events.length);
assert.equal(report.queued,queue.candidates.length);
assert.equal(report.unapprovedPublished.length,0);
assert.equal(report.unknownSources.length,0);
assert.ok(report.editorial.length>0&&report.editorial.every(x=>x.requiresEditor&&!x.approvalAllowed));
assert.equal(read('data/event-approvals-v490.json').approvals.length,0);
const app=readFileSync('app-events-v470.js','utf8');
for(const token of ['data-event-search','data-event-results','publishedDiscovery','publishedSourceState','discoveryText','events-disclaimer'])
 assert.ok(app.includes(token),token);
const sw=readFileSync('sw.js','utf8');
for(const path of ['/lib/events-discovery-v418.mjs','/lib/events-discovery-i18n-v418.mjs','/lib/events-source-health-v418.mjs'])
 assert.ok(sw.includes(path),path);
console.log('V4.18 DISCOVERY PASS: rolling days, search, source trust labels, 12 locales, editor-only candidates, zero auto-publication.');
