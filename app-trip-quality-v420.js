/* V4.20 Wave 1: non-invasive, read-only quality panels for My Trip.
 * Itinerary remains private on the device. No unpublished event queue or external API.
 */
import {tripOverview,dayRouteSegments,suggestDayPlaces} from './lib/trip-insights-v420.mjs';
const doc=document,labels={"en":["Trip health","Planned days","Stops","Repeated places","Same-time clashes","Missing street addresses","Split routes","Leg","Same-area ideas","Matches area labels only. Distance, hours and admission are not verified.","Add to day","Stops","Source: SGBuddy place directory"],"zh-CN":["行程检查","已安排天数","地点","重复地点","时间冲突","缺少街道地址","分段路线","路段","同区域推荐","仅匹配区域名称，距离、营业时间和入场条件未核实。","加入当天","站点","来源：SGBuddy 地点目录"],"zh-TW":["行程檢查","已安排天數","地點","重複地點","時間衝突","缺少街道地址","分段路線","路段","同區域建議","只比對區域名稱，距離、營業時間與入場條件尚未核實。","加入當天","站點","來源：SGBuddy 地點目錄"],"ms":["Semakan perjalanan","Hari dirancang","Hentian","Tempat berulang","Masa bertindih","Alamat tiada","Laluan bersegmen","Segmen","Idea kawasan sama","Label kawasan sahaja; jarak, waktu dan kemasukan belum disahkan.","Tambah hari ini","Hentian","Sumber: direktori SGBuddy"],"id":["Kesehatan perjalanan","Hari terencana","Pemberhentian","Tempat berulang","Waktu bentrok","Alamat kurang","Rute per bagian","Bagian","Ide satu area","Hanya label area; jarak, jam buka dan tiket belum diverifikasi.","Tambah hari ini","Pemberhentian","Sumber: direktori SGBuddy"],"ja":["旅程の確認","予定日数","立ち寄り先","重複する場所","時間の重複","住所未入力","分割ルート","区間","同じエリアの候補","地域名の一致のみ。距離・営業時間・入場条件は未確認です。","この日に追加","地点","出典：SGBuddy 地点一覧"],"ko":["여행 일정 점검","계획된 날짜","방문지","중복 장소","시간 겹침","주소 누락","구간별 경로","구간","같은 지역 제안","지역 이름만 비교합니다. 거리·운영 시간·입장 조건은 미확인입니다.","오늘에 추가","방문지","출처: SGBuddy 장소 목록"],"th":["ตรวจแผนเที่ยว","วันที่มีแผน","จุดแวะ","สถานที่ซ้ำ","เวลาชนกัน","ขาดที่อยู่","เส้นทางแบ่งช่วง","ช่วง","ไอเดียพื้นที่เดียวกัน","ตรงกันเฉพาะชื่อพื้นที่ ระยะทาง เวลาเปิด และค่าเข้ายังไม่ยืนยัน","เพิ่มในวันนี้","จุดแวะ","ที่มา: รายชื่อสถานที่ SGBuddy"],"vi":["Kiểm tra hành trình","Ngày đã lên kế hoạch","Điểm dừng","Địa điểm lặp","Trùng giờ","Thiếu địa chỉ","Tuyến chia chặng","Chặng","Gợi ý cùng khu vực","Chỉ khớp tên khu vực; khoảng cách, giờ mở và vé chưa được xác minh.","Thêm vào ngày","Điểm dừng","Nguồn: danh bạ SGBuddy"],"fr":["Bilan du voyage","Jours prévus","Étapes","Lieux répétés","Horaires identiques","Adresses manquantes","Trajets découpés","Tronçon","Suggestions même quartier","Correspondance des quartiers seulement; distances, horaires et accès non vérifiés.","Ajouter au jour","Étapes","Source : annuaire SGBuddy"],"es":["Revisión del viaje","Días planificados","Paradas","Lugares repetidos","Horas duplicadas","Direcciones faltantes","Rutas por tramos","Tramo","Ideas de la misma zona","Solo coinciden nombres de zonas; distancias, horarios y acceso sin verificar.","Añadir al día","Paradas","Fuente: directorio de SGBuddy"],"pt-BR":["Revisão da viagem","Dias planejados","Paradas","Locais repetidos","Horários iguais","Endereços ausentes","Rotas por trechos","Trecho","Ideias da mesma região","Apenas nomes de regiões; distâncias, horários e acesso não verificados.","Adicionar ao dia","Paradas","Fonte: diretório SGBuddy"]};
const locale=()=>labels[window.SGBUDDY_LANGUAGE]?window.SGBUDDY_LANGUAGE:'en';
const t=()=>labels[locale()];
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let pending=false;
function paint(){
 pending=false;
 const host=doc.getElementById('myTripPlanner'),api=window.SGBUDDY_TRIP_API;
 if(!host||host.hidden||!api)return;
 const trip=api.getActive(),tab=host.querySelector('.trip-day-tabs');
 if(!trip||!tab)return;
 const l=t(),health=tripOverview(trip);
 const summary=doc.createElement('section');
 summary.className='trip-quality-summary';
 summary.setAttribute('aria-label',l[0]);
 summary.innerHTML='<strong>'+escapeHTML(l[0])+'</strong><p>'+
   escapeHTML(l[1]+': '+health.plannedDays+'/'+health.totalDays+' · '+l[2]+': '+health.totalStops+
   ' · '+l[4]+': '+health.timeConflicts+' · '+l[5]+': '+health.missingAddresses)+'</p>'+
   (health.repeated.length?'<p>'+escapeHTML(l[3])+': '+health.repeated.map(p=>escapeHTML(p.name)+' ('+p.days.join(', ')+')').join('; ')+'</p>':'');
 host.querySelector('.trip-quality-summary')?.remove();
 tab.before(summary);
 const select=host.querySelector('.trip-day-tabs [aria-pressed="true"]');
 const dayIndex=Number(select?.dataset.tripDay??0);
 const mode=host.querySelector('[data-trip-route-mode]')?.value==='driving'?'driving':'walking';
 const parts=dayRouteSegments(trip,dayIndex,{mode});
 const box=host.querySelector('.trip-day-insights');
 host.querySelector('.trip-quality-routes')?.remove();
 if(box&&parts.length>1){
  const section=doc.createElement('div');section.className='trip-quality-routes';
  section.innerHTML='<strong>'+escapeHTML(l[6])+'</strong><div class="trip-quality-legs">'+
  parts.map((p,i)=>'<a data-v420-route="'+i+'" target="_blank" rel="noopener noreferrer" href="'+escapeHTML(p.url)+'">'+escapeHTML(l[7])+' '+p.number+' · '+escapeHTML(l[11])+' '+p.from+'–'+p.to+' ↗</a>').join('')+'</div>';
  box.after(section);
 }
 host.querySelector('.trip-quality-suggestions')?.remove();
 const catalogue=window.SGBUDDY_DISCOVER_PLACES;
 const suggestions=suggestDayPlaces(trip,dayIndex,catalogue);
 const addPanel=host.querySelector('.trip-add-panel');
 if(addPanel&&suggestions.length){
  const section=doc.createElement('section');section.className='trip-quality-suggestions';
  section.innerHTML='<strong>'+escapeHTML(l[8])+'</strong><p>'+escapeHTML(l[9])+'</p><div class="trip-quality-options">'+
  suggestions.map(p=>'<div class="trip-quality-place"><span><b>'+escapeHTML(p.name)+'</b><small>'+escapeHTML(p.area)+'</small></span>'+
  '<button type="button" class="secondary" data-v420-add="'+escapeHTML(p.id)+'">'+escapeHTML(l[10])+'</button></div>').join('')+'</div><small>'+escapeHTML(l[12])+'</small>';
  addPanel.append(section);
 }
}
function schedule(){if(pending)return;pending=true;queueMicrotask(paint)}
doc.addEventListener('sgbuddy:trip-rendered',schedule);
doc.addEventListener('sgbuddy:discover-places-ready',schedule);
doc.addEventListener('sgbuddy:language',schedule);
doc.addEventListener('change',e=>{if(e.target?.matches?.('[data-trip-route-mode]'))schedule()});
doc.addEventListener('click',e=>{
 const btn=e.target?.closest?.('[data-v420-add]');if(!btn)return;
 const api=window.SGBUDDY_TRIP_API,host=doc.getElementById('myTripPlanner');
 const trip=api?.getActive(),i=Number(host?.querySelector('.trip-day-tabs [aria-pressed="true"]')?.dataset.tripDay??0);
 const match=suggestDayPlaces(trip,i,window.SGBUDDY_DISCOVER_PLACES).find(p=>String(p.id)===btn.dataset.v420Add);
 if(match)doc.dispatchEvent(new CustomEvent('sgbuddy:trip-add-place',{detail:{place:match}}));
});
schedule();
