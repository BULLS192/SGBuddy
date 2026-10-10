/* SGBuddy v1.3 — lightweight Merlion Buddy and source-linked fact explorer */
(()=>{'use strict';
const core=window.SGBUDDY_CORE;if(!core)return;
const {state,navigateTo}=core;
const $=s=>document.querySelector(s);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safeLink=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}};
let facts=[],factIndex=0,topic='all',query='',opened=false;
const widget=document.createElement('div');widget.className='merlion-buddy';
widget.innerHTML='<button id="buddyLauncher" class="buddy-launcher" type="button" aria-expanded="false" aria-controls="buddyPanel" aria-label="Open Merlion Buddy"><span class="buddy-symbol">🦁<i>〰</i></span><span>Ask Buddy</span></button>'+
'<section id="buddyPanel" class="buddy-panel" role="dialog" aria-modal="false" aria-labelledby="buddyTitle" hidden>'+
'<div class="buddy-header"><span class="buddy-symbol">🦁<i>〰</i></span><div><strong id="buddyTitle">Merlion Buddy</strong><small>Your Singapore companion</small></div><button id="buddyClose" aria-label="Close Buddy" type="button">×</button></div>'+
'<div class="buddy-reply" id="buddyReply" role="status" aria-live="polite">Hello! Ask for a Singapore fact, food, activities, shopping, useful apps or air quality.</div>'+
'<div class="buddy-chips"><button data-buddy-action="fact">Fun fact ✨</button><button data-buddy-action="eat">Eat</button><button data-buddy-action="do">Do</button><button data-buddy-action="shop">Shop</button><button data-buddy-action="apps">Apps</button><button data-buddy-action="weather">Air quality</button></div>'+
'<form id="buddyAskForm"><input id="buddyAskInput" type="text" maxlength="160" autocomplete="off" placeholder="Ask your Merlion Buddy…" aria-label="Ask Merlion Buddy"/><button type="submit">Ask</button></form>'+
'<p class="buddy-note">A friendly, rules-based guide using curated SGBuddy content. Not a live AI chatbot.</p></section>';
document.body.appendChild(widget);
function say(text){$('#buddyReply').textContent=text}
function openPanel(open){opened=Boolean(open);$('#buddyPanel').hidden=!opened;$('#buddyLauncher').setAttribute('aria-expanded',String(opened));if(opened)$('#buddyAskInput').focus({preventScroll:true})}
$('#buddyLauncher').addEventListener('click',()=>openPanel(!opened));
$('#buddyClose').addEventListener('click',()=>openPanel(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened)openPanel(false)});
function eligible(f){const mode=state.mode==='new_in_sg'?'resident':state.mode;return (f.modes||[]).includes(mode)}
function filtered(){const q=query.toLowerCase().trim();return facts.filter(f=>eligible(f)&&(topic==='all'||f.theme===topic)&&(!q||(f.theme+' '+f.text).toLowerCase().includes(q)))}
function randomFact(){const rows=filtered();if(!rows.length){say('No matching facts yet. Try a different topic in Discover.');return}const f=rows[factIndex++%rows.length];say('Did you know? '+f.text+' Open Discover → Did you know to check the source.')}
function goto(tab){navigateTo('places');const b=$('[data-discover-tab="'+tab+'"]');if(b)b.click();const labels={eat:'places to eat',do:'things to do',shop:'shopping',apps:'useful apps'};say('I opened '+labels[tab]+' in Discover, tailored to your SGBuddy mode.')}
function action(a){if(a==='fact'){randomFact();return}if(a==='weather'){navigateTo('today');say('Regional PSI and PM2.5 are on the Today screen. Check their updated timestamps before planning outdoor activities.');return}if(['eat','do','shop','apps'].includes(a))goto(a)}
widget.addEventListener('click',e=>{const b=e.target.closest('[data-buddy-action]');if(b)action(b.dataset.buddyAction)});
$('#buddyAskForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#buddyAskInput'),q=input.value.trim().toLowerCase();if(!q)return;
let a=/food|eat|hawker|restaurant|hungry|lunch|dinner/.test(q)?'eat':/shop|mall|market|buy/.test(q)?'shop':/app|download/.test(q)?'apps':/weather|air quality|psi|pm2|rain|pollution/.test(q)?'weather':/fact|history|did you know|surprise|interesting/.test(q)?'fact':/visit|tour|attraction|museum|park|see|activity/.test(q)?'do':null;
if(a)action(a);else say('Try asking about food, activities, shopping, apps, air quality or a Singapore fact.');input.value=''});
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
 sec.innerHTML='<div class="label">SINGAPORE KNOWLEDGE</div><h3>Did You Know? Library</h3><p>Search our source-linked starting collection. Only individually reviewed claims are published as verified.</p>'+
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