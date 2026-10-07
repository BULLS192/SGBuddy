const core=window.SGBUDDY_CORE;
if(core){
  const {state,$,toast,json,navigateTo,setActiveNav}=core;
  const qsa=selector=>[...document.querySelectorAll(selector)];
  const VERSION='1.1.0-dev';
  window.__SGBUDDY_CLIENT_VERSION__=VERSION;
  if($('#appVersion'))$('#appVersion').textContent='v'+VERSION;

  qsa('.bottom-nav [data-nav-target]').forEach(button=>{
    button.addEventListener('click',()=>{
      const name=button.dataset.navTarget;
      setActiveNav(name);
      requestAnimationFrame(()=>setActiveNav(name));
    },true);
  });

  const PERSONA_COPY={
    resident:{title:'Everyday Singapore',copy:'Food, groceries, healthcare, parks, community, libraries and neighbourhood hubs — tourist attractions only when they are genuinely useful.',chips:[['All','all'],['Hawker','hawker'],['Pharmacies','pharmacy'],['Healthcare','health'],['Parks','park'],['Markets','market'],['Sports','sport'],['Community','community'],['Libraries','library'],['Childcare','childcare'],['Town hubs','town']]},
    visitor:{title:'Singapore worth your time',copy:'Iconic attractions, heritage, hawker food, parks and useful visitor anchors ranked for a limited stay.',chips:[['All','all'],['Attractions','attraction'],['Hawker','hawker'],['Markets','market'],['Parks','park'],['Neighbourhoods','neighbourhood'],['Business / Marina','business']]},
    executive:{title:'Singapore for a working day',copy:'Business districts, convention/airport access, efficient food, healthcare and meeting-friendly hubs before sightseeing.',chips:[['All','all'],['Business','business'],['Hawker','hawker'],['Healthcare','health'],['Town hubs','town'],['Attractions','attraction']]},
    new_in_sg:{title:'Settle into Singapore',copy:'Groceries, clinics, community clubs, hawkers, parks, libraries, childcare and town centres ranked ahead of tourist stops.',chips:[['All','all'],['Healthcare','health'],['Pharmacies','pharmacy'],['Community','community'],['Hawker','hawker'],['Markets','market'],['Sports','sport'],['Parks','park'],['Libraries','library'],['Childcare','childcare'],['Town hubs','town']]},
  };
  state.v110Places=[];state.v110PlaceFilter='all';state.v110PlaceSort='best';state.v110PlacesMap=null;state.v110VisibleCount=24;state.v110EtaCache=new Map();state.v110PlaceRequestId=0;state.v110LoadedPersona='';state.v110FilterScrollLeft=0;

  function persona(){return PERSONA_COPY[state.mode]||PERSONA_COPY.resident}
  function distance(m){const n=Number(m);if(!Number.isFinite(n))return '';if(state.units==='imperial'){const mi=n/1609.344;return mi<0.2?Math.round(n*3.28084)+' ft':mi.toFixed(1)+' mi'}return n<1000?Math.round(n)+' m':(n/1000).toFixed(1)+' km'}
  const CLEAN_PLACE_COPY={moh_chas_geo:'MOH-listed CHAS clinic.',moh_polyclinics_geo:'MOH-listed polyclinic.',hsa_pharmacies_geo:'HSA-licensed retail pharmacy.',ecda_childcare_geo:'ECDA-licensed childcare centre.',nparks_parks_geo:'NParks-managed park.',nea_hawker_geo:'NEA-listed hawker centre.',nea_market_food_geo:'NEA-listed market / food centre.',pa_community_clubs_geo:"People's Association community club.",sport_sg_facilities_geo:'SportSG-managed sports facility.',nlb_libraries_geo:'NLB public library.'};
  function placeDescription(row){if(CLEAN_PLACE_COPY[row?.sourceKey])return CLEAN_PLACE_COPY[row.sourceKey];const raw=String(row?.description||'').replace(/\s+/g,' ').trim();if(!raw)return String(row?.category||'Singapore place');if(/(?:^|\s)(attributes?|hci_code|hci_name|licence_type|postal_addr|addr_type|blk_hse_no|floor_no|unit_no)\b/i.test(raw))return String(row?.category||'Singapore place');return raw}
  function estimatedWalk(distanceM){const n=Number(distanceM);if(!Number.isFinite(n))return null;const routeM=Math.max(1,Math.round(n*1.18));return {minutes:Math.max(1,Math.ceil(routeM/80)),distanceM:routeM,routed:false,source:'Straight-line walking estimate'}}
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
  const SOURCE_LABELS={nea_hawker_geo:'NEA',nea_market_food_geo:'NEA',nparks_parks_geo:'NParks',nlb_libraries_geo:'NLB',pa_community_clubs_geo:"People's Association",moh_chas_geo:'MOH',moh_polyclinics_geo:'MOH',hsa_pharmacies_geo:'HSA',ecda_childcare_geo:'ECDA',sport_sg_facilities_geo:'SportSG'};
  function placeSource(row){return row.metadata?.official?(SOURCE_LABELS[row.sourceKey]||'Singapore government')+' · official data':'SGBuddy curated'}
  function fitLabel(score){return score>=90?'Top fit':score>=75?'Strong fit':score>=55?'Useful':'Explore'}
  function modeLabel(mode){return mode==='rail'?'MRT/LRT':mode==='bus'?'bus':mode==='mixed'?'bus + rail':'public transport'}
  function visiblePlaces(){
    const rows=state.v110Places.filter(r=>categoryMatch(r,state.v110PlaceFilter));
    if(state.v110PlaceSort==='nearest'&&Number.isFinite(state.lat)&&Number.isFinite(state.lon))return [...rows].sort((a,b)=>(a.distanceM??Infinity)-(b.distanceM??Infinity));
    return rows;
  }
  function renderChips(){
    let host=$('#v110PlaceFilters');
    if(!host){
      host=document.createElement('div');host.id='v110PlaceFilters';host.className='v110-place-filter-shell';
      $('#placesGrid')?.insertAdjacentElement('beforebegin',host);
    }
    const previous=$('#v110PlaceFilterRail');
    if(previous)state.v110FilterScrollLeft=previous.scrollLeft;
    host.innerHTML='<button type="button" class="v110-filter-arrow" data-filter-scroll="-1" aria-label="Scroll categories left">‹</button>'+
      '<div id="v110PlaceFilterRail" class="v110-place-filters">'+persona().chips.map(([label,key])=>'<button type="button" data-place-filter="'+key+'" class="'+(state.v110PlaceFilter===key?'active':'')+'">'+label+'</button>').join('')+'</div>'+
      '<button type="button" class="v110-filter-arrow" data-filter-scroll="1" aria-label="Scroll categories right">›</button>'+
      '<select id="v110PlaceSort" aria-label="Sort places"><option value="best">Best for me</option><option value="nearest">Nearest first</option></select>';
    const rail=$('#v110PlaceFilterRail');
    if(rail){
      rail.scrollLeft=state.v110FilterScrollLeft||0;
      rail.addEventListener('scroll',()=>{state.v110FilterScrollLeft=rail.scrollLeft},{passive:true});
      rail.addEventListener('wheel',e=>{
        if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){rail.scrollLeft+=e.deltaY;e.preventDefault()}
      },{passive:false});
    }
    $('#v110PlaceSort').value=state.v110PlaceSort;
  }
  function mobilityChip(icon,label,time,best,title){
    if(time==null)return '';
    return '<span class="v110-mode-chip '+(best?'best':'')+'" title="'+escText(title||label)+'"><b>'+icon+'</b><span>'+escText(label)+'</span><strong>'+escText(time)+'</strong></span>';
  }
  function renderMobility(el,row,item){
    if(!el)return;
    if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon)){el.innerHTML='<span class="v110-mobility-locate">◎ Locate to compare travel modes</span>';return}
    const fallbackWalk=estimatedWalk(row?.distanceM);
    const walk=item?.walking||fallbackWalk,pt=item?.publicTransport||null,drive=item?.drive||null,ride=item?.rideshare||null;
    const fastest=item?.fastestEstimate||(walk&&(!pt||walk.minutes<=pt.minutes)?'walk':pt?'public':null);
    const chips=[
      walk&&mobilityChip('🚶','Walk',walk.minutes+' min',fastest==='walk',(walk.routed?'Walking route':'Estimated walking route')+' · '+distance(walk.distanceM)),
      pt&&mobilityChip(pt.routeMode==='rail'?'🚆':pt.routeMode==='mixed'?'🚉':'🚌','Transit',pt.minutes+' min',fastest==='public',pt.title||'Public transport'),
      drive&&mobilityChip('🚗','Drive',(drive.routed?'':'~')+drive.minutes+' min',fastest==='drive',(drive.routed?'Road route':'Estimated road time')+' · '+distance(drive.distanceM)),
      ride&&mobilityChip('🚕','Ride',(ride.routed?'':'~')+ride.minutesLow+'–'+ride.minutesHigh+' min',fastest==='rideshare','Taxi / rideshare including pickup allowance')
    ].filter(Boolean);
    el.innerHTML=chips.join('')||'<span class="v110-mobility-locate">Travel comparison unavailable</span>';
  }
  async function loadPlaceEtas(rows){
    const elements=[...document.querySelectorAll('[data-v110-modes-name]')],rowMap=new Map(rows.map(row=>[row.name,row]));
    if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon)){elements.forEach(el=>renderMobility(el,rowMap.get(el.dataset.v110ModesName),null));return}
    const candidates=rows.filter(row=>row?.name).slice(0,20);
    const keyPrefix=Number(state.lat).toFixed(3)+','+Number(state.lon).toFixed(3)+':';
    const missing=candidates.filter(row=>!state.v110EtaCache.has(keyPrefix+row.name));
    if(missing.length){try{const p=await json('/api/journey?action=place-etas&lat='+encodeURIComponent(state.lat)+'&lon='+encodeURIComponent(state.lon)+'&names='+encodeURIComponent(missing.map(x=>x.name).join('|')));for(const item of p.items||[])state.v110EtaCache.set(keyPrefix+item.name,item)}catch{}}
    for(const el of elements){const row=rowMap.get(el.dataset.v110ModesName),item=state.v110EtaCache.get(keyPrefix+el.dataset.v110ModesName);renderMobility(el,row,item)}
  }
  function renderPlaces(){
    const grid=$('#placesGrid');if(!grid)return;
    if(state.v110LoadedPersona&&state.v110LoadedPersona!==state.mode){loadPlaces({resetFilter:true});return}
    const rows=visiblePlaces(),p=persona(),shown=rows.slice(0,state.v110VisibleCount);
    const title=$('#placesSection h2');if(title)title.textContent=p.title;
    if($('#placesPersonaHint'))$('#placesPersonaHint').textContent='Showing '+p.label+' ranking · '+p.copy+' · '+state.v110Places.length+' ranked matches';
    const hotel=$('#placesBackHotel');if(hotel)hotel.classList.toggle('hidden',!((state.mode==='visitor'||state.mode==='executive')&&state.places.hotel));
    renderChips();
    const cards=shown.map((row,i)=>{
      const score=Math.max(0,Math.min(100,Number(row.personaScore)||0));
      const address=[row.address,row.postalCode?'Singapore '+row.postalCode:''].filter(Boolean).join(' · ');
      return '<article class="place-card card v110-place-card">'+
        '<div class="place-card-top"><div><span class="place-rank">'+String(i+1).padStart(2,'0')+'</span><div class="label">'+escText(String(row.category||'Place').toUpperCase())+'</div><h3>'+escText(row.name)+'</h3></div><span class="place-fit">'+escText(fitLabel(score))+'</span></div>'+
        (address?'<div class="v110-place-address">'+escText(address)+'</div>':'')+
        '<p>'+escText(placeDescription(row))+'</p>'+
        '<div class="v110-mode-strip" data-v110-modes-name="'+escText(row.name)+'">'+(Number.isFinite(state.lat)&&Number.isFinite(state.lon)?mobilityChip('🚶','Walk',(estimatedWalk(row.distanceM)?.minutes||'—')+' min',true,'Estimated walking time · '+distance(estimatedWalk(row.distanceM)?.distanceM)):'<span class="v110-mobility-locate">◎ Locate to compare travel modes</span>')+'</div>'+
        '<div class="place-intel"><span>'+escText(placeSource(row))+'</span>'+(row.distanceM!=null?'<span>◎ '+distance(row.distanceM)+'</span>':'')+'</div>'+
        '<div class="place-card-actions"><button class="secondary v110-compare-place" data-place-name="'+escText(row.name)+'" type="button">Compare ways</button><button class="primary place-route" data-featured-place="'+escText(row.name)+'" type="button">Take me there</button></div>'+
      '</article>';
    }).join('');
    const more=rows.length>shown.length?'<button id="v110ShowMorePlaces" class="secondary full v110-show-more" type="button">Show more places ('+(rows.length-shown.length)+' remaining)</button>':'';
    grid.innerHTML=(cards||'<div class="card empty">No places match this category/search yet.</div>')+more;
    loadPlaceEtas(shown);
    if(!$('#placesMapCard')?.classList.contains('hidden'))renderMap();
  }
  async function loadPlaces({resetFilter=false,preserveScroll=false}={}){
    if(resetFilter)state.v110PlaceFilter='all';
    state.v110VisibleCount=24;
    const preservedY=preserveScroll?window.scrollY:null;
    const requestId=++state.v110PlaceRequestId;
    const requestedPersona=state.mode;
    const requestedFilter=state.v110PlaceFilter;
    const q=$('#placeSearch')?.value.trim()||'';
    const params=new URLSearchParams({action:'places',persona:requestedPersona,limit:'120'});
    if(q)params.set('q',q);
    if(requestedFilter!=='all')params.set('category',requestedFilter);
    if(Number.isFinite(state.lat)&&Number.isFinite(state.lon)){params.set('lat',String(state.lat));params.set('lon',String(state.lon))}
    const grid=$('#placesGrid');
    if(grid){
      grid.classList.add('v110-results-loading');
      if(!preserveScroll)grid.innerHTML='<div class="card empty">Loading '+escText(persona().label)+' places…</div>';
    }
    try{
      const payload=await json('/api/journey?'+params.toString());
      if(requestId!==state.v110PlaceRequestId||requestedPersona!==state.mode||requestedFilter!==state.v110PlaceFilter)return;
      state.v110Places=payload.items||[];
      state.v110LoadedPersona=requestedPersona;
      if(grid)grid.classList.remove('v110-results-loading');
      renderPlaces();
      if(preserveScroll&&Number.isFinite(preservedY))requestAnimationFrame(()=>window.scrollTo({top:preservedY,behavior:'instant'}));
    }catch(error){
      if(requestId!==state.v110PlaceRequestId)return;
      if(grid){grid.classList.remove('v110-results-loading');grid.innerHTML='<div class="card empty">Place Index unavailable: '+escText(error.message)+'</div>'}
    }
  }

  const oldSearch=$('#placeSearch');
  if(oldSearch){
    const fresh=oldSearch.cloneNode(true);oldSearch.replaceWith(fresh);
    let timer;fresh.placeholder='Search Singapore — supermarket, clinic, hawker, park, district…';
    fresh.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>loadPlaces(),220)});
  }
  const toolbarNote=$('.places-toolbar > span');if(toolbarNote)toolbarNote.textContent='Search across the SGBuddy Place Index. Rankings change with your user mode; use Locate for nearest-first sorting.';

  document.addEventListener('click',e=>{
    const arrow=e.target.closest('[data-filter-scroll]');if(arrow){const rail=$('#v110PlaceFilterRail');if(rail)rail.scrollBy({left:Number(arrow.dataset.filterScroll)*Math.max(220,rail.clientWidth*.7),behavior:'smooth'});return}
    const f=e.target.closest('[data-place-filter]');if(f){
      const rail=$('#v110PlaceFilterRail');if(rail)state.v110FilterScrollLeft=rail.scrollLeft;
      state.v110PlaceFilter=f.dataset.placeFilter;
      loadPlaces({preserveScroll:true});
      return
    }
    const more=e.target.closest('#v110ShowMorePlaces');if(more){state.v110VisibleCount+=24;renderPlaces();return}
    const c=e.target.closest('.v110-compare-place');if(c){
      const dest=c.dataset.placeName;
      navigateTo('move');
      setTimeout(()=>{const input=$('#v110CompareDestination');if(input){input.value=dest;compareWays()}},80);
      return;
    }
  });
  document.addEventListener('change',e=>{if(e.target?.id==='v110PlaceSort'){const y=window.scrollY;state.v110PlaceSort=e.target.value;renderPlaces();requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'instant'}))}});
  document.addEventListener('sgbuddy:persona',e=>{state.v110Places=[];state.v110LoadedPersona='';state.v110PlaceRequestId++;const grid=$('#placesGrid');if(grid)grid.innerHTML='<div class="card empty">Switching to '+escText(persona().label)+' places…</div>';loadPlaces({resetFilter:true})});
  document.addEventListener('sgbuddy:location',()=>loadPlaces());

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
        .bindPopup('<div class="map-popup"><strong>'+escText(row.name)+'</strong><small>'+escText(row.category)+' · '+escText(fitLabel(Number(row.personaScore)||0))+'</small><button class="place-route" data-featured-place="'+escText(row.name)+'">Take me there</button></div>')
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
  compare.innerHTML='<div class="compare-head"><div><div class="label">COMPARE WAYS TO GO</div><h3>Walk · transit · drive · ride</h3></div><span class="reference-badge">Planning</span></div>'+
    '<p>Compare walking, public transport, driving and taxi/rideshare. SGBuddy highlights the fastest practical estimate and labels estimated road/walking data when OneMap routing is not configured.</p>'+
    '<div class="compare-input-row"><input id="v110CompareDestination" autocomplete="off" placeholder="Where are you going?"/><button id="v110CompareButton" class="primary" type="button">Compare</button></div>'+
    '<div id="v110CompareResults" class="compare-results"><div class="empty-inline">Use Locate, enter a destination, then compare all three modes.</div></div>';
  $('#transportSection')?.insertAdjacentElement('afterend',compare);

  function modeCard(label,badge,time,meta,cost,note,fast){
    return '<article class="compare-mode '+(fast?'fastest':'')+'"><div class="compare-mode-head"><div><span>'+badge+'</span><strong>'+label+'</strong></div>'+(fast?'<b>Fastest estimate</b>':'')+'</div><div class="compare-time">'+time+'</div><div class="compare-meta">'+meta+'</div>'+(cost?'<div class="compare-cost">'+cost+'</div>':'')+'<small>'+note+'</small></article>';
  }
  async function compareWays(){
    const input=$('#v110CompareDestination'),dest=input?.value.trim();if(!dest)return toast('Add a destination first.');
    if(!Number.isFinite(state.lat)||!Number.isFinite(state.lon)){toast('Use Locate first so SGBuddy can compare from where you are.');return}
    const button=$('#v110CompareButton'),host=$('#v110CompareResults');button.disabled=true;button.textContent='Comparing…';host.innerHTML='<div class="empty-inline">Comparing walk, public transport and road options…</div>';
    try{
      const p=await json('/api/journey?action=compare&lat='+encodeURIComponent(state.lat)+'&lon='+encodeURIComponent(state.lon)+'&to='+encodeURIComponent(dest));
      const cards=[];
      if(p.walking){const x=p.walking;cards.push(modeCard('Walk','🚶',x.minutes+' min',(x.routed?'Walking route':'Estimated walking route')+' · '+distance(x.distanceM),'No fare',x.note,p.fastestEstimate==='walk'))}
      if(p.publicTransport){const x=p.publicTransport;cards.push(modeCard('Public transport','▰',x.minutes+' min',(x.title||'Route')+' · '+x.walkMinutes+' min walk · '+x.transfers+' transfer'+(x.transfers===1?'':'s'),'Approx. SGD '+Number(x.fareEstimateSgd||0).toFixed(2)+' adult card fare',x.note,p.fastestEstimate==='public'))}
      if(p.drive){const x=p.drive;cards.push(modeCard('Drive','🚗',x.minutes+' min',(x.routed?'Road-routed':'Estimated')+' · '+(x.distanceM?distance(x.distanceM):'distance unavailable')+' · includes '+x.parkingAllowanceMinutes+' min parking/walk','Fuel and parking not estimated',x.note,p.fastestEstimate==='drive'))}
      if(p.rideshare){const x=p.rideshare;cards.push(modeCard('Taxi / rideshare','↗',x.minutesLow+'–'+x.minutesHigh+' min',(x.routed?'Road-routed':'Estimated')+' · includes '+x.pickupLowMinutes+'–'+x.pickupHighMinutes+' min pickup',x.taxiMeterBaselineSgd?'Meter baseline approx. SGD '+Number(x.taxiMeterBaselineSgd).toFixed(2)+' before extras':'Check provider app for fare',x.note,p.fastestEstimate==='rideshare'))}
      host.innerHTML=cards.join('')+'<div class="compare-disclaimer">'+escText(p.disclaimer||'')+'</div><button id="v110OpenTransitRoute" class="secondary full" type="button">Open detailed public-transport route</button>';
      $('#v110OpenTransitRoute')?.addEventListener('click',()=>{if($('#tripTo'))$('#tripTo').value=dest;$('#planTrip')?.click();$('#travelSection')?.scrollIntoView({behavior:'smooth',block:'start'})});
    }catch(error){host.innerHTML='<div class="empty-inline error-state">'+escText(error.message)+'</div>'}
    finally{button.disabled=false;button.textContent='Compare'}
  }
  $('#v110CompareButton')?.addEventListener('click',compareWays);
  $('#v110CompareDestination')?.addEventListener('keydown',e=>{if(e.key==='Enter')compareWays()});

  window.SGBUDDY_PLACE_INDEX_RENDERER=renderPlaces;
  window.SGBUDDY_PLACE_INDEX_RENDER_MAP=renderMap;
  qsa('.bottom-nav [data-nav-target="places"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{if(state.v110Places.length)renderPlaces();else loadPlaces()},20),true));
  $('#unitsToggle')?.addEventListener('click',()=>setTimeout(()=>{renderPlaces();if($('#v110CompareDestination')?.value.trim())compareWays()},20));
  $('#settingUnits')?.addEventListener('change',()=>setTimeout(()=>{renderPlaces();if($('#v110CompareDestination')?.value.trim())compareWays()},20));
  loadPlaces({resetFilter:true});
}