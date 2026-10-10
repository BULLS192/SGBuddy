/* SGBuddy food exploration: stall leads + dish vocabulary, no unverified claims as facts. */
(()=>{'use strict';
const core=window.SGBUDDY_CORE;if(!core)return;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const allowedUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:''}catch{return ''}};
const key='sgbuddy-stall-saved-v1';
let saved=new Set();try{const arr=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(arr))saved=new Set(arr.filter(x=>typeof x==='string').slice(0,300))}catch{}
let stalls=[],dishes=[],tab='stalls',area='all',cuisine='all',meal='all',dish='all',term='',onlySaved=false,limit=16,initialised=false;
const host=$('#discoverHub');if(!host)return;
const sec=document.createElement('section');sec.id='foodExplorer';sec.className='card food-explorer';sec.hidden=true;
sec.innerHTML='<div class="label">SGBUDDY FOOD LIBRARY</div><h3>What shall we eat?</h3>'+
'<p class="food-note">Explore Singapore dishes and hawker-stall research leads. Stall operating status, opening hours, menu prices, halal certification and vegetarian options are <strong>not verified</strong>.</p>'+
'<div class="food-view-tabs" role="group" aria-label="Food library views"><button type="button" data-food-view="stalls" aria-pressed="true">Hawker stalls</button><button type="button" data-food-view="dishes" aria-pressed="false">Singapore dishes</button></div>'+
'<div class="food-controls"><input id="foodSearch" type="search" placeholder="Search stall, dish or hawker centre" aria-label="Search the food library"/>'+
'<select id="foodArea" aria-label="Filter food by area"><option value="all">All areas</option></select>'+
'<select id="foodCuisine" aria-label="Filter by cuisine"><option value="all">All cuisines</option></select>'+
'<select id="foodMeal" aria-label="Filter by meal"><option value="all">Any meal</option></select>'+
'<select id="foodDish" aria-label="Filter by dish"><option value="all">Any dish</option></select>'+
'<label class="food-saved"><input id="foodSavedOnly" type="checkbox"/> Saved stalls only</label></div>'+
'<p class="food-count" role="status" id="foodCount">Loading food research leads…</p>'+
'<div id="foodCards" class="food-grid"></div><button type="button" class="secondary" id="foodLoadMore" hidden>Show more</button>';
const res=$('#discoverResults');if(res)res.insertAdjacentElement('beforebegin',sec);else host.insertAdjacentElement('beforeend',sec);
function persist(){try{localStorage.setItem(key,JSON.stringify([...saved].slice(0,300)))}catch{}}
function options(selector,values){
 const field=$(selector);
 field.insertAdjacentHTML('beforeend',values.filter(Boolean).sort().map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join(''));
}
function cardStall(x){
 const isSaved=saved.has(x.id),link=allowedUrl(x.referenceUrl);
 return '<article class="card food-stall" data-stall-id="'+esc(x.id)+'"><div class="label">'+esc(x.cuisine)+' · '+esc(x.area)+'</div><h4>'+esc(x.name)+'</h4>'+
 '<p>'+(x.reviewStatus==='nea-award-listed-2025'?'NEA 2025 award listing':'Editorial research lead')+' at '+esc(x.centreName)+(x.stallNumber?' · '+esc(x.stallNumber):'')+' · Dish: '+esc((x.dishes||[]).join(', '))+'</p>'+
 '<p class="food-warning">'+(x.reviewStatus==='nea-award-listed-2025'?'NEA documented in 2025; current trading unverified':'Stall and menu not independently confirmed')+' · Prices and dietary certification unknown</p>'+
 '<div class="food-card-actions"><button type="button" data-stall-save="'+esc(x.id)+'" aria-pressed="'+isSaved+'">'+(isSaved?'★ Saved':'☆ Save')+'</button>'+
 (link?'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Search location ↗</a>':'')+(x.sourceUrl?'<a href="'+esc(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">NEA award source ↗</a>':'')+
 '<button type="button" data-stall-address="'+esc(x.centreId)+'">Check centre address</button></div><p class="food-address" role="status"></p></article>';
}
function cardDish(x){
 return '<article class="card food-stall"><div class="label">'+esc(x.cuisine)+' · '+esc(x.meal)+'</div><h4>'+esc(x.name)+'</h4>'+
 '<p>'+esc(x.description)+'</p><p class="food-warning">Dish guide only: vendors, ingredients, allergens, prices and certification vary.</p>'+
 '<button type="button" data-search-dish="'+esc(x.name)+'">Find stall leads for this dish ↗</button></article>';
}
function render(){
 if(!initialised)return;
 const q=term.trim().toLowerCase();
 const rows=tab==='stalls'?stalls.filter(x=>
  (area==='all'||x.area===area)&&(cuisine==='all'||x.cuisine===cuisine)&&
  (meal==='all'||x.meal===meal)&&(dish==='all'||(x.dishes||[]).includes(dish))&&
  (!onlySaved||saved.has(x.id))&&
  (!q||(x.name+' '+x.centreName+' '+x.area+' '+x.cuisine+' '+x.dishes.join(' ')).toLowerCase().includes(q))
 ):dishes.filter(x=>(cuisine==='all'||x.cuisine===cuisine)&&
  (meal==='all'||x.meal===meal)&&(!q||(x.name+' '+x.cuisine+' '+x.description).toLowerCase().includes(q)));
 $('#foodCount').textContent=rows.length+' '+(tab==='stalls'?'stall listings (none confirmed operating)':'Singapore food and drink styles')+' · '+Math.min(rows.length,limit)+' shown';
 $('#foodCards').innerHTML=rows.slice(0,limit).map(tab==='stalls'?cardStall:cardDish).join('')||'<div class="card">No entries match those filters. Try a broader cuisine or area.</div>';
 $('#foodLoadMore').hidden=rows.length<=limit;
 $('#foodSavedOnly').closest('label').hidden=tab!=='stalls';
 $('#foodArea').hidden=tab!=='stalls';
 $('#foodDish').hidden=tab!=='stalls';
}
function setView(next){
 tab=next==='dishes'?'dishes':'stalls';limit=16;
 for(const x of sec.querySelectorAll('[data-food-view]'))x.setAttribute('aria-pressed',String(x.dataset.foodView===tab));
 $('#foodCuisine').value='all';cuisine='all';$('#foodMeal').value='all';meal='all';$('#foodDish').value='all';dish='all';
 render();
}
sec.addEventListener('click',e=>{
 const view=e.target.closest('[data-food-view]');if(view){setView(view.dataset.foodView);return}
 const save=e.target.closest('[data-stall-save]');if(save){const id=save.dataset.stallSave;saved.has(id)?saved.delete(id):saved.add(id);persist();render();return}
 const searchDish=e.target.closest('[data-search-dish]');if(searchDish){
  setView('stalls');const v=searchDish.dataset.searchDish;dish=v;
  $('#foodDish').value=[...$('#foodDish').options].some(x=>x.value===v)?v:'all';
  if($('#foodDish').value==='all'){term=v;$('#foodSearch').value=v}else{term='';$('#foodSearch').value=''}
  render();return;
 }
 const addressButton=e.target.closest('[data-stall-address]');if(addressButton){
  const note=addressButton.closest('.food-stall')?.querySelector('.food-address');if(!note)return;
  note.textContent='Checking the hawker centre with OneMap…';addressButton.disabled=true;
  fetch('/api/discover-address?id='+encodeURIComponent(addressButton.dataset.stallAddress),{cache:'no-store'})
   .then(r=>r.ok?r.json():Promise.reject(Error('lookup failed')))
   .then(p=>{note.textContent=p.status==='address-matched'&&p.address?('OneMap matched: '+p.address.address+' · Operating status not checked'):(p.status==='ambiguous'?'Ambiguous match; verify this centre manually':p.status==='not-configured'?'OneMap not configured':'No confirmed match yet')})
   .catch(()=>{note.textContent='OneMap temporarily unavailable'})
   .finally(()=>{addressButton.disabled=false});
  return;
 }
});
const bind=(selector,keyName)=>$(selector).addEventListener('change',e=>{
 const val=e.target.value;
 if(keyName==='area')area=val;else if(keyName==='cuisine')cuisine=val;else if(keyName==='meal')meal=val;else if(keyName==='dish')dish=val;else if(keyName==='saved')onlySaved=!!e.target.checked;
 limit=16;render();
});
bind('#foodArea','area');bind('#foodCuisine','cuisine');bind('#foodMeal','meal');bind('#foodDish','dish');bind('#foodSavedOnly','saved');
$('#foodSearch').addEventListener('input',e=>{term=e.target.value;limit=16;render()});
$('#foodLoadMore').addEventListener('click',()=>{limit+=16;render()});
document.addEventListener('sgbuddy:discover-tab',e=>{sec.hidden=e.detail.tab!=='eat';if(!sec.hidden)render()});
const eat=$('[data-discover-tab="eat"]');sec.hidden=!eat||eat.getAttribute('aria-selected')!=='true';
Promise.all([
 fetch('/data/food-stalls-v180.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('stalls unavailable');return r.json()}),
 fetch('/data/singapore-dishes-v180.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('dish guide unavailable');return r.json()})
]).then(([a,b])=>{
 stalls=Array.isArray(a.stalls)?a.stalls.filter(x=>['research-candidate','nea-award-listed-2025'].includes(x.reviewStatus)):[];
 dishes=Array.isArray(b.dishes)?b.dishes:[];
 options('#foodArea',[...new Set(stalls.map(x=>x.area))]);
 options('#foodCuisine',[...new Set([...stalls,...dishes].map(x=>x.cuisine))]);
 options('#foodMeal',[...new Set([...stalls,...dishes].map(x=>x.meal))]);
 options('#foodDish',[...new Set(stalls.flatMap(x=>x.dishes||[]))]);
 initialised=true;render();
}).catch(()=>{$('#foodCount').textContent='Food library data could not be loaded; the standard Discover directory is still available.'});
})();