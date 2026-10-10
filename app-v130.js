/* SGBuddy v1.3 — Merli, the original SGBuddy Merlion companion */
(()=>{'use strict';
const core=window.SGBUDDY_CORE;if(!core)return;
const {state,navigateTo,askAdvisor}=core;
const $=s=>document.querySelector(s);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safeLink=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}};
let facts=[],factIndex=0,topic='all',query='',opened=false,animation=null;
const merliArt='<span class="buddy-symbol" aria-hidden="true"><img src="/assets/merlion-companion.webp" alt="" width="82" height="82" decoding="async" /></span>';
const widget=document.createElement('div');widget.className='merlion-buddy';widget.dataset.state='idle';
widget.innerHTML='<button id="buddyLauncher" class="buddy-launcher" type="button" aria-expanded="false" aria-controls="buddyPanel" aria-label="Open Merli, your Singapore buddy">'+merliArt+'<span>Ask Merli</span></button>'+
'<section id="buddyPanel" class="buddy-panel" role="dialog" aria-modal="false" aria-labelledby="buddyTitle" hidden>'+
'<div class="buddy-header">'+merliArt+'<div><strong id="buddyTitle">Merli</strong><small>Your little Singapore buddy</small></div><button id="buddyClose" aria-label="Close Merli" type="button">×</button></div>'+
'<div class="buddy-reply" id="buddyReply" role="status" aria-live="polite">Hi, I’m Merli! 🫶 Need help getting around, finding something fun, or learning a little about Singapore?</div>'+
'<div class="buddy-chips"><button type="button" data-buddy-action="fact">Merli’s tip ✨</button><button type="button" data-buddy-action="eat">🍜 Eat</button><button type="button" data-buddy-action="do">🌿 Do</button><button type="button" data-buddy-action="shop">🛍️ Shop</button><button type="button" data-buddy-action="apps">📱 Apps</button><button type="button" data-buddy-action="weather">🌤️ Air quality</button><button type="button" data-buddy-action="transit">🚇 Next train</button></div>'+
'<form id="buddyAskForm"><input id="buddyAskInput" type="text" maxlength="160" autocomplete="off" placeholder="Ask Merli about Singapore…" aria-label="Ask Merli"/><button type="submit">Ask</button></form>'+
'<p class="buddy-note">Merli uses curated SGBuddy information and live feeds where available, not generative AI. Check source dates, fees and opening hours.</p></section>';
document.body.appendChild(widget);
function animate(stateName='speaking'){
  widget.dataset.state=stateName;
  if(animation)clearTimeout(animation);
  animation=setTimeout(()=>{widget.dataset.state='idle';animation=null},1800);
}
function say(text,stateName='speaking'){$('#buddyReply').textContent=text;animate(stateName)}
function openPanel(open=true){
  opened=Boolean(open);$('#buddyPanel').hidden=!opened;
  $('#buddyLauncher').setAttribute('aria-expanded',String(opened));
  if(opened){$('#buddyAskInput').focus({preventScroll:true});animate('listening')}
  else{$('#buddyLauncher').focus({preventScroll:true});widget.dataset.state='idle'}
}
window.SGBUDDY_OPEN_MERLI=()=>openPanel(true);
$('#buddyLauncher').addEventListener('click',()=>openPanel(!opened));
$('#buddyClose').addEventListener('click',()=>openPanel(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened)openPanel(false)});
function eligible(f){const mode=state.mode==='new_in_sg'?'resident':state.mode;return (f.modes||[]).includes(mode)}
function filtered(){const q=query.toLowerCase().trim();return facts.filter(f=>eligible(f)&&(topic==='all'||f.theme===topic)&&(!q||(f.theme+' '+f.text).toLowerCase().includes(q)))}
function randomFact(){
 const rows=filtered();
 if(!rows.length){say('No matching fact yet. Try another topic in Discover.','warning');return}
 const f=rows[factIndex++%rows.length];
 say('Merli’s tip! '+f.text+' Find the original source in Discover → Did You Know.','success');
}
function goto(tab){
 navigateTo('places');
 const button=$('[data-discover-tab="'+tab+'"]');if(button)button.click();
 const labels={eat:'places to eat',do:'things to do',shop:'shopping',apps:'useful apps'};
 say('I’ve opened '+labels[tab]+' for you! The suggestions reflect your current SGBuddy mode.','success');
}
function action(a){
 if(a==='fact')return randomFact();
 if(a==='weather'){
  navigateTo('today');
  say('Let’s check the air! You’ll find regional PSI and PM2.5 on Today. Please check the update times and NEA advisories.','navigation');
  return;
 }
 if(a==='transit')return say(askAdvisor?.('When is my next train?')||'Go to Move for trains and buses.','navigation');
 if(['eat','do','shop','apps'].includes(a))goto(a);
}
widget.addEventListener('click',e=>{const b=e.target.closest('[data-buddy-action]');if(b)action(b.dataset.buddyAction)});
$('#buddyAskForm').addEventListener('submit',e=>{
 e.preventDefault();const input=$('#buddyAskInput'),original=input.value.trim(),q=original.toLowerCase();
 if(!q)return;
 // Reuse SGBuddy's established bus, rail, route-planning and rain advisor.
 if(/next.*train|next.*bus|train.*time|bus.*time|train problems|rail status|mrt|should i leave|leave now|^(get|take|bring) me to |^how do i get to |^route to |is it raining|umbrella/.test(q)){
  say(typeof askAdvisor==='function'?askAdvisor(original):'Find routes and live transit in Move.','navigation');
 }else if(/air quality|psi|pm2|pollution|weather|rain/.test(q))action('weather');
 else if(/food|eat|hawker|restaurant|hungry|lunch|dinner/.test(q))action('eat');
 else if(/shop|mall|market|buy/.test(q))action('shop');
 else if(/app|download/.test(q))action('apps');
 else if(/fact|history|did you know|surprise|interesting/.test(q))action('fact');
 else if(/visit|tour|attraction|museum|park|see|activity/.test(q))action('do');
 else say('You can ask me about next trains, buses, routes, food, activities, shopping, apps, air quality or a Singapore fact.');
 input.value='';
});
function renderLibrary(){
 const list=$('#sgbFactList');if(!list)return;const rows=filtered();
 $('#sgbFactCount').textContent=rows.length+' source-linked fact candidates · 10,000 is the verified-library target, not the published count';
 list.innerHTML=rows.slice(0,60).map(f=>{
 const link=safeLink(f.sourceUrl);
 return '<article class="card sgb-fact"><span class="label">'+esc(f.theme)+'</span><p>'+esc(f.text)+'</p><div class="sgb-fact-foot">'+(link?'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Original source ↗</a>':'')+
 '<span>'+esc(f.status==='verified'?'Individually verified':'Source-reviewed · claim review pending')+'</span></div></article>'
 }).join('')||'<div class="card sgb-fact">No matching facts. Try clearing your search.</div>';
}
function mountLibrary(){
 const discover=$('#discoverHub');if(!discover)return;
 const sec=document.createElement('section');sec.className='card sgb-library';
 sec.innerHTML='<div class="label">MERLI’S SINGAPORE KNOWLEDGE</div><h3>Discover with Merli</h3><p>Search our source-linked starting collection. Only individually reviewed claims are published as verified.</p>'+
 '<div class="sgb-library-controls"><select id="sgbFactTopic" aria-label="Fact topic"><option value="all">All topics</option></select><input type="search" id="sgbFactQuery" placeholder="Search facts…" aria-label="Search facts"/></div>'+
 '<p id="sgbFactCount" class="sgb-fact-count"></p><div id="sgbFactList" class="sgb-fact-list"></div>';
 discover.insertAdjacentElement('beforeend',sec);
 const themes=[...new Set(facts.map(f=>f.theme))].sort();$('#sgbFactTopic').insertAdjacentHTML('beforeend',themes.map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join(''));
 $('#sgbFactTopic').addEventListener('change',e=>{topic=e.target.value;renderLibrary()});
 $('#sgbFactQuery').addEventListener('input',e=>{query=e.target.value;renderLibrary()});
 document.addEventListener('sgbuddy:persona',renderLibrary);renderLibrary();
}
Promise.all([
 fetch('/data/facts-published.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
 fetch('/data/discover-v120.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)
]).then(([published,seed])=>{
 const verified=Array.isArray(published?.facts)?published.facts.filter(f=>f.status==='verified'):[];
 const candidates=Array.isArray(seed?.facts)?seed.facts:[];
 const ids=new Set();facts=[...verified,...candidates].filter(f=>{if(!f?.id||!f.text||!safeLink(f.sourceUrl)||!Array.isArray(f.modes)||ids.has(f.id))return false;ids.add(f.id);return true});
 mountLibrary();
}).catch(()=>say('Fact data is unavailable, but my navigation shortcuts still work.'));
window.__SGBUDDY_CLIENT_VERSION__='1.3.0-dev';if($('#appVersion'))$('#appVersion').textContent='v1.3.0-dev';
})();