/* SGBuddy v1.4 — Merli, source-aware Singapore companion. No AI API or user history server. */
(()=>{'use strict';
const core=window.SGBUDDY_CORE;if(!core)return;
const {state,navigateTo,askAdvisor}=core;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const url=s=>{try{let u=new URL(String(s));return u.protocol==='https:'?u.href:''}catch{return ''}};
const store='sgbuddy-discover-saved-v1';
const art='<span class="buddy-symbol" aria-hidden="true"><img src="/assets/merlion-companion.webp" width="82" height="82" decoding="async" alt="" /></span>';
let facts=[],topic='all',search='',status='verified',savedOnly=false,limit=16,randomCursor=0,open=false,animation=null,activeTab='eat';
function readSaved(){try{const r=JSON.parse(localStorage.getItem(store)||'[]');return new Set(Array.isArray(r)?r.filter(x=>typeof x==='string').slice(0,500):[])}catch{return new Set()}}
let saved=readSaved();
function writeSaved(){
 try{localStorage.setItem(store,JSON.stringify([...saved].slice(0,500)))}catch{}
 document.dispatchEvent(new Event('sgbuddy:knowledge-saved'));
}
const widget=document.createElement('div');
widget.className='merlion-buddy';widget.dataset.state='idle';
widget.innerHTML=
'<button id="buddyLauncher" type="button" class="buddy-launcher" aria-expanded="false" aria-controls="buddyPanel" aria-label="Ask Merli">'+art+'<span>Ask Merli</span></button>'+
'<section id="buddyPanel" class="buddy-panel" role="dialog" aria-modal="false" aria-labelledby="buddyTitle" hidden>'+
'<header class="buddy-header">'+art+'<div><strong id="buddyTitle">Merli</strong><small id="merliPersonaNote">Your little Singapore buddy</small></div><button id="buddyClose" type="button" aria-label="Close Merli">×</button></header>'+
'<div id="buddyReply" class="buddy-reply" role="status" aria-live="polite">Hi, I’m Merli! 🫶 Need a hand getting around or discovering Singapore?</div>'+
'<div id="merliEvidence" class="merli-evidence" hidden><a id="merliSource" href="https://www.nea.gov.sg" target="_blank" rel="noopener noreferrer">Read official source ↗</a><button type="button" id="merliSaveFact" hidden>☆ Save this fact</button></div>'+
'<div class="buddy-chips"><button type="button" data-buddy-action="fact">✨ Merli’s tip</button><button type="button" data-buddy-action="saved">★ Saved facts</button><button type="button" data-buddy-action="eat">🍜 Eat</button><button type="button" data-buddy-action="do">🌿 Do</button><button type="button" data-buddy-action="shop">🛍️ Shop</button><button type="button" data-buddy-action="apps">📱 Apps</button><button type="button" data-buddy-action="weather">🌤️ Air quality</button><button type="button" data-buddy-action="transit">🚇 Next train</button><button type="button" data-buddy-action="home">🏠 Saved place</button></div>'+
'<form id="buddyAskForm"><input id="buddyAskInput" type="text" maxlength="160" autocomplete="off" aria-label="Ask Merli" placeholder="Ask Merli about Singapore…" /><button type="submit">Ask</button></form>'+
'<p class="buddy-note">Merli uses SGBuddy data and checked sources, not generative AI. Live information may be delayed.</p></section>';
document.body.appendChild(widget);
function mood(name='speaking'){
 widget.dataset.state=name;
 if(animation)clearTimeout(animation);
 animation=setTimeout(()=>{widget.dataset.state='idle';animation=null},1800);
}
let activeFact=null;
function say(message,visual='speaking',source='',fact=null){
 $('#buddyReply').textContent=message;
 const link=url(source),e=$('#merliEvidence'),a=$('#merliSource'),btn=$('#merliSaveFact');
 e.hidden=!link;
 if(link){a.href=link;a.textContent='Read source ↗'}
 activeFact=fact&&fact.status==='verified'?fact:null;
 btn.hidden=!activeFact;
 if(activeFact){btn.textContent=(saved.has(activeFact.id)?'★ Saved':'☆ Save this fact')}
 mood(visual);
}
function persona(){return state.mode==='new_in_sg'?'resident':state.mode||'resident'}
function greeting(){
 const p={resident:'around your neighbourhood',visitor:'as you explore Singapore',executive:'on your working day',student:'on a student budget'}[persona()]||'around Singapore';
 $('#merliPersonaNote').textContent='Here to help '+p;
}
function panel(opened=true){
 open=!!opened;$('#buddyPanel').hidden=!open;
 $('#buddyLauncher').setAttribute('aria-expanded',String(open));
 if(open){greeting();$('#buddyAskInput').focus({preventScroll:true});mood('listening')}
 else{$('#buddyLauncher').focus({preventScroll:true});widget.dataset.state='idle'}
}
window.SGBUDDY_OPEN_MERLI=()=>panel(true);
$('#buddyLauncher').addEventListener('click',()=>panel(!open));
$('#buddyClose').addEventListener('click',()=>panel(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)panel(false)});
function eligible(f){return Array.isArray(f.modes)&&f.modes.includes(persona())}
function filtered(){
 const q=search.trim().toLowerCase();
 return facts.filter(f=>eligible(f)&&
 (status==='all'||f.status===status)&&
 (topic==='all'||f.theme===topic)&&
 (!savedOnly||saved.has(f.id))&&
 (!q||(f.text+' '+f.theme).toLowerCase().includes(q)));
}
function openFacts(savedFilter=false){
 navigateTo('places');
 const button=$('[data-discover-tab="facts"]');if(button)button.click();
 if(savedFilter){savedOnly=true;const filter=$('#merliSavedOnly');if(filter)filter.checked=true}
 renderLibrary();
 say(savedFilter?'Your saved Singapore facts are under Discover → Did you know.':'Open Discover → Did you know for all fact topics and original sources.','navigation');
}
function factTip(){
 const choices=facts.filter(f=>f.status==='verified'&&eligible(f));
 if(!choices.length){say('No source-checked facts are available for your mode yet.','warning');return}
 let recent=new Set();
 try{const v=JSON.parse(sessionStorage.getItem('merli-fact-recent-v1')||'[]');recent=new Set(Array.isArray(v)?v:[])}catch{}
 let next=choices.find(f=>!recent.has(f.id));
 if(!next){recent.clear();next=choices[randomCursor++%choices.length]}
 recent.add(next.id);
 try{sessionStorage.setItem('merli-fact-recent-v1',JSON.stringify([...recent].slice(-75)))}catch{}
 say('Merli’s tip: '+next.text,'success',next.sourceUrl,next);
}
function navigateDiscover(tab){
 navigateTo('places');const button=$('[data-discover-tab="'+tab+'"]');if(button)button.click();
 const label={eat:'food',do:'activities',shop:'shops',apps:'useful apps'}[tab];
 say('I’ve opened '+label+' in Discover for your '+persona()+' mode. Check individual listings before visiting.','navigation');
}
function airReply(){
 const w=state.weather,air=w?.airQuality,psi=air?.psi24h,pm=air?.pm25OneHour;
 navigateTo('today');
 if(!psi&&!pm){say('The air readings are unavailable here. Please check the official NEA readings on the Today panel before outdoor activity.','warning','https://www.nea.gov.sg/our-services/pollution-control/air-pollution');return}
 const signal=w?.dataQuality?.staleSignals||[];
 const possiblyCached=w.source==='device-cache'||signal.includes('psi')||signal.includes('pm25');
 const values=[];
 if(Number.isFinite(Number(psi?.overall)))values.push('24h PSI '+Math.round(psi.overall));
 if(Number.isFinite(Number(pm?.value)))values.push('1h PM2.5 '+Math.round(pm.value)+' µg/m³');
 const sourceTimes=[psi?.updatedAt,pm?.updatedAt].filter(Boolean).map(x=>Date.parse(x)).filter(Number.isFinite);
 const age=sourceTimes.length?Math.max(...sourceTimes.map(t=>(Date.now()-t)/60000)):Infinity;
 const stale=possiblyCached||age>90||age< -15||!Number.isFinite(age);
 say((stale?'Last available (not confirmed current): ':'Official NEA readings: ')+values.join(' · ')+'. See Today for regional details and timestamps.','navigation','https://www.nea.gov.sg/our-services/pollution-control/air-pollution');
}
function toSavedPlace(){
 const preferred=persona()==='visitor'?'hotel':'home';
 const dest=state.places?.[preferred]||state.places?.home||state.places?.hotel||state.places?.work;
 if(!dest){say('Save your home, work or hotel address in SGBuddy first. Merli can then help route you there without storing a conversation.','warning');return}
 const to=$('#tripTo');if(!to){say('Trip planning is currently unavailable. Open Move to check routes.','warning');return}
 to.value=dest;
 navigateTo('travel');
 if(typeof core.planNativeJourney==='function')setTimeout(()=>core.planNativeJourney(),300);
 say('I’ve set your saved destination in Move and started the route planner. Review the options before travelling.','navigation');
}
function act(a){
 if(a==='fact')return factTip();
 if(a==='home')return toSavedPlace();
 if(a==='saved')return openFacts(true);
 if(a==='weather')return airReply();
 if(a==='transit')return say(askAdvisor?.('When is my next train?')||'Open Move for bus and MRT details.','navigation');
 if(['eat','do','shop','apps'].includes(a))return navigateDiscover(a);
}
widget.addEventListener('click',e=>{
 const action=e.target.closest('[data-buddy-action]');if(action)act(action.dataset.buddyAction);
});
$('#merliSaveFact').addEventListener('click',()=>{
 if(!activeFact)return;
 saved.has(activeFact.id)?saved.delete(activeFact.id):saved.add(activeFact.id);writeSaved();
 $('#merliSaveFact').textContent=saved.has(activeFact.id)?'★ Saved':'☆ Save this fact';
 renderLibrary();
});
$('#buddyAskForm').addEventListener('submit',e=>{
 e.preventDefault();const input=$('#buddyAskInput'),raw=input.value.trim(),q=raw.toLowerCase();
 if(!q)return;
 if(/^(take|get|bring) me (back )?(home|to my hotel|to my house)|^(go|route) (home|to (home|my hotel))$/.test(q))act('home');
 else if(/next.*train|next.*bus|train.*time|bus.*time|train problems|rail status|mrt|should i leave|leave now|^(get|take|bring) me to |^how do i get to |^route to |is it raining|umbrella/.test(q)){
  say(typeof askAdvisor==='function'?askAdvisor(raw):'Please open Move for transport details.','navigation');
 }else if(/air quality|psi|pm2|pollution|weather/.test(q))act('weather');
 else if(/what should i do|plan my day|what can i do|ideas for today/.test(q)){
  say('Try a place to eat or something to do in Discover. I can also check the air quality before you go. Choose one of those shortcuts to start.','success');
 }
 else if(/saved|favo(u)?rite|bookmark/.test(q))act('saved');
 else if(/food|eat|hawker|restaurant|hungry|lunch|dinner/.test(q))act('eat');
 else if(/shop|mall|market|buy/.test(q))act('shop');
 else if(/\bapp|download/.test(q))act('apps');
 else if(/fact|history|did you know|surprise|interesting|tell me something/.test(q))act('fact');
 else if(/visit|tour|attraction|museum|park|see|activity/.test(q))act('do');
 else say('Try asking about bus and MRT timing, Singapore facts, favourite places, air quality, things to do or where to eat.');
 input.value='';
});
function renderLibrary(){
 const list=$('#sgbFactList');if(!list)return;
 const rows=filtered(),show=rows.slice(0,limit);
 const checked=rows.filter(x=>x.status==='verified').length;
 $('#sgbFactCount').textContent=checked+' checked against official sources · '+(rows.length-checked)+' review pending · displaying '+show.length+' of '+rows.length+' matching records';
 list.innerHTML=show.map(f=>{
   const link=url(f.sourceUrl),yes=saved.has(f.id);
   return '<article class="card sgb-fact" data-fact-id="'+esc(f.id)+'"><span class="label">'+esc(f.theme)+'</span>'+
    '<p>'+esc(f.text)+'</p><div class="sgb-fact-foot"><span class="merli-status '+(f.status==='verified'?'checked':'pending')+'">'+(f.status==='verified'?'Official-source checked (AI-assisted)':'Review pending')+'</span>'+
    (link?'<a href="'+esc(link)+'" rel="noopener noreferrer" target="_blank">Original source ↗</a>':'')+
    '<button class="secondary merli-save" type="button" data-merli-save="'+esc(f.id)+'" aria-pressed="'+yes+'">'+(yes?'★ Saved':'☆ Save')+'</button></div></article>';
 }).join('')||'<div class="card sgb-fact">No facts match these filters. Try clearing search, mode or saved-only.</div>';
 $('#merliLoadMore').hidden=rows.length<=limit;
}
function mountLibrary(){
 const discover=$('#discoverHub');if(!discover)return;
 const sec=document.createElement('section');sec.className='card sgb-library';sec.id='merliKnowledgeLibrary';sec.hidden=activeTab!=='facts';
 sec.innerHTML='<div class="label">MERLI’S SINGAPORE KNOWLEDGE</div><h3>Discover with Merli</h3>'+
 '<p>Explore individual source-checked claims alongside a clearly marked review queue. The 10,000-fact collection remains a future goal.</p>'+
 '<div class="sgb-library-controls"><select id="sgbFactTopic" aria-label="Fact topic"><option value="all">All topics</option></select>'+
 '<select id="merliFactStatus" aria-label="Fact review status"><option value="verified">Source-checked</option><option value="all">All, including pending</option></select>'+
 '<label class="merli-saved-filter"><input type="checkbox" id="merliSavedOnly" /> Saved only</label>'+
 '<input id="sgbFactQuery" type="search" placeholder="Search facts…" aria-label="Search Singapore facts" /></div>'+
 '<p id="sgbFactCount" class="sgb-fact-count" role="status"></p><div id="sgbFactList" class="sgb-fact-list"></div>'+
 '<button id="merliLoadMore" class="secondary merli-more" type="button" hidden>Show more facts</button>';
 discover.insertAdjacentElement('beforeend',sec);
 $('#sgbFactTopic').insertAdjacentHTML('beforeend',[...new Set(facts.map(f=>f.theme))].sort().map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join(''));
 $('#sgbFactTopic').addEventListener('change',e=>{topic=e.target.value;limit=16;renderLibrary()});
 $('#merliFactStatus').addEventListener('change',e=>{status=e.target.value;limit=16;renderLibrary()});
 $('#sgbFactQuery').addEventListener('input',e=>{search=e.target.value;limit=16;renderLibrary()});
 $('#merliSavedOnly').addEventListener('change',e=>{savedOnly=e.target.checked;limit=16;renderLibrary()});
 $('#merliLoadMore').addEventListener('click',()=>{limit+=16;renderLibrary()});
 sec.addEventListener('click',e=>{const b=e.target.closest('[data-merli-save]');if(!b)return;const id=b.dataset.merliSave;saved.has(id)?saved.delete(id):saved.add(id);writeSaved();renderLibrary()});
 document.addEventListener('sgbuddy:persona',()=>{greeting();limit=16;renderLibrary()});
 document.addEventListener('sgbuddy:knowledge-saved',()=>{saved=readSaved();renderLibrary()});
 document.addEventListener('sgbuddy:discover-tab',e=>{activeTab=e.detail.tab;sec.hidden=activeTab!=='facts';if(activeTab==='facts')renderLibrary()});
 renderLibrary();
}
Promise.all([
 fetch('/data/facts-published.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
 fetch('/data/discover-v120.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)
]).then(([pub,seed])=>{
 const verified=Array.isArray(pub?.facts)?pub.facts.filter(f=>f.status==='verified'):[];
 const pending=Array.isArray(seed?.facts)?seed.facts.filter(f=>f.status!=='verified'):[];
 // Rows under editorial review remain visible only after users explicitly select "All".
 const ids=new Set();facts=[...verified,...pending].filter(f=>{
   if(!f?.id||!f.text||!Array.isArray(f.modes)||!url(f.sourceUrl)||ids.has(f.id))return false;
   ids.add(f.id);return true
 });
 mountLibrary();
}).catch(()=>say('The fact library could not be loaded. Merli’s travel and transport shortcuts still work.','warning'));
window.__SGBUDDY_CLIENT_VERSION__='1.4.0-dev';
if($('#appVersion'))$('#appVersion').textContent='v1.4.0-dev';
})();