import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const ui=read('app-ux-v170.js'),previous=read('app-ux-v160.js'),css=read('ux-v170.css');
const page=read('index.html'),bootstrap=read('app-v090.js'),sw=read('sw.js');
const merli=read('app-v140.js'),discover=read('app-v120.js'),nearby=read('app-v110.js');
assert.doesNotThrow(()=>new Function(ui),'UX v170 module has a syntax error');
assert.doesNotThrow(()=>new Function(previous),'UX v160 module has a syntax error');
assert.ok(page.includes('href="/ux-v170.css"'),'UX v170 stylesheet missing');
assert.ok(bootstrap.includes("import('/app-ux-v160.js')).then(()=>import('/app-ux-v170.js')"),'UX modules must load after V1.4 Merli');
assert.ok(sw.includes("sgbuddy-shell-v42"),'PWA cache version must advance');
for(const asset of ['/ux-v160.css','/ux-v170.css','/app-ux-v160.js','/app-ux-v170.js']){
  assert.ok(sw.includes(asset),'Offline shell is missing '+asset);
}
for(const mode of ['resident','visitor','executive','student','new_in_sg']){
  assert.ok(ui.includes(mode+':{'),'Persona-specific UX missing for '+mode);
  assert.ok(ui.includes("label:'"+({resident:'Resident',visitor:'Tourist',executive:'Business',student:'Student',new_in_sg:'New in SG'}[mode])+"'"),'Friendly label missing for '+mode);
}
assert.ok(ui.includes("document.addEventListener('sgbuddy:persona'"),'Must rerender when the app changes modes');
assert.ok(ui.includes("const safeMode=")&&ui.includes("state.mode"),'Mode must use canonical core preference');
assert.ok(ui.includes("$('#modeButton')")&&ui.includes('current.click()'),'Mode selector must reuse original onboarding/settings flow');
assert.ok(ui.includes('uxPersonaBanner')&&ui.includes('uxAccountMode')&&ui.includes('uxPersonaJourney'),'Home/Profile/Move mode summaries missing');
assert.ok(ui.includes('uxExploreContext'),'Discover mode explanation missing');
assert.ok(ui.includes('uxMerliContext')&&ui.includes('uxMerliSuggestions')&&ui.includes('uxMerliMore'),'Merli suggestion controls missing');
assert.ok(ui.includes("target?.click()"),'Merli suggestions must delegate to the existing actions');
assert.ok(merli.includes('merlion-companion.webp')&&merli.includes('askAdvisor'),'Preserve approved avatar and advisor');
assert.ok(ui.includes('showAllMerli')&&ui.includes("merliMore.setAttribute('aria-controls'"),'Accessible Merli expanded actions missing');
assert.ok(ui.includes('validAir()')&&ui.includes('psi?.updatedAt')&&ui.includes("w?.source==='device-cache'"),'Source freshness guard missing');
assert.ok(ui.includes("psi!==null&&psi>100")||ui.includes("reading!==null&&reading>100"),'Air quality context must require valid data');
assert.ok(ui.includes("function renderPersona()")&&ui.includes('updateMerli()')&&ui.includes('updateHint()'),'Mode changes must refresh Merli');
assert.ok(ui.includes('studentCue')&&ui.includes('SGBUDDY_PLACE_INDEX_RENDERER'),'Student client-side prioritization missing');
assert.ok(nearby.includes("requestedPersona==='student'?'new_in_sg':requestedPersona"),'Legacy database limitation unexpectedly changed');
assert.ok(discover.includes('data-discover-tab'),'Discover content must remain available');
for(const feature of ['role=','aria-live','aria-busy','MutationObserver','focus','skip-link','ArrowRight','ArrowLeft','prefers-reduced-motion']){
  assert.ok((ui+css).includes(feature),'Accessibility/quality feature missing: '+feature);
}
assert.ok(css.includes('html[data-ux-theme="light"]'),'Light mode styling missing');
assert.ok(css.includes('@media(max-width:540px)'),'Mobile breakpoint missing');
assert.ok(css.includes('prefers-reduced-motion:reduce'),'Reduced motion fallback missing');
assert.ok(previous.includes("if(isNearby)$$('[data-discover-tab]').forEach"),'Near me tab must not invoke forEach on one element');
assert.ok(ui.includes("1.6.0"),'Stable version marker missing');
console.log('SGBuddy UX 4–6 checks passed: five audience contexts, Merli, offline cache, navigation and accessible states.');
