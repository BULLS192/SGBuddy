import { del } from '@vercel/blob';
import { authenticateProfile, createProfile, parseProfileToken, profilePath, updateProfile } from '../lib/profile-store.js';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  let created;
  try{
    created=await createProfile({
      savedBusStops:[{code:'84009',name:'Bedok Int',services:['14','168']}],
      savedRailStations:[{code:'EW4',name:'Tanah Merah'}],
      places:{home:'Test Home'},
      mode:'resident'
    });
    const first=await authenticateProfile(created.token);
    if(!first) throw new Error('auth failed after create');
    const prefs=first.doc.preferences;
    const createdOk=prefs.savedBusStops?.[0]?.services?.includes('168')&&prefs.savedRailStations?.[0]?.code==='EW4';
    await updateProfile(first,{
      savedBusStops:[{code:'84009',name:'Bedok Int',services:['14']}],
      savedRailStations:[{code:'EW4',name:'Tanah Merah'},{code:'CG2',name:'Changi Airport'}],
      places:{home:'Test Home'},
      mode:'resident'
    });
    const second=await authenticateProfile(created.token);
    const updatedOk=second?.doc?.preferences?.savedBusStops?.[0]?.services?.length===1&&second?.doc?.preferences?.savedRailStations?.length===2;
    const parsed=parseProfileToken(created.token);
    await del(profilePath(parsed.id));
    return res.status(200).json({ok:true,createdOk:Boolean(createdOk),updatedOk:Boolean(updatedOk),deleted:true});
  }catch(error){
    try{const parsed=created?.token&&parseProfileToken(created.token);if(parsed)await del(profilePath(parsed.id))}catch{}
    return res.status(500).json({ok:false,error:error.message});
  }
}