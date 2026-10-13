import {extendedUi} from './lib/i18n-extended-v300.mjs';
import {foodStatus} from './lib/i18n-food-status-v400.mjs';
/* SGBuddy V2.6 Food Wave — Merli's food picker & trusted provider handoffs.
   Random suggestions are from dated, source-linked editorial candidates, NOT live menus. */
(()=>{'use strict';
 const core=window.SGBUDDY_CORE,doc=document,host=doc.getElementById('foodExplorer');
 if(!core||!host)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeUrl=value=>{try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}};
 const ui=()=>extendedUi(window.SGBUDDY_LANGUAGE||'en');
 const key='sgbuddy-food-picks-v261';
 let saved=new Set();try{const arr=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(arr))saved=new Set(arr.filter(x=>typeof x==='string').slice(0,100))}catch{}
 let picks=[],platforms=[],sections=[],area='all',craving='any',section='reviews',lastId=null,chosen=null,loaded=false;
 const dock=doc.createElement('section');
 dock.id='foodToolsV261';dock.className='food-tools-v261';dock.setAttribute('aria-label','Singapore food discovery tools');
 dock.innerHTML='<div class="food-tools-heading"><div><div class="label">MERLI MAKAN GUIDE</div><h4 id="foodToolsTitle">Not sure what to eat?</h4><p id="foodToolsSubtitle">Let Merli pick from 2026 guide-listed stall leads, or choose a dining service.</p></div></div>'+
 '<div class="food-tools-nav" role="group" aria-label="Food discovery tools"><button type="button" id="foodToolPicker" data-food-tool="picker" aria-pressed="true">✨ Pick for me</button><button type="button" id="foodToolServices" data-food-tool="services" aria-pressed="false">Reviews, deals & delivery</button></div>'+
 '<div id="foodToolPickerPanel"><div class="food-tool-filters"><label>Neighbourhood / area<select id="foodPickArea"><option value="all">Anywhere in Singapore</option></select></label><label>Craving<select id="foodPickCraving"><option value="any">Surprise me</option><option value="noodles">Noodles</option><option value="rice">Rice</option><option value="soup">Soup</option><option value="snack">Snack / bite</option></select></label></div>'+
 '<div class="food-tools-actions"><button type="button" id="foodPickButton">✨ Merli, pick my meal</button><button type="button" id="foodPickSaved" aria-pressed="false">★ Show my picks</button></div>'+
 '<p id="foodPickNote" class="food-tool-note" role="status">Suggestions come from dated guide entries, not current stall openings or live menus. Prices and dietary certification are not verified.</p><div id="foodPickResult" aria-live="polite"></div></div>'+
 '<div id="foodToolServicesPanel" hidden><p class="food-tool-note">Explore providers for reviews, bookings, delivery, discounts and food rescue. SGBuddy does not display live reviews, prices or available restaurant tables.</p><div id="foodServiceTabs" class="food-service-tabs"></div><div id="foodServiceResults"></div></div>';
 const before=host.querySelector('.food-view-tabs');if(before)before.insertAdjacentElement('beforebegin',dock);else host.append(dock);
 const $=selector=>dock.querySelector(selector);
 const norm=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const quoteUrl=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.name+' '+(p.centreName||p.area||'')+' Singapore');
 const sortByName=(a,b)=>a.name.localeCompare(b.name);
 function save(){try{localStorage.setItem(key,JSON.stringify([...saved].slice(0,100)))}catch{}}
 function sectionButton(id){dock.querySelectorAll('[data-food-tool]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.foodTool===id)));$('#foodToolPickerPanel').hidden=id!=='picker';$('#foodToolServicesPanel').hidden=id!=='services';}
 function label(p){return p.reviewStatus==='guide-listed-2026'?'MICHELIN guide · Jul 2026':'CNA reporting · Jul 2026';}
 function pickedCard(p){
  if(!p)return '';
  const map=safeUrl(p.referenceUrl)||quoteUrl(p),source=safeUrl(p.sourceUrl);
  const favourite=saved.has(p.id);
  return '<article class="food-picked-card"><div class="label">'+esc(label(p))+'</div><h4>'+esc(p.name)+'</h4><p>📍 '+esc(p.centreName||'Centre not provided')+' · '+esc(p.area||'Singapore')+(p.stallNumber?' · '+esc(p.stallNumber):'')+'</p>'+
   '<p class="food-tool-note">'+(p.stallNumber?'Stall unit as listed by the guide; ':'Exact stall number not independently confirmed; ')+
   'today’s opening hours, dishes, prices and dietary status must be checked.</p>'+
   '<div class="food-picked-actions"><a href="'+esc(map)+'" target="_blank" rel="noopener noreferrer">Map search ↗</a>'+
   (source?'<a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">Read '+esc(p.reviewStatus==='guide-listed-2026'?'MICHELIN':'CNA')+' ↗</a>':'')+
   '<button type="button" data-food-pick-save="'+esc(p.id)+'" aria-pressed="'+String(favourite)+'">'+(favourite?'★ Saved':'☆ Save pick')+'</button></div></article>';
 }
 function renderPicked(){if(chosen)$('#foodPickResult').innerHTML=pickedCard(chosen)}
 function candidates(){
  const keys={noodles:['noodle','mee','laksa','kway teow','hor fun','ban mian','bee hoon','thosai'],rice:['rice','nasi','biryani','porridge','claypot'],soup:['soup','broth','porridge','fish head','bak kut'],snack:['kueh','kuih','puff','cake','bak chang','vadai']};
  return picks.filter(p=>(area==='all'||p.area===area)&&
   (craving==='any'||(keys[craving]||[]).some(word=>[p.name,...(p.dishes||[])].join(' ').toLowerCase().includes(word))));
 }
 function makePick(){
  if(!loaded){$('#foodPickNote').textContent='Food guide is loading; please retry.';return}
  const options=candidates();
  if(!options.length){chosen=null;$('#foodPickResult').innerHTML='';$('#foodPickNote').textContent='No guide-listed match in this area for that craving. Try another area or Surprise me.';return}
  const alternatives=options.filter(p=>p.id!==lastId);
  const pool=alternatives.length?alternatives:options;
  const sample=pool[Math.floor(Math.random()*pool.length)];
  chosen=sample;lastId=sample.id;
  $('#foodPickNote').textContent='Merli picked one of '+options.length+' guide-listed candidates that match your filters. This is not a live restaurant or nutrition recommendation.';
  renderPicked();
 }
 function renderServices(){
  $('#foodServiceTabs').innerHTML=sections.map(s=>'<button type="button" data-food-service="'+esc(s.id)+'" aria-pressed="'+String(s.id===section)+'">'+esc(s.label)+'</button>').join('');
  const group=sections.find(s=>s.id===section);
  if(!group)return;
  $('#foodServiceResults').innerHTML='<h4>'+esc(group.title)+'</h4><p class="food-tool-note">'+esc(group.purpose)+'</p>'+
   '<div class="food-provider-grid">'+(group.providerIds||[]).map(id=>platforms.find(x=>x.id===id)).filter(Boolean).map(x=>{
    const url=safeUrl(x.sourceUrl);
    return '<article class="food-provider-card"><div class="label">'+esc(x.category||'Food and dining')+'</div><h5>'+esc(x.name)+'</h5><p>'+esc(x.purpose||x.summary||'Check provider')+'</p>'+
      '<p class="food-tool-note">'+esc(x.notes||'Offers and availability vary by provider.')+'</p>'+
      (url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Open '+esc(x.name)+' ↗</a>':'')+'</article>';
   }).join('')+'</div><p class="food-tool-note">'+esc(group.caution||'Check conditions with the provider.')+'</p>';
 }
 function renderLanguage(){
  // Single-source, authored 12-locale labels. Do not overwrite provider content.
  const labels=ui();
  $('#foodToolsTitle').textContent=labels.foodToolsTitle;
  $('#foodToolPicker').textContent='✨ '+labels.foodPicker;
  $('#foodToolServices').textContent=labels.foodServices;
  $('#foodPickButton').textContent='✨ '+labels.foodPickButton;
  $('#foodPickSaved').textContent='★ '+labels.foodMyPicks;
 }
 dock.addEventListener('click',e=>{
  const nav=e.target.closest('[data-food-tool]');if(nav){sectionButton(nav.dataset.foodTool);return}
  const service=e.target.closest('[data-food-service]');if(service){section=service.dataset.foodService;renderServices();return}
  if(e.target.closest('#foodPickButton')){makePick();return}
  const fav=e.target.closest('[data-food-pick-save]');if(fav){const id=fav.dataset.foodPickSave;saved.has(id)?saved.delete(id):saved.add(id);save();renderPicked();return}
  if(e.target.closest('#foodPickSaved')){
   const ids=[...saved],only=ids.map(id=>picks.find(p=>p.id===id)).filter(Boolean);
   $('#foodPickResult').innerHTML=only.length?only.map(pickedCard).join(''):'<p class="food-tool-note">'+esc(foodStatus(window.SGBUDDY_LANGUAGE||'en','foodPickerEmpty'))+'</p>';
   $('#foodPickSaved').setAttribute('aria-pressed','true');return;
  }
 });
 $('#foodPickArea').addEventListener('change',e=>{area=e.target.value;chosen=null;$('#foodPickResult').innerHTML='';$('#foodPickSaved').setAttribute('aria-pressed','false')});
 $('#foodPickCraving').addEventListener('change',e=>{craving=e.target.value;chosen=null;$('#foodPickResult').innerHTML='';$('#foodPickSaved').setAttribute('aria-pressed','false')});
 doc.addEventListener('sgbuddy:language',renderLanguage);
 renderLanguage();sectionButton('picker');
 Promise.all([
  fetch('/data/guide-stalls-v230.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{stalls:[]}).catch(()=>({stalls:[]})),
  fetch('/data/food-leads-v261.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{stalls:[]}).catch(()=>({stalls:[]})),
  fetch('/data/dining-services-v261.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Dining service listings unavailable');return r.json()}),
  fetch('/data/everyday-apps-v240.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{catalogue:[]}).catch(()=>({catalogue:[]}))
 ]).then(([guide,extra,dining,old])=>{
  const ids=new Set();
  picks=[...(guide.stalls||[]),...(extra.stalls||[])].filter(p=>{
   if(!p.id||!p.name||!p.centreName||!safeUrl(p.sourceUrl)||p.operatingStatus!=='unverified')return false;
   const name=norm(p.name);if(ids.has(name))return false;ids.add(name);return true;
  }).sort(sortByName);
  const additions=Array.isArray(dining.additions)?dining.additions:[];
  const enhancements=new Map((dining.enhancements||[]).map(a=>[a.id,a]));
  platforms=[...(old.catalogue||[]),...additions].map(a=>({...a,...(enhancements.get(a.id)||{})}));
  sections=Array.isArray(dining.services)?dining.services:[];
  const areas=[...new Set(picks.map(p=>p.area).filter(Boolean))].sort();
  $('#foodPickArea').insertAdjacentHTML('beforeend',areas.map(a=>'<option value="'+esc(a)+'">'+esc(a)+'</option>').join(''));
  loaded=true;renderServices();
  $('#foodPickNote').textContent=picks.length+' guide-listed food candidates across '+areas.length+' areas. Today’s opening hours and dish availability are not verified.';
  doc.dispatchEvent(new CustomEvent('sgbuddy:food-tools-ready',{detail:{picks:picks.length,services:sections.length}}));
 }).catch(()=>{$('#foodPickNote').textContent='The food tool listings are temporarily unavailable; browse existing stalls above or use their original source links.'});
 window.__SGBUDDY_FOOD_TOOLS__='v2.6';
})();