/* Published iCalendar -> unapproved review candidates, never user-visible.
 * Public event feeds may include private sessions; exclude explicitly private/cancelled items.
 */
import {singaporeDate} from './calendar-v460.mjs';
const sgDate=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
export function icsDay(value){
 const text=String(value||'').trim();
 const m=text.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
 if(!m)return null;
 if(m[7]){
  const dt=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0)));
  return Number.isFinite(dt.valueOf())?sgDate(dt):null;
 }
 return m[1]+'-'+m[2]+'-'+m[3];
}
export function parseIcs(text){
 if(!String(text).includes('BEGIN:VCALENDAR'))throw Error('Not an iCalendar feed');
 const lines=String(text).replace(/\r\n/g,'\n').split('\n'),unfolded=[];
 for(const line of lines){if(/^[ \t]/.test(line)&&unfolded.length)unfolded[unfolded.length-1]+=line.slice(1);else unfolded.push(line);}
 const events=[];let row=null;
 for(const line of unfolded){
  if(line==='BEGIN:VEVENT'){row={};continue}
  if(line==='END:VEVENT'){if(row)events.push(row);row=null;continue}
  if(!row)continue;
  const i=line.indexOf(':');if(i<=0)continue;
  const prop=line.slice(0,i).split(';')[0].toUpperCase();
  if(['SUMMARY','DESCRIPTION','LOCATION','DTSTART','DTEND','STATUS','URL','UID'].includes(prop)){
   row[prop]=line.slice(i+1).replace(/\\n/g,' ');
   if(line.slice(0,i).includes('VALUE=DATE')&&['DTSTART','DTEND'].includes(prop))row[prop+'_ALLDAY']=true;
  }
 }
 return events;
}
export function publicCandidates(raw,source,day=singaporeDate()){
 const candidates=[],seen=new Set();
 for(const event of raw.slice(0,500)){
  const title=String(event.SUMMARY||'').trim(),privacy=[title,event.DESCRIPTION,event.LOCATION].join(' ').toLowerCase();
  if(!title||/\bprivate event\b|\binvitation only\b|\bclosed door\b|\bby invitation\b/.test(privacy)||event.STATUS==='CANCELLED')continue;
  const startDate=icsDay(event.DTSTART);
  let endDate=icsDay(event.DTEND)||startDate;
  if(event.DTEND_ALLDAY&&endDate){const d=new Date(endDate+'T12:00:00+08:00');endDate=sgDate(new Date(d.getTime()-86400000));}
  if(!startDate||!endDate||endDate<startDate||endDate<day)continue;
  const id=(source.id+'-'+title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)+'-'+startDate).slice(0,110);
  if(seen.has(id))continue;seen.add(id);
  let link=source.publicPage;
  try{const u=new URL(event.URL);if(u.protocol==='https:'&&u.hostname===new URL(source.publicPage).hostname)link=u.toString()}catch{}
  candidates.push({id,title,startDate,endDate,venue:source.venue,sourceId:source.sourceId,sourceUrl:link,status:'needs-review',access:'unverified',reason:'Check public admission and original official event details before publishing'});
 }
 return candidates.sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title)).slice(0,150);
}
