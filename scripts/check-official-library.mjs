import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SOURCES,normalizeRecords,consolidate,fetchSource,buildLibrary,nameKey} from '../lib/official-library.js';
const files=['NEA_HAWKERS','NPARKS_PARKS','PA_CLUBS','STB_ATTRACTIONS','SPORT_FACILITIES'];
assert.deepEqual(SOURCES.map(s=>s.code),files);
const hawker=normalizeRecords(SOURCES[0],{type:'FeatureCollection',features:[
 {geometry:{type:'Point',coordinates:[103.8483,1.2809]},properties:{OBJECTID:'34',NAME:'Maxwell Food Centre',ADDRESSPOSTALCODE:'069184',ADDRESSSTREETNAME:'Kadayanallur Street',STATUS:'Existing'}},
 {geometry:{type:'Point',coordinates:[103.8483,1.2809]},properties:{OBJECTID:'35',NAME:'Maxwell Food Centre',STATUS:'Existing'}},
 {geometry:{type:'Point',coordinates:[103.84,1.31]},properties:{NAME:'Future Hawker',STATUS:'proposed'}},
 {geometry:{type:'Point',coordinates:[80,0]},properties:{NAME:'Made up non-SG location'}}
]});
assert.equal(hawker.length,1);
assert.equal(hawker[0].postal,'069184');
assert.equal(hawker[0].category,'Eat');
assert.equal(hawker[0].lat,1.2809);
const parks=normalizeRecords(SOURCES[1],{features:[{geometry:{type:'Polygon',coordinates:[[[103.8,1.30],[103.81,1.30],[103.81,1.32],[103.8,1.30]]]},properties:{NAME:'Test Park'}}]});
assert.equal(parks.length,1);assert.equal(parks[0].locationPrecision,'indicative-boundary-centre');
const cc=normalizeRecords(SOURCES[2],{features:[{geometry:{type:'Point',coordinates:[103.83,1.4]},properties:{Name:'kml_1',Description:'<table><tr><th>NAME</th><td>Sample Community Club</td></tr><tr><th>ADDRESSPOSTALCODE</th><td>123456</td></tr></table>'}}]});
assert.equal(cc.length,1,'PA Description markup must be parsed');
assert.equal(cc[0].name,'Sample Community Club');
assert.equal(cc[0].postal,'123456');
const tourism=normalizeRecords(SOURCES[3],{features:[{geometry:{type:'Point',coordinates:[103.85,1.28]},properties:{PAGETITLE:'Sample Attraction'}}]});
assert.equal(tourism[0].freshness,'historical-recheck');
const sports=normalizeRecords(SOURCES[4],'VENUE_NAME,LATITUDE,LONGITUDE\nSample Sport Centre,1.305,103.87\n');
assert.equal(sports.length,1);
const combined=consolidate([{source:SOURCES[0],rows:hawker},{source:SOURCES[1],rows:parks},{source:SOURCES[2],rows:cc},{source:SOURCES[3],rows:tourism},{source:SOURCES[4],rows:sports}]);
assert.equal(combined.counts.total,5);assert.equal(combined.counts.eat,1);assert.equal(combined.sources.length,5);
assert.equal(nameKey('Maxwell Food Centre'),nameKey('Maxwell Hawker Centre'));
const uri='https://storage.data.gov.sg/examples.geojson';
const fakeFetch=async u=>{
 if(u.includes('poll-download'))return {ok:true,text:async()=>JSON.stringify({code:0,data:{url:uri}})};
 if(u===uri)return {ok:true,text:async()=>JSON.stringify({features:[{geometry:{type:'Point',coordinates:[103.8483,1.2809]},properties:{NAME:'Maxwell Food Centre'}}]})};
 throw new Error('Unexpected URL '+u);
};
assert.equal((await fetchSource(SOURCES[0],fakeFetch)).length,1);
const injected=await buildLibrary(async u=>{if(u.includes('/SPORT_FACILITIES'))throw Error('fail sport');return fakeFetch(u)});
assert.equal(injected.sources.length,SOURCES.length);
const root=fs.readFileSync('app-v150.js','utf8');
const bootstrap=fs.readFileSync('app-v090.js','utf8');
const sw=fs.readFileSync('sw.js','utf8'),html=fs.readFileSync('index.html','utf8');
assert.ok(bootstrap.includes("import('/app-v150.js')"),'v1.5 boot module missing');
assert.ok(html.includes('/official-library-v150.css'),'styles missing');
assert.ok(sw.includes('/app-v150.js')&&sw.includes('/official-library-v150.css'),'offline shell not updated');
for(const needle of ['sgbuddy:knowledge-saved','data-official-save','officialHistoric','officialRadius','officialSource','/api/library','sourceCoverage','locationPrecision']){
 assert.ok(root.includes(needle)||needle==='officialSource'&&root.includes('officialSources'),needle+' missing from UI');
}
assert.ok(!sw.includes("'/api/library'"),'Should not cache live government data as static shell');
console.log('V1.5 official place library import, dataset safeguards and UI contracts PASS.');
