"""Fingerprint public X.509 DER certificates in v2/v3 APK signer records; verification remains apksigner's job."""
import hashlib,struct,sys,zipfile
def cert_sha(path):
 with zipfile.ZipFile(path) as z: cd=z.start_dir
 with open(path,'rb') as fp:
  fp.seek(cd-24); size,magic=struct.unpack('<Q16s',fp.read(24)); assert magic==b'APK Sig Block 42' and 24<size<=cd-8
  fp.seek(cd-size-8); assert struct.unpack('<Q',fp.read(8))[0]==size; pairs=fp.read(size-24)
 def field(b,p=0):
  n=struct.unpack_from('<I',b,p)[0]; e=p+4+n; assert e<=len(b); return b[p+4:e],e
 certs=set(); p=0
 while p<len(pairs):
  n,t=struct.unpack_from('<QI',pairs,p); assert n>=4 and p+8+n<=len(pairs); value=pairs[p+12:p+8+n]; p+=8+n
  if t not in (0x7109871a,0xf05368c0,0x1b93ad61): continue
  seq,end=field(value); assert end==len(value); signer,end=field(seq); assert end==len(seq),'unexpected signer count'; signed,_=field(signer); _,p1=field(signed); chain,_=field(signed,p1); der,_=field(chain); certs.add(hashlib.sha256(der).hexdigest())
 assert len(certs)==1,certs; return certs.pop()
if __name__=='__main__': print(cert_sha(sys.argv[1]))
