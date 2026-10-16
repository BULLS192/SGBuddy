import assert from 'node:assert/strict';
import {extractCandidates,collectSources} from './gov-discovery-v424.mjs';
const sources=[
 {id:'ica',agency:'ICA',url:'https://www.ica.gov.sg/news-and-publications/newsroom'},
 {id:'mom',agency:'MOM',url:'https://www.mom.gov.sg/newsroom/press-releases'}
];
const html='<a href="/news-and-publications/newsroom/media-release/new-arrival-travel-guidance">New arrival guidance for travellers entering Singapore</a>'+
 '<a href="https://evil.example/news-and-publications/newsroom/media-release/malicious">Malicious external government-looking update</a>'+
 '<a href="/news-and-publications/newsroom/media-release/new-arrival-travel-guidance">New arrival guidance for travellers entering Singapore</a>';
const found=extractCandidates(html,sources[0]);
assert.equal(found.length,1);
assert.equal(found[0].reviewStatus,'needs-review');
assert.equal(found[0].url,'https://www.ica.gov.sg/news-and-publications/newsroom/media-release/new-arrival-travel-guidance');
const results=await collectSources(sources,async url=>url.includes('ica.gov.sg')?html:'<p>Nothing to publish</p>');
assert.equal(results.coverage.length,2);
assert.equal(results.candidates.length,1);
assert.equal(results.coverage.filter(x=>x.ok).length,2);
console.log('V4.24 source discovery candidate-only tests passed');
