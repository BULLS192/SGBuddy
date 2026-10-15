import assert from 'node:assert/strict';
import {newTrip,addStop,editStop,hydrate,STORE_KEY} from '../lib/trip-v260.mjs';
import {tripOverview,dayRouteSegments,suggestDayPlaces} from '../lib/trip-insights-v420.mjs';
const trip=newTrip('Quality','2026-11-01',3);
const put=(d,id,name,area,address='')=>assert.ok(addStop(trip,d,{id,name,area,address}));
put(0,'a','Merlion Park','Marina Bay','Fullerton Road');
put(0,'b','Esplanade','Marina Bay');put(0,'c','Gardens','Marina Bay');
put(0,'d','ArtScience','Marina Bay');put(0,'e','Helix Bridge','Marina Bay');
put(0,'f','Waterfront','Marina Bay');put(1,'a','Merlion Park','Marina Bay');
editStop(trip.days[0][0],'time','09:00');editStop(trip.days[0][1],'time','09:00');
let original=JSON.stringify(trip);
let summary=tripOverview(trip);
assert.deepEqual({...summary,repeated:undefined},{totalDays:3,plannedDays:2,totalStops:7,timed:2,timeConflicts:1,missingAddresses:6,repeated:undefined});
assert.deepEqual(summary.repeated,[{id:'a',name:'Merlion Park',days:[1,2]}]);
const segments=dayRouteSegments(trip,0);
assert.deepEqual(segments.map(x=>[x.from,x.to]),[[1,5],[5,6]]);
assert.equal(new URL(segments[0].url).searchParams.get('travelmode'),'walking');
assert.equal(new URL(dayRouteSegments(trip,0,{mode:'driving'})[1].url).searchParams.get('travelmode'),'driving');
assert.equal(dayRouteSegments(trip,0,{mode:'transit'}).length,0);
assert.equal(dayRouteSegments(trip,1).length,0);
const book=[
{id:'a',name:'Merlion Park',area:'Marina Bay'},
{id:'g',name:'Marina Square',area:'Marina Bay',kind:'Shop'},
{id:'h',name:'Coffee',area:'Marina Bay',kind:'Eat'},
{id:'z',name:'East Coast Park',area:'East'},
{id:'z',name:'Duplicate listing',area:'Marina Bay'},
{id:'review',name:'Unapproved event',area:'Marina Bay',status:'needs-review'},
{id:'event',name:'Official Event',area:'Marina Bay',kind:'Event'}
];
assert.deepEqual(suggestDayPlaces(trip,0,book).map(p=>p.id),['g','h','z']);
assert.deepEqual(suggestDayPlaces(trip,2,book),[]);
assert.deepEqual(suggestDayPlaces(trip,0,book,{limit:1}).map(p=>p.id),['g']);
assert.deepEqual(suggestDayPlaces(trip,0,book,{limit:100}).map(p=>p.id),['g','h','z']);
assert.equal(JSON.stringify(trip),original,'Planning intelligence must not mutate user data');
const restored=hydrate({trips:[trip],activeId:trip.id});
assert.equal(restored.trips[0].days[0].length,6);assert.equal(STORE_KEY,'sgbuddy-my-trips-v260');
assert.equal(tripOverview(null).totalStops,0);
console.log('V4.20 W1 MODEL PASS: trip-wide duplicates, timed conflicts, complete route segments, first-party area suggestions, local data unchanged.');
