const core=window.SGBUDDY_CORE;
if(core){
  const {state,$,$$,toast,json,navigateTo,setActiveNav}=core;
  const VERSION='1.1.0-dev';
  window.__SGBUDDY_CLIENT_VERSION__=VERSION;
  if($('#appVersion'))$('#appVersion').textContent='v'+VERSION;

  $$('.bottom-nav [data-nav-target]').forEach(button=>{
    button.addEventListener('click',()=>{
      const name=button.dataset.navTarget;
      setActiveNav(name);
      requestAnimationFrame(()=>setActiveNav(name));
    },true);
  });

  const PERSONA_COPY={
    resident:{title:'Everyday Singapore',copy:'Food, groceries, healthcare, parks, community, libraries and neighbourhood hubs — tourist attractions only when they are genuinely useful.',chips:[['All','all'],['Supermarkets','supermarket'],['Hawker','hawker'],['Healthcare','health'],['Parks','park'],['Community','community'],['Libraries','library'],['Childcare','childcare'],['Town hubs','town']]},
    visitor:{title:'Singapore worth your time',copy:'Iconic attractions, heritage, hawker food, parks and useful visitor anchors ranked for a limited stay.',chips:[['All','all'],['Attractions','attraction'],['Hawker','hawker'],['Parks','park'],['Neighbourhoods','neighbourhood'],['Business / Marina','business']]},
    executive:{title:'Singapore for a working day',copy:'Business districts, convention/airport access, efficient food, healthcare and meeting-friendly hubs before sightseeing.',chips:[['All','all'],['Business','business'],['Hawker','hawker'],['Healthcare','health'],['Town hubs','town'],['Attractions','attraction']]},
    new_in_sg:{title:'Settle into Singapore',copy:'Groceries, clinics, community clubs, hawkers, parks, libraries, childcare and town centres ranked ahead of tourist stops.',chips:[['All','all'],['Supermarkets','supermarket'],['Healthcare','health'],['Community','community'],['Hawker','hawker'],['Parks','park'],['Libraries','library'],['Childcare','childcare'],['Town hubs','town']]},
  };
  state.v110Places=[];state.v110PlaceFilter='all';state.v110PlaceSort='best';state.v110PlacesMap=null;

  function persona(){return PERSONA_COPY[state.mode]||PERSONA_COPY.resident}
  function distance(m){if(m==null||!Number.isFinite(Number(m)))return '';return m<1000?Math.round(m)+' m':(m/1000).toFixed(1)+' km'}
  function escText(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML}
  function categoryMatch(row,filter){
    if(filter==='all')return true;
    const hay=(row.kind+' '+row.category).toLowerCase();
    if(filter==='attraction')return row.kind==='attraction';
    if(filter==='business')return /business|convention|office/.test(hay);
    if(filter==='town')return /town centre|neighbourhood hub/.test(hay);
    if(filter==='health')return row.kind==='health'||/clinic|health/.test(hay);
    return hay.includes(filter);
  }
  function placeSource(row){return row.metadata?.official?'Official Singapore dataset':'SGBuddy curated'}
  function visiblePlaces(){
    const rows=state.v110Places.filter(r=>categoryMatch(r,state.v110PlaceFilter));
    if(state.v110PlaceSort==='nearest'&&Number.isFinite(state.lat)&&Number.isFinite(state.lon))return [...rows].sort((a,b)=>(a.distanceM??Infinity)-(b.distanceM??Infinity));
    return rows;
  }
  function renderChips(){
    let host=$('#v110PlaceFilters');
    if(!host){
      host=document.createElement('div');host.id='v110PlaceFilters';host.className='v110-place-filters';
      $('#placesGrid')?.insertAdjacentElement('beforebegin',host);
    }
    host.innerHTML=persona().chips.map(([label,key])=>'<button type="button" data-place-filter="'+key+'" class="'+(state.v110PlaceFilter===key?'active':'')+'">'+label+'</button>').join('')+
      '<select id="v110PlaceSort" aria-label="Sort places"><option value="best">Best for me</option><option value="nearest">Nearest first</option></select>';
    $('#v110PlaceSort').value=state.v110PlaceSort;
  }
  function renderPlaces(){
    const grid=$('#placesGrid');if(!grid)return;
    const rows=visiblePlaces(),p=persona();
    const title=$('#placesSection h2');if(title)title.textContent=p.title;
    if($('#placesPersonaHint'))$('#placesPersonaHint').textContent=p.copy+' · '+state.v110Places.length+' matches loaded';
    renderChips();
    grid.innerHTML=rows.slice(0,80).map((row,i)=>{
      const score=Math.max(0,Math.min(100,Number(row.personaScore)||0));
      const address=[row.address,row.postalCode?'Singapore '+row.postalCode:''].filter(Boolean).join(' · ');
      return '<article class="place-card card v110-place-card">'+
        '<div class="place-card-top"><div><span class="place-rank">'+String(i+1).padStart(2,'0')+'</span><div class="label">'+escText(String(row.category||'Place').toUpperCase())+'</div><h3>'+escText(row.name)+'</h3></div><span class="place-fit">'+score+'% fit</span></div>'+
        (address?'<div class="v110-place-address">'+escText(address)+'</div>':'')+
        '<p>'+escText(row.description||'Singapore place')+'</p>'+
        '<div class="place-intel"><span>'+escText(placeSource(row))+'</span>'+(row.distanceM!=null?'<span>◎ '+distance(row.distanceM)+'</span>':'')+'</div>'+
        '<div class="place-card-actions"><button class="secondary v110-compare-place" data-place-name="'+escText(row.name)+'" type="button">Compare ways</button><button class="primary place-route" data-featured-place="'+escText(row.name)+'" type="button">Take me there</button></div>'+
      '</article>';
    }).join('')||'<div class="card empty">No places match this category/search yet.</div>';
    if(!$('#placesMapCard')?.classList.contains('hidden'))renderMap();
  }
  async function loadPlaces(){
    const q=$('#placeSearch')?.value.trim()||'';
    const params=new URLSearchParams({action:'places',persona:state.mode,limit:'120'});
    if(q)params.set('q',q);
    if(Number.isFinite(state.lat)&&Number.isFinite(state.lon)){params.set('lat',String(state.lat));params.set('lon',String(state.lon))}
    const grid=$('#placesGrid');if(grid)grid.innerHTML='<div class="card empty">Ranking Singapore places for you…</div>';
    try{
      const payload=await json('/api/journey?'+params.toString());
      state.v110Places=payload.items||[];
      state.v110PlaceFilter='all';
      renderPlaces();
    }catch(error){if(grid)grid.innerHTML='<div class="card empty">Place Index unavailable: '+escText(error.message)+'</div>'}
  }

  const oldSearch=$('#placeSearch');
  if(oldSearch){
    const fresh=oldSearch.cloneNode(true);oldSearch.replaceWith(fresh);
    let timer;fresh.placeholder='Search Singapore — supermarket, clinic, hawker, park, district…';
    fresh.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(loadPlaces,220)});
  }
  const toolbarNote=$('.places-toolbar > span');if(toolbarNote)toolbarNote.textContent='Search across the SGBuddy Place Index. Rankings change with your user mode; use Locate for nearest-first sorting.';

  document.addEventListener('click',e=>{
    const f=e.target.closest('[data-place-filter]');if(f){state.v110PlaceFilter=f.dataset.placeFilter;renderPlaces();return}
    const c=e.target.closest('.v110-compare-place');if(c){
      const dest=c.dataset.placeName;
      navigateTo('move');
      setTimeout(()=>{const input=$('#v110CompareDestination');if(input){input.value=dest;compareWays()}},80);
      return;
    }
  });
  document.addEventListener('change',e=>{if(e.target?.id==='v110PlaceSort'){state.v110PlaceSort=e.target.value;renderPlaces()}});
  document.addEventListener('sgbuddy:persona',()=>loadPlaces());

  function ensureMap(){
    const host=$('#placesMap');if(!host||!window.L)return false;
    if(state.v110PlacesMap)return true;
    state.v110PlacesMap=L.map('placesMap',{zoomControl:true,attributionControl:true}).setView([1.3521,103.8198],11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(state.v110PlacesMap);
    state.v110PlacesLayer=L.layerGroup().addTo(state.v110PlacesMap);return true;
  }
  function renderMap(){
    if(!ensureMap())return;
    state.v110PlacesLayer.clearLayers();const coords=[];
    for(const row of visiblePlaces().slice(0,80)){
      if(!Number.isFinite(row.lat)||!Number.isFinite(row.lon))continue;
      L.circleMarker([row.lat,row.lon],{radius:7,color:'#07111f',weight:2,fillColor:'#63e6be',fillOpacity:1})
        .bindPopup('<div class="map-popup"><strong>'+escText(row.name)+'</strong><small>'+escText(row.category)+' · '+row.personaScore+'% fit</small><button class="place-route" data-featured-place="'+escText(row.name)+'">Take me there</button></div>')
        .addTo(state.v110PlacesLayer);coords.push([row.lat,row.lon]);
    }
    if(Number.isFinite(state.lat)&&Number.isFinite(state.lon)){L.circleMarker([state.lat,state.lon],{radius:7,color:'#fff',weight:3,fillColor:'#ff7b8a',fillOpacity:1}).bindPopup('<strong>You are here</strong>').addTo(state.v110PlacesLayer);coords.unshift([state.lat,state.lon])}
    setTimeout(()=>{state.v110PlacesMap.invalidateSize();if(coords.length>1)state.v110PlacesMap.fitBounds(coords,{padding:[24,24],maxZoom:14})},40);
  }
  for(const id of ['placesCardsButton','placesMapButton']){
    const old=$('#'+id);if(old){const fresh=old.cloneNode(true);old.replaceWith(fresh)}
  }
  $('#placesCardsButton')?.addEventListener('click',()=>{$('#placesGrid')?.classList.remove('hidden');$('#placesMapCard')?.classList.add('hidden');$('#placesCardsButton')?.classList.add('active');$('#placesMapButton')?.classList.remove('active')});
  $('#placesMapButton')?.addEventListener('click',()=>{$('#placesGrid')?.classList.add('hidden');$('#placesMapCard')?.classList.remove('hidden');$('#placesCardsButton')?.classList.remove('active');$('#placesMapButton')?.classList.add('active');renderMap()});
  $('#fitPlacesMap')?.addEventListener('click',renderMap,true);

  const compare=document.createElement('section');compare.id='v110CompareCard';compare.className='compare-card card';
  compare.innerHTML='<div class="compare-head"><div><div class="label">COMPARE WAYS TO GO</div><h3>Public transport vs road</h3></div><span class="reference-badge">Planning</span></div>'+
    '<p>Compare SGBuddy public transport with a driving and taxi/rideshare estimate. Road options are clearly marked when OneMap routing is not configured.</p>'+
    '<div class="compare-input-row"><input id="v110CompareDestination" autocomplete="off" placeholder="Where are you going?"/><button id="v110CompareButton" class="primary" type="button">Compare</button></div>'+
    '<div id="v110CompareResults" class="compare-results"><div class="empty-inline">Use Locate, enter a destination, then compare all three modes.</div></div>';
  $('#travelSection')?.insertAdjacentElement('beforebegin',compare);

  function modeCard(label,badge,time,meta,note,fast){
    return '<article class="compare-mode '+(fast?'fastest':'')+'"><div class="compare-mode-head"><div><span>'+badge+'</span><strong>'+label+'</strong></div>'+(fast?'<b>Fastest estimate</b>':'')+'</div><div class="compare-time">'+time+'</div><div class="compare-meta">'+meta+'</div><small>'+note+'</small></article>';
  }
  async function compareWays(){
    const input=$('#v110CompareDestination'),dest=input?.value.trim();if(!dest)return toast('Add a destination first.');
    if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon)){toast('Use Locate first so SGBuddy can compare from where you are.');return}
    const button=$('#v110CompareButton'),host=$('#v110CompareResults');button.disabled=true;button.textContent='Comparing…';host.innerHTML='<div class="empty-inline">Comparing public transport and road options…</div>';
    try{
      const p=await json('/api/journey?action=compare&lat='+encodeURIComponent(state.lat)+'&lon='+encodeURIComponent(state.lon)+'&to='+encodeURIComponent(dest));
      const cards=[];
      if(p.publicTransport){const x=p.publicTransport;cards.push(modeCard('Public transport','▰',x.minutes+' min',(x.title||'Route')+' · '+x.walkMinutes+' min walk · '+x.transfers+' transfer'+(x.transfers===1?'':'s'),x.note,p.fastestEstimate==='public'))}
      if(p.drive){const x=p.drive;cards.push(modeCard('Drive','🚗',x.minutes+' min',(x.routed?'Road-routed':'Estimated')+' · '+(x.distanceM?distance(x.distanceM):'distance unavailable')+' · includes '+x.parkingAllowanceMinutes+' min parking/walk',x.note,p.fastestEstimate==='drive'))}
      if(p.rideshare){const x=p.rideshare;cards.push(modeCard('Taxi / rideshare','↗',x.minutesLow+'–'+x.minutesHigh+' min',(x.routed?'Road-routed':'Estimated')+' · includes '+x.pickupLowMinutes+'–'+x.pickupHighMinutes+' min pickup',x.note,p.fastestEstimate==='rideshare'))}
      host.innerHTML=cards.join('')+'<div class="compare-disclaimer">'+escText(p.disclaimer||'')+'</div><button id="v110OpenTransitRoute" class="secondary full" type="button">Open detailed public-transport route</button>';
      $('#v110OpenTransitRoute')?.addEventListener('click',()=>{if($('#tripTo'))$('#tripTo').value=dest;$('#planTrip')?.click();$('#travelSection')?.scrollIntoView({behavior:'smooth',block:'start'})});
    }catch(error){host.innerHTML='<div class="empty-inline error-state">'+escText(error.message)+'</div>'}
    finally{button.disabled=false;button.textContent='Compare'}
  }
  $('#v110CompareButton')?.addEventListener('click',compareWays);
  $('#v110CompareDestination')?.addEventListener('keydown',e=>{if(e.key==='Enter')compareWays()});

  $$('.bottom-nav [data-nav-target="places"]').forEach(b=>b.addEventListener('click',()=>setTimeout(loadPlaces,20),true));
  loadPlaces();
}