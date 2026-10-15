/* V4.23 preview: navigation and disclosure only. Keep V4.22 persistence and providers. */
import {UX422_LABELS} from './lib/ux-i18n-v422.mjs';
(()=>{
'use strict';
const d=document,$=s=>d.querySelector(s),all=s=>[...d.querySelectorAll(s)];
const labels={
en:['Places','Food','Events','Guides','Near me','Things to do','Shop','Essentials','Healthcare','Did you know?','Travel prep','Everyday apps','Calendar & official sources','More filters','Fewer filters','Discover Singapore','Plan days, stops and experiences. Your trip stays on this device.','Trip details','Sharing & backups','Find your next Singapore experience','Explore by interest','System status & diagnostics','Trip tools','My Trip'],
'zh-CN':['地点','美食','活动','指南','附近','游玩','购物','生活服务','医疗保健','你知道吗？','行前准备','常用应用','日历与官方来源','更多筛选','收起筛选','探索新加坡','安排日期、地点和体验。行程仅存于此设备。','行程详情','分享与备份','探索新加坡精彩活动','按兴趣探索','系统状态与诊断','行程工具','我的行程'],
'zh-TW':['地點','美食','活動','指南','附近','景點','購物','生活服務','醫療保健','你知道嗎？','行前準備','常用應用','日曆與官方來源','更多篩選','收起篩選','探索新加坡','安排日期、地點與體驗。行程僅存在此裝置。','行程詳情','分享與備份','探索新加坡精彩活動','依興趣探索','系統狀態與診斷','旅程工具','我的行程'],
ms:['Tempat','Makanan','Acara','Panduan','Berdekatan','Aktiviti','Beli-belah','Keperluan','Kesihatan','Tahukah anda?','Persediaan','Aplikasi harian','Kalendar & sumber rasmi','Lagi penapis','Kurang penapis','Terokai Singapura','Rancang hari dan persinggahan. Perjalanan disimpan pada peranti ini.','Butiran perjalanan','Kongsi & sandaran','Temui acara di Singapura','Teroka mengikut minat','Status sistem & diagnostik','Alat perjalanan','Perjalanan saya'],
id:['Tempat','Kuliner','Acara','Panduan','Terdekat','Aktivitas','Belanja','Kebutuhan','Kesehatan','Tahukah Anda?','Persiapan','Aplikasi harian','Kalender & sumber resmi','Filter lainnya','Sedikit filter','Jelajahi Singapura','Atur hari dan tujuan. Perjalanan disimpan di perangkat ini.','Detail perjalanan','Berbagi & cadangan','Temukan acara di Singapura','Jelajahi sesuai minat','Status sistem & diagnostik','Alat perjalanan','Perjalanan saya'],
ja:['スポット','グルメ','イベント','ガイド','近く','観光','買い物','生活情報','医療','豆知識','旅行準備','便利なアプリ','カレンダー・公式情報','詳細フィルター','フィルターを閉じる','シンガポールを発見','日程と立ち寄り先を計画。旅程はこの端末に保存されます。','旅程の詳細','共有とバックアップ','シンガポールのイベントを探す','興味から探す','システム状況・診断','旅程ツール','マイトリップ'],
ko:['장소','음식','이벤트','가이드','내 주변','즐길 거리','쇼핑','생활 정보','의료','알고 계셨나요?','여행 준비','일상 앱','달력 및 공식 출처','필터 더보기','필터 접기','싱가포르 탐색','날짜와 방문지를 계획하세요. 여행 정보는 이 기기에 저장됩니다.','여행 세부정보','공유 및 백업','싱가포르 이벤트 찾기','관심사별 탐색','시스템 상태 및 진단','여행 도구','내 여행'],
th:['สถานที่','อาหาร','กิจกรรม','คู่มือ','ใกล้ฉัน','ที่เที่ยว','ช้อปปิ้ง','สิ่งจำเป็น','สุขภาพ','รู้หรือไม่?','เตรียมเดินทาง','แอปประจำวัน','ปฏิทินและแหล่งทางการ','ตัวกรองเพิ่มเติม','ซ่อนตัวกรอง','สำรวจสิงคโปร์','วางแผนวันและจุดแวะ ทริปเก็บไว้ในอุปกรณ์นี้','รายละเอียดทริป','แชร์และสำรอง','ค้นหากิจกรรมในสิงคโปร์','สำรวจตามความสนใจ','สถานะระบบและการตรวจสอบ','เครื่องมือทริป','ทริปของฉัน'],
vi:['Địa điểm','Ẩm thực','Sự kiện','Hướng dẫn','Gần tôi','Vui chơi','Mua sắm','Thiết yếu','Y tế','Bạn có biết?','Chuẩn bị đi','Ứng dụng','Lịch & nguồn chính thức','Thêm bộ lọc','Ẩn bộ lọc','Khám phá Singapore','Lên lịch ngày và điểm đến. Chuyến đi lưu trên thiết bị này.','Chi tiết chuyến đi','Chia sẻ & sao lưu','Khám phá sự kiện Singapore','Khám phá theo sở thích','Trạng thái hệ thống & chẩn đoán','Công cụ chuyến đi','Chuyến đi của tôi'],
fr:['Lieux','Gastronomie','Événements','Guides','À proximité','À découvrir','Shopping','Services','Santé','Le saviez-vous ?','Préparer son voyage','Apps utiles','Calendrier et sources officielles','Plus de filtres','Moins de filtres','Découvrir Singapour','Organisez vos journées et étapes. Ce voyage reste sur cet appareil.','Détails du voyage','Partage et sauvegarde','Découvrez les événements à Singapour','Explorer par envie','État du système et diagnostics','Outils du voyage','Mon voyage'],
es:['Lugares','Comida','Eventos','Guías','Cerca de mí','Qué hacer','Compras','Servicios','Salud','¿Sabías que...?','Preparar viaje','Apps diarias','Calendario y fuentes oficiales','Más filtros','Menos filtros','Descubre Singapur','Organiza días y paradas. El viaje se guarda en este dispositivo.','Detalles del viaje','Compartir y respaldar','Descubre eventos en Singapur','Explorar por interés','Estado del sistema y diagnóstico','Herramientas del viaje','Mi viaje'],
'pt-BR':['Lugares','Gastronomia','Eventos','Guias','Perto de mim','O que fazer','Compras','Serviços','Saúde','Você sabia?','Preparar viagem','Apps do dia a dia','Calendário e fontes oficiais','Mais filtros','Menos filtros','Descubra Singapura','Organize dias e paradas. A viagem fica salva neste dispositivo.','Detalhes da viagem','Compartilhar e backup','Encontre eventos em Singapura','Explore por interesse','Status do sistema e diagnósticos','Ferramentas da viagem','Minha viagem']
};
const locale=()=>{const k=String(window.SGBUDDY_LANGUAGE||'en').replace('_','-');return labels[k]?k:k==='zh'?'zh-CN':k==='pt'?'pt-BR':'en'};
const t=()=>labels[locale()];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const router=window.SGBUDDY_VIEW_ROUTER,main=$('main'),host=$('#myTripPlanner'),discover=$('#discoverHub'),placesView=$('.v1-view[data-view="places"]');
if(!router?.show||!main||!host||!discover||!placesView)return;

// Move the existing planner node. Its storage, listeners, events, and import/export API stay intact.
const tripView=d.createElement('section');
tripView.id='ux423TripView';tripView.dataset.view='trip';tripView.className='v1-view ux423-trip-view hidden';
tripView.innerHTML='<header class="ux423-screen-head"><span class="ux423-kicker">SGBUDDY</span><h2 id="ux423TripTitle"></h2><p id="ux423TripLead"></p></header>';
main.appendChild(tripView);
tripView.appendChild(host);
host.setAttribute('role','region');host.setAttribute('aria-labelledby','ux423TripTitle');
const openTrip=()=>{
  // The original category activation performs a fresh render for all attached integrations.
  $('#discoverTab-trip')?.click();
  host.hidden=false;
  all('.v1-view').forEach(view=>view.classList.toggle('hidden',view!==tripView));
  all('.bottom-nav [data-nav-target]').forEach(a=>{const selected=a.dataset.navTarget==='trip';a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  window.scrollTo({top:0,behavior:'instant'});
};
window.SGBUDDY_V423={openTrip,version:'4.23.0-preview'};

// Four clear discovery paths; legacy tabs remain functional for deep links and modules.
const groupTabs=d.createElement('div'),categories=d.createElement('div'),slot=d.createElement('div');
groupTabs.className='ux423-groups';groupTabs.setAttribute('role','group');
categories.className='ux423-categories';categories.setAttribute('role','group');
slot.className='ux423-events-slot';slot.hidden=true;
const intro=discover.querySelector('.discover-intro');
intro?.querySelector('.discover-tabs')?.insertAdjacentElement('beforebegin',groupTabs);
groupTabs.insertAdjacentElement('afterend',categories);
discover.appendChild(slot);
const events=$('#sgbuddyEvents'),calendar=$('#sgbuddyCalendar');
const refine=d.createElement('button');refine.type='button';refine.className='ux423-refine';refine.setAttribute('aria-expanded','false');
const calendarDetails=d.createElement('details');calendarDetails.className='ux423-calendar-details';
const calendarSummary=d.createElement('summary');calendarDetails.appendChild(calendarSummary);
if(calendar)calendarDetails.appendChild(calendar);
slot.appendChild(refine);if(events)slot.appendChild(events);slot.appendChild(calendarDetails);
let group='places',category='do',expanded=false,choosing=false;
const configs={places:[['nearby',4],['do',5],['shop',6],['essentials',7],['healthcare',8]],food:[['eat',1]],guides:[['facts',9],['travel',10],['apps',11]]};
const groupNames={places:0,food:1,events:2,guides:3};
const belong=tab=>tab==='eat'?'food':['facts','travel','apps'].includes(tab)?'guides':'places';
function legacyTab(tab){
 if(tab==='nearby'){$('[data-ux-nearby]')?.click();return}
 const btn=$('[data-discover-tab="'+tab+'"]');if(btn)btn.click();
}
function paint(){
 const l=t();
 $('#ux423TripTitle').textContent=(UX422_LABELS[locale()]||UX422_LABELS.en)[0];
 $('#ux423TripLead').textContent=l[16];
 groupTabs.setAttribute('aria-label',l[15]);categories.setAttribute('aria-label',l[20]);
 groupTabs.innerHTML=Object.entries(groupNames).map(([k,i])=>'<button type="button" data-ux423-group="'+k+'" aria-pressed="'+(group===k)+'" class="'+(group===k?'active':'')+'">'+safe(l[i])+'</button>').join('');
 const opts=configs[group]||[];
 categories.innerHTML=opts.map(([tab,i])=>'<button type="button" data-ux423-category="'+tab+'" aria-pressed="'+(category===tab)+'" class="'+(category===tab?'active':'')+'">'+safe(l[i])+'</button>').join('');
 categories.hidden=group==='events';
 slot.hidden=group!=='events';
 placesView.classList.toggle('ux423-events-mode',group==='events');
 discover.classList.toggle('ux423-events-mode',group==='events');
 refine.textContent=l[expanded?14:13];refine.setAttribute('aria-expanded',String(expanded));refine.setAttribute('aria-controls','sgbuddyEvents');
 events?.classList.toggle('ux423-show-filters',expanded);
 calendarSummary.textContent=l[12];
 const diagnostics=$('#ux423Diagnostics > summary');if(diagnostics)diagnostics.textContent=l[21];
 const tools=$('#ux423TripTools > summary');if(tools)tools.textContent=l[18];
 const eventHead=$('#ux423EventsLead');if(eventHead)eventHead.textContent=l[19];
 const oldTitle=$('#discoverTitle');if(oldTitle)oldTitle.textContent=l[15];
}
function selectGroup(next,nextCategory,activate=true){
 if(!Object.hasOwn(groupNames,next))return;
 group=next;
 category=nextCategory||(configs[next]?.some(x=>x[0]===category)?category:configs[next]?.[0]?.[0])||category;
 paint();
 if(group!=='events'&&activate){choosing=true;try{legacyTab(category)}finally{choosing=false}}
}
groupTabs.addEventListener('click',e=>{const b=e.target.closest('[data-ux423-group]');if(b)selectGroup(b.dataset.ux423Group)});
categories.addEventListener('click',e=>{const b=e.target.closest('[data-ux423-category]');if(b)selectGroup(group,b.dataset.ux423Category)});
refine.addEventListener('click',()=>{expanded=!expanded;paint()});
d.addEventListener('sgbuddy:discover-tab',e=>{
 const tab=e.detail?.tab;if(!tab||choosing)return;
 if(tab==='trip'){queueMicrotask(()=>{if(!tripView.classList.contains('hidden'))return;router.show('trip')});return}
 selectGroup(belong(tab),tab,false);
});
d.addEventListener('click',e=>{
 if(e.target.closest('#eventsQuickOpen'))requestAnimationFrame(()=>{selectGroup('events');events?.scrollIntoView({block:'start',behavior:'smooth'})});
 if(e.target.closest('#calendarOpen'))requestAnimationFrame(()=>{selectGroup('events');calendarDetails.open=true;calendar?.scrollIntoView({block:'start',behavior:'smooth'})});
},true);

// Keep sharing and advanced itinerary tools discoverable, not always expanded.
function foldTripTools(){
 if(!host.isConnected)return;
 const tr=window.SGBUDDY_TRIP_API?.getActive?.();
 tripView.classList.toggle('ux423-empty-trip',!tr);
 const version=host.querySelector('.trip-heading .label');if(version)version.textContent=(UX422_LABELS[locale()]||UX422_LABELS.en)[0];
 const share=host.querySelector('.trip-share-v270');
 if(share){const versionShare=share.querySelector('.label');if(versionShare)versionShare.textContent=t()[18]}
 const exportRow=host.querySelector('.trip-export');
 if(tr&&exportRow&&share){
  const folded=d.createElement('details');folded.id='ux423TripTools';folded.className='ux423-trip-tools';
  const summary=d.createElement('summary');summary.textContent=t()[18];folded.appendChild(summary);
  exportRow.before(folded);folded.appendChild(exportRow);folded.appendChild(share);
 }
 if(!tr&&share){
  // Import remains exposed in the empty state; legal explanations stay on-demand.
  const blocks=[...share.querySelectorAll('.trip-share-warning, .trip-helper:not(#tripShareStatus)')];
  if(blocks.length){const detail=d.createElement('details');detail.className='ux423-trip-notes';const summary=d.createElement('summary');summary.textContent=t()[17];detail.appendChild(summary);blocks[0].before(detail);blocks.forEach(b=>detail.appendChild(b))}
 }
}
d.addEventListener('sgbuddy:trip-rendered',()=>queueMicrotask(foldTripTools));
d.addEventListener('sgbuddy:language',()=>requestAnimationFrame(()=>{paint();foldTripTools()}));

// Diagnostics are still one tap away from More, but no longer dominate it.
const corePanel=$('#dataCorePanel');
if(corePanel){
 const details=d.createElement('details');details.id='ux423Diagnostics';details.className='ux423-diagnostics';
 const summary=d.createElement('summary');summary.textContent=t()[21];details.appendChild(summary);
 corePanel.before(details);details.appendChild(corePanel);
}
paint();
foldTripTools();
})();
