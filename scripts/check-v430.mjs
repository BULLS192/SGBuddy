import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AUDIT_VERSION,AUDIT_POLICY,classifyRenderedPair,aggregateRenderedObservations} from '../lib/audit-rendered-v430.mjs';
const source={screen:'discover-eat',viewport:'390x844',persona:'visitor',key:'#filter|text',kind:'text',value:'All categories',ownership:'firstParty'};
const changed=classifyRenderedPair(source,{value:'Toutes les catégories'},'fr');
assert.equal(changed.status,'changedFromEnglish');
assert.equal(classifyRenderedPair(source,{value:'All categories'},'fr').status,'unchangedEnglishCandidate');
assert.equal(classifyRenderedPair(source,undefined,'fr').status,'missingAfterLocaleSwitch');
assert.equal(classifyRenderedPair({...source,ownership:'review'}, {value:'Options françaises'},'fr').status,'sourceOwnershipReview');
assert.equal(classifyRenderedPair({...source,ownership:'protected'},{value:'Different place name'},'fr').status,'sourceProtected');
assert.equal(classifyRenderedPair({...source,value:'MICHELIN'}, {value:'MICHELIN'},'fr').status,'invariantExcluded');
const sample=[
 {...changed,locale:'fr'},
 {...classifyRenderedPair(source,{value:'All categories'},'fr'),locale:'fr',key:'#tab|text'},
 {...classifyRenderedPair({...source,ownership:'review'},undefined,'fr'),locale:'fr',key:'#source|text'},
 {...classifyRenderedPair(source,undefined,'ja'),locale:'ja'},
];
const summary=aggregateRenderedObservations(sample);
assert.equal(AUDIT_VERSION,'4.3.0');
assert.equal(summary.wholeAppTranslationPercent,null);
assert.equal(summary.nativeSpeakerCertified,false);
assert.equal(summary.locale.fr.observedFirstPartySlots,2);
assert.equal(summary.locale.fr.observedChangeRatePercent,50);
assert.equal(summary.locale.fr.reviewQueueCount,1);
assert.equal(summary.locale.ja.observedFirstPartySlots,0);
assert.equal(summary.locale.ja.observedChangeRatePercent,null);
assert.equal(AUDIT_POLICY.wholeAppTranslationPercent,null);
const script=readFileSync('scripts/browser-audit-v430.mjs','utf8');
for(const term of ['capture(page,scene,viewport,persona)','aggregateRenderedObservations(results)','wholeAppTranslationPercent:null','screenshots','triage.csv','summary.md','locale','missingScreens','sourceOwnershipReview'])assert.ok(script.includes(term),'Audit script missing '+term);
const workflow=readFileSync('.github/workflows/check-v430-localization-audit.yml','utf8');
for(const term of ['browser-audit-v430.mjs','playwright@1.56.1','actions/upload-artifact@v4','retention-days: 7'])assert.ok(workflow.includes(term),'Audit CI missing '+term);
console.log('V4.3 STATIC PASS: evidence classification, non-fabricated denominator, locale grouping and artifact workflow');
