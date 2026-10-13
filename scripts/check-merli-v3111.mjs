import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(name, 'utf8');
const html=read('index.html'), app=read('app-v090.js'), sw=read('sw.js');
const css=read('merli-avatar-v3111.css'), script=read('merli-avatar-v3111.js');
for(const file of ['/merli-avatar-v3111.css','/merli-avatar-v3111.js']){
  assert.ok(html.includes(file),'Missing hotfix markup '+file);
  assert.ok(sw.includes(file),'Missing PWA asset '+file);
}
assert.ok(html.includes('v3.12.0') && app.includes("'3.12.0'"),'Version not updated');
assert.ok(sw.includes('sgbuddy-shell-v72'),'PWA cache not refreshed');
for(const rule of ['.buddy-symbol','.ux-merli-home-hint img','clip-path: circle(50%']){
  assert.ok(css.includes(rule),'Missing avatar styling '+rule);
}
for(const token of ['isExteriorWhite','removeExteriorMatte','Math.min(r, g, b) >= 225','pixels[index * 4 + 3] = 0','MutationObserver','SOURCE']){
  assert.ok(script.includes(token),'Missing non-destructive matte-cleaning behavior '+token);
}
console.log('SGBuddy V3.11.1 Merli avatar checks passed.');
