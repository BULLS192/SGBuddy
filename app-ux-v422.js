/* SGBuddy V4.22 visual-only refinement.
 * Progressive enhancement over the existing V4.21 data, views, storage and APIs.
 * No new service calls, storage keys, API endpoints or event publication.
 */
import {tripOverview} from './lib/trip-insights-v420.mjs';
import {UX422_LABELS as L} from './lib/ux-i18n-v422.mjs';
const d=document, $=selector=>d.querySelector(selector);
const lang=()=>{const value=String(window.SGBUDDY_LANGUAGE||'en').replace('_','-');return L[value]?value:value==='zh'?'zh-CN':value==='pt'?'pt-BR':'en'};
const t=()=>L[lang()]||L.en;
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const toDay=x=>{const val=String(x||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(val))return '';try{return new Intl.DateTimeFormat(lang(),{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(val+'T12:00:00Z'))}catch{return val}};
const getTrip=()=>window.SGBUDDY_TRIP_API?.getActive();
let pending=false;
function schedule(){if(pending)return;pending=true;queueMicrotask(()=>{pending=false;paint()})}
function nav(){
 const labels=t(),trip=$('#navMoney'),more=$('#navAccount');
 if(trip&&trip.dataset.navTarget==='trip'){
  trip.href='#myTripPlanner';
  trip.setAttribute('aria-label',labels[0]);
  trip.querySelector('span')?.replaceChildren(d.createTextNode(labels[0]));
 }
 const tNav=$('#navMoney');
 if(tNav){tNav.setAttribute('aria-label',labels[0]);tNav.querySelector('span')?.replaceChildren(d.createTextNode(labels[0]))}
 if(more){more.setAttribute('aria-label',labels[1]);more.querySelector('span')?.replaceChildren(d.createTextNode(labels[1]))}
}
function moreHub(){
 const host=$('#accountSection');if(!host)return;
 let section=$('#ux422MoreHub');if(!section){
  section=d.createElement('section');section.id='ux422MoreHub';section.className='ux422-more-hub';
  section.setAttribute('role','region');section.setAttribute('aria-labelledby','ux422MoreTitle');
  host.prepend(section);
 }
 const l=t();
 section.innerHTML='<div class="ux422-eyebrow">'+esc(l[5])+'</div><h3 id="ux422MoreTitle">'+esc(l[6])+'</h3>'+
 '<div class="ux422-more-grid"><button type="button" data-ux-go="saved"><span aria-hidden="true">☆</span><strong>'+esc(l[2])+'</strong><small>↗</small></button>'+
 '<button type="button" data-ux-go="money"><span aria-hidden="true">⇄</span><strong>'+esc(l[3])+'</strong><small>↗</small></button>'+
 '<button type="button" id="ux422AccountAccess"><span aria-hidden="true">◎</span><strong>'+esc(l[4])+'</strong><small>↗</small></button></div>';
}
function home(){
 const l=t(), grid=$('.ux-primary-shortcuts');
 if(grid){
  const route=grid.querySelector('[data-ux-go="move"]');
  if(route){const strong=route.querySelector('strong');const small=route.querySelector('small');if(strong)strong.textContent=l[7];if(small)small.textContent=l[8]}
  const itin=grid.querySelector('[data-ux-go="trip"]');
  if(itin){const strong=itin.querySelector('strong');const small=itin.querySelector('small');if(strong)strong.textContent=l[9];if(small)small.textContent=l[10]}
 }
}
function trip(){
 const host=$('#myTripPlanner');if(!host||host.hidden)return;
 const current=getTrip();if(!current)return;
 const l=t(),overview=tripOverview(current);
 let intro=host.querySelector('.ux422-trip-overview');
 if(!intro){intro=d.createElement('section');intro.className='ux422-trip-overview';}
 const range=current.startDate?(toDay(current.startDate)+' · '+overview.totalDays+' '+l[12]):'';
 intro.setAttribute('role','region');intro.setAttribute('aria-label',l[11]);
 intro.innerHTML='<div class="ux422-trip-top"><div><span class="ux422-eyebrow">'+esc(l[11])+'</span><h4>'+esc(current.name||l[0])+'</h4><small>'+esc(range)+'</small></div>'+
 '<span class="ux422-local-badge" title="'+esc(l[15])+'">⌁ '+esc(l[14])+'</span></div>'+
 '<div class="ux422-metrics"><span><b>'+overview.plannedDays+'/'+overview.totalDays+'</b>'+esc(l[12])+'</span><span><b>'+overview.totalStops+'</b>'+esc(l[13])+'</span></div>'+
 '<p>'+esc(l[15])+'</p>';
 const tabs=host.querySelector('.trip-day-tabs');
 if(tabs)tabs.before(intro);
 const dayPanel=host.querySelector('.trip-day-panel');
 if(dayPanel){dayPanel.classList.add('ux422-timeline');
  const active=host.querySelector('.trip-day-tabs [aria-pressed="true"]');
  const index=Number(active?.dataset.tripDay??0),stops=current.days?.[index]||[];
  let tip=dayPanel.querySelector('.ux422-day-tip');
  if(!tip){tip=d.createElement('div');tip.className='ux422-day-tip';dayPanel.querySelector('.trip-stops')?.before(tip)}
  tip.textContent=l[19]+' · '+(index+1)+' — '+stops.length+' '+l[13];
 }
 // Existing event/calendar actions remain fully visible and keyboard-accessible,
 // but appear after today's itinerary rather than above day selection.
 const events=host.querySelector('.trip-v421');
 if(events&&dayPanel&&events.previousElementSibling!==dayPanel){dayPanel.after(events)}
 if(events){events.classList.add('ux422-tools');
  let title=events.querySelector('.ux422-tools-heading');
  if(!title){title=d.createElement('h4');title.className='ux422-tools-heading';events.prepend(title)}
  title.textContent=l[16];
 }
 const out=host.querySelector('.trip-export');
 if(out&&!out.querySelector('.ux422-export-hint')){
  const p=d.createElement('p');p.className='ux422-export-hint';p.textContent=l[18];out.prepend(p);
 }else if(out){const p=out.querySelector('.ux422-export-hint');if(p)p.textContent=l[18]}
}
function paint(){nav();moreHub();home();trip()}
// Production release uses the normal app version indicator; no development badges.
d.addEventListener('sgbuddy:trip-rendered',()=>requestAnimationFrame(schedule));
d.addEventListener('sgbuddy:language',()=>requestAnimationFrame(schedule));
d.addEventListener('sgbuddy:persona',()=>requestAnimationFrame(schedule));
d.addEventListener('sgbuddy:discover-tab',()=>requestAnimationFrame(schedule));
d.addEventListener('click',e=>{
 if(e.target?.closest?.('#ux422AccountAccess')){$('#accountButton')?.click()}
 if(e.target?.closest?.('.bottom-nav [data-nav-target="trip"]'))requestAnimationFrame(schedule);
});
const host=$('#myTripPlanner');if(host){const observer=new MutationObserver(records=>{
 if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&['trip-v421','trip-quality-summary','trip-day-panel','trip-day-tabs','trip-active'].some(x=>n.classList?.contains(x)))))requestAnimationFrame(schedule);
 });observer.observe(host,{childList:true});
}
schedule();
