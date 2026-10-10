import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const ui=read('app-ux-v160.js'),css=read('ux-v160.css'),bootstrap=read('app-v090.js');
const html=read('index.html'),sw=read('sw.js'),legacy=read('app-v140.js');
assert.ok(html.includes('/ux-v160.css'),'UX stylesheet missing from HTML');
assert.ok(bootstrap.includes("import('/app-v140.js')).then(()=>import('/app-ux-v160.js')"),'UX enhancement must load after Merli');
assert.ok(sw.includes('/app-ux-v160.js')&&sw.includes('/ux-v160.css'),'Offline shell must contain UX assets');
assert.match(sw,/sgbuddy-shell-v4[1-9]/,'Service worker cache must advance beyond the baseline');
for(const label of ['Home','Explore','Move','Saved','Profile']){
 assert.ok(ui.includes("'"+label+"'"),'Missing bottom destination '+label);
}
for(const landmark of ['uxHomeSummary','uxExtraConditions','uxNearby','uxSavedView','uxPlaceDialog','uxDialogRoute','v110CompareCard','data-ux-go','sgbuddy:discover-tab','sgbuddy:knowledge-saved']){
 assert.ok(ui.includes(landmark),'UX landmark or interaction missing: '+landmark);
}
assert.ok(ui.includes('originalShow=router.show.bind(router)'),'Original router must remain available');
assert.ok(ui.includes("name==='money'"),'Existing money tools must remain navigable');
assert.ok(ui.includes("savedView.appendChild(savedAddresses)"),'Existing saved addresses must be retained');
assert.ok(ui.includes("document.addEventListener('sgbuddy:weather',update)"),'Daily conditions must react to weather changes');
assert.ok(ui.includes("source-reviewed")||ui.includes('not been independently verified'),'Venue claims must not imply verified live operating hours');
assert.ok(css.includes('@media(min-width:820px)')&&css.includes('@media(max-width:640px)'),'Responsive breakpoints required');
assert.ok(css.includes('focus-visible'),'Accessible focus state missing');
assert.ok(css.includes('prefers-reduced-motion'),'Reduced-motion support missing');
assert.ok(ui.includes("const originalShow=router.show.bind(router)"));
assert.ok(legacy.includes('merlion-companion.webp'),'Approved Merli asset must remain untouched');
assert.ok(!ui.includes('eval('),'Do not evaluate user content');
console.log('UX 1–3 integration checks passed (navigation, consolidated discovery, saved, details, money, Merli, accessibility).');
