import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const css=read('theme-polish-v241.css'),mainCss=read('ux-v160.css'),boot=read('app-v090.js'),
 discover=read('app-v120.js'),ux=read('app-ux-v160.js'),persona=read('app-ux-v170.js'),
 html=read('index.html'),worker=read('sw.js');
const color=h=>{const s=h.replace('#','');assert.ok(/^[a-f0-9]{6}$/i.test(s));const rgb=[0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255);return rgb.map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4))};
const lum=h=>{const c=color(h);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const ratio=(bg,fg)=>{const [x,y]=[lum(bg),lum(fg)].sort((a,b)=>b-a);return (x+.05)/(y+.05)};
const pairs={
 'light primary button':['#11665e','#ffffff'],
 'light selected navigation':['#11665e','#ffffff'],
 'light information badge':['#e6f3f1','#12584f'],
 'light mode selector':['#e6f3f1','#14564e'],
 'light app publisher link':['#ffffff','#145a86'],
 'light secondary action':['#ecf4f7','#17495e']
};
for(const [name,[bg,fg]] of Object.entries(pairs)){
 const score=ratio(bg,fg);
 assert.ok(score>=4.5,name+' contrast below WCAG AA: '+score.toFixed(2));
 assert.ok(css.includes(bg)&&css.includes(fg),'Expected contrast color missing: '+name);
}
for(const name of ['mode-pill','version-badge','bottom-nav','data-nav-target','manual button','primary','discover-actions a','app-guide-links a','sync-badge'])assert.ok(css.includes(name),'Missing contrast surface: '+name);
assert.ok(mainCss.includes('html[data-ux-theme="light"]'),'Existing iOS appearance controls lost');
assert.ok(ux.includes("['navPlaces','places','Discover','explore']"),'Nav Discover label must be visible');
assert.ok(ux.includes('isApps=tab===\'apps\''),'Apps need separate tab visibility');
assert.ok(ux.includes('setHidden(results,isNearby||isFacts||isApps)'),'Legacy app results should not duplicate V2.4 guide');
assert.ok(persona.includes("'Everyday apps'")&&persona.includes(",'apps']"),'One-tap app shortcut missing for resident');
assert.ok(persona.includes("active==='places'?'Discover'"),'Accessible skip link must use Discover');
assert.ok(discover.includes("['apps','Everyday apps']"),'Apps category missing');
assert.ok(html.includes('theme-polish-v241.css'),'Theme hotfix must load after prior styles');
assert.ok(worker.includes('/theme-polish-v241.css')&&/sgbuddy-shell-v(5[3-9]|[6-9][0-9])/.test(worker),'Installed PWA hotfix cache missing');
assert.ok(/(?:2\.(5|6|7|8|9)|3\.(0|1|2|3|4|5|6|7|8|9|10|11|12)|4\.1)\.[0-9]+/.test(boot)&&!boot.includes('2.4.0-preview'),'Production version badge must not say preview');
console.log('SGBuddy V2.4.2 theme/navigation hotfix PASS: WCAG AA contrast pairs, Discover navigation, apps shortcut and PWA refresh');
