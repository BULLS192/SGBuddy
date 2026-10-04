import QRCode from 'qrcode';
import { authenticateProfile, bearerToken } from './lib/profile-store.js';

function bodyObject(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

export default async function handler(req,res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try {
    const token = bearerToken(req);
    const auth = await authenticateProfile(token);
    if (!auth) return res.status(401).json({error:'Invalid SGBuddy profile token'});
    const origin = String(bodyObject(req).origin || 'https://sgbuddy.vercel.app').replace(/\/$/,'');
    const link = `${origin}/#profile=${encodeURIComponent(token)}`;
    const svg = await QRCode.toString(link, {
      type:'svg',
      margin:1,
      width:360,
      errorCorrectionLevel:'M',
    });
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Type','image/svg+xml; charset=utf-8');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(200).send(svg);
  } catch (error) {
    console.error('profile qr error', error?.message);
    return res.status(500).json({error:'Could not generate device-link QR'});
  }
}
