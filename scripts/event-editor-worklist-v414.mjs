/* V4.14 Wave 3: read-only editor worklist. Does not approve or publish. */
import {readFileSync} from 'node:fs';
import {singaporeDate} from '../lib/calendar-v460.mjs';
import {buildEditorWorklist,editorWorklistMarkdown} from '../lib/events-editor-v414.mjs';
const read=x=>JSON.parse(readFileSync(x,'utf8'));
const result=buildEditorWorklist(read('data/events-review-queue-v470.json'),read('data/events-v470.json'),read('data/event-sources-v470.json'),singaporeDate());
if(process.argv.includes('--check')){
 if(!result.rows.every(x=>x.approvalAllowed===false&&x.requiresEditor===true))throw Error('Review candidate unexpectedly approvable');
 console.log('V4.14 EDITOR WORKLIST PASS: '+result.total+' candidates, '+JSON.stringify(result.stages)+', zero auto-approvals.');
}else if(process.argv.includes('--markdown'))console.log(editorWorklistMarkdown(result));
else console.log(JSON.stringify({asOf:result.day,total:result.total,stages:result.stages,autoApproved:result.autoApproved,reviewQuestions:result.missingChecklist}));
