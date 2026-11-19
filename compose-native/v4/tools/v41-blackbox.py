"""Only runs on an opted-in, disposable emulator, with the immutable previously built APK.
Observe, then tap once per action. Screenshots are streamed to the host before any subsequent action.
No fake clock, no application test hooks, no live account, no forced data changes or JS injection.
"""
from pathlib import Path
import subprocess as sp,json,re,sys,time,hashlib,io,xml.etree.ElementTree as ET,traceback
from PIL import Image,ImageChops
pkg='com.eivra.studio.v2.v41'; sz=sys.argv[1]; W,H=map(int,sz.split('x'));P=Path('blackbox')/sz;P.mkdir(parents=True,exist_ok=True)
def adb(*cmd,timeout=14,check=True):return sp.run(['adb',*map(str,cmd)],stdout=sp.PIPE,stderr=sp.PIPE,check=check,timeout=timeout).stdout
def shell(*a,timeout=14):return adb('shell',*a,timeout=timeout).decode('utf-8','replace').strip()
def save(n,d): (P/n).write_bytes(d)
def say(msg):print(msg,flush=True);open(P/'trace.txt','a').write(msg+'\n')
def dump(n=None):
 for attempt in range(4):
  f='/sdcard/qa41-observe-'+str(time.monotonic_ns())+'.xml';adb('shell','uiautomator','dump',f,timeout=18,check=False);data=adb('exec-out','cat',f,check=False);adb('shell','rm','-f',f,check=False);a=data.find(b'<hierarchy')
  if a>=0:
   try:root=ET.fromstring(data[a:]);break
   except ET.ParseError:pass
  time.sleep(.3)
 else:raise RuntimeError('Android returned no usable accessibility hierarchy')
 save('last-window.xml',data)
 if n:save(n+'.xml',data)
 return [e.attrib for e in root.iter('node') if e.attrib.get('package')==pkg]
def rect(q):return tuple(map(int,re.findall(r'-?\d+',q['bounds'])))
def tag(e,k):return e.get('resource-id','') in (k,pkg+':id/'+k)
def text(e,k):return e.get('text','')==k or e.get('content-desc','')==k
def pick(items,pred):
 for e in items:
  if pred(e):
   x,y,r,b=rect(e)
   if r>x and b>y:return e
 return None
def want(pred,desc,seconds=20):
 end=time.monotonic()+seconds
 while time.monotonic()<end:
  found=pick(dump(),pred)
  if found:return found
  time.sleep(.15)
 raise RuntimeError('Not found on screen: '+desc)
def t(k,tout=20):
 labels={'go-Seasons':'Seasons','go-Portfolio':'Portfolio','nav-Dashboard':'Dashboard','nav-Portfolio':'Portfolio','season.confirm':'结束当前并创建','season.new':'＋  新建'}
 if k in ['season.title','season.capital']:
  end=time.monotonic()+tout
  while time.monotonic()<end:
   rows=dump(); exact=pick(rows,lambda e:tag(e,k));fields=sorted([e for e in rows if e.get('class','').endswith('EditText')],key=lambda e:rect(e)[1]);
   if exact:return exact
   if len(fields)==2:return fields[int(k=='season.capital')]
   time.sleep(.2)
  raise RuntimeError('missing form field '+k)
 return want(lambda e:tag(e,k) or k in labels and text(e,labels[k]) or k=='season.new' and e.get('content-desc')=='新建赛季',k,tout)
def press(e):
 l,u,r,b=rect(e);assert e.get('enabled')=='true',e;adb('shell','input','tap',(l+r)//2,(u+b)//2);time.sleep(.28)
def snap(name):
 data=adb('exec-out','screencap','-p');im=Image.open(io.BytesIO(data)).convert('RGB');assert im.size==(W,H),(name,im.size);save(name+'.png',data);return im

def navigate(route):
 if W<600:
  press(t('menu'));a=None
  for i in range(5):
   a=pick(dump(),lambda e:tag(e,'go-'+route) or text(e,route));
   if a:break
   adb('shell','input','swipe',W//2,H*4//5,W//2,H*2//5,350)
  assert a,'menu route '+route;press(a)
 elif route=='Seasons':press(t('nav-Dashboard'));press(t('go-Seasons'))
 else:press(t('nav-'+route))

def start():
 cmd=shell('am','start','-S','-W','-n',pkg+'/com.eivra.studio.v2.MainActivity',timeout=24);assert 'Status: ok' in cmd,cmd;t('quick.heading',40)
 if W<600:
  press(t('menu'));assert want(lambda e:text(e,'demo · preview'),'disposable demo in navigation sheet');shell('input','keyevent','BACK');t('quick.heading')
 else:assert want(lambda e:text(e,'demo · preview'),'disposable demo in header')

def live():
 start();navigate('Portfolio');want(lambda e:'已勾选' in e.get('text',''),'actual candidates',35)
 a=None
 for i in range(7):
  a=pick(dump(),lambda e:tag(e,'generate') and e['enabled']=='true');
  if a and rect(a)[3]-rect(a)[1]>=24:break
  a=None;adb('shell','input','swipe',W//4,H*4//5,W//4,H*2//5,300);time.sleep(.22)
 assert a,'Generate not visible';shell('settings','put','global','animator_duration_scale',1);time.sleep(.3);say('tapping real Generate once');press(a);want(lambda e:'正在按当前选择求解' in (e.get('text','')+e.get('content-desc','')),'actual Portfolio solve, not catalog');nodes=dump('solve');q=pick(nodes,lambda e:tag(e,'tide.wait'));assert q,'wait not in accessibility tree';l,t0,r,b=rect(q);w=r-l;hh=b-t0;assert w>100 and hh>=32,(l,t0,r,b)
 c=(b+t0)//2;glyph=(0,c-t0-19,42,c-t0+19);rail=(w-max(105,min(220,round(w*.28))),c-t0-3,w,c-t0+4) if w>=408 else (52,c-t0+4,w,hh);snap('solve-live');frames=[];times=[];st=time.monotonic();
 while (len(frames)<16 or time.monotonic()-st<6.4) and len(frames)<46:
  data=adb('exec-out','screencap','-p');im=Image.open(io.BytesIO(data)).convert('RGB');im=im.crop((l,t0,r,b));times.append(round((time.monotonic()-st)*1000));im.save(P/('motion-%02d.png'%len(frames)));frames.append(im);time.sleep(.11)
 want(lambda e:'正在按当前选择求解' in (e.get('text','')+e.get('content-desc','')),'same solve still running',6)
 proof={}
 for k,rr in [('prism',glyph),('rail',rail)]:
  hashes=[hashlib.sha256(im.crop(rr).tobytes()).hexdigest() for im in frames];unique=len(set(hashes));changed=sum(a!=b for a,b in zip(hashes,hashes[1:]));proof[k]={'rect':rr,'unique':unique,'transitions':changed}; assert unique>=8 and changed>=10,(k,proof)
 shell('settings','put','global','animator_duration_scale',0);time.sleep(.8);frozen1=snap('reduced-a').crop((l,t0,r,b));time.sleep(.45);frozen2=snap('reduced-b').crop((l,t0,r,b));want(lambda e:'正在按当前选择求解' in (e.get('text','')+e.get('content-desc','')),'still running in reduced-motion mode',5)
 for k,rr in [('prism',glyph),('rail',rail)]:assert ImageChops.difference(frozen1.crop(rr),frozen2.crop(rr)).getbbox() is None,k;proof[k]['reduced_static']=True
 meta={'frameCount':len(frames),'wall_ms':times,'row':[l,t0,r,b],'proof':proof};(P/'motion.json').write_text(json.dumps(meta));say('motion '+str(meta['proof']))

def bookbytes():
 p='no_backup/eivra-v2-workspaces/demo.json';test=sp.run(['adb','shell','run-as',pkg,'test','-f',p],timeout=7).returncode
 if test==1:return None
 assert test==0;return adb('exec-out','run-as',pkg,'cat',p)
def hide_keyboard():
 s=shell('dumpsys','input_method');
 if re.search(r'mInputShown\s*=\s*true|mIsInputViewShown\s*=\s*true',s):shell('input','keyevent','BACK');time.sleep(.3)
def season():
 shell('settings','put','global','animator_duration_scale',0);start();prevpid=shell('pidof',pkg);navigate('Seasons');button=t('season.new',50);nodes=dump('rail-before');selected=[e['text'] for e in nodes if e.get('text','').startswith('S') and re.match(r'S\d+( |$)',e['text'])];assert selected;before=bookbytes();snap('season-rail');say('visible seasons '+str(selected));press(button);t('season.confirm');want(lambda e:text(e,'取消'),'cancel');snap('season-dialog');press(want(lambda e:text(e,'取消'),'cancel'));t('season.new');assert before==bookbytes(),'Cancel touched disk';say('cancel left ledger untouched')
 press(t('season.new'));title=t('season.title');press(title);shell('input','text','QA-27-28');hide_keyboard();capital=t('season.capital');press(capital);shell('input','text','250.75');hide_keyboard();nodes=dump('before-confirm');assert any('QA-27-28' in e.get('text','') for e in nodes) and any('250.75' in e.get('text','') for e in nodes);confirm=t('season.confirm');snap('season-confirm');say('tap Confirm once');press(confirm);new=want(lambda e:bool(re.search(r'S\d+ QA-27-28',e.get('text',''))),'created season visible',50);snap('season-created');dump('created');after=bookbytes();assert after;book=json.loads(after);bundle=book['bundle'];cfg=bundle['system_config'];sett=cfg['poolSettlements'][-1];id='cycle_'+sett['id'];assert sett['newCapital']==250.75 and any(row['id']==id and row['title']=='QA-27-28' for row in cfg['cycleTitles']);assert any(row['id']==sett['linkedInjectionId'] and row['amount']==250.75 for row in cfg['capitalInjections']);
 if before is not None:assert json.loads(before)['bundle']['investments']==bundle['investments']
 shell('am','force-stop',pkg);start();newpid=shell('pidof',pkg);assert prevpid!=newpid;navigate('Seasons');same=want(lambda e:text(e,new['text']),'same season after force-stop',45);snap('season-cold');nodes=dump('cold');aftercold=bookbytes();assert after==aftercold;assert any(e.get('selected')=='true' and (e.get('text')==new['text'] or rect(e)[0]<=rect(same)[0]<=rect(e)[2] and rect(e)[1]<=rect(same)[1]<=rect(e)[3]) for e in nodes),'new period not selected';proof={'from':selected,'created':new['text'],'id':id,'oldPid':prevpid,'newPid':newpid,'ledgerSHA256':hashlib.sha256(after).hexdigest(),'cancelNoWrite':True,'allocated':sett['newCapital'],'pending':sum(i.get('status')=='pending' for i in bundle['investments']),'rows':len(bundle['investments'])};(P/'season.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2));say('season '+json.dumps(proof,ensure_ascii=False))

assert sz in ('390x844','1280x800')
assert shell('getprop','ro.kernel.qemu')=='1' and adb('get-serialno').decode().strip().startswith('emulator-');shell('wm','size',sz);shell('wm','density',160);shell('settings','put','system','font_scale',1);shell('wm','dismiss-keyguard');install=Path('pair/debug/app-debug.apk');assert hashlib.sha256(install.read_bytes()).hexdigest()=='c1056a0850b76602a13c964603b408980eb7e371b7d1cf17e49253a553d815e0';assert b'Success' in adb('install','-r',install,timeout=50);info=shell('getprop','ro.build.version.sdk');say('API='+info+'; '+sz+'; tested immutable APK '+hashlib.sha256(install.read_bytes()).hexdigest());errors=[]
for name,f in [('motion',live),('season',season)]:
 try:f()
 except Exception as ex:
  errors.append((name,repr(ex)));say('FAIL '+name+' '+repr(ex));(P/(name+'-error.txt')).write_text(traceback.format_exc());
  try:snap(name+'-failure');dump(name+'-failure')
  except Exception:pass
if errors:raise AssertionError(errors)
