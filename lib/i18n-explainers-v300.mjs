/* Supplemental, curated long-form first-party copy for the twelve supported languages. */
import {normalizeLocale} from './i18n-v280.mjs';
export const EXPLAINER_KEYS=["greeting","knowledgeTitle","knowledgeIntro","moreFacts","factSearch","factEmpty","foodNote","discoverAboutCopy"];
const table={
 "en": [
  "Hi, I’m Merli! 🫶 Need a hand getting around or discovering Singapore?",
  "Discover with Merli",
  "Explore individual source-checked claims alongside a clearly marked review queue. The 10,000-fact collection remains a future goal.",
  "Show more facts",
  "Search facts…",
  "No facts match these filters. Try clearing search, mode or saved-only.",
  "Explore Singapore dishes and hawker-stall research leads. Stall operating status, opening hours, menu prices, halal certification and vegetarian options are not verified. Verify halal certification against MUIS’s official directory.",
  "Business details can change. SGBuddy includes published directories and local suggestions, but does not confirm a place is open right now. Check directly with the business before visiting."
 ],
 "zh-CN": [
  "嗨，我是 Merli！🫶 想了解新加坡或规划出行吗？",
  "和 Merli 一起探索",
  "查看经过来源核查的事实及待审查资料。收集 10,000 条事实仍是未来目标。",
  "查看更多事实",
  "搜索新加坡事实…",
  "没有符合条件的事实。请清除搜索或收藏筛选。",
  "探索新加坡菜肴及小贩摊位的研究资料。营业状态、营业时间、菜单价格、清真认证及素食选项均未经核实。请到 MUIS 官方目录核查清真认证。",
  "商家资料可能变化。SGBuddy 提供公开目录和本地建议，但不保证场所目前营业。到访前请向商家核实。"
 ],
 "zh-TW": [
  "嗨，我是 Merli！🫶 想了解新加坡或規劃出行嗎？",
  "和 Merli 一起探索",
  "查看經過來源查核的事實及待審查資料。收集 10,000 則資料仍是未來目標。",
  "查看更多趣聞",
  "搜尋新加坡趣聞…",
  "沒有符合條件的趣聞。請清除搜尋或收藏篩選。",
  "探索新加坡料理及小販攤位的研究資料。營業狀態、營業時間、菜單價格、清真認證及素食選項均未經確認。請至 MUIS 官方目錄查核清真認證。",
  "商家資訊可能改變。SGBuddy 提供公開目錄和在地建議，但不保證場所目前營業。到訪前請向商家確認。"
 ],
 "ms": [
  "Hai, saya Merli! 🫶 Mahu bantuan meneroka Singapura atau merancang perjalanan?",
  "Teroka bersama Merli",
  "Baca fakta yang disemak sumbernya dan maklumat yang belum diteliti. Sasaran 10,000 fakta masih pada masa depan.",
  "Lagi banyak fakta",
  "Cari fakta…",
  "Tiada fakta sepadan. Kosongkan carian atau penapis simpanan.",
  "Teroka hidangan Singapura dan penyelidikan gerai penjaja. Status operasi, waktu buka, harga menu, sijil halal dan pilihan vegetarian belum disahkan. Semak pensijilan halal melalui direktori rasmi MUIS.",
  "Butiran perniagaan boleh berubah. SGBuddy berkongsi direktori dan cadangan tempatan tetapi tidak mengesahkan waktu operasi semasa. Semak dengan perniagaan sebelum melawat."
 ],
 "id": [
  "Hai, aku Merli! 🫶 Perlu bantuan menjelajah Singapura atau merencanakan perjalanan?",
  "Jelajahi bersama Merli",
  "Lihat fakta yang telah diperiksa sumbernya dan catatan yang masih ditinjau. Target 10.000 fakta adalah rencana masa depan.",
  "Fakta lainnya",
  "Cari fakta…",
  "Tidak ada fakta yang cocok. Hapus pencarian atau filter tersimpan.",
  "Jelajahi hidangan Singapura dan catatan riset warung hawker. Status buka, jam operasi, harga menu, sertifikasi halal, dan pilihan vegetarian belum diverifikasi. Periksa sertifikasi halal di direktori resmi MUIS.",
  "Informasi bisnis dapat berubah. SGBuddy menyediakan direktori dan saran lokal, tetapi tidak memastikan tempat sedang buka. Hubungi bisnis sebelum berkunjung."
 ],
 "ja": [
  "こんにちは、Merli です！🫶 シンガポールの観光や移動をお手伝いします。",
  "Merli とシンガポールを発見",
  "出典を確認した事実と審査待ちの情報を閲覧できます。10,000件の収集は今後の目標です。",
  "さらに豆知識を見る",
  "豆知識を検索…",
  "一致する情報がありません。検索や保存フィルターを解除してください。",
  "シンガポール料理とホーカー屋台の調査情報です。営業状況、営業時間、価格、ハラール認証、ベジタリアン対応は未確認です。認証は MUIS 公式名簿でご確認ください。",
  "店舗情報は変更される場合があります。SGBuddy は公開名簿と地元の候補を紹介しますが、現在の営業を保証しません。訪問前に店舗へ確認してください。"
 ],
 "ko": [
  "안녕하세요, Merli예요! 🫶 싱가포르 여행과 이동을 도와드릴게요.",
  "Merli와 함께 둘러보기",
  "출처가 검증된 사실과 검토 대기 중인 정보를 볼 수 있습니다. 1만 건 수집은 향후 목표입니다.",
  "정보 더 보기",
  "정보 검색…",
  "일치하는 정보가 없습니다. 검색어나 저장 필터를 지워 보세요.",
  "싱가포르 음식과 호커 노점의 조사 정보입니다. 영업 여부, 시간, 메뉴 가격, 할랄 인증, 채식 옵션은 확인되지 않았습니다. MUIS 공식 목록에서 할랄 인증을 확인하세요.",
  "사업장 정보는 변경될 수 있습니다. SGBuddy는 공개 목록과 지역 추천을 제공하지만 현재 영업 여부를 보장하지 않습니다. 방문 전 업체에 확인하세요."
 ],
 "th": [
  "สวัสดี ฉัน Merli! 🫶 ให้ช่วยเดินทางหรือเที่ยวสิงคโปร์ไหม?",
  "ค้นพบสิงคโปร์กับ Merli",
  "ดูข้อมูลที่ตรวจสอบแหล่งที่มาแล้วและข้อมูลที่รอการทบทวน เป้าหมาย 10,000 เรื่องยังเป็นแผนในอนาคต",
  "ดูเกร็ดความรู้เพิ่มเติม",
  "ค้นหาเกร็ดความรู้…",
  "ไม่พบข้อมูล ลองล้างการค้นหาหรือตัวกรองที่บันทึก",
  "สำรวจอาหารสิงคโปร์และข้อมูลวิจัยร้านฮอว์กเกอร์ สถานะการเปิด เวลาทำการ ราคาเมนู การรับรองฮาลาลและอาหารมังสวิรัติยังไม่ได้รับการยืนยัน ตรวจสอบฮาลาลที่ไดเรกทอรีทางการของ MUIS",
  "ข้อมูลร้านค้าอาจเปลี่ยนแปลง SGBuddy แสดงรายชื่อและคำแนะนำ แต่ไม่รับรองว่าร้านเปิดอยู่ โปรดตรวจสอบกับร้านก่อนเดินทาง"
 ],
 "vi": [
  "Chào bạn, mình là Merli! 🫶 Mình có thể giúp bạn khám phá Singapore hay tìm đường không?",
  "Khám phá cùng Merli",
  "Xem những thông tin đã kiểm tra nguồn và các mục đang chờ duyệt. Mục tiêu 10.000 thông tin vẫn là dự định tương lai.",
  "Xem thêm thông tin",
  "Tìm thông tin…",
  "Không tìm thấy nội dung. Thử bỏ bộ lọc tìm kiếm hoặc mục đã lưu.",
  "Khám phá món ăn Singapore và dữ liệu nghiên cứu quầy hawker. Giờ mở cửa, hoạt động, giá, chứng nhận halal và món chay chưa được xác minh. Hãy kiểm tra chứng nhận halal qua danh mục chính thức MUIS.",
  "Thông tin cơ sở kinh doanh có thể thay đổi. SGBuddy giới thiệu danh bạ và gợi ý địa phương nhưng không xác nhận địa điểm đang mở. Hãy hỏi trực tiếp trước khi đến."
 ],
 "fr": [
  "Salut, je suis Merli ! 🫶 Besoin d’aide pour découvrir Singapour ou vous déplacer ?",
  "Découvrir avec Merli",
  "Consultez des faits vérifiés et des éléments en attente de contrôle. Le projet de 10 000 faits reste un objectif futur.",
  "Plus de faits",
  "Rechercher des faits…",
  "Aucun résultat. Effacez la recherche ou le filtre des favoris.",
  "Explorez les plats singapouriens et les recherches sur les stands hawker. Ouverture, horaires, prix, certification halal et choix végétariens ne sont pas vérifiés. Consultez le répertoire officiel MUIS pour le halal.",
  "Les informations commerciales changent. SGBuddy présente des annuaires et des suggestions, sans garantir qu’un lieu est ouvert. Vérifiez auprès de l’établissement avant votre visite."
 ],
 "es": [
  "¡Hola, soy Merli! 🫶 ¿Te ayudo a explorar Singapur o desplazarte?",
  "Descubre con Merli",
  "Consulta datos con fuentes revisadas y otros pendientes de evaluación. La colección de 10.000 datos sigue siendo una meta futura.",
  "Más datos",
  "Buscar datos…",
  "No hay resultados. Borra la búsqueda o el filtro de guardados.",
  "Explora los platos de Singapur y la investigación sobre puestos hawker. Su apertura, horarios, precios, certificación halal y opciones vegetarianas no están verificados. Consulta el directorio oficial de MUIS para el halal.",
  "Los datos de los negocios pueden cambiar. SGBuddy ofrece directorios y sugerencias, pero no confirma que un lugar esté abierto. Consulta con el establecimiento antes de visitarlo."
 ],
 "pt-BR": [
  "Oi, eu sou o Merli! 🫶 Quer ajuda para conhecer Singapura ou se locomover?",
  "Descubra com Merli",
  "Consulte fatos com fontes verificadas e informações aguardando revisão. A coleção de 10 mil fatos ainda é uma meta futura.",
  "Mais curiosidades",
  "Buscar curiosidades…",
  "Nenhum resultado. Limpe a busca ou o filtro de salvos.",
  "Explore pratos de Singapura e pesquisas sobre barracas hawker. Funcionamento, horários, preços, certificação halal e opções vegetarianas não estão verificados. Consulte o diretório oficial da MUIS para halal.",
  "As informações de estabelecimentos podem mudar. O SGBuddy oferece diretórios e sugestões, mas não confirma se um local está aberto. Consulte o estabelecimento antes de visitar."
 ]
};
export const EXPLAINERS=Object.fromEntries(Object.entries(table).map(([locale,lines])=>[locale,Object.fromEntries(EXPLAINER_KEYS.map((key,i)=>[key,lines[i]]))]));
export function explainer(locale,key){return EXPLAINERS[normalizeLocale(locale)]?.[key]||EXPLAINERS.en[key];}
