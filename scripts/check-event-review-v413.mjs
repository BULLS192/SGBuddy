/* Synthetic candidate QA. Does not contact or publish external providers. */
import assert from 'node:assert/strict';
import {triageEventCandidates,reviewMarkdown} from '../lib/events-review-v413.mjs';
const sources={sources:[{id:'expo',url:'https://www.singaporeexpo.com.sg/events-at-expo/'},{id:'313',url:'https://www.313somerset.com.sg/whats-on/offers/'}]};
const published={events:[{id:'published-event',title:'Public Expo',venue:'EXPO',startDate:'2026-10-18',sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/public-expo/'}]};
const candidate=(id,title,date='2026-10-18',extra={})=>({id,title,startDate:date,endDate:date,venue:'EXPO',sourceId:'expo',sourceUrl:'https://www.singaporeexpo.com.sg/events-at-expo/'+id+'/',status:'needs-review',access:'unverified',...extra});
const queue={candidates:[
 candidate('generic','Events @ EXPO'),
 candidate('eligible','Craft Festival'),
 candidate('dup','Public Expo','2026-10-18',{sourceUrl:published.events[0].sourceUrl}),
 candidate('private','By Invitation Only Gala'),
 candidate('promo','Sale Event','2026-10-20',{kind:'promotion',sourceId:'313',sourceUrl:'https://www.313somerset.com.sg/whats-on/offers/promo/'}),
 candidate('later','Family Workshop','2026-11-30'),
 candidate('evil','Unsafe','2026-10-18',{sourceUrl:'https://evil.example/phishing'}),
]};
const r=triageEventCandidates(queue,published,sources,'2026-10-14');
assert.equal(r.total,7);assert.equal(r.genericTitles,1);assert.equal(r.promotions,1);assert.equal(r.reviewSoon,1);assert.equal(r.held,5);assert.equal(r.reviewLater,1);
const get=id=>r.rows.find(x=>x.id===id);
assert.deepEqual(get('eligible').flags,[]);
assert.ok(get('generic').flags.includes('generic-title'));
assert.ok(get('dup').flags.includes('potential-already-published'));
assert.ok(get('private').flags.includes('public-eligibility-unverified'));
assert.ok(get('promo').flags.includes('promotion-not-confirmed-event'));
assert.ok(get('evil').flags.includes('unverified-source-host'));
assert.ok(r.rows.every(x=>x.approvalAllowed===false));
assert.ok(reviewMarkdown(r).includes('No candidate is verified'));
console.log('V4.13 EVENTS REVIEW STATIC PASS: generic EXPO titles, promotions, duplicates, private meetings and unapproved hosts held safely.');
