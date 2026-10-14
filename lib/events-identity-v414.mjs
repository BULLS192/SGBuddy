/* V4.14: conservative editorial identity matching, no automatic publishing/merging. */
const fold=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const landing=/^\/(?:visit-events|events|events-at-expo|whats-on(?:\/offers)?)$/i;
const track=/^(?:utm_.+|fbclid|gclid|msclkid|yclid|mc_cid|mc_eid)$/i;
export function canonicalEventUrl(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=='https:')return null;
  const host=u.hostname.toLowerCase().replace(/^www\./,'');
  let path=u.pathname.replace(/\/+/g,'/').replace(/\/+$/,'').toLowerCase()||'/';
  const params=[...u.searchParams].filter(([k])=>!track.test(k)).sort(([a,va],[b,vb])=>a.localeCompare(b)||va.localeCompare(vb));
  const tail=new URLSearchParams(params).toString();
  return host+path+(tail?'?'+tail:'');
 }catch{return null}
}
function eventSpecificUrl(raw){
 const key=canonicalEventUrl(raw);if(!key)return null;
 const path='/'+key.split('/').slice(1).join('/').split('?')[0];
 return landing.test(path)?null:key;
}
export function canonicalVenue(raw){
 const s=fold(raw);
 if(/\bsuntec\b/i.test(String(raw)))return 'suntec';
 if(/singapore\s*expo|expo\s*singapore|apex\s*@\s*expo/i.test(String(raw)))return 'singaporeexpo';
 if(/313\s*@?\s*somerset/i.test(String(raw)))return '313somerset';
 if(/marina\s*bay\s*sands/i.test(String(raw)))return 'mbs';
 return s;
}
function validTitle(title){
 const text=String(title||'').trim();
 return text.length>4&&!/^(?:events?(?:\s*@\s*expo)?|what['’]?s on|upcoming events?)$/i.test(text);
}
function overlaps(a,b){return !!a.startDate&&!!a.endDate&&!!b.startDate&&!!b.endDate&&a.startDate<=b.endDate&&b.startDate<=a.endDate}
export function eventIdentityMatch(a,b){
 if(!a||!b)return null;
 if(a.id&&b.id&&a.id===b.id)return 'same-id';
 const urlA=eventSpecificUrl(a.sourceUrl),urlB=eventSpecificUrl(b.sourceUrl);
 if(urlA&&urlB&&urlA===urlB)return 'same-official-url';
 const titleA=fold(a.title),titleB=fold(b.title);
 if(!validTitle(a.title)||!validTitle(b.title)||titleA!==titleB)return null;
 const venueA=canonicalVenue(a.venue),venueB=canonicalVenue(b.venue);
 if(!venueA||!venueB||venueA!==venueB||!overlaps(a,b))return null;
 return 'same-title-venue-dates';
}
export function duplicateOf(candidate,records){
 for(const existing of records||[]){
  const reason=eventIdentityMatch(candidate,existing);
  if(reason)return {id:existing.id||null,reason};
 }
 return null;
}
