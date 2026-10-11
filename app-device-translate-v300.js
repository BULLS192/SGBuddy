/* Optional source-description translations using Chrome's on-device Translator API.
 * Requires an explicit user click for model downloads, no remote API credentials,
 * no translation of addresses/IDs/private account fields, and preserves original text.
 * Falls back honestly on unsupported browsers (especially mobile) or language pairs.
 */
import {normalizeLocale} from './lib/i18n-v280.mjs';
const captions={
 en:['Translate article and listing text on this device','Preparing language pack…','Source translations ready','Show original text','Translate these descriptions','This browser or language pair does not support on-device translation. Original source text is shown.'],
 'zh-CN':['在此设备上翻译文章和列表','正在准备语言包…','来源翻译已就绪','显示原文','翻译这些说明','此浏览器或语言组合不支持设备内翻译，将显示原始文字。'],
 'zh-TW':['在此裝置上翻譯文章和列表','正在準備語言套件…','來源翻譯已就緒','顯示原文','翻譯這些說明','此瀏覽器或語言組合不支援裝置內翻譯，將顯示原文。'],
 ms:['Terjemah artikel dan senarai pada peranti','Menyediakan pek bahasa…','Terjemahan sumber sedia','Papar teks asal','Terjemah penerangan ini','Pelayar atau pasangan bahasa ini tidak menyokong terjemahan pada peranti. Teks asal dipaparkan.'],
 id:['Terjemahkan artikel dan daftar di perangkat','Menyiapkan paket bahasa…','Terjemahan sumber siap','Tampilkan teks asli','Terjemahkan deskripsi ini','Browser atau pasangan bahasa ini tidak mendukung terjemahan di perangkat. Teks sumber asli ditampilkan.'],
 ja:['この端末で記事と掲載文を翻訳','言語パックを準備中…','出典の翻訳が利用できます','原文を表示','説明文を翻訳','このブラウザーまたは言語の組み合わせは端末内翻訳に非対応です。原文を表示しています。'],
 ko:['이 기기에서 기사와 목록 번역','언어팩 준비 중…','출처 번역 준비 완료','원문 보기','설명 번역','이 브라우저 또는 언어 조합은 기기 내 번역을 지원하지 않습니다. 원문을 표시합니다.'],
 th:['แปลบทความและรายการบนอุปกรณ์','กำลังเตรียมชุดภาษา…','พร้อมแปลข้อมูลจากแหล่งที่มา','ดูต้นฉบับ','แปลคำอธิบาย','เบราว์เซอร์หรือคู่ภาษานี้ไม่รองรับการแปลบนอุปกรณ์ จะแสดงข้อความต้นฉบับ'],
 vi:['Dịch bài viết và mô tả ngay trên thiết bị','Đang chuẩn bị gói ngôn ngữ…','Sẵn sàng dịch nguồn','Xem bản gốc','Dịch phần mô tả','Trình duyệt hoặc cặp ngôn ngữ này không hỗ trợ dịch trên thiết bị. Văn bản gốc được hiển thị.'],
 fr:['Traduire les articles et fiches sur cet appareil','Préparation du pack linguistique…','Traduction des sources prête','Afficher le texte original','Traduire ces descriptions','Ce navigateur ou cette paire de langues ne prend pas en charge la traduction locale. Texte original affiché.'],
 es:['Traducir artículos y fichas en este dispositivo','Preparando paquete de idioma…','Traducción de fuentes disponible','Mostrar original','Traducir estas descripciones','Este navegador o par de idiomas no admite traducción local. Se muestra el texto original.'],
 'pt-BR':['Traduzir artigos e descrições neste dispositivo','Preparando pacote de idioma…','Tradução das fontes disponível','Mostrar texto original','Traduzir estas descrições','Este navegador ou par de idiomas não oferece tradução no dispositivo. O texto original será exibido.']
};
(()=>{
 'use strict';
 const doc=document;
 const lang=()=>normalizeLocale(window.SGBUDDY_LANGUAGE||'en');
 const cap=()=>captions[lang()]||captions.en;
 const localeCode=code=>code==='zh-CN'?'zh':code==='zh-TW'?'zh-Hant':code==='pt-BR'?'pt':code;
 const targets=[
  '#sgbFactList .sgb-fact p',
  '#discoverResults .discover-fact p',
  '#discoverResults .discover-item > p',
  '#foodCards .food-stall > p:not(.food-warning)',
  '#foodCards .food-stall > p.food-warning',
  '#everydayApps .app-guide-description',
  '#foodServiceResults .food-tool-note',
  '#buddyReply'
 ];
 let translator=null,activeLocale='',state='idle',revision=0,enabled=false,showOriginal=false,working=false;
 const sourceText=new WeakMap(),translations=new Map();
 const host=doc.createElement('aside');
 host.id='sgbOnDeviceTranslation';host.className='sgb-translation-option card';
 host.innerHTML='<button type="button" id="sgbEnableLocalTranslation"></button><button type="button" id="sgbShowOriginal" hidden></button><small id="sgbTranslationStatus" role="status"></small>';
 const action=host.querySelector('#sgbEnableLocalTranslation'),reverse=host.querySelector('#sgbShowOriginal'),status=host.querySelector('#sgbTranslationStatus');
 const library=doc.querySelector('#merliKnowledgeLibrary')||doc.getElementById('discoverHub');
 library?.appendChild(host);
 function update(){
  const l=lang(),local=cap();
  host.hidden=l==='en';
  action.textContent=enabled&&activeLocale===l?local[4]:local[0];
  reverse.textContent=local[3];
  reverse.hidden=!enabled||activeLocale!==l;
  if(state==='unsupported')status.textContent=local[5];
  if(state==='preparing')status.textContent=local[1];
  if(state==='ready')status.textContent=local[2];
 }
 function original(node){
  if(sourceText.has(node))return sourceText.get(node);
  if(node.children.length)return null;
  const raw=node.textContent?.trim()||'';
  if(raw.length<18||raw.length>1600||/^https?:|^\d/.test(raw))return null;
  sourceText.set(node,raw);return raw;
 }
 async function translateVisible(){
  if(!translator||working||!enabled||showOriginal)return;
  working=true;
  const epoch=revision,targetLang=lang();
  try{
   let processed=0;
   for(const node of doc.querySelectorAll(targets.join(','))){
    if(processed>=220||revision!==epoch||lang()!==targetLang)break;
    if(node.closest('[hidden],.hidden'))continue;
    const src=original(node);if(!src)continue;
    processed++;
    const key=targetLang+'\0'+src;let text=translations.get(key);
    if(!text){try{text=await translator.translate(src);if(typeof text==='string'&&text.trim())translations.set(key,text);}catch{continue}}
    if(revision!==epoch||!node.isConnected||showOriginal)break;
    if(text&&text.trim()!==src){node.textContent=text;node.dataset.localeTranslated=targetLang;node.title=src;}
   }
  }finally{working=false}
 }
 async function start(){
  const l=lang();
  if(l==='en')return;
  if(enabled&&activeLocale===l){state='ready';update();await translateVisible();return}
  revision++;translator?.destroy?.();translator=null;state='preparing';enabled=false;showOriginal=false;update();
  const TranslatorAPI=globalThis.Translator;
  if(!TranslatorAPI?.availability||!TranslatorAPI?.create){state='unsupported';update();return}
  try{
   const options={sourceLanguage:'en',targetLanguage:localeCode(l)};
   const availability=await TranslatorAPI.availability(options);
   if(availability==='unavailable'){state='unsupported';update();return}
   // Called only from a direct click, so a downloadable pack can be requested via user gesture.
   const instance=await TranslatorAPI.create({...options,monitor(m){m.addEventListener('downloadprogress',()=>{status.textContent=cap()[1]})}});
   if(lang()!==l){instance.destroy?.();return}
   translator=instance;activeLocale=l;enabled=true;state='ready';update();await translateVisible();
  }catch{state='unsupported';update()}
 }
 action.addEventListener('click',start);
 reverse.addEventListener('click',()=>{
  showOriginal=!showOriginal;
  if(showOriginal){revision++;for(const node of doc.querySelectorAll('[data-locale-translated]')){const text=sourceText.get(node);if(text)node.textContent=text;delete node.dataset.localeTranslated;}reverse.textContent=cap()[4];}
  else{revision++;reverse.textContent=cap()[3];void translateVisible()}
 });
 doc.addEventListener('sgbuddy:language',()=>{
  revision++;showOriginal=false;enabled=false;translator?.destroy?.();translator=null;activeLocale='';state='idle';
  for(const node of doc.querySelectorAll('[data-locale-translated]')){const src=sourceText.get(node);if(src)node.textContent=src;delete node.dataset.localeTranslated}
  status.textContent='';update();
 });
 let observerQueued=false;
 const observe=()=>{if(observerQueued||!enabled||showOriginal)return;observerQueued=true;requestAnimationFrame(()=>{observerQueued=false;void translateVisible()})};
 const root=doc.querySelector('#discoverHub');
 if(root)new MutationObserver(observe).observe(root,{subtree:true,childList:true});
 doc.addEventListener('sgbuddy:discover-tab',observe);
 update();
 window.__SGBUDDY_DEVICE_TRANSLATION__='optional-v3';
})();
