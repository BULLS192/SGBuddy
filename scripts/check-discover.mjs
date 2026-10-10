import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const catalog=JSON.parse(read('data/discover-v120.json'));
const entry=read('app-v090.js');
const discover=read('app-v120.js');
const index=read('index.html');
const sw=read('sw.js');
const profile=read('lib/profile-store.js');
const nearby=read('app-v110.js');
const modes=['resident','visitor','executive','student'];
const validKinds=['Eat','Do','Shop'];
assert.equal(catalog.schemaVersion,1);
assert.ok(catalog.places.length>=70,'Place seed unexpectedly small');
assert.ok(catalog.apps.length>=25,'App seed unexpectedly small');
assert.ok(catalog.facts.length>=20,'Verified trivia seed unexpectedly small');
const ids=new Set(),names=new Set();
for(const row of [...catalog.places,...catalog.apps,...catalog.facts]){
  assert.match(row.id,/^(SGP|APP|FACT)-\d+$/);
  assert.ok(!ids.has(row.id),'Duplicate id '+row.id);ids.add(row.id);
  assert.ok(Array.isArray(row.modes),'Modes missing '+row.id);
  assert.ok(row.modes.some(mode=>modes.includes(mode)),'No supported modes '+row.id);
  for(const m of row.modes)assert.ok(modes.includes(m),'Invalid mode '+m);
  for(const key of ['sourceUrl','publisherUrl'])if(row[key])assert.match(row[key],/^https:\/\//,'Unsafe source '+row.id);
}
for(const row of catalog.places){
  const name=row.name.trim().toLowerCase();
  assert.ok(!names.has(name),'Canonical venue duplicated: '+row.name);
  names.add(name);
  assert.ok(row.area,'Area missing '+row.name);
  assert.ok(Array.isArray(row.kinds)&&row.kinds.length>0,'No categories '+row.name);
  for(const kind of row.kinds)assert.ok(validKinds.includes(kind),'Invalid category '+kind);
  assert.ok(row.status==='curated-preview','Place content wrongly represented as verified');
}
for(const fact of catalog.facts){
  assert.ok(fact.text&&fact.sourceUrl,'Unsourced fact');
  assert.equal(fact.status,'source-reviewed');
}
assert.ok(entry.includes("import('/app-v120.js')"),'v1.2 module not loaded');
assert.ok(entry.includes("['resident','visitor','executive','new_in_sg','student']"),'Student missing in normalize');
assert.ok(entry.includes("active_mode:state.mode==='student'?'new_in_sg':state.mode"),'Legacy cloud compatibility missing');
assert.ok(entry.includes("new CustomEvent('sgbuddy:weather')"),'Air quality not refreshed');
assert.ok(index.includes('data-persona="student"'),'Student selector missing');
assert.ok(index.includes('/discover-v120.css'),'v1.2 stylesheet not wired');
assert.ok(sw.includes('/data/discover-v120.json'),'Catalog is not available offline');
assert.ok(sw.includes('/app-v120.js'),'New module is not cached');
assert.ok(profile.includes("'new_in_sg','student'"),'Guest profile cannot retain student mode');
assert.ok(nearby.includes("requestedPersona==='student'?'new_in_sg':requestedPersona"),'Legacy Place Index mapping missing');
assert.ok(discover.includes('data-discover-tab'),'Discover tabs missing');
assert.ok(discover.includes("category(psi)")||discover.includes('function category(psi)'),'Regional air-quality UI missing');

// Regression: a missing rainfall or wind feed must never make healthy PSI/PM2.5
// appear partial in the independent Air Quality panel.
const airStart=discover.indexOf('  function drawAirQuality(){');
const airEnd=discover.indexOf('\n  const environment=',airStart);
assert.ok(airStart!==-1&&airEnd>airStart,'Air quality renderer missing');
const renderer=discover.slice(airStart,airEnd);
const simulateAir=weather=>{
  const elements=Object.fromEntries(['v120AirPanel','v120AirStatus','v120AirUpdated','v120AirAdvisory'].map(id=>[id,{textContent:'',innerHTML:'',className:''}]));
  const fakeState={weather};
  new Function('state','
  catalog.places.length+' unique venues,',
  catalog.apps.length+' apps,',
  catalog.facts.length+' source-reviewed facts,',
  'student and NEA support wired.');
,'safe','dateText','category','airValue',renderer+';drawAirQuality()')(
    fakeState,s=>elements[s.slice(1)],String,iso=>iso||'Not provided',
    n=>n<=50?'Good':n<=100?'Moderate':'Unhealthy',
    raw=>raw==null?null:Number(raw)
  );
  return {badge:elements.v120AirStatus.textContent,details:elements.v120AirUpdated.textContent};
};
const freshTime=new Date().toISOString();
const liveAir={psi24h:{overall:55,regions:{central:55},updatedAt:freshTime},pm25OneHour:{regions:{central:16},updatedAt:freshTime},region:'central'};
assert.equal(simulateAir({airQuality:liveAir,dataQuality:{status:'partial',unavailableSignals:['rainfall']}}).badge,'Official NEA readings','Unrelated weather feed must not downgrade air badge');
assert.equal(simulateAir({airQuality:{...liveAir,pm25OneHour:null},dataQuality:{status:'partial'}}).badge,'Partial air-quality data');
assert.equal(simulateAir({airQuality:liveAir,dataQuality:{staleSignals:['pm25']}}).badge,'Cached NEA air readings');
assert.equal(simulateAir({airQuality:liveAir,source:'device-cache',dataQuality:{status:'partial'}}).badge,'Saved offline readings');
assert.equal(simulateAir({airQuality:{...liveAir,psi24h:{overall:55,regions:{central:55}}},dataQuality:{status:'complete'}}).badge,'NEA time unconfirmed');
assert.equal(simulateAir({airQuality:{...liveAir,pm25OneHour:{regions:{central:16},updatedAt:new Date(Date.now()-4*3600000).toISOString()}},dataQuality:{status:'complete'}}).badge,'Delayed NEA readings');
assert.equal(simulateAir({airQuality:null,dataQuality:{status:'unavailable'}}).badge,'Air readings unavailable');

console.log('SGBuddy v1.2 checks passed:',
  catalog.places.length+' unique venues,',
  catalog.apps.length+' apps,',
  catalog.facts.length+' source-reviewed facts,',
  'student and NEA support wired.');
