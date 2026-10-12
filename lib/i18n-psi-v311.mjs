/* Display labels only; official numeric PSI and source measurements are immutable. */
import {normalizeLocale} from './i18n-v280.mjs';
export const PSI_CATEGORIES=["Good","Moderate","Unhealthy","Very Unhealthy","Hazardous"];
const MESSAGES={"en":["Good","Moderate","Unhealthy","Very Unhealthy","Hazardous"],"zh-CN":["良好","中等","不健康","非常不健康","危险"],"zh-TW":["良好","中等","不健康","非常不健康","危險"],"ms":["Baik","Sederhana","Tidak sihat","Sangat tidak sihat","Berbahaya"],"id":["Baik","Sedang","Tidak sehat","Sangat tidak sehat","Berbahaya"],"ja":["良好","普通","健康に悪い","非常に健康に悪い","危険"],"ko":["좋음","보통","건강에 해로움","매우 해로움","위험"],"th":["ดี","ปานกลาง","ไม่ดีต่อสุขภาพ","ไม่ดีต่อสุขภาพอย่างมาก","อันตราย"],"vi":["Tốt","Trung bình","Không tốt cho sức khỏe","Rất có hại cho sức khỏe","Nguy hiểm"],"fr":["Bon","Modéré","Mauvais pour la santé","Très mauvais pour la santé","Dangereux"],"es":["Bueno","Moderado","Perjudicial para la salud","Muy perjudicial para la salud","Peligroso"],"pt-BR":["Bom","Moderado","Prejudicial à saúde","Muito prejudicial à saúde","Perigoso"]};
export const PSI_MESSAGES=Object.fromEntries(Object.entries(MESSAGES).map(([locale,row])=>[locale,Object.fromEntries(PSI_CATEGORIES.map((category,i)=>[category,row[i]]))]));
export function translatedPsi(locale,text){
 const input=String(text??'').trim();
 const match=input.match(/^(\d+(?:\.\d+)?)\s*·\s*(Good|Moderate|Unhealthy|Very Unhealthy|Hazardous)$/);
 if(!match)return input;
 return match[1]+' · '+PSI_MESSAGES[normalizeLocale(locale)][match[2]];
}
