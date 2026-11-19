"""Attest separate moving regions on actual Android framebuffers, plus freeze after OS reduce-motion."""
from PIL import Image, ImageChops
from pathlib import Path
import hashlib, json, sys
p=Path(sys.argv[1]);g=json.loads((p/'motion.json').read_text()); frames=sorted(p.glob('motion-*.png'));assert len(frames)==len(g['wallMs'])>=14
l,t,r,b=g['tide.wait'];out={}
for name in ('tide.prism','tide.rail'):
 x,y,x2,y2=g[name];assert x>=l and y>=t and x2<=r+1 and y2<=b+1 and x2>x and y2>y,(name,g)
 roi=(x-l,y-t,x2-l,y2-t);parts=[]
 for f in frames:
  with Image.open(f) as im:parts.append(hashlib.sha256(im.crop(roi).convert('RGB').tobytes()).hexdigest())
 diff=sum(a!=b for a,b in zip(parts,parts[1:]));assert len(set(parts))>=8 and diff>=min(12,len(frames)-2),(name,len(set(parts)),diff)
 # Native screenshot with reduced-motion enabled must not report a false positive.
 a=Image.open(p/'reduce-a.png').convert('RGB').crop(roi);b2=Image.open(p/'reduce-b.png').convert('RGB').crop(roi);assert ImageChops.difference(a,b2).getbbox() is None,('OS still animating',name)
 out[name]={'uniqueFrames':len(set(parts)),'changedTransitions':diff,'totalFrames':len(parts),'reducedMotionStatic':True}
(p/'motion-proof.json').write_text(json.dumps(out,indent=2));print(out)
