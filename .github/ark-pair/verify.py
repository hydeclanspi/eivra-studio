from pathlib import Path
import hashlib,json,re,subprocess,sys,zipfile,xml.etree.ElementTree as ET
s=Path(sys.argv[1]); n=Path('compose-and-ark-native'); out=Path('paired'); apk=out/'Eivra-Studio-v4.1-Ark-icon.apk'; old=n/'archive/android-v4.1/Eivra-Studio-v4.1-7047c3b.apk'; h=n/'Eivra-Studio-Ark Native.hap'
def sha(b): return hashlib.sha256(b).hexdigest()
def run(*args): return subprocess.check_output([str(x) for x in args],text=True)
from cert_digest import cert_sha
def cert(p):
 print(run(s/'apksigner','verify','--verbose','--print-certs',p),flush=True); return cert_sha(p)
assert sha(h.read_bytes())=='c45cacbb297db6ed53268ce1e4e2d20516419da694ff92ee3c271b7910d12c42'
assert sha(old.read_bytes())=='c1056a0850b76602a13c964603b408980eb7e371b7d1cf17e49253a553d815e0'
with zipfile.ZipFile(h) as z:
 meta=json.loads(z.read('module.json')); main=next(a for a in meta['module']['abilities'] if a['name']==meta['module']['mainElement']); assert meta['app']['icon']==main['icon']=='$media:app_icon'; assert b'entry/resources/base/media/app_icon.png' in z.read('resources.index'); art=z.read('resources/base/media/app_icon.png')
assert sha(art)=='9e05003b4cc1d51e662e3f654c3093e0442280212f9849c360d746f05c11e956'
badging=run(s/'aapt','dump','badging',apk); xml=run(s/'aapt','dump','xmltree',apk,'AndroidManifest.xml'); print('Compiled application attributes:',*[x.strip() for x in xml.splitlines() if 'android:icon(' in x or 'roundIcon' in x],flush=True); appicon=re.search(r'android:icon(?:\([^)]*\))?=@(0x[0-9a-fA-F]+)',xml).group(1); roundicon=re.search(r'android:roundIcon(?:\([^)]*\))?=@(0x[0-9a-fA-F]+)',xml).group(1); assert appicon==roundicon
pngs=set(re.findall(r"^application-icon-\d+:'([^']+)'",badging,re.M)); app=re.search(r"^application:.*?\bicon='([^']+)'",badging,re.M); pngs.update([app.group(1)] if app else []); assert pngs,badging[:2500]
with zipfile.ZipFile(apk) as z,zipfile.ZipFile(old) as prior:
 for p in pngs: assert z.read(p)==art,(p,sha(z.read(p)),len(z.read(p)))
 key='assets/platform-kernel.js'; kernel=z.read(key); assert kernel==prior.read(key)
prev=cert(old); now=cert(apk); pkg=re.search(r"^package: name='([^']+)'",badging,re.M).group(1); version=re.search(r"^package: .*versionCode='(\d+)'",badging,re.M).group(1); assert version=='41'; expected='com.eivra.studio.v2.v41'+('' if prev==now else '.arkicon'); assert pkg==expected,(pkg,expected); assert re.search(r"^launchable-activity: name='com.eivra.studio.v2.MainActivity'",badging,re.M)
suites=[ET.parse(f).getroot() for f in (n/'v4/app/build/test-results/testDebugUnitTest').glob('TEST-*.xml')]; counts={k:sum(int(x.attrib.get(k,0)) for x in suites) for k in ['tests','skipped','failures','errors']}; assert counts['tests']>0 and counts['failures']==counts['errors']==0,counts
facts=dict(package=pkg,versionCode=int(version),cert=now,oldCert=prev,sameSigner=prev==now,apk=sha(apk.read_bytes()),apkSize=apk.stat().st_size,hap=sha(h.read_bytes()),hapSize=h.stat().st_size,icon=sha(art),iconSize=len(art),packagedIcons=sorted(pngs),manifestResource=appicon,kernel=sha(kernel),jvm=counts); (out/'facts.json').write_text(json.dumps(facts,indent=2)+'\n'); print(json.dumps(facts,indent=2))
