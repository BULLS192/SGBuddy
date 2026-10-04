export default function handler(req,res){res.status(200).json({ok:true,service:'singapore-companion',time:new Date().toISOString(),ltaConfigured:Boolean(process.env.LTA_ACCOUNT_KEY)})}
