import { del } from '@vercel/blob';
import { authenticateProfile, createProfile, parseProfileToken, profilePath, updateProfile } from '../lib/profile-store.js';

export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  let created;
  try{
    created=await createProfile({savedBusStops:[{code:'84009',name:'Bedok Int'}],places:{home:'Test Home'},mode:'resident'});
    const first=await authenticateProfile(created.token);
    if(!first) throw new Error('authentication failed after create');
    const updated=await updateProfile(first,{savedBusStops:[{code:'84009',name:'Bedok Int'}],places:{home:'Test Home',work:'Test Work'},mode:'resident'});
    const second=await authenticateProfile(created.token);
    if(!second) throw new Error('authentication failed after update');
    const parsed=parseProfileToken(created.token);
    await del(profilePath(parsed.id));
    return res.status(200).json({
      ok:true,
      created:Boolean(created.profile?.id),
      authenticated:true,
      updated:updated.preferences?.places?.work==='Test Work',
      reread:second.doc?.preferences?.places?.work==='Test Work',
      deleted:true
    });
  }catch(error){
    try{const parsed=created?.token&&parseProfileToken(created.token);if(parsed)await del(profilePath(parsed.id))}catch{}
    return res.status(500).json({ok:false,error:error.message});
  }
}
