/* SGBuddy V4.14: only official publisher-stated event identities may become review candidates.
 * Source-page extraction does not grant public-admission or publisher-rights approval.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {officialVenueTitle,parseVenueDetail} from '../lib/events-public-html-v490.mjs';
const config=JSON.parse(readFileSync('data/event-venue-sources-v490.json','utf8'));
const expo=config.sources.find(x=>x.sourceId==='expo');
const uri='https://www.singaporeexpo.com.sg/events-at-expo/the-car-expo/';
const body='<h1>Events @ EXPO</h1><p>Date</p><p>24 – 25 Oct 2026</p><p>Venue</p><p>Hall 5 &amp; 6</p><p>Admission Type</p><p>Check organiser</p>';
assert.equal(officialVenueTitle(body),null,'generic title is not official event identity');
assert.equal(parseVenueDetail(body,expo,uri,'2026-10-14'),null,'must not fabricate an event title from the URL slug');
const og='<meta property="og:title" content="The Car Expo 2026 | Singapore EXPO">'+body;
const fromOg=parseVenueDetail(og,expo,uri,'2026-10-14');
assert.equal(fromOg.title,'The Car Expo 2026');
assert.equal(fromOg.titleEvidence,'og:title');
assert.equal(fromOg.status,'needs-review');
assert.equal(fromOg.admission,'check');
const json='<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":"Events @ EXPO"},{"@type":"Event","name":"The Makers Market 2026"}]}</script>'+body;
const fromLd=parseVenueDetail(json,expo,uri,'2026-10-14');
assert.equal(fromLd.title,'The Makers Market 2026');
assert.equal(fromLd.titleEvidence,'official-event-jsonld');
const h2=body.replace('<h1>Events @ EXPO</h1>','<h1>Events @ EXPO</h1><h2>The Car Expo 2026</h2>');
assert.equal(officialVenueTitle(h2)?.title,'The Car Expo 2026');
assert.equal(officialVenueTitle('<meta name="twitter:title" content="Art &amp; Craft Weekend | Singapore EXPO">'+body)?.title,'Art & Craft Weekend');
assert.equal(officialVenueTitle('<title>Events @ EXPO | Singapore EXPO</title>'+body),null,'generic metadata is not sufficient');
assert.equal(parseVenueDetail(og.replace('Check organiser','By Invitation Only'),expo,uri,'2026-10-14'),null,'restricted eligibility still filtered');
const queue=JSON.parse(readFileSync('data/events-review-queue-v470.json','utf8'));
const published=JSON.parse(readFileSync('data/events-v470.json','utf8'));
assert.ok(queue.candidates.every(x=>x.status==='needs-review'),'candidate queue must remain editorial only');
assert.ok(queue.candidates.every(x=>!published.events.some(e=>e.id===x.id)),'unreviewed event published');
assert.ok(readFileSync('.github/workflows/events-refresh-v470.yml','utf8').includes('node scripts/event-review-summary-v413.mjs --markdown'));
console.log('V4.14 OFFICIAL TITLE PASS: generic venue title withheld; OG/JSON-LD/H2 source evidence; admission and publication gates preserved.');
