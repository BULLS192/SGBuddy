import https from 'node:https';

function rawHttps(url,key){
  return new Promise(resolve=>{
    const req=https.get(url,{headers:{'AccountKey':key,'accept':'application/json','User-Agent':'SGBuddy/0.2'}},r=>{
      let body='';
      r.setEncoding('utf8');
      r.on('data',c=>{if(body.length<1200)body+=c});
      r.on('end',()=>resolve({
        status:r.statusCode,
        statusText:r.statusMessage,
        headers:{contentType:r.headers['content-type']||null,wwwAuthenticate:r.headers['www-authenticate']||null},
        body:body.slice(0,1200)
      }));
    });
    req.on('error',e=>resolve({networkError:e.message}));
  });
}

export default async function handler(req,res){
  const raw=String(process.env.LTA_ACCOUNT_KEY||'');
  const key=raw.trim().replace(/^["']|["']$/g,'');
  const url='https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=84009';
  let fetchResult;
  try{
    const r=await fetch(url,{headers:{AccountKey:key,accept:'application/json','user-agent':'SGBuddy/0.2'},cache:'no-store'});
    fetchResult={status:r.status,statusText:r.statusText,contentType:r.headers.get('content-type'),wwwAuthenticate:r.headers.get('www-authenticate'),body:(await r.text()).slice(0,1200)};
  }catch(error){fetchResult={networkError:error.message}}
  const httpsResult=await rawHttps(url,key);
  res.status(200).json({
    request:{configured:Boolean(raw),rawLength:raw.length,normalizedLength:key.length,trimChanged:raw!==raw.trim(),wrappedInQuotes:/^(["']).*\1$/s.test(raw.trim()),containsNewline:/[\r\n]/.test(raw)},
    fetchResult,
    httpsResult
  });
}
