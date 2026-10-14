/* SGBuddy V4.7: official, dated event snapshots. No live ticket/booking claims. */
import {normalizeLocale} from './lib/i18n-v280.mjs';
import {upcomingEvents,weekendWindow,eventFreshness} from './lib/events-v470.mjs';
import {singaporeDate,formatHolidayDate} from './lib/calendar-v460.mjs';
import {eventText} from './lib/events-i18n-v470.mjs';
import {localizedCategory,localizedEventSummary} from './lib/events-content-v480.mjs';
import {selectWeekendPicks} from './lib/events-weekend-v414.mjs';
(()=>{
'use strict';
const core=window.SGBUDDY_CORE,places=document.querySelector('.v1-view[data-view="places"]'),home=document.querySelector('.v1-view[data-view="today"]');
if(!core||!places||!home)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en'),t=k=>eventText(locale(),k);
const key='sgbuddy-v470-saved-events';
const readSaved=()=>{try{const arr=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(arr)?arr.filter(x=>typeof x==='string').slice(0,100):[]}catch{return []}};
let saved=new Set(readSaved()),payload=null,sources=[],filter='weekend';
const panel=document.createElement('section');panel.id='sgbuddyEvents';panel.className='events-panel card';panel.setAttribute('aria-live','polite');places.prepend(panel);
const quick=document.createElement('section');quick.id='sgbuddyEventsQuick';quick.className='events-quick card';
const calendarShortcut=document.getElementById('sgbuddyCalendarHome');
if(calendarShortcut)calendarShortcut.insertAdjacentElement('afterend',quick);else home.appendChild(quick);
const format=d=>formatHolidayDate(d,locale());
const filters=['weekend','upcoming','free','markets','family'];
function render(){
 const day=singaporeDate(),win=weekendWindow(day),mode=core.state?.mode||'visitor';
 const rows=upcomingEvents(payload?.events||[],day,filter,mode),weekend=upcomingEvents(payload?.events||[],day,'weekend',mode);
 const sourceById=new Map(sources.map(s=>[s.id,s.name]));
 const picks=selectWeekendPicks(payload?.events||[],day,mode,3);
 const chips=filters.map(f=>'<button type="button" data-event-filter="'+f+'" aria-pressed="'+(filter===f)+'" class="'+(filter===f?'active':'')+'">'+esc(t(f))+'</button>').join('');
 const listing=rows.map(e=>{
  const dates=e.startDate===e.endDate?format(e.startDate):format(e.startDate)+' – '+format(e.endDate);
  const type=t(({free:'admissionFree',ticketed:'ticketed',registration:'registration',check:'checkAdmission'})[e.admission]||'checkAdmission');
  const stale=eventFreshness(e,day)==='review-needed';
  return '<article class="events-item" data-event-id="'+esc(e.id)+'"><div class="events-item-head"><div><span class="events-category">'+esc(localizedCategory(locale(),e.category))+'</span><h3>'+esc(e.title)+'</h3></div><span class="events-access">'+esc(type)+'</span></div>'+
  '<p class="events-date">'+esc(dates)+'</p><p class="events-venue">'+esc(e.venue)+'</p>'+
  '<p class="events-summary">'+esc(localizedEventSummary(locale(),e))+'</p>'+
  '<p class="events-proof">'+esc(sourceById.get(e.sourceId)||e.sourceId)+' · '+esc(t('checked'))+' '+esc(format(e.verifiedAt))+(stale?' · '+esc(t('review')):'')+'</p>'+
  '<div class="events-actions"><button type="button" data-event-save="'+esc(e.id)+'" aria-pressed="'+saved.has(e.id)+'">'+esc(t(saved.has(e.id)?'saved':'save'))+'</button><a href="'+esc(e.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(t('official'))+'</a></div></article>';
 }).join('');
 const pickLinks=picks.map(e=>'<li><a href="'+esc(e.sourceUrl)+'" target="_blank" rel="noopener noreferrer"><strong>'+esc(e.title)+'</strong><small>'+esc(localizedCategory(locale(),e.category))+' · '+esc(format(e.startDate))+' · '+esc(e.venue)+'</small></a></li>').join('');
 quick.innerHTML='<div class="events-quick-header"><div><div class="label">'+esc(t('weekend'))+'</div><strong>'+esc(t('title'))+'</strong><small>'+weekend.length+' · '+esc(format(win.start))+' – '+esc(format(win.end))+'</small></div><button type="button" id="eventsQuickOpen">'+esc(t('all'))+'</button></div>'+
 '<ol class="events-quick-picks">'+(pickLinks||'<li class="events-quick-empty">'+esc(t('noEvents'))+'</li>')+'</ol><p class="events-quick-note">'+esc(t('caution'))+'</p>';
 panel.innerHTML='<div class="events-header"><div class="label">'+esc(t('title'))+'</div><h2>'+esc(t('title'))+'</h2><p>'+esc(t('intro'))+'</p></div>'+
 '<div class="events-filter-label">'+esc(t('filter'))+'</div><div class="events-filters" role="group" aria-label="'+esc(t('filter'))+'">'+chips+'</div>'+
 '<div class="events-list">'+(listing||'<div class="events-empty">'+esc(t('noEvents'))+'</div>')+'</div><p class="events-disclaimer">'+esc(t('caution'))+'</p>';
}
panel.addEventListener('click',event=>{
 const chip=event.target.closest('[data-event-filter]');
 if(chip&&filters.includes(chip.dataset.eventFilter)){filter=chip.dataset.eventFilter;render();return;}
 const b=event.target.closest('[data-event-save]');if(!b)return;
 const id=b.dataset.eventSave;if(!payload?.events?.some(x=>x.id===id))return;
 saved.has(id)?saved.delete(id):saved.add(id);
 try{localStorage.setItem(key,JSON.stringify([...saved].slice(0,100)))}catch{}
 render();
});
quick.addEventListener('click',event=>{
 if(!event.target.closest('#eventsQuickOpen'))return;
 window.SGBUDDY_VIEW_ROUTER?.show?.('places');
 requestAnimationFrame(()=>panel.scrollIntoView({block:'start',behavior:'smooth'}));
});
document.addEventListener('sgbuddy:language',()=>{if(payload)render()});
async function load(){
 try{
  const [p,s]=await Promise.all([fetch('/data/events-v470.json').then(r=>{if(!r.ok)throw Error('events');return r.json()}),fetch('/data/event-sources-v470.json').then(r=>{if(!r.ok)throw Error('sources');return r.json()})]);
  if(!Array.isArray(p.events)||!Array.isArray(s.sources))throw Error('schema');
  payload=p;sources=s.sources;render();
 }catch{
  panel.innerHTML='<div class="events-empty">'+esc(t('noEvents'))+'</div>';
  quick.innerHTML='<strong>'+esc(t('title'))+'</strong>';
 }
}
load();
})();
