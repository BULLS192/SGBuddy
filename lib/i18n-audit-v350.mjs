/* SGBuddy V3.5. Source-locked, first-party UI-only messages.
 Do not infer translations for routes, provider statements, fares, legal guidance,
 official place/address records, account values or user input. */
import {normalizeLocale} from './i18n-v280.mjs';
export const AUDIT_KEYS=["planAround","nextUpFinding","nextUpInstructions","tripIntelChecking","tripIntelCombining","journeyReady","placesBackHotel","copyPairLink","closePair","moneyNearMe","fxEmpty","dataCoreSummary","dataCoreWaiting","signOut","personaQuestion","personaIntro","personaDuration","personaApply","locationQuestion","installTitle","merliGreeting","merliMore","merliLess"];
export const AUDIT_SURFACES={
 "home": [
  [
   "#planAroundConditions",
   "planAround",
   2
  ],
  [
   "#nextUpTitle",
   "nextUpFinding",
   1
  ],
  [
   "#nextUpCopy",
   "nextUpInstructions",
   1
  ],
  [
   "#tripIntelTitle",
   "tripIntelChecking",
   1
  ],
  [
   "#tripIntelCopy",
   "tripIntelCombining",
   1
  ]
 ],
 "move": [
  [
   "#journeyStatus",
   "journeyReady",
   1
  ]
 ],
 "discover": [
  [
   "#placesBackHotel",
   "placesBackHotel",
   2
  ]
 ],
 "saved": [
  [
   "#copyPairLinkButton",
   "copyPairLink",
   1
  ],
  [
   "#closePairPanelButton",
   "closePair",
   1
  ]
 ],
 "money": [
  [
   "#moneyChangerNearMe",
   "moneyNearMe",
   2
  ],
  [
   "#fxResult",
   "fxEmpty",
   1
  ]
 ],
 "account": [
  [
   "#dataCoreSummary",
   "dataCoreSummary",
   2
  ],
  [
   "#dataCoreResult",
   "dataCoreWaiting",
   1
  ],
  [
   "#signOutButton",
   "signOut",
   2
  ]
 ],
 "onboarding": [
  [
   "#personaSheetTitle",
   "personaQuestion",
   2
  ],
  [
   "#personaSheetIntro",
   "personaIntro",
   1
  ],
  [
   "#personaStayLabel",
   "personaDuration",
   1
  ],
  [
   "#savePersonaButton",
   "personaApply",
   2
  ],
  [
   "#locationSheetTitle",
   "locationQuestion",
   1
  ],
  [
   "#installSheetTitle",
   "installTitle",
   1
  ]
 ],
 "merli": [
  [
   "#buddyReply",
   "merliGreeting",
   2
  ],
  [
   "#uxMerliMore",
   "merliMore",
   1
  ],
  [
   "#uxMerliMore",
   "merliLess",
   1
  ]
 ]
};
const rows={"en":["Plan around conditions","Finding your best nearby departure","Allow location or use your saved stops and stations so SGBuddy can prioritize what matters to you.","Checking travel conditions","SGBuddy is combining weather, rail and traffic conditions.","Ready to plan a route.","Back to hotel","Copy link","Close","Near me","Choose an amount and currencies.","SGBuddy combines transport, weather, disruption and profile data behind one shared layer. This panel now checks those services rather than just describing them.","Waiting for the first system check.","Sign out","How are you using Singapore?","Choose the context that best fits right now. You can switch modes anytime.","How long will this context last?","Use this SGBuddy mode","Use your location?","Add SGBuddy to your Home Screen","Hi, I’m Merli! 🫶 Need a hand getting around or discovering Singapore?","More ways Merli can help","Hide extra actions"],"zh-CN":["根据实时状况规划","正在寻找附近最合适的出发班次","允许定位，或使用已收藏的车站和巴士站，让 SGBuddy 优先显示相关信息。","正在检查出行状况","SGBuddy 正在综合天气、轨道交通和道路信息。","已准备好规划路线。","返回酒店","复制链接","关闭","附近","选择金额和货币。","SGBuddy 将交通、天气、突发状况和个人资料汇集到同一平台。本面板会实际检查这些服务的状态。","等待首次系统检查。","退出登录","您如何使用新加坡生活助手？","选择目前最符合您需求的使用情境。您可以随时切换模式。","这种使用情境会持续多久？","使用此 SGBuddy 模式","使用您的位置？","将 SGBuddy 添加到主屏幕","嗨，我是 Merli！🫶 需要帮忙出行或探索新加坡吗？","Merli 还能提供更多帮助","收起其他操作"],"zh-TW":["依即時狀況規劃","正在尋找附近最合適的出發班次","允許定位，或使用已收藏的車站和巴士站，讓 SGBuddy 優先顯示相關資訊。","正在確認出行狀況","SGBuddy 正在整合天氣、軌道交通和路況資訊。","可以開始規劃路線。","返回飯店","複製連結","關閉","附近","選擇金額和貨幣。","SGBuddy 將交通、天氣、突發事件和個人資料整合至同一介面。本面板會實際檢查各項服務的狀態。","等待首次系統檢查。","登出","您打算如何使用新加坡生活助手？","選擇目前最符合需求的使用情境。您可以隨時切換模式。","這個使用情境會持續多久？","使用此 SGBuddy 模式","使用您的位置？","將 SGBuddy 加到主畫面","嗨，我是 Merli！🫶 需要幫忙出行或探索新加坡嗎？","Merli 還能提供更多協助","收起其他操作"],"ms":["Rancang mengikut keadaan semasa","Mencari pelepasan terdekat yang terbaik","Benarkan lokasi atau gunakan hentian dan stesen tersimpan supaya SGBuddy boleh mengutamakan perkara yang penting kepada anda.","Memeriksa keadaan perjalanan","SGBuddy sedang menggabungkan keadaan cuaca, rel dan trafik.","Sedia merancang laluan.","Kembali ke hotel","Salin pautan","Tutup","Berdekatan saya","Pilih jumlah dan mata wang.","SGBuddy menyatukan data pengangkutan, cuaca, gangguan dan profil. Panel ini menyemak status perkhidmatan tersebut.","Menunggu semakan sistem pertama.","Log keluar","Bagaimanakah anda menggunakan Singapura?","Pilih konteks yang paling sesuai sekarang. Anda boleh bertukar mod pada bila-bila masa.","Berapa lama konteks ini akan digunakan?","Gunakan mod SGBuddy ini","Gunakan lokasi anda?","Tambahkan SGBuddy ke Skrin Utama","Hai, saya Merli! 🫶 Perlukan bantuan bergerak atau meneroka Singapura?","Lagi cara Merli boleh membantu","Sembunyikan tindakan tambahan"],"id":["Rencanakan sesuai kondisi","Mencari keberangkatan terdekat yang terbaik","Izinkan lokasi atau gunakan halte dan stasiun tersimpan agar SGBuddy dapat memprioritaskan hal yang penting bagi Anda.","Memeriksa kondisi perjalanan","SGBuddy sedang menggabungkan kondisi cuaca, kereta, dan lalu lintas.","Siap merencanakan rute.","Kembali ke hotel","Salin tautan","Tutup","Di sekitar saya","Pilih jumlah dan mata uang.","SGBuddy menyatukan data transportasi, cuaca, gangguan, dan profil. Panel ini memeriksa status layanan tersebut.","Menunggu pemeriksaan sistem pertama.","Keluar","Bagaimana Anda menggunakan Singapura?","Pilih konteks yang paling sesuai saat ini. Anda dapat mengganti mode kapan saja.","Berapa lama konteks ini akan berlaku?","Gunakan mode SGBuddy ini","Gunakan lokasi Anda?","Tambahkan SGBuddy ke Layar Utama","Hai, aku Merli! 🫶 Butuh bantuan berkeliling atau menjelajahi Singapura?","Cara lain Merli dapat membantu","Sembunyikan tindakan tambahan"],"ja":["現在の状況を考慮して計画","近くの最適な出発便を探しています","位置情報を許可するか、保存した停留所・駅を使うと、SGBuddy が必要な情報を優先して表示します。","移動状況を確認中","SGBuddy が天気、鉄道、道路交通の状況を確認しています。","経路を計画できます。","ホテルに戻る","リンクをコピー","閉じる","現在地周辺","金額と通貨を選択してください。","SGBuddy は交通、天気、運行障害、プロフィール情報をまとめて表示します。この画面では各サービスの状態を実際に確認します。","最初のシステムチェックを待機中。","ログアウト","シンガポールではどのように利用しますか？","現在の目的に最も近いモードを選んでください。いつでも切り替えられます。","この利用状況はどのくらい続きますか？","この SGBuddy モードを使用","位置情報を使用しますか？","SGBuddy をホーム画面に追加","こんにちは、Merli です！🫶 シンガポールの移動や観光をお手伝いしましょうか？","Merli にできるその他のこと","追加の操作を隠す"],"ko":["현재 상황에 맞춰 계획하기","가까운 최적의 출발편을 찾는 중","위치 사용을 허용하거나 저장한 정류장과 역을 이용하면 SGBuddy가 필요한 정보를 우선 표시합니다.","이동 상황 확인 중","SGBuddy가 날씨, 철도, 도로 교통 상황을 종합하고 있습니다.","경로를 계획할 준비가 되었습니다.","호텔로 돌아가기","링크 복사","닫기","내 주변","금액과 통화를 선택하세요.","SGBuddy는 교통, 날씨, 운행 장애, 프로필 데이터를 한곳에서 보여줍니다. 이 화면에서는 각 서비스의 실제 상태를 확인합니다.","첫 시스템 점검을 기다리는 중입니다.","로그아웃","싱가포르에서 어떤 용도로 이용하시나요?","현재 상황에 가장 적합한 모드를 선택하세요. 언제든 변경할 수 있습니다.","이 모드는 얼마나 오래 사용하시나요?","이 SGBuddy 모드 사용","위치를 사용하시겠어요?","홈 화면에 SGBuddy 추가","안녕하세요, Merli예요! 🫶 싱가포르 이동이나 탐방을 도와드릴까요?","Merli가 도울 수 있는 다른 방법","추가 기능 숨기기"],"th":["วางแผนตามสถานการณ์","กำลังค้นหาเที่ยวออกเดินทางใกล้คุณที่เหมาะที่สุด","อนุญาตการเข้าถึงตำแหน่งหรือใช้ป้ายรถและสถานีที่บันทึกไว้ เพื่อให้ SGBuddy จัดลำดับข้อมูลที่สำคัญสำหรับคุณ","กำลังตรวจสอบสภาพการเดินทาง","SGBuddy กำลังรวบรวมสภาพอากาศ รถไฟ และการจราจร","พร้อมวางแผนเส้นทางแล้ว","กลับโรงแรม","คัดลอกลิงก์","ปิด","ใกล้ฉัน","เลือกจำนวนเงินและสกุลเงิน","SGBuddy รวมข้อมูลการเดินทาง อากาศ เหตุขัดข้อง และโปรไฟล์ไว้ในที่เดียว หน้านี้ตรวจสอบสถานะบริการเหล่านั้นจริง","รอการตรวจสอบระบบครั้งแรก","ออกจากระบบ","คุณใช้บริการในสิงคโปร์แบบใด?","เลือกบริบทที่ตรงกับคุณตอนนี้มากที่สุด สามารถเปลี่ยนโหมดได้ทุกเมื่อ","คุณจะใช้บริบทนี้นานแค่ไหน?","ใช้โหมด SGBuddy นี้","ใช้ตำแหน่งของคุณหรือไม่?","เพิ่ม SGBuddy ไปยังหน้าจอหลัก","สวัสดี ฉันชื่อ Merli! 🫶 ให้ช่วยเดินทางหรือสำรวจสิงคโปร์ไหม?","วิธีอื่นที่ Merli ช่วยคุณได้","ซ่อนตัวเลือกเพิ่มเติม"],"vi":["Lập kế hoạch theo tình hình","Đang tìm chuyến khởi hành gần bạn phù hợp nhất","Cho phép truy cập vị trí hoặc dùng trạm và ga đã lưu để SGBuddy ưu tiên những thông tin quan trọng với bạn.","Đang kiểm tra tình hình di chuyển","SGBuddy đang tổng hợp thời tiết, đường sắt và giao thông.","Sẵn sàng lập lộ trình.","Quay về khách sạn","Sao chép liên kết","Đóng","Gần tôi","Chọn số tiền và loại tiền tệ.","SGBuddy kết hợp dữ liệu giao thông, thời tiết, sự cố và hồ sơ trong một nơi. Bảng này thực sự kiểm tra trạng thái các dịch vụ.","Đang chờ lần kiểm tra hệ thống đầu tiên.","Đăng xuất","Bạn dùng SGBuddy ở Singapore như thế nào?","Chọn bối cảnh phù hợp nhất lúc này. Bạn có thể đổi chế độ bất cứ khi nào.","Bạn sẽ dùng bối cảnh này trong bao lâu?","Dùng chế độ SGBuddy này","Sử dụng vị trí của bạn?","Thêm SGBuddy vào màn hình chính","Chào bạn, mình là Merli! 🫶 Cần giúp đi lại hay khám phá Singapore không?","Những cách khác Merli có thể giúp","Ẩn thao tác bổ sung"],"fr":["Planifier selon les conditions","Recherche du meilleur départ à proximité","Autorisez la localisation ou utilisez vos arrêts et stations enregistrés pour que SGBuddy donne la priorité aux informations utiles.","Vérification des conditions de trajet","SGBuddy recoupe la météo, le réseau ferroviaire et la circulation.","Prêt à préparer un itinéraire.","Retour à l’hôtel","Copier le lien","Fermer","À proximité","Choisissez un montant et des devises.","SGBuddy rassemble transports, météo, perturbations et profil dans un même espace. Ce panneau vérifie réellement ces services.","En attente du premier contrôle du système.","Se déconnecter","Comment utilisez-vous SGBuddy à Singapour ?","Choisissez la situation qui vous correspond maintenant. Vous pouvez changer de mode à tout moment.","Combien de temps durera cette situation ?","Utiliser ce mode SGBuddy","Utiliser votre position ?","Ajouter SGBuddy à l’écran d’accueil","Bonjour, je suis Merli ! 🫶 Besoin d’aide pour vous déplacer ou découvrir Singapour ?","D’autres façons dont Merli peut aider","Masquer les autres actions"],"es":["Planificar según las condiciones","Buscando la mejor salida cercana","Permite acceder a tu ubicación o usa tus paradas y estaciones guardadas para que SGBuddy priorice lo que te importa.","Comprobando las condiciones del viaje","SGBuddy está combinando datos meteorológicos, ferroviarios y de tráfico.","Listo para planificar una ruta.","Volver al hotel","Copiar enlace","Cerrar","Cerca de mí","Elige un importe y las monedas.","SGBuddy reúne transporte, clima, incidencias y datos de perfil en un solo lugar. Este panel comprueba el estado real de esos servicios.","Esperando la primera comprobación del sistema.","Cerrar sesión","¿Cómo utilizas SGBuddy en Singapur?","Elige la situación que mejor se adapte a ti ahora. Puedes cambiar de modo cuando quieras.","¿Cuánto durará esta situación?","Usar este modo de SGBuddy","¿Usar tu ubicación?","Añadir SGBuddy a la pantalla de inicio","¡Hola, soy Merli! 🫶 ¿Necesitas ayuda para moverte o descubrir Singapur?","Otras formas en que Merli puede ayudar","Ocultar opciones adicionales"],"pt-BR":["Planejar conforme as condições","Buscando a melhor saída perto de você","Permita o acesso à localização ou use paradas e estações salvas para que o SGBuddy priorize o que importa para você.","Verificando as condições de deslocamento","O SGBuddy está reunindo informações de clima, trens e trânsito.","Pronto para planejar uma rota.","Voltar ao hotel","Copiar link","Fechar","Perto de mim","Escolha um valor e as moedas.","O SGBuddy reúne transporte, clima, interrupções e dados do perfil em um só lugar. Este painel verifica de fato o status desses serviços.","Aguardando a primeira verificação do sistema.","Sair da conta","Como você usa o SGBuddy em Singapura?","Escolha o contexto que mais combina com seu momento. Você pode mudar de modo a qualquer hora.","Por quanto tempo esse contexto será usado?","Usar este modo do SGBuddy","Usar sua localização?","Adicionar o SGBuddy à tela inicial","Oi, eu sou a Merli! 🫶 Quer ajuda para se locomover ou descobrir Singapura?","Outras maneiras de a Merli ajudar","Ocultar opções adicionais"]};
export const AUDIT_MESSAGES=Object.fromEntries(Object.entries(rows).map(([locale,values])=>[
 locale,Object.fromEntries(AUDIT_KEYS.map((key,index)=>[key,values[index]]))
]));
export function auditText(locale,key){
 return AUDIT_MESSAGES[normalizeLocale(locale)]?.[key]||AUDIT_MESSAGES.en[key]||key;
}
export const AUDIT_ENGLISH=AUDIT_MESSAGES.en;
