/* V4.9 first-party bounded HTML discovery - candidates are never published automatically. */
import {isValidDay} from './events-v470.mjs';
const months={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const decode=s=>String(s||'').replace(/&#(x[\da-f]+|\d+);/gi,(m,n)=>{try{return String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10))}catch{return m}})
.replace(/&(?:amp|nbsp|ndash|mdash|quot|apos|lt|gt|rsquo|lsquo|hellip);/g,m=>({'&amp;':'&','&nbsp;':' ','&ndash;':'–','&mdash;':'—','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&rsquo;':'’','&lsquo;':'‘','&hellip;':'…'}[m]));
export function readableHtml(html){
 const clean=String(html||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ');
 return decode(clean.replace(/<\/(?:h[1-6]|p|div|li|section|article|span|strong|td|time)>/gi,'\n').replace(/<(?:br|hr)\b[^>]*>/gi,'\n').replace(/<[^>]*>/g,' ')).replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n[ \t]*\n+/g,'\n').trim();
}
const day=(d,m,y)=>{
 const yy=+y<100?2000+(+y):+y,mo=months[String(m||'').slice(0,3).toLowerCase()];
 const iso=String(yy).padStart(4,'0')+'-'+String(mo||0).padStart(2,'0')+'-'+String(+d).padStart(2,'0');
 return isValidDay(iso)?iso:null;
};
export function parseDateRange(raw){
 const text=String(raw||'').replace(/[–—−]/g,'-').replace(/\s+/g,' ').trim();
 let m=text.match(/\b(\d{1,2})\s*([A-Za-z]{3,9})\s*(20\d{2}|\d{2})\s*[-]\s*(\d{1,2})\s*([A-Za-z]{3,9})\s*(20\d{2}|\d{2})\b/);
 if(m)return {startDate:day(m[1],m[2],m[3]),endDate:day(m[4],m[5],m[6])};
 m=text.match(/\b(\d{1,2})\s*([A-Za-z]{3,9})\s*[-]\s*(\d{1,2})\s*([A-Za-z]{3,9})\s*(20\d{2}|\d{2})\b/);
 if(m)return {startDate:day(m[1],m[2],m[5]),endDate:day(m[3],m[4],m[5])};
 m=text.match(/\b(\d{1,2})\s*[-]\s*(\d{1,2})\s*([A-Za-z]{3,9})\s*(20\d{2}|\d{2})\b/);
 if(m)return {startDate:day(m[1],m[3],m[4]),endDate:day(m[2],m[3],m[4])};
 m=text.match(/\b(\d{1,2})\s*([A-Za-z]{3,9})\s*(20\d{2}|\d{2})\b/);
 if(m){const date=day(m[1],m[2],m[3]);return {startDate:date,endDate:date}}
 return null;
}
const slug=url=>new URL(url).pathname.replace(/\/$/,'').split('/').pop();
export function extractVenueLinks(html,source){
 const hrefRe=/<a\b[^>]*?href\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/gi;
 const out=[],seen=new Set();
 for(const m of String(html||'').matchAll(hrefRe)){
  try{
   const link=new URL(decode(m[1]||m[2]),source.url);
   if(link.protocol!=='https:'||link.hostname!==source.host)continue;
   const prefix=source.pathPrefix;
   if(!link.pathname.startsWith(prefix)||link.pathname.replace(/\/$/,'')===prefix.replace(/\/$/,'')||!slug(link.href))continue;
   link.hash='';link.search='';
   if(seen.has(link.href))continue;
   seen.add(link.href);out.push(link.href);
  }catch{}
 }
 return out;
}
/* An official detail page sometimes uses a generic "Events @ EXPO" H1.
 * Never turn that heading, or an unverified URL slug, into a recommended event title.
 */
const genericTitle=/^(?:events?(?:\s*@\s*expo|\s+at\s+expo)?|visit events|event details|what['’]?s on|home|singapore expo)$/i;
function trustedTitle(value){
 const original=decode(String(value||'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
 const cleaned=original.replace(/\s*[|–—]\s*(?:singapore expo|events\s*@\s*expo)\s*$/i,'').trim();
 return cleaned.length>=5&&cleaned.length<=180&&!genericTitle.test(cleaned)?cleaned:null;
}
function metadataTitle(html){
 const tags=String(html||'').match(/<meta\b[^>]*>/gi)||[];
 for(const tag of tags){
  const name=tag.match(/\b(?:property|name)\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase();
  if(!['og:title','twitter:title'].includes(name))continue;
  const raw=tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2];
  const title=trustedTitle(raw);
  if(title)return {title,titleEvidence:name};
 }
 return null;
}
function eventJsonLdTitle(html){
 const blocks=String(html||'').match(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>[\s\S]*?<\/script>/gi)||[];
 for(const block of blocks.slice(0,15)){
  const raw=block.replace(/^<script\b[^>]*>/i,'').replace(/<\/script>\s*$/i,'');
  try{
   const parsed=JSON.parse(raw);
   const stack=[parsed],seen=0;
   while(stack.length&&seen++<80){
    const item=stack.pop();
    if(Array.isArray(item)){stack.push(...item);continue}
    if(!item||typeof item!=='object')continue;
    const types=[item['@type']].flat().filter(Boolean);
    if(types.some(t=>/^(?:Event|BusinessEvent|Festival|MusicEvent|ExhibitionEvent|SportsEvent)$/i.test(String(t)))){
     const title=trustedTitle(item.name);
     if(title)return {title,titleEvidence:'official-event-jsonld'};
    }
    if(item['@graph'])stack.push(item['@graph']);
   }
  }catch{}
 }
 return null;
}
export function officialVenueTitle(html){
 const social=metadataTitle(html);
 if(social)return social;
 const structured=eventJsonLdTitle(html);
 if(structured)return structured;
 for(const tag of ['h1','h2']){
  const expressions=new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/'+tag+'>','gi');
  for(const m of String(html||'').matchAll(expressions)){
   const title=trustedTitle(readableHtml(m[1]));
   if(title)return {title,titleEvidence:'official-'+tag};
  }
 }
 const m=String(html||'').match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
 const title=trustedTitle(m?.[1]);
 return title?{title,titleEvidence:'official-document-title'}:null;
}
export function parseVenueDetail(html,source,link,today){
 const clean=readableHtml(html),identified=officialVenueTitle(html),title=identified?.title;
 if(!title||title.length<5||title.length>180||/\b(private meeting|invitation only|trade professionals only|by invitation only)\b/i.test(clean.slice(0,4500)))return null;
 const lines=clean.split('\n').map(x=>x.trim()).filter(Boolean);
 let range=null;
 if(source.sourceId==='expo'){
  const index=lines.findIndex(x=>x==='Date');
  if(index>=0)range=parseDateRange(lines.slice(index+1,index+4).join(' '));
 }else{
  const index=lines.findIndex(x=>/^(validity date|event date|date)$/i.test(x));
  if(index>=0)range=parseDateRange(lines.slice(index+1,index+4).join(' '));
  if(!range)range=parseDateRange(lines.slice(0,30).join(' '));
 }
 if(!range?.startDate||!range?.endDate||range.endDate<range.startDate||range.endDate<today)return null;
 const admission=/Open to Public\s*\(Free\)/i.test(clean)?'free':/Open to Public\s*\(Ticketed Admission\)/i.test(clean)?'ticketed':'check';
 const venueIndex=lines.findIndex(x=>x==='Venue');
 const venue=venueIndex>=0?lines[venueIndex+1]:source.venue;
 return {id:source.sourceId+'-'+slug(link).toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,65),title,titleEvidence:identified.titleEvidence,startDate:range.startDate,endDate:range.endDate,venue:venue||source.venue,sourceId:source.sourceId,sourceUrl:link,admission,status:'needs-review',kind:source.kind,reason:source.kind==='promotion'?'Check that this offer includes a public activity, not solely retail discounts':'Verify original official admission details, current dates and public eligibility'};
}
export function robotsAllows(text,path){
 // Generic * group only; no scraping through explicit disallow directives.
 const sections=String(text||'').split(/\r?\n/),rules=[];
 let active=false,started=false;
 for(const raw of sections){
  const line=raw.split('#')[0].trim();if(!line)continue;
  const found=line.match(/^([\w-]+):\s*(.*)$/);if(!found)continue;
  const key=found[1].toLowerCase(),value=found[2].trim();
  if(key==='user-agent'){if(started){active=false;started=false}if(value==='*')active=true;continue;}
  if(active&&(key==='allow'||key==='disallow')){started=true;if(value)rules.push({key,prefix:value.split('*')[0]});}
 }
 const relevant=rules.filter(x=>path.startsWith(x.prefix)).sort((a,b)=>b.prefix.length-a.prefix.length||(a.key==='allow'?-1:1));
 return !relevant.length||relevant[0].key==='allow';
}
