/* V4.14: suggestions draw ONLY from published/curated events, never discovery review queue. */
import {upcomingEvents,eventFreshness,isValidDay} from './events-v470.mjs';
import {filterEventsByAreaCategory} from './events-explore-v414.mjs';
const MODES=['resident','visitor','executive','new_in_sg','student'];
export function selectWeekendPicks(published,day,mode='visitor',limit=3,options={}){
 if(!isValidDay(day))throw Error('Invalid Singapore day');
 const persona=MODES.includes(mode)?mode:'visitor';
 const cap=Math.max(0,Math.min(6,Math.trunc(Number(limit)||0)));
 const candidates=upcomingEvents(filterEventsByAreaCategory(published,options.sources||[],options.area||'all',options.category||'all'),day,'weekend',persona)
  .filter(e=>e.status==='scheduled'&&e.verificationMethod&&isValidDay(e.verifiedAt)
   &&eventFreshness(e,day)==='snapshot'&&typeof e.title==='string'&&e.title.trim()
   &&typeof e.sourceUrl==='string'&&/^https:\/\//i.test(e.sourceUrl)
   &&e.admission!=='unverified');
 const chosen=[],seenCategories=new Set(),seenIds=new Set();
 const rank=e=>(e.audiences?.includes(persona)?0:2)+(e.admission==='free'?0:0.1);
 const order=[...candidates].sort((a,b)=>rank(a)-rank(b)||a.startDate.localeCompare(b.startDate)||a.title.localeCompare(b.title));
 while(chosen.length<cap&&order.length){
  let pick=order.findIndex(e=>!seenCategories.has(e.category));
  if(pick<0)pick=0;
  const e=order.splice(pick,1)[0];
  if(!seenIds.has(e.id)){chosen.push(e);seenCategories.add(e.category);seenIds.add(e.id)}
 }
 return chosen;
}
