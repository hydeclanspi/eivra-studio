const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert').strict
const {bundle,lane}=require('../kernel/build.cjs')
async function main(){
 const oracleFile=path.join(lane,'.cache/web-oracle.iife');await bundle(path.join(__dirname,'web-oracle.js'),oracleFile)
 const clock=fs.readFileSync(path.join(__dirname,'fixed-clock.js'),'utf8')+'\n'; const context={console};vm.runInNewContext(clock+fs.readFileSync(oracleFile,'utf8'),context)
 const src=clock+fs.readFileSync(path.join(lane,'assets/platform-kernel.js'),'utf8')
 const call=(op,args,bundle,write=false,mode='owner')=>{const realm={console};vm.runInNewContext(src,realm);return JSON.parse(realm.eivraPlatform.call(JSON.stringify({mode,op,args,bundle,write})))}
 const stamp='2026-11-09T12:34:56.789Z', text='利兹联 win 拜仁 2.4 30块', bundleIn={version:1,investments:[{id:'reserved',inputs:101,created_at:'2026-11-01T00:00:00.000Z',status:'pending',matches:[]}],team_profiles:[],access_logs:[],system_config:{initialCapital:700}}
 const parsed=call('naturalInputParser.parseNaturalInput',[text],bundleIn),p=parsed.matches[0]
 // Confirmation is an explicit synthetic user decision, not a parser default.
 const m={id:'leg-a',home_team:p.homeTeam,away_team:p.awayTeam,conf:0.64,mode:'常规-杠杆',tys_home:'H',tys_away:'M',fid:0.4,fse_home:0.2,fse_away:0.1,entries:p.entries.map(e=>({name:e.name,odds:Number(e.odds)}))}
 const other={...m,id:'leg-b',home_team:'Arsenal',away_team:'Chelsea',conf:0.57,entries:[{name:'主胜',odds:2.2},{name:'平局',odds:3.4}]}
 const cases=[];for(const matches of [[m],[m,other]]) {
   const expected=JSON.parse(context.oracle(bundleIn,text,matches,stamp));assert.deepStrictEqual(parsed,expected.parsed)
   let actual=call('forecast.buildDraft',[matches,stamp],bundleIn);assert.deepStrictEqual(actual,expected.forecast)
   cases.push({bundle:bundleIn,text,matches,stamp,expected});console.log('V8 Web parity:',matches.length,'legs,',actual.forecastSnapshot.states.length,'states, rating',actual.expectedRating,'available',actual.poolBalance,'stake',actual.recommendedInvest)
 }
 const saved=call('workspace.saveInvestment',[{id:'a',inputs:30,matches:[m,other]}],bundleIn,true);assert.equal(saved.bundle.investments.find(r=>r.id==='a').forecast_snapshot.legs.length,2)
 const form={revenues:0,matches:[{isCorrect:true,results:'2-1',matchRep:0},{isCorrect:false,results:'1-2',matchRating:0.3}]}
 const settled=call('workspace.settleInvestment',['a',form],saved.bundle,true);assert.equal(settled.bundle.investments.find(r=>r.id==='a').status,'lose');assert.equal(settled.bundle.investments.find(r=>r.id==='reserved').status,'pending')
 assert.throws(()=>call('forecast.buildDraft',[[{...m,conf:null}],stamp],bundleIn));assert.throws(()=>call('workspace.saveInvestment',[],bundleIn));
 fs.writeFileSync(path.join(lane,'.cache/web-goldens.json'),JSON.stringify(cases))
}
main().catch(e=>{console.error(e);process.exitCode=1})
