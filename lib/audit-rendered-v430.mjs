/* V4.3 rendered-text evidence classifier.
 * These are candidate-screen observations, NOT certified translations.
 * Source/operator ownership is never inferred to be first-party by a text difference.
 */
export const AUDIT_VERSION = '4.3.0';
export const AUDIT_POLICY = Object.freeze({
  wholeAppTranslationPercent: null,
  definition: 'Observed first-party UI change rate relative to English, not translation correctness or whole-app coverage',
  statuses: ['changedFromEnglish','unchangedEnglishCandidate','missingAfterLocaleSwitch','sourceProtected','sourceOwnershipReview','invariantExcluded','unclassifiedText']
});
const normalize = value => String(value ?? '').replace(/\s+/g,' ').trim();
const lexical = value => /[A-Za-z]{3,}/.test(value);
const invariant = value => /^(?:SGBUDDY|MERLI|NEA|LTA|MRT|LRT|PSI|PM2\.5|(?:\d{1,2}(?:h|\s*-?\s*hours?))\s*(?:PSI|PM2\.5)|Singapore|MAS|SGD|OneMap|Google Maps|CHAS|MUIS|MICHELIN|CNA|SGT|°[CF]|[\d.,:\-+/%$#()\s·—–]+)$/i.test(value);
export function classifyRenderedPair(source, translated, code) {
  const original = normalize(source?.value), actual = normalize(translated?.value);
  const base = {screen:source.screen, viewport:source.viewport, persona:source.persona,
    key:source.key, kind:source.kind, original, actual:translated?actual:null,
    sourceEvidence:source.ownership || 'unknown'};
  if(source.ownership === 'protected') return {...base,status:'sourceProtected'};
  if(source.ownership === 'review') return {...base,status:'sourceOwnershipReview'};
  if(!original || !lexical(original) || invariant(original)) return {...base,status:'invariantExcluded'};
  if(source.ownership !== 'firstParty') return {...base,status:'unclassifiedText'};
  if(!translated) return {...base,status:'missingAfterLocaleSwitch'};
  // Identical words are suspicious, not guaranteed untranslated (e.g. 'Hotel').
  if(code !== 'en' && actual === original) return {...base,status:'unchangedEnglishCandidate'};
  if(!actual) return {...base,status:'missingAfterLocaleSwitch'};
  return {...base,status:code === 'en'?'invariantExcluded':'changedFromEnglish'};
}
export function aggregateRenderedObservations(observations, target = 95) {
  const statuses = {};
  const locale = {};
  const byScreen = {};
  for(const item of observations) {
    statuses[item.status]=(statuses[item.status]||0)+1;
    const row=locale[item.locale]??={statusCounts:{},byScreen:{}};
    row.statusCounts[item.status]=(row.statusCounts[item.status]||0)+1;
    const screen=row.byScreen[item.screen]??={statusCounts:{}};
    screen.statusCounts[item.status]=(screen.statusCounts[item.status]||0)+1;
    const global=byScreen[item.screen]??={statusCounts:{}};
    global.statusCounts[item.status]=(global.statusCounts[item.status]||0)+1;
  }
  const summarize = item => {
    const counts=item.statusCounts || {};
    const changed=counts.changedFromEnglish||0, remaining=counts.unchangedEnglishCandidate||0;
    const measured=changed+remaining;
    return {...item, observedFirstPartySlots:measured,
      observedChangeRatePercent:measured ? Math.round(changed/measured*1000)/10 : null,
      potentialEnglishCount:remaining,
      reviewQueueCount:(counts.sourceOwnershipReview||0)+(counts.unclassifiedText||0)+(counts.missingAfterLocaleSwitch||0),
      reaches95PercentObservedChangeRate:measured>0 ? changed/measured*100>=target : null};
  };
  for(const [code, row] of Object.entries(locale)){
    for(const [screen, value] of Object.entries(row.byScreen))row.byScreen[screen]=summarize(value);
    locale[code]=summarize(row);
  }
  for(const [screen,value] of Object.entries(byScreen))byScreen[screen]=summarize(value);
  return {auditVersion:AUDIT_VERSION,
    wholeAppTranslationPercent:null,
    nativeSpeakerCertified:false, targetPercent:target,
    methodology:AUDIT_POLICY.definition,
    statuses,locale,byScreen,observedRecords:observations.length};
}
