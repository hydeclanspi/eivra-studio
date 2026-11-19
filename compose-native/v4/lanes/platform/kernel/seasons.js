import {getCyclePeriods} from 'web/warReport'
import {getReservoirState} from 'web/analytics'
import {settlePool} from 'web/localData'
export function seasonPreview(){
 const idx=getCyclePeriods(), live=idx.periods.find(p=>p.id===idx.currentId && p.isOpen), pool=getReservoirState();if(!live)throw Error('未找到进行中的赛季，请重新读取')
 for(const key of ['cycleProfit','cycleBaseCapital','poolBalance','inFlightCommitment'])if(!Number.isFinite(pool[key]))throw Error('资金周期的数值不完整，不能结转')
 return {from:live.id,fromName:live.name,nextOrdinal:live.ordinal+1,poolBefore:pool.poolBalance,cycleBase:pool.cycleBaseCapital,realizedProfit:pool.cycleProfit,inFlight:pool.inFlightCommitment,openedAt:live.openedBy?.created_at||null}
}
export function seasonCreate(spec){
 if(!spec||spec.confirmClose!==true)throw Error('需明确确认结束当前周期')
 if(typeof spec.title!=='string'||spec.title!==spec.title.trim()||spec.title.length>24||/[\u0000-\u001f\u007f]/.test(spec.title))throw Error('赛季标题须为不超过 24 个字符的单行文字')
 const a=spec.allocation;if(typeof a!=='string'||!/^\d{1,10}(?:\.\d{1,2})?$/.test(a))throw Error('启动资金须为非负金额，最多两位小数')
 const before=seasonPreview();if(spec.from!==before.from)throw Error('当前赛季已变化，请重新确认');if(before.openedAt&&Date.now()<=Date.parse(before.openedAt)+1)throw Error('设备时间不晚于上一赛季分界，无法开始新周期')
 const result=settlePool({type:before.realizedProfit>=0?'take_profit':'stop_loss',realizedProfit:before.realizedProfit,poolBefore:before.poolBefore,cycleBase:before.cycleBase,newCapital:Number(a),nextCycleName:spec.title})
 if(!result?.id)throw Error('没有取得结转记录');const id='cycle_'+result.id,after=getCyclePeriods();if(after.currentId!==id||!after.periods.some(p=>p.id===id&&p.isOpen&&p.ordinal===before.nextOrdinal))throw Error('赛季索引未完成更新，未保存');return {id,previousId:before.from,ordinal:before.nextOrdinal}
}
