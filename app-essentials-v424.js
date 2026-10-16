/* SGBuddy V4.24 — progressive enhancement of existing five-tab shell. */
import {OFFICIAL_LINKS,EMERGENCY_CONTACTS,arrivalTasks,sgacRequired,sgacWindow,singaporeDay,validDay,daysUntil,officialUrl,visibleNotices} from './lib/essentials-v424.mjs';
(()=>{
'use strict';
const d=document, $=s=>d.querySelector(s);
const core=window.SGBUDDY_CORE,router=window.SGBUDDY_VIEW_ROUTER;
if(!core||!router?.show||!$('#accountSection'))return;
const STORE='sgc-v424-arrival';
const modes=['resident','visitor','executive','student','new_in_sg'];
const labels={
 en:['Singapore Essentials','Arrival checklist','Government updates','Emergency help','Check Singapore entry rules before you travel.','Verified government sources; summaries are not live alerts.','Call emergency services','Offline-ready contact numbers','Your arrival details stay on this device.','Save details','Official source','Reviewed','View details','Status','Arrival by','Date of arrival','I will clear Singapore immigration','Can I bring this?','Search items such as medicine or vapes','No matching items','Need the SG Arrival Card','SG Arrival Card exemption may apply','Add an arrival date to see the submission window.','Check official requirements; some rules change.','Show essentials','Important notices','No verified notices for this mode.','Source summaries are in English; follow the official site for authoritative wording.'],
 'zh-CN':['新加坡实用指南','入境清单','政府公告','紧急求助','出行前查看新加坡入境要求。','政府来源已核实；摘要不是实时警报。','拨打紧急电话','离线可用的联系电话','入境资料仅保存在本设备。','保存','官方来源','核实日期','查看详情','身份','入境方式','抵达日期','我会办理新加坡入境手续','可以携带吗？','搜索药品或电子烟等物品','未找到物品','需要填写入境卡','可能符合入境卡豁免条件','填写抵达日期以查看提交时段。','请确认官方要求，规定可能变更。','打开指南','重要通知','此模式暂无已核实通知。','摘要为英文；请以官方网站为准。'],
 'zh-TW':['新加坡實用指南','入境清單','政府公告','緊急求助','出行前查看新加坡入境規定。','政府來源已核實；摘要並非即時警報。','撥打緊急電話','離線可用的電話','入境資料只儲存在本裝置。','儲存','官方來源','核實日期','查看詳情','身分','入境方式','抵達日期','我會辦理新加坡入境手續','可以攜帶嗎？','搜尋藥物或電子煙等物品','找不到物品','需要填寫入境卡','可能符合入境卡豁免條件','填寫抵達日期以查看提交時段。','請確認官方規定，內容可能變更。','開啟指南','重要通知','此模式沒有已核實的通知。','摘要為英文；請以官方網站為準。'],
 ms:['Keperluan Singapura','Senarai semak ketibaan','Kemas kini kerajaan','Bantuan kecemasan','Semak syarat kemasukan sebelum perjalanan.','Sumber kerajaan disemak; ringkasan bukan amaran langsung.','Hubungi kecemasan','Nombor tersedia luar talian','Maklumat ketibaan kekal pada peranti ini.','Simpan','Sumber rasmi','Disemak','Butiran','Status','Cara masuk','Tarikh tiba','Saya akan melalui imigresen Singapura','Boleh bawa masuk?','Cari ubat atau vape','Tiada padanan','SG Arrival Card diperlukan','Pengecualian mungkin terpakai','Pilih tarikh tiba untuk tempoh penyerahan.','Semak syarat rasmi; peraturan boleh berubah.','Buka panduan','Notis penting','Tiada notis disahkan untuk mod ini.','Ringkasan dalam bahasa Inggeris; rujuk laman rasmi.'],
 id:['Panduan Singapura','Daftar kedatangan','Info pemerintah','Bantuan darurat','Periksa syarat masuk sebelum bepergian.','Sumber pemerintah terverifikasi; bukan peringatan langsung.','Hubungi layanan darurat','Nomor tersedia offline','Detail kedatangan hanya tersimpan di perangkat ini.','Simpan','Sumber resmi','Diperiksa','Detail','Status','Jalur masuk','Tanggal tiba','Saya akan melewati imigrasi Singapura','Boleh dibawa?','Cari obat atau vape','Tidak ditemukan','SG Arrival Card diperlukan','Mungkin dikecualikan','Pilih tanggal tiba untuk jendela pengiriman.','Periksa aturan resmi; dapat berubah.','Buka panduan','Pemberitahuan penting','Belum ada pengumuman terverifikasi.','Ringkasan berbahasa Inggris; rujuk situs resmi.'],
 ja:['シンガポール基本情報','入国チェックリスト','政府のお知らせ','緊急時の連絡先','渡航前に入国条件を確認してください。','政府情報を確認済み。リアルタイム警報ではありません。','緊急電話をかける','オフライン対応の連絡先','入国情報はこの端末にのみ保存されます。','保存','公式サイト','確認日','詳細','在留資格','入国方法','到着日','シンガポールの入国審査を受ける','持ち込み可能？','薬や電子たばこなどを検索','該当なし','入国カードが必要','免除対象の可能性','到着日を設定してください。','公式条件を再確認してください。','ガイドを開く','重要なお知らせ','確認済みのお知らせはありません。','要約は英語です。公式サイトをご確認ください。'],
 ko:['싱가포르 필수 정보','입국 체크리스트','정부 소식','긴급 도움','여행 전 입국 요건을 확인하세요.','정부 출처 확인됨. 실시간 경보가 아닙니다.','긴급 전화','오프라인 연락처','입국 정보는 이 기기에만 저장됩니다.','저장','공식 출처','확인일','자세히','신분','입국 방법','도착일','싱가포르 입국 심사를 받습니다','반입 가능할까요?','의약품 또는 전자담배 검색','결과 없음','입국 카드 필요','면제 대상일 수 있음','도착일을 선택하세요.','공식 요건을 다시 확인하세요.','가이드 열기','중요 공지','확인된 공지가 없습니다.','요약은 영어입니다. 공식 웹사이트를 확인하세요.'],
 th:['ข้อมูลจำเป็นสิงคโปร์','เช็กลิสต์เข้าประเทศ','ข่าวรัฐบาล','ความช่วยเหลือฉุกเฉิน','ตรวจสอบข้อกำหนดก่อนเดินทาง','แหล่งข้อมูลทางการ ไม่ใช่การเตือนแบบสด','โทรฉุกเฉิน','หมายเลขใช้งานออฟไลน์','ข้อมูลการเดินทางเก็บไว้ในอุปกรณ์นี้','บันทึก','แหล่งทางการ','ตรวจสอบเมื่อ','รายละเอียด','สถานะ','ช่องทางเข้า','วันเดินทางถึง','ฉันจะผ่านด่านตรวจคนเข้าเมือง','นำเข้ามาได้ไหม?','ค้นหายาหรือบุหรี่ไฟฟ้า','ไม่พบ','ต้องส่ง SG Arrival Card','อาจได้รับยกเว้น','เลือกวันเดินทางถึง','ตรวจสอบกฎทางการอีกครั้ง','เปิดคู่มือ','ประกาศสำคัญ','ไม่มีประกาศที่ยืนยันแล้ว','สรุปเป็นภาษาอังกฤษ โปรดตรวจสอบเว็บไซต์ทางการ'],
 vi:['Thông tin thiết yếu Singapore','Danh sách nhập cảnh','Tin chính phủ','Hỗ trợ khẩn cấp','Kiểm tra quy định trước chuyến đi.','Nguồn chính phủ đã kiểm tra; không phải cảnh báo trực tiếp.','Gọi khẩn cấp','Số điện thoại ngoại tuyến','Thông tin chỉ lưu trên thiết bị này.','Lưu','Nguồn chính thức','Đã kiểm tra','Chi tiết','Tình trạng','Đường nhập cảnh','Ngày đến','Tôi sẽ làm thủ tục nhập cảnh','Có thể mang vào?','Tìm thuốc hoặc vape','Không có kết quả','Cần SG Arrival Card','Có thể được miễn','Chọn ngày đến để xem thời gian nộp.','Kiểm tra lại quy định chính thức.','Mở hướng dẫn','Thông báo quan trọng','Không có thông báo đã xác minh.','Tóm tắt bằng tiếng Anh; xem trang chính thức.'],
 fr:['Essentiels de Singapour','Liste d’arrivée','Actualités officielles','Aide d’urgence','Vérifiez les conditions d’entrée avant de partir.','Sources vérifiées, pas des alertes en direct.','Appeler les secours','Numéros accessibles hors ligne','Vos données restent sur cet appareil.','Enregistrer','Source officielle','Vérifié le','Détails','Statut','Mode d’entrée','Date d’arrivée','Je passerai le contrôle migratoire','Puis-je apporter ceci ?','Chercher médicament ou vapoteuse','Aucun résultat','SG Arrival Card requise','Exemption possible','Choisissez une date pour la période de dépôt.','Vérifiez les règles officielles.','Ouvrir le guide','Avis importants','Aucun avis vérifié pour ce profil.','Résumés en anglais ; consultez le site officiel.'],
 es:['Esenciales de Singapur','Lista de llegada','Avisos oficiales','Ayuda de emergencia','Consulta los requisitos de entrada antes de viajar.','Fuentes verificadas, no alertas en directo.','Llamar a emergencias','Teléfonos disponibles sin conexión','Tus datos permanecen en este dispositivo.','Guardar','Fuente oficial','Verificado','Detalles','Estatus','Medio de entrada','Fecha de llegada','Pasaré por inmigración','¿Puedo llevarlo?','Buscar medicinas o vapeadores','Sin resultados','Se requiere SG Arrival Card','Posible exención','Elige la fecha de llegada para ver el plazo.','Comprueba las normas oficiales.','Abrir guía','Avisos importantes','No hay avisos verificados para este perfil.','Resúmenes en inglés; consulta el sitio oficial.'],
 'pt-BR':['Essenciais de Singapura','Checklist de chegada','Avisos do governo','Ajuda de emergência','Confira os requisitos de entrada antes de viajar.','Fontes verificadas; não são alertas ao vivo.','Ligar para emergência','Números disponíveis offline','Seus dados ficam neste dispositivo.','Salvar','Fonte oficial','Verificado em','Detalhes','Status','Via de entrada','Data de chegada','Vou passar pela imigração','Posso levar isso?','Busque remédios ou vapes','Nenhum resultado','SG Arrival Card necessário','Possível isenção','Selecione a chegada para ver o prazo.','Confira as regras oficiais.','Abrir guia','Avisos importantes','Sem avisos verificados para este perfil.','Resumos em inglês; consulte o site oficial.']
};
const legalLabels={
 en:['Legal & feedback','Privacy','Accuracy','Terms','Feedback','Read full notice','Contact Omnidite'],
 'zh-CN':['法律与反馈','隐私','准确性','使用条款','反馈','阅读完整说明','联系 Omnidite'],
 'zh-TW':['法律與意見回饋','隱私','準確性','使用條款','意見回饋','閱讀完整說明','聯絡 Omnidite'],
 ms:['Undang-undang & maklum balas','Privasi','Ketepatan','Terma','Maklum balas','Baca notis penuh','Hubungi Omnidite'],
 id:['Hukum & masukan','Privasi','Akurasi','Ketentuan','Masukan','Baca pemberitahuan lengkap','Hubungi Omnidite'],
 ja:['法的情報とフィードバック','プライバシー','正確性','利用規約','ご意見','全文を読む','Omniditeに連絡'],
 ko:['법적 안내 및 의견','개인정보','정확성','이용 약관','의견','전체 안내 보기','Omnidite 문의'],
 th:['กฎหมายและข้อเสนอแนะ','ความเป็นส่วนตัว','ความถูกต้อง','ข้อกำหนด','ข้อเสนอแนะ','อ่านรายละเอียด','ติดต่อ Omnidite'],
 vi:['Pháp lý và góp ý','Quyền riêng tư','Độ chính xác','Điều khoản','Góp ý','Đọc toàn bộ','Liên hệ Omnidite'],
 fr:['Mentions légales et avis','Confidentialité','Exactitude','Conditions','Avis','Lire le texte complet','Contacter Omnidite'],
 es:['Avisos legales y comentarios','Privacidad','Exactitud','Condiciones','Comentarios','Leer el aviso completo','Contactar a Omnidite'],
 'pt-BR':['Termos legais e comentários','Privacidade','Precisão','Termos','Comentários','Leia o aviso completo','Contatar a Omnidite']
};
const locale=()=>{const v=String(window.SGBUDDY_LANGUAGE||'en').replace('_','-');return labels[v]?v:v==='zh'?'zh-CN':v==='pt'?'pt-BR':'en'};
const t=i=>labels[locale()][i];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safeLocal=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}};
const stored=safeLocal()||{};
const profile={status:stored.status||(['resident'].includes(core.state?.mode)?'citizen':'visitor'),border:stored.border||'air',clearsImmigration:stored.clearsImmigration!==false,arrivalDate:validDay(stored.arrivalDate)?stored.arrivalDate:'',completed:stored.completed&&typeof stored.completed==='object'?stored.completed:{}};
let feed={notices:[],reviewedAt:''},section='arrival',goodsQuery='';
const home=d.createElement('section');home.id='v424Home';home.className='v424-home card';home.setAttribute('aria-labelledby','v424HomeTitle');
const next=$('#nextUpCard');if(next)next.after(home);else $('.v1-view[data-view="today"]')?.prepend(home);
const more=d.createElement('section');more.id='v424Essentials';more.className='v424-panel card';more.setAttribute('aria-labelledby','v424Title');
$('#accountSection').appendChild(more);
const sos=d.createElement('button');sos.type='button';sos.id='v424SOS';sos.className='v424-sos';sos.setAttribute('aria-label','Emergency help');sos.textContent='SOS';$('.top-actions')?.prepend(sos);
const mode=()=>modes.includes(core.state?.mode)?core.state.mode:'resident';
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(profile))}catch{ /* private-mode storage disabled */ }};
function open(which='arrival'){
 section=which;
 router.show('account');
 paint();
 more.scrollIntoView({block:'start',behavior:'instant'});
 const tab=more.querySelector('[data-v424-tab="'+which+'"]');tab?.focus({preventScroll:true});
}
function paintHome(){
 home.innerHTML='<div class="v424-home-title"><div><div class="label">V4.24</div><h3 id="v424HomeTitle">'+esc(t(0))+'</h3></div><span aria-hidden="true">✦</span></div>'+
 '<p>'+esc(t(4))+'</p><div class="v424-home-actions">'+
 '<button type="button" data-v424-open="arrival">✓ '+esc(t(1))+'</button>'+
 '<button type="button" data-v424-open="notices">◇ '+esc(t(2))+'</button>'+
 '<button type="button" data-v424-open="emergency" class="v424-emergency-link">✚ '+esc(t(3))+'</button></div>'+ 
  '<p class="v424-home-legal"><button type="button" data-v424-open="legal">'+esc(legalLabels[locale()][0])+' →</button></p>';
}
function paintTabs(){
 more.innerHTML='<div class="v424-title"><div><div class="label">SGBUDDY / V4.24</div><h3 id="v424Title">'+esc(t(0))+'</h3></div><small>OFFLINE</small></div>'+
 '<div class="v424-tabs" role="tablist" aria-label="'+esc(t(0))+'">'+
 [['arrival',1],['notices',2],['emergency',3],['legal',null]].map(([id,n])=>'<button type="button" role="tab" data-v424-tab="'+id+'" aria-selected="'+(section===id)+'" class="'+(section===id?'active':'')+'">'+esc(n===null?legalLabels[locale()][0]:t(n))+'</button>').join('')+'</div>'+
 '<div id="v424Content" role="tabpanel" aria-live="polite"></div>';
 const content=$('#v424Content');
 if(section==='arrival')renderArrival(content);
 if(section==='notices')renderNotices(content);
 if(section==='emergency')renderEmergency(content);
 if(section==='legal')renderLegal(content);
}
function renderArrival(host){
 const tasks=arrivalTasks(profile),need=sgacRequired(profile),windowDates=sgacWindow(profile.arrivalDate),today=singaporeDay();
 let when=t(22);
 if(windowDates){
  const remaining=daysUntil(profile.arrivalDate,today);
  when=(need?'SG Arrival Card: '+windowDates.opens+' → '+windowDates.closes+'. ':'')+(remaining<0?'Arrival date is in the past; check your next trip.':remaining===0?'Arrival is today.':remaining===1?'Arrival is tomorrow.':'Arrival in '+remaining+' days.');
 }
 host.innerHTML='<p class="v424-note">'+esc(t(8))+'</p>'+
 '<div class="v424-fields"><label>'+esc(t(13))+'<select id="v424Status">'+
 [['visitor','Foreign visitor'],['citizen','Singapore citizen'],['pr','Permanent resident'],['long_term','Long-term pass holder'],['work_pass','Work pass holder'],['student_pass','Student Pass holder']].map(([val,name])=>'<option value="'+val+'" '+(profile.status===val?'selected':'')+'>'+esc(name)+'</option>').join('')+
 '</select></label><label>'+esc(t(14))+'<select id="v424Border">'+[['air','Air'],['sea','Sea'],['land','Land (Woodlands / Tuas)']].map(([val,name])=>'<option value="'+val+'" '+(profile.border===val?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>'+
 '<label>'+esc(t(15))+'<input type="date" id="v424Date" value="'+esc(profile.arrivalDate)+'"></label></div>'+
 '<label class="v424-toggle"><input id="v424Clears" type="checkbox" '+(profile.clearsImmigration?'checked':'')+'>'+esc(t(16))+'</label>'+
 '<div class="v424-date-hint"><strong>'+esc(need?t(20):t(21))+'</strong><p>'+esc(when)+'</p><a href="'+OFFICIAL_LINKS.sgac+'" target="_blank" rel="noopener noreferrer">'+esc(t(10))+' ↗</a></div>'+
 '<div class="v424-checklist">'+tasks.map(task=>'<label class="v424-task"><input type="checkbox" data-v424-check="'+task.id+'" '+(profile.completed[task.id]?'checked':'')+'><span><strong>'+esc(task.label)+'</strong><small>'+esc(task.detail)+'</small><a target="_blank" rel="noopener noreferrer" href="'+task.url+'">'+esc(t(10))+' ↗</a></span></label>').join('')+'</div>'+
 '<details class="v424-goods"><summary>'+esc(t(17))+'</summary><label class="v424-search">'+esc(t(18))+'<input id="v424GoodsSearch" type="search" value="'+esc(goodsQuery)+'" placeholder="Vapes, medicine, food, alcohol"></label><div id="v424GoodsResults"></div></details>'+
 '<p class="v424-note">'+esc(t(23))+'</p>';
 renderGoods();
}
const goods=[
 ['Vapes / e-vaporisers','Prohibited: do not bring or use in Singapore.',OFFICIAL_LINKS.vapes],
 ['Cannabis / CBD / recreational drugs','Prohibited controlled drugs and cannabis products. Serious penalties apply.',OFFICIAL_LINKS.drugs],
 ['Prescription or personal medicine','Some medicines require advance approval; check HSA before travel.',OFFICIAL_LINKS.medications],
 ['Cigarettes and tobacco','Tobacco imports and duty declarations have special requirements.',OFFICIAL_LINKS.customs],
 ['Alcohol','Check duty-free concessions, quantities and tax obligations.',OFFICIAL_LINKS.declare],
 ['Cash / bearer instruments','Amounts exceeding S$20,000 equivalent require declaration.',OFFICIAL_LINKS.entry],
 ['Food, plants and animal products','Specific imports may be controlled or require approvals.',OFFICIAL_LINKS.customs],
 ['Drones and electronics','Check the product-specific rules; no blanket permission implied.',OFFICIAL_LINKS.customs]
];
function renderGoods(){
 const host=$('#v424GoodsResults');if(!host)return;
 const found=goods.filter(g=>!goodsQuery||g.slice(0,2).join(' ').toLowerCase().includes(goodsQuery.toLowerCase()));
 host.innerHTML=found.length?found.map(([name,desc,url])=>'<div class="v424-goods-row"><strong>'+esc(name)+'</strong><span>'+esc(desc)+'</span><a href="'+url+'" rel="noopener noreferrer" target="_blank">'+esc(t(10))+' ↗</a></div>').join(''):'<p>'+esc(t(19))+'</p>';
}
function renderNotices(host){
 const current=mode(),all=visibleNotices(feed.notices,current),stale=feed.reviewedAt&&daysUntil(singaporeDay(),feed.reviewedAt)>30;
 host.innerHTML='<p class="v424-note">'+esc(t(5))+' '+esc(t(27))+'</p>'+
 (stale?'<div class="v424-warning">The last editorial review is over 30 days old. Confirm all details with the linked agency.</div>':'')+
 (all.length?'<div class="v424-notices">'+all.map(n=>'<article class="v424-notice"><div class="v424-notice-meta"><span>'+esc(n.agency)+'</span><span>'+esc(n.kind.replace(/-/g,' '))+'</span></div><h4>'+esc(n.title)+'</h4><p>'+esc(n.summary)+'</p><div class="v424-notice-foot"><small>'+esc(t(11))+' '+esc(n.reviewedAt)+'</small><a href="'+officialUrl(n.sourceUrl)+'" rel="noopener noreferrer" target="_blank">'+esc(t(10))+' ↗</a></div></article>').join('')+'</div>':'<p>'+esc(t(26))+'</p>')+
 '<details class="v424-gov-sources"><summary>'+esc(t(12))+' · Government agency newsrooms</summary><div>'+
 (feed.sources||[]).filter(s=>s.audiences?.includes(current)&&officialUrl(s.url)).map(s=>'<a href="'+officialUrl(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.agency)+' ↗</a>').join('')+'</div></details>';
}
function renderEmergency(host){
 host.innerHTML='<div class="v424-emergency-head"><strong>'+esc(t(6))+'</strong><p>'+esc(t(7))+'</p></div>'+
 '<div class="v424-contact-grid">'+EMERGENCY_CONTACTS.map(c=>'<a class="v424-contact '+(c.critical?'critical':'')+'" href="'+(c.kind==='sms'?'sms:':'tel:')+c.number+'" aria-label="'+esc(c.label)+' '+c.number+'"><span class="v424-number">'+esc(c.number.replace('18002550000','1800 255 0000'))+'</span><span>'+esc(c.label)+'</span></a>').join('')+'</div>'+
 '<p class="v424-note">If someone is in immediate danger, call 999 (police) or 995 (ambulance/fire). SMS 70999 is for police emergencies when it is not safe or possible to speak.</p>'+
 '<div class="v424-emergency-more">'+
 '<a href="'+OFFICIAL_LINKS.police+'" target="_blank" rel="noopener noreferrer">Singapore Police Force ↗</a>'+
 '<a href="'+OFFICIAL_LINKS.ambulance+'" target="_blank" rel="noopener noreferrer">SCDF ambulance service ↗</a>'+
 '<a href="'+OFFICIAL_LINKS.embassy+'" target="_blank" rel="noopener noreferrer">Foreign embassies in Singapore (MFA) ↗</a>'+ 
 '<a href="'+OFFICIAL_LINKS.lostPassport+'" target="_blank" rel="noopener noreferrer">Lost passport: steps for foreign visitors ↗</a>'+ 
 '<a href="'+OFFICIAL_LINKS.mentalHealth+'" target="_blank" rel="noopener noreferrer">Mental health support options (MOH) ↗</a>'+
 '<a href="https://www.google.com/maps/search/?api=1&query=Singapore+emergency+department" target="_blank" rel="noopener noreferrer">Find an emergency department ↗</a>'+
 '</div><p class="v424-note">Check official sources when online. Phone and SMS handoffs depend on your device and mobile service.</p>';
}
function renderLegal(host){
 const l=legalLabels[locale()];
 const rows=[
  [l[1],'Privacy notice','Your chosen settings, places and checklist may be saved on this device; optional accounts, sync and location features also process data.','privacy'],
  [l[2],'Accuracy & safety','Guides and updates may be incomplete, delayed or stored offline. Confirm important decisions with official agencies; SGBuddy is not an emergency response service.','accuracy'],
  [l[3],'Terms of use','This independent information service is provided for convenience. Use it lawfully and verify third-party information before relying on it.','terms'],
  [l[4],'Feedback & privacy requests','Report incorrect details or app problems using the verified Omnidite contact channel. Avoid sending sensitive identity or medical details.','feedback']
 ];
 host.innerHTML='<p class="v424-note" lang="en">Full legal notices are in English. The official government website is authoritative for entry, customs and safety requirements.</p>'+
  '<div class="v424-legal-grid">'+rows.map(([title,heading,detail,anchor])=>'<article class="v424-legal-card"><h4>'+esc(title)+'</h4><strong lang="en">'+esc(heading)+'</strong><p lang="en">'+esc(detail)+'</p><a href="/legal.html#'+anchor+'">'+esc(l[5])+' ↗</a></article>').join('')+'</div>'+
  '<div class="v424-legal-contacts"><a class="v424-feedback-action" href="https://omnidite.com/contact" target="_blank" rel="noopener noreferrer">'+esc(l[6])+' ↗</a></div>'+
  '<p class="v424-note" lang="en">Opens the Omnidite contact page. SGBuddy does not transmit feedback itself; do not use this form for emergencies.</p>';
}
function paint(){paintHome();paintTabs();sos.setAttribute('aria-label',t(3))}
d.addEventListener('click',e=>{
 const tab=e.target.closest('[data-v424-tab]');if(tab){section=tab.dataset.v424Tab;paintTabs();more.querySelector('[data-v424-tab="'+section+'"]')?.focus();return}
 const open=e.target.closest('[data-v424-open]');if(open)openPanel(open.dataset.v424Open);
});
function openPanel(next){open(next)}
sos.addEventListener('click',()=>open('emergency'));
more.addEventListener('change',e=>{
 const x=e.target;
 if(x.id==='v424Status')profile.status=x.value;
 else if(x.id==='v424Border')profile.border=x.value;
 else if(x.id==='v424Clears')profile.clearsImmigration=x.checked;
 else if(x.id==='v424Date')profile.arrivalDate=validDay(x.value)?x.value:'';
 else if(x.matches('[data-v424-check]')){profile.completed[x.dataset.v424Check]=x.checked;save();return}
 else return;
 // A different arrival or traveller type must never inherit completed declarations.
 profile.completed={};
 save();paintTabs();
});
more.addEventListener('input',e=>{if(e.target.id==='v424GoodsSearch'){goodsQuery=e.target.value;renderGoods()}});
d.addEventListener('sgbuddy:language',()=>requestAnimationFrame(paint));
d.addEventListener('sgbuddy:persona',()=>requestAnimationFrame(paint));
fetch('/data/gov-notices-v424.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('feed unavailable');return r.json()}).then(data=>{if(Array.isArray(data.notices))feed=data;paintTabs()}).catch(()=>{paintTabs()});
window.SGBUDDY_V424={open:openPanel,profile,mode,version:'4.24.0'};
paint();
})();