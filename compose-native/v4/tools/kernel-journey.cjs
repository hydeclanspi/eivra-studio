'use strict';
// Host acceptance: exercise the exact JS asset Gradle packages, with a public demo or a synthetic local workspace only.
// No network, account, Android UI, disk ledger or private data. Each call receives an explicitly serialized workspace.
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict'), crypto=require('node:crypto');
const asset=path.resolve(__dirname,'../lanes/platform/assets/platform-kernel.js');
require(asset);
function run(op,args=[],book=null,write=false,mode='demo') {
  return JSON.parse(globalThis.eivraPlatform.call(JSON.stringify({mode,bundle:book,op,args,write})));
}
const time='2026-11-18T12:00:00.000Z', id='test-only-host-journey';
const match={id:'test-only-leg',home_team:'Arsenal',away_team:'Chelsea',entries:[{name:'主胜',odds:2}],conf:.6,conf_confirmed:true,mode:'常规-杠杆',tys_home:'M',tys_away:'M',fid:.4,fse_home:.1,fse_away:.1};
const record={id,created_at:time,inputs:10,status:'pending',matches:[match]};
const seed=run('workspace.snapshot'); const rows=seed.investments; assert.ok(Array.isArray(rows));assert.ok(!rows.some(r=>r.id===id));
const owner=run('workspace.snapshot',[],null,false,'owner');assert.equal(owner.investments.length,0);
const f=run('forecast.buildDraft',[[match],time],seed);assert.ok(f.forecastSnapshot);assert.equal(f.forecastSnapshot.generated_at,time);assert.ok(f.expectedRating>=0 && f.expectedRating<=1);
assert.throws(()=>run('workspace.saveInvestment',[{...record,matches:[{...match,conf:null,conf_confirmed:false}]}],seed,true));
const inserted=run('workspace.saveInvestment',[record],seed,true);const stored=inserted.bundle.investments.find(r=>r.id===id);
assert.equal(inserted.value.id,id);assert.equal(inserted.bundle.investments.length,rows.length+1);assert.equal(stored.status,'pending');assert.equal(stored.inputs,10);assert.ok(stored.forecast_snapshot);assert.equal(stored.forecast_snapshot.legs.length,1);
assert.throws(()=>run('workspace.saveInvestment',[record],inserted.bundle,true));
const settled=run('workspace.settleInvestment',[id,{revenues:'20',matches:[{results:'2-1',isCorrect:true,matchRating:'0.6',matchRep:'',postNote:'synthetic QA'}]}],JSON.parse(JSON.stringify(inserted.bundle)),true);
const history=run('workspace.snapshot',[],JSON.parse(JSON.stringify(settled.bundle)));const latest=history.investments.find(r=>r.id===id);
assert.equal(latest.status,'win');assert.equal(Number(latest.revenues),20);assert.equal(latest.matches[0].results,'2-1');assert.equal(latest.matches[0].is_correct,true);
assert.deepEqual(latest.forecast_snapshot,stored.forecast_snapshot);assert.equal(history.investments.length,rows.length+1);
const pending=xs=>xs.filter(r=>r.id!==id && r.status==='pending').map(r=>r.id).sort();assert.deepEqual(pending(history.investments),pending(rows));
const post=run('workspace.importInvestment',[{...record,id:id+'-post',entry_mode:'post',matches:[{...match,id:'post-leg',conf:null,conf_confirmed:false}]}],history,true);
assert.ok(post.bundle.investments.find(r=>r.id===id+'-post').forecast_snapshot==null);
console.log(JSON.stringify({suite:'real-kernel-journey',scope:'Node; original JS asset; serialized bundle, not Android disk or UI',sha256:crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex'),base:rows.length,afterSave:inserted.bundle.investments.length,afterSettle:history.investments.length,status:latest.status,revenue:Number(latest.revenues),score:latest.matches[0].results,otherPending:pending(rows).length,frozenSnapshotUnchanged:true,nullConfRejected:true,duplicateIdRejectedByKernel:true,postImportHasNoForecast:true,emptyOwner:true}));
