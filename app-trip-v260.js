/* SGBuddy V2.6 — My Trip: local, editable itinerary. No cloud sync or booking. */
import {STORE_KEY,MAX_TRIPS,MAX_DAYS,newTrip,dayDate,validPlace,addStop,moveStop,moveDay,editStop,hydrate,shareText} from './lib/trip-v260.mjs';
const core=window.SGBUDDY_CORE,doc=document,discover=doc.getElementById('discoverHub');
if(core&&discover){
 const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const $=s=>doc.querySelector(s);
 const lang=()=>window.SGBUDDY_LANGUAGE==='zh-CN'?'zh':'en';
 const labels={
 en:{title:'My Trip',intro:'Build a flexible day-by-day Singapore itinerary from SGBuddy places or add your own stop.',device:'Trips are saved on this device only, not synced to your account. Export a copy before clearing browser data or changing devices.',create:'Create trip',newTrip:'New trip',name:'Trip name',start:'Start date',days:'Days',choose:'Current trip',delete:'Delete trip',add:'Add to Day',day:'Day',empty:'No stops yet. Search the directory or add a custom stop below.',search:'Find a place in SGBuddy',searchHint:'Type at least 2 letters to search the place directory.',searchWait:'Loading directory. You can add a custom stop.',manual:'Add your own stop',customName:'Place or activity name',customArea:'Area / address (optional)',addCustom:'Add custom stop',note:'Notes',time:'Time (optional)',remove:'Remove',up:'Move up',down:'Move down',copy:'Share / copy plan',download:'Download .txt',noTrip:'Start by creating a trip, or add a place from Discover to make a three-day draft.',saved:'Saved on this device',saveFailed:'Could not save: device storage is full or unavailable.',added:'Added to your plan',exists:'Already in this day, or day is full.',limit:'Maximum of eight trips per device.',confirm:'Delete this trip and all its planned stops?',warning:'Planning guide only — opening hours, entrance locations and prices may change. Stops do not create reservations. Journey times are not estimated.',notVerified:'Location and opening hours have not been verified.',map:'Search on Maps ↗',moveTo:'Move to day',selectDay:'Selected day',copied:'Itinerary copied to clipboard.',notCopied:'Sharing is unavailable; use Download .txt instead.',directory:'Explore places',selected:'Planned stops',visit:'Visited'},
 zh:{title:'我的行程',intro:'使用 SGBuddy 地点或自定义活动，安排新加坡每日行程。',device:'行程仅储存在本设备，不会同步到帐户。清除浏览器数据或更换设备前请导出备份。',create:'建立行程',newTrip:'新行程',name:'行程名称',start:'开始日期',days:'天数',choose:'当前行程',delete:'删除行程',add:'加入第',day:'第',empty:'尚无安排。请搜索地点或添加自定义活动。',search:'搜索 SGBuddy 地点',searchHint:'输入至少两个字母搜索地点资料库。',searchWait:'地点资料库载入中；您仍可添加自定义活动。',manual:'添加自定义活动',customName:'地点或活动名称',customArea:'地区／地址（选填）',addCustom:'添加活动',note:'备注',time:'时间（选填）',remove:'移除',up:'上移',down:'下移',copy:'分享／复制行程',download:'下载 .txt',noTrip:'先建立行程，或从探索添加地点自动建立三日草稿。',saved:'已保存在本设备',saveFailed:'无法保存：本设备储存空间可能不足。',added:'已加入行程',exists:'当日已有此地点，或已达上限。',limit:'每台设备最多储存八个行程。',confirm:'确定删除此行程和所有地点？',warning:'此功能仅供规划。营业时间、入口和价格可能变化，行程不等于预订，也不提供预计车程。',notVerified:'地点或营业时间尚未核实。',map:'在地图上搜索 ↗',moveTo:'移至第',selectDay:'所选日期',copied:'行程已复制。',notCopied:'无法分享，请使用下载 .txt。',directory:'浏览地点',selected:'已规划地点',visit:'已完成'}
 };
 const text=()=>labels[lang()],localDay=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day};
 let data;try{data=hydrate(JSON.parse(localStorage.getItem(STORE_KEY)||'{}'))}catch{data=hydrate({})}
 let selectedDay=0,showPanel=false,catalogue=window.SGBUDDY_DISCOVER_PLACES||null,message='',query='';
 const host=doc.createElement('section');host.id='myTripPlanner';host.className='card my-trip-v260';host.hidden=true;host.setAttribute('role','tabpanel');host.setAttribute('aria-labelledby','discoverTab-trip');
 discover.insertBefore(host,$('#discoverResults'));
 const active=()=>data.trips.find(t=>t.id===data.activeId)||null;
 const save=()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(data));doc.dispatchEvent(new CustomEvent('sgbuddy:trip-updated',{detail:{total:data.trips.length}}));return true}catch{message=text().saveFailed;return false}};
 const fmt=(date)=>{try{return new Intl.DateTimeFormat(lang()==='zh'?'zh-CN':'en-SG',{month:'short',day:'numeric',weekday:'short',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'))}catch{return date}};
 const directions=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([p.name,p.address||p.area,'Singapore'].filter(Boolean).join(', '));
 const formatDay=(i,trip)=>lang()==='zh'?'第'+(i+1)+'天 · '+fmt(dayDate(trip.startDate,i)):'Day '+(i+1)+' · '+fmt(dayDate(trip.startDate,i));
 const options=trip=>trip.days.map((_,i)=>'<option value="'+i+'" '+(selectedDay===i?'selected':'')+'>'+escapeHTML(formatDay(i,trip))+'</option>').join('');
 function searchMarkup(){
  const s=text();
  if(!catalogue)return '<p class="trip-helper">'+escapeHTML(s.searchWait)+'</p>';
  const q=query.trim().toLowerCase();if(q.length<2)return '<p class="trip-helper">'+escapeHTML(s.searchHint)+'</p>';
  const rows=catalogue.filter(p=>p&&p.id&&p.name&&[p.name,p.area,p.category,p.address].join(' ').toLowerCase().includes(q)).slice(0,8);
  return rows.length?rows.map(p=>'<div class="trip-search-result"><div><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML([p.area,p.category].filter(Boolean).join(' · '))+'</small></div><button class="secondary" type="button" data-trip-add-search="'+escapeHTML(p.id)+'">'+escapeHTML(s.add)+' '+(selectedDay+1)+'</button></div>').join(''):'<p class="trip-helper">No matching places · Try a different name</p>';
 }
 function stopMarkup(trip,stop,index){
  const s=text(),p=stop.place,canUp=index>0,canDown=index<trip.days[selectedDay].length-1;
  return '<article class="trip-stop" data-trip-stop="'+index+'"><div class="trip-stop-head"><span class="trip-stop-index">'+(index+1)+'</span><div class="trip-stop-name"><h4>'+escapeHTML(p.name)+'</h4><p>'+escapeHTML([p.area,p.kind].filter(Boolean).join(' · '))+'</p></div><label class="trip-done"><input type="checkbox" data-trip-done="'+index+'" '+(stop.done?'checked':'')+' /><span>'+escapeHTML(s.visit)+'</span></label></div>'+
   '<div class="trip-stop-edit"><label>'+escapeHTML(s.time)+'<input type="time" data-trip-time="'+index+'" value="'+escapeHTML(stop.time)+'" /></label><label>'+escapeHTML(s.note)+'<textarea data-trip-note="'+index+'" maxlength="280" rows="2">'+escapeHTML(stop.note)+'</textarea></label></div>'+
   '<div class="trip-stop-actions"><a href="'+escapeHTML(directions(p))+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(s.map)+'</a><button type="button" class="secondary" data-trip-up="'+index+'" '+(!canUp?'disabled':'')+' aria-label="'+escapeHTML(s.up)+'">↑</button><button type="button" class="secondary" data-trip-down="'+index+'" '+(!canDown?'disabled':'')+' aria-label="'+escapeHTML(s.down)+'">↓</button><label class="trip-transfer">'+escapeHTML(s.moveTo)+' <select data-trip-transfer="'+index+'" aria-label="'+escapeHTML(s.moveTo)+'"><option value="">—</option>'+trip.days.map((_,d)=>d===selectedDay?'':'<option value="'+d+'">'+(d+1)+'</option>').join('')+'</select></label><button type="button" class="secondary trip-remove" data-trip-remove="'+index+'">'+escapeHTML(s.remove)+'</button></div></article>';
 }
 function render(){
  const s=text(),trip=active();if(trip&&selectedDay>=trip.days.length)selectedDay=0;
  const creation='<details id="tripCreateDetails" '+(!trip||showPanel?'open':'')+'><summary>'+escapeHTML(s.newTrip)+'</summary><form id="tripCreateForm" class="trip-new-form"><label>'+escapeHTML(s.name)+'<input id="tripNewName" name="name" maxlength="90" required placeholder="Singapore getaway" /></label><label>'+escapeHTML(s.start)+'<input id="tripStartDate" name="start" type="date" value="'+localDay()+'" required /></label><label>'+escapeHTML(s.days)+'<input id="tripNumberOfDays" name="days" type="number" min="1" max="'+MAX_DAYS+'" value="3" required /></label><button type="submit" class="primary">'+escapeHTML(s.create)+'</button></form></details>';
  host.innerHTML='<header class="trip-heading"><div class="label">'+escapeHTML(s.title)+' · SGBUDDY V2.6</div><h3>'+escapeHTML(s.title)+'</h3><p>'+escapeHTML(s.intro)+'</p></header><p class="trip-privacy">'+escapeHTML(s.device)+'</p>'+
   creation+(trip?'<div class="trip-active"><label>'+escapeHTML(s.choose)+'<select id="tripSelect">'+data.trips.map(t=>'<option value="'+escapeHTML(t.id)+'" '+(t.id===data.activeId?'selected':'')+'>'+escapeHTML(t.name)+'</option>').join('')+'</select></label><button class="secondary trip-delete" type="button" id="tripDelete">'+escapeHTML(s.delete)+'</button></div>'+
   '<div class="trip-day-tabs" role="group" aria-label="'+escapeHTML(s.selectDay)+'">'+trip.days.map((day,i)=>'<button data-trip-day="'+i+'" aria-pressed="'+(selectedDay===i)+'" type="button">'+escapeHTML(formatDay(i,trip))+' <span>('+day.length+')</span></button>').join('')+'</div>'+
   '<section class="trip-day-panel"><div class="trip-day-head"><h4>'+escapeHTML(formatDay(selectedDay,trip))+'</h4><span>'+trip.days[selectedDay].length+' '+escapeHTML(s.selected)+'</span></div><div class="trip-stops">'+(trip.days[selectedDay].length?trip.days[selectedDay].map((stop,i)=>stopMarkup(trip,stop,i)).join(''):'<p class="trip-empty">'+escapeHTML(s.empty)+'</p>')+'</div>'+
   '<div class="trip-add-panel"><label>'+escapeHTML(s.search)+'<input id="tripSearch" type="search" autocomplete="off" placeholder="Marina Bay, Chinatown, hawker centre…" value="'+escapeHTML(query)+'"/></label><div id="tripSearchResults" class="trip-search-results">'+searchMarkup()+'</div><form id="tripCustomForm" class="trip-custom-form"><strong>'+escapeHTML(s.manual)+'</strong><input name="customName" maxlength="140" required aria-label="'+escapeHTML(s.customName)+'" placeholder="'+escapeHTML(s.customName)+'"/><input name="customArea" maxlength="180" aria-label="'+escapeHTML(s.customArea)+'" placeholder="'+escapeHTML(s.customArea)+'"/><button type="submit" class="secondary">'+escapeHTML(s.addCustom)+'</button></form></div></section>'+
   '<div class="trip-export"><button type="button" class="primary" id="tripShare">'+escapeHTML(s.copy)+'</button><button type="button" class="secondary" id="tripDownload">'+escapeHTML(s.download)+'</button><button type="button" class="secondary" id="tripBrowse">'+escapeHTML(s.directory)+'</button></div>':'<p class="trip-empty">'+escapeHTML(s.noTrip)+'</p>')+
   '<p class="trip-helper" id="tripMessage" role="status">'+escapeHTML(message||s.saved)+'</p><p class="trip-warning">'+escapeHTML(s.warning)+'</p>';
  doc.dispatchEvent(new CustomEvent('sgbuddy:trip-rendered'));
 }
 function add(place,day=selectedDay){
  let trip=active();if(!trip){if(data.trips.length>=MAX_TRIPS){message=text().limit;render();return}trip=newTrip('My Singapore trip',localDay(),3);data.trips.push(trip);data.activeId=trip.id;selectedDay=0;day=0}
  if(addStop(trip,day,place)){message=text().added+' · '+formatDay(day,trip);save()}else message=text().exists;
  render();
 }
 function activate(on){host.hidden=!on;if(on)render()}
 doc.addEventListener('sgbuddy:discover-tab',e=>activate(e.detail?.tab==='trip'));
 doc.addEventListener('sgbuddy:language',()=>{if(!host.hidden)render()});
 doc.addEventListener('sgbuddy:discover-places-ready',e=>{catalogue=e.detail?.places||null;if(!host.hidden)render()});
 doc.addEventListener('sgbuddy:trip-add-place',e=>{const place=validPlace(e.detail?.place);if(!place)return;add(place);core.toast?.(message)});
 host.addEventListener('submit',e=>{
  if(e.target.id==='tripCreateForm'){e.preventDefault();if(data.trips.length>=MAX_TRIPS){message=text().limit;render();return}const f=new FormData(e.target);try{const trip=newTrip(f.get('name'),String(f.get('start')||''),f.get('days'));data.trips.push(trip);data.activeId=trip.id;selectedDay=0;query='';showPanel=false;message='';save();render()}catch(err){message=err.message;$('#tripMessage').textContent=message}}
  if(e.target.id==='tripCustomForm'){e.preventDefault();const f=new FormData(e.target),name=String(f.get('customName')||'').trim(),area=String(f.get('customArea')||'').trim();if(!name)return;add({id:'manual-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name,area,kind:'Custom',status:'user-entered'});}
 });
 host.addEventListener('input',e=>{if(e.target.id==='tripSearch'){query=e.target.value;$('#tripSearchResults').innerHTML=searchMarkup()}});
 host.addEventListener('change',e=>{
  const el=e.target,trip=active();if(el.id==='tripSelect'){data.activeId=el.value;selectedDay=0;query='';save();render();return}
  if(!trip)return;
  let idx;
  if(el.matches('[data-trip-time]')){idx=Number(el.dataset.tripTime);editStop(trip.days[selectedDay][idx],'time',el.value);save();return}
  if(el.matches('[data-trip-note]')){idx=Number(el.dataset.tripNote);editStop(trip.days[selectedDay][idx],'note',el.value);save();return}
  if(el.matches('[data-trip-done]')){idx=Number(el.dataset.tripDone);editStop(trip.days[selectedDay][idx],'done',el.checked);save();return}
  if(el.matches('[data-trip-transfer]')){idx=Number(el.dataset.tripTransfer);if(el.value!==''&&moveDay(trip,selectedDay,idx,Number(el.value))){save();render()}}
 });
 host.addEventListener('click',async e=>{
  const btn=e.target.closest('button');if(!btn)return;
  const trip=active();
  if(btn.hasAttribute('data-trip-day')){selectedDay=Number(btn.dataset.tripDay);query='';render();return}
  if(btn.hasAttribute('data-trip-add-search')){const p=catalogue?.find(x=>x.id===btn.dataset.tripAddSearch);if(p)add(p);return}
  if(btn.id==='tripBrowse'){$('[data-discover-tab="do"]')?.click();return}
  if(btn.id==='tripDelete'&&trip){if(!confirm(text().confirm))return;data.trips=data.trips.filter(x=>x.id!==trip.id);data.activeId=data.trips[0]?.id||null;selectedDay=0;save();render();return}
  if(!trip)return;
  for(const [key,fn] of [['tripUp',i=>moveStop(trip,selectedDay,i,-1)],['tripDown',i=>moveStop(trip,selectedDay,i,1)],['tripRemove',i=>{trip.days[selectedDay].splice(i,1);return true}]]){
   if(btn.dataset[key]!==undefined){if(fn(Number(btn.dataset[key]))){save();render()}return}
  }
  if(btn.id==='tripDownload'){const blob=new Blob([shareText(trip)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='sgbuddy-trip-'+trip.startDate+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return}
  if(btn.id==='tripShare'){
   const value=shareText(trip);
   try{if(navigator.share){await navigator.share({title:trip.name,text:value});return}if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(value);message=text().copied}catch{message=text().notCopied}
   $('#tripMessage').textContent=message;return;
  }
 });
 window.SGBUDDY_TRIP_API={
  getActive:()=>active(),
  importCopy:incoming=>{
   if(data.trips.length>=MAX_TRIPS)return {ok:false,message:text().limit};
   if(!incoming?.days?.length||incoming.days.length>MAX_DAYS)return {ok:false,message:'Invalid trip'};
   const copy=newTrip(incoming.name,incoming.startDate,incoming.days.length);
   for(let day=0;day<copy.days.length;day++){
    for(const stop of incoming.days[day]){
     if(!addStop(copy,day,stop.place))return {ok:false,message:'Cannot import duplicate or invalid stop'};
     const target=copy.days[day].at(-1);
     editStop(target,'time',stop.time);editStop(target,'note',stop.note);editStop(target,'done',stop.done);
    }
   }
   data.trips.push(copy);data.activeId=copy.id;selectedDay=0;query='';message='';if(!save()){data.trips.pop();data.activeId=data.trips[0]?.id||null;return {ok:false,message:text().saveFailed}}
   render();return {ok:true,tripId:copy.id};
  },
  open:()=>{doc.getElementById('navPlaces')?.click();doc.getElementById('discoverTab-trip')?.click()}
 };
 render();
}
