// Run with rollup@2.79.2 available to require(), arguments: repoRoot generatedCore output.cjs.
const fs=require('node:fs'),path=require('node:path'),{rollup}=require('rollup');
const [repo,core,out]=process.argv.slice(2).map(x=>path.resolve(x));
const lib=path.join(repo,'eivra-studio/src/lib'), offline=path.join(repo,'Android迁移原生开发/v1/engine');
(async()=>{const b=await rollup({input:path.join(__dirname,'web-parity.mjs'),external:['node:assert/strict'],plugins:[{
 name:'offline-pinned-source', resolveImportMeta(key){if(key==='env')return '({})'}, resolveId(s,p){if(s==='@core')return core;if(s.startsWith('@web/'))return path.join(lib,s.slice(5)+'.js');if(s==='react')return path.join(offline,'platform-react.js');if(s==='@supabase/supabase-js')return path.join(offline,'platform-cloud.js');if(/\/gitSync(\.js)?$/.test(s))return path.join(offline,'platform-git.js');if(s.startsWith('.')&&p){let f=path.resolve(path.dirname(p),s);if(fs.existsSync(f))return f;if(fs.existsSync(f+'.js'))return f+'.js'}}, transform(code,id){if(id.endsWith('.json'))return 'export default '+code}
}],onwarn(w,warn){if(w.code==='UNRESOLVED_IMPORT')throw Error(w.message);if(w.code!=='CIRCULAR_DEPENDENCY')warn(w)}});await b.write({file:out,format:'cjs',inlineDynamicImports:true});await b.close()})().catch(e=>{console.error(e.message);process.exitCode=1})
