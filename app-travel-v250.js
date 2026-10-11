import {LOCALES,normalizeLocale,TRAVEL_UI} from './lib/i18n-v280.mjs';
import {localizedGuide,localizedCheck} from './lib/i18n-guides-v280.mjs';
/* SGBuddy V2.5 — visitor travel-preparation hub and EN/zh-CN navigation. No booking claims. */
(()=>{'use strict';
const core=window.SGBUDDY_CORE,doc=document,host=doc.getElementById('discoverHub');
if(!core||!host)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safeUrl=v=>{try{const u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
const LANGUAGE_KEY='sgbuddy-language-v250',CHECK_KEY='sgbuddy-travel-checklist-v250';
const strings={
 en:{
 language:'Language',travel:'Travel prep',trip:'My Trip',apps:'Everyday apps',home:'Home',discover:'Discover',move:'Move',saved:'Saved',profile:'Profile',
 heading:'Prepare for Singapore',intro:'Sort out payments, messaging and mobile data before you arrive. Choose official links and keep a backup option.',source:'Official provider ↗',review:'Service eligibility and acceptance vary. Always confirm with the provider or merchant.',
 payments:'Payments',messaging:'Messaging',connectivity:'SIM & eSIM',checkTitle:'My arrival checklist',checkCopy:'This checklist stays on this device. It does not store documents, payment information or booking details.',
 appsButton:'Explore everyday apps',routeButton:'Plan a route',tripButton:'Open My Trip',coming:'Multi-day trip planning is now available in My Trip. Reservation and ticket integrations are not live; opening provider links does not confirm a booking.',
 error:'Travel guidance is temporarily unavailable. Check official provider websites directly.',
 quick:'Prepare for a visit',quickCopy:'Payments, messaging & eSIM',
 tabs:{eat:'Eat',do:'Things to do',shop:'Shop',essentials:'Essentials',healthcare:'Healthcare',apps:'Everyday apps',travel:'Travel prep',trip:'My Trip',facts:'Did you know?'},
 legacy:'Twelve-language release: travel guidance and key navigation are translated. Some older place, account and app descriptions still appear in English while reviewed.'
 },
 zh:{
 language:'语言',travel:'旅行准备',trip:'我的行程',apps:'日常应用',home:'首页',discover:'探索',move:'出行',saved:'收藏',profile:'账户',
 heading:'来新加坡前做好准备',intro:'出发前了解支付方式、通讯应用和移动网络。查看官方链接，并保留备用方案。',source:'查看官方资料 ↗',review:'服务资格及商户接受情况可能变化，请向运营商或商户确认。',
 payments:'付款方式',messaging:'通讯应用',connectivity:'SIM 与 eSIM',checkTitle:'我的抵达清单',checkCopy:'此清单仅储存在本设备，不会保存证件、付款或预订资料。',
 appsButton:'查看日常应用',routeButton:'规划路线',tripButton:'打开我的行程',coming:'「我的行程」现已支持多日规划。预订与购票整合尚未推出；打开外部链接不代表预订成功。',
 error:'旅行指南暂时无法载入。请直接查阅服务商官方网站。',
 quick:'来新加坡前的准备',quickCopy:'付款、通讯与 eSIM',
 tabs:{eat:'美食',do:'游玩',shop:'购物',essentials:'生活所需',healthcare:'医疗',apps:'日常应用',travel:'旅行准备',trip:'我的行程',facts:'冷知识'},
 legacy:'现提供十二种语言，主要导航及旅行指南已翻译。部分旧有地点、账户及应用说明仍为英文，正等待审校。'
 }
};
let lang='en',group='payments',catalogue=null;
try{lang=normalizeLocale(localStorage.getItem(LANGUAGE_KEY)||'en')}catch{}
let completed=new Set();
try{const list=JSON.parse(localStorage.getItem(CHECK_KEY)||'[]');if(Array.isArray(list))completed=new Set(list.filter(v=>typeof v==='string').slice(0,20))}catch{}
const locale=()=>lang;
const t=()=>lang==='zh-CN'?strings.zh:lang==='en'?strings.en:{...strings.en,...(TRAVEL_UI[lang]||{}),tabs:{...strings.en.tabs,...(TRAVEL_UI[lang]?.tabs||{})}};
const shell=doc.createElement('section');shell.id='travelEssentials';shell.className='card travel-essentials-v250';shell.hidden=true;shell.setAttribute('role','tabpanel');shell.setAttribute('aria-labelledby','discoverTab-travel');
doc.getElementById('discoverResults').insertAdjacentElement('beforebegin',shell);
const actions=doc.querySelector('.topbar .top-actions');
if(actions){
 const label=doc.createElement('label');label.className='sgb-language-picker';label.setAttribute('for','sgbLanguage');
 label.innerHTML='<span id="sgbLanguageLabel">Language</span><select id="sgbLanguage" aria-label="Choose SGBuddy language">'+LOCALES.map(item=>'<option value="'+esc(item.code)+'">'+esc(item.name)+'</option>').join('')+'</select>';
 actions.insertBefore(label,actions.firstChild);
 label.querySelector('select').value=locale();
 label.querySelector('select').addEventListener('change',e=>{
  lang=normalizeLocale(e.target.value);
  try{localStorage.setItem(LANGUAGE_KEY,locale())}catch{}
  translate();render();doc.dispatchEvent(new CustomEvent('sgbuddy:language',{detail:{language:locale()}}));
 });
}
function translate(){
 const s=t();doc.documentElement.lang=locale();window.SGBUDDY_LANGUAGE=locale();
 const copy=(selector,text)=>{const node=doc.querySelector(selector);if(node)node.textContent=text};
 copy('#sgbLanguageLabel',s.language);
 for(const [id,value] of Object.entries({navToday:s.home,navPlaces:s.discover,navMove:s.move,navMoney:({"en":"Money","zh-CN":"货币","zh-TW":"金錢","ms":"Wang","id":"Uang","ja":"お金","ko":"금융","th":"การเงิน","vi":"Tiền tệ","fr":"Argent","es":"Dinero","pt-BR":"Dinheiro"})[locale()]||'Money',navAccount:s.profile}))copy('#'+id+' span',value);
 Object.entries(s.tabs).forEach(([id,value])=>copy('[data-discover-tab="'+id+'"]',value));
 copy('#discoverTitle',lang==='zh-CN'?'用自己的方式探索新加坡':s.discoverTitle||'Explore Singapore your way');
 copy('#discoverTab-travel',s.travel);
 const shortcut=doc.getElementById('sgbTravelShortcut');
 if(shortcut){shortcut.querySelector('strong').textContent=s.quick;shortcut.querySelector('small').textContent=s.quickCopy}
}
function render(){
 const s=t();
 if(!catalogue){
  shell.innerHTML='<div class="label">'+esc(s.travel)+'</div><h3>'+esc(s.heading)+'</h3><p role="status">'+esc(s.error)+'</p>';
  return;
 }
 const options=[['payments',s.payments],['messaging',s.messaging],['connectivity',s.connectivity]];
 const entries=catalogue.guides.filter(x=>x.group===group);
 const checks=catalogue.checklist||[];
 shell.innerHTML='<header class="travel-prep-head"><div class="label">'+esc(s.travel)+' · SGBUDDY V2.5</div><h3>'+esc(s.heading)+'</h3><p>'+esc(s.intro)+'</p></header>'+
  '<div class="travel-prep-sections" role="group" aria-label="'+esc(s.travel)+'">'+options.map(([id,label])=>'<button type="button" data-travel-section="'+id+'" aria-pressed="'+String(group===id)+'">'+esc(label)+'</button>').join('')+'</div>'+
  '<div class="travel-prep-grid">'+entries.map(row=>{
   const text=localizedGuide(row,locale()),href=safeUrl(row.sourceUrl);
   return '<article class="travel-prep-card"><h4>'+esc(text.title)+'</h4><p>'+esc(text.copy)+'</p>'+(href?'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(s.source)+'</a>':'')+'</article>';
  }).join('')+'</div>'+
  '<p class="travel-prep-caution">'+esc(s.review)+'</p>'+
  '<section class="travel-prep-checklist"><h4>'+esc(s.checkTitle)+'</h4><p>'+esc(s.checkCopy)+'</p><div class="travel-prep-checks">'+checks.map(row=>'<label><input type="checkbox" data-prep-check="'+esc(row.id)+'" '+(completed.has(row.id)?'checked':'')+' /><span>'+esc(localizedCheck(row,locale()))+'</span></label>').join('')+'</div></section>'+
  '<p class="travel-prep-locale-note">'+esc(s.legacy)+'</p>'+
  '<div class="travel-prep-actions"><button type="button" class="primary" data-travel-trip>'+esc(s.tripButton)+'</button><button type="button" class="secondary" data-travel-apps>'+esc(s.appsButton)+'</button><button type="button" class="secondary" data-travel-route>'+esc(s.routeButton)+'</button></div>'+
  '<p class="travel-prep-future">'+esc(s.coming)+'</p>';
}
function activate(active){
 shell.hidden=!active;
 const results=doc.getElementById('discoverResults');if(results)results.hidden=active;
 for(const selector of ['.discover-search-row','#discoverQuality','#discoverStatus']){
  const item=doc.querySelector(selector);if(item)item.hidden=active;
 }
 if(active){translate();render()}
}
shell.addEventListener('click',e=>{
 const tab=e.target.closest('[data-travel-section]');
 if(tab){group=tab.dataset.travelSection;render();return}
 if(e.target.closest('[data-travel-trip]')){doc.querySelector('[data-discover-tab="trip"]')?.click();return}
 if(e.target.closest('[data-travel-apps]')){doc.querySelector('[data-discover-tab="apps"]')?.click();return}
 if(e.target.closest('[data-travel-route]')){doc.getElementById('navMove')?.click();return}
});
shell.addEventListener('change',e=>{
 const checkbox=e.target.closest('[data-prep-check]');if(!checkbox)return;
 checkbox.checked?completed.add(checkbox.dataset.prepCheck):completed.delete(checkbox.dataset.prepCheck);
 try{localStorage.setItem(CHECK_KEY,JSON.stringify([...completed]))}catch{}
});
doc.addEventListener('sgbuddy:discover-tab',e=>{
 activate(e.detail?.tab==='travel');
 translate();
});
doc.addEventListener('sgbuddy:persona',translate);
const addShortcut=()=>{
 const grid=doc.querySelector('.ux-primary-shortcuts');
 if(!grid||doc.getElementById('sgbTravelShortcut'))return;
 const button=doc.createElement('button');button.type='button';button.className='ux-shortcut';button.id='sgbTravelShortcut';
 button.innerHTML='<span class="ux-shortcut-icon" aria-hidden="true">✈</span><span class="ux-shortcut-copy"><strong></strong><small></small></span>';
 button.addEventListener('click',()=>{doc.getElementById('navPlaces')?.click();doc.querySelector('[data-discover-tab="travel"]')?.click()});
 grid.append(button);translate();
};
addShortcut();
fetch('/data/travel-essentials-v250.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Travel data unavailable');return r.json()}).then(data=>{
 if(!Array.isArray(data.guides)||!Array.isArray(data.checklist))throw Error('Invalid travel data');
 catalogue=data;render();
}).catch(()=>render());
translate();
doc.dispatchEvent(new CustomEvent('sgbuddy:language',{detail:{language:locale()}}));
})();
