/* SGBuddy UX Waves 1–3 — progressive enhancement over the V1.4 product. */
(()=>{
'use strict';
const core=window.SGBUDDY_CORE,router=window.SGBUDDY_VIEW_ROUTER;
if(!core||!router?.show)return;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const savedKey='sgbuddy-ux-saved-places-v1',discoverKey='sgbuddy-discover-saved-v1';
const originalShow=router.show.bind(router);
const scrollTop=()=>window.scrollTo({top:0,behavior:'instant'});
const setHidden=(node,hidden)=>{if(node)node.hidden=Boolean(hidden)};
function readArray(key){
 try{const result=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(result)?result.filter(x=>typeof x==='string').slice(0,500):[]}catch{return []}
}
function writeArray(key,list){try{localStorage.setItem(key,JSON.stringify([...new Set(list)].slice(0,500)))}catch{}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]))}
function icon(name){
 const paths={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 explore:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
 move:'<rect x="5" y="3" width="14" height="16" rx="4"/><path d="M5 11h14M8 16h1m6 0h1M8 21l2-2m6 0 2 2"/>',
 saved:'<path d="M6 4h12v17l-6-4-6 4z"/>',
 profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
 };
 return '<svg class="ux-nav-icon" viewBox="0 0 24 24" aria-hidden="true">'+paths[name]+'</svg>';
}
const navData=[
 ['navToday','today','Home','home'],
 ['navPlaces','places','Explore','explore'],
 ['navMove','move','Move','move'],
 ['navMoney','saved','Saved','saved'],
 ['navAccount','account','Profile','profile']
];
const nav=$('.bottom-nav');
navData.forEach(([id,target,label,art])=>{
 const a=$('#'+id);if(!a)return;
 a.dataset.navTarget=target;
 a.setAttribute('href',target==='saved'?'#uxSavedView':'#'+({today:'todaySection',places:'placesSection',move:'travelSection',account:'accountSection'}[target]||'uxSavedView'));
 a.innerHTML=icon(art)+'<span>'+label+'</span>';
});
if(nav){for(const id of ['navToday','navPlaces','navMove','navMoney','navAccount']){const item=$('#'+id);if(item)nav.appendChild(item)}}
function activeNav(name){
 $$('.bottom-nav [data-nav-target]').forEach(a=>{
 const yes=a.dataset.navTarget===name;
 a.classList.toggle('active',yes);
 if(yes)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 });
}
const main=$('main');
if(!main)return;
const savedView=document.createElement('div');
savedView.id='uxSavedView';savedView.className='v1-view ux-saved-view hidden';savedView.dataset.view='saved';
savedView.innerHTML=
 '<header class="ux-saved-header"><div class="label">MY SINGAPORE</div><h2>Saved for later</h2><p>Your favourite places, facts and addresses in one place. Personal collections stay on this device unless a supported account sync says otherwise.</p></header>'+
 '<section class="card"><div class="label">FAVOURITES</div><h3>Places, apps and facts</h3><div id="uxSavedContent" class="ux-saved-list" aria-live="polite"></div></section>'+
 '<section class="card"><div class="label">EVERYDAY JOURNEYS</div><h3>Your transport favourites</h3><p>Quickly find your saved bus stops and stations.</p><button class="secondary" type="button" data-ux-go="move">Open departures</button></section>';
main.appendChild(savedView);
const savedAddresses=$('.saved.card');
if(savedAddresses)savedView.appendChild(savedAddresses);
let selectedExplore='eat',catalog=null,lastFocus=null;
function show(name,options={}){
 if(name==='saved'){
 $$('.v1-view').forEach(v=>v.classList.toggle('hidden',v!==savedView));
 activeNav('saved');renderSaved();scrollTop();return;
 }
 savedView.classList.add('hidden');
 if(name==='money'){
 originalShow('money',options);activeNav('places');return;
 }
 const dest=name==='explore'?'places':name;
 originalShow(dest,options);
 activeNav(dest);
 if(dest==='places')setExplore(selectedExplore);
}
router.show=show;
if(nav){
 // Capture only primary navigation clicks, before the legacy delegated router.
 document.addEventListener('click',e=>{
 const a=e.target.closest('.bottom-nav [data-nav-target]');if(!a)return;
 e.preventDefault();e.stopImmediatePropagation();show(a.dataset.navTarget);
 },true);
}
const today=$('.v1-view[data-view="today"]');
function home(){
 if(!today)return;
 const heading=document.createElement('header');
 heading.className='ux-home-title';
 heading.innerHTML='<h2>Your Singapore, made simple.</h2><p>Useful answers first. More detail when you need it.</p>';
 today.prepend(heading);
 const hero=$('#todaySection');
 const summary=document.createElement('div');
 summary.className='ux-home-summary';summary.id='uxHomeSummary';
 summary.innerHTML='<span>24h PSI <strong id="uxPsi">—</strong></span><span>·</span><span>Humidity <strong id="uxHumidity">—</strong></span><button type="button" id="uxViewConditions" class="ux-condition-link">Full conditions →</button>';
 hero?.appendChild(summary);
 function update(){
 const psi=$('#envPsi')?.textContent?.trim(),humid=$('#envHumidity')?.textContent?.trim();
 $('#uxPsi').textContent=psi&&psi!=='—'?psi:'—';
 $('#uxHumidity').textContent=humid&&humid!=='—'?humid:'—';
 }
 document.addEventListener('sgbuddy:weather',update);
 const grid=document.createElement('div');grid.className='ux-primary-shortcuts';
 const items=[
 ['↗','Plan a trip','Routes and arrivals','move'],
 ['♨','Find food','Hawkers and dining','eat'],
 ['⌖','Near me','Everyday essentials','nearby'],
 ['◇','Explore','Discover Singapore','places']
 ];
 grid.innerHTML=items.map(([symbol,title,desc,go])=>'<button class="ux-shortcut" type="button" data-ux-go="'+go+'"><span class="ux-shortcut-icon" aria-hidden="true">'+symbol+'</span><span class="ux-shortcut-copy"><strong>'+title+'</strong><small>'+desc+'</small></span></button>').join('');
 hero?.insertAdjacentElement('afterend',grid);
 const details=document.createElement('details');details.id='uxExtraConditions';details.className='ux-expand-section';
 details.innerHTML='<summary>Weather, air quality & daily insights</summary><div class="ux-expand-content"></div>';
 today.appendChild(details);
 const content=details.querySelector('.ux-expand-content');
 for(const id of ['tripIntelligence','environmentCard','v120AirExtended','v094TodayBrief','personaFocus','travellerPanel']){
 const node=$('#'+id);if(node)content.appendChild(node);
 }
 $('#uxViewConditions')?.addEventListener('click',()=>{details.open=true;details.scrollIntoView({behavior:'smooth',block:'start'})});
 update();
}
home();

// Appearance is an explicitly reversible, local preference; product functions remain unchanged.
function initAppearance(){
 const key='sgbuddy-appearance-v1',select=document.createElement('label');
 select.className='ux-appearance-control';
 select.innerHTML='<span><strong>Appearance</strong><small>Choose the look that is easiest for you to use.</small></span><select id="uxThemeSelect" aria-label="App appearance"><option value="system">Use device setting</option><option value="dark">Dark</option><option value="light">Light</option></select>';
 $('#accountSection')?.appendChild(select);
 const stored=(()=>{try{return localStorage.getItem(key)||'system'}catch{return 'system'}})();
 const input=$('#uxThemeSelect');if(!input)return;
 input.value=['system','dark','light'].includes(stored)?stored:'system';
 const mq=window.matchMedia?.('(prefers-color-scheme: light)');
 const apply=()=>{
 const choice=input.value,light=choice==='light'||choice==='system'&&Boolean(mq?.matches);
 document.documentElement.dataset.uxTheme=light?'light':'dark';
 const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=light?'#f6f8fb':'#091727';
 };
 input.addEventListener('change',()=>{try{localStorage.setItem(key,input.value)}catch{}apply()});
 mq?.addEventListener?.('change',()=>{if(input.value==='system')apply()});
 apply();
}
initAppearance();
const move=$('.v1-view[data-view="move"]');
if(move){
 const planner=$('#travelSection');
 if(planner){
 move.insertBefore(planner,move.firstChild);
 const head=planner.querySelector('.planner-title-row h3');if(head)head.textContent='Where are you going?';
 const intro=document.createElement('div');
 intro.className='ux-move-intro';
 intro.innerHTML='<div class="label">MOVE AROUND SINGAPORE</div><h2>Plan your journey</h2><p>Find the most practical way to travel, then compare walking, public transport, driving and rideshare.</p>';
 move.insertBefore(intro,planner);
 const quick=document.createElement('div');quick.className='ux-move-links';
 quick.innerHTML='<button type="button" data-ux-scroll="transportSection">🚇 Train arrivals</button><button type="button" data-ux-scroll="cardsView">🚌 Bus stops</button><button type="button" data-ux-scroll="v110CompareCard">↗ Compare travel modes</button>';
 planner.insertAdjacentElement('afterend',quick);
 const cmp=$('#v110CompareCard');if(cmp)quick.insertAdjacentElement('afterend',cmp);
 const departures=document.createElement('div');departures.className='ux-departures-heading';
 departures.innerHTML='<div class="label">DEPARTURES</div><h2>Nearby and saved transport</h2><p>Your stations and bus stops, whenever you need them.</p>';
 const rail=$('#transportSection');if(rail)move.insertBefore(departures,rail);
 }
}
// Hide duplicate curated/official directories until explicitly selected.
const discover=$('#discoverHub'),placeView=$('.v1-view[data-view="places"]');
let nearby=null,knowledge=null;
function syncKnowledge(){
 knowledge=$('#merliKnowledgeLibrary');
 if(knowledge)knowledge.hidden=selectedExplore!=='facts';
}
if(discover&&placeView){
 const tabs=discover.querySelector('.discover-tabs');
 const nearTab=document.createElement('button');nearTab.type='button';
 nearTab.dataset.uxNearby='1';nearTab.textContent='Near me';nearTab.setAttribute('role','tab');
 nearTab.setAttribute('aria-controls','uxNearby');nearTab.setAttribute('aria-selected','false');
 tabs?.appendChild(nearTab);
 const utilities=document.createElement('div');utilities.className='ux-move-links';
 utilities.innerHTML='<button type="button" data-ux-go="money">⇄ Currency & money changers</button><button type="button" data-ux-go="saved">☆ Your saved places</button>';
 discover.insertAdjacentElement('afterend',utilities);
 nearby=document.createElement('section');nearby.id='uxNearby';nearby.className='ux-discover-nearby';nearby.hidden=true;
 utilities.insertAdjacentElement('afterend',nearby);
 for(const selector of ['#placesSection','.places-toolbar','#v110PlaceFilters','#placesGrid','#placesMapCard']){
 const n=$(selector);if(n)nearby.appendChild(n);
 }
 if($('#placesSection h2'))$('#placesSection h2').textContent='Nearby essentials';
 discover.addEventListener('click',e=>{
 const b=e.target.closest('[data-discover-tab]');
 if(b){const target=b.dataset.discoverTab;queueMicrotask(()=>setExplore(target));}
 });
 nearTab.addEventListener('click',()=>setExplore('nearby'));
 document.addEventListener('sgbuddy:discover-tab',e=>{if(e.detail?.tab)queueMicrotask(()=>setExplore(e.detail.tab))});
 const observer=new MutationObserver(()=>{syncKnowledge()});
 observer.observe(discover,{childList:true,subtree:false});
 setExplore('eat');
}
function setExplore(tab){
 selectedExplore=tab;
 if(!discover)return;
 const isNearby=tab==='nearby',isFacts=tab==='facts';
 setHidden(nearby,!isNearby);
 const results=$('#discoverResults'),status=$('#discoverStatus'),searchRow=$('.discover-search-row');
 setHidden(results,isNearby||isFacts);
 setHidden(status,isNearby||isFacts);
 setHidden(searchRow,isNearby||isFacts);
 const nearTab=$('[data-ux-nearby]');
 if(nearTab){nearTab.classList.toggle('ux-active',isNearby);nearTab.setAttribute('aria-selected',String(isNearby));nearTab.tabIndex=isNearby?0:-1}
 if(isNearby)$('[data-discover-tab]').forEach(b=>{b.setAttribute('aria-selected','false');b.classList.remove('active');b.tabIndex=-1});
 syncKnowledge();
}
const back=document.createElement('div');back.className='ux-move-links';
back.innerHTML='<button type="button" data-ux-go="places">← Back to Explore</button>';
$('#moneySection')?.insertAdjacentElement('beforebegin',back);
// Save from nearby official places without modifying the underlying Place Index.
function placeIndexKey(name){return 'INDEX:'+String(name||'').normalize('NFKC').trim().toLocaleLowerCase('en-SG')}
function isPlaceSaved(name){return readArray(savedKey).includes(placeIndexKey(name))}
const grid=$('#placesGrid');
function decoratePlaces(){
 if(!grid)return;
 grid.querySelectorAll('.v110-place-card').forEach(card=>{
 const name=card.querySelector('.place-route')?.dataset.featuredPlace||card.querySelector('h3')?.textContent||'';
 if(!name)return;
 let btn=card.querySelector('.ux-save-index');
 if(!btn){btn=document.createElement('button');btn.className='ux-save-index';btn.type='button';btn.dataset.uxSaveIndex=name;card.appendChild(btn)}
 const yes=isPlaceSaved(name);btn.textContent=yes?'★ Saved':'☆ Save for later';btn.setAttribute('aria-pressed',String(yes));
 const heading=card.querySelector('h3');
 if(heading&&!card.querySelector('.ux-index-details')){
 const detail=document.createElement('button');detail.className='ux-detail-button ux-index-details';detail.type='button';detail.dataset.uxDetailIndex=name;detail.textContent='Details';
 card.querySelector('.place-card-actions')?.prepend(detail);
 }
 });
}
if(grid){new MutationObserver(decoratePlaces).observe(grid,{childList:true});decoratePlaces()}
// One detail sheet for curated and official/nearby places; no invented hours or prices.
const dialog=document.createElement('div');dialog.className='ux-place-dialog';dialog.id='uxPlaceDialog';dialog.hidden=true;
dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','uxDialogTitle');
dialog.innerHTML='<div class="ux-place-dialog-card"><div class="ux-place-dialog-top"><div><div class="label" id="uxDialogType">SINGAPORE PLACE</div><h2 id="uxDialogTitle"></h2></div><button type="button" id="uxDialogClose" aria-label="Close place details">×</button></div><p id="uxDialogArea"></p><p id="uxDialogDescription"></p><p class="ux-source-note" id="uxDialogStatus"></p><div class="ux-place-dialog-actions"><button type="button" id="uxDialogRoute">Plan route</button><a id="uxDialogMap" target="_blank" rel="noopener noreferrer">Open map ↗</a></div></div>';
document.body.appendChild(dialog);
let dialogPlace='';
function openDetails(row,official=false){
 if(!row)return;
 lastFocus=document.activeElement;dialogPlace=row.name;
 $('#uxDialogTitle').textContent=row.name;
 $('#uxDialogType').textContent=official?'NEARBY ESSENTIAL':'CURATED DISCOVERY';
 $('#uxDialogArea').textContent=[row.area,row.address,row.postalCode?'Singapore '+row.postalCode:''].filter(Boolean).join(' · ')||'Singapore';
 $('#uxDialogDescription').textContent=row.description||row.category||'Discover this Singapore location.';
 $('#uxDialogStatus').textContent=official?'Location information is sourced from the Place Index. Check opening hours and operating details before visiting.':'Curated suggestion · opening hours, entrance fees and availability have not been independently verified.';
 $('#uxDialogMap').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(row.name+', '+(row.area||row.address||'Singapore'));
 dialog.hidden=false;document.body.classList.add('ux-dialog-open');$('#uxDialogClose').focus();
}
function closeDetails(){dialog.hidden=true;document.body.classList.remove('ux-dialog-open');lastFocus?.focus?.()}
$('#uxDialogClose').addEventListener('click',closeDetails);
dialog.addEventListener('click',e=>{if(e.target===dialog)closeDetails()});
document.addEventListener('keydown',e=>{
 if(dialog.hidden)return;
 if(e.key==='Escape')closeDetails();
 if(e.key==='Tab'){
 const all=$$('#uxPlaceDialog button,#uxPlaceDialog a').filter(x=>!x.hidden);
 const i=all.indexOf(document.activeElement);
 if(e.shiftKey&&i===0){e.preventDefault();all[all.length-1].focus()}
 else if(!e.shiftKey&&i===all.length-1){e.preventDefault();all[0].focus()}
 }
});
$('#uxDialogRoute').addEventListener('click',()=>{const dest=dialogPlace;closeDetails();if($('#tripTo'))$('#tripTo').value=dest;show('move');$('#tripTo')?.focus()});
function findIndexRow(name){return (core.state.v110Places||[]).find(row=>row.name===name)}
document.addEventListener('click',e=>{
 const go=e.target.closest('[data-ux-go]');
 if(go){const to=go.dataset.uxGo;if(['eat','do','shop','apps','facts','nearby'].includes(to)){
 show('places');
 if(to==='nearby')setExplore('nearby');
 else{$('[data-discover-tab="'+to+'"]')?.click();setExplore(to)}
 }else show(to);return}
 const jump=e.target.closest('[data-ux-scroll]');
 if(jump){const target=$('#'+jump.dataset.uxScroll);target?.scrollIntoView({behavior:'smooth',block:'start'});return}
 const save=e.target.closest('[data-ux-save-index]');
 if(save){const name=save.dataset.uxSaveIndex,key=placeIndexKey(name);const set=new Set(readArray(savedKey));set.has(key)?set.delete(key):set.add(key);writeArray(savedKey,[...set]);decoratePlaces();renderSaved();return}
 const index=e.target.closest('[data-ux-detail-index]');
 if(index){openDetails(findIndexRow(index.dataset.uxDetailIndex),true);return}
 const curated=e.target.closest('.discover-item .ux-detail-button');
 if(curated){const id=curated.dataset.uxDetailCurated;openDetails(catalog?.places?.find(x=>x.id===id));return}
 const savedItem=e.target.closest('[data-ux-open-saved]');
 if(savedItem){const kind=savedItem.dataset.uxOpenSaved,id=savedItem.dataset.uxSavedId;
 if(kind==='index')openDetails(findIndexRow(id)||{name:id},true);
 else if(kind==='place')openDetails(catalog?.places?.find(x=>x.id===id));
 else if(kind==='app'||kind==='fact'){show('places');const tab=kind==='app'?'apps':'facts';$('[data-discover-tab="'+tab+'"]')?.click();setExplore(tab)}
 }
});
function decorateCurated(){
 if(!discover||!catalog)return;
 $$('#discoverResults .discover-item').forEach(card=>{
 if(card.querySelector('.ux-detail-button'))return;
 const title=card.querySelector('h3')?.textContent||'';
 const row=catalog.places.find(p=>p.name===title);
 if(!row)return;
 const button=document.createElement('button');button.className='ux-detail-button';button.type='button';button.dataset.uxDetailCurated=row.id;button.textContent='Details';
 (card.querySelector('.discover-actions')||card).appendChild(button);
 });
}
const discoverResults=$('#discoverResults');
if(discoverResults)new MutationObserver(decorateCurated).observe(discoverResults,{childList:true});
fetch('/data/discover-v120.json').then(r=>r.ok?r.json():null).then(data=>{if(!data)return;catalog=data;decorateCurated();renderSaved()}).catch(()=>{renderSaved()});
function renderSaved(){
 const el=$('#uxSavedContent');if(!el)return;
 const ids=readArray(discoverKey),index=readArray(savedKey);
 const rows=[];
 for(const id of ids){
 const record=catalog?.places?.find(p=>p.id===id)||catalog?.apps?.find(a=>a.id===id)||catalog?.facts?.find(f=>f.id===id);
 if(!record)continue;
 const kind=id.startsWith('FACT')?'fact':id.startsWith('APP')?'app':'place';
 rows.push({kind,id,name:record.name||record.text||'Singapore fact',note:kind==='fact'?'Verified/source-reviewed fact':record.area||record.category||'Saved item'});
 }
 for(const id of index){if(!id.startsWith('INDEX:'))continue;const source=(core.state.v110Places||[]).find(p=>placeIndexKey(p.name)===id);
 rows.push({kind:'index',id:source?.name||id.slice(6),name:source?.name||id.slice(6),note:source?.category||'Saved nearby place'});
 }
 el.innerHTML=rows.length?rows.map(r=>'<article class="ux-saved-item card"><strong>'+esc(r.name)+'</strong><small>'+esc(r.note)+'</small><button type="button" data-ux-open-saved="'+esc(r.kind)+'" data-ux-saved-id="'+esc(r.id)+'">Open details →</button></article>').join(''):'<div class="ux-saved-empty">Nothing saved yet. Use the ☆ icons in Explore or Near me to create your collection.</div>';
}
document.addEventListener('sgbuddy:knowledge-saved',renderSaved);
document.addEventListener('sgbuddy:persona',()=>{renderSaved();syncKnowledge()});
window.addEventListener('storage',e=>{if([savedKey,discoverKey].includes(e.key)){renderSaved();decoratePlaces()}});
// When Merli's library arrives after its source-linked fetch, retain one facts result surface.
const observeLibrary=new MutationObserver(()=>syncKnowledge());
if(discover)observeLibrary.observe(discover,{childList:true});
activeNav('today');
window.__SGBUDDY_UX_WAVES__='1-3';
})();
