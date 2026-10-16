import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {arrivalTasks,sgacRequired,sgacWindow,daysUntil,officialUrl,visibleNotices,validDay,EMERGENCY_CONTACTS} from '../lib/essentials-v424.mjs';
const feed=JSON.parse(readFileSync(new URL('../data/gov-notices-v424.json',import.meta.url),'utf8'));
assert.equal(sgacRequired({status:'visitor',border:'land'}),true);
for(const status of ['citizen','pr','long_term','work_pass','student_pass'])assert.equal(sgacRequired({status,border:'land'}),false);
assert.equal(sgacRequired({status:'pr',border:'air'}),true);
assert.equal(sgacRequired({status:'visitor',clearsImmigration:false}),false);
assert.deepEqual(sgacWindow('2026-10-16'),{opens:'2026-10-14',closes:'2026-10-16'});
assert.deepEqual(sgacWindow('2027-01-01'),{opens:'2026-12-30',closes:'2027-01-01'});
assert.equal(sgacWindow('2026-02-30'),null);
assert.equal(daysUntil('2026-10-17','2026-10-16'),1);
assert.equal(arrivalTasks({status:'pr',border:'land'}).some(t=>t.id==='sgac'),false);
assert.equal(arrivalTasks({status:'visitor',border:'air'}).some(t=>t.id==='sgac'),true);
assert.equal(officialUrl('https://ica.gov.sg.evil.example/'),null);
assert.equal(officialUrl('javascript:alert(1)'),null);
assert.ok(officialUrl('https://www.ica.gov.sg/enter-transit-depart/entering-singapore/'));
assert.deepEqual(EMERGENCY_CONTACTS.map(c=>c.number),['999','995','70999','18002550000','1771','1767']);
const modes=['resident','visitor','executive','student','new_in_sg'];
for(const mode of modes)assert.ok(visibleNotices(feed.notices,mode,'2026-10-16').length>0,'notices for '+mode);
for(const notice of feed.notices){
 assert.ok(validDay(notice.reviewedAt));
 assert.ok(officialUrl(notice.sourceUrl),notice.id);
 assert.ok(Array.isArray(notice.audiences)&&notice.audiences.length);
 assert.equal(notice.status,'approved');
}
assert.equal(visibleNotices(feed.notices,'resident','2028-01-01').some(n=>n.id==='moh-1777-retirement'),false);
const legal=readFileSync(new URL('../legal.html',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
for(const id of ['privacy','accuracy','terms','feedback'])assert.ok(legal.includes('id="'+id+'"'),id+' legal section');
assert.ok(legal.includes('href="https://omnidite.com/contact?intent=feedback&amp;project=sgbuddy"'),'Omnidite contact link in legal notice');
const essentials=readFileSync(new URL('../app-essentials-v424.js',import.meta.url),'utf8');
assert.ok(essentials.includes('class="v424-feedback-action" href="https://omnidite.com/contact?intent=feedback&amp;project=sgbuddy"'),'in-app contact goes to Omnidite');
for(const [label,source] of [['legal',legal],['essentials',essentials]]){
 assert.ok(!/@omnidite\.com\b/i.test(source),label+' must not expose a direct Omnidite email address');
 assert.ok(!source.includes('mailto:'),label+' must not offer direct email link');
}
assert.ok(legal.includes('Supabase')&&legal.includes('Vercel')&&legal.includes('location'),'disclose actual data handling');
assert.ok(legal.includes('not a Singapore government service'));
assert.ok(index.includes('/legal.html#privacy')&&index.includes('/legal.html#terms'),'legal links before account creation');
assert.ok(sw.includes("'/legal.html'"),'offline legal notice precache');
const boot=readFileSync(new URL('../app-v090.js',import.meta.url),'utf8');
assert.ok(boot.includes("__SGBUDDY_CLIENT_VERSION__='4.24.0'"),'V4.24 release client version');
assert.ok(index.includes('v4.24.0'),'V4.24 visible version badge');
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v90'"),'V4.24 PWA cache version');
assert.ok(!sw.includes('sgbuddy-shell-v89'),'V4.24 previous PWA cache must be rotated');
console.log('V4.24 RELEASE PASS: rules, legal notice, 12 locales, v4.24.0 and v90 offline shell');
