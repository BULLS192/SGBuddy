/* SGBuddy v1.5 — large official-place directory layered under curated Discover.
 * Preserves v1.2 categories and v1.4 Merli/knowledge without a new database.
 */
(()=>{'use strict';
const core=window.SGBUDDY_CORE;if(!core)return;
const {state}=core,$=x=>document.querySelector(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safe=x=>{try{const u=new URL(String(x));return u.protocol==='https:'?u.href:''}catch{return ''}};
const norm=s=>String(s||'').toLowerCase().replace(/&/g,'and').replace(/\b(food (centre|center)|hawker centre|market and food centre)\b/g,'food').replace(/[^a-z0-9]+/g,' ').trim();
const key='sgbuddy-discover-saved-v1';
function favorites(){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return new Set(Array.isArray(x)?x.filter(k=>typeof k==='string'):[])}catch{return new Set()}}
let saved=favorites(),items=[],sources=[],ready=false,search='',group='all',radius='all',includeHistoric=false,onlySaved=false,shown=36,tab='eat',status='loading';
const root=$('#discoverHub');
if(!root)return;
const extra=document.createElement('section');
extra.id='officialDirectory';extra.className='card official-directory';extra.setAttribute('aria-label','Additional official Singapore listings');
extra.innerHTML='<div class="official-header"><div><div class="label">SINGAPORE PLACE LIBRARY</div><h3>More places across Singapore</h3>'+
'<p>Government-published location records supplement our curated picks above. An official listing does not establish opening hours, prices, suitability or current operation.</p></div><span id="officialListingBadge" class="sync-badge">Loading</span></div>'+
'<div class="official-controls"><input id="officialQuery" type="search" placeholder="Search hawkers, parks, CCs, postal codes…" aria-label="Search official places"/>'+
'<select id="officialKind" aria-label="Place type"><option value="all">All place types</option></select>'+
'<select id="officialRadius" aria-label="Distance filter"><option value="all">All distances</option><option value="2">Within 2 km</option><option value="5">Within 5 km</option><option value="10">Within 10 km</option></select>'+
'<label class="official-filter"><input id="officialHistoric" type="checkbox"/> Include historic attractions listings</label>'+
'<label class="official-filter"><input id="officialSaved" type="checkbox"/> Saved only</label></div>'+
'<p id="officialSummary" class="official-summary" role="status">Checking Singapore government datasets…</p>'+
'<div id="officialCards" class="official-grid"></div><button id="officialMore" type="button" class="secondary official-more" hidden>Show more locations</button>'+
'<details class="official-source-details"><summary>Data sources, coverage and limitations</summary><div id="officialSources">Checking sources…</div></details>';
const knowledge=$('#merliKnowledgeLibrary');
if(knowledge)root.insertBefore(extra,knowledge);else root.appendChild(extra);
const statusNode=$('#officialSummary');
const placeDistance=(lat,lon)=>{
 if(!Number.isFinite(Number(state.lat))||!Number.isFinite(Number(state.lon))||state.lat==null||state.lon==null)return null;
 const p1=Number(state.lat)*Math.PI/180,p2=lat*Math.PI/180,dlat=p2-p1,dlon=(lon-Number(state.lon))*Math.PI/180;
 const h=Math.sin(dlat/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dlon/2)**2;
 return 12742*Math.asin(Math.min(1,Math.sqrt(Math.max(0,h))));
};
function filtered(){
 const query=search.toLowerCase().trim();
 const mode=state.mode||'resident';
 return items.filter(x=>x.category===(tab==='eat'?'Eat':'Do')&&
 (includeHistoric||x.freshness!=='historical-recheck')&&
 (group==='all'||x.sourceCode===group)&&
 (!onlySaved||saved.has(x.id))&&
 (!query||[x.name,x.area,x.kind,x.postal,x.address].join(' ').toLowerCase().includes(query))&&
 (radius==='all'||(placeDistance(x.lat,x.lon)!=null&&placeDistance(x.lat,x.lon)<=Number(radius))))
 .map(x=>({...x,distanceKm:placeDistance(x.lat,x.lon)}))
 .sort((a,b)=>{
  if(a.distanceKm!=null&&b.distanceKm!=null)return a.distanceKm-b.distanceKm;
  if(mode==='visitor'&&a.sourceCode==='STB_ATTRACTIONS'&&b.sourceCode!=='STB_ATTRACTIONS')return -1;
  if(mode==='student'&&a.sourceCode==='SPORT_FACILITIES'&&b.sourceCode!=='SPORT_FACILITIES')return -1;
  return a.name.localeCompare(b.name);
 });
}
function persist(){try{localStorage.setItem(key,JSON.stringify([...saved].slice(0,500)))}catch{}document.dispatchEvent(new Event('sgbuddy:knowledge-saved'))}
function render(){
 extra.hidden=!['eat','do'].includes(tab);
 if(extra.hidden)return;
 if(!ready){statusNode.textContent=status==='error'?'Official datasets could not be retrieved. Curated recommendations above still work.':'Checking government datasets. You can use curated recommendations above meanwhile.';return}
 const all=filtered(),shownRows=all.slice(0,shown);
 const total=items.filter(x=>x.category===(tab==='eat'?'Eat':'Do')).length;
 const loaded=sources.filter(x=>x.status==='loaded').length;
 $('#officialListingBadge').textContent=total+' added records';
 statusNode.textContent=all.length+' matching government listings · '+total+' total in this category · '+loaded+'/'+sources.length+' sources reachable · hours and prices unverified';
 const mapURL=x=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(x.name+', '+(x.postal||x.address||x.area)+', Singapore');
 $('#officialCards').innerHTML=shownRows.map(x=>{
  const marked=saved.has(x.id);
  return '<article class="card official-card"><div class="official-title"><div><span class="label">'+esc(x.kind)+' · '+esc(x.agency)+'</span><h4>'+esc(x.name)+'</h4></div>'+
  '<button type="button" data-official-save="'+esc(x.id)+'" aria-pressed="'+String(marked)+'" aria-label="'+(marked?'Remove from saved ':'Save ')+esc(x.name)+'">'+(marked?'★':'☆')+'</button></div>'+
  '<p class="official-address">'+esc(x.address||x.area)+(x.postal?' · '+esc(x.postal):'')+'</p>'+
  '<div class="official-badges"><span>Dataset '+esc(x.sourceCoverage)+'</span>'+
  (x.distanceKm!=null?'<span>'+x.distanceKm.toFixed(1)+' km straight-line'+(x.locationPrecision==='indicative-boundary-centre'?' (approx.)':'')+'</span>':'')+
  (x.freshness==='historical-recheck'?'<span class="official-historical">Old dataset — recheck</span>':'')+
  (x.locationPrecision==='indicative-boundary-centre'?'<span>Indicative map location</span>':'')+'</div>'+
  '<div class="discover-actions"><a href="'+safe(mapURL(x))+'" target="_blank" rel="noopener noreferrer">Map / directions ↗</a>'+
  '<a href="'+safe(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Official dataset ↗</a></div></article>';
 }).join('')||'<div class="card official-empty">No matching government location records. Change your filters, or browse the curated entries above.</div>';
 $('#officialMore').hidden=all.length<=shown;
 const srcList=sources.map(x=>'<p><a href="'+safe(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(x.agency)+' · '+esc(x.code)+'</a> — '+esc(x.coverage)+' · '+esc(x.status)+(x.status==='loaded'?' · '+x.count+' entries':'')+'</p>').join('');
 $('#officialSources').innerHTML=srcList+'<p>Data is provided for discovery, not as an audit of individual businesses, opening hours or accessibility. Parks with polygon boundaries use indicative centres. STB attractions coverage dates to 2018; enable historic listings only when rechecking the location before visiting.</p>';
}
$('#officialQuery').addEventListener('input',e=>{search=e.target.value;shown=36;render()});
$('#officialKind').addEventListener('change',e=>{group=e.target.value;shown=36;render()});
$('#officialRadius').addEventListener('change',e=>{radius=e.target.value;shown=36;render()});
$('#officialHistoric').addEventListener('change',e=>{includeHistoric=e.target.checked;shown=36;render()});
$('#officialSaved').addEventListener('change',e=>{onlySaved=e.target.checked;shown=36;render()});
$('#officialMore').addEventListener('click',()=>{shown+=36;render()});
extra.addEventListener('click',e=>{
 const b=e.target.closest('[data-official-save]');if(!b)return;
 const id=b.dataset.officialSave;saved.has(id)?saved.delete(id):saved.add(id);persist();render();
});
document.addEventListener('sgbuddy:discover-tab',e=>{tab=e.detail.tab;shown=36;render()});
document.addEventListener('sgbuddy:knowledge-saved',()=>{saved=favorites();render()});
document.addEventListener('sgbuddy:persona',()=>render());
const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),24000);
fetch('/api/library',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('Status '+r.status);return r.json()}).then(data=>{
 if(!Array.isArray(data.places)||!Array.isArray(data.sources))throw new Error('Invalid library payload');
 sources=data.sources;
 // Keep editorially curated cards above as primary; don't repeat the same venues in the official extension.
 const curatedPromise=fetch('/data/discover-v120.json').then(r=>r.ok?r.json():null).catch(()=>null);
 return curatedPromise.then(seed=>{
  const primary=new Set((seed?.places||[]).map(x=>norm(x.name)));
  const seen=new Set();
  items=data.places.filter(x=>{
   if(!x.id||!x.name||!Number.isFinite(+x.lat)||!Number.isFinite(+x.lon)||!safe(x.sourceUrl))return false;
   const token=norm(x.name);
   if(primary.has(token)||seen.has(token))return false;
   seen.add(token);return true;
  });ready=true;status='ready';
  $('#officialKind').insertAdjacentHTML('beforeend',sources.filter(x=>x.status==='loaded'&&items.some(p=>p.sourceCode===x.code)).map(x=>'<option value="'+esc(x.code)+'">'+esc(x.agency)+' · '+esc(x.code.replaceAll('_',' '))+'</option>').join(''));
  render();
 });
}).catch(()=>{status='error';render()}).finally(()=>clearTimeout(deadline));
window.__SGBUDDY_CLIENT_VERSION__='1.5.0-dev';if($('#appVersion'))$('#appVersion').textContent='v1.5.0-dev';
})();
