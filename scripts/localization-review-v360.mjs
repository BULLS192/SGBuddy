/* V3.6: classify exactly the 33 HTML literals from V3.5; no global percent.
 * The report is intentionally an editorial coverage and human-review queue.
 * Imported live/provider data and text outside the audited screen sample are excluded. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {CLASSIFIED_KEYS,CLASSIFIED_MESSAGES,HTML_CLASSIFICATION} from '../lib/i18n-classified-v360.mjs';
const prior=JSON.parse(execFileSync(process.execPath,['scripts/coverage-audit-v350.mjs','--json'],{encoding:'utf8'}));
const newQueue=prior.htmlReviewQueue;
const categories=Object.keys(HTML_CLASSIFICATION);
const classified=Object.entries(HTML_CLASSIFICATION).flatMap(([category,ids])=>ids.map(id=>({id,category})));
const classificationById=new Map(classified.map(item=>[item.id,item.category]));
assert.equal(newQueue.length,33,'Prior V3.5 HTML candidate queue changed — revisit every decision');
assert.equal(classified.length,33,'Exactly 33 candidates must be classified');
assert.equal(classificationById.size,33,'Candidate cannot appear in multiple categories');
for(const item of newQueue)assert.ok(classificationById.has(item.id),'Unclassified '+item.id);
for(const item of classified)assert.ok(newQueue.some(x=>x.id===item.id),'Classification no longer matches discovered HTML: '+item.id);
assert.equal(HTML_CLASSIFICATION.localizedNew.length,14);
const mappedValues={
 greeting:['greetMorning','greetAfternoon','greetEvening'],
 accountButtonText:['guestAccount'],locationStatus:['locationUnset'],
 sourceBadge:['sourceLive','sourceMixed','sourceDemo'],
 unitsToggle:['unitsMetric','unitsImperial'],
 editPersonaButton:['editMode'],goHotelButton:['goHotel'],
 placesCardsButton:['placesCards'],placesMapButton:['placesMap'],
 fitPlacesMap:['placesFit'],signInButton:['signIn'],
 createAccountButton:['createAccount'],allowLocationButton:['useLocation'],
 notNowLocationButton:['notNow']
};
assert.deepEqual(Object.keys(mappedValues).sort(),HTML_CLASSIFICATION.localizedNew.slice().sort());
assert.deepEqual(new Set(Object.values(mappedValues).flat()),new Set(CLASSIFIED_KEYS));
const code=readFileSync('app-i18n-classified-v360.js','utf8');
for(const id of HTML_CLASSIFICATION.localizedNew)assert.ok(code.includes('#'+id),'V3.6 control not bound: '+id);
for(const id of [...HTML_CLASSIFICATION.providerOwned,...HTML_CLASSIFICATION.properNames])
 assert.ok(!code.includes('#'+id),'Sensitive third-party or proper-name control must not be rewritten: '+id);
const baselineKeys=prior.registeredKeysPerLocale;
const baselineGroups=prior.registeredCatalogues;
const review=[];
for(const {code:locale} of LOCALES){
 const pack=CLASSIFIED_MESSAGES[locale]||{};
 assert.equal(Object.keys(pack).length,CLASSIFIED_KEYS.length,locale+' dictionary incomplete');
 const missing=CLASSIFIED_KEYS.filter(k=>!String(pack[k]||'').trim());
 const identical=locale==='en'?[]:CLASSIFIED_KEYS.filter(k=>pack[k]===CLASSIFIED_MESSAGES.en[k]);
 const invalid=CLASSIFIED_KEYS.filter(k=>/\uFFFD/.test(String(pack[k])));
 const unitsValid=String(pack.unitsMetric).includes('°C')&&String(pack.unitsImperial).includes('°F');
 assert.deepEqual(missing,[],locale+' missing translated values');
 assert.deepEqual(invalid,[],locale+' replacement glyph detected');
 assert.ok(unitsValid,locale+' unit symbol mismatch');
 review.push({locale,defined:CLASSIFIED_KEYS.length,populated:CLASSIFIED_KEYS.length-missing.length,identicalEnglishKeys:identical,missing,unitGlyphsValid:unitsValid,nativeSpeakerApproved:false});
}
const report={
 version:'3.6.0',
 wholeApplicationCoveragePercent:null,
 note:'Audit classification, dictionary population and automated checks are not native-speaker editorial approval or application-wide translation completeness.',
 previousHtmlCandidates:newQueue.length,
 classificationCounts:Object.fromEntries(categories.map(k=>[k,HTML_CLASSIFICATION[k].length])),
 reviewedHtmlCandidates:newQueue.map(({id,message})=>({id,message,category:classificationById.get(id)})),
 remainingDynamicFirstPartyIds:HTML_CLASSIFICATION.dynamicFollowUp,
 providerOwnedIdsPreserved:HTML_CLASSIFICATION.providerOwned,
 properNamesPreserved:HTML_CLASSIFICATION.properNames,
 baselineRegisteredKeys:baselineKeys,
 newCataloguedKeys:CLASSIFIED_KEYS.length,
 registeredCatalogues:baselineGroups+1,
 registeredKeysPerLocale:baselineKeys+CLASSIFIED_KEYS.length,
 registeredPopulatedEntriesIncludingEnglish:(baselineKeys+CLASSIFIED_KEYS.length)*LOCALES.length,
 locales:review,
 humanReview:{status:'PENDING',requiredLanguages:LOCALES.filter(x=>x.code!=='en').map(x=>x.code),criticalTopics:['legal and medical notices','financial / FX precision','air quality and transport safety','mobile truncation and screen reader announcements'],reviewWorksheet:'docs/native-review-v360.csv'}
};
const json=JSON.stringify(report,null,2)+'\n',output=process.argv.find(x=>x.startsWith('--out='));
if(output)writeFileSync(output.slice(6),json);
if(process.argv.includes('--json'))process.stdout.write(json);
else{
 console.log('V3.6 HTML CLASSIFICATION: '+newQueue.length+'/'+newQueue.length+' candidates resolved into explicit classes; '+report.newCataloguedKeys+' first-party message states across '+review.length+' locales');
 console.log('Classes: '+categories.map(k=>k+':'+HTML_CLASSIFICATION[k].length).join(', '));
 console.log('Registered catalogue: '+report.registeredKeysPerLocale+' messages per locale, '+report.registeredPopulatedEntriesIncludingEnglish+' total including English.');
 console.log('Native-speaker review: PENDING; whole-app translation percentage: NOT ESTABLISHED.');
}
