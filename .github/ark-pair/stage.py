from pathlib import Path
import json,hashlib,shutil,os
base=Path('compose-and-ark-native'); package='Eivra-Studio-v4.1-Ark-icon.apk'; h='Eivra-Studio-Ark Native.hap'; out=Path('paired'); f=json.loads((out/'facts.json').read_text()); a=out/package
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(a)==f['apk'] and sha(base/h)==f['hap']=='c45cacbb297db6ed53268ce1e4e2d20516419da694ff92ee3c271b7910d12c42'; assert not (base/package).exists(); shutil.copyfile(a,base/package)
(base/'SHA256SUMS').write_text(f"{f['apk']}  {package}\n{f['hap']}  {h}\n")
mode=('与归档的旧 v4.1 同包名、同签名；已在模拟器覆盖安装并保留测试标记。' if f['sameSigner'] else '与旧 v4.1 的签名不同，因此使用独立包名并装。不要卸载旧版；旧本地账本不会自动复制到新包。重建这个并装版本时加 `-PeivraArkSideBySide=true`。')
path=base/'README.md'; text=path.read_text(); anchor='## Source and earlier builds'; assert text.count(anchor)==1
section=f"## Android 安装说明\n\n{mode} 安装包 ID：`{f['package']}`。在 Android API 34 模拟器已验证桌面入口解析、安装并启动；未在用户的实际设备或鸿蒙环境操作。\n\n[构建、签名比对及安装记录](https://github.com/hydeclanspi/eivra-studio/actions/runs/{os.environ['GITHUB_RUN_ID']}) · [v4.1 源码变更](https://github.com/hydeclanspi/eivra-studio/commit/d8ea39267701af63e4276472425b07e938898006)\n\n"
path.write_text(text.replace(anchor,section+anchor))
