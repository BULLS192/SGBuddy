/* V3.1 fact translations: ID-keyed, source-text checked to avoid stale translations.
 * Unverified editorial content and changed source text retain the original.
 * Entity names and numeric dates are passed through unchanged. */
import {normalizeLocale} from './i18n-v280.mjs';
import {natureFactTranslation,NATURE_FACTS} from './i18n-nature-v311.mjs';
import {waterFactTranslation,WATER_SOURCE_FACTS} from './i18n-water-v312.mjs';
export const FACT_TRANSLATION_PATTERNS=["opened","reclaimed","openedHawker","openedBy","rebuilt","completed","built","previous","nationalFlower","started"];
const patternRows={"en":"{name} opened in {year}.|{name} was built on reclaimed land.|{name} opened as a hawker centre in {year}.|{name} was opened in {year} by then Prime Minister {person}.|{name} was rebuilt in {year}.|{name} was completed in {year}.|{name} was built in {year}.|{name} was previously called {other}.|Singapore's national flower is {name}.|{name} began at their present {site} site in {year}.","zh-CN":"{name} 于 {year} 年开业。|{name} 建在填海造地的土地上。|{name} 于 {year} 年作为小贩中心开业。|时任总理 {person} 于 {year} 年主持了 {name} 的开幕。|{name} 于 {year} 年重建。|{name} 于 {year} 年建成。|{name} 建于 {year} 年。|{name} 以前称为 {other}。|新加坡的国花是 {name}。|{name} 于 {year} 年在现在的 {site} 地点开始发展。","zh-TW":"{name} 於 {year} 年開幕。|{name} 建於填海造地的土地上。|{name} 於 {year} 年以小販中心形式開幕。|時任總理 {person} 於 {year} 年主持 {name} 開幕。|{name} 於 {year} 年重建。|{name} 於 {year} 年完工。|{name} 建於 {year} 年。|{name} 過去稱為 {other}。|新加坡的國花是 {name}。|{name} 於 {year} 年在現今的 {site} 地點開始發展。","ms":"{name} dibuka pada tahun {year}.|{name} dibina di atas tanah tebus guna.|{name} dibuka sebagai pusat penjaja pada tahun {year}.|{name} dirasmikan pada tahun {year} oleh Perdana Menteri ketika itu, {person}.|{name} dibina semula pada tahun {year}.|{name} siap dibina pada tahun {year}.|{name} dibina pada tahun {year}.|{name} dahulu dikenali sebagai {other}.|Bunga kebangsaan Singapura ialah {name}.|{name} bermula di tapak {site} sekarang pada tahun {year}.","id":"{name} dibuka pada tahun {year}.|{name} dibangun di atas tanah reklamasi.|{name} dibuka sebagai pusat hawker pada tahun {year}.|{name} diresmikan pada tahun {year} oleh Perdana Menteri saat itu, {person}.|{name} dibangun kembali pada tahun {year}.|{name} selesai dibangun pada tahun {year}.|{name} dibangun pada tahun {year}.|{name} dahulu disebut {other}.|Bunga nasional Singapura adalah {name}.|{name} mulai berada di lokasi {site} sekarang pada tahun {year}.","ja":"{name} は {year} 年に開業しました。|{name} は埋立地に建てられました。|{name} は {year} 年にホーカーセンターとして開業しました。|{name} は {year} 年に当時の首相 {person} によって開設されました。|{name} は {year} 年に建て替えられました。|{name} は {year} 年に完成しました。|{name} は {year} 年に建てられました。|{name} は以前 {other} と呼ばれていました。|シンガポールの国花は {name} です。|{name} は {year} 年に現在の {site} の場所で始まりました。","ko":"{name}은(는) {year}년에 개장했습니다.|{name}은(는) 매립지에 세워졌습니다.|{name}은(는) {year}년에 호커센터로 개장했습니다.|{name}은(는) {year}년에 당시 총리 {person}이(가) 개장했습니다.|{name}은(는) {year}년에 재건축되었습니다.|{name}은(는) {year}년에 완공되었습니다.|{name}은(는) {year}년에 건립되었습니다.|{name}의 이전 이름은 {other}이었습니다.|싱가포르의 국화는 {name}입니다.|{name}은(는) {year}년 현재의 {site} 부지에서 시작되었습니다.","th":"{name} เปิดในปี {year}|{name} สร้างบนที่ดินถมทะเล|{name} เปิดเป็นศูนย์อาหารฮอว์กเกอร์ในปี {year}|{name} เปิดในปี {year} โดยนายกรัฐมนตรีในขณะนั้น {person}|{name} ได้รับการสร้างใหม่ในปี {year}|{name} สร้างเสร็จในปี {year}|{name} สร้างขึ้นในปี {year}|{name} เดิมมีชื่อว่า {other}|ดอกไม้ประจำชาติสิงคโปร์คือ {name}|{name} เริ่มดำเนินการที่พื้นที่ {site} ปัจจุบันในปี {year}","vi":"{name} mở cửa năm {year}.|{name} được xây trên đất lấn biển.|{name} mở cửa với tư cách trung tâm hawker năm {year}.|{name} được Thủ tướng đương nhiệm {person} khai trương năm {year}.|{name} được xây dựng lại năm {year}.|{name} được hoàn thành năm {year}.|{name} được xây dựng năm {year}.|{name} trước đây có tên là {other}.|Quốc hoa của Singapore là {name}.|{name} bắt đầu tại địa điểm {site} hiện nay từ năm {year}.","fr":"{name} a ouvert en {year}.|{name} a été construit sur des terres gagnées sur la mer.|{name} a ouvert comme centre de restauration hawker en {year}.|{name} a été inauguré en {year} par le Premier ministre de l'époque, {person}.|{name} a été reconstruit en {year}.|{name} a été achevé en {year}.|{name} a été construit en {year}.|{name} s'appelait auparavant {other}.|La fleur nationale de Singapour est {name}.|{name} a commencé sur son site actuel de {site} en {year}.","es":"{name} abrió en {year}.|{name} se construyó sobre terreno ganado al mar.|{name} abrió como centro hawker en {year}.|{name} fue inaugurado en {year} por el entonces primer ministro {person}.|{name} fue reconstruido en {year}.|{name} se completó en {year}.|{name} fue construido en {year}.|{name} antes se llamaba {other}.|La flor nacional de Singapur es {name}.|{name} comenzó en su actual emplazamiento de {site} en {year}.","pt-BR":"{name} foi inaugurado em {year}.|{name} foi construído em terras recuperadas do mar.|{name} abriu como centro hawker em {year}.|{name} foi inaugurado em {year} pelo então primeiro-ministro {person}.|{name} foi reconstruído em {year}.|{name} foi concluído em {year}.|{name} foi construído em {year}.|{name} era conhecido anteriormente como {other}.|A flor nacional de Singapura é {name}.|{name} começou no atual local de {site} em {year}."};
export const FACT_TEMPLATES=Object.fromEntries(Object.entries(patternRows).map(([locale,line])=>{
 const cells=line.split('|');
 if(cells.length!==FACT_TRANSLATION_PATTERNS.length)throw Error('Incomplete fact templates: '+locale);
 return [locale,Object.fromEntries(FACT_TRANSLATION_PATTERNS.map((key,i)=>[key,cells[i]]))];
}));
export const LOCALIZED_FACTS={
 "FACT-00001": {
  "pattern": "opened",
  "values": {
   "name": "Chomp Chomp Food Centre",
   "year": "1972"
  },
  "source": "Chomp Chomp Food Centre opened in 1972."
 },
 "FACT-00004": {
  "pattern": "reclaimed",
  "values": {
   "name": "East Coast Lagoon Food Village"
  },
  "source": "East Coast Lagoon Food Village was built on reclaimed land."
 },
 "FACT-00005": {
  "pattern": "openedHawker",
  "values": {
   "name": "East Coast Lagoon Food Village",
   "year": "1978"
  },
  "source": "East Coast Lagoon Food Village opened as a hawker centre in 1978."
 },
 "FACT-00006": {
  "pattern": "openedBy",
  "values": {
   "name": "Geylang Serai Market",
   "year": "1964",
   "person": "Lee Kuan Yew"
  },
  "source": "Geylang Serai Market was opened in 1964 by then Prime Minister Lee Kuan Yew."
 },
 "FACT-00007": {
  "pattern": "rebuilt",
  "values": {
   "name": "Geylang Serai Market",
   "year": "2009"
  },
  "source": "Geylang Serai Market was rebuilt in 2009."
 },
 "FACT-00011": {
  "pattern": "completed",
  "values": {
   "name": "Old Airport Road Food Centre",
   "year": "1973"
  },
  "source": "Old Airport Road Food Centre was completed in 1973."
 },
 "FACT-00014": {
  "pattern": "built",
  "values": {
   "name": "Tekka Market",
   "year": "1915"
  },
  "source": "Tekka Market was built in 1915."
 },
 "FACT-00015": {
  "pattern": "previous",
  "values": {
   "name": "Tekka Market",
   "other": "Kandang Kerbau Market"
  },
  "source": "Tekka Market was previously called Kandang Kerbau Market."
 },
 "FACT-00020": {
  "pattern": "nationalFlower",
  "values": {
   "name": "Vanda Miss Joaquim"
  },
  "source": "Singapore's national flower is Vanda Miss Joaquim."
 },
 "FACT-BOT-001": {
  "pattern": "started",
  "values": {
   "name": "The Singapore Botanic Gardens",
   "site": "Tanglin",
   "year": "1859"
  },
  "source": "The Singapore Botanic Gardens began at their present Tanglin site in 1859."
 }
};
export function factTranslation(locale,record){
 const lang=normalizeLocale(locale);
 if(lang==='en'||!record?.id||!record.text)return null;
 const item=LOCALIZED_FACTS[record.id];
 if(!item)return natureFactTranslation(locale,record)||waterFactTranslation(locale,record);
 if(item.source!==record.text||record.status!=='verified')return null;
 const template=FACT_TEMPLATES[lang]?.[item.pattern];
 if(!template)return null;
 return template.replace(/\{(\w+)\}/g,(match,key)=>Object.prototype.hasOwnProperty.call(item.values,key)?item.values[key]:match);
}
export const translatedFactCount=Object.keys(LOCALIZED_FACTS).length+Object.keys(NATURE_FACTS).length+Object.keys(WATER_SOURCE_FACTS).length;
