import { hasLtaKey } from '../lib/lta.js';
import { planJourney } from '../lib/journey.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  if(!hasLtaKey()) return res.status(503).json({error:'LTA data is not configured',code:'NO_LTA_KEY'});

  const to=String(req.query.to||'').trim();
  const from=String(req.query.from||'').trim();
  const originLat=Number(req.query.lat);
  const originLon=Number(req.query.lon);

  if(!to) return res.status(400).json({error:'Destination is required',code:'DESTINATION_REQUIRED'});

  try{
    const result=await planJourney({
      from,
      to,
      originLat:Number.isFinite(originLat)?originLat:undefined,
      originLon:Number.isFinite(originLon)?originLon:undefined,
    });
    if(!result.ok){
      const status=result.code==='UNRESOLVED_DESTINATION'?422:400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  }catch(error){
    return res.status(500).json({error:error.message||'Journey planning failed',code:'JOURNEY_ERROR'});
  }
}
