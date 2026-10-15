/* SGBuddy v1.2 — Discover and regional air-quality presentation.
   Data is a versioned, source-linked static catalog; never a live opening-hours feed. */
import {taxonomyLabel} from './lib/i18n-content-taxonomy-v310.mjs';
import {discoverStatus} from './lib/i18n-discover-status-v400.mjs';
import {directoryText} from './lib/i18n-directory-v410.mjs';
import {contextMode} from './lib/i18n-context-v370.mjs';
import {contextualText} from './lib/i18n-contextual-v420.mjs';
import {factTranslation} from './lib/i18n-facts-v310.mjs';
import {air413Text} from './lib/i18n-air-v413.mjs';
(function(){
  'use strict';
  const core=window.SGBUDDY_CORE;
  if(!core)return;
  const {state}=core;
  const $=selector=>document.querySelector(selector);
  const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
  const safeUrl=value=>{try{const u=new URL(String(value));return u.protocol==='https:'?u.href:''}catch{return ''}};
  const storeKey='sgbuddy-discover-saved-v1';
  const locale=()=>window.SGBUDDY_LANGUAGE||'en';
  const uiStatus=(key,fields={})=>discoverStatus(locale(),key,fields);
  const airT=(key,fields={})=>air413Text(locale(),key,fields);
  const d=(key,fields={})=>directoryText(locale(),key,fields);
  const ctx=(key,fields={})=>contextualText(locale(),key,fields);
  let saved=new Set();
  try{const v=JSON.parse(localStorage.getItem(storeKey)||'[]');if(Array.isArray(v))saved=new Set(v.filter(x=>typeof x==='string').slice(0,500))}catch{}
  let catalog={places:[],apps:[],facts:[]};
  let tab='eat',factIndex=0,savedOnly=false,showAll=false,loaded=false,areaFilter='all',visibleCount=24,sourceFilter='all',categoryFilter='all',includeArchive=false,neighbourhoodFilter='all',neighbourhoods=[];
  const addressCache=new Map();
  let officialClosures=new Map();
  const tabs=[['eat','Eat'],['do','Things to do'],['trip','My Trip'],['shop','Shop'],['essentials','Essentials'],['healthcare','Healthcare'],['apps','Everyday apps'],['travel','Travel prep'],['facts','Did you know?']];
  const directoryKinds={eat:'Eat',do:'Do',shop:'Shop',essentials:'Essentials',healthcare:'Healthcare'};
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
      tabs.map(([id,label])=>'<button type="button" role="tab" id="discoverTab-'+id+'" data-discover-tab="'+id+'" aria-controls="'+(id==='apps'?'everydayApps':id==='travel'?'travelEssentials':id==='trip'?'myTripPlanner':'discoverResults')+'" aria-selected="'+(id===tab?'true':'false')+'" class="'+(id===tab?'active':'')+'">'+label+'</button>').join(''),
    '</div>',
    '<div class="discover-search-row"><input id="discoverSearch" type="search" autocomplete="off" placeholder="Search places, neighbourhoods or apps" aria-label="Search Discover"/>',
    '<label class="discover-save-filter"><input id="discoverSavedOnly" type="checkbox"/> Saved only</label><select id="discoverAreaFilter" aria-label="Filter Discover by area"><option value="all">All Singapore areas</option></select><select id="discoverSourceFilter" aria-label="Filter by listing type"><option value="all">All listing types</option><option value="official">Government directory</option><option value="curated">Local suggestions</option><option value="operator">Business website</option></select><select id="discoverNeighbourhoodFilter" aria-label="Filter Discover by neighbourhood"><option value="all">All neighbourhoods</option></select><label class="discover-save-filter discover-archive-filter"><input id="discoverIncludeArchive" type="checkbox"/> Show older supermarket listings</label><select id="discoverCategoryFilter" aria-label="Filter by place type"><option value="all">All place types</option></select></div>',
    '<p id="discoverStatus" class="discover-status" role="status">Finding places around Singapore…</p><details id="discoverQuality" class="library-quality-v220" aria-label="About these listings"><summary>About these listings</summary><p>Business details can change. SGBuddy includes published directories and local suggestions, but does not confirm a place is open right now. Check directly with the business before visiting.</p><p><a href="https://www.chas.sg/clinic-locator" target="_blank" rel="noopener noreferrer">Check CHAS clinics ↗</a> · <a href="https://www.sfa.gov.sg/tools-and-resources/track-records" target="_blank" rel="noopener noreferrer">Check food licences ↗</a></p></details></section>',
    '<div id="discoverResults" class="discover-results" role="tabpanel" aria-live="polite"></div>'
  ].join('');
  view.insertBefore(host,view.firstChild);
  function localizeStaticFilters(){
    for(const [selector,key] of [['#discoverSourceFilter option[value="official"]','sourceOfficial'],['#discoverSourceFilter option[value="curated"]','sourceCurated'],['#discoverSourceFilter option[value="operator"]','sourceOperator'],['#discoverNeighbourhoodFilter option[value="all"]','allNeighbourhoods'],['#discoverCategoryFilter option[value="all"]','allPlaceTypes']]){const item=$(selector);if(item)item.textContent=ctx(key)}
    const archive=$('.discover-archive-filter');const copy=[...(archive?.childNodes||[])].find(x=>x.nodeType===3&&x.textContent.trim());if(copy)copy.textContent=' '+ctx('archiveFilter');
  }
  localizeStaticFilters();
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
    const q=place.name+', '+(place.address||place.area||'Singapore')+', Singapore';
    return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
  }
  function changeTab(next){
    if(!tabs.some(([id])=>id===next))return;
    tab=next;showAll=false;visibleCount=24;areaFilter='all';sourceFilter='all';categoryFilter='all';neighbourhoodFilter='all';if($('#discoverNeighbourhoodFilter'))$('#discoverNeighbourhoodFilter').value='all';if($('#discoverCategoryFilter'))$('#discoverCategoryFilter').value='all';if($('#discoverAreaFilter'))$('#discoverAreaFilter').value='all';if($('#discoverSourceFilter'))$('#discoverSourceFilter').value='all';
    host.querySelectorAll('[data-discover-tab]').forEach(b=>{
      const active=b.dataset.discoverTab===tab;
      b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));
      b.tabIndex=active?0:-1;
    });
    $('#discoverSearch').placeholder=uiStatus(tab==='apps'?'searchApps':tab==='facts'?'searchFacts':'searchPlaces');
    render();
    document.dispatchEvent(new CustomEvent('sgbuddy:discover-tab',{detail:{tab}}));
  }
  function directoryAddressStatus(place){
    const value=addressCache.get(place.id);
    if(!value&&place.status==='operator-listed')return '<p class="discover-address-note">📍 '+safe(place.address||d('seeBusiness'))+' · '+safe(d('confirmAddress'))+'</p>';
    if(!value&&place.status==='official-source-snapshot')return '<p class="discover-address-note">'+(place.address?'📍 '+safe(place.address):safe(d('missingAddress')))+' · '+safe(d('confirmDirections'))+'</p>';
    if(!value)return '<p class="discover-address-note">'+safe(d('confirmAddress'))+'</p>';
    if(value.status==='loading')return '<p class="discover-address-note" role="status">'+safe(d('addressLoading'))+'</p>';
    if(value.status==='address-matched'&&value.address){
      const a=value.address;
      const dest='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a.address||place.name);
      return '<p class="discover-address-note">📍 '+safe(a.address)+' · '+safe(a.postal||d('postalUnknown'))+'</p><p class="discover-address-note">'+safe(d('addressMatched'))+'</p><a href="'+safe(dest)+'" target="_blank" rel="noopener noreferrer">'+safe(d('directionsMatched'))+' ↗</a>';
    }
    const status=value.status==='not-configured'?'addressNotConfigured':value.status==='ambiguous'?'addressAmbiguous':value.status==='not-found'?'addressNotFound':'addressUnavailable';
    return '<p class="discover-address-note" role="status">'+safe(d(status))+' '+safe(d('addressSearchByName'))+'</p>';
  }
  function publishedClosure(place){
    const row=officialClosures.get(place.id);if(!row)return '';
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(today<row.start||today>row.end)return '';
    return '<p class="discover-closure" role="note">⚠ '+safe(d('closure',{start:row.start,end:row.end,reason:row.reason}))+'</p>';
  }
  function displayPlaceName(place){
    const raw=String(place.name||'');
    if(place.sourceAgency==='NLB'&&!/library/i.test(raw))return 'Public library location — '+raw;
    if(place.category==='Supermarket (historical licence)')return raw+' · '+(place.street||place.postal||'historic listed address');
    if(place.category==='CHAS clinic'&&place.postal)return raw+' · S'+place.postal;
    if(place.sourceAgency==='NParks'){
      return raw.replace(/\bPK\b/g,'Park').replace(/\bPG\b/g,'Playground').replace(/\bOS\b/g,'Open Space')
        .toLowerCase().replace(/\b[a-z]/g,m=>m.toUpperCase());
    }
    return raw;
  }
  function sourceAge(place){
    if(!['official-source-snapshot','operator-listed'].includes(place.status))return 'undated';
    const stamp=Date.parse(place.status==='operator-listed'?place.sourceCheckedOn:place.sourceCoverageAsOf||'');
    if(!Number.isFinite(stamp))return 'undated';
    const age=Math.max(0,(Date.now()-stamp)/86400000);
    return age>730?'historical':age>365?'aging':'recent';
  }
  function isArchived(place){return place.category==='Supermarket (historical licence)'}
  function friendlyDate(iso){
    const timestamp=Date.parse(iso||'');
    return Number.isFinite(timestamp)
      ?new Intl.DateTimeFormat(locale()==='en'?'en-SG':locale(),{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Singapore'}).format(timestamp)
      :null;
  }
  function freshnessLabel(place){
    if(isArchived(place))return d('historical');
    if(place.status==='operator-listed'){
      const checked=friendlyDate(place.sourceCheckedOn);
      return place.operator?d('listedBy',{operator:place.operator})+(checked?' · '+checked:''):d('unconfirmed');
    }
    if(place.status==='official-source-snapshot'){
      return sourceAge(place)==='recent'?d('governmentListed'):d('changed');
    }
    return d('unconfirmed');
  }
  function dirCard(place){
    const marked=saved.has(place.id),map=newMapsLink(place);
    const warning=(place.status==='operator-listed'?(place.sourceReportedHours?d('reportedHours',{hours:place.sourceReportedHours})+' ':'')+d('operatorWarning'):place.status==='official-source-snapshot'?d('officialWarning'):d('curatedWarning'))+(place.kind==='Healthcare'?' '+d('clinicWarning'):'');
    return '<article class="card discover-item"><div class="discover-item-title"><div><span class="label">'+safe(taxonomyLabel(locale(),place.category||place.kind))+' · '+safe(place.area)+'</span><h3>'+safe(displayPlaceName(place))+'</h3></div>'+
      '<button type="button" class="discover-fav '+(marked?'active':'')+'" data-save-discover="'+safe(place.id)+'" aria-pressed="'+String(marked)+'" aria-label="'+safe(d(marked?'removeAria':'saveAria',{name:place.name}))+'">'+(marked?'★':'☆')+'</button></div>'+
      '<p class="discover-freshness">'+safe(freshnessLabel(place))+'</p><p>'+safe(warning)+'</p>'+publishedClosure(place)+
      '<div class="discover-actions"><button type="button" class="secondary" data-trip-add-place="'+safe(place.id)+'">'+safe(d('addTrip'))+'</button>'+sourceLink(map,d('searchPlace'))+sourceLink(place.sourceUrl,d(place.status==='operator-listed'?'businessSite':place.status==='official-source-snapshot'?'officialInfo':'moreDetails'))+(place.category==='CHAS clinic'?sourceLink('https://www.chas.sg/clinic-locator',d('chasCheck')):'' )+(place.category==='Supermarket (historical licence)'?sourceLink('https://www.sfa.gov.sg/tools-and-resources/track-records',d('licenceCheck')):'' )+(place.id.startsWith('SGP-')?'<button type="button" class="secondary" data-verify-address="'+safe(place.id)+'">'+safe(d('verifyAddress'))+'</button>':'')+'</div><div class="discover-address-result">'+directoryAddressStatus(place)+'</div></article>';
  }
  function appsCard(app){
    const marked=saved.has(app.id),publisherLink=safeUrl(app.publisherUrl);
    return '<article class="card discover-item"><div class="discover-item-title"><div><span class="label">'+safe(taxonomyLabel(locale(),app.category))+'</span><h3>'+safe(app.name)+'</h3></div>'+
      '<button type="button" class="discover-fav '+(marked?'active':'')+'" data-save-discover="'+safe(app.id)+'" aria-pressed="'+String(marked)+'" aria-label="'+safe(d(marked?'removeAria':'saveAria',{name:app.name}))+'">'+(marked?'★':'☆')+'</button></div>'+
      '<p>'+safe(d(app.status==='publisher-reference'?'publisherVerified':'publisherUnverified'))+'</p>'+
      '<div class="discover-actions">'+sourceLink(publisherLink,d('publisherLink'))+'<span class="discover-app-legacy-note">'+safe(d('publisherDownload'))+'</span></div></article>';
  }
  function factsCard(fact){
    const marked=saved.has(fact.id);
    return '<article class="card discover-fact"><div class="label">'+safe(taxonomyLabel(locale(),fact.theme))+' · '+safe(uiStatus(fact.status==='verified'?'checked':'pending'))+'</div>'+
      '<h3>'+safe(d('didYouKnow'))+'</h3><p'+(factTranslation(locale(),fact)?' data-content-localized="true"':'')+'>'+safe(factTranslation(locale(),fact)||fact.text)+'</p>'+
      '<div class="discover-actions">'+sourceLink(fact.sourceUrl,d('readSource'))+
      '<button type="button" class="secondary" data-next-discover-fact>'+safe(d('anotherFact'))+' ↻</button>'+
      '<button type="button" class="secondary" data-save-discover="'+safe(fact.id)+'" aria-pressed="'+String(marked)+'">'+(marked?'★ '+safe(d('saved')):'☆ '+safe(d('save')))+'</button></div></article>';
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
    return (matchesMode(row)?100:0)+(matcher?.test(text)?24:0)+(row.status==='operator-listed'?70:row.status==='official-source-snapshot'?0:30);
  }
  function matchesNeighbourhood(r){
    if(neighbourhoodFilter==='all')return true;
    const nb=neighbourhoods.find(n=>n.id===neighbourhoodFilter);if(!nb)return true;
    const hay=[r.name,r.area,r.address,r.street].filter(Boolean).join(' ').toLowerCase();
    return (nb.aliases||[]).some(term=>hay.includes(term.toLowerCase()));
  }
  function orderedRows(rows){
    const q=($('#discoverSearch')?.value||'').toLowerCase().trim();
    const superseded=new Set(catalog.places.filter(p=>p.status==='operator-listed'&&p.operator==='Sheng Siong').map(p=>p.postal));
    return rows.filter(r=>(!isArchived(r)||includeArchive)&&!(isArchived(r)&&superseded.has(r.postal))&&matchesNeighbourhood(r)&&(!savedOnly||saved.has(r.id))&&(areaFilter==='all'||r.area===areaFilter)&&(sourceFilter==='all'||(sourceFilter==='official'?r.status==='official-source-snapshot':sourceFilter==='operator'?r.status==='operator-listed':!['official-source-snapshot','operator-listed'].includes(r.status)))&&(categoryFilter==='all'||(r.category||r.kind)===categoryFilter)&&(!q||[r.name,r.area,r.street,r.address,r.postal,r.kind,r.category,r.theme,r.text,taxonomyLabel(locale(),r.category||r.kind),factTranslation(locale(),r)||''].join(' ').toLowerCase().includes(q)))
      .sort((a,b)=>audienceScore(b)-audienceScore(a)||(a.name||a.text||'').localeCompare(b.name||b.text||''));
  }
  function render(){
    if(!loaded)return;
    const listingInfo=$('#discoverQuality');if(listingInfo)listingInfo.hidden=tab==='apps'||tab==='facts';
    const results=$('#discoverResults'),q=($('#discoverSearch')?.value||'').trim().toLowerCase();
    $('#discoverSearch').placeholder=uiStatus(tab==='apps'?'searchApps':tab==='facts'?'searchFacts':'searchPlaces');
    $('#discoverPersonaBadge').textContent=contextMode(locale(),state.mode,'label');
    $('#discoverPersonaCopy').textContent=contextMode(locale(),state.mode,'placesCopy');
    if(tab==='facts'){
      const candidates=catalog.facts.filter(f=>(!savedOnly||saved.has(f.id))&&(!q||[f.theme,f.text,taxonomyLabel(locale(),f.theme),factTranslation(locale(),f)||''].join(' ').toLowerCase().includes(q))&&matchesMode(f));
      if(factIndex>=candidates.length)factIndex=0;
      $('#discoverStatus').textContent=uiStatus('factsStatus',{checked:candidates.filter(f=>f.status==='verified').length,pending:candidates.filter(f=>f.status!=='verified').length});
      results.innerHTML=candidates.length?factsCard(candidates[factIndex]):'<div class="card discover-empty">'+safe(uiStatus('noFacts'))+'</div>';
      return;
    }
    const rows=orderedRows(tab==='apps'?catalog.apps:catalog.places.filter(p=>(p.kinds||[p.kind]).includes(directoryKinds[tab])));
    $('#discoverStatus').textContent=uiStatus(tab==='apps'?'appsFound':'placesFound',{count:rows.length});
    const visible=rows.slice(0,visibleCount);
    results.innerHTML='<div class="discover-grid">'+visible.map(tab==='apps'?appsCard:dirCard).join('')+'</div>'+
      (!rows.length?'<div class="card discover-empty">'+safe(uiStatus('noPlaces'))+'</div>':'')+
      (rows.length>visible.length?'<button class="secondary discover-more" type="button" id="discoverMore">'+safe(uiStatus('more',{shown:visible.length,count:rows.length}))+'</button>':'');
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
    const adder=event.target.closest('[data-trip-add-place]');
    if(adder){const place=catalog.places.find(p=>p.id===adder.dataset.tripAddPlace);if(place)document.dispatchEvent(new CustomEvent('sgbuddy:trip-add-place',{detail:{place}}));return}
    const saver=event.target.closest('[data-save-discover]');
    if(saver){const id=saver.dataset.saveDiscover;saved.has(id)?saved.delete(id):saved.add(id);persist();render();return}
    if(event.target.closest('[data-next-discover-fact]')){factIndex++;render();return}
    if(event.target.closest('#discoverMore')){visibleCount=Math.min(visibleCount+24,1500);render();}
  });
  $('#discoverSearch').addEventListener('input',()=>{factIndex=0;visibleCount=24;showAll=false;render()});
  $('#discoverSavedOnly').addEventListener('change',e=>{savedOnly=e.target.checked;visibleCount=24;showAll=false;factIndex=0;render()});
  $('#discoverAreaFilter').addEventListener('change',e=>{areaFilter=e.target.value;visibleCount=24;showAll=false;render()});
  $('#discoverSourceFilter').addEventListener('change',e=>{sourceFilter=e.target.value;visibleCount=24;render()});
  $('#discoverCategoryFilter').addEventListener('change',e=>{categoryFilter=e.target.value;visibleCount=24;render()});
  $('#discoverNeighbourhoodFilter').addEventListener('change',e=>{neighbourhoodFilter=e.target.value;visibleCount=24;render()});
  $('#discoverIncludeArchive').addEventListener('change',e=>{includeArchive=e.target.checked;visibleCount=24;render()});
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
  document.addEventListener('sgbuddy:language',()=>{localizeStaticFilters();render()});
  function category(psi){
    return airT(psi<=50?'good':psi<=100?'moderate':psi<=200?'unhealthy':psi<=300?'veryUnhealthy':'hazardous');
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
    badge.textContent=airT(!psi&&!pm?'unavailable'
      :offline?'offline'
      :missing?'partial'
      :cached?'cached'
      :delayed?'delayed'
      :timestampUnknown?'timestampUnknown'
      :'official');
    badge.className='sync-badge'+(offline||missing||cached||delayed||timestampUnknown?' v120-stale':'');
    const statusNotes=[];
    if(!psi)statusNotes.push(airT('psiUnavailable'));
    if(!pm)statusNotes.push(airT('pmUnavailable'));
    if(cached)statusNotes.push(airT('cachedCaution'));
    if(delayed)statusNotes.push(airT('delayedCaution'));
    if(timestampUnknown)statusNotes.push(airT('unknownTime'));
    $('#v120AirUpdated').textContent=sourceAges.length
      ?sourceAges.map(x=>x.name+': '+dateText(x.updatedAt)).join(' · ')+(statusNotes.length?' · '+statusNotes.join('; '):'')
      :airT('timestampsUnavailable');
    const regionSelected=String(air.region||'').toLowerCase();
    regionHost.innerHTML=regions.map(region=>{
      const p=airValue(psiRegions[region]),m=airValue(pmRegions[region]);
      return '<div class="v120-region '+(regionSelected===region?'selected':'')+'"><strong>'+safe(airT(region))+'</strong>'+
        '<span>PSI '+(p===null?'—':p)+'</span><small>PM2.5 '+(m===null?'—':m+' µg/m³')+'</small></div>';
    }).join('');
    const overall=airValue(psi?.overall);
    $('#v120AirAdvisory').textContent=!psi&&!pm?airT('advisoryUnavailable'):
      overall!==null&&overall>100?airT('advisoryHigh',{category:category(overall)}):
      airT('advisoryGeneral');
  }
  const environment=$('#environmentCard');
  if(environment){
    const panel=document.createElement('div');panel.className='v120-air card';panel.id='v120AirExtended';
    panel.innerHTML='<div class="v120-air-title"><div><div class="label">'+safe(airT('heading'))+'</div><h3>'+safe(airT('title'))+'</h3></div><span class="sync-badge" id="v120AirStatus">'+safe(airT('loading'))+'</span></div>'+
      '<p>'+safe(airT('intro'))+'</p>'+
      '<div class="v120-air-regions" id="v120AirPanel" aria-label="'+safe(airT('panelAria'))+'"></div>'+
      '<p class="v120-air-advisory" id="v120AirAdvisory" role="status">'+safe(airT('checking'))+'</p>'+
      '<div class="discover-actions"><small id="v120AirUpdated">'+safe(airT('checkingTime'))+'</small>'+
      sourceLink('https://www.nea.gov.sg/our-services/pollution-control/air-pollution',airT('neaGuidance'))+'</div>';
    environment.insertAdjacentElement('afterend',panel);
    function redrawLocalizedAir(){
      const panel=$('#v120AirExtended');if(!panel)return;
      panel.querySelector('.v120-air-title .label').textContent=airT('heading');
      panel.querySelector('.v120-air-title h3').textContent=airT('title');
      panel.querySelector('.v120-air-title + p').textContent=airT('intro');
      panel.querySelector('.discover-actions a').textContent=airT('neaGuidance')+' ↗';
      $('#v120AirPanel').setAttribute('aria-label',airT('panelAria'));
      drawAirQuality();
    }
    document.addEventListener('sgbuddy:weather',drawAirQuality);
    document.addEventListener('sgbuddy:language',redrawLocalizedAir);
    drawAirQuality();
  }
  Promise.all([
    fetch('/data/discover-v120.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Catalog response '+r.status);return r.json()}),
    fetch('/data/facts-published.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch('/data/nea-closures-v180.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch('/data/official-places-v200.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch('/data/services-v210.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch('/data/operator-listings-v230.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch('/data/neighbourhoods-v230.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)
  ]).then(([data,published,closureFeed,officialFeed,servicesFeed,operatorFeed,neighbourhoodFeed])=>{
    officialClosures=new Map((Array.isArray(closureFeed?.closures)?closureFeed.closures:[]).map(x=>[x.centreId,x]));
    for(const field of ['places','apps','facts'])if(!Array.isArray(data[field]))throw new Error('Invalid '+field+' catalog');
    const checked=Array.isArray(published?.facts)?published.facts.filter(f=>f.status==='verified'):[];
    const ids=new Set(checked.map(f=>f.id));
    const sourcePlaces=[...(Array.isArray(officialFeed?.places)?officialFeed.places:[]),...(Array.isArray(servicesFeed?.places)?servicesFeed.places:[])].filter(p=>p.status==='official-source-snapshot'&&p.name&&p.id&&p.kind&&p.sourceUrl);
    const names=new Set(data.places.map(p=>String(p.name).toLowerCase().replace(/[^a-z0-9]/g,'')));
    const unique=sourcePlaces.filter(p=>{const key=String(p.name).toLowerCase().replace(/[^a-z0-9]/g,'')+'|'+String(p.postal||p.id);if(names.has(key))return false;names.add(key);return true});
    const operatorPlaces=(Array.isArray(operatorFeed?.places)?operatorFeed.places:[]).filter(p=>p.id&&p.name&&p.kind&&p.postal&&p.sourceUrl&&p.status==='operator-listed');
    neighbourhoods=Array.isArray(neighbourhoodFeed?.neighbourhoods)?neighbourhoodFeed.neighbourhoods:[];
    $('#discoverNeighbourhoodFilter').insertAdjacentHTML('beforeend',neighbourhoods.map(n=>'<option value="'+safe(n.id)+'">'+safe(n.name)+'</option>').join(''));
    catalog={...data,places:[...data.places,...unique,...operatorPlaces],facts:[...checked,...data.facts.filter(f=>!ids.has(f.id))]};
    const areas=[...new Set(catalog.places.map(p=>p.area).filter(Boolean))].sort();
    $('#discoverAreaFilter').insertAdjacentHTML('beforeend',areas.map(a=>'<option value="'+safe(a)+'">'+safe(a)+'</option>').join(''));
    const kinds=[...new Set(catalog.places.map(p=>p.category||p.kind).filter(Boolean))].sort();
    $('#discoverCategoryFilter').insertAdjacentHTML('beforeend',kinds.map(k=>'<option value="'+safe(k)+'">'+safe(k)+'</option>').join(''));
    loaded=true;render();
    window.SGBUDDY_DISCOVER_PLACES=catalog.places;
    document.dispatchEvent(new CustomEvent('sgbuddy:discover-places-ready',{detail:{places:catalog.places}}));
    document.dispatchEvent(new CustomEvent('sgbuddy:library-ready',{detail:{curated:data.places.length,official:unique.length,total:catalog.places.length,operator:operatorPlaces.length,sources:[...(officialFeed?.sources||[]),...(servicesFeed?.sources||[])]}}));
    document.dispatchEvent(new CustomEvent('sgbuddy:discover-facts-ready',{detail:{verified:checked.length,total:catalog.facts.length}}));
  }).catch(()=>{$('#discoverStatus').textContent=d('catalogUnavailable');$('#discoverResults').innerHTML='<div class="card discover-empty">'+safe(d('catalogFallback'))+'</div>'});
  window.__SGBUDDY_CLIENT_VERSION__='2.4.2';
  if($('#appVersion'))$('#appVersion').textContent='v2.4.2';
})();
