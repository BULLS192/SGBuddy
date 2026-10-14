/* V4.17 cross-tab safety: fail closed rather than use unsafe unguarded writes. */
export const canLockOfflinePacks=locks=>typeof locks?.request==='function';
export async function withOfflinePackLock(id,action,locks){
 if(!/^[a-z][a-z0-9-]*$/.test(id||''))throw Error('invalid offline pack id');
 if(typeof action!=='function')throw Error('missing offline operation');
 if(!canLockOfflinePacks(locks))throw Error('offline cross-tab lock unavailable');
 return locks.request('sgbuddy-offline-'+id,{mode:'exclusive'},async()=>action());
}
