/* V4.8 content packs: only first-party published, public static data.
 * These are downloaded on user request; maps, paid resources, API endpoints and personal
 * data are deliberately excluded. Trips/saved data remain in the app's local storage.
 */
export const OFFLINE_CACHE='sgbuddy-offline-packs-v480';
export const OFFLINE_PACKS=Object.freeze([
 {id:'calendar',files:['/data/holidays-2026-2027-v460.json','/data/events-v470.json','/data/event-sources-v470.json']},
 {id:'essentials',files:['/data/discover-v120.json','/data/official-places-v200.json','/data/travel-essentials-v250.json','/data/neighbourhoods-v230.json','/data/facts-published.json']},
 {id:'food',files:['/data/food-stalls-v180.json','/data/singapore-dishes-v180.json','/data/guide-stalls-v230.json','/data/dining-services-v261.json','/data/food-leads-v261.json']}
]);
export const allowedOfflineUrls=()=>new Set(OFFLINE_PACKS.flatMap(p=>p.files));
export function packFor(id){return OFFLINE_PACKS.find(p=>p.id===id)||null}
export function packDone(cachePaths,pack){
 return pack.files.every(file=>cachePaths.includes(file));
}
export function validateOfflineRequest(url,origin){
 const u=new URL(url,origin);
 return u.origin===origin&&allowedOfflineUrls().has(u.pathname)&&!u.search&&!u.hash;
}
