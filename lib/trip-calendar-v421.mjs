/* V4.21 Wave 1: explicit, client-local .ics export of timed stops only.
 * No inferred visit duration, attendees, alarms, bookings or network uploads.
 */
import {dayDate} from './trip-v260.mjs';
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const timePattern=/^([01]\d|2[0-3]):[0-5]\d$/;
const validDate=s=>datePattern.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const safe=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').slice(0,1200);
export function escapeIcsText(raw){
 return safe(raw).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
}
// RFC 5545 folds at 75 UTF-8 octets, not 75 JavaScript code units.
export function foldIcsLine(line){
 const parts=[];let current='',bytes=0;
 for(const glyph of String(line)){
  const len=new TextEncoder().encode(glyph).length;
  if(bytes+len>75){parts.push(current);current=' ';bytes=1;}
  current+=glyph;bytes+=len;
 }
 if(current)parts.push(current);
 return parts.join('\r\n');
}
const stamp=date=>{
 const d=new Date(date);
 if(!Number.isFinite(d.valueOf()))throw Error('Invalid export timestamp');
 return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
};
export function calendarForTrip(trip,{timestamp=new Date()}={}){
 if(!trip||!validDate(trip.startDate)||!Array.isArray(trip.days)||trip.days.length>14||trip.days.length<1)throw Error('Invalid itinerary');
 const events=[],skipped=[];
 const now=stamp(timestamp);
 trip.days.forEach((day,dayIndex)=>{
  if(!Array.isArray(day)||day.length>30)throw Error('Invalid day');
  const dayString=dayDate(trip.startDate,dayIndex);
  day.forEach((stop,stopIndex)=>{
   if(!timePattern.test(stop?.time||'')){skipped.push({dayIndex,stopIndex,reason:'untimed'});return}
   if(!String(stop?.place?.name||'').trim()){skipped.push({dayIndex,stopIndex,reason:'unnamed'});return}
   const uidSource=[trip.id||'local',dayIndex,stop.key||stopIndex].join('-').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,140);
   const lines=[
    'BEGIN:VEVENT','UID:'+uidSource+'@sgbuddy.omnidite.com','DTSTAMP:'+now,
    'DTSTART;TZID=Asia/Singapore:'+dayString.replace(/-/g,'')+'T'+stop.time.replace(':','')+'00',
    'SUMMARY:'+escapeIcsText(stop.place.name),
    'DESCRIPTION:'+escapeIcsText([stop.note,'Planning time only. No visit duration, transport, venue hours or booking verified.'].filter(Boolean).join('\n')),
   ];
   if(String(stop.place.address||'').trim())lines.push('LOCATION:'+escapeIcsText(stop.place.address));
   lines.push('END:VEVENT');
   events.push(...lines);
  });
 });
 const doc=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SGBuddy//My Trip//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+escapeIcsText(trip.name||'Singapore trip'),...events,'END:VCALENDAR'];
 return {content:doc.map(foldIcsLine).join('\r\n')+'\r\n',included:events.filter(x=>x==='BEGIN:VEVENT').length,skipped};
}
