// Run on the JS extracted from the application APK, NOT a test or source bundle.
// No disk ledger, personal workspace, web session, or network transport.
const fs = require('fs'), vm = require('vm'), assert = require('assert').strict, crypto = require('crypto');
const bytes = fs.readFileSync(process.argv[2]);
const src = new vm.Script(bytes.toString('utf8'));
function call(op, args, bundle, write = false) {
  const realm = vm.createContext({console}); src.runInContext(realm);
  return JSON.parse(realm.eivraPlatform.call(JSON.stringify({mode:'demo',op,args,bundle,write})));
}
const empty = {investments:[],team_profiles:[],access_logs:[],system_config:{initialCapital:700}};
const hash = crypto.createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--old-control')) {
  assert.throws(()=>call('portfolio.candidates',[],empty),/Unregistered operation: portfolio\.candidates/);
  console.log(JSON.stringify({sha256:hash,control:'Unregistered operation: portfolio.candidates'}));
} else {
  const m={id:'i02-a',home_team:'利兹联',away_team:'拜仁',conf:.64,conf_confirmed:true,mode:'常规-杠杆',tys_home:'H',tys_away:'M',fid:.4,fse_home:.2,fse_away:.1,entries:[{name:'主胜',odds:2.4,origin_note:'I02'}]};
  const other={...m,id:'i02-b',home_team:'Arsenal',away_team:'Chelsea',conf:.57,entries:[{name:'主胜',odds:2.2},{name:'平局',odds:3.4}]};
  const b=call('workspace.saveInvestment',[{id:'i02',inputs:30,matches:[m,other]}],empty,true).bundle;
  const rows=call('portfolio.candidates',[],b);assert.equal(rows.length,2);
  assert(rows.every(r=>r.key&&!r.inputIssue&&r.draftMatch&&!r.draftMatch.conf_confirmed));
  const keys=rows.map(r=>r.key);assert.equal(new Set(keys).size,2);
  function generate(options){const g=call('portfolio.generate',[{keys,...options}],b);return {status:g.status,qualified:g.qualifiedCombos,count:g.recommendations?.length,reason:g.reason};}
  const initial=generate({});assert.equal(initial.status,'ready');assert(initial.count>0);
  const strict=generate({qualityFilter:{minWinRate:100},comboStrategy:'thresholdStrict'});
  assert(strict.status==='infeasible'&&strict.reason || strict.status==='ready'&&strict.count>0&&strict.qualified<initial.qualified);
  console.log(JSON.stringify({sha256:hash,keys,initial,strict,pendingInFixture:b.investments.filter(r=>r.status==='pending').length}));
}
