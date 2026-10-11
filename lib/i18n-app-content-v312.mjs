/* SGBuddy V3.1-C first-party app descriptions.
  Reviewed high-usage app summaries and purposes, locked to both published fields.
  Eligibility and account requirements remain original until separately translated.
  Never change product names, download links or payment/identity conditions. */
import {normalizeLocale} from './i18n-v280.mjs';
import {APP2_SOURCE,APP2_LOCALIZED} from './i18n-app-content2-v313.mjs';
import {APP3_SOURCE,APP3_LOCALIZED} from './i18n-app-content3-v313.mjs';
import {APP4_SOURCE,APP4_LOCALIZED} from './i18n-app-content4-v313.mjs';
import {APP5_SOURCE,APP5_LOCALIZED} from './i18n-app-content5-v313.mjs';
import {EXTRA_APP_SOURCE,EXTRA_APP_LOCALIZED} from './i18n-extra-apps-v314.mjs';
export const APP_SOURCE_FIELDS={
 "V24-APP-001": {
  "summary": "Log in to public services securely and access your digital identity.",
  "purpose": "Government login, identity and authorisation"
 },
 "V24-APP-002": {
  "summary": "Government services, benefits, life events and local issues in one app.",
  "purpose": "Everyday government services"
 },
 "V24-APP-003": {
  "summary": "Public healthcare appointments, records and family healthcare services.",
  "purpose": "Healthcare appointments and health records"
 },
 "V24-APP-004": {
  "summary": "SG Arrival Card submissions and ICA digital services.",
  "purpose": "Entry formalities and ICA services"
 },
 "V24-APP-005": {
  "summary": "Check and display Singapore work pass details where eligible.",
  "purpose": "Work pass verification"
 },
 "V24-APP-006": {
  "summary": "View CPF account services and retirement-related information.",
  "purpose": "CPF balances and services"
 },
 "V24-APP-007": {
  "summary": "Rain, air quality, dengue and environment-related notices.",
  "purpose": "Weather, PSI and environmental alerts"
 },
 "V24-APP-008": {
  "summary": "Pay for supported parking sessions from your phone.",
  "purpose": "Short-term coupon parking"
 },
 "V24-APP-009": {
  "summary": "Track eligible public-transport card journeys, balances and top-ups.",
  "purpose": "MRT/bus travel cards and transaction history"
 },
 "V24-APP-010": {
  "summary": "Official public-transport and traffic information.",
  "purpose": "Bus arrival, MRT and traffic information"
 },
 "V24-APP-011": {
  "summary": "Borrow and browse public library eBooks, audio and eResources.",
  "purpose": "Library loans and reading"
 },
 "V24-APP-012": {
  "summary": "Book ActiveSG public sports facilities, pools and programmes.",
  "purpose": "Public sport and fitness bookings"
 },
 "V24-APP-013": {
  "summary": "Track public health programmes and eligible rewards.",
  "purpose": "Health campaigns and activity goals"
 },
 "V24-APP-014": {
  "summary": "Book rides, order food and groceries, or arrange deliveries.",
  "purpose": "Transport, food and shopping"
 },
 "V24-APP-015": {
  "summary": "Alternative point-to-point ride booking in Singapore.",
  "purpose": "Ride-hailing alternative"
 }
};
export const APP_LOCALIZATION_ORDER=["V24-APP-001","V24-APP-002","V24-APP-003","V24-APP-004","V24-APP-005","V24-APP-006","V24-APP-007","V24-APP-008","V24-APP-009","V24-APP-010","V24-APP-011","V24-APP-012","V24-APP-013","V24-APP-014","V24-APP-015"];
const lines={
 "en": [
  "Secure access to public services and digital identity.~Government login and digital identity",
  "Government services, benefits, life events and local issues.~Everyday government services",
  "Public healthcare appointments, records and family services.~Medical appointments and health records",
  "SG Arrival Card submissions and ICA digital services.~Immigration and arrival formalities",
  "View and verify eligible Singapore work passes.~Work pass verification",
  "CPF accounts and information about retirement savings.~CPF balances and services",
  "Rain, air quality, dengue and environmental notices.~Weather, PSI and environmental alerts",
  "Pay for supported parking sessions using a phone.~Short-term parking payments",
  "Track supported transport cards, journeys, balances and top-ups.~MRT and bus card history",
  "Official information about buses, MRT and road traffic.~Public transport and traffic information",
  "Borrow eBooks and discover library audio and digital resources.~Public library loans and reading",
  "Book eligible public sports facilities, pools and activities.~Sports facilities and programmes",
  "Track public-health programmes and eligible rewards.~Health activities and campaigns",
  "Book rides, order meals or groceries, and arrange deliveries.~Transport, food and shopping",
  "Alternative ride-hailing for journeys in Singapore.~Ride-hailing alternative"
 ],
 "zh-CN": [
  "安全登录公共服务并使用数字身份。~政府登录及数字身份",
  "政府服务、福利、人生事项和社区问题一站式办理。~日常政府服务",
  "公共医疗预约、健康记录和家庭医疗服务。~医疗预约及健康记录",
  "提交新加坡入境卡并使用 ICA 数字服务。~入境手续及 ICA 服务",
  "查看并核实符合条件的新加坡工作准证。~工作准证核实",
  "查看 CPF 账户及退休储蓄相关信息。~公积金余额与服务",
  "提供降雨、空气质量、登革热及环境提醒。~天气、PSI 与环境警报",
  "使用手机支付支持的停车时段。~短时停车缴费",
  "查询支持的公交卡行程、余额及充值记录。~地铁及巴士交通卡记录",
  "官方巴士、地铁和道路交通信息。~公共交通及路况信息",
  "借阅电子书并浏览图书馆音频与数字资源。~公共图书馆借阅及阅读",
  "预约符合条件的公共体育设施、泳池及活动。~体育设施及课程",
  "追踪公共健康活动及符合资格的奖励。~健康活动及计划",
  "预订乘车服务、订购餐食或杂货并安排配送。~交通、餐饮与购物",
  "在新加坡的另一种网约车选择。~网约车替代方案"
 ],
 "zh-TW": [
  "安全登入公共服務並使用數位身分。~政府登入及數位身分",
  "政府服務、福利、人生事項及社區問題一站辦理。~日常政府服務",
  "公共醫療預約、健康紀錄及家庭醫療服務。~醫療預約及健康紀錄",
  "提交新加坡入境卡並使用 ICA 數位服務。~入境手續及 ICA 服務",
  "查看及核實符合資格的新加坡工作准證。~工作准證核實",
  "查看 CPF 帳戶及退休儲蓄相關資訊。~公積金餘額及服務",
  "提供降雨、空氣品質、登革熱及環境提醒。~天氣、PSI 與環境警報",
  "透過手機支付支援的停車時段。~短時停車繳費",
  "查詢支援的交通卡行程、餘額及加值紀錄。~地鐵與巴士交通卡紀錄",
  "官方巴士、地鐵及道路交通資訊。~大眾運輸與路況資訊",
  "借閱電子書並瀏覽圖書館音訊及數位資源。~公共圖書館借閱及閱讀",
  "預約符合資格的公共體育設施、泳池及活動。~體育設施與課程",
  "追蹤公共健康活動及符合資格的獎勵。~健康活動及計畫",
  "預訂搭車、訂購餐點與雜貨，並安排配送。~交通、餐飲與購物",
  "新加坡另一種叫車選擇。~網約車替代方案"
 ],
 "ms": [
  "Akses perkhidmatan awam dengan selamat dan gunakan identiti digital.~Log masuk kerajaan dan identiti digital",
  "Perkhidmatan kerajaan, faedah, peristiwa hidup dan isu setempat.~Perkhidmatan kerajaan harian",
  "Temu janji, rekod kesihatan awam dan khidmat kesihatan keluarga.~Temu janji dan rekod kesihatan",
  "Hantar Kad Ketibaan SG dan gunakan perkhidmatan digital ICA.~Urusan ketibaan dan imigresen",
  "Lihat dan sahkan pas kerja Singapura yang layak.~Pengesahan pas kerja",
  "Lihat akaun CPF dan maklumat simpanan persaraan.~Baki dan perkhidmatan CPF",
  "Makluman hujan, kualiti udara, denggi dan alam sekitar.~Cuaca, PSI dan amaran alam sekitar",
  "Bayar sesi parkir yang disokong melalui telefon.~Bayaran parkir jangka pendek",
  "Semak perjalanan, baki dan tambah nilai kad pengangkutan yang disokong.~Sejarah kad MRT dan bas",
  "Maklumat rasmi bas, MRT dan trafik jalan raya.~Maklumat pengangkutan awam dan trafik",
  "Pinjam eBuku dan terokai audio serta sumber digital perpustakaan.~Pinjaman dan bacaan perpustakaan awam",
  "Tempah kemudahan sukan awam, kolam renang dan aktiviti yang layak.~Kemudahan dan program sukan",
  "Jejaki program kesihatan awam dan ganjaran yang layak.~Aktiviti dan kempen kesihatan",
  "Tempah perjalanan, pesan makanan atau barangan runcit dan atur penghantaran.~Pengangkutan, makanan dan beli-belah",
  "Pilihan alternatif untuk tempahan e-panggilan di Singapura.~Alternatif e-panggilan"
 ],
 "id": [
  "Akses layanan publik dengan aman dan gunakan identitas digital.~Login pemerintah dan identitas digital",
  "Layanan pemerintah, tunjangan, peristiwa hidup, dan isu setempat.~Layanan pemerintah sehari-hari",
  "Janji temu, catatan kesehatan publik, dan layanan kesehatan keluarga.~Janji temu dan catatan kesehatan",
  "Kirim SG Arrival Card dan gunakan layanan digital ICA.~Prosedur kedatangan dan imigrasi",
  "Lihat dan verifikasi izin kerja Singapura yang memenuhi syarat.~Verifikasi izin kerja",
  "Lihat rekening CPF dan informasi tabungan pensiun.~Saldo dan layanan CPF",
  "Pemberitahuan hujan, kualitas udara, demam berdarah, dan lingkungan.~Cuaca, PSI, dan peringatan lingkungan",
  "Bayar parkir yang didukung melalui ponsel.~Pembayaran parkir jangka pendek",
  "Pantau perjalanan, saldo, dan isi ulang kartu transportasi yang didukung.~Riwayat kartu MRT dan bus",
  "Informasi resmi bus, MRT, dan lalu lintas jalan.~Informasi transportasi umum dan lalu lintas",
  "Pinjam eBook dan jelajahi audio serta sumber digital perpustakaan.~Peminjaman dan bacaan perpustakaan umum",
  "Pesan fasilitas olahraga publik, kolam, dan kegiatan yang memenuhi syarat.~Fasilitas dan program olahraga",
  "Pantau program kesehatan publik dan hadiah yang memenuhi syarat.~Kegiatan dan kampanye kesehatan",
  "Pesan perjalanan, makanan, belanjaan, atau layanan antar.~Transportasi, makanan, dan belanja",
  "Pilihan alternatif untuk memesan transportasi di Singapura.~Alternatif transportasi online"
 ],
 "ja": [
  "公共サービスに安全にログインし、デジタル身分証明を利用できます。~政府サービスのログインとデジタルID",
  "行政サービス、給付、ライフイベント、地域の問題をまとめて利用できます。~日常の行政サービス",
  "公的医療の予約、健康記録、家族向け医療サービス。~医療予約と健康記録",
  "SG Arrival Cardの提出とICAのデジタルサービス。~入国・到着手続き",
  "対象となるシンガポールの就労パスを確認できます。~就労パスの確認",
  "CPF口座と退職貯蓄に関する情報を確認できます。~CPF残高とサービス",
  "雨、空気質、デング熱、環境に関するお知らせ。~天気、PSI、環境警報",
  "対応する駐車料金をスマートフォンで支払えます。~短時間駐車の支払い",
  "対応する交通カードの乗車履歴、残高、チャージを確認できます。~MRT・バスカードの履歴",
  "バス、MRT、道路交通の公式情報。~公共交通と道路交通情報",
  "電子書籍を借り、図書館の音声・デジタル資料を探せます。~公共図書館の貸出と読書",
  "対象の公共スポーツ施設、プール、活動を予約できます。~スポーツ施設とプログラム",
  "公衆衛生プログラムと対象の特典を確認できます。~健康活動とキャンペーン",
  "配車、食事・食料品の注文、配達を手配できます。~移動、食事、買い物",
  "シンガポールで利用できる別の配車サービス。~配車サービスの選択肢"
 ],
 "ko": [
  "공공 서비스에 안전하게 로그인하고 디지털 신원을 이용하세요.~정부 로그인 및 디지털 신원",
  "정부 서비스, 혜택, 생활 이벤트, 지역 민원을 한 앱에서 이용하세요.~일상 정부 서비스",
  "공공 의료 예약, 건강 기록 및 가족 의료 서비스.~의료 예약 및 건강 기록",
  "SG Arrival Card 제출 및 ICA 디지털 서비스.~입국 및 도착 절차",
  "자격에 맞는 싱가포르 취업 패스 정보를 확인하세요.~취업 패스 확인",
  "CPF 계좌와 은퇴 저축 정보를 확인하세요.~CPF 잔액 및 서비스",
  "비, 대기질, 뎅기열 및 환경 관련 안내.~날씨, PSI 및 환경 경보",
  "지원되는 주차 요금을 휴대전화로 결제하세요.~단기 주차 결제",
  "지원되는 교통카드의 이용 내역, 잔액 및 충전을 확인하세요.~MRT·버스카드 이용 내역",
  "버스, MRT 및 도로 교통 공식 정보.~대중교통 및 교통 정보",
  "전자책을 대출하고 도서관의 오디오 및 디지털 자료를 찾아보세요.~공공도서관 대출 및 독서",
  "해당되는 공공 체육시설, 수영장 및 활동을 예약하세요.~체육시설 및 프로그램",
  "공공 보건 프로그램과 해당 보상을 확인하세요.~건강 활동 및 캠페인",
  "차량을 예약하고 음식·식료품을 주문하거나 배송을 이용하세요.~교통, 음식 및 쇼핑",
  "싱가포르에서 이용할 수 있는 또 다른 차량 호출 서비스.~차량 호출 대안"
 ],
 "th": [
  "เข้าสู่บริการภาครัฐอย่างปลอดภัยและใช้ตัวตนดิจิทัล~การเข้าสู่ระบบภาครัฐและตัวตนดิจิทัล",
  "บริการภาครัฐ สิทธิประโยชน์ เหตุการณ์สำคัญในชีวิต และเรื่องในชุมชน~บริการภาครัฐในชีวิตประจำวัน",
  "นัดหมายสาธารณสุข บันทึกสุขภาพ และบริการสุขภาพครอบครัว~นัดหมายและบันทึกสุขภาพ",
  "ยื่น SG Arrival Card และใช้บริการดิจิทัลของ ICA~ขั้นตอนการเดินทางเข้าและการตรวจคนเข้าเมือง",
  "ดูและตรวจสอบรายละเอียดใบอนุญาตทำงานสิงคโปร์ตามสิทธิ์~ตรวจสอบใบอนุญาตทำงาน",
  "ดูบัญชี CPF และข้อมูลการออมเพื่อเกษียณ~ยอดเงินและบริการ CPF",
  "แจ้งเตือนฝน คุณภาพอากาศ ไข้เลือดออก และสิ่งแวดล้อม~อากาศ PSI และการแจ้งเตือนสิ่งแวดล้อม",
  "ชำระค่าจอดรถที่รองรับผ่านโทรศัพท์~ชำระค่าจอดรถระยะสั้น",
  "ติดตามการเดินทาง ยอดเงิน และการเติมเงินบัตรขนส่งที่รองรับ~ประวัติบัตร MRT และรถเมล์",
  "ข้อมูลทางการของรถเมล์ MRT และการจราจรบนถนน~ข้อมูลขนส่งสาธารณะและการจราจร",
  "ยืมหนังสืออิเล็กทรอนิกส์และค้นหาสื่อเสียงกับสื่อดิจิทัลของห้องสมุด~ยืมและอ่านหนังสือห้องสมุดสาธารณะ",
  "จองสถานกีฬา สระว่ายน้ำ และกิจกรรมสาธารณะที่รองรับ~สถานกีฬาและโปรแกรม",
  "ติดตามโครงการสุขภาพสาธารณะและรางวัลตามสิทธิ์~กิจกรรมและโครงการสุขภาพ",
  "จองรถ สั่งอาหารหรือของชำ และจัดการส่งสินค้า~การเดินทาง อาหาร และช็อปปิง",
  "ตัวเลือกเรียกรถอีกแบบในสิงคโปร์~ทางเลือกบริการเรียกรถ"
 ],
 "vi": [
  "Đăng nhập dịch vụ công an toàn và sử dụng định danh số.~Đăng nhập chính phủ và định danh số",
  "Dịch vụ chính phủ, trợ cấp, sự kiện cuộc sống và vấn đề địa phương.~Dịch vụ chính phủ hằng ngày",
  "Đặt lịch khám công, hồ sơ sức khỏe và dịch vụ y tế gia đình.~Lịch khám và hồ sơ sức khỏe",
  "Nộp SG Arrival Card và sử dụng dịch vụ số ICA.~Thủ tục nhập cảnh và đến Singapore",
  "Xem và xác minh giấy phép lao động Singapore khi đủ điều kiện.~Xác minh giấy phép lao động",
  "Xem tài khoản CPF và thông tin tiết kiệm hưu trí.~Số dư và dịch vụ CPF",
  "Thông báo về mưa, chất lượng không khí, sốt xuất huyết và môi trường.~Thời tiết, PSI và cảnh báo môi trường",
  "Thanh toán các lượt đỗ xe được hỗ trợ bằng điện thoại.~Thanh toán đỗ xe ngắn hạn",
  "Theo dõi hành trình, số dư và nạp tiền thẻ giao thông được hỗ trợ.~Lịch sử thẻ MRT và xe buýt",
  "Thông tin chính thức về xe buýt, MRT và giao thông đường bộ.~Giao thông công cộng và tình hình đường sá",
  "Mượn sách điện tử và tìm tài nguyên âm thanh, số của thư viện.~Mượn sách và đọc tại thư viện công",
  "Đặt các cơ sở thể thao, hồ bơi và hoạt động công đủ điều kiện.~Cơ sở và chương trình thể thao",
  "Theo dõi chương trình y tế công cộng và phần thưởng đủ điều kiện.~Hoạt động và chiến dịch sức khỏe",
  "Đặt xe, gọi đồ ăn, thực phẩm hoặc giao hàng.~Đi lại, ẩm thực và mua sắm",
  "Lựa chọn gọi xe thay thế tại Singapore.~Dịch vụ gọi xe thay thế"
 ],
 "fr": [
  "Accédez aux services publics en toute sécurité avec votre identité numérique.~Connexion aux services publics et identité numérique",
  "Services publics, aides, événements de la vie et questions locales dans une application.~Services administratifs du quotidien",
  "Rendez-vous de santé publique, dossiers médicaux et services de santé familiaux.~Rendez-vous médicaux et dossiers de santé",
  "Soumission de la SG Arrival Card et services numériques de l'ICA.~Formalités d'entrée et services ICA",
  "Consultez et vérifiez les permis de travail singapouriens éligibles.~Vérification des permis de travail",
  "Consultez votre compte CPF et les informations sur l'épargne retraite.~Soldes et services CPF",
  "Alertes sur la pluie, la qualité de l'air, la dengue et l'environnement.~Météo, PSI et alertes environnementales",
  "Payez les sessions de stationnement prises en charge depuis votre téléphone.~Paiement du stationnement de courte durée",
  "Consultez les trajets, soldes et recharges des cartes de transport compatibles.~Historique des cartes MRT et bus",
  "Informations officielles sur les bus, le MRT et la circulation.~Informations sur les transports et la circulation",
  "Empruntez des livres numériques et explorez les ressources audio et numériques de la bibliothèque.~Prêts et lecture en bibliothèque publique",
  "Réservez les installations sportives publiques, piscines et activités éligibles.~Installations et programmes sportifs",
  "Suivez les programmes de santé publique et les récompenses éligibles.~Activités et campagnes de santé",
  "Réservez des trajets, commandez des repas, des courses ou des livraisons.~Transport, restauration et achats",
  "Autre option de réservation de trajets à Singapour.~Alternative de VTC"
 ],
 "es": [
  "Accede de forma segura a servicios públicos y a tu identidad digital.~Inicio de sesión gubernamental e identidad digital",
  "Servicios públicos, prestaciones, acontecimientos vitales y asuntos locales en una app.~Servicios públicos cotidianos",
  "Citas de sanidad pública, historiales médicos y servicios de salud familiar.~Citas e historiales médicos",
  "Presenta la SG Arrival Card y accede a servicios digitales de ICA.~Trámites de llegada e inmigración",
  "Consulta y verifica permisos de trabajo de Singapur cuando corresponda.~Verificación del permiso de trabajo",
  "Consulta cuentas CPF e información de ahorro para la jubilación.~Saldos y servicios CPF",
  "Avisos sobre lluvia, calidad del aire, dengue y medio ambiente.~Tiempo, PSI y alertas ambientales",
  "Paga desde tu teléfono las sesiones de aparcamiento compatibles.~Pago de aparcamiento de corta duración",
  "Consulta viajes, saldos y recargas de tarjetas de transporte compatibles.~Historial de tarjetas MRT y autobús",
  "Información oficial de autobuses, MRT y tráfico viario.~Información de transporte público y tráfico",
  "Pide prestados libros electrónicos y descubre recursos de audio y digitales de bibliotecas.~Préstamos y lectura en bibliotecas públicas",
  "Reserva instalaciones deportivas públicas, piscinas y actividades elegibles.~Instalaciones y programas deportivos",
  "Sigue programas de salud pública y recompensas disponibles.~Actividades y campañas sanitarias",
  "Reserva viajes, pide comida o comestibles y organiza entregas.~Transporte, comida y compras",
  "Otra opción para reservar trayectos en Singapur.~Alternativa de transporte privado"
 ],
 "pt-BR": [
  "Acesse serviços públicos com segurança usando sua identidade digital.~Acesso a serviços do governo e identidade digital",
  "Serviços governamentais, benefícios, eventos da vida e questões locais em um app.~Serviços públicos do dia a dia",
  "Consultas na rede pública, registros de saúde e serviços de saúde familiar.~Consultas e prontuários de saúde",
  "Envie o SG Arrival Card e acesse os serviços digitais da ICA.~Formalidades de entrada e serviços da ICA",
  "Consulte e verifique permissões de trabalho elegíveis em Singapura.~Verificação de permissões de trabalho",
  "Consulte a conta CPF e informações sobre poupança para aposentadoria.~Saldos e serviços CPF",
  "Alertas de chuva, qualidade do ar, dengue e meio ambiente.~Clima, PSI e alertas ambientais",
  "Pague pelo celular as sessões de estacionamento compatíveis.~Pagamento de estacionamento de curta duração",
  "Acompanhe viagens, saldos e recargas de cartões de transporte compatíveis.~Histórico de cartões de MRT e ônibus",
  "Informações oficiais sobre ônibus, MRT e trânsito.~Informações de transporte público e trânsito",
  "Pegue e-books emprestados e explore áudios e materiais digitais da biblioteca.~Empréstimos e leitura em bibliotecas públicas",
  "Reserve instalações esportivas públicas, piscinas e atividades elegíveis.~Instalações e programas esportivos",
  "Acompanhe programas de saúde pública e recompensas elegíveis.~Atividades e campanhas de saúde",
  "Reserve corridas, peça refeições ou compras de mercado e organize entregas.~Transporte, alimentação e compras",
  "Outra opção de reserva de corridas em Singapura.~Alternativa para solicitar transporte"
 ]
};
export const APP_CONTENT=Object.fromEntries(Object.entries(lines).map(([locale,records])=>{
 if(records.length!==APP_LOCALIZATION_ORDER.length)throw Error('Missing app translations: '+locale);
 return [locale,Object.fromEntries(APP_LOCALIZATION_ORDER.map((id,i)=>{
   const fields=records[i].split('~');if(fields.length!==2||!fields.every(s=>s.trim()))throw Error('Invalid app translation '+locale+' '+id);
   return [id,{summary:fields[0],purpose:fields[1]}];
 }))];
}));
export const COMPLETE_APP_SOURCES={...APP_SOURCE_FIELDS,...APP2_SOURCE,...APP3_SOURCE,...APP4_SOURCE,...APP5_SOURCE};
export function appContentTranslation(locale,app,field){
 const lang=normalizeLocale(locale);
 if(lang==='en'||!['summary','purpose'].includes(field)||!app?.id)return null;
 const source=COMPLETE_APP_SOURCES[app.id]||EXTRA_APP_SOURCE[app.id];
 if(!source||source.summary!==app.summary||source.purpose!==app.purpose)return null;
 const text=(APP_CONTENT[lang]?.[app.id]||APP2_LOCALIZED[lang]?.[app.id]||APP3_LOCALIZED[lang]?.[app.id]||APP4_LOCALIZED[lang]?.[app.id]||APP5_LOCALIZED[lang]?.[app.id]||EXTRA_APP_LOCALIZED[lang]?.[app.id])?.[field];
 return typeof text==='string'&&text.trim()&&text!==app[field]?text:null;
}
export const translatedAppCount=Object.keys(COMPLETE_APP_SOURCES).length;
export const translatedExtraAppCount=Object.keys(EXTRA_APP_SOURCE).length;
