import {importDataBundle,exportDataBundle} from 'web/localData'
// Only called in a disposable realm. Do not invoke permissive Web replace until all collections pass.
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)
const must=(v,path)=>{if(!v)throw Error('导入预检未通过：'+path)}
const finite=x=>(typeof x==='number'||(typeof x==='string'&&x.trim()!==''))&&Number.isFinite(Number(x))
const ids=(list,identity,label)=>{must(Array.isArray(list),label+' 不是数组');const seen=new Set();for(const [i,v] of list.entries()){must(obj(v),label+'['+i+'] 不是对象');const id=identity(v);must((typeof id==='string'&&id.trim()!=='')||Number.isSafeInteger(id),label+'['+i+'] 缺少标识');must(!seen.has(String(id)),label+' 标识重复：'+id);seen.add(String(id))};return seen}
const exactKeys=(value,allowed)=>Object.keys(value).every(k=>allowed.includes(k))
export function inspect(text,mode) {
 must(typeof text==='string'&&text.length>0&&text.length<=16*1024*1024,'文件为空或超过 16 MiB');const doc=JSON.parse(text);must(obj(doc),'文件根不是对象')
 const native=doc.format==='eivra-native-backup/1'; if(native) must(obj(doc.payload)&&doc.payload.mode===mode&&typeof doc.sha256==='string','备份损坏或工作区不匹配')
 const b=native?doc.payload.bundle:doc;must(obj(b)&&b.version===1&&obj(b.system_config)&&exactKeys(b,['version','exported_at','investments','system_config','team_profiles','access_logs']),'不是完整的 Web v1 bundle 或包含未知顶层数据')
 if(b.exported_at!==undefined) must(Number.isFinite(Date.parse(b.exported_at)),'无效 exported_at')
 const c=b.system_config;for(const [k,lo,hi] of [['initialCapital',0,Infinity],['riskCapRatio',0,1],['defaultOdds',1.0000001,Infinity],['kellyDivisor',1,Infinity],['maxWorstDrawdownAlertPct',5,95]]) if(k in c)must(finite(c[k])&&Number(c[k])>=lo&&Number(c[k])<=hi,'system_config.'+k)
 for(const key of ['capitalInjections','poolSettlements','cycleTitles'])if(key in c)must(Array.isArray(c[key])&&c[key].every(obj),'system_config.'+key)
 const idsIn=ids(b.investments,r=>r.id,'investments');ids(b.team_profiles,r=>typeof r.teamName==='string'?r.teamName.trim().toLowerCase():null,'team_profiles');ids(b.access_logs,r=>r.id,'access_logs');must(b.access_logs.length<=600,'超过原日志保留上限')
 for(const r of b.investments){const p='记录 '+r.id;must(['pending','win','lose'].includes(r.status)&&finite(r.inputs)&&Number(r.inputs)>=0,p+' 状态或金额无效');must(Array.isArray(r.matches)&&r.matches.length>0&&r.matches.every(m=>obj(m)&&typeof m.home_team==='string'&&typeof m.away_team==='string'&&m.home_team.trim()&&m.away_team.trim()),p+' 缺少完整的比赛');for(const t of ['created_at','settled_at','outcome_available_at'])if(r[t]!=null)must(typeof r[t]==='string'&&Number.isFinite(Date.parse(r[t])),p+' '+t);if(r.forecast_snapshot!=null)must(obj(r.forecast_snapshot)&&Array.isArray(r.forecast_snapshot.legs)&&r.forecast_snapshot.legs.length===r.matches.length&&Number.isFinite(Date.parse(r.forecast_snapshot.generated_at)),p+' 冻结快照格式无效');for(const m of r.matches){if(m.entries!=null)must(Array.isArray(m.entries)&&m.entries.every(obj),p+' Entries 格式无效');if(m.is_correct!=null)must(typeof m.is_correct==='boolean',p+' 逐腿命中值无效')}}
 let drafts=null,receipts={};if(native){const p=doc.payload;must(exactKeys(p,['mode','bundle','drafts','receipts','notebook'])&&obj(p.drafts)&&obj(p.receipts),'原生备份版本不兼容');drafts=p.drafts;receipts=p.receipts;for(const [k,d] of Object.entries(drafts))must(k&&obj(d)&&Array.isArray(d.matches)&&!('investments' in d),'草稿损坏');for(const [k,v] of Object.entries(receipts))must(obj(v)&&obj(v.result)&&idsIn.has(String(v.result.id))&&['workspace.saveInvestment','workspace.importInvestment','workspace.settleInvestment'].some(op=>k===op+':'+v.result.id)&&/^[a-f0-9]{64}$/.test(v.hash),'重试回执损坏')}
 must(importDataBundle(b,'replace')===true,'原 localData 拒绝导入');const normalized=exportDataBundle();must(normalized.investments.length===idsIn.size&&normalized.team_profiles.length===b.team_profiles.length&&normalized.access_logs.length===b.access_logs.length,'原函数会丢弃或补入记录，拒绝替换')
 // Preserve historical fields, null/missing values and receipts exactly; never call forecast on imported history.
 return {native,bundle:b,drafts,receipts,notebook:native?doc.payload.notebook??{}:{}}
}
