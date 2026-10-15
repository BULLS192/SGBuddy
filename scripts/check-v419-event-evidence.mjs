/* V4.19 independent official-page evidence inventory; NEVER an event publisher. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>JSON.parse(readFileSync(p,'utf8'));
const evidence=load('data/events-evidence-v419.json'),queue=load('data/events-review-queue-v470.json'),published=load('data/events-v470.json'),sources=load('data/event-sources-v470.json'),approvals=load('data/event-approvals-v490.json');
const hosts=new Map(sources.sources.map(s=>[s.id,new URL(s.url).hostname]));
assert.equal(evidence.schemaVersion,1);assert.equal(evidence.status,'source-checked-candidates-not-published');
assert.ok(evidence.records.length>=9);
const unique=new Set();
for(const row of evidence.records){
 assert.ok(!unique.has(row.id),'Duplicate evidence ID');unique.add(row.id);
 assert.equal(row.requiresHumanApproval,true);assert.equal(row.publicListingRightsVerified,false);
 assert.ok(row.evidenceNote?.includes('Official'),'Missing official-source note');
 assert.equal(new URL(row.sourceUrl).hostname,hosts.get(row.sourceId),'Expected official source hostname');
 const match=queue.candidates.filter(x=>x.id===row.id);
 assert.equal(match.length,1,'Evidence record must correspond to exactly one held candidate');
 const entry=match[0];
 for(const field of ['title','startDate','endDate','venue','sourceId','sourceUrl'])assert.equal(entry[field],row[field],field+' mismatch '+row.id);
 assert.equal(entry.status,'needs-review');
 assert.ok(!published.events.some(x=>x.id===row.id||x.sourceUrl===row.sourceUrl),'Unapproved evidence leaked to Events');
 assert.ok(!approvals.approvals.some(x=>x.candidateId===row.id),'Human approval is explicitly not included');
}
console.log('V4.19 evidence PASS: '+evidence.records.length+' source-checked Esplanade candidates held; no auto-approval or publication.');
