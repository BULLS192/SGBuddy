/* SGBuddy V4.6: curated holidays + discovery-only event calendars.
 * Do not imply official event source links have been ingested as bookable events.
 */
import {normalizeLocale} from './lib/i18n-v280.mjs';
import {singaporeDate,upcomingHolidays,nextLongWeekend,formatHolidayDate} from './lib/calendar-v460.mjs';
import {calendarLabel} from './lib/calendar-i18n-v460.mjs';
(()=>{
'use strict';
const core=window.SGBUDDY_CORE;
const places=document.querySelector('.v1-view[data-view="places"]');
const today=document.querySelector('.v1-view[data-view="today"]');
if(!core||!places||!today)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const locale=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
const t=k=>calendarLabel(locale(),k);
const calendar=document.createElement('section');
calendar.className='calendar-card card';
calendar.id='sgbuddyCalendar';
calendar.setAttribute('aria-live','polite');
calendar.innerHTML='<p class="calendar-loading">Loading Singapore calendar…</p>';
places.prepend(calendar);
const home=document.createElement('section');
home.className='calendar-home card';
home.id='sgbuddyCalendarHome';
const after=today.querySelector('.ux-primary-shortcuts');
if(after)after.insertAdjacentElement('afterend',home);else today.appendChild(home);
let holidays=null,registry=null,filter='all';
const categories={all:()=>true,malls:x=>x.category==='mall',expos:x=>['exhibition','ticketing'].includes(x.category),culture:x=>['arts','performance','community','tourism','attraction','family'].includes(x.category),outdoors:x=>['outdoors','sports'].includes(x.category)};
function render(){
 const current=singaporeDate();
 const upcoming=upcomingHolidays(holidays?.holidays,current,8);
 const next=upcoming[0]||null;
 const longWeekend=nextLongWeekend(holidays?.holidays,current);
 home.innerHTML='<div class="calendar-home-title"><span aria-hidden="true">▦</span><div><strong>'+esc(t('home'))+'</strong><small>'+esc(next?next.name+' · '+formatHolidayDate(next.date,locale()):t('none'))+'</small></div></div><button type="button" class="calendar-home-open" id="calendarOpen">'+esc(t('visit'))+'</button>';
 const grid=upcoming.length?upcoming.map((row,i)=>'<li class="calendar-holiday '+(i===0?'calendar-holiday-next':'')+'"><div><strong>'+esc(row.name)+'</strong><small>'+esc(formatHolidayDate(row.date,locale()))+'</small></div>'+(row.observed?'<span class="calendar-observed">'+esc(t('observed'))+'</span>':'')+'</li>').join(''):'<li class="calendar-empty">'+esc(t('none'))+'</li>';
 const all=registry?.sources||[];
 const selected=all.filter(categories[filter]||categories.all).slice(0,12);
 const filters=['all','malls','expos','culture','outdoors'].map(k=>'<button type="button" data-cal-filter="'+k+'" class="'+(filter===k?'active':'')+'" aria-pressed="'+(filter===k)+'">'+esc(t(k))+'</button>').join('');
 const cards=selected.map(src=>'<li class="calendar-source"><span><strong>'+esc(src.name)+'</strong><small>'+esc(src.area==='islandwide'?'Singapore':src.area)+'</small></span><a href="'+esc(src.url)+'" target="_blank" rel="noopener noreferrer">'+esc(t('visit'))+'</a></li>').join('');
 calendar.innerHTML='<div class="calendar-head"><div><div class="label">'+esc(t('title'))+'</div><h2>'+esc(t('title'))+'</h2><p>'+esc(t('intro'))+'</p></div></div>'+
 '<div class="calendar-feature"><div class="label">'+esc(t('next'))+'</div><strong>'+esc(next?.name||t('none'))+'</strong><span>'+esc(next?formatHolidayDate(next.date,locale()):'')+'</span>'+(longWeekend?'<small>'+esc(t('longWeekend'))+': '+esc(formatHolidayDate(longWeekend.date,locale()))+'</small>':'')+'</div>'+
 '<div class="calendar-subheading"><h3>'+esc(t('upcoming'))+'</h3><span>'+esc(holidays?.coverage?.join('–')||'')+'</span></div><ol class="calendar-holidays">'+grid+'</ol>'+
 '<p class="calendar-attribution"><a href="'+esc(holidays?.sourceUrl||'https://www.mom.gov.sg/')+'" target="_blank" rel="noopener noreferrer">'+esc(t('holidaySource'))+' ↗</a></p>'+
 '<div class="calendar-subheading"><h3>'+esc(t('browse'))+'</h3><span>'+all.length+'</span></div>'+
 '<div class="calendar-filter-label">'+esc(t('sourceFilter'))+'</div><div class="calendar-filters" role="group" aria-label="'+esc(t('sourceFilter'))+'">'+filters+'</div>'+
 '<ul class="calendar-sources">'+(cards||'<li class="calendar-empty">'+esc(t('none'))+'</li>')+'</ul>'+
 '<p class="calendar-caution">'+esc(t('note'))+'</p>';
}
calendar.addEventListener('click',event=>{
 const chip=event.target.closest('[data-cal-filter]');
 if(chip&&Object.hasOwn(categories,chip.dataset.calFilter)){filter=chip.dataset.calFilter;render();}
});
home.addEventListener('click',event=>{
 if(!event.target.closest('#calendarOpen'))return;
 const router=window.SGBUDDY_VIEW_ROUTER;
 if(router?.show)router.show('places');else core.navigateTo('places');
 requestAnimationFrame(()=>calendar.scrollIntoView({block:'start',behavior:'smooth'}));
});
document.addEventListener('sgbuddy:language',render);
async function load(){
 try{
  const [h,s]=await Promise.all([fetch('/data/holidays-2026-2027-v460.json').then(r=>{if(!r.ok)throw Error('holidays');return r.json()}),fetch('/data/event-sources-v470.json').then(r=>{if(!r.ok)throw Error('sources');return r.json()})]);
  if(!Array.isArray(h.holidays)||!Array.isArray(s.sources))throw Error('schema');
  holidays=h;registry=s;render();
 }catch(error){
  calendar.innerHTML='<div class="calendar-error">'+esc(t('title'))+': '+esc(error?.message||'unavailable')+'</div>';
  home.innerHTML='<div class="calendar-error">'+esc(t('title'))+' · '+esc(t('none'))+'</div>';
 }
}
load();
})();
