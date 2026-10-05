import fs from 'node:fs';

const fail = message => { console.error('UI CHECK FAILED:', message); process.exitCode = 1; };
const html = fs.readFileSync('index.html','utf8');
const scriptMatch = html.match(/<script type="module" src="([^"]+)"/);
if(!scriptMatch) fail('No module client script found in index.html');
const scriptPath = scriptMatch?.[1]?.replace(/^\//,'') || 'app.js';
if(!fs.existsSync(scriptPath)) fail(`Client script ${scriptPath} does not exist`);
const js = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath,'utf8') : '';

try { new Function(js); } catch (error) { fail(`Client JavaScript syntax error: ${error.message}`); }

const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
for(const match of js.matchAll(/\$\('#([^']+)'\)\.addEventListener/g)){
  if(!ids.has(match[1])) fail(`Listener target #${match[1]} is missing from index.html`);
}
for(const match of html.matchAll(/href="#([^"]+)"[^>]*data-nav-target=/g)){
  if(!ids.has(match[1])) fail(`Navigation target #${match[1]} is missing`);
}
if(/(?<!\$)\$\([^\n;]+\)\.forEach/.test(js)) fail('Single-element $() selector is being used with .forEach()');
if(!/\$\$\('\.bottom-nav \[data-nav-target\]'\)\.forEach/.test(js)) fail('Bottom navigation is not initialized with the multi-element selector');
for(const required of ['dataCoreDiagnostics','locationSheet','planTrip','openGoogleTrip','swapTrip','journeyStatus','journeyResults','modeButton']){
  if(!ids.has(required)) fail(`Required control #${required} is missing`);
}
if(!process.exitCode) console.log(`UI checks passed for ${scriptPath} (${ids.size} ids)`);

if(!fs.existsSync('api/journey.js')) fail('Native journey API is missing');
if(!fs.existsSync('lib/journey.js')) fail('Native journey engine is missing');
