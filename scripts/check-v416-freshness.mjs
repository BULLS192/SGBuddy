import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OFFLINE_CACHE,OFFLINE_PACKS} from '../lib/offline-packs-v480.mjs';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {compareOfflineValidators,checkDownloadedPublicPacks} from '../lib/offline-freshness-v416.mjs';
import {OFFLINE_V416,OFFLINE_V416_KEYS,offline416Text} from '../lib/offline-freshness-i18n-v416.mjs';
const response=(etag,lastModified,status=200)=>new Response('',{status,headers:{...(etag?{etag}:{}),...(lastModified?{'last-modified':lastModified}:{})}});
assert.equal(compareOfflineValidators(response('"old"'),response('"new"')),'changed');
assert.equal(compareOfflineValidators(response('"old"'),response('"old"')),'same');
assert.equal(compareOfflineValidators(response('W/"old"'),response('W/"new"')),'unknown');
assert.equal(compareOfflineValidators(response(null,'Tue, 13 Oct 2026 12:00:00 GMT'),response(null,'Wed, 14 Oct 2026 12:00:00 GMT')),'changed');
assert.equal(compareOfflineValidators(response(null,'Tue, 13 Oct 2026 12:00:00 GMT'),response(null,'Tue, 13 Oct 2026 12:00:00 GMT')),'same');
assert.equal(compareOfflineValidators(response(null,'Wed, 14 Oct 2026 12:00:00 GMT'),response(null,'Tue, 13 Oct 2026 12:00:00 GMT')),'unknown');
assert.equal(compareOfflineValidators(response('"a"'),response('"b"',null,503)),'unknown');
assert.equal(OFFLINE_CACHE,'sgbuddy-offline-packs-v480');
const files=OFFLINE_PACKS[0].files;
const stored=new Map([[files[0],response('"same"')],[files[1],response('"old"')],[files[2],response('W/"weak"')]]);
let calls=[],mutations=0;
const cache={match:async f=>stored.get(f),put:async()=>{mutations++},delete:async()=>{mutations++}};
const probe=async f=>{calls.push(f);if(f===files[0])return response('"same"');if(f===files[1])return response('"new"');throw Error('network unavailable')};
const rows=await checkDownloadedPublicPacks(cache,OFFLINE_PACKS,{origin:'https://sgbuddy.omnidite.com',probe});
assert.deepEqual(rows.map(r=>r.present),[3,0,0]);
assert.deepEqual(rows[0],{id:'calendar',present:3,same:1,changed:1,unknown:1});
assert.equal(calls.length,3);assert.equal(mutations,0);
await assert.rejects(checkDownloadedPublicPacks(cache,[{id:'bad',files:['/api/weather']}],{origin:'https://sgbuddy.omnidite.com',probe}),/allowlisted/);
assert.equal(LOCALES.length,12);
for(const {code} of LOCALES){
 assert.equal(Object.keys(OFFLINE_V416[code]||{}).length,OFFLINE_V416_KEYS.length,code);
 for(const k of OFFLINE_V416_KEYS){const s=offline416Text(code,k,{count:4});assert.ok(s.length>6&&!s.includes('{count}'),code+' '+k);}
}
const sw=readFileSync('sw.js','utf8'),app=readFileSync('app-offline-v480.js','utf8');
assert.ok(sw.includes('/lib/offline-freshness-v416.mjs')&&sw.includes('/lib/offline-freshness-i18n-v416.mjs'));
assert.ok(app.includes('data-offline-check-changes')&&app.includes("method:'HEAD'")&&app.includes("redirect:'error'"));
assert.ok(!app.includes("window.addEventListener('online',checkForChanges"));
assert.ok(sw.includes("const CACHE = 'sgbuddy-shell-v80'")&&sw.includes('sgbuddy-offline-packs-v480'));
console.log('V4.16 WAVE 1 PASS — HEAD-only changed/unchanged/unknown comparison; opt-in isolation; no cache writes; 12 locales.');
