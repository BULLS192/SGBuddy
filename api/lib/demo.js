export const demoNearby = {
  source: 'demo',
  location: { label: 'Tanah Merah area (demo)' },
  stops: [
    { code:'84009', name:'Tanah Merah Stn Exit A', distance:220, services:[
      { no:'14', eta:[3,11,19], load:['SEA','SDA','SEA'] },
      { no:'24', eta:[6,14,23], load:['SEA','SEA','SDA'] },
      { no:'45', eta:[8,18,28], load:['SDA','SEA','SEA'] }
    ]},
    { code:'84019', name:'Tanah Merah Stn Exit B', distance:310, services:[
      { no:'12', eta:[4,13,21], load:['SEA','SEA','SDA'] },
      { no:'38', eta:[7,16,25], load:['SEA','SDA','SEA'] }
    ]}
  ]
};
export const demoTrain = { source:'demo', status:1, summary:'Normal service', disruptions:[] };
export const demoTraffic = { source:'demo', count:2, incidents:[
  { type:'Roadwork', message:'Road works reported on an eastern arterial road.', latitude:1.33, longitude:103.93 },
  { type:'Accident', message:'Minor incident reported; expect a short delay.', latitude:1.31, longitude:103.90 }
]};
export const demoWeather = { source:'demo', summary:'Partly cloudy', area:'Singapore', forecast:'Partly Cloudy' };
