/* V4.17: bounded first-party manual offline requests, with cancellation.
 * Reject rather than continuing a download if the device cannot cancel it.
 */
export async function fetchOfflineWithTimeout(input,options={},{
 fetchImpl=globalThis.fetch,AbortControllerImpl=globalThis.AbortController,timeoutMs=12000
}={}){
 if(typeof fetchImpl!=='function'||typeof AbortControllerImpl!=='function')
  throw Error('cancelable offline requests unavailable');
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>120000)
  throw Error('invalid offline timeout');
 const controller=new AbortControllerImpl();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  return await fetchImpl(input,{...options,signal:controller.signal});
 }catch(error){
  if(controller.signal.aborted)throw new Error('offline request timed out',{cause:error});
  throw error;
 }finally{clearTimeout(timer);}
}
