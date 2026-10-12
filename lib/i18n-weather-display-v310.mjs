/* Controlled presentation translations for standard weather and 24-hour PSI labels.
 * Only known enumerated categories are localized; numeric measurements and
 * provider messages remain verbatim. This is NOT an interpretation of live PSI.
 */
import {normalizeLocale} from './i18n-v280.mjs';
export const WEATHER_DISPLAY_KEYS=["partlyDay","partlyNight","cloudy","fair","lightRain","showers","thunder","humidity","rain","unhealthy","moderate","good","veryUnhealthy","hazardous"];
const ROWS={"en":["Partly Cloudy (Day)","Partly Cloudy (Night)","Cloudy","Fair","Light Rain","Showers","Thundery Showers","humidity","rain","Unhealthy","Moderate","Good","Very Unhealthy","Hazardous"],"zh-CN":["白天局部多云","夜间局部多云","多云","晴朗","小雨","阵雨","雷阵雨","湿度","降雨","不健康","中等","良好","非常不健康","危险"],"zh-TW":["白天局部多雲","夜間局部多雲","多雲","晴朗","小雨","陣雨","雷陣雨","濕度","降雨","不健康","中等","良好","非常不健康","危險"],"ms":["Separa mendung (siang)","Separa mendung (malam)","Mendung","Cerah","Hujan ringan","Hujan sekejap-sekejap","Hujan ribut petir","kelembapan","hujan","Tidak sihat","Sederhana","Baik","Sangat tidak sihat","Berbahaya"],"id":["Berawan sebagian (siang)","Berawan sebagian (malam)","Berawan","Cerah","Hujan ringan","Hujan lokal","Hujan disertai petir","kelembapan","hujan","Tidak sehat","Sedang","Baik","Sangat tidak sehat","Berbahaya"],"ja":["日中は一部曇り","夜間は一部曇り","曇り","晴れ","小雨","にわか雨","雷雨","湿度","降雨","健康に悪い","普通","良好","非常に健康に悪い","危険"],"ko":["낮에 구름 조금","밤에 구름 조금","흐림","맑음","약한 비","소나기","천둥번개 소나기","습도","강수","건강에 해로움","보통","좋음","매우 해로움","위험"],"th":["มีเมฆบางส่วน (กลางวัน)","มีเมฆบางส่วน (กลางคืน)","มีเมฆมาก","อากาศแจ่มใส","ฝนเล็กน้อย","ฝนตกเป็นช่วง","ฝนฟ้าคะนอง","ความชื้น","ฝน","ไม่ดีต่อสุขภาพ","ปานกลาง","ดี","ไม่ดีต่อสุขภาพอย่างมาก","อันตราย"],"vi":["Ít mây (ban ngày)","Ít mây (ban đêm)","Nhiều mây","Trời quang","Mưa nhẹ","Mưa rào","Mưa dông","độ ẩm","mưa","Không tốt cho sức khỏe","Trung bình","Tốt","Rất không tốt cho sức khỏe","Nguy hiểm"],"fr":["Partiellement nuageux (jour)","Partiellement nuageux (nuit)","Nuageux","Ciel dégagé","Pluie légère","Averses","Averses orageuses","humidité","pluie","Mauvais pour la santé","Modéré","Bon","Très mauvais pour la santé","Dangereux"],"es":["Parcialmente nublado (día)","Parcialmente nublado (noche)","Nublado","Despejado","Lluvia ligera","Chubascos","Tormentas","humedad","lluvia","Perjudicial para la salud","Moderado","Bueno","Muy perjudicial","Peligroso"],"pt-BR":["Parcialmente nublado (dia)","Parcialmente nublado (noite)","Nublado","Tempo firme","Chuva fraca","Pancadas de chuva","Pancadas com trovoadas","umidade","chuva","Prejudicial à saúde","Moderado","Bom","Muito prejudicial à saúde","Perigoso"]};
export const WEATHER_DISPLAY=Object.fromEntries(Object.entries(ROWS).map(([lang,rows])=>[lang,Object.fromEntries(WEATHER_DISPLAY_KEYS.map((key,i)=>[key,rows[i]]))]));
const CONDITION={ 'Partly Cloudy (Day)':'partlyDay','Partly Cloudy (Night)':'partlyNight',Cloudy:'cloudy',Fair:'fair','Light Rain':'lightRain',Showers:'showers','Thundery Showers':'thunder'};
const PSI={'Unhealthy':'unhealthy','Moderate':'moderate','Good':'good','Very Unhealthy':'veryUnhealthy','Hazardous':'hazardous'};
export const weatherDisplayText=(lang,key)=>WEATHER_DISPLAY[normalizeLocale(lang)]?.[key]||WEATHER_DISPLAY.en[key]||'';
function matchKnown(value,table){
 for(const locale of Object.values(WEATHER_DISPLAY))for(const [source,key] of Object.entries(table)){
  if(value===source||value===locale[key])return key;
 }
 return null;
}
export function localizedWeatherLabel(lang,source){
 const input=String(source||'').trim();
 const pattern=/^(.+?)(?:\s*[·•]\s*(\d{1,3})%\s+([^·•]+?))?(?:\s*[·•]\s*(\d+(?:\.\d+)?)\s+mm\s+([^·•]+))?$/u;
 const found=input.match(pattern);
 if(!found)return input;
 const kind=matchKnown(found[1].trim(),CONDITION);
 if(!kind)return input;
 let output=weatherDisplayText(lang,kind);
 if(found[2]!=null){
  const hum=found[3].trim();
  if(hum!=='humidity'&&!Object.values(WEATHER_DISPLAY).some(pack=>hum===pack.humidity))return input;
  output+=' · '+found[2]+'% '+weatherDisplayText(lang,'humidity');
 }
 if(found[4]!=null){
  const rain=found[5].trim();
  if(rain!=='rain'&&!Object.values(WEATHER_DISPLAY).some(pack=>rain===pack.rain))return input;
  output+=' · '+found[4]+' mm '+weatherDisplayText(lang,'rain');
 }
 return output;
}
export function localizedPsiLabel(lang,source){
 const text=String(source||'').trim();
 const match=text.match(/^(\d{1,3})\s*[·•]\s*(.+)$/u);
 if(!match)return text;
 const key=matchKnown(match[2].trim(),PSI);
 return key?match[1]+' · '+weatherDisplayText(lang,key):text;
}
