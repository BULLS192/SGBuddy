/* SGBuddy air quality visual classification — NEA 24h PSI and 1h PM2.5.
 * These are separate scales. Never use a health/green color for stale or unverified data.
 */
import {normalizeLocale} from './i18n-v280.mjs';

const PSI_BANDS=[
  {max:50,key:'good',tone:'good'},
  {max:100,key:'moderate',tone:'moderate'},
  {max:200,key:'unhealthy',tone:'unhealthy'},
  {max:300,key:'veryUnhealthy',tone:'very-unhealthy'},
  {max:Infinity,key:'hazardous',tone:'hazardous'}
];
const PM_BANDS=[
  {max:55,key:'normal',tone:'good'},
  {max:150,key:'elevated',tone:'moderate'},
  {max:250,key:'high',tone:'unhealthy'},
  {max:Infinity,key:'veryHigh',tone:'hazardous'}
];

export function numericAirValue(raw){
  if(raw===null||raw===undefined||typeof raw==='boolean'||String(raw).trim()==='')return null;
  const value=Number(raw);
  return Number.isFinite(value)&&value>=0?value:null;
}
export function classifyAirReading(kind,raw){
  const value=numericAirValue(raw);
  if(value===null)return null;
  const bands=kind==='psi'?PSI_BANDS:kind==='pm25'?PM_BANDS:null;
  if(!bands)return null;
  const band=bands.find(entry=>value<=entry.max);
  return {...band,value};
}
export function isCurrentAirReading(item,{cached=false,maxAgeMinutes=120,now=Date.now()}={}){
  if(!item||cached||!item.updatedAt)return false;
  const observed=Date.parse(item.updatedAt);
  if(!Number.isFinite(observed))return false;
  const ageMinutes=(now-observed)/60000;
  return ageMinutes>=-15&&ageMinutes<=maxAgeMinutes;
}
// SGBuddy's existing PSI names live in i18n-air-v413; only new PM labels live here.
// Translations remain subject to native-speaker QA.
const PM_LABELS={
  en:['Normal','Elevated','High','Very high'],
  'zh-CN':['正常','升高','高','非常高'],
  'zh-TW':['正常','偏高','高','非常高'],
  ms:['Normal','Meningkat','Tinggi','Sangat tinggi'],
  id:['Normal','Meningkat','Tinggi','Sangat tinggi'],
  ja:['通常','上昇','高い','非常に高い'],
  ko:['정상','상승','높음','매우 높음'],
  th:['ปกติ','สูงขึ้น','สูง','สูงมาก'],
  vi:['Bình thường','Tăng cao','Cao','Rất cao'],
  fr:['Normal','Élevé','Haut','Très élevé'],
  es:['Normal','Elevado','Alto','Muy alto'],
  'pt-BR':['Normal','Elevado','Alto','Muito alto']
};
export function pmBandLabel(key,locale='en'){
  const index=['normal','elevated','high','veryHigh'].indexOf(key);
  return index<0?'':(PM_LABELS[normalizeLocale(locale)]||PM_LABELS.en)[index];
}
