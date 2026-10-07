import { catalogStats, hasCatalogDatabase } from '../lib/catalog-db.js';
import { hasProfileDatabaseSync } from '../lib/profile-db.js';

export default async function handler(req,res){
  let catalog=null,catalogError=null;
  if(hasCatalogDatabase()){
    try{catalog=await catalogStats()}catch(error){catalogError=error.message}
  }
  res.status(200).json({
    ok:true,
    service:'sgbuddy',
    version:'0.9.2-dev',
    time:new Date().toISOString(),
    ltaConfigured:Boolean(process.env.LTA_ACCOUNT_KEY),
    database:{
      configured:hasCatalogDatabase(),
      connected:Boolean(catalog),
      catalog,
      error:catalogError,
    },
    features:{
      bus:true,railRealtime:true,journeyHandoff:true,savedPlaces:true,cloudProfiles:true,
      installablePwa:true,locationOnboarding:true,favouriteRail:true,busServicePreferences:true,
      nextUp:true,bottomNavigation:true,dataCoreDiagnostics:true,versionedClient:true,
      navRegressionFixed:true,activeNavHighlight:true,wave31Qa:true,favouriteManagement:true,
      nativeJourneyPlanner:true,directBusRouting:true,railTransferRouting:true,mixedJourneyRouting:true,
      weatherAwareRouting:true,arriveByPlanning:true,visibleClientVersion:true,journeyRouteMap:true,
      destinationIntelligence:true,recentDestinations:true,tripIntelligence:true,weatherRiskAdvisor:true,
      supabaseCatalog:true,personaFoundation:true,adaptivePersonaHome:true,profileDatabaseSync:hasProfileDatabaseSync(),supabaseAuth:true,crossDeviceAccounts:true,passwordRecovery:true,accountProfileSync:true,expandedEnvironment:true,airQuality:true,referenceFx:true,licensedMoneyChangers:true,featuredPlaces:true,travelLivingNavigation:true,
      oneMapGeocoding:Boolean(process.env.ONEMAP_TOKEN||(process.env.ONEMAP_API_EMAIL&&process.env.ONEMAP_API_PASSWORD))
    }
  })
}
