/* SGBuddy V4.24 — official-source essentials; pure, testable rules. */
export const OFFICIAL_HOSTS = ['ica.gov.sg','customs.gov.sg','hsa.gov.sg','cnb.gov.sg','scdf.gov.sg','police.gov.sg','moh.gov.sg','mom.gov.sg','moe.gov.sg','nea.gov.sg','lta.gov.sg','iras.gov.sg','mfa.gov.sg','gov.sg','sgsecure.gov.sg'];
export const OFFICIAL_LINKS = Object.freeze({
  sgac:'https://www.ica.gov.sg/enter-transit-depart/entering-singapore/sg-arrival-card',
  visa:'https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements',
  entry:'https://www.ica.gov.sg/enter-transit-depart/entering-singapore/',
  customs:'https://www.customs.gov.sg/at-customs/arriving-in-singapore/prohibited-controlled-goods/',
  declare:'https://www.customs.gov.sg/at-customs/arriving-in-singapore/travellers-guide/',
  medications:'https://www.hsa.gov.sg/travelling-with-medication-and-medical-devices/',
  drugs:'https://www.cnb.gov.sg/singapore-drug-situation/misuse-of-drugs-act/',
  vapes:'https://www.hsa.gov.sg/tobacco-regulation/vaping-enforcement/',
  embassy:'https://www.mfa.gov.sg/Overseas-Mission/Find-a-Singapore-Overseas-Mission',
  police:'https://www.police.gov.sg/contact-us',
  ambulance:'https://www.scdf.gov.sg/home/about-scdf/emergency-medical-services'
});
export const EMERGENCY_CONTACTS = Object.freeze([
 {id:'police',number:'999',kind:'call',label:'Police emergency',critical:true},
 {id:'scdf',number:'995',kind:'call',label:'Ambulance / fire emergency',critical:true},
 {id:'police_sms',number:'70999',kind:'sms',label:'Police emergency SMS — if unsafe or unable to speak',critical:false},
 {id:'police_info',number:'18002550000',kind:'call',label:'Police non-emergency information',critical:false}
]);
export const RESIDENT_STATUSES = new Set(['citizen','pr','long_term','work_pass','student_pass']);
const DAY=86_400_000;
export function validDay(value){
 if(typeof value!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T12:00:00Z');
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function sgacRequired({status='visitor',border='air',clearsImmigration=true}={}){
 if(!clearsImmigration)return false;
 return !(border==='land'&&RESIDENT_STATUSES.has(status));
}
export function sgacWindow(day){
 if(!validDay(day))return null;
 const utc=Date.parse(day+'T12:00:00Z');
 return {opens:new Date(utc-2*DAY).toISOString().slice(0,10),closes:day};
}
export function daysUntil(day,today){
 if(!validDay(day)||!validDay(today))return null;
 return Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/DAY);
}
export function singaporeDay(now=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function arrivalTasks(profile={}){
 const status=profile.status||'visitor',needs=sgacRequired(profile);
 return [
  {id:'passport',label:'Check travel document validity',detail:status==='citizen'?'Carry a valid Singapore passport.':'Most non-Singapore passport holders need at least six months of validity.',url:OFFICIAL_LINKS.entry},
  {id:'visa',label:'Check entry visa or pass',detail:'Requirements depend on your travel document. A visa does not guarantee admission.',url:OFFICIAL_LINKS.visa},
  ...(needs?[{id:'sgac',label:'Submit the free SG Arrival Card',detail:'Submit within the three days including arrival day, before reaching Singapore.',url:OFFICIAL_LINKS.sgac}]:[]),
  {id:'restricted',label:'Check restricted and prohibited goods',detail:'Vapes and illicit drugs are prohibited. Some medicines and other goods need approval.',url:OFFICIAL_LINKS.customs},
  {id:'declare',label:'Check customs and cash declarations',detail:'Declare controlled, taxable or dutiable goods and physical currency/bearer instruments exceeding S$20,000.',url:OFFICIAL_LINKS.declare},
  {id:'epass',label:'Review immigration clearance and onward travel',detail:'Foreign visitors should check their electronic Visit Pass and permitted stay after arrival.',url:OFFICIAL_LINKS.entry}
 ];
}
export function officialUrl(input){
 try{
  const url=new URL(input);
  return url.protocol==='https:'&&OFFICIAL_HOSTS.some(host=>url.hostname===host||url.hostname.endsWith('.'+host))?url.href:null;
 }catch{return null}
}
export function visibleNotices(items,mode='resident',today=singaporeDay()){
 if(!Array.isArray(items))return [];
 return items.filter(n=>n&&n.status==='approved'&&n.audiences?.includes(mode)&&officialUrl(n.sourceUrl)&&validDay(n.reviewedAt)&&(!n.expiresAt||validDay(n.expiresAt)&&n.expiresAt>=today))
  .sort((a,b)=>(b.reviewedAt||'').localeCompare(a.reviewedAt||'')||(b.effectiveAt||'').localeCompare(a.effectiveAt||''));
}
