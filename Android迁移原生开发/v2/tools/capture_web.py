"""Read-only reference capture of the public deployment in fresh, credential-free browser contexts.
Run using playwright==1.56.0 and Chrome; artifacts belong to CI, not the APK.
"""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright

out=Path('app/build/web-reference'); out.mkdir(parents=True,exist_ok=True)
origin='https://eivra.vercel.app'
with sync_playwright() as pw:
    from contextlib import closing
    with closing(pw.chromium.launch(channel='chrome',headless=True)) as browser:
        for w,h in [(390,844),(1280,800)]:
            ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,locale='zh-CN',color_scheme='light',reduced_motion='reduce',is_mobile=False)
            page=ctx.new_page()
            for route in ('new','settle','combo','dashboard','history','params'):
                page.goto(f'{origin}/{route}?tour=0',wait_until='domcontentloaded',timeout=45000)
                page.locator('main').wait_for(timeout=25000)
                page.get_by_text('demo · preview', exact=True).first.wait_for(state='attached',timeout=12000)
                page.locator('.composed-glass-scene--moon').wait_for(state='attached',timeout=8000)
                page.locator('main .glow-card').first.wait_for(state='attached',timeout=15000)
                page.evaluate('''async () => {await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))]);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}''')
                metrics=page.evaluate('''() => {const selectors=['.mn-bar','.mn-brand','.mn-nav','.mn-nav-active','.mn-settings-link','main','main h1','main h2','main .glow-card','.lab-new-quick','.pre-match-split__main','.pre-match-split__side'];let boxes={};for(const k of selectors){const e=document.querySelector(k);if(!e)continue;const r=e.getBoundingClientRect(),s=getComputedStyle(e);boxes[k]={x:r.x,y:r.y,w:r.width,h:r.height,radius:s.borderRadius,fill:s.backgroundColor,ink:s.color,filter:s.backdropFilter,fontFamily:s.fontFamily,fontSize:s.fontSize};}return {url:location.href,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,mode:document.documentElement.dataset.liquidGlassStyle,fonts:document.fonts.check('14px "DM Sans"'),boxes};}''')
                assert metrics['width']==w and metrics['height']==h and metrics['dpr']==1 and metrics['url'].startswith(origin+'/')
                d=out/f'{w}x{h}';d.mkdir(exist_ok=True)
                page.screenshot(path=str(d/f'{route}-web.png'),animations='disabled',timeout=15000)
                (d/f'{route}-geometry.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2))
            ctx.close()
