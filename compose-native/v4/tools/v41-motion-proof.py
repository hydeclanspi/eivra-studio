"""Measure the actual Android compositor samples, separately in the two regions (text cannot make this pass)."""
from PIL import Image
from pathlib import Path
import sys, hashlib,json
p=Path(sys.argv[1]); g=json.loads((p/'motion.json').read_text()); frames=sorted(p.glob('motion-*.png'));assert len(frames)==31
l,t,r,b=g['tide.wait']; out={}
for name in ('tide.prism','tide.rail'):
    x,y,x2,y2=g[name];parts=[]
    for path in frames:
        with Image.open(path) as im: parts.append(hashlib.sha256(im.crop((x-l,y-t,x2-l,y2-t)).convert('RGB').tobytes()).hexdigest())
    diff=sum(a!=b for a,b in zip(parts,parts[1:]));assert len(set(parts))>=10 and diff>=18,(name,len(set(parts)),diff);out[name]={'uniqueFrames':len(set(parts)),'changedTransitions':diff,'totalFrames':len(parts)}
(p/'motion-proof.json').write_text(json.dumps(out,indent=2));print(out)
