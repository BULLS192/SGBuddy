import { SUPPORTED_CURRENCIES, convertReference, getMoneyChangers } from '../lib/money.js';

export default async function handler(req,res){
  try{
    const action=String(req.query?.action||'fx');
    if(action==='fx'){
      const amount=req.query?.amount??1;
      const from=String(req.query?.from||'SGD').toUpperCase();
      const to=String(req.query?.to||'USD').toUpperCase();
      const conversion=await convertReference(amount,from,to);
      return res.status(200).json({ok:true,supportedCurrencies:SUPPORTED_CURRENCIES,...conversion});
    }
    if(action==='changers'){
      const lat=Number(req.query?.lat),lon=Number(req.query?.lon);
      const query=String(req.query?.query||'').trim();
      const limit=Math.max(1,Math.min(Number(req.query?.limit)||12,30));
      const result=await getMoneyChangers({
        lat:Number.isFinite(lat)?lat:undefined,
        lon:Number.isFinite(lon)?lon:undefined,
        query,limit,
      });
      return res.status(200).json({
        ok:true,
        ...result,
        trustLayer:'MAS Financial Institutions Directory / MAS geospatial dataset',
        quoteNotice:'MAS listing data is used for location/licensing context. Live shop buy/sell rates are a separate dataset and are not implied here.',
        updatedAt:new Date().toISOString(),
      });
    }
    return res.status(400).json({error:'Unknown money action.'});
  }catch(error){
    return res.status(502).json({error:error.message||'Money data is temporarily unavailable.'});
  }
}
