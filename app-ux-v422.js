/* SGBuddy V4.22 visual-only refinement.
 * Progressive enhancement over the existing V4.21 data, views, storage and APIs.
 * No new service calls, storage keys, API endpoints or event publication.
 */
import {tripOverview} from './lib/trip-insights-v420.mjs';
const L={"en":["My Trip","More","Saved places","Money & FX","Account settings","Your Singapore toolkit","Useful tools, all in one place","Plan a journey","MRT, buses & arrivals","Plan an itinerary","Organise days, stops & activities","Trip overview","days","stops","Device only","Your plans are stored locally on this device. Export a copy before switching devices.","Trip tools","Your next stop","Plan your visit, then explore routes and events.","Sharing or exporting may include your personal notes.","Trip timeline"],"zh-CN":["我的行程","更多","已收藏地点","货币与汇率","账户设置","新加坡工具箱","常用功能集中在此","规划路线","地铁、巴士和抵达时间","规划行程","安排日期、地点和活动","行程概览","天","站","仅在本设备","行程保存在本设备。更换设备前请导出备份。","行程工具","下一站","规划游览，再探索路线和活动。","分享或导出可能包含您的个人备注。","行程时间线"],"zh-TW":["我的行程","更多","已收藏地點","貨幣與匯率","帳戶設定","新加坡工具箱","常用功能都在這裡","規劃路線","地鐵、公車與到達時間","規劃行程","安排日期、地點與活動","行程概覽","天","站","僅存此裝置","旅程儲存在此裝置。換裝置前請先匯出備份。","旅程工具","下一站","規劃行程並探索路線與活動。","分享或匯出可能包含私人備註。","行程時間線"],"ms":["Perjalanan saya","Lagi","Tempat disimpan","Wang & FX","Tetapan akaun","Alat Singapura anda","Semua alat penting di sini","Rancang perjalanan","MRT, bas & ketibaan","Rancang jadual","Susun hari dan hentian","Ringkasan perjalanan","hari","hentian","Peranti ini sahaja","Pelan disimpan pada peranti ini. Eksport salinan sebelum bertukar peranti.","Alat perjalanan","Hentian seterusnya","Rancang lawatan dan lihat laluan serta acara.","Eksport mungkin mengandungi nota peribadi.","Garis masa perjalanan"],"id":["Perjalanan saya","Lainnya","Tempat tersimpan","Uang & kurs","Pengaturan akun","Alat Singapura Anda","Semua alat penting di sini","Rencanakan rute","MRT, bus & kedatangan","Rencanakan itinerary","Atur hari dan pemberhentian","Ringkasan perjalanan","hari","perhentian","Hanya perangkat ini","Rencana tersimpan di perangkat ini. Ekspor cadangan sebelum berganti perangkat.","Alat perjalanan","Tujuan berikutnya","Rencanakan perjalanan, rute, dan acara.","Ekspor mungkin berisi catatan pribadi.","Linimasa perjalanan"],"ja":["マイトリップ","その他","保存した場所","通貨・為替","アカウント設定","シンガポールのツール","便利な機能をまとめました","経路を検索","MRT・バス・到着時刻","旅程を作成","日程・立ち寄り先を整理","旅程の概要","日","件","この端末のみ","旅程はこの端末に保存されます。機種変更前に書き出してください。","旅程ツール","次の立ち寄り先","旅程、経路、イベントを確認しましょう。","共有・書き出しにはメモが含まれる場合があります。","旅程タイムライン"],"ko":["내 여행","더보기","저장한 장소","환율·돈","계정 설정","싱가포르 도구","필요한 기능을 한곳에","이동 경로 계획","MRT·버스·도착","여행 일정 만들기","날짜와 방문지 정리","여행 개요","일","장소","이 기기에만","여행 일정은 이 기기에 저장됩니다. 변경 전 내보내세요.","일정 도구","다음 방문지","일정과 이동 경로, 이벤트를 살펴보세요.","공유·내보내기에 개인 메모가 포함될 수 있습니다.","여행 타임라인"],"th":["ทริปของฉัน","เพิ่มเติม","สถานที่บันทึก","เงินและอัตราแลกเปลี่ยน","ตั้งค่าบัญชี","เครื่องมือสิงคโปร์","เครื่องมือสำคัญในที่เดียว","วางแผนเส้นทาง","MRT รถเมล์ และเวลา","วางแผนเที่ยว","จัดวันและสถานที่","สรุปทริป","วัน","จุด","เฉพาะอุปกรณ์นี้","ทริปเก็บไว้ในอุปกรณ์นี้ ส่งออกสำเนาก่อนเปลี่ยนเครื่อง","เครื่องมือทริป","จุดต่อไป","จัดทริปและดูเส้นทางกับกิจกรรม","การแชร์อาจมีบันทึกส่วนตัว","ไทม์ไลน์ทริป"],"vi":["Chuyến đi của tôi","Thêm","Địa điểm đã lưu","Tiền & tỷ giá","Cài đặt tài khoản","Công cụ Singapore","Tất cả công cụ hữu ích","Lập lộ trình","MRT, xe buýt & giờ đến","Lập lịch trình","Sắp xếp ngày và điểm dừng","Tổng quan chuyến đi","ngày","điểm dừng","Chỉ thiết bị này","Lịch trình lưu trên thiết bị này. Xuất bản sao trước khi đổi thiết bị.","Công cụ chuyến đi","Điểm đến tiếp theo","Lập kế hoạch rồi xem tuyến và sự kiện.","Chia sẻ có thể gồm ghi chú cá nhân.","Dòng thời gian"],"fr":["Mon voyage","Plus","Lieux enregistrés","Argent et change","Compte","Vos outils pour Singapour","Les outils essentiels au même endroit","Planifier un trajet","MRT, bus et arrivées","Planifier un séjour","Organiser les jours et étapes","Aperçu du voyage","jours","étapes","Cet appareil","Le voyage est enregistré sur cet appareil. Exportez une copie avant de changer d'appareil.","Outils du voyage","Prochaine étape","Préparez votre séjour, puis explorez trajets et événements.","Les exports peuvent contenir vos notes personnelles.","Chronologie du voyage"],"es":["Mi viaje","Más","Lugares guardados","Dinero y cambio","Cuenta","Tus herramientas para Singapur","Todo lo útil en un lugar","Planear un trayecto","MRT, autobuses y llegadas","Planear un itinerario","Organizar días y paradas","Resumen del viaje","días","paradas","Solo este dispositivo","El viaje se guarda en este dispositivo. Exporta una copia antes de cambiarlo.","Herramientas de viaje","Próxima parada","Planifica tu visita, rutas y eventos.","Compartir o exportar puede incluir notas personales.","Cronología del viaje"],"pt-BR":["Minha viagem","Mais","Locais salvos","Dinheiro e câmbio","Configurações da conta","Seu kit de Singapura","Ferramentas úteis em um só lugar","Planejar trajeto","MRT, ônibus e chegadas","Planejar roteiro","Organizar dias e paradas","Resumo do roteiro","dias","paradas","Só neste dispositivo","Seu roteiro fica neste dispositivo. Exporte uma cópia antes de trocar de aparelho.","Ferramentas do roteiro","Próxima parada","Organize a visita, rotas e eventos.","Compartilhar ou exportar pode incluir notas pessoais.","Linha do tempo"]};
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
  host.append(section);
 }
 const l=t();
 section.innerHTML='<div class="ux422-eyebrow">'+esc(l[5])+'</div><h3>'+esc(l[6])+'</h3>'+
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
 intro.innerHTML='<div class="ux422-trip-top"><div><span class="ux422-eyebrow">'+esc(l[11])+'</span><strong>'+esc(current.name||l[0])+'</strong><small>'+esc(range)+'</small></div>'+
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
// Badge distinguishes review-only UX preview from the unchanged release version.
const badge=$('#appVersion');if(badge&&!$('#ux422PreviewBadge')){const flag=d.createElement('span');flag.id='ux422PreviewBadge';flag.className='ux422-preview-badge';flag.textContent='UX Preview · V4.22';badge.after(flag)}
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
