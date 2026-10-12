/* SGBuddy V3.6, authored source-locked UI messages. This file does NOT
 translate provider text, medical/legal notices, place names, fares, user data,
 or other text not explicitly listed in the reviewed source registry. */
import {normalizeLocale} from './i18n-v280.mjs';
export const CLASSIFIED_KEYS=["greetMorning","greetAfternoon","greetEvening","guestAccount","locationUnset","sourceLive","sourceMixed","sourceDemo","unitsMetric","unitsImperial","editMode","goHotel","placesCards","placesMap","placesFit","signIn","createAccount","useLocation","notNow"];
export const CLASSIFIED_ROWS={"en":["Good morning","Good afternoon","Good evening","Account","Location not set yet","LIVE GOVERNMENT DATA","MIXED LIVE + DEMO","DEMO MODE","Metric · °C","Imperial · °F","Change","↗ Get me back to my hotel","Cards","Map","Fit all","Sign in","Create account","Use my location","Not now"],"zh-CN":["早上好","下午好","晚上好","账户","尚未设置位置","政府实时数据","实时数据与演示数据混合","演示模式","公制 · °C","英制 · °F","更改","↗ 返回我的酒店","卡片","地图","显示全部","登录","创建账户","使用我的位置","暂不"],"zh-TW":["早安","午安","晚安","帳戶","尚未設定位置","政府即時資料","即時與示範資料混合","示範模式","公制 · °C","英制 · °F","變更","↗ 返回我的飯店","卡片","地圖","顯示全部","登入","建立帳戶","使用我的位置","稍後"],"ms":["Selamat pagi","Selamat tengah hari","Selamat malam","Akaun","Lokasi belum ditetapkan","DATA KERAJAAN LANGSUNG","GABUNGAN LANGSUNG + DEMO","MOD DEMO","Metrik · °C","Imperial · °F","Ubah","↗ Bawa saya pulang ke hotel","Kad","Peta","Papar semua","Log masuk","Cipta akaun","Gunakan lokasi saya","Bukan sekarang"],"id":["Selamat pagi","Selamat siang","Selamat malam","Akun","Lokasi belum diatur","DATA PEMERINTAH LANGSUNG","CAMPURAN LANGSUNG + DEMO","MODE DEMO","Metrik · °C","Imperial · °F","Ubah","↗ Kembali ke hotel saya","Kartu","Peta","Tampilkan semua","Masuk","Buat akun","Gunakan lokasi saya","Nanti saja"],"ja":["おはようございます","こんにちは","こんばんは","アカウント","位置情報が未設定です","政府のリアルタイムデータ","リアルタイム＋デモの混合","デモモード","メートル法 · °C","ヤード・ポンド法 · °F","変更","↗ ホテルに戻る","カード","地図","すべて表示","ログイン","アカウントを作成","現在地を使用","今はしない"],"ko":["좋은 아침이에요","안녕하세요","좋은 저녁이에요","계정","위치가 설정되지 않았습니다","정부 실시간 데이터","실시간 데이터 + 데모 혼합","데모 모드","미터법 · °C","야드파운드법 · °F","변경","↗ 호텔로 돌아가기","카드","지도","모두 보기","로그인","계정 만들기","내 위치 사용","나중에"],"th":["สวัสดีตอนเช้า","สวัสดีตอนบ่าย","สวัสดีตอนเย็น","บัญชี","ยังไม่ได้ตั้งค่าตำแหน่ง","ข้อมูลภาครัฐแบบสด","ข้อมูลสดและข้อมูลสาธิต","โหมดสาธิต","เมตริก · °C","อิมพีเรียล · °F","เปลี่ยน","↗ พากลับโรงแรม","การ์ด","แผนที่","แสดงทั้งหมด","เข้าสู่ระบบ","สร้างบัญชี","ใช้ตำแหน่งของฉัน","ยังไม่ตอนนี้"],"vi":["Chào buổi sáng","Chào buổi chiều","Chào buổi tối","Tài khoản","Chưa thiết lập vị trí","DỮ LIỆU CHÍNH PHỦ TRỰC TIẾP","KẾT HỢP DỮ LIỆU TRỰC TIẾP + DEMO","CHẾ ĐỘ DEMO","Hệ mét · °C","Hệ Anh · °F","Thay đổi","↗ Đưa tôi về khách sạn","Thẻ","Bản đồ","Hiện tất cả","Đăng nhập","Tạo tài khoản","Dùng vị trí của tôi","Để sau"],"fr":["Bonjour","Bon après-midi","Bonsoir","Compte","Position non définie","DONNÉES PUBLIQUES EN DIRECT","DONNÉES EN DIRECT + DÉMO","MODE DÉMO","Métrique · °C","Impérial · °F","Modifier","↗ Retourner à mon hôtel","Cartes","Carte","Tout afficher","Se connecter","Créer un compte","Utiliser ma position","Pas maintenant"],"es":["Buenos días","Buenas tardes","Buenas noches","Cuenta","Ubicación sin configurar","DATOS OFICIALES EN DIRECTO","DATOS EN DIRECTO + DEMO","MODO DEMO","Métrico · °C","Imperial · °F","Cambiar","↗ Volver a mi hotel","Tarjetas","Mapa","Mostrar todo","Iniciar sesión","Crear cuenta","Usar mi ubicación","Ahora no"],"pt-BR":["Bom dia","Boa tarde","Boa noite","Conta","Localização não definida","DADOS GOVERNAMENTAIS AO VIVO","DADOS AO VIVO + DEMONSTRAÇÃO","MODO DEMONSTRAÇÃO","Métrico · °C","Imperial · °F","Alterar","↗ Voltar para meu hotel","Cartões","Mapa","Mostrar tudo","Entrar","Criar conta","Usar minha localização","Agora não"]};
export const CLASSIFIED_MESSAGES=Object.fromEntries(Object.entries(CLASSIFIED_ROWS).map(([locale,values])=>[
 locale,Object.fromEntries(CLASSIFIED_KEYS.map((key,i)=>[key,values[i]]))
]));
export const HTML_CLASSIFICATION={
 "localizedNew": [
  "greeting",
  "accountButtonText",
  "locationStatus",
  "sourceBadge",
  "unitsToggle",
  "editPersonaButton",
  "goHotelButton",
  "placesCardsButton",
  "placesMapButton",
  "fitPlacesMap",
  "signInButton",
  "createAccountButton",
  "allowLocationButton",
  "notNowLocationButton"
 ],
 "existingLocalized": [
  "envHeadline",
  "accountHubTitle",
  "accountHubStatus",
  "accountSyncText",
  "accountSyncBadge"
 ],
 "providerOwned": [
  "weatherLabel",
  "envForecast",
  "envDetails"
 ],
 "properNames": [
  "placeLabel",
  "openGoogleTrip"
 ],
 "dynamicFollowUp": [
  "modeText",
  "personaFocusTitle",
  "personaFocusCopy",
  "journeyMapTitle",
  "personaPanelLabel",
  "personaPanelTitle",
  "personaPanelCopy",
  "placesPersonaHint",
  "dataCoreStatus"
 ]
};
export function classifiedText(locale,key){
 return CLASSIFIED_MESSAGES[normalizeLocale(locale)]?.[key]||CLASSIFIED_MESSAGES.en[key]||key;
}
