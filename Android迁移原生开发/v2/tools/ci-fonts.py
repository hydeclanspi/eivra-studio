"""CI browser prerequisite. No font fetch or network permission in the Android app."""
import hashlib, pathlib, subprocess, urllib.request
if not subprocess.check_output(['fc-list', ':lang=zh', 'family']).strip():
    url='https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf'
    with urllib.request.urlopen(url, timeout=60) as res: data=res.read(24*1024*1024)
    assert hashlib.sha1(('blob %d\0'%len(data)).encode()+data).hexdigest()=='dc15562470b4f842321894787a0d066879ccff8b', 'Unexpected font version'
    d=pathlib.Path.home()/'.local/share/fonts/eivra-ci'; d.mkdir(parents=True,exist_ok=True)
    (d/'NotoSansCJKsc-Regular.otf').write_bytes(data);subprocess.run(['fc-cache','-f',str(d)],check=True)
assert subprocess.check_output(['fc-list', ':lang=zh','family']).strip(), 'No CJK face for the browser reference'
