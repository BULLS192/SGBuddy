import { authenticateProfile, bearerToken, createProfile, publicProfile, updateProfile } from '../lib/profile-store.js';

function bodyObject(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

export default async function handler(req,res) {
  try {
    res.setHeader('Cache-Control','no-store');
    if (req.method === 'POST') {
      const created = await createProfile(bodyObject(req).preferences || bodyObject(req));      return res.status(201).json({...created,databaseSynced:false,scope:'transport-favourites-only'});
    }
    if (req.method === 'GET') {
      const auth = await authenticateProfile(bearerToken(req));
      if (!auth) return res.status(401).json({error:'Invalid SGBuddy profile token'});
      return res.status(200).json({profile:publicProfile(auth.doc)});
    }
    if (req.method === 'PUT') {
      const auth = await authenticateProfile(bearerToken(req));
      if (!auth) return res.status(401).json({error:'Invalid SGBuddy profile token'});
      const profile = await updateProfile(auth, bodyObject(req).preferences || bodyObject(req));      return res.status(200).json({profile,databaseSynced:false,scope:'transport-favourites-only'});
    }
    res.setHeader('Allow','GET, POST, PUT');
    return res.status(405).json({error:'Method not allowed'});
  } catch (error) {
    console.error('profile api error', error?.message);
    return res.status(500).json({error:'Profile storage is temporarily unavailable'});
  }
}
