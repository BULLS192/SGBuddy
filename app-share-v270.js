/* SGBuddy V2.7 — portable trip snapshots and copy-and-resend collaboration. */
import {SHARE_PARAM,MAX_FILE_BYTES,getLinkCode,stripShareHash,buildTripUrl,decodeTrip,exportTripJSON,importTripJSON} from './lib/trip-share-v270.mjs';
const api=window.SGBUDDY_TRIP_API,doc=document,host=doc.getElementById('myTripPlanner');
if(api&&host){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const locale=()=>window.SGBUDDY_LANGUAGE==='zh-CN'?'zh':'en';
 const translations={
 en:{title:'Share & plan together',summary:'Send a snapshot link. Friends can open it on another device, import their own editable copy and send back a new version.',link:'Create share link',share:'Share link',copy:'Copy link',file:'Export trip file',import:'Import trip file',warning:'Anyone with the link can read its itinerary and notes. Links are not encrypted, not revocable, and never update automatically. Do not add sensitive personal information.',large:'If a trip is too large for a link, export and share its .json file instead.',incoming:'Shared itinerary received',preview:'Preview before adding to your trips',add:'Save as a separate copy',dismiss:'Discard shared preview',days:'days',stops:'stops',ready:'Link created. Copy or share it.',copied:'Link copied.',shareDone:'Shared.',copyFail:'Could not copy. Select and copy the link manually.',invalid:'This share link could not be opened. Ask the sender to generate a new link.',saved:'Imported as a new editable trip. The sender’s copy is unchanged.',refused:'Import not completed.',tooLarge:'Trip file exceeds 60 KB.',noTrip:'Create or import a trip to enable sharing.',noSync:'Collaboration is copy-and-resend, not live multi-user editing or automatic cloud sync.',importHint:'Choose a .json file exported from My Trip.',failed:'Unable to import this file.',external:'This link contains a snapshot only. Visiting it never books attractions or restaurants.'},
 zh:{title:'分享及共同规划',summary:'分享行程快照链接。朋友可在其他设备打开、导入可编辑副本，再将修改后的新版本分享给你。',link:'建立分享链接',share:'分享链接',copy:'复制链接',file:'导出行程文件',import:'导入行程文件',warning:'拥有链接的人可以阅读行程及备注。链接未加密、无法撤销，也不会自动更新。请勿填写敏感个人信息。',large:'行程太长无法生成链接时，请导出 .json 文件分享。',incoming:'收到共享行程',preview:'先预览，再决定是否储存',add:'另存为新副本',dismiss:'关闭共享预览',days:'天',stops:'地点',ready:'已建立链接，可复制或分享。',copied:'链接已复制。',shareDone:'已分享。',copyFail:'无法自动复制，请手动选择链接。',invalid:'无法开启该共享链接，请发送者重新生成。',saved:'已导入可编辑的新行程，发送者的行程不会受影响。',refused:'未导入行程。',tooLarge:'行程文件不可超过 60 KB。',noTrip:'先建立或导入行程即可分享。',noSync:'共同规划采用交换副本方式，不支持实时共同编辑或云端自动同步。',importHint:'选择从「我的行程」导出的 .json 文件。',failed:'无法导入此文件。',external:'共享链接仅供规划，不代表完成门票或餐厅预订。'}
 };
 const t=()=>translations[locale()];
 let incoming=null,error='',generated='';
 const clearShareLink=()=>{if(getLinkCode(location.hash)!==null)history.replaceState(null,'',stripShareHash(location.href))};
 try{
  const code=getLinkCode(location.hash);
  if(code){incoming=decodeTrip(code)}
  else if(location.hash.startsWith('#'+SHARE_PARAM+'='))error=t().invalid;
 }catch{error=t().invalid}
 const notify=(msg)=>{const item=host.querySelector('#tripShareStatus');if(item)item.textContent=msg};
 const summarize=trip=>trip?trip.days.reduce((n,day)=>n+day.length,0):0;
 function markup(){
  const tr=t(),active=api.getActive(),readOnly=incoming;
  return '<section class="trip-share-v270" aria-labelledby="tripShareTitle"><header><div class="label">SGBUDDY V2.7 · MY TRIP</div><h4 id="tripShareTitle">'+esc(tr.title)+'</h4><p>'+esc(tr.summary)+'</p></header>'+
    (readOnly?'<section class="trip-incoming" aria-label="'+esc(tr.incoming)+'"><strong>'+esc(tr.incoming)+'</strong><h5>'+esc(incoming.name)+'</h5><p>'+esc(incoming.startDate)+' · '+incoming.days.length+' '+esc(tr.days)+' · '+summarize(incoming)+' '+esc(tr.stops)+'</p><p>'+esc(tr.preview)+'</p><div class="trip-incoming-actions"><button id="tripImportShared" type="button" class="primary">'+esc(tr.add)+'</button><button id="tripDismissShared" type="button" class="secondary">'+esc(tr.dismiss)+'</button></div></section>':'')+
    '<div class="trip-share-buttons">'+(active?'<button id="tripMakeLink" type="button" class="primary">'+esc(tr.link)+'</button><button id="tripExportJson" type="button" class="secondary">'+esc(tr.file)+'</button>':'')+'<button id="tripImportJson" type="button" class="secondary">'+esc(tr.import)+'</button><input id="tripImportJsonFile" class="trip-file-input" type="file" accept=".json,application/json" aria-label="'+esc(tr.importHint)+'" /></div>'+
    (generated?'<div class="trip-share-link"><label for="tripShareLinkInput">'+esc(tr.share)+'<input id="tripShareLinkInput" readonly aria-label="'+esc(tr.share)+'" value="'+esc(generated)+'" /></label><button id="tripCopyLink" class="secondary" type="button">'+esc(tr.copy)+'</button><button id="tripSystemShare" class="secondary" type="button">'+esc(tr.share)+'</button></div>':'')+
    '<p class="trip-helper" id="tripShareStatus" role="status">'+esc(error||(generated?tr.ready:active?'':tr.noTrip))+'</p><p class="trip-share-warning">'+esc(tr.warning)+'</p><p class="trip-helper">'+esc(tr.large)+' '+esc(tr.noSync)+' '+esc(tr.external)+'</p></section>';
 }
 function mount(){
  const anchor=host.querySelector('.trip-export')||host.querySelector('#tripMessage');
  if(!anchor)return;
  if(anchor.classList.contains('trip-export'))anchor.insertAdjacentHTML('afterend',markup());
  else anchor.insertAdjacentHTML('beforebegin',markup());
 }
 doc.addEventListener('sgbuddy:trip-rendered',()=>{generated='';error='';mount()});
 doc.addEventListener('sgbuddy:language',()=>{if(!host.hidden){host.querySelector('.trip-share-v270')?.remove();mount()}});
 host.addEventListener('click',async e=>{
  const btn=e.target.closest('button');if(!btn)return;
  const tr=t(),trip=api.getActive();
  if(btn.id==='tripMakeLink'&&trip){
   try{
    generated=buildTripUrl(location.origin+location.pathname,trip);
    error='';
    host.querySelector('.trip-share-v270')?.remove();mount();
   }catch(ex){notify(ex.message||tr.failed)}
   return;
  }
  if(btn.id==='tripCopyLink'&&generated){
   try{await navigator.clipboard.writeText(generated);notify(tr.copied)}
   catch{notify(tr.copyFail);host.querySelector('#tripShareLinkInput')?.select()}
   return;
  }
  if(btn.id==='tripSystemShare'&&generated){
   try{if(navigator.share)await navigator.share({title:trip?.name||tr.title,url:generated});else await navigator.clipboard.writeText(generated);notify(tr.shareDone)}
   catch(ex){if(ex?.name!=='AbortError')notify(tr.copyFail)}
   return;
  }
  if(btn.id==='tripExportJson'&&trip){
   const blob=new Blob([exportTripJSON(trip)],{type:'application/json;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='sgbuddy-trip-'+trip.startDate+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
  }
  if(btn.id==='tripImportJson'){host.querySelector('#tripImportJsonFile')?.click();return}
  if(btn.id==='tripImportShared'&&incoming){
   const result=api.importCopy(incoming);
   if(!result.ok){notify(result.message||tr.refused);return}
   incoming=null;clearShareLink();generated='';error='';host.querySelector('.trip-share-v270')?.remove();mount();notify(tr.saved);return;
  }
  if(btn.id==='tripDismissShared'){incoming=null;clearShareLink();host.querySelector('.trip-share-v270')?.remove();mount();return}
 });
 host.addEventListener('change',async e=>{
  if(e.target.id!=='tripImportJsonFile')return;
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(file.size>MAX_FILE_BYTES)throw Error(t().tooLarge);
   const trip=importTripJSON(await file.text()),result=api.importCopy(trip);
   if(!result.ok)throw Error(result.message||t().refused);
   incoming=null;clearShareLink();generated='';error='';host.querySelector('.trip-share-v270')?.remove();mount();notify(t().saved);
  }catch(ex){notify(ex.message||t().failed)}
  e.target.value='';
 });
 mount();
 if(incoming||error)queueMicrotask(()=>api.open());
}
