import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

function run(file){ execFileSync(process.execPath,['--check',file],{stdio:'inherit'}); }
execFileSync(process.execPath,['scripts/check-ui.mjs'],{stdio:'inherit'});
run('app-v090.js');
run('app-v100.js');
run('app-v110.js');
run('app-v120.js');
run('app-v130.js');
run('app-v140.js');
run('app-ux-v160.js');
run('app-ux-v170.js');
run('app-food-v180.js');
run('app-apps-v240.js');
run('app-travel-v250.js');
run('lib/discover-geo.js');
run('scripts/publish-facts.mjs');
execFileSync(process.execPath,['scripts/check-discover.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-food-v180.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-library-v200.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-v210.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-v220.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-v230.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-v240.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-v241.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-v250.mjs'],{stdio:'inherit'});
run('scripts/build-services-v210.mjs');
run('scripts/build-supermarkets-v210.mjs');
run('scripts/library-freshness-v210.mjs');
run('scripts/library-quality-v220.mjs');
run('scripts/library-evidence-v230.mjs');
run('scripts/apps-quality-v240.mjs');
run('scripts/build-official-library.mjs');
run('scripts/verify-directory.mjs');
run('scripts/sync-nea-hawkers.mjs');
execFileSync(process.execPath,['scripts/check-buddy.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-ux.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-ux-v170.mjs'],{stdio:'inherit'});
for(const dir of ['api','lib']){
  for(const name of readdirSync(dir).filter(x=>x.endsWith('.js'))) run(dir+'/'+name);
}
for(const file of ['scripts/ingest-fx-reference.mjs','scripts/ingest-money-changers.mjs']) run(file);
console.log('SGBuddy syntax and UI checks passed.');
