/* Curated official SG place data, cached at Vercel's edge. Never serves invented addresses. */
import {buildLibrary} from '../lib/official-library.js';
let memory={at:0,result:null};
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'})}
 const now=Date.now();
 if(memory.result&&now-memory.at<6*3600_000){
  res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');
  return res.status(200).json({...memory.result,cache:'memory'});
 }
 try{
  const result=await buildLibrary();
  if(result.counts.total>0){memory={at:now,result}}
  res.setHeader('Cache-Control',result.counts.total>0?'public, s-maxage=21600, stale-while-revalidate=86400':'public, s-maxage=300');
  return res.status(200).json({...result,cache:'fresh'});
 }catch(error){
  if(memory.result)return res.status(200).json({...memory.result,cache:'stale',warning:'Showing previously fetched official records'});
  return res.status(503).json({error:'Government library unavailable',detail:String(error.message||error).slice(0,100)});
 }
}
