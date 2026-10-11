/* SGBuddy V2.4 — Everyday Singapore apps. Curated publisher links; not an app installer. */
(()=>{'use strict';
const core=window.SGBUDDY_CORE;if(!core)return;
const doc=document,host=doc.querySelector('#discoverHub'),results=doc.querySelector('#discoverResults');
if(!host||!results)return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=value=>{try{const u=new URL(String(value||''));return u.protocol==='https:'?u.href:''}catch{return ''}};
const localKey='sgbuddy-app-bookmarks-v240',legacyKey='sgbuddy-discover-saved-v1';
let saved=new Set(),apps=[],loaded=false,term='',category='all',view='recommended',download='all',limit=20;
try{const items=JSON.parse(localStorage.getItem(localKey)||'[]');if(Array.isArray(items))saved=new Set(items.filter(x=>typeof x==='string').slice(0,300))}catch{}
const panel=doc.createElement('section');panel.id='everydayApps';panel.className='card everyday-apps-v240';panel.hidden=true;panel.setAttribute('aria-label','Everyday Singapore mobile app and digital service directory');
panel.innerHTML='<div class="app-guide-head"><div class="label">THE EVERYDAY SINGAPORE APP GUIDE · V2.4</div><h3>Apps worth having in Singapore</h3><p>From Singpass and banking to Grab, foodpanda, groceries, transport and local services. These are independent recommendations, not paid placements or affiliated app installs.</p></div>'+
 '<div class="app-guide-packs" role="group" aria-label="Choose an app collection"><button type="button" data-app-view="recommended" aria-pressed="true">For my mode</button><button type="button" data-app-view="essentials" aria-pressed="false">Start here</button><button type="button" data-app-view="all" aria-pressed="false">All apps</button><button type="button" data-app-view="saved" aria-pressed="false">★ My shortlist</button></div>'+
 '<div class="app-guide-controls"><label>Search apps<input id="appLibrarySearch" type="search" placeholder="Singpass, groceries, food, taxis..." autocomplete="off"></label>'+
 '<label>Category<select id="appLibraryCategory"><option value="all">All categories</option></select></label>'+
 '<label>Download options<select id="appLibraryDownload"><option value="all">All official publisher links</option><option value="ios">Confirmed iPhone App Store link</option><option value="android">Confirmed Google Play link</option><option value="web">Web-only services</option></select></label></div>'+
 '<p class="app-guide-stats" id="appLibraryCount" role="status">Loading Singapore app recommendations…</p>'+
 '<p class="app-guide-safety">Install only from the official publisher or the verified store link shown. SGBuddy never asks for a Singpass password, bank login or OTP. App availability, promotions, permissions and eligibility can change.</p>'+
 '<div id="appLibraryCards" class="app-guide-grid"></div><button id="appLibraryMore" class="secondary app-guide-more" type="button" hidden>Show more apps</button>';
results.insertAdjacentElement('beforebegin',panel);
const $=selector=>panel.querySelector(selector);
const persona=()=>core.state.mode==='new_in_sg'?'resident':core.state.mode;
const rank=p=>p.importance==='Essential'?3:p.importance==='Recommended'?2:1;
function persist(){try{localStorage.setItem(localKey,JSON.stringify([...saved].slice(0,300)))}catch{}}
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
function migrateSaved(legacyApps){
 try{
  const previous=JSON.parse(localStorage.getItem(legacyKey)||'[]');
  if(!Array.isArray(previous))return;
  const oldNames=new Map(legacyApps.map(a=>[a.id,slug(a.name)]));
  const newIds=new Map(apps.map(a=>[slug(a.name),a.id]));
  let changed=false;
  for(const oldId of previous){
    const next=newIds.get(oldNames.get(oldId));
    if(next&&!saved.has(next)){saved.add(next);changed=true}
  }
  if(changed)persist();
 }catch{}
}
function card(a){
 const mobile=a.kind==='mobile-app',ios=safeUrl(a.ios),android=safeUrl(a.android),source=safeUrl(a.sourceUrl),marked=saved.has(a.id);
 const actions=[source?'<a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">'+(mobile?'Official publisher ↗':'Open official service ↗')+'</a>':'',
  ios?'<a href="'+esc(ios)+'" target="_blank" rel="noopener noreferrer">iPhone App Store ↗</a>':'',
  android?'<a href="'+esc(android)+'" target="_blank" rel="noopener noreferrer">Google Play ↗</a>':''].filter(Boolean).join('');
 const modeNames=(a.modes||[]).map(m=>m==='visitor'?'Visitor':m==='executive'?'Business':m[0].toUpperCase()+m.slice(1)).join(' · ');
 return '<article class="app-guide-item" data-app-id="'+esc(a.id)+'"><div class="app-guide-card-top"><span aria-hidden="true" class="app-guide-monogram">'+esc(a.monogram||a.name.slice(0,2).toUpperCase())+'</span><div><span class="app-guide-category">'+esc(a.category)+'</span><h4>'+esc(a.name)+'</h4></div><button type="button" class="app-guide-save '+(marked?'active':'')+'" data-app-save="'+esc(a.id)+'" aria-label="'+(marked?'Remove ':'Save ')+esc(a.name)+' '+(marked?'from':'to')+' my app shortlist" aria-pressed="'+marked+'">'+(marked?'★':'☆')+'</button></div>'+
 '<p class="app-guide-description">'+esc(a.summary)+'</p>'+
 '<p class="app-guide-purpose"><strong>Use it for:</strong> '+esc(a.purpose)+'</p>'+
 '<p class="app-guide-prereq"><strong>Before you use it:</strong> '+esc(a.accountNeeded||'See publisher requirements')+'</p>'+
 (a.notes?'<p class="app-guide-note">'+esc(a.notes)+'</p>':'')+
 '<p class="app-guide-metadata">'+(mobile?'Mobile app':'Web service · no app needed')+' · '+esc(a.importance)+' · '+esc(modeNames)+'</p>'+
 '<div class="app-guide-links">'+actions+'</div>'+
 (mobile&&!ios&&!android?'<p class="app-guide-unverified">No direct store link checked: download through the publisher to avoid lookalikes.</p>':'')+
 '<p class="app-guide-review">Curated '+esc(a.cataloguedOn||'date unavailable')+' · Confirm availability with publisher</p></article>';
}
function render(){
 if(!loaded)return;
 const q=term.trim().toLowerCase(),who=persona();
 // Platform logic is kept explicit to avoid conflating 'no verified link' with 'unavailable'.
 const rows=apps.filter(a=>{
  if(view==='saved'&&!saved.has(a.id))return false;
  if(view==='essentials'&&a.importance!=='Essential')return false;
  if(view==='recommended'&&!a.modes.includes(who))return false;
  if(category!=='all'&&a.category!==category)return false;
  if(download==='ios'&&!a.ios)return false;
  if(download==='android'&&!a.android)return false;
  if(download==='web'&&a.kind!=='web-service')return false;
  return !q||[a.name,a.category,a.publisher,a.summary,a.purpose].join(' ').toLowerCase().includes(q);
 }).sort((a,b)=>{
  const modeDiff=Number(b.modes.includes(who))-Number(a.modes.includes(who));
  return modeDiff||rank(b)-rank(a)||a.name.localeCompare(b.name);
 });
 $('#appLibraryCount').textContent=rows.length+' matched · '+apps.filter(a=>a.kind==='mobile-app').length+' mobile app candidates · '+apps.filter(a=>a.kind==='web-service').length+' useful web services · '+saved.size+' on my shortlist. Only confirmed store links are displayed.';
 $('#appLibraryCards').innerHTML=rows.length?rows.slice(0,limit).map(card).join(''):'<div class="app-guide-empty">Nothing matches. Try another category, switch to All apps, or clear the search.</div>';
 $('#appLibraryMore').hidden=rows.length<=limit;
 $('#appLibraryMore').textContent='Show more · '+Math.min(rows.length,limit)+' of '+rows.length;
}
function switchView(next){
 view=['recommended','essentials','all','saved'].includes(next)?next:'recommended';
 limit=20;
 panel.querySelectorAll('[data-app-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.appView===view)));
 render();
}
function activate(active){
 panel.hidden=!active;results.hidden=active;
 for(const selector of ['.discover-search-row','#discoverQuality','#discoverStatus']){
  const el=doc.querySelector(selector);if(el)el.hidden=active;
 }
 if(active){switchView(view);void 0}
}
panel.addEventListener('click',event=>{
 const sel=event.target.closest('[data-app-view]');if(sel){switchView(sel.dataset.appView);return}
 const btn=event.target.closest('[data-app-save]');
 if(btn){const id=btn.dataset.appSave;saved.has(id)?saved.delete(id):saved.add(id);persist();render();return}
 if(event.target.closest('#appLibraryMore')){limit+=20;render()}
});
$('#appLibrarySearch').addEventListener('input',e=>{term=e.target.value;limit=20;render()});
$('#appLibraryCategory').addEventListener('change',e=>{category=e.target.value;limit=20;render()});
$('#appLibraryDownload').addEventListener('change',e=>{download=e.target.value;limit=20;render()});
doc.addEventListener('sgbuddy:discover-tab',e=>activate(e.detail?.tab==='apps'));
doc.addEventListener('sgbuddy:persona',render);
Promise.all([
 fetch('/data/everyday-apps-v240.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('App directory unavailable');return r.json()}),
 fetch('/data/discover-v120.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{apps:[]}).catch(()=>({apps:[]}))
]).then(([data,legacy])=>{
 apps=Array.isArray(data.catalogue)?data.catalogue.filter(a=>a.id&&a.name&&safeUrl(a.sourceUrl)&&Array.isArray(a.modes)):[];
 const cats=[...new Set(apps.map(a=>a.category))].sort();
 $('#appLibraryCategory').insertAdjacentHTML('beforeend',cats.map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join(''));
 migrateSaved(Array.isArray(legacy.apps)?legacy.apps:[]);
 loaded=true;render();
 const button=doc.querySelector('[data-discover-tab="apps"]');
 activate(button?.getAttribute('aria-selected')==='true');
 doc.dispatchEvent(new CustomEvent('sgbuddy:app-library-ready',{detail:{total:apps.length,web:apps.filter(a=>a.kind==='web-service').length}}));
}).catch(()=>{$('#appLibraryCount').textContent='App directory could not load. Other SGBuddy discovery sections remain available.'});
})();
