"""Read-only verification of the approved homepage hero.
No repository writes, form submissions, or changes to the source portrait.
Mobile already displays the portrait before the copy: preserve that order.
A taller portrait shifts the entire copy block, not its internal layout.
"""
from pathlib import Path
import functools
import hashlib
import http.server
import io
import json
import os
import subprocess
import threading
import time
import urllib.request
from PIL import Image
from playwright.sync_api import sync_playwright

BASELINE = 'b5d6dedc4bcb0490a9f4580fa8037bcb1d68ecf0'
PHOTO = 'assets/images/justyn-elle-professional-approved-102.png'
EXPECTED = '83719262d46ad793deccf87964549c4debadd7a51673267b818379098eec8816'
LIVE = os.environ.get('HERO_LIVE_URL', '').rstrip('/')
OUT = Path('artifacts/hero102') / ('live' if LIVE else 'source')
OUT.mkdir(parents=True, exist_ok=True)
WIDTHS = [1920,1717,1648,1568,1440,1366,1203,1101,1100,1024,841,840,768,430,390,375,320]
old = b'class="hero54-founders" src="assets/images/justyn-elle-approved-untouched.png"'
new = b'class="hero54-founders" src="assets/images/justyn-elle-professional-approved-102.png"'
addition = b'\n  <link rel="stylesheet" href="css/hero102-portrait.css?v=102">'
baseline = subprocess.check_output(['git','show',BASELINE+':index.html'])
current = Path('index.html').read_bytes()
assert current.count(new)==1 and current.count(addition)==1
assert current.replace(new,old,1).replace(addition,b'',1).rstrip(b'\n')==baseline.rstrip(b'\n'), 'Unrelated homepage content changed.'
# Every pre-existing tracked file other than the homepage must remain identical.
for path in subprocess.check_output(['git','diff','--name-only','--diff-filter=MDR',BASELINE,'HEAD'],text=True).splitlines():
    assert path=='index.html', 'Unrelated existing file changed: '+path
photo = Path(PHOTO).read_bytes()
assert hashlib.sha256(photo).hexdigest()==EXPECTED, 'Original portrait bytes differ.'
with Image.open(io.BytesIO(photo)) as im: im.verify()
with Image.open(io.BytesIO(photo)) as im:
    im.load()
    assert im.size==(1348,1254) and im.mode=='RGBA'
server = None
baseline_path = Path('_hero102_baseline_check.html')
if LIVE:
    base = LIVE
    for attempt in range(60):
        try:
            request=urllib.request.Request(base+'/index.html?hero102='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
            with urllib.request.urlopen(request,timeout=15) as response: html=response.read()
            if new in html and b'css/hero102-portrait.css?v=102' in html: break
        except Exception as exc: print('Waiting for deployment:',type(exc).__name__,flush=True)
        time.sleep(4)
    else: raise AssertionError('Approved portrait is not on the public homepage.')
    with urllib.request.urlopen(base+'/'+PHOTO,timeout=30) as response: live_photo=response.read()
    assert hashlib.sha256(live_photo).hexdigest()==EXPECTED, 'Live portrait differs from original.'
else:
    baseline_path.write_bytes(baseline)
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args): pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',8765),functools.partial(Quiet,directory=str(Path.cwd())))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base='http://127.0.0.1:8765'
METRICS = r'''() => {
 const hero=document.querySelector('#about.hero54'),p=hero.querySelector('.hero54-founders'),bg=hero.querySelector('.hero54-bg'),copy=hero.querySelector('.hero54-copy');
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
 const hr=rect(hero),pr=rect(p),cr=rect(copy),br=rect(bg),ps=getComputedStyle(p);
 const scale=Math.min(pr.width/p.naturalWidth,pr.height/p.naturalHeight);
 const painted={x:pr.right-p.naturalWidth*scale,y:pr.bottom-p.naturalHeight*scale,width:p.naturalWidth*scale,height:p.naturalHeight*scale};
 const origin=innerWidth<=840?cr.y:hr.y;
 const textGeometry=[...copy.children].map(e=>{const s=getComputedStyle(e),r=rect(e);return {tag:e.tagName,class:e.className,x:r.x,y:Math.round((r.y-origin)*64)/64,width:r.width,height:r.height,font:s.fontFamily,size:s.fontSize,line:s.lineHeight,color:s.color}});
 return {width:innerWidth,version:getComputedStyle(hero).getPropertyValue('--ra-hero-portrait').trim(),hero:hr,portrait:pr,painted,copy:cr,bg:br,
  imageLoaded:p.complete&&p.naturalWidth===1348&&p.naturalHeight===1254,source:p.getAttribute('src'),objectFit:ps.objectFit,opacity:ps.opacity,transform:ps.transform,
  textGeometry,links:[...copy.querySelectorAll('a')].map(a=>({href:a.getAttribute('href'),height:rect(a).height})),
  backgroundSource:bg.getAttribute('src'),header:rect(document.querySelector('.site-header'))};
}'''
results=[];failures=[]
try:
    with sync_playwright() as pw:
        for engine in ['chromium','webkit']:
            browser=getattr(pw,engine).launch()
            context=browser.new_context(viewport={'width':1717,'height':1100},device_scale_factor=1)
            page=context.new_page()
            page.goto(base+'/index.html?hero102='+str(time.time_ns()),wait_until='domcontentloaded',timeout=60000)
            page.wait_for_function("getComputedStyle(document.querySelector('#about.hero54')).getPropertyValue('--ra-hero-portrait').trim()==='102'",timeout=45000)
            page.wait_for_function("document.querySelector('.hero54-founders').complete && document.querySelector('.hero54-founders').naturalWidth===1348",timeout=45000)
            page.evaluate('document.fonts.ready')
            page.add_style_tag(content='.vitality-popup-backdrop{display:none!important}')
            before_page=None
            if not LIVE:
                before_page=context.new_page()
                before_page.goto(base+'/'+baseline_path.name,wait_until='domcontentloaded',timeout=60000)
                before_page.wait_for_function("getComputedStyle(document.querySelector('.site-header')).getPropertyValue('--ra-header-layout').trim()==='101'",timeout=30000)
                before_page.evaluate('document.fonts.ready')
                before_page.add_style_tag(content='.vitality-popup-backdrop{display:none!important}')
            for width in WIDTHS:
                page.set_viewport_size({'width':width,'height':1300})
                page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
                page.wait_for_timeout(100)
                m=page.evaluate(METRICS);m['engine']=engine
                checks={
                    'original-portrait':m['imageLoaded'] and m['source']==PHOTO,
                    'native-layers':m['version']=='102' and m['objectFit']=='contain' and m['opacity']=='1' and m['transform']=='none',
                    'original-background':m['backgroundSource']=='assets/images/hero54-background.png',
                    'leaf-inset':abs(m['bg']['y']-m['hero']['y']-12)<1,
                    'portrait-within-width':m['painted']['x']>=-1 and m['painted']['x']+m['painted']['width']<=width+1,
                    'headroom':m['painted']['y']+m['painted']['height']*.045>=m['hero']['y']+10,
                    'buttons':len(m['links'])==2 and all(a['height']>=44 for a in m['links']),
                    'separate-from-copy':m['painted']['x']>=m['copy']['right']-2 if width>840 else m['portrait']['bottom']<=m['copy']['y']+2,
                }
                if before_page:
                    before_page.set_viewport_size({'width':width,'height':1300});before_page.wait_for_timeout(80)
                    bm=before_page.evaluate(METRICS)
                    checks['unchanged-copy-layout']=m['textGeometry']==bm['textGeometry']
                    checks['unchanged-header']=m['header']==bm['header']
                    checks['unchanged-links']=m['links']==bm['links']
                    if width<=840:
                        checks['existing-mobile-order']=bm['portrait']['bottom']<=bm['copy']['y']+2
                    m['baselineCopy']=bm['copy']
                    if width==390:
                        before_page.locator('#about.hero54').screenshot(path=str(OUT/f'baseline-{engine}-390.png'),timeout=45000)
                m['checks']=checks;results.append(m)
                for label,passed in checks.items():
                    if not passed: failures.append(f'{engine} {width}: {label}')
                if width in [1717,1440,1203,390]:
                    page.locator('#about.hero54').screenshot(path=str(OUT/f'hero-{engine}-{width}.png'),timeout=45000)
            context.close();browser.close()
finally:
    (OUT/'report.json').write_text(json.dumps({'portraitSHA256':EXPECTED,'checks':results,'failures':failures},indent=2))
    if server: server.shutdown()
    if baseline_path.exists(): baseline_path.unlink()
assert not failures, '; '.join(failures)
print('PASS: original portrait bytes, native layers, and unchanged surrounding content.',flush=True)
