/* SGBuddy V2.6 — My Trip: local, editable itinerary. No cloud sync or booking. */
import {STORE_KEY,MAX_TRIPS,MAX_DAYS,newTrip,dayDate,validPlace,addStop,moveStop,moveDay,editStop,hydrate,shareText,dayOverview,dayWalkingRouteUrl,updateTripDetails,groupUntimedStopsByArea,dayRouteUrl} from './lib/trip-v260.mjs';
import {normalizeLocale} from './lib/i18n-v280.mjs';
import {translatedTrip} from './lib/i18n-trip-v280.mjs';
import {matchingEventDay,eventFallbackDate,eventTripPlace} from './lib/events-explore-v414.mjs';
import {eventExploreText} from './lib/events-explore-i18n-v414.mjs';
const core=window.SGBUDDY_CORE,doc=document,discover=doc.getElementById('discoverHub');
if(core&&discover){
 const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const $=s=>doc.querySelector(s);
 const lang=()=>normalizeLocale(window.SGBUDDY_LANGUAGE);
 const labels={
 en:{title:'My Trip',intro:'Build a flexible day-by-day Singapore itinerary from SGBuddy places or add your own stop.',device:'Trips are saved on this device only, not synced to your account. Export a copy before clearing browser data or changing devices.',create:'Create trip',newTrip:'New trip',name:'Trip name',start:'Start date',days:'Days',choose:'Current trip',delete:'Delete trip',add:'Add to Day',day:'Day',empty:'No stops yet. Search the directory or add a custom stop below.',search:'Find a place in SGBuddy',searchHint:'Type at least 2 letters to search the place directory.',searchWait:'Loading directory. You can add a custom stop.',manual:'Add your own stop',customName:'Place or activity name',customArea:'Area / address (optional)',addCustom:'Add custom stop',note:'Notes',time:'Time (optional)',remove:'Remove',up:'Move up',down:'Move down',copy:'Share / copy plan',download:'Download .txt',noTrip:'Start by creating a trip, or add a place from Discover to make a three-day draft.',saved:'Saved on this device',saveFailed:'Could not save: device storage is full or unavailable.',added:'Added to your plan',exists:'Already in this day, or day is full.',limit:'Maximum of eight trips per device.',confirm:'Delete this trip and all its planned stops?',warning:'Planning guide only — opening hours, entrance locations and prices may change. Stops do not create reservations. Journey times are not estimated.',notVerified:'Location and opening hours have not been verified.',map:'Search on Maps ↗',moveTo:'Move to day',selectDay:'Selected day',copied:'Itinerary copied to clipboard.',notCopied:'Sharing is unavailable; use Download .txt instead.',directory:'Explore places',selected:'Planned stops',visit:'Visited'},
 zh:{title:'我的行程',intro:'使用 SGBuddy 地点或自定义活动，安排新加坡每日行程。',device:'行程仅储存在本设备，不会同步到帐户。清除浏览器数据或更换设备前请导出备份。',create:'建立行程',newTrip:'新行程',name:'行程名称',start:'开始日期',days:'天数',choose:'当前行程',delete:'删除行程',add:'加入第',day:'第',empty:'尚无安排。请搜索地点或添加自定义活动。',search:'搜索 SGBuddy 地点',searchHint:'输入至少两个字母搜索地点资料库。',searchWait:'地点资料库载入中；您仍可添加自定义活动。',manual:'添加自定义活动',customName:'地点或活动名称',customArea:'地区／地址（选填）',addCustom:'添加活动',note:'备注',time:'时间（选填）',remove:'移除',up:'上移',down:'下移',copy:'分享／复制行程',download:'下载 .txt',noTrip:'先建立行程，或从探索添加地点自动建立三日草稿。',saved:'已保存在本设备',saveFailed:'无法保存：本设备储存空间可能不足。',added:'已加入行程',exists:'当日已有此地点，或已达上限。',limit:'每台设备最多储存八个行程。',confirm:'确定删除此行程和所有地点？',warning:'此功能仅供规划。营业时间、入口和价格可能变化，行程不等于预订，也不提供预计车程。',notVerified:'地点或营业时间尚未核实。',map:'在地图上搜索 ↗',moveTo:'移至第',selectDay:'所选日期',copied:'行程已复制。',notCopied:'无法分享，请使用下载 .txt。',directory:'浏览地点',selected:'已规划地点',visit:'已完成'}
 };
 const evText=key=>eventExploreText(lang(),key);
 const v312=(key,english)=>window.SGBUDDY_V312?.text(lang(),key)||english;
  const text=()=>translatedTrip(lang(),labels.en,labels.zh),localDay=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day};
 let data;try{data=hydrate(JSON.parse(localStorage.getItem(STORE_KEY)||'{}'))}catch{data=hydrate({})}
 let routeMode='walking',selectedDay=0,showPanel=false,catalogue=window.SGBUDDY_DISCOVER_PLACES||null,message='',query='';
 const host=doc.createElement('section');host.id='myTripPlanner';host.className='card my-trip-v260';host.hidden=true;host.setAttribute('role','tabpanel');host.setAttribute('aria-labelledby','discoverTab-trip');
 discover.insertBefore(host,$('#discoverResults'));
 const active=()=>data.trips.find(t=>t.id===data.activeId)||null;
 const save=()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(data));doc.dispatchEvent(new CustomEvent('sgbuddy:trip-updated',{detail:{total:data.trips.length}}));return true}catch{message=text().saveFailed;return false}};
 const fmt=(date)=>{try{return new Intl.DateTimeFormat(lang()==='en'?'en-SG':lang(),{month:'short',day:'numeric',weekday:'short',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'))}catch{return date}};
 const directions=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([p.name,p.address||p.area,'Singapore'].filter(Boolean).join(', '));
 const formatDay=(i,trip)=>{
   const n=i+1,language=lang(),day=language==='zh-CN'||language==='zh-TW'?'第'+n+'天':language==='ja'?n+'日目':language==='ko'?n+'일차':language==='th'?'วันที่ '+n:text().day+' '+n;
   return day+' · '+fmt(dayDate(trip.startDate,i));
  };
 const options=trip=>trip.days.map((_,i)=>'<option value="'+i+'" '+(selectedDay===i?'selected':'')+'>'+escapeHTML(formatDay(i,trip))+'</option>').join('');
 function searchMarkup(){
  const s=text();
  if(!catalogue)return '<p class="trip-helper">'+escapeHTML(s.searchWait)+'</p>';
  const q=query.trim().toLowerCase();if(q.length<2)return '<p class="trip-helper">'+escapeHTML(s.searchHint)+'</p>';
  const rows=catalogue.filter(p=>p&&p.id&&p.name&&[p.name,p.area,p.category,p.address].join(' ').toLowerCase().includes(q)).slice(0,8);
  return rows.length?rows.map(p=>'<div class="trip-search-result"><div><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML([p.area,p.category].filter(Boolean).join(' · '))+'</small></div><button class="secondary" type="button" data-trip-add-search="'+escapeHTML(p.id)+'">'+escapeHTML(s.add)+' '+(selectedDay+1)+'</button></div>').join(''):'<p class="trip-helper">'+escapeHTML(({en:'No matching places · Try a different name','zh-CN':'没有匹配地点，请尝试其他名称','zh-TW':'沒有符合的地點，請換個名稱',ms:'Tiada tempat sepadan · Cuba nama lain',id:'Tidak ada tempat cocok · Coba nama lain',ja:'該当する場所がありません。別の名前をお試しください。',ko:'검색 결과가 없습니다. 다른 이름을 시도하세요.',th:'ไม่พบสถานที่ ลองชื่ออื่น',vi:'Không tìm thấy địa điểm · Thử tên khác',fr:'Aucun lieu trouvé · Essayez un autre nom',es:'No hay lugares · Prueba otro nombre','pt-BR':'Nenhum local encontrado · Tente outro nome'})[lang()]||'No matching places')+'</p>';
 }

 const dayInsightLabels={"en":["Day check","Timed","Time clashes","Without street address","Open walking route ↗","First five stops only","Maps calculates the route; no confirmed times or admission."],"zh-CN":["当日检查","定时","时间冲突","缺少街道地址","打开步行路线 ↗","仅前五站","地图负责规划路线；时间和入场未获核实。"],"zh-TW":["當日檢查","定時","時間衝突","缺少街道地址","開啟步行路線 ↗","僅前五站","地圖負責規劃路線；時間及入場未獲核實。"],"ms":["Semakan hari","Masa","Masa bertindih","Tiada alamat","Buka laluan berjalan ↗","Lima hentian pertama","Peta mengira laluan; masa dan kemasukan tidak disahkan."],"id":["Periksa hari","Terjadwal","Bentrok waktu","Alamat kurang","Buka rute jalan kaki ↗","Lima pemberhentian pertama","Peta menentukan rute; waktu dan akses belum dikonfirmasi."],"ja":["1日の確認","時刻指定","時間重複","住所未入力","徒歩ルートを開く ↗","最初の5か所","経路は地図で計算。営業時間と入場条件は未確認です。"],"ko":["하루 점검","시간 지정","시간 중복","주소 없음","도보 경로 열기 ↗","첫 5곳만","경로는 지도가 계산하며 입장 및 운영 시간은 미확인입니다."],"th":["ตรวจแผนรายวัน","ตั้งเวลา","เวลาซ้ำ","ไม่มีที่อยู่","เปิดเส้นทางเดิน ↗","เฉพาะห้าจุดแรก","แผนที่คำนวณเส้นทาง ยังไม่ยืนยันเวลาและการเข้าชม"],"vi":["Kiểm tra ngày","Có giờ","Trùng giờ","Thiếu địa chỉ","Mở đường đi bộ ↗","Chỉ năm điểm đầu","Bản đồ tính đường; giờ và quyền vào chưa được xác nhận."],"fr":["Vérification du jour","Horaires","Conflits","Adresses manquantes","Ouvrir trajet à pied ↗","Cinq premières étapes","Carte calcule le trajet ; horaires et accès non confirmés."],"es":["Revisión del día","Con hora","Conflictos","Sin dirección","Abrir ruta a pie ↗","Solo cinco primeras paradas","Mapa calcula la ruta; horarios y acceso sin confirmar."],"pt-BR":["Revisão do dia","Com horário","Conflitos","Sem endereço","Abrir rota a pé ↗","Só as cinco primeiras paradas","Mapa calcula a rota; horários e acesso não confirmados."]};
 function dayInsightsMarkup(trip){
  const stat=dayOverview(trip,selectedDay),l=dayInsightLabels[lang()]||dayInsightLabels.en;
  const route=dayRouteUrl(trip,selectedDay,{mode:routeMode}),t=editLabels();
  return '<aside class="trip-day-insights" data-trip-day-insights><strong>'+escapeHTML(l[0])+'</strong><p>'+
   escapeHTML(l[1]+': '+stat.timed+'/'+stat.count+' · '+l[2]+': '+stat.timeConflicts+' · '+l[3]+': '+stat.missingAddress)+'</p>'+
   (route?'<a class="trip-day-route" data-trip-walking-route target="_blank" rel="noopener noreferrer" href="'+escapeHTML(route)+'">'+escapeHTML(l[4])+(stat.count>5?' · '+escapeHTML(l[5]):'')+'</a>':'')+
   '<label class="trip-route-mode">'+escapeHTML(t[5])+'<select data-trip-route-mode aria-label="'+escapeHTML(t[5])+'">'+
  '<option value="walking" '+(routeMode==='walking'?'selected':'')+'>'+escapeHTML(t[6])+'</option>'+
  '<option value="driving" '+(routeMode==='driving'?'selected':'')+'>'+escapeHTML(t[7])+'</option></select></label>'+
  '<button type="button" class="secondary" data-trip-group-area>'+escapeHTML(t[8])+'</button>'+
  '<small>'+escapeHTML(t[9])+' '+escapeHTML(l[6])+'</small></aside>';
 }
 const tripEditLabels={"en":["Edit itinerary","Save changes","Updated itinerary","Cannot shorten: later days still contain stops","Invalid trip details","Route mode","Walking","Driving","Group untimed stops by area","Areas are text labels, not verified distances; timed stops stay in place.","No changes to group"],"zh-CN":["编辑行程","保存更改","行程已更新","后面的日期有安排，不能缩短","行程资料无效","路线方式","步行","驾车","按区域分组未定时地点","区域只是文字标签，非已核实距离；定时地点不移动。","无需分组"],"zh-TW":["編輯行程","儲存更改","行程已更新","後面的日期有安排，不能縮短","行程資料無效","路線方式","步行","開車","按地區分組未定時地點","地區只屬文字標籤，非已核實距離；定時地點不移動。","無須分組"],"ms":["Edit perjalanan","Simpan perubahan","Perjalanan dikemas kini","Hari kemudian mengandungi hentian","Butiran perjalanan tidak sah","Mod laluan","Berjalan","Memandu","Kumpulkan hentian tanpa masa mengikut kawasan","Kawasan ialah label teks; jarak tidak disahkan. Masa tetap tidak diubah.","Tiada perubahan"],"id":["Ubah perjalanan","Simpan perubahan","Perjalanan diperbarui","Hari berikutnya masih memiliki pemberhentian","Detail perjalanan tidak valid","Mode rute","Berjalan","Berkendara","Kelompokkan tempat tanpa jadwal menurut area","Area hanya label teks, bukan jarak terverifikasi. Jadwal tetap tidak digeser.","Tidak ada perubahan"],"ja":["旅程を編集","変更を保存","旅程を更新しました","後の日付に予定があり短縮できません","旅程情報が無効です","ルート方式","徒歩","車","時間未設定の場所をエリア別に整理","エリアは自己申告の文字情報で、距離は未確認です。時間指定は動かしません。","変更なし"],"ko":["여행 일정 수정","변경 저장","일정이 수정되었습니다","뒤쪽 날짜에 장소가 있어 줄일 수 없습니다","잘못된 일정 정보","경로 방식","도보","자동차","시간 없는 장소를 지역별로 묶기","지역은 텍스트 정보로 거리 검증이 아닙니다. 시간 지정 장소는 이동하지 않습니다.","변경 없음"],"th":["แก้ไขแผนเที่ยว","บันทึกการเปลี่ยนแปลง","อัปเดตแผนแล้ว","ไม่สามารถลดวันเพราะยังมีจุดแวะ","ข้อมูลการเดินทางไม่ถูกต้อง","รูปแบบเส้นทาง","เดิน","ขับรถ","จัดจุดที่ยังไม่กำหนดเวลาตามพื้นที่","พื้นที่เป็นเพียงข้อความ ไม่ใช่ระยะทางจริง จุดกำหนดเวลาไม่ถูกย้าย","ไม่เปลี่ยนแปลง"],"vi":["Sửa hành trình","Lưu thay đổi","Đã cập nhật hành trình","Ngày sau vẫn có điểm dừng","Thông tin hành trình không hợp lệ","Chế độ đường đi","Đi bộ","Lái xe","Nhóm điểm chưa đặt giờ theo khu vực","Khu vực là nhãn chữ, không phải khoảng cách xác thực. Điểm có giờ không đổi.","Không cần nhóm"],"fr":["Modifier le voyage","Enregistrer","Voyage modifié","Des arrêts existent dans les derniers jours","Détails du voyage invalides","Mode de trajet","À pied","En voiture","Regrouper les arrêts sans heure par quartier","Quartiers déclarés, distances non vérifiées. Les horaires restent en place.","Aucun changement"],"es":["Editar viaje","Guardar cambios","Viaje actualizado","Hay paradas en los últimos días","Datos del viaje no válidos","Modo de ruta","A pie","En coche","Agrupar paradas sin hora por zona","Las zonas son etiquetas, no distancias verificadas; los horarios no cambian.","Sin cambios"],"pt-BR":["Editar viagem","Salvar alterações","Viagem atualizada","Há paradas nos últimos dias","Dados da viagem inválidos","Tipo de rota","A pé","De carro","Agrupar paradas sem horário por região","Regiões são rótulos, não distâncias verificadas. Paradas com horário não mudam.","Sem alterações"]};
 const editLabels=()=>tripEditLabels[lang()]||tripEditLabels.en;
 const tripEditMarkup=trip=>{const l=editLabels(),s=text();
 return '<details class="trip-edit-details"><summary>'+escapeHTML(l[0])+'</summary><form id="tripEditForm" class="trip-new-form">'+
 '<label>'+escapeHTML(s.name)+'<input name="name" maxlength="90" required value="'+escapeHTML(trip.name)+'"></label>'+
 '<label>'+escapeHTML(s.start)+'<input type="date" name="start" required value="'+escapeHTML(trip.startDate)+'"></label>'+
 '<label>'+escapeHTML(s.days)+'<input type="number" min="1" max="'+MAX_DAYS+'" name="days" required value="'+trip.days.length+'"></label>'+
 '<button type="submit" class="primary">'+escapeHTML(l[1])+'</button></form></details>';
 };
 function stopMarkup(trip,stop,index){
  const s=text(),p=stop.place,canUp=index>0,canDown=index<trip.days[selectedDay].length-1;
  return '<article class="trip-stop" data-trip-stop="'+index+'"><div class="trip-stop-head"><span class="trip-stop-index">'+(index+1)+'</span><div class="trip-stop-name"><h4>'+escapeHTML(p.name)+'</h4><p>'+escapeHTML([p.area,p.kind].filter(Boolean).join(' · '))+'</p></div><label class="trip-done"><input type="checkbox" data-trip-done="'+index+'" '+(stop.done?'checked':'')+' /><span>'+escapeHTML(s.visit)+'</span></label></div>'+
   '<div class="trip-stop-edit"><label>'+escapeHTML(s.time)+'<input type="time" data-trip-time="'+index+'" value="'+escapeHTML(stop.time)+'" /></label><label>'+escapeHTML(s.note)+'<textarea data-trip-note="'+index+'" maxlength="280" rows="2">'+escapeHTML(stop.note)+'</textarea></label></div>'+
   '<div class="trip-stop-actions"><a href="'+escapeHTML(directions(p))+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(s.map)+'</a>'+(p.kind==='Event'&&p.sourceUrl?'<a href="'+escapeHTML(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(evText('officialEvent'))+'</a>':'')+'<button type="button" class="secondary" data-trip-up="'+index+'" '+(!canUp?'disabled':'')+' aria-label="'+escapeHTML(s.up)+'">↑</button><button type="button" class="secondary" data-trip-down="'+index+'" '+(!canDown?'disabled':'')+' aria-label="'+escapeHTML(s.down)+'">↓</button><label class="trip-transfer">'+escapeHTML(s.moveTo)+' <select data-trip-transfer="'+index+'" aria-label="'+escapeHTML(s.moveTo)+'"><option value="">—</option>'+trip.days.map((_,d)=>d===selectedDay?'':'<option value="'+d+'">'+(d+1)+'</option>').join('')+'</select></label><button type="button" class="secondary trip-remove" data-trip-remove="'+index+'">'+escapeHTML(s.remove)+'</button></div></article>';
 }
 function render(){
  const s=text(),trip=active();if(trip&&selectedDay>=trip.days.length)selectedDay=0;
  const creation='<details id="tripCreateDetails" '+(!trip||showPanel?'open':'')+'><summary>'+escapeHTML(s.newTrip)+'</summary><form id="tripCreateForm" class="trip-new-form"><label>'+escapeHTML(s.name)+'<input id="tripNewName" name="name" maxlength="90" required placeholder="'+escapeHTML(v312('tripNamePlaceholder','Singapore getaway'))+'" /></label><label>'+escapeHTML(s.start)+'<input id="tripStartDate" name="start" type="date" value="'+localDay()+'" required /></label><label>'+escapeHTML(s.days)+'<input id="tripNumberOfDays" name="days" type="number" min="1" max="'+MAX_DAYS+'" value="3" required /></label><button type="submit" class="primary">'+escapeHTML(s.create)+'</button></form></details>';
  host.innerHTML='<header class="trip-heading"><div class="label">'+escapeHTML(s.title)+' · SGBUDDY V2.6</div><h3>'+escapeHTML(s.title)+'</h3><p>'+escapeHTML(s.intro)+'</p></header><p class="trip-privacy">'+escapeHTML(s.device)+'</p>'+
   creation+(trip?'<div class="trip-active"><label>'+escapeHTML(s.choose)+'<select id="tripSelect">'+data.trips.map(t=>'<option value="'+escapeHTML(t.id)+'" '+(t.id===data.activeId?'selected':'')+'>'+escapeHTML(t.name)+'</option>').join('')+'</select></label><button class="secondary trip-delete" type="button" id="tripDelete">'+escapeHTML(s.delete)+'</button></div>'+tripEditMarkup(trip)+
   '<div class="trip-day-tabs" role="group" aria-label="'+escapeHTML(s.selectDay)+'">'+trip.days.map((day,i)=>'<button data-trip-day="'+i+'" aria-pressed="'+(selectedDay===i)+'" type="button">'+escapeHTML(formatDay(i,trip))+' <span>('+day.length+')</span></button>').join('')+'</div>'+
   '<section class="trip-day-panel"><div class="trip-day-head"><h4>'+escapeHTML(formatDay(selectedDay,trip))+'</h4><span>'+trip.days[selectedDay].length+' '+escapeHTML(s.selected)+'</span></div>'+dayInsightsMarkup(trip)+'<div class="trip-stops">'+(trip.days[selectedDay].length?trip.days[selectedDay].map((stop,i)=>stopMarkup(trip,stop,i)).join(''):'<p class="trip-empty">'+escapeHTML(s.empty)+'</p>')+'</div>'+
   '<div class="trip-add-panel"><label>'+escapeHTML(s.search)+'<input id="tripSearch" type="search" autocomplete="off" placeholder="'+escapeHTML(v312('tripSearchPlaceholder','Marina Bay, Chinatown, hawker centre…'))+'" value="'+escapeHTML(query)+'"/></label><div id="tripSearchResults" class="trip-search-results">'+searchMarkup()+'</div><form id="tripCustomForm" class="trip-custom-form"><strong>'+escapeHTML(s.manual)+'</strong><input name="customName" maxlength="140" required aria-label="'+escapeHTML(s.customName)+'" placeholder="'+escapeHTML(s.customName)+'"/><input name="customArea" maxlength="180" aria-label="'+escapeHTML(s.customArea)+'" placeholder="'+escapeHTML(s.customArea)+'"/><button type="submit" class="secondary">'+escapeHTML(s.addCustom)+'</button></form></div></section>'+
   '<div class="trip-export"><button type="button" class="primary" id="tripShare">'+escapeHTML(s.copy)+'</button><button type="button" class="secondary" id="tripDownload">'+escapeHTML(s.download)+'</button><button type="button" class="secondary" id="tripBrowse">'+escapeHTML(s.directory)+'</button></div>':'<p class="trip-empty">'+escapeHTML(s.noTrip)+'</p>')+
   '<p class="trip-helper" id="tripMessage" role="status">'+escapeHTML(message||s.saved)+'</p><p class="trip-warning">'+escapeHTML(s.warning)+'</p>';
  doc.dispatchEvent(new CustomEvent('sgbuddy:trip-rendered'));
 }
 function add(place,day=selectedDay){
  let trip=active();if(!trip){if(data.trips.length>=MAX_TRIPS){message=text().limit;render();return}trip=newTrip(v312('defaultTripName','My Singapore trip'),localDay(),3);data.trips.push(trip);data.activeId=trip.id;selectedDay=0;day=0}
  if(addStop(trip,day,place)){message=text().added+' · '+formatDay(day,trip);save()}else message=text().exists;
  render();
 }
 function activate(on){host.hidden=!on;if(on)render()}
 doc.addEventListener('sgbuddy:discover-tab',e=>activate(e.detail?.tab==='trip'));
 doc.addEventListener('sgbuddy:language',()=>{if(!host.hidden)render()});
 doc.addEventListener('sgbuddy:discover-places-ready',e=>{catalogue=e.detail?.places||null;if(!host.hidden)render()});
 doc.addEventListener('sgbuddy:trip-add-place',e=>{const place=validPlace(e.detail?.place);if(!place)return;add(place);core.toast?.(message)});
 host.addEventListener('submit',e=>{
  if(e.target.id==='tripCreateForm'){e.preventDefault();if(data.trips.length>=MAX_TRIPS){message=text().limit;render();return}const f=new FormData(e.target);try{const trip=newTrip(f.get('name'),String(f.get('start')||''),f.get('days'));data.trips.push(trip);data.activeId=trip.id;selectedDay=0;query='';showPanel=false;message='';save();render()}catch(err){message=err.message;$('#tripMessage').textContent=message}}
  if(e.target.id==='tripEditForm'){
   e.preventDefault();const trip=active();if(!trip)return;
   const f=new FormData(e.target),r=updateTripDetails(trip,{name:f.get('name'),startDate:f.get('start'),dayCount:f.get('days')});
   message=r.ok?editLabels()[2]:editLabels()[r.reason==='occupied-days'?3:4];
   if(r.ok){selectedDay=Math.min(selectedDay,trip.days.length-1);save();render()}
   else {const status=host.querySelector('#tripMessage');if(status)status.textContent=message}
   return;
  }
  if(e.target.id==='tripCustomForm'){e.preventDefault();const f=new FormData(e.target),name=String(f.get('customName')||'').trim(),area=String(f.get('customArea')||'').trim();if(!name)return;add({id:'manual-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name,area,kind:'Custom',status:'user-entered'});}
 });
 host.addEventListener('input',e=>{if(e.target.id==='tripSearch'){query=e.target.value;$('#tripSearchResults').innerHTML=searchMarkup()}});
 host.addEventListener('change',e=>{
  const el=e.target,trip=active();if(el.id==='tripSelect'){data.activeId=el.value;selectedDay=0;query='';save();render();return}
  if(!trip)return;
  if(el.matches('[data-trip-route-mode]')){routeMode=el.value==='driving'?'driving':'walking';const aside=host.querySelector('[data-trip-day-insights]');if(aside)aside.outerHTML=dayInsightsMarkup(trip);return}
  let idx;
  if(el.matches('[data-trip-time]')){idx=Number(el.dataset.tripTime);editStop(trip.days[selectedDay][idx],'time',el.value);save();const box=host.querySelector('[data-trip-day-insights]');if(box)box.outerHTML=dayInsightsMarkup(trip);return}
  if(el.matches('[data-trip-note]')){idx=Number(el.dataset.tripNote);editStop(trip.days[selectedDay][idx],'note',el.value);save();return}
  if(el.matches('[data-trip-done]')){idx=Number(el.dataset.tripDone);editStop(trip.days[selectedDay][idx],'done',el.checked);save();return}
  if(el.matches('[data-trip-transfer]')){idx=Number(el.dataset.tripTransfer);if(el.value!==''&&moveDay(trip,selectedDay,idx,Number(el.value))){save();render()}}
 });
 host.addEventListener('click',async e=>{
  const btn=e.target.closest('button');if(!btn)return;
  const trip=active();
  if(btn.hasAttribute('data-trip-day')){selectedDay=Number(btn.dataset.tripDay);query='';render();return}
  if(btn.hasAttribute('data-trip-add-search')){const p=catalogue?.find(x=>x.id===btn.dataset.tripAddSearch);if(p)add(p);return}
  if(btn.id==='tripBrowse'){$('[data-discover-tab="do"]')?.click();return}
  if(btn.id==='tripDelete'&&trip){if(!confirm(text().confirm))return;data.trips=data.trips.filter(x=>x.id!==trip.id);data.activeId=data.trips[0]?.id||null;selectedDay=0;save();render();return}
  if(!trip)return;
  if(btn.hasAttribute('data-trip-group-area')){
   const changed=groupUntimedStopsByArea(trip,selectedDay);
   message=changed?editLabels()[2]:editLabels()[10];if(changed)save();render();return;
  }
  for(const [key,fn] of [['tripUp',i=>moveStop(trip,selectedDay,i,-1)],['tripDown',i=>moveStop(trip,selectedDay,i,1)],['tripRemove',i=>{trip.days[selectedDay].splice(i,1);return true}]]){
   if(btn.dataset[key]!==undefined){if(fn(Number(btn.dataset[key]))){save();render()}return}
  }
  if(btn.id==='tripDownload'){const blob=new Blob([shareText(trip)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='sgbuddy-trip-'+trip.startDate+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return}
  if(btn.id==='tripShare'){
   const value=shareText(trip);
   try{if(navigator.share){await navigator.share({title:trip.name,text:value});return}if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(value);message=text().copied}catch{message=text().notCopied}
   $('#tripMessage').textContent=message;return;
  }
 });
 window.SGBUDDY_TRIP_API={
  getActive:()=>active(),
  addEvent:event=>{
   const place=eventTripPlace(event),when=eventFallbackDate(event,localDay());
   if(!place||!when)return {ok:false,reason:'invalid'};
   const previous=active(),prevId=data.activeId,prevSelected=selectedDay;
   let trip=previous,index=matchingEventDay(trip,event),created=false;
   if(index<0){
    if(data.trips.length>=MAX_TRIPS)return {ok:false,reason:'limit'};
    trip=newTrip(event.title,when,1);
    data.trips.push(trip);data.activeId=trip.id;selectedDay=0;index=0;created=true;
   }
   if(!addStop(trip,index,place)){
    if(created){data.trips.pop();data.activeId=prevId;selectedDay=prevSelected}
    return {ok:false,reason:'duplicate'};
   }
   selectedDay=index;message=evText(created?'newTrip':'addedTrip');
   if(!save()){
    trip.days[index].pop();
    if(created){data.trips.pop();data.activeId=prevId}
    selectedDay=prevSelected;
    render();return {ok:false,reason:'storage'};
   }
   render();
   return {ok:true,created,tripId:trip.id,dayIndex:index};
  },
  importCopy:incoming=>{
   if(data.trips.length>=MAX_TRIPS)return {ok:false,message:text().limit};
   if(!incoming?.days?.length||incoming.days.length>MAX_DAYS)return {ok:false,message:'Invalid trip'};
   const copy=newTrip(incoming.name,incoming.startDate,incoming.days.length);
   for(let day=0;day<copy.days.length;day++){
    for(const stop of incoming.days[day]){
     if(!addStop(copy,day,stop.place))return {ok:false,message:'Cannot import duplicate or invalid stop'};
     const target=copy.days[day].at(-1);
     editStop(target,'time',stop.time);editStop(target,'note',stop.note);editStop(target,'done',stop.done);
    }
   }
   data.trips.push(copy);data.activeId=copy.id;selectedDay=0;query='';message='';if(!save()){data.trips.pop();data.activeId=data.trips[0]?.id||null;return {ok:false,message:text().saveFailed}}
   render();return {ok:true,tripId:copy.id};
  },
  open:()=>{doc.getElementById('navPlaces')?.click();doc.getElementById('discoverTab-trip')?.click()}
 };
 render();
}
