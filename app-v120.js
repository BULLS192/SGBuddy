/* SGBuddy v1.2 — Discover and regional air-quality presentation.
   Data is a versioned, source-linked static catalog; never a live opening-hours feed. */
(function(){
  'use strict';
  const core=window.SGBUDDY_CORE;
  if(!core)return;
  const {state}=core;
  const $=selector=>document.querySelector(selector);
  const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
  const safeUrl=value=>{try{const u=new URL(String(value));return u.protocol==='https:'?u.href:''}catch{return ''}};
  const storeKey='sgbuddy-discover-saved-v1';
  let saved=new Set();
  try{const v=JSON.parse(localStorage.getItem(storeKey)||'[]');if(Array.isArray(v))saved=new Set(v.filter(x=>typeof x==='string').slice(0,500))}catch{}
  let catalog={places:[],apps:[],facts:[]};
  let tab='eat',factIndex=0,savedOnly=false,showAll=false,loaded=false,areaFilter='all';
  const addressCache=new Map();
  let officialClosures=new Map();
  const tabs=[['eat','Eat'],['do','Things to do'],['shop','Shop'],['apps','Useful apps'],['facts','Did you know?']];
  const directoryKinds={eat:'Eat',do:'Do',shop:'Shop'};
  const profiles={resident:'Resident',visitor:'Tourist',executive:'Business',student:'Student',new_in_sg:'New in SG'};
  const view=$('.v1-view[data-view="places"]');
  if(!view)return;
  const host=document.createElement('section');
  host.id='discoverHub';host.className='discover-hub';
  host.setAttribute('aria-labelledby','discoverTitle');
  host.innerHTML=[
    '<section class="card discover-intro"><div class="label">SINGAPORE DISCOVER</div>',
    '<div class="discover-title-row"><div><h2 id="discoverTitle">Explore Singapore your way</h2>',
    '<p id="discoverPersonaCopy">Recommendations tailored to your SGBuddy mode.</p></div>',
    '<span id="discoverPersonaBadge" class="sync-badge"></span></div>',
    '<div class="discover-tabs" role="tablist" aria-label="Discover categories">',
      tabs.map(([id,label])=>'<button type="button" role="tab" id="discoverTab-'+id+'" data-discover-tab="'+id+'" aria-controls="discoverResults" aria-selected="'+(id===tab?'true':'false')+'" class="'+(id===tab?'active':'')+'">'+label+'</button>').join(''),
    '</div>',
    '<div class="discover-search-row"><input id="discoverSearch" type="search" autocomplete="off" placeholder="Search places, neighbourhoods or apps" aria-label="Search Discover"/>',
    '<label class="discover-save-filter"><input id="discoverSavedOnly" type="checkbox"/> Saved only</label><select id="discoverAreaFilter" aria-label="Filter Discover by area"><option value="all">All Singapore areas</option></select></div>',
    '<p id="discoverStatus" class="discover-status" role="status">Loading curated Singapore content…</p></section>',
    '<div id="discoverResults" class="discover-results" role="tabpanel" aria-live="polite"></div>'
  ].join('');
  view.insertBefore(host,view.firstChild);
  const navLabel=$('#navPlaces span');if(navLabel)navLabel.textContent='Discover';
  const placesLabel=$('#placesSection .label');if(placesLabel)placesLabel.textContent='MORE NEARBY PLACES';
  const placesTitle=$('#placesSection h2');if(placesTitle)placesTitle.textContent='Nearby essentials';
  const dateText=iso=>{const ms=Date.parse(iso||'');return Number.isFinite(ms)?new Intl.DateTimeFormat('en-SG',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Singapore'}).format(ms)+' SGT':'Not provided'};
  function persist(){try{localStorage.setItem(storeKey,JSON.stringify([...saved].slice(0,500)))}catch{}document.dispatchEvent(new Event('sgbuddy:knowledge-saved'))}
  function mode(){return state.mode==='new_in_sg'?'resident':state.mode}
  function matchesMode(row){return (row.modes||[]).includes(mode())}
  function sourceLink(url,label){
    const href=safeUrl(url);
    return href?'<a href="'+safe(href)+'" target="_blank" rel="noopener noreferrer">'+safe(label||'Source')+' ↗</a>':'';
  }
  function newMapsLink(place){
    const q=place.name+', '+place.area+', Singapore';
    return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
  }
  function changeTab(next){
    if(!tabs.some(([id])=>id===next))return;
    tab=next;showAll=false;areaFilter='all';if($('#discoverAreaFilter'))$('#discoverAreaFilter').value='all';
    host.querySelectorAll('[data-discover-tab]').forEach(b=>{
      const active=b.dataset.discoverTab===tab;
      b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));
      b.tabIndex=active?0:-1;
    });
    $('#discoverSearch').placeholder=tab==='apps'?'Search app names and purposes':tab==='facts'?'Search Singapore facts':'Search places or neighbourhoods';
    render();
    document.dispatchEvent(new CustomEvent('sgbuddy:discover-tab',{detail:{tab}}));
  }
  function directoryAddressStatus(place){
    const value=addressCache.get(place.id);
    if(!value)return '<p class="discover-address-note">Full street address not checked in OneMap.</p>';
    if(value.status==='loading')return '<p class="discover-address-note" role="status">Checking OneMap address…</p>';
    if(value.status==='address-matched'&&value.address){
      const a=value.address;
      const dest='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a.address||place.name);
      return '<p class="discover-address-note">📍 '+safe(a.address)+' · '+safe(a.postal||'Postal unknown')+'</p><p class="discover-address-note">OneMap address/name match · Business open status not checked</p><a href="'+safe(dest)+'" target="_blank" rel="noopener noreferrer">Directions to matched address ↗</a>';
    }
    return '<p class="discover-address-note" role="status">'+(value.status==='not-configured'?'OneMap not configured':value.status==='ambiguous'?'Ambiguous address match — no verified coordinates':value.status==='not-found'?'No matching address found':'OneMap temporarily unavailable')+'. Search by name instead.</p>';
  }
  function publishedClosure(place){
    const row=officialClosures.get(place.id);if(!row)return '';
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(today<row.start||today>row.end)return '';
    return '<p class="discover-closure" role="note">⚠ NEA scheduled closure: '+safe(row.start)+' to '+safe(row.end)+' · '+safe(row.reason)+'. Check current NEA updates before visiting.</p>';
  }
  function dirCard(place){
    const marked=saved.has(place.id);
    const map=newMapsLink(place);
    return '<article class="card discover-item"><div class="discover-item-title"><div><span class="label">'+safe((place.kinds||[place.kind]).join(' / '))+' · '+safe(place.area)+'</span><h3>'+safe(place.name)+'</h3></div>'+
      '<button type="button" class="discover-fav '+(marked?'active':'')+'" data-save-discover="'+safe(place.id)+'" aria-pressed="'+String(marked)+'" aria-label="'+(marked?'Remove saved ':'Save ')+safe(place.name)+'">'+(marked?'★':'☆')+'</button></div>'+
      '<p>Curated location · Opening hours, availability and entrance fees have not been verified.</p>'+publishedClosure(place)+
      '<div class="discover-actions">'+sourceLink(map,'Search place by name')+'<button type="button" class="secondary" data-verify-address="'+safe(place.id)+'">Check OneMap address</button></div><div class="discover-address-result">'+directoryAddressStatus(place)+'</div></article>';
  }
  function appsCard(app){
    const marked=saved.has(app.id);
    const appName=encodeURIComponent(app.name);
    const ios='https://apps.apple.com/sg/search?term='+appName;
    const android='https://play.google.com/store/search?c=apps&q='+appName;
    return '<article class="card discover-item"><div class="discover-item-title"><div><span class="label">'+safe(app.category)+'</span><h3>'+safe(app.name)+'</h3></div>'+
      '<button type="button" class="discover-fav '+(marked?'active':'')+'" data-save-discover="'+safe(app.id)+'" aria-pressed="'+String(marked)+'" aria-label="'+(marked?'Remove saved ':'Save ')+safe(app.name)+'">'+(marked?'★':'☆')+'</button></div>'+
      '<p>'+(app.status==='publisher-reference'?'Official publisher reference; check account eligibility and installation requirements.':'Suggested app; publisher and store listing still require verification.')+'</p>'+
      '<div class="discover-actions">'+sourceLink(app.publisherUrl,'Publisher')+sourceLink(ios,'Search iOS')+sourceLink(android,'Search Android')+'</div></article>';
  }
  function factsCard(fact){
    const marked=saved.has(fact.id);
    return '<article class="card discover-fact"><div class="label">'+safe(fact.theme)+' · '+(fact.status==='verified'?'Official-source checked':'Editorial review pending')+'</div>'+
      '<h3>Did you know?</h3><p>'+safe(fact.text)+'</p>'+
      '<div class="discover-actions">'+sourceLink(fact.sourceUrl,'Read original source')+
      '<button type="button" class="secondary" data-next-discover-fact>Another fact ↻</button>'+
      '<button type="button" class="secondary" data-save-discover="'+safe(fact.id)+'" aria-pressed="'+String(marked)+'">'+(marked?'★ Saved':'☆ Save')+'</button></div></article>';
  }
  /* Ranking is independent of broad audience eligibility. A student listing is
     not automatically a top pick merely because it is tagged Student. */
  const cues={
    resident:{eat:/bedok|whampoa|tiong bahru|old airport|boon lay|bukit merah|bukit merah|changi village/i,do:/park|reservoir|garden|wetland|pulau ubin|southern ridges/i,shop:/northpoint|tampines|junction 8|nex|westgate|imm|jem|city square/i,apps:/singpass|lifesg|healthhub|myenv|simplygo|fairprice|oneservice/i},
    visitor:{eat:/maxwell|lau pa sat|newton|chinatown|tekka|amoy|chomp chomp/i,do:/gardens by the bay|merlion|national|sentosa|botanic|jewel|kampong|little india/i,shop:/orchard|bugis|jewel|chinatown|haji lane|mustafa/i,apps:/grab|maps|simplygo|arrival|klook|trip.com|myenv/i},
    executive:{eat:/amoy|lau pa sat|maxwell|hong lim|chinatown|zion|golden mile/i,do:/national gallery|artscience|esplanade|marina bay|gardens by the bay/i,shop:/orchard|marina|suntec|jewel|plaza singapura/i,apps:/grab|gojek|zig|maps|wise|revolut|sgworkpass/i},
    student:{eat:/old airport|bedok|tekka|adam road|whampoa|boon lay|tiong bahru|pek kio/i,do:/science centre|national museum|fort canning|east coast park|botanic|reservoir|haw par|haw par/i,shop:/mustafa|bugis|imm|carousell|city square|jem|westgate/i,apps:/simplygo|nlb|activesg|carousell|maps|citymapper|wireless|fairprice/i}
  };
  function audienceScore(row){
    const current=state.mode==='new_in_sg'?'resident':mode();
    const key=tab==='apps'?'apps':tab;
    const matcher=cues[current]?.[key];
    const text=[row.name,row.area,row.category].join(' ');
    return (matchesMode(row)?100:0)+(matcher?.test(text)?24:0);
  }
  function orderedRows(rows){
    const q=($('#discoverSearch')?.value||'').toLowerCase().trim();
    return rows.filter(r=>(!savedOnly||saved.has(r.id))&&(areaFilter==='all'||r.area===areaFilter)&&(!q||[r.name,r.area,r.kind,r.category,r.theme,r.text].join(' ').toLowerCase().includes(q)))
      .sort((a,b)=>audienceScore(b)-audienceScore(a)||(a.name||a.text||'').localeCompare(b.name||b.text||''));
  }
  function render(){
    if(!loaded)return;
    const results=$('#discoverResults'),q=($('#discoverSearch')?.value||'').trim().toLowerCase();
    const persona=profiles[state.mode]||'Resident';
    $('#discoverPersonaBadge').textContent=persona+' mode';
    $('#discoverPersonaCopy').textContent=state.mode==='student'
      ?'Budget-conscious food, study-friendly activities, shopping and practical apps.'
      :state.mode==='visitor'?'Singapore highlights, neighbourhood culture and useful visitor tools.'
      :state.mode==='executive'?'Practical stops, dining, shopping and tools for a working day.'
      :state.mode==='new_in_sg'?'Start with everyday essentials and explore your new neighbourhood.'
      :'Neighbourhood favourites, everyday conveniences and Singapore discoveries.';
    if(tab==='facts'){
      const candidates=catalog.facts.filter(f=>(!savedOnly||saved.has(f.id))&&(!q||[f.theme,f.text].join(' ').toLowerCase().includes(q))&&matchesMode(f));
      if(factIndex>=candidates.length)factIndex=0;
      $('#discoverStatus').textContent=candidates.filter(f=>f.status==='verified').length+' source-checked · '+candidates.filter(f=>f.status!=='verified').length+' review pending · independently reviewed target: 10,000';
      results.innerHTML=candidates.length?factsCard(candidates[factIndex]):'<div class="card discover-empty">No matching source-reviewed facts yet. Try clearing the search or Saved only.</div>';
      return;
    }
    const rows=orderedRows(tab==='apps'?catalog.apps:catalog.places.filter(p=>(p.kinds||[p.kind]).includes(directoryKinds[tab])));
    $('#discoverStatus').textContent=rows.length+' curated '+(tab==='apps'?'app':'place')+' entries · '+rows.filter(matchesMode).length+' matches for '+persona+' · Listing details require verification';
    const visible=showAll?rows:rows.slice(0,24);
    results.innerHTML='<div class="discover-grid">'+visible.map(tab==='apps'?appsCard:dirCard).join('')+'</div>'+
      (!rows.length?'<div class="card discover-empty">No matches. Change your search or Saved only filter.</div>':'')+
      (!showAll&&rows.length>visible.length?'<button class="secondary discover-more" type="button" id="discoverMore">Show all '+rows.length+'</button>':'');
  }
  host.addEventListener('click',event=>{
    const addressButton=event.target.closest('[data-verify-address]');
    if(addressButton){
      const id=addressButton.dataset.verifyAddress,place=catalog.places.find(p=>p.id===id);
      if(!place)return;
      addressCache.set(id,{status:'loading'});addressButton.disabled=true;
      const result=addressButton.closest('.discover-item')?.querySelector('.discover-address-result');
      if(result)result.innerHTML=directoryAddressStatus(place);
      fetch('/api/journey?action=discover-address&id='+encodeURIComponent(id),{cache:'no-store'})
        .then(r=>r.ok?r.json():Promise.reject(Error('lookup failed')))
        .then(payload=>{addressCache.set(id,payload);if(result?.isConnected)result.innerHTML=directoryAddressStatus(place)})
        .catch(()=>{addressCache.set(id,{status:'provider-unavailable'});if(result?.isConnected)result.innerHTML=directoryAddressStatus(place)})
        .finally(()=>{if(addressButton.isConnected)addressButton.disabled=false});
      return;
    }
    const switcher=event.target.closest('[data-discover-tab]');
    if(switcher){changeTab(switcher.dataset.discoverTab);return}
    const saver=event.target.closest('[data-save-discover]');
    if(saver){const id=saver.dataset.saveDiscover;saved.has(id)?saved.delete(id):saved.add(id);persist();render();return}
    if(event.target.closest('[data-next-discover-fact]')){factIndex++;render();return}
    if(event.target.closest('#discoverMore')){showAll=true;render();}
  });
  $('#discoverSearch').addEventListener('input',()=>{factIndex=0;showAll=false;render()});
  $('#discoverSavedOnly').addEventListener('change',e=>{savedOnly=e.target.checked;showAll=false;factIndex=0;render()});
  $('#discoverAreaFilter').addEventListener('change',e=>{areaFilter=e.target.value;showAll=false;render()});
  document.addEventListener('sgbuddy:knowledge-saved',()=>{
    try{const rows=JSON.parse(localStorage.getItem(storeKey)||'[]');if(Array.isArray(rows))saved=new Set(rows.filter(x=>typeof x==='string'))}catch{}
    render();
  });
  host.addEventListener('keydown',event=>{
    const el=event.target.closest('[data-discover-tab]');if(!el||!['ArrowRight','ArrowLeft'].includes(event.key))return;
    event.preventDefault();const i=tabs.findIndex(([id])=>id===el.dataset.discoverTab);
    const next=tabs[(i+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length][0];
    changeTab(next);$('#discoverTab-'+next).focus();
  });
  document.addEventListener('sgbuddy:persona',render);
  function category(psi){
    return psi<=50?'Good':psi<=100?'Moderate':psi<=200?'Unhealthy':psi<=300?'Very unhealthy':'Hazardous';
  }
  function airValue(raw){const n=Number(raw);return Number.isFinite(n)&&raw!==null&&raw!==undefined?Math.round(n):null}
  function drawAirQuality(){
    const regionHost=$('#v120AirPanel');if(!regionHost)return;
    const air=state.weather?.airQuality||{},psi=air.psi24h,pm=air.pm25OneHour;
    const regions=['north','south','east','west','central'],psiRegions=psi?.regions||{},pmRegions=pm?.regions||{};
    // The weather endpoint aggregates NINE datasets. Its global 'partial' status
    // must not be presented as an air-quality failure when PSI and PM2.5 are fine.
    const weather=state.weather||{},quality=weather.dataQuality||{};
    const fallbackSignals=Array.isArray(quality.staleSignals)?quality.staleSignals:[];
    const offline=weather.source==='device-cache'||fallbackSignals.includes('offline device cache');
    const psiCached=fallbackSignals.includes('psi'),pmCached=fallbackSignals.includes('pm25');
    const readings=[['PSI',psi,120],['PM2.5',pm,90]].filter(([,item])=>Boolean(item));
    const sourceAges=readings.map(([name,item,maxMins])=>{
      const stamp=item.updatedAt?Date.parse(item.updatedAt):NaN;
      const age=Number.isFinite(stamp)?(Date.now()-stamp)/60000:null;
      return {name,age,maxMins,updatedAt:item.updatedAt||null};
    });
    const delayed=sourceAges.some(x=>x.age!==null&&(x.age>x.maxMins||x.age< -15));
    const timestampUnknown=sourceAges.some(x=>x.age===null);
    const cached=offline||psiCached||pmCached;
    const missing=!psi||!pm;
    const badge=$('#v120AirStatus');
    badge.textContent=!psi&&!pm?'Air readings unavailable'
      :offline?'Saved offline readings'
      :missing?'Partial air-quality data'
      :cached?'Cached NEA air readings'
      :delayed?'Delayed NEA readings'
      :timestampUnknown?'NEA time unconfirmed'
      :'Official NEA readings';
    badge.className='sync-badge'+(offline||missing||cached||delayed||timestampUnknown?' v120-stale':'');
    const statusNotes=[];
    if(!psi)statusNotes.push('24h PSI unavailable');
    if(!pm)statusNotes.push('1h PM2.5 unavailable');
    if(cached)statusNotes.push('cached air readings — not confirmed live');
    if(delayed)statusNotes.push('source timestamp outside expected refresh window');
    if(timestampUnknown)statusNotes.push('source timestamp unavailable');
    $('#v120AirUpdated').textContent=sourceAges.length
      ?sourceAges.map(x=>x.name+': '+dateText(x.updatedAt)).join(' · ')+(statusNotes.length?' · '+statusNotes.join('; '):'')
      :'PSI / PM2.5 source timestamps unavailable';
    const regionSelected=String(air.region||'').toLowerCase();
    regionHost.innerHTML=regions.map(region=>{
      const p=airValue(psiRegions[region]),m=airValue(pmRegions[region]);
      return '<div class="v120-region '+(regionSelected===region?'selected':'')+'"><strong>'+safe(region[0].toUpperCase()+region.slice(1))+'</strong>'+
        '<span>PSI '+(p===null?'—':p)+'</span><small>PM2.5 '+(m===null?'—':m+' µg/m³')+'</small></div>';
    }).join('');
    const overall=airValue(psi?.overall);
    $('#v120AirAdvisory').textContent=!psi&&!pm?'Air-quality data could not be retrieved. Refer to NEA before planning outdoor activity.':
      overall!==null&&overall>100?'24h PSI is '+category(overall)+'. Consult NEA advice and consider adjusting prolonged outdoor plans.':
      '24-hour PSI and 1-hour PM2.5 are different measures; check official NEA advisories when planning outdoor activities.';
  }
  const environment=$('#environmentCard');
  if(environment){
    const panel=document.createElement('div');panel.className='v120-air card';panel.id='v120AirExtended';
    panel.innerHTML='<div class="v120-air-title"><div><div class="label">SINGAPORE AIR QUALITY</div><h3>PSI and PM2.5 by region</h3></div><span class="sync-badge" id="v120AirStatus">Loading</span></div>'+
      '<p>Official NEA regional readings. PSI is a 24-hour index; 1-hour PM2.5 is a concentration, not an hourly PSI.</p>'+
      '<div class="v120-air-regions" id="v120AirPanel" aria-label="Regional air quality"></div>'+
      '<p class="v120-air-advisory" id="v120AirAdvisory" role="status">Checking current readings…</p>'+
      '<div class="discover-actions"><small id="v120AirUpdated">Checking timestamps…</small>'+
      sourceLink('https://www.nea.gov.sg/our-services/pollution-control/air-pollution','NEA guidance')+'</div>';
    environment.insertAdjacentElement('afterend',panel);
    document.addEventListener('sgbuddy:weather',drawAirQuality);
    drawAirQuality();
  }
  Promise.all([
    fetch('/data/discover-v120.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Catalog response '+r.status);return r.json()}),
    fetch('/data/facts-published.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch('/data/nea-closures-v180.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)
  ]).then(([data,published,closureFeed])=>{
    officialClosures=new Map((Array.isArray(closureFeed?.closures)?closureFeed.closures:[]).map(x=>[x.centreId,x]));
    for(const field of ['places','apps','facts'])if(!Array.isArray(data[field]))throw new Error('Invalid '+field+' catalog');
    const checked=Array.isArray(published?.facts)?published.facts.filter(f=>f.status==='verified'):[];
    const ids=new Set(checked.map(f=>f.id));
    catalog={...data,facts:[...checked,...data.facts.filter(f=>!ids.has(f.id))]};
    const areas=[...new Set(data.places.map(p=>p.area).filter(Boolean))].sort();
    $('#discoverAreaFilter').insertAdjacentHTML('beforeend',areas.map(a=>'<option value="'+safe(a)+'">'+safe(a)+'</option>').join(''));
    loaded=true;render();
    document.dispatchEvent(new CustomEvent('sgbuddy:discover-facts-ready',{detail:{verified:checked.length,total:catalog.facts.length}}));
  }).catch(()=>{$('#discoverStatus').textContent='Discover catalog unavailable. Retry when online.';$('#discoverResults').innerHTML='<div class="card discover-empty">Could not load the curated directory. Existing places and routes remain available below.</div>'});
  window.__SGBUDDY_CLIENT_VERSION__='1.2.0-dev';
  if($('#appVersion'))$('#appVersion').textContent='v1.2.0-dev';
})();
