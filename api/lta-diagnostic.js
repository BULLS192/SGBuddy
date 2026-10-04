export default async function handler(req,res){
  const raw=String(process.env.LTA_ACCOUNT_KEY||'');
  const key=raw.trim().replace(/^["']|["']$/g,'');
  const url='https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=84009';
  try{
    const r=await fetch(url,{
      headers:{
        AccountKey:key,
        accept:'application/json',
        'user-agent':'SGBuddy/0.2 (+https://sgbuddy.vercel.app)'
      },
      cache:'no-store'
    });
    const body=(await r.text()).slice(0,1200);
    res.status(200).json({
      request:{configured:Boolean(raw),rawLength:raw.length,normalizedLength:key.length,trimChanged:raw!==raw.trim(),wrappedInQuotes:/^(["']).*\1$/s.test(raw.trim()),containsNewline:/[\r\n]/.test(raw)},
      upstream:{status:r.status,statusText:r.statusText,contentType:r.headers.get('content-type'),wwwAuthenticate:r.headers.get('www-authenticate'),body}
    });
  }catch(error){res.status(200).json({request:{configured:Boolean(raw),rawLength:raw.length,normalizedLength:key.length},networkError:error.message});}
}
