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
run('scripts/publish-facts.mjs');
execFileSync(process.execPath,['scripts/check-discover.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-buddy.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-ux.mjs'],{stdio:'inherit'});
for(const dir of ['api','lib']){
  for(const name of readdirSync(dir).filter(x=>x.endsWith('.js'))) run(dir+'/'+name);
}
for(const file of ['scripts/ingest-fx-reference.mjs','scripts/ingest-money-changers.mjs']) run(file);
console.log('SGBuddy syntax and UI checks passed.');
