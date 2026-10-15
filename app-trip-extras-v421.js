/* SGBuddy V4.21 stacked development: optional on-device calendar export
 * and published-only trip-date events. No live bookings or unapproved queue.
 */
import {calendarForTrip} from './lib/trip-calendar-v421.mjs';
import {tripPublishedEvents} from './lib/trip-published-events-v421.mjs';
const d=document;
const translations={"en":["Download calendar (.ics)","Find events for my dates","Your calendar file stays on this device until you share it.","Only stops with a time are exported. No visit duration is assumed.","Add a time to at least one stop to export.","Calendar downloaded","Published event ideas","Only published, source-checked event snapshots are shown. Recheck organizer information before visiting.","Searching published events…","No matching published events for these trip dates.","Unable to load published events. Try again online.","Add event to trip","Added to itinerary","Already added, or itinerary unavailable","Source needs rechecking","View official event ↗","Day","No reservations or purchases are made."],"zh-CN":["下载日历 (.ics)","查找行程日期的活动","日历文件保存在本设备上，除非您自行分享。","仅导出有时间的地点，不推测游览时长。","请先为至少一个地点设置时间。","日历已下载","已发布活动推荐","仅显示已发布且经来源核实的活动快照。出行前请再次确认主办方信息。","正在搜索已发布活动…","这些日期没有匹配的已发布活动。","无法加载活动，请联网后重试。","加入行程","已加入行程","已加入或行程不可用","来源需重新核实","查看活动官方网站 ↗","第","不进行预订或购买。"],"zh-TW":["下載行事曆 (.ics)","尋找旅程日期的活動","行事曆檔案只留在此裝置，除非您分享。","只匯出有時間的地點，不推測停留時長。","請先為至少一個地點設定時間。","行事曆已下載","已發布活動建議","只顯示經來源核實的已發布活動快照。出發前請再核實主辦方資訊。","正在搜尋活動…","旅程日期暫無已發布活動。","無法載入活動，請連線後再試。","加入旅程","已加入旅程","已加入或旅程不可用","來源須重新核實","查看活動官網 ↗","第","不會進行預訂或購買。"],"ms":["Muat turun kalendar (.ics)","Cari acara mengikut tarikh","Fail kalendar kekal pada peranti kecuali anda berkongsi.","Hanya hentian dengan masa dieksport. Tempoh lawatan tidak diandaikan.","Tetapkan masa untuk sekurang-kurangnya satu hentian.","Kalendar dimuat turun","Cadangan acara diterbitkan","Hanya acara rasmi yang telah disemak dipaparkan. Semak penganjur sekali lagi.","Mencari acara…","Tiada acara diterbitkan pada tarikh ini.","Acara tidak dapat dimuatkan. Cuba dalam talian.","Tambah acara ke perjalanan","Ditambah","Sudah ditambah atau tidak tersedia","Sumber perlu disemak semula","Lihat laman acara ↗","Hari","Tiada tempahan atau pembelian dibuat."],"id":["Unduh kalender (.ics)","Cari acara untuk tanggal perjalanan","File kalender tetap di perangkat sampai Anda membagikannya.","Hanya tempat dengan waktu yang diekspor. Durasi tidak diperkirakan.","Atur waktu minimal satu pemberhentian.","Kalender diunduh","Saran acara terbit","Hanya acara yang telah diterbitkan dan diverifikasi. Periksa penyelenggara sebelum datang.","Mencari acara…","Tidak ada acara terbit pada tanggal tersebut.","Gagal memuat acara. Coba lagi saat online.","Tambah acara","Ditambahkan","Sudah ditambahkan atau tidak tersedia","Sumber perlu diperiksa lagi","Lihat situs acara ↗","Hari","Tidak ada pemesanan atau pembelian."],"ja":["カレンダーを保存 (.ics)","旅程日に合うイベントを探す","カレンダーファイルは共有するまで端末内に保存されます。","時刻のある場所だけを書き出します。所要時間は推測しません。","少なくとも1件に時刻を設定してください。","カレンダーを保存しました","公開イベントの候補","公開済み・出典確認済みの情報のみ表示します。訪問前に主催者にご確認ください。","イベントを検索中…","旅程日に合う公開イベントがありません。","読み込めません。オンラインで再試行してください。","旅程に追加","追加しました","追加済みまたは利用不可","出典の再確認が必要","公式ページを見る ↗","日目","予約や購入は行いません。"],"ko":["캘린더 다운로드 (.ics)","여행 날짜의 이벤트 찾기","캘린더 파일은 공유하기 전까지 기기에만 저장됩니다.","시간이 있는 장소만 내보내며 체류 시간을 추정하지 않습니다.","한 장소 이상에 시간을 지정하세요.","캘린더 저장 완료","공개된 이벤트 추천","출처를 확인한 공개 이벤트만 표시합니다. 방문 전 주최자에게 재확인하세요.","이벤트 검색 중…","날짜에 맞는 공개 이벤트가 없습니다.","이벤트를 불러올 수 없습니다. 온라인에서 다시 시도하세요.","여행에 추가","추가 완료","이미 추가했거나 사용할 수 없음","출처 재확인 필요","공식 페이지 보기 ↗","일차","예약이나 구매는 하지 않습니다."],"th":["ดาวน์โหลดปฏิทิน (.ics)","ค้นหากิจกรรมตามวันเที่ยว","ไฟล์ปฏิทินอยู่ในอุปกรณ์จนกว่าคุณจะแชร์","ส่งออกเฉพาะจุดที่กำหนดเวลา ไม่คาดเดาระยะเวลา","โปรดกำหนดเวลาอย่างน้อยหนึ่งจุดแวะ","ดาวน์โหลดปฏิทินแล้ว","กิจกรรมที่เผยแพร่","แสดงเฉพาะกิจกรรมเผยแพร่ที่ตรวจแหล่งที่มา โปรดยืนยันกับผู้จัดก่อน","กำลังค้นหากิจกรรม…","ไม่มีกิจกรรมที่เผยแพร่ในวันที่เลือก","โหลดกิจกรรมไม่ได้ ลองอีกครั้งเมื่อออนไลน์","เพิ่มกิจกรรมในทริป","เพิ่มแล้ว","เพิ่มแล้วหรือไม่พร้อมใช้งาน","ควรตรวจสอบแหล่งที่มาอีกครั้ง","ดูหน้าอย่างเป็นทางการ ↗","วันที่","ไม่มีการจองหรือซื้อ"],"vi":["Tải lịch (.ics)","Tìm sự kiện theo ngày đi","Tệp lịch ở trên thiết bị trừ khi bạn chia sẻ.","Chỉ xuất điểm dừng có giờ; không tự đoán thời lượng.","Hãy đặt giờ cho ít nhất một điểm.","Đã tải lịch","Gợi ý sự kiện đã đăng","Chỉ hiển thị sự kiện đã đăng và kiểm tra nguồn. Xác nhận lại với ban tổ chức.","Đang tìm sự kiện…","Không có sự kiện đã đăng trùng ngày.","Không tải được. Hãy thử khi có mạng.","Thêm vào lịch trình","Đã thêm","Đã có hoặc không khả dụng","Cần kiểm tra lại nguồn","Trang sự kiện chính thức ↗","Ngày","Không đặt chỗ hay mua vé."],"fr":["Télécharger le calendrier (.ics)","Événements aux dates du voyage","Le fichier reste sur cet appareil sauf si vous le partagez.","Seules les étapes horaires sont exportées, sans durée supposée.","Ajoutez un horaire à au moins une étape.","Calendrier téléchargé","Événements publiés","Seuls les événements publiés et vérifiés sont proposés. Reconfirmez auprès de l'organisateur.","Recherche d’événements…","Aucun événement publié aux dates du voyage.","Chargement impossible. Réessayez en ligne.","Ajouter au voyage","Ajouté","Déjà ajouté ou indisponible","Source à revérifier","Page officielle ↗","Jour","Aucune réservation ni achat."],"es":["Descargar calendario (.ics)","Buscar eventos para las fechas","El archivo queda en este dispositivo salvo que lo compartas.","Solo se exportan paradas con hora, sin inventar duración.","Asigna una hora a al menos una parada.","Calendario descargado","Eventos publicados","Solo eventos publicados con fuentes verificadas. Confirma los detalles con el organizador.","Buscando eventos…","No hay eventos publicados para estas fechas.","No se pudieron cargar. Inténtalo en línea.","Añadir al viaje","Añadido","Ya añadido o no disponible","Revisar fuente","Página oficial ↗","Día","Sin reservas ni compras."],"pt-BR":["Baixar calendário (.ics)","Buscar eventos nas datas","O arquivo fica neste dispositivo, a menos que seja compartilhado.","Apenas paradas com horário; nenhuma duração é presumida.","Defina horário em pelo menos uma parada.","Calendário baixado","Eventos publicados","Apenas eventos publicados com fonte verificada. Confirme com o organizador antes de ir.","Procurando eventos…","Não há eventos publicados nessas datas.","Não foi possível carregar. Tente on-line.","Adicionar à viagem","Adicionado","Já adicionado ou indisponível","Reverificar fonte","Página oficial ↗","Dia","Nenhuma reserva ou compra."]};
const lang=()=>translations[window.SGBUDDY_LANGUAGE]?window.SGBUDDY_LANGUAGE:'en';
const t=()=>translations[lang()];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let showing=false,busy=false,published=null,activeId=null,message='',queued=false;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const active=()=>window.SGBUDDY_TRIP_API?.getActive();
function matches(trip){
 if(!trip||!published)return [];
 return tripPublishedEvents(trip,published.events,published.sources,today());
}
function render(){
 queued=false;
 const root=d.getElementById('myTripPlanner'),trip=active();
 if(!root||root.hidden||!trip)return;
 if(activeId!==trip.id){activeId=trip.id;showing=false;message='';}
 const summary=root.querySelector('.trip-quality-summary');
 if(!summary)return;
 root.querySelector('.trip-v421')?.remove();
 const l=t(),panel=d.createElement('section');
 panel.className='trip-v421';
 const hits=showing?matches(trip):[];
 panel.innerHTML='<div class="trip-v421-actions"><button type="button" class="secondary" data-v421-calendar>'+esc(l[0])+'</button>'+
 '<button type="button" class="secondary" data-v421-events '+(busy?'disabled':'')+'>'+esc(l[1])+'</button></div>'+
 '<p class="trip-v421-helper">'+esc(l[2])+' '+esc(l[3])+'</p><p role="status" class="trip-v421-status">'+esc(message||'')+'</p>'+
 (showing?'<div class="trip-v421-events"><strong>'+esc(l[6])+'</strong><p>'+esc(l[7])+' '+esc(l[17])+'</p>'+
 (busy?'<p>'+esc(l[8])+'</p>':hits.length?hits.map(({event,dayIndex,sourceState})=>
  '<article class="trip-v421-event"><div><b>'+esc(event.title)+'</b><small>'+esc(l[16])+' '+(dayIndex+1)+' · '+esc(event.startDate)+
  (event.endDate!==event.startDate?' — '+esc(event.endDate):'')+' · '+esc(event.venue)+'</small>'+
  (sourceState!=='snapshot'?'<small>'+esc(l[14])+'</small>':'')+
  '<a href="'+esc(event.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(l[15])+'</a></div>'+
  '<button type="button" class="secondary" data-v421-event="'+esc(event.id)+'">'+esc(l[11])+'</button></article>').join(''):
 '<p>'+esc(message&&message!==l[9]?message:l[9])+'</p>')+'</div>':'');
 summary.after(panel);
}
function schedule(){if(queued)return;queued=true;queueMicrotask(render)}
d.addEventListener('sgbuddy:trip-rendered',schedule);
d.addEventListener('sgbuddy:language',schedule);
async function loadPublished(){
 if(published)return published;
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),13000);
 try{
  const [events,sources]=await Promise.all(['/data/events-v470.json','/data/event-sources-v470.json'].map(async url=>{
   const res=await fetch(url,{signal:ctrl.signal,credentials:'same-origin',cache:'no-store'});
   if(!res.ok)throw new Error('Unable to load published data');
   return res.json();
  }));
  if(!Array.isArray(events.events)||!Array.isArray(sources.sources))throw new Error('Invalid event inventory');
  published={events:events.events,sources:sources.sources};
  return published;
 }finally{clearTimeout(timer)}
}
d.addEventListener('click',async e=>{
 const btn=e.target?.closest?.('[data-v421-calendar],[data-v421-events],[data-v421-event]');
 if(!btn)return;
 const trip=active();if(!trip)return;
 if(btn.hasAttribute('data-v421-calendar')){
  try{
   const file=calendarForTrip(trip);
   if(!file.included){message=t()[4];schedule();return}
   const url=URL.createObjectURL(new Blob([file.content],{type:'text/calendar;charset=utf-8'}));
   const a=d.createElement('a');a.href=url;a.download='sgbuddy-trip-'+trip.startDate+'.ics';a.click();
   setTimeout(()=>URL.revokeObjectURL(url),1500);message=t()[5];schedule();
  }catch{message=t()[4];schedule()}return;
 }
 if(btn.hasAttribute('data-v421-events')){
  if(busy)return;showing=true;busy=true;message='';schedule();
  try{await loadPublished();message=''}
  catch{message=t()[10]}
  finally{busy=false;schedule()}
  return;
 }
 if(btn.hasAttribute('data-v421-event')){
  const record=matches(trip).find(x=>x.id===btn.dataset.v421Event);
  if(!record)return;
  const result=window.SGBUDDY_TRIP_API?.addEvent(record.event);
  message=result?.ok?t()[12]:t()[13];schedule();
 }
});
schedule();
