/* V3.1-B: additional 16 verified Singapore nature and parks facts.
   Source-locked: if official source fact changes, translation is suppressed. */
import {normalizeLocale} from './i18n-v280.mjs';
export const NATURE_PATTERN_KEYS=["aboutHectares","establishedForest","openedNature","gazetted","aseanHeritage","approxHectares","nparksIdentifies","nparksOne","nparksProtected","nparksAmong","nparksLists","nparksPart","nparksIn"];
const rows={"en":"{name} covers about {amount} hectares.|{name} was established as a forest reserve in {year}.|{name} was opened as a nature park in {year}.|{name} was officially gazetted as a nature reserve in {year}.|{name} was named Singapore's first ASEAN Heritage Park in {year}.|{name} covers approximately {amount} hectares.|NParks identifies {name} as a nature area.|NParks identifies {name} as one of Singapore's nature areas.|NParks identifies {name} as a protected nature area.|NParks lists {name} among Singapore's nature areas.|NParks lists {name} as a nature area.|NParks identifies {name} as part of {place}.|NParks identifies {name} in Singapore.","zh-CN":"{name} 面积约为 {amount} 公顷。|{name} 于 {year} 年被设立为森林保护区。|{name} 于 {year} 年作为自然公园开放。|{name} 于 {year} 年正式被划定为自然保护区。|{name} 于 {year} 年被指定为新加坡首个东盟遗产公园。|{name} 面积约为 {amount} 公顷。|新加坡国家公园局将 {name} 列为自然区域。|新加坡国家公园局将 {name} 列为新加坡自然区域之一。|新加坡国家公园局将 {name} 列为受保护的自然区域。|新加坡国家公园局将 {name} 列入新加坡自然区域名单。|新加坡国家公园局将 {name} 列为自然区域。|新加坡国家公园局将 {name} 列为 {place} 的一部分。|新加坡国家公园局确认新加坡境内的 {name}。","zh-TW":"{name} 面積約為 {amount} 公頃。|{name} 於 {year} 年被設為森林保護區。|{name} 於 {year} 年作為自然公園開放。|{name} 於 {year} 年正式被劃定為自然保護區。|{name} 於 {year} 年獲指定為新加坡首座東協遺產公園。|{name} 面積約為 {amount} 公頃。|新加坡國家公園局將 {name} 列為自然區域。|新加坡國家公園局將 {name} 列為新加坡自然區域之一。|新加坡國家公園局將 {name} 列為受保護的自然區域。|新加坡國家公園局將 {name} 列入自然區域名單。|新加坡國家公園局將 {name} 列為自然區域。|新加坡國家公園局將 {name} 列為 {place} 的一部分。|新加坡國家公園局確認新加坡境內的 {name}。","ms":"{name} meliputi kira-kira {amount} hektar.|{name} diisytiharkan sebagai hutan simpan pada tahun {year}.|{name} dibuka sebagai taman alam semula jadi pada tahun {year}.|{name} diwartakan secara rasmi sebagai kawasan perlindungan alam semula jadi pada tahun {year}.|{name} dinamakan sebagai Taman Warisan ASEAN pertama Singapura pada tahun {year}.|{name} meliputi lebih kurang {amount} hektar.|NParks mengenal pasti {name} sebagai kawasan alam semula jadi.|NParks mengenal pasti {name} sebagai salah satu kawasan alam semula jadi Singapura.|NParks mengenal pasti {name} sebagai kawasan alam semula jadi terlindung.|NParks menyenaraikan {name} antara kawasan alam semula jadi Singapura.|NParks menyenaraikan {name} sebagai kawasan alam semula jadi.|NParks mengenal pasti {name} sebagai sebahagian daripada {place}.|NParks mengenal pasti {name} di Singapura.","id":"{name} mencakup sekitar {amount} hektare.|{name} ditetapkan sebagai hutan lindung pada tahun {year}.|{name} dibuka sebagai taman alam pada tahun {year}.|{name} secara resmi ditetapkan sebagai cagar alam pada tahun {year}.|{name} ditetapkan sebagai Taman Warisan ASEAN pertama Singapura pada tahun {year}.|{name} mencakup sekitar {amount} hektare.|NParks mengidentifikasi {name} sebagai kawasan alam.|NParks mengidentifikasi {name} sebagai salah satu kawasan alam Singapura.|NParks mengidentifikasi {name} sebagai kawasan alam yang dilindungi.|NParks mencantumkan {name} di antara kawasan alam Singapura.|NParks mencantumkan {name} sebagai kawasan alam.|NParks mengidentifikasi {name} sebagai bagian dari {place}.|NParks mengidentifikasi {name} di Singapura.","ja":"{name} の面積は約 {amount} ヘクタールです。|{name} は {year} 年に森林保護区に指定されました。|{name} は {year} 年に自然公園として開園しました。|{name} は {year} 年に正式に自然保護区に指定されました。|{name} は {year} 年にシンガポール初のASEAN遺産公園に認定されました。|{name} の面積は約 {amount} ヘクタールです。|NParks は {name} を自然地域としています。|NParks は {name} をシンガポールの自然地域の一つとしています。|NParks は {name} を保護対象の自然地域としています。|NParks は {name} をシンガポールの自然地域に含めています。|NParks は {name} を自然地域に分類しています。|NParks は {name} を {place} の一部としています。|NParks はシンガポールにある {name} を自然地域として挙げています。","ko":"{name}의 면적은 약 {amount}헥타르입니다.|{name}은(는) {year}년에 산림보호구역으로 지정되었습니다.|{name}은(는) {year}년에 자연공원으로 개장했습니다.|{name}은(는) {year}년에 공식적으로 자연보호구역으로 지정되었습니다.|{name}은(는) {year}년에 싱가포르 최초의 아세안 유산공원으로 지정되었습니다.|{name}은(는) 약 {amount}헥타르 규모입니다.|NParks는 {name}을(를) 자연 지역으로 지정합니다.|NParks는 {name}을(를) 싱가포르의 자연 지역 중 하나로 분류합니다.|NParks는 {name}을(를) 보호 대상 자연 지역으로 분류합니다.|NParks는 {name}을(를) 싱가포르 자연 지역 목록에 포함합니다.|NParks는 {name}을(를) 자연 지역으로 목록화합니다.|NParks는 {name}을(를) {place}의 일부로 분류합니다.|NParks는 싱가포르의 {name}을(를) 확인합니다.","th":"{name} มีพื้นที่ประมาณ {amount} เฮกตาร์|{name} ได้รับการจัดตั้งเป็นป่าสงวนในปี {year}|{name} เปิดเป็นอุทยานธรรมชาติในปี {year}|{name} ได้รับการประกาศเป็นเขตอนุรักษ์ธรรมชาติอย่างเป็นทางการในปี {year}|{name} ได้รับการตั้งชื่อเป็นอุทยานมรดกอาเซียนแห่งแรกของสิงคโปร์ในปี {year}|{name} มีพื้นที่ประมาณ {amount} เฮกตาร์|NParks ระบุว่า {name} เป็นพื้นที่ธรรมชาติ|NParks ระบุว่า {name} เป็นหนึ่งในพื้นที่ธรรมชาติของสิงคโปร์|NParks ระบุว่า {name} เป็นพื้นที่ธรรมชาติที่ได้รับการคุ้มครอง|NParks รวม {name} ไว้ในพื้นที่ธรรมชาติของสิงคโปร์|NParks จัด {name} เป็นพื้นที่ธรรมชาติ|NParks ระบุว่า {name} เป็นส่วนหนึ่งของ {place}|NParks ระบุ {name} ในสิงคโปร์","vi":"{name} có diện tích khoảng {amount} hecta.|{name} được thành lập làm khu rừng bảo tồn vào năm {year}.|{name} mở cửa như một công viên thiên nhiên vào năm {year}.|{name} được chính thức công nhận là khu bảo tồn thiên nhiên vào năm {year}.|{name} được công nhận là Công viên Di sản ASEAN đầu tiên của Singapore vào năm {year}.|{name} có diện tích khoảng {amount} hecta.|NParks xác định {name} là khu vực thiên nhiên.|NParks xác định {name} là một trong các khu vực thiên nhiên của Singapore.|NParks xác định {name} là khu vực thiên nhiên được bảo vệ.|NParks liệt kê {name} trong các khu vực thiên nhiên của Singapore.|NParks liệt kê {name} là khu vực thiên nhiên.|NParks xác định {name} là một phần của {place}.|NParks xác định {name} tại Singapore.","fr":"{name} couvre environ {amount} hectares.|{name} a été établi comme réserve forestière en {year}.|{name} a ouvert comme parc naturel en {year}.|{name} a été officiellement classé réserve naturelle en {year}.|{name} a été désigné premier parc du patrimoine de l'ASEAN à Singapour en {year}.|{name} couvre approximativement {amount} hectares.|NParks identifie {name} comme une zone naturelle.|NParks identifie {name} comme l'une des zones naturelles de Singapour.|NParks identifie {name} comme une zone naturelle protégée.|NParks inclut {name} parmi les zones naturelles de Singapour.|NParks classe {name} comme une zone naturelle.|NParks considère {name} comme faisant partie de {place}.|NParks identifie {name} à Singapour.","es":"{name} abarca unos {amount} hectáreas.|{name} se estableció como reserva forestal en {year}.|{name} se abrió como parque natural en {year}.|{name} fue declarado oficialmente reserva natural en {year}.|{name} fue nombrado primer Parque del Patrimonio de la ASEAN de Singapur en {year}.|{name} abarca aproximadamente {amount} hectáreas.|NParks identifica {name} como zona natural.|NParks identifica {name} como una de las zonas naturales de Singapur.|NParks identifica {name} como zona natural protegida.|NParks incluye {name} entre las zonas naturales de Singapur.|NParks clasifica {name} como zona natural.|NParks identifica {name} como parte de {place}.|NParks identifica {name} en Singapur.","pt-BR":"{name} ocupa cerca de {amount} hectares.|{name} foi estabelecido como reserva florestal em {year}.|{name} foi aberto como parque natural em {year}.|{name} foi oficialmente declarado reserva natural em {year}.|{name} foi designado o primeiro Parque do Patrimônio da ASEAN em Singapura em {year}.|{name} ocupa aproximadamente {amount} hectares.|O NParks identifica {name} como área natural.|O NParks identifica {name} como uma das áreas naturais de Singapura.|O NParks identifica {name} como área natural protegida.|O NParks inclui {name} entre as áreas naturais de Singapura.|O NParks lista {name} como área natural.|O NParks identifica {name} como parte de {place}.|O NParks identifica {name} em Singapura."};
export const NATURE_TEMPLATES=Object.fromEntries(Object.entries(rows).map(([locale,line])=>{
 const phrases=line.split('|');
 if(phrases.length!==NATURE_PATTERN_KEYS.length)throw Error('Incomplete nature pack: '+locale);
 return [locale,Object.fromEntries(NATURE_PATTERN_KEYS.map((pattern,i)=>[pattern,phrases[i]]))];
}));
export const NATURE_FACTS={
 "FACT-NAT-001": {
  "pattern": "aboutHectares",
  "values": {
   "name": "Bukit Timah Nature Reserve",
   "amount": "163"
  },
  "source": "Bukit Timah Nature Reserve covers about 163 hectares."
 },
 "FACT-NAT-002": {
  "pattern": "establishedForest",
  "values": {
   "name": "Bukit Timah Nature Reserve",
   "year": "1883"
  },
  "source": "Bukit Timah Nature Reserve was established as a forest reserve in 1883."
 },
 "FACT-NAT-004": {
  "pattern": "openedNature",
  "values": {
   "name": "Sungei Buloh",
   "year": "1993"
  },
  "source": "Sungei Buloh was opened as a nature park in 1993."
 },
 "FACT-NAT-005": {
  "pattern": "gazetted",
  "values": {
   "name": "Sungei Buloh",
   "year": "2002"
  },
  "source": "Sungei Buloh was officially gazetted as a nature reserve in 2002."
 },
 "FACT-NAT-006": {
  "pattern": "aseanHeritage",
  "values": {
   "name": "Sungei Buloh",
   "year": "2003"
  },
  "source": "Sungei Buloh was named Singapore's first ASEAN Heritage Park in 2003."
 },
 "FACT-NAT-007": {
  "pattern": "approxHectares",
  "values": {
   "name": "Sungei Buloh Wetland Reserve",
   "amount": "202"
  },
  "source": "Sungei Buloh Wetland Reserve covers approximately 202 hectares."
 },
 "FACT-NAT-011": {
  "pattern": "nparksIdentifies",
  "values": {
   "name": "Kranji Mangrove"
  },
  "source": "NParks identifies Kranji Mangrove as a nature area."
 },
 "FACT-NAT-012": {
  "pattern": "nparksIdentifies",
  "values": {
   "name": "Mount Faber Park"
  },
  "source": "NParks identifies Mount Faber Park as a nature area."
 },
 "FACT-NAT-013": {
  "pattern": "nparksOne",
  "values": {
   "name": "Pasir Ris Nature Area"
  },
  "source": "NParks identifies Pasir Ris Nature Area as one of Singapore's nature areas."
 },
 "FACT-NAT-014": {
  "pattern": "nparksProtected",
  "values": {
   "name": "Pulau Ubin Nature Area"
  },
  "source": "NParks identifies Pulau Ubin Nature Area as a protected nature area."
 },
 "FACT-NAT-015": {
  "pattern": "nparksAmong",
  "values": {
   "name": "Sentosa Nature Area"
  },
  "source": "NParks lists Sentosa Nature Area among Singapore's nature areas."
 },
 "FACT-NAT-017": {
  "pattern": "nparksLists",
  "values": {
   "name": "Singapore Botanic Gardens Rainforest"
  },
  "source": "NParks lists Singapore Botanic Gardens Rainforest as a nature area."
 },
 "FACT-NAT-018": {
  "pattern": "nparksIdentifies",
  "values": {
   "name": "Telok Blangah Hill Park"
  },
  "source": "NParks identifies Telok Blangah Hill Park as a nature area."
 },
 "FACT-NAT-019": {
  "pattern": "nparksIdentifies",
  "values": {
   "name": "Bukit Batok Nature Area"
  },
  "source": "NParks identifies Bukit Batok Nature Area as a nature area."
 },
 "FACT-NAT-020": {
  "pattern": "nparksPart",
  "values": {
   "name": "Dairy Farm Nature Area",
   "place": "Bukit Timah Nature Area"
  },
  "source": "NParks identifies Dairy Farm Nature Area as part of Bukit Timah Nature Area."
 },
 "FACT-NAT-021": {
  "pattern": "nparksIn",
  "values": {
   "name": "Chestnut Nature Area"
  },
  "source": "NParks identifies Chestnut Nature Area in Singapore."
 },
"FACT-NAT-010":{"pattern":"nparksPart","values":{"name":"Kent Ridge Park","place":"Singapore's nature areas"},"source":"NParks identifies Kent Ridge Park as part of Singapore's nature areas."},
"FACT-NAT-016":{"pattern":"nparksAmong","values":{"name":"Sisters' Islands Marine Nature Area"},"source":"NParks lists Sisters' Islands Marine Nature Area among Singapore's nature areas."}
};
export function natureFactTranslation(locale,record){
 const code=normalizeLocale(locale);
 if(code==='en'||record?.status!=='verified')return null;
 const spec=NATURE_FACTS[record?.id];
 if(!spec||spec.source!==record.text)return null;
 const template=NATURE_TEMPLATES[code]?.[spec.pattern];
 return template?template.replace(/\{(\w+)\}/g,(token,k)=>spec.values[k]??token):null;
}
