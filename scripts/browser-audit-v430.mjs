/* SGBuddy V4.3 — observational, screen-by-screen localization baseline.
 * No language forcing or mutation of UI text. All data is synthetic test state.
 * Produce evidence: comparable first-party DOM slots plus unresolved ownership,
 * NOT native-reviewed translations or an app-wide completeness percentage.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {classifyRenderedPair, aggregateRenderedObservations} from '../lib/audit-rendered-v430.mjs';
const outArg=process.argv.find(x=>x.startsWith('--out-dir='));
const output=outArg?.slice('--out-dir='.length)||'artifacts/localization-v430';
const takeShots=process.argv.includes('--screenshots');
const browser=await chromium.launch({headless:true});
const languages=LOCALES.filter(x=>x.code!=='en').map(x=>x.code);
const rootUrl='http://127.0.0.1:8765/';
const scenarios=[
 {id:'today',scope:'.v1-view[data-view="today"]',route:'today'},
 {id:'transport',scope:'.v1-view[data-view="move"]',route:'move'},
 {id:'saved',scope:'#uxSavedView',route:'saved'},
 {id:'account',scope:'.v1-view[data-view="account"]',route:'account'},
 ...['eat','do','shop','essentials','healthcare','apps','travel','trip','facts'].map(tab=>({id:'discover-'+tab,scope:'#discoverHub',route:'places',tab})),
 ...['stalls','dishes','menus','hawker-menus'].map(food=>({id:'food-'+food,scope:'#foodExplorer',route:'places',tab:'eat',food})),
 {id:'merli-assistant',scope:'#buddyPanel',route:'today',merli:true}
];
const results=[],missingScreens=[],errors=[],metrics={};
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
function capture(page,scene,viewport,persona){
 return page.evaluate(({scene,viewport,persona})=>{
  const host=document.querySelector(scene.scope);
  const visible=el=>{
   if(!el||el.closest('[hidden],.hidden,[aria-hidden="true"]'))return false;
   let n=el;while(n&&n.nodeType===1){
    const st=getComputedStyle(n);if(st.display==='none'||st.visibility==='hidden')return false;n=n.parentElement;
   }
   return true;
  };
  if(!host||!visible(host))return {screen:scene.id,observed:false,reason:!host?'missing-root':'hidden-root',slots:[]};
  const exclusion=el=>el?.closest('script,style,svg,template,noscript,[data-audit-skip]');
  const value=s=>String(s||'').replace(/\s+/g,' ').trim();
  const path=el=>{
   if(el.id)return '#'+el.id;
   let curr=el,parts=[];
   while(curr&&curr!==host&&parts.length<8){
    if(curr.id){parts.unshift('#'+curr.id);break}
    const parent=curr.parentElement;
    if(!parent)break;
    const siblings=[...parent.children].filter(c=>c.tagName===curr.tagName);
    const position=siblings.indexOf(curr)+1;
    parts.unshift(curr.tagName.toLowerCase()+(siblings.length>1?':nth-of-type('+position+')':''));
    curr=parent;
   }
   return (parts[0]?.startsWith('#')?'':scene.scope+' > ')+parts.join(' > ');
  };
  const ownership=el=>{
   // The expandable English-original MUIS warning is deliberately retained for verification.
   if(el.closest('#sgbFoodOriginalWarning,#sgbFoodLocalizedWarning a[href*="muis.gov.sg"]'))return 'protected';
   // Area and neighbourhood names are source place names, not untranslated UI.
   const option=el.closest('option');
   if(option&&['discoverAreaFilter','discoverNeighbourhoodFilter','foodArea','foodPickArea'].includes(option.parentElement?.id)&&!['all','any'].includes(option.value))return 'protected';
   if(el.closest('.discover-item h3, .food-stall h4, .food-picked-card h4, .food-provider-card h5, .ux-saved-list strong, .place-suggestion strong, .popular-destinations button[data-destination]'))return 'protected';
   if(el.closest('#envSource,#envUpdated,#fxRateMeta,#moneySourceNote,#moneyChangerResults,#accountEmailDisplay,#profileId,#journeyResults,#transportMap,#envTemp,#envHumidity,#envRain,#envWind,#envPsi,#envPm25'))return 'protected';
   if(el.closest('.discover-item,.food-stall,.food-provider-card,.food-picked-card,.sgb-fact,.buddy-reply,.food-address')&&!el.closest('button,[role="button"],.discover-actions a,.food-card-actions a'))return 'review';
   if(el.closest('[data-content-localized="true"]'))return 'review'; // published/editorial text needs source review
   if(el.closest('[role="status"],[aria-live="polite"]')&&!el.closest('button'))return 'review';
   return 'firstParty';
  };
  const rows=new Map();
  const put=(el,kind,raw)=>{
   if(!visible(el)||exclusion(el))return;
   let original=value(raw);
   if(original.length<3||original.length>260||!/\p{L}/u.test(original))return;
   const key=path(el)+'|'+kind;
   if(!rows.has(key))rows.set(key,{screen:scene.id,viewport,persona,key,kind,value:original,ownership:ownership(el)});
  };
  const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const node=walker.currentNode,el=node.parentElement;
   if(!el||!visible(el)||exclusion(el)||el.tagName==='OPTION')continue;
   // Native options are captured exactly once, by their stable values below.
   put(el,'text',node.textContent);
  }
  for(const el of host.querySelectorAll('input,textarea,select,button,a,[role="button"],[aria-label],[title]')){
   if(!visible(el)||exclusion(el))continue;
   for(const key of ['placeholder','aria-label','title'])if(el.hasAttribute(key))put(el,key,el.getAttribute(key));
   // Native <option> nodes are not visible as rectangles, but their select is.
   if(el.tagName==='SELECT')for(const opt of el.options)if(value(opt.textContent)){
    const oKey=path(el)+'|option:'+opt.value;
    rows.set(oKey,{screen:scene.id,viewport,persona,key:oKey,kind:'option',value:value(opt.textContent),ownership:ownership(opt)});
   }
  }
  return {screen:scene.id,observed:true,slots:[...rows.values()].slice(0,950),
    overflow:document.documentElement.scrollWidth>innerWidth+12};
 },{scene,viewport,persona});
}
async function prepare(page,scene){
 await page.evaluate(route=>window.SGBUDDY_CORE.navigateTo(route),scene.route);
 if(scene.tab)await page.evaluate(tab=>document.querySelector('[data-discover-tab="'+tab+'"]')?.click(),scene.tab);
 if(scene.food)await page.evaluate(food=>document.querySelector('[data-food-view="'+food+'"]')?.click(),scene.food);
 if(scene.merli)await page.evaluate(()=>{
  const p=document.querySelector('#buddyPanel');
  if(p?.hidden)document.querySelector('#buddyLauncher')?.click();
 });
 // React to events and render from cached local JSON; not waiting for live feeds.
 await page.waitForTimeout(55);
}
async function runViewport(viewport){
 const context=await browser.newContext({viewport,locale:'en-SG',serviceWorkers:'block'});
 await context.addInitScript(()=>{
  localStorage.setItem('sgc-persona-onboarded','1');
  localStorage.setItem('sgc-mode','visitor');
  localStorage.setItem('sgc-location-choice','not-now');
 });
 const page=await context.newPage();
 const viewportId=viewport.width+'x'+viewport.height,persona='visitor';
 page.on('pageerror',e=>errors.push({viewport:viewportId,message:e.message.slice(0,240)}));
 try{
  await page.goto(rootUrl,{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>document.querySelector('#appVersion')?.textContent==='v4.2.0'&&!!window.SGBUDDY_CORE&&!!document.querySelector('#discoverHub'),{timeout:35000});
  await page.locator('#sgbLanguage').selectOption('en');
  const baselines=new Map();
  for(const scene of scenarios){
   await prepare(page,scene);
   const snapshot=await capture(page,scene,viewportId,persona);
   if(!snapshot.observed)missingScreens.push({viewport:viewportId,locale:'en',screen:scene.id,reason:snapshot.reason});
   baselines.set(scene.id,snapshot);
  }
  for(const locale of languages){
   await page.locator('#sgbLanguage').selectOption(locale);
   await page.waitForFunction(code=>document.documentElement.lang===code,locale,{timeout:8000});
   for(const scene of scenarios){
    await prepare(page,scene);
    const sample=await capture(page,scene,viewportId,persona);
    const baseline=baselines.get(scene.id);
    if(!sample.observed){missingScreens.push({viewport:viewportId,locale,screen:scene.id,reason:sample.reason});continue}
    if(sample.overflow)errors.push({viewport:viewportId,locale,screen:scene.id,message:'horizontal-overflow'});
    if(!baseline.observed)continue;
    const map=new Map(sample.slots.map(slot=>[slot.key,slot]));
    for(const original of baseline.slots){
     const pair=classifyRenderedPair(original,map.get(original.key),locale);
     results.push({...pair,locale});
    }
    if(takeShots&&viewport.width===390&&['today','discover-eat','transport','saved','merli-assistant'].includes(scene.id)){
     const folder=join(output,'screenshots');mkdirSync(folder,{recursive:true});
     await page.screenshot({path:join(folder,locale+'-'+scene.id+'.png'),fullPage:false,animations:'disabled'});
    }
   }
   console.log('V4.3 observed '+locale+' on '+viewportId+': '+results.filter(r=>r.locale===locale&&r.viewport===viewportId).length+' comparable slots');
  }
 }finally{await context.close()}
}
try{
 mkdirSync(output,{recursive:true});
 for(const vp of [{width:390,height:844},{width:1366,height:900}])await runViewport(vp);
 const summary=aggregateRenderedObservations(results);
 const report={...summary,
  auditDate:new Date().toISOString(),appVersion:'4.2.0',sourceBranch:'V4.3 audit development',personasSampled:['visitor'],
  viewportSizes:['390x844','1366x900'],scenariosAttempted:scenarios.map(s=>s.id),
  conditionalStatesNotExhaustivelyTested:true,wholeAppTranslationPercent:null,
  limitations:['Observed change from English is NOT proof of correct translation','Unknown source/editorial ownership excluded from denominator','User-entered, server/API error variants and all persona combinations are not exhaustive','Native-speaker and device-level PWA review still pending','Repeated DOM states are observations, not deduplicated global translation keys'],
  absentScreens:missingScreens,clientErrors:errors,
  evidence:results};
 const unresolved = new Map();
 for(const item of results.filter(x=>x.status==='unchangedEnglishCandidate')){
   const key=item.key+'|'+item.original;
   const v=unresolved.get(key)||{key:item.key,english:item.original,locales:new Set(),screens:new Set(),viewports:new Set(),examples:0};
   v.locales.add(item.locale);v.screens.add(item.screen);v.viewports.add(item.viewport);v.examples++;
   unresolved.set(key,v);
 }
 const priorityCandidates=[...unresolved.values()].map(x=>({...x,locales:[...x.locales].sort(),screens:[...x.screens].sort(),viewports:[...x.viewports].sort()}))
   .sort((a,b)=>b.locales.length-a.locales.length||b.screens.length-a.screens.length||b.examples-a.examples).slice(0,150);
 const byScreenSummary=Object.fromEntries(Object.entries(summary.byScreen).map(([screen,item])=>[screen,{
   observedChangeRate:item.observedChangeRatePercent,unchangedEnglish:item.potentialEnglishCount,
   needsReview:item.reviewQueueCount}]));
 const priorityMarkdown=[
   '# V4.3 prioritized English review queue','',
   'These are unchanged English first-party UI candidates, **not confirmed translation errors**. Source and operator text are excluded from this queue.','',
   '| Candidate English label | Languages unchanged | Screens | Evidence occurrences |',
   '|---|---:|---|---:|',
   ...priorityCandidates.slice(0,60).map(x=>'| '+x.english.replace(/\|/g,'/').slice(0,105)+' | '+x.locales.length+' | '+x.screens.join(', ').slice(0,90)+' | '+x.examples+' |'),
   '', 'A text string may legitimately be identical in two languages; a native-speaker should adjudicate it before marking untranslated.',''
 ].join('\n');
 report.byScreenSummary=byScreenSummary;
 report.priorityCandidates=priorityCandidates;
 const md=[
 '# SGBuddy V4.3 rendered-screen localization audit','',
 '**Not a verified whole-app completion percentage.** English baseline: V4.2.0; 12 supported locales, two Chromium viewports, Visitor persona.',
 '',
 '| Locale | Comparable authored text slots | Changed vs English | Unchanged English candidates | Review / uncertain |',
 '|---|---:|---:|---:|---:|',
 ...languages.map(c=>{
  const x=summary.locale[c]||{};
  return '| '+c+' | '+(x.observedFirstPartySlots??0)+' | '+(x.observedChangeRatePercent===null?'unmeasured':x.observedChangeRatePercent+'%')+' | '+(x.potentialEnglishCount??0)+' | '+(x.reviewQueueCount??0)+' |';
 }), '',
 '## Caveats','- A changed word is not a verified translation.',
 '- Source/operator content, proper nouns, numerical readings and unknown ownership are not counted as missing translations.',
 '- Only the Visitor persona and a defined set of screen states are sampled; whole-app coverage is **null**.',
 '- Human review must adjudicate unchanged-English candidates and conditional UI; inspect JSON/CSV below.', '',
 '## Screen coverage',
 '| Scenario | Observed authored slots | Observed change rate | Unchanged candidates |',
 '|---|---:|---:|---:|',
 ...Object.entries(summary.byScreen).map(([id,x])=>'| '+id+' | '+x.observedFirstPartySlots+' | '+(x.observedChangeRatePercent??'—')+'% | '+x.potentialEnglishCount+' |'),
 '', 'Missing/hidden screen samples: '+missingScreens.length+'. Browser errors/overflow: '+errors.length+'.',''
 ].join('\n');
 const header=['locale','viewport','screen','status','sourceEvidence','kind','key','original','actual'];
 const csv=x=>'"'+String(x??'').replace(/"/g,'""').replace(/\r?\n/g,' ')+'"';
 const records=[header.join(','),...results.map(x=>header.map(k=>csv(x[k])).join(','))].join('\n')+'\n';
 writeFileSync(join(output,'coverage.json'),JSON.stringify(report,null,2)+'\n');
 writeFileSync(join(output,'triage.csv'),records);
 writeFileSync(join(output,'summary.md'),md);
 writeFileSync(join(output,'priority.md'),priorityMarkdown);
 writeFileSync(join(output,'priority.json'),JSON.stringify(priorityCandidates,null,2)+'\n');
 console.log('V4.3 BY SCREEN '+JSON.stringify(byScreenSummary));
 console.log('V4.3 TOP ENGLISH CANDIDATES '+JSON.stringify(priorityCandidates.slice(0,15)));
 console.log('V4.3 AUDIT SUMMARY '+JSON.stringify({perLocale:Object.fromEntries(languages.map(c=>[c,{
   observedChangeRate:summary.locale[c]?.observedChangeRatePercent,
   unchangedEnglish:summary.locale[c]?.potentialEnglishCount,
   needsReview:summary.locale[c]?.reviewQueueCount}])),
   scenarios:scenarios.length,viewports:2,absentScreens:missingScreens.length,errors:errors.length,
   wholeAppTranslationPercent:null}));
 assert.ok(results.length>250,'No significant rendered UI sample collected');
 assert.equal(missingScreens.length,0,'Missing or hidden audited screen; check summary artifacts');
 assert.deepEqual(errors,[],'Page runtime errors or overflow; check summary artifacts');
 console.log('V4.3 PASS: observed candidate records '+results.length+'; report at '+output);
}finally{await browser.close()}
