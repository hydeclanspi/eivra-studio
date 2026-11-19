// Only these four Web research stores cross the native storage boundary, separately from the Git ledger bundle.
import {nativeStore} from 'v1/shims'
import {RESEARCH_STORAGE_KEY,getResearchStore,createResearchExperiment,saveResearchConclusion,getResearchDataCoverage} from 'web/quantResearch'
import {EVIDENCE_KEY,getEvidenceStore,evidenceCoverage,importEvidence} from 'web/quantEvidence'
import {FORWARD_KEY,getForwardStore,createObservationPlan,runForwardTask} from 'web/quantForward'
import {getResultsIndex,resultsCacheStatus,importResultsCsv} from 'web/matchResults'
const keys=[RESEARCH_STORAGE_KEY,EVIDENCE_KEY,FORWARD_KEY,'eivra.results_cache.v1']
export function loadNotes(input={}) { if(!input || Array.isArray(input)||typeof input!=='object'||Object.keys(input).some(k=>!keys.includes(k))) throw Error('研究存储格式不兼容'); for(const k of Object.keys(input)){if(!input[k]||typeof input[k]!=='object')throw Error('研究存储损坏');nativeStore.setItem(k,JSON.stringify(input[k]))} }
export function notes() {return Object.fromEntries(keys.filter(k=>nativeStore.getItem(k)!=null).map(k=>[k,JSON.parse(nativeStore.getItem(k))]))}
function home(){const r=getResearchStore(),f=getForwardStore(),c=getResearchDataCoverage(getResultsIndex());return {projects:r.projects,versions:r.versions.map(v=>({id:v.id,name:v.spec?.name,number:v.number,projectId:v.projectId})),runs:r.runs.map(v=>({id:v.id,kind:v.kind,projectId:v.projectId,versionId:v.versionId,createdAt:v.createdAt,conclusion:v.conclusion})),plans:f.plans.length,coverage:c,evidence:evidenceCoverage(getEvidenceStore()),results:resultsCacheStatus()}}
export const noteReads={'quant.home':home,'quant.archive':getResearchStore,'quant.evidenceExport':getEvidenceStore,'quant.validate':()=>{getResearchStore();getForwardStore();getEvidenceStore();getResultsIndex();return true}}
export const noteWrites={'quantResearch.createResearchExperiment':createResearchExperiment,'quantResearch.saveResearchConclusion':saveResearchConclusion,'quantForward.createObservationPlan':createObservationPlan,'quantForward.runForwardTask':runForwardTask,'quant.importEvidence':payload=>{const r=importEvidence(payload);return evidenceCoverage(r)},'quant.importResults':text=>{const r=importResultsCsv(text);if(!r.ok)throw Error('赛果 CSV 未导入：'+r.reason);return r}}
