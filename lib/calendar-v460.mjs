/* Public-holiday date logic kept separate for deterministic QA and reuse by upcoming Events. */
export const SG_TIMEZONE='Asia/Singapore';
export function singaporeDate(now=new Date()){
  return new Intl.DateTimeFormat('en-CA',{timeZone:SG_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function upcomingHolidays(rows,fromDay=singaporeDate(),count=9){
  return (Array.isArray(rows)?rows:[]).filter(row=>/^\d{4}-\d\d-\d\d$/.test(row.date)&&row.date>=fromDay).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,count);
}
export function nextLongWeekend(rows,fromDay=singaporeDate()){
  // Only Friday/Monday holiday blocks contiguous with a Saturday and Sunday are highlighted.
  return upcomingHolidays(rows,fromDay,500).find(row=>{
    const dow=new Date(row.date+'T12:00:00+08:00').getUTCDay();
    return dow===1||dow===5;
  })||null;
}
export function formatHolidayDate(day,locale='en'){
  return new Intl.DateTimeFormat(locale,{timeZone:SG_TIMEZONE,day:'numeric',month:'short',year:'numeric',weekday:'short'}).format(new Date(day+'T12:00:00+08:00'));
}
