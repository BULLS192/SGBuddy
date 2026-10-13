/* V4.8 public event feed adapters. Both only produce unapproved review records.
 * A published article date is never interpreted as an event date.
 */
import {publicCandidates,parseIcs} from './events-ical-v470.mjs';
import {isValidDay} from './events-v470.mjs';
const decode=s=>String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&(?:amp|lt|gt|quot|apos|#39);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"}[m]));
const plain=s=>decode(String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')).trim();
const slug=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
const dateFrom=v=>{
 if(v==null)return null;
 if(typeof v==='number'){if(v<1e10||v>1e14)return null;return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}
 const iso=String(v).match(/^(\d{4}-\d{2}-\d{2})/);
 return iso&&isValidDay(iso[1])?iso[1]:null;
};
const isPrivate=text=>/\b(private event|by invitation|invitation only|closed-door|closed door|members only|internal meeting|private meeting)\b/i.test(text);
export function extractSquarespaceCandidates(json,source,day){
 const candidates=[json?.upcoming?.items,json?.upcoming?.events,json?.upcoming,json?.calendarView?.upcoming?.items,json?.calendarView?.items,json?.calendarView?.events,json?.collection?.items,json?.items];
 const items=candidates.find(x=>Array.isArray(x)&&x.length)||[];
 const result=[];
 for(const x of items.slice(0,300)){
  const title=plain(x.title||x.name||''),detail=plain(x.body||x.excerpt||x.description||'');
  if(!title||isPrivate(title+' '+detail)||x.status==='cancelled')continue;
  const startDate=dateFrom(x.structuredContent?.startDate||x.startDate||x.start||x.eventStartDate),endDate=dateFrom(x.structuredContent?.endDate||x.endDate||x.end||x.eventEndDate)||startDate;
  if(!startDate||!endDate||endDate<startDate||endDate<day)continue;
  let link=source.publicPage;
  try{
   const u=new URL(x.fullUrl||x.url||x.sourceUrl||'',source.publicPage);
   if(u.protocol==='https:'&&u.hostname===new URL(source.publicPage).hostname&&u.pathname!=='/visit-events')link=u.href;
  }catch{}
  if(link===source.publicPage)continue; // Require event-specific official URL.
  result.push({id:source.id+'-'+slug(title)+'-'+startDate,title,startDate,endDate,venue:source.venue,sourceId:source.sourceId,sourceUrl:link,status:'needs-review',access:'unverified',reason:'Review official admission, dates and public accessibility before publishing'});
 }
 return result;
}
const tag=(xml,name)=>{const m=xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i'));return m?decode(m[1]):''};
export function extractRssCandidates(xml,source,day){
 if(!/<rss\b|<feed\b/i.test(xml))throw Error('Not an RSS/Atom feed');
 const items=[...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m=>m[1]).slice(0,250);
 const result=[];
 for(const item of items){
  const title=plain(tag(item,'title')),description=plain(tag(item,'description'));
  if(!title||isPrivate(title+' '+description))continue;
  // RSS pubDate is a news-publication timestamp, NOT the event date.
  const explicit=tag(item,'event:startDate')||tag(item,'eventDate')||tag(item,'startDate');
  const field=dateFrom(explicit);
  const dateMatch=(description+' '+title).match(/(?:Event Date|Event Dates|Date of Event|Date):?\s*(\d{4}-\d{2}-\d{2})/i);
  const startDate=field||(dateMatch&&isValidDay(dateMatch[1])?dateMatch[1]:null);
  if(!startDate||startDate<day)continue;
  const link=plain(tag(item,'link'));
  let href='';
  try{const u=new URL(link);if(u.protocol==='https:'&&u.hostname===new URL(source.publicPage).hostname)href=u.href}catch{}
  if(!href)continue;
  result.push({id:source.id+'-'+slug(title)+'-'+startDate,title,startDate,endDate:startDate,venue:source.venue,sourceId:source.sourceId,sourceUrl:href,status:'needs-review',access:'unverified',reason:'Confirm organiser page and public admission before publishing'});
 }
 return result;
}
export function normalizeReview(items,day){
 const out=[],seen=new Set();
 for(const e of items){
  if(!e||!isValidDay(e.startDate)||e.endDate<day||!/^https:\/\//.test(e.sourceUrl))continue;
  const key=[e.title,e.venue,e.startDate].map(slug).join(':');
  if(seen.has(key))continue;seen.add(key);out.push(e);
 }
 return out.sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title)).slice(0,150);
}
export function fromFeed(raw,source,day,contentType=''){
 if(source.format==='squarespace-json'){
  if(!contentType.includes('json'))throw Error('Expected official JSON feed, got '+contentType);
  return extractSquarespaceCandidates(JSON.parse(raw),source,day);
 }
 if(source.format==='rss'){
  if(!/xml|rss|text\//i.test(contentType))throw Error('Expected official RSS feed, got '+contentType);
  return extractRssCandidates(raw,source,day);
 }
 if(source.format==='ics'){
  if(!contentType.includes('calendar')&&!contentType.includes('text/plain'))throw Error('Not calendar content type');
  return publicCandidates(parseIcs(raw),source,day);
 }
 throw Error('Unsupported feed format');
}
