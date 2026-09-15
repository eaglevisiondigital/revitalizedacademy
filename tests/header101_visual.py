"""Read-only responsive header checks on real pages. Never fill or submit forms.
The browser-only popup suppression is not shipped to the website.
"""
import functools
import http.server
import json
import os
from pathlib import Path
import re
import threading
import time
import urllib.request
from playwright.sync_api import sync_playwright

LIVE = os.environ.get('HEADER_LIVE_URL', '').rstrip('/')
OUT = Path('artifacts/header101') / ('live' if LIVE else 'source')
OUT.mkdir(parents=True, exist_ok=True)
# Test all existing top-level pages which actually load the shared header.
PAGES = []
for p in sorted(Path('.').glob('*.html')):
    text = p.read_text(errors='replace')
    if ('class="site-header' in text or 'class="ra-topbar' in text) and (
            re.search(r'js/app\.js', text) or 'ra-topbar-inner' in text or 'header-glass.css' in text):
        PAGES.append(p.name)
assert 'index.html' in PAGES and 'enroll.html' in PAGES, PAGES
WIDTHS = [2560,1920,1568,1440,1400,1399,1366,1280,1241,1240,1203,1200,1100,1024,820,768,761,760,600,430,390,375,360,320]
SERVER = None
if LIVE:
    BASE = LIVE
    for attempt in range(60):
        try:
            matches = []
            for css in ['header-glass.css','header87-continuity.css']:
                req = urllib.request.Request(BASE+'/css/'+css+'?verify101='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
                with urllib.request.urlopen(req, timeout=15) as r:
                    matches.append('--ra-header-layout:101' in r.read().decode())
            if all(matches): break
        except Exception as e: print('Waiting for deployment:', type(e).__name__, flush=True)
        time.sleep(4)
    else: raise RuntimeError('The updated header is not yet confirmed on the live website.')
else:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args): pass
    SERVER=http.server.ThreadingHTTPServer(('127.0.0.1',8765),functools.partial(Quiet,directory=str(Path.cwd())))
    threading.Thread(target=SERVER.serve_forever,daemon=True).start()
    BASE='http://127.0.0.1:8765'

METRICS = r'''() => {
 const h=document.querySelector('header.site-header,header.ra-topbar');
 const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,cy:r.top+r.height/2}};
 const visible=e=>!!e && e.getBoundingClientRect().width>0 && e.getBoundingClientRect().height>0 && getComputedStyle(e).visibility!=='hidden';
 const logo=h.querySelector('.brand,.ra-logo'), menu=h.querySelector('.menu-toggle,.ra-menu-toggle'), cta=h.querySelector('.header-cta,.ra-header-cta'), nav=h.querySelector('.main-nav,.ra-nav');
 const box=rect(h), parts={logo,menu,cta}; if(visible(nav)&&!visible(menu))parts.nav=nav;
 const active=Object.entries(parts).filter(([k,e])=>visible(e));
 const outside=active.filter(([k,e])=>{const r=rect(e);return r.left<box.left-2||r.right>box.right+2||r.top<box.top-2||r.bottom>box.bottom+2;}).map(([k])=>k);
 const collisions=[];for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
   const a=rect(active[i][1]),b=rect(active[j][1]);if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)collisions.push([active[i][0],active[j][0]]);
 }
 const textOverflow=[];
 for(const el of [cta,menu,...nav.querySelectorAll('a')].filter(visible)){
   const b=rect(el),walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
   while(node=walker.nextNode()){
     if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);
     for(const r of range.getClientRects())if(r.width>0&&(r.left<b.left-2||r.right>b.right+2))textOverflow.push(el.textContent.trim());
   }
 }
 const navOutside=visible(nav)?[...nav.querySelectorAll('a')].filter(visible).filter(e=>rect(e).left<rect(nav).left-2||rect(e).right>rect(nav).right+2).map(e=>e.textContent):[];
 return {width:innerWidth,viewportHeight:innerHeight,version:getComputedStyle(h).getPropertyValue('--ra-header-layout').trim(),header:box,parts:Object.fromEntries(active.map(([k,e])=>[k,rect(e)])),outside,collisions,textOverflow,navOutside,
   centers:active.filter(([k])=>k!=='nav').map(([k,e])=>rect(e).cy),
   menuVisible:visible(menu),ctaVisible:visible(cta),navVisible:visible(nav),nav:rect(nav),
   expanded:menu.getAttribute('aria-expanded'),ctaHref:cta?.getAttribute('href'),navText:nav.textContent.trim(),
   headerOverflow:h.scrollWidth>h.clientWidth+2};
}'''
results=[];failures=[]
def record(page,engine,path,state='closed'):
 m=page.evaluate(METRICS); m.update(engine=engine,page=path,state=state)
 checks={
  'updated-header':m['version']=='101',
  'inside-header':not m['outside'],
  'no-collisions':not m['collisions'],
  'readable-text':not m['textOverflow'] and not m['navOutside'],
  'single-row':max(m['centers'])-min(m['centers'])<=3,
  'no-header-overflow':not m['headerOverflow'],
  'correct-menu-breakpoint':m['menuVisible']==(m['width']<=1399),
  'correct-cta-breakpoint':m['ctaVisible']==(m['width']>760),
 }
 if state=='open':
  checks['menu-open']=m['navVisible'] and m['expanded']=='true'
  checks['panel-below-header']=m['nav']['top']>=m['header']['bottom']-1
  checks['panel-inside-viewport']=m['nav']['left']>=0 and m['nav']['right']<=m['width']+1 and m['nav']['bottom']<=m['viewportHeight']+1
 elif m['width']<=1399:checks['closed-menu-hidden']=not m['navVisible']
 m['checks']=checks;results.append(m)
 for k,v in checks.items():
  if not v:failures.append(f'{engine} {path} {m["width"]} {state}: {k}')
 return m

try:
 with sync_playwright() as pw:
  for engine in ['chromium','webkit']:
   browser=getattr(pw,engine).launch()
   context=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
   for path in PAGES:
    page=context.new_page()
    try:
     page.goto(BASE+'/'+path+'?header101='+str(time.time_ns()),wait_until='domcontentloaded',timeout=60000)
     page.wait_for_function("!!document.querySelector('header.site-header,header.ra-topbar') && getComputedStyle(document.querySelector('header.site-header,header.ra-topbar')).getPropertyValue('--ra-header-layout').trim()==='101'",timeout=20000)
     page.evaluate('document.fonts.ready')
     page.add_style_tag(content='.vitality-popup-backdrop{display:none!important}')
     toggle=page.locator('header .menu-toggle,header .ra-menu-toggle')
     header=page.locator('header.site-header,header.ra-topbar')
     for width in WIDTHS:
      page.set_viewport_size({'width':width,'height':900})
      page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
      page.wait_for_timeout(45)
      m=record(page,engine,path)
      if path in ['index.html','enroll.html'] and width in [1440,1203,768,390,320]:
       header.screenshot(path=str(OUT/f'{path[:-5]}-{engine}-{width}.png'),animations='disabled')
      if width in [1399,1203,761,390,320]:
       toggle.click(timeout=5000);page.wait_for_timeout(50)
       record(page,engine,path,'open')
       if path=='index.html' and width in [1203,390]:
        page.screenshot(path=str(OUT/f'open-menu-{engine}-{width}.png'),clip={'x':0,'y':0,'width':width,'height':min(650,900)})
       toggle.click(timeout=5000);page.wait_for_timeout(30)
      if width in [1203,390]:
       page.evaluate("window.scrollTo({top:500,behavior:'instant'})");page.wait_for_timeout(50)
       record(page,engine,path,'scrolled')
     # A short landscape viewport must still allow the menu to scroll.
     page.set_viewport_size({'width':844,'height':390});page.evaluate("window.scrollTo({top:0,behavior:'instant'})");page.wait_for_timeout(80)
     toggle.click(timeout=5000);page.wait_for_timeout(50);record(page,engine,path,'open')
     toggle.click(timeout=5000)
     # Open -> desktop -> compact -> close without a page refresh.
     page.set_viewport_size({'width':1203,'height':900});page.wait_for_timeout(50);toggle.click()
     page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(60);record(page,engine,path,'resized-wide')
     page.set_viewport_size({'width':1203,'height':900});page.wait_for_timeout(60);record(page,engine,path,'open');toggle.click()
     print(engine,path,'done',flush=True)
    except Exception as exc:
     failures.append(f'{engine} {path}: {type(exc).__name__}: {str(exc)[:300]}')
     page.screenshot(path=str(OUT/f'error-{path[:-5]}-{engine}.png'))
    finally:page.close()
   context.close();browser.close()
finally:
 (OUT/'report.json').write_text(json.dumps({'pages':PAGES,'widths':WIDTHS,'checks':results,'failures':failures},indent=2))
 if SERVER:SERVER.shutdown()
print('PAGES',PAGES,'CHECKS',len(results),'FAILURES',failures,flush=True)
assert not failures,'; '.join(failures)
