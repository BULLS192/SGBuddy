import assert from 'node:assert/strict';
import {LOCALES} from '../lib/i18n-v280.mjs';
import {WEATHER_DISPLAY_KEYS,WEATHER_DISPLAY,localizedWeatherLabel,localizedPsiLabel} from '../lib/i18n-weather-display-v310.mjs';
assert.equal(WEATHER_DISPLAY_KEYS.length,14);
assert.equal(LOCALES.length,12);
const enWeather='Partly Cloudy (Day) · 59% humidity · 0.0 mm rain';
const enPsi='148 · Unhealthy';
for(const {code} of LOCALES){
 assert.equal(Object.keys(WEATHER_DISPLAY[code]||{}).length,14,code+' incomplete weather pack');
 const w=localizedWeatherLabel(code,enWeather),psi=localizedPsiLabel(code,enPsi);
 assert.ok(w.includes('59%')&&w.includes('0.0 mm'),code+' weather numbers must be preserved: '+w);
 assert.ok(psi.startsWith('148 · '),code+' PSI number must be preserved: '+psi);
 assert.equal(localizedWeatherLabel('en',w),enWeather,code+' weather roundtrip');
 assert.equal(localizedPsiLabel('en',psi),enPsi,code+' PSI roundtrip');
 assert.equal(localizedWeatherLabel(code,'Official advisory: thunderstorm watch'),'Official advisory: thunderstorm watch');
 assert.equal(localizedPsiLabel(code,'Public PSI: 148 · Unhealthy'),'Public PSI: 148 · Unhealthy');
}
console.log('V3.10 WEATHER PASS: 12 locales, enumerated weather and PSI descriptors, exact numeric retention, roundtrip and unknown source protection.');
