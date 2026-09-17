from pathlib import Path
from playwright.sync_api import sync_playwright
import hashlib, json, functools, http.server, threading, shutil
OUT=Path('founders110-proof');OUT.mkdir(exist_ok=True)
portrait=Path('assets/images/justyn-elle-professional-approved-102.png')
assert hashlib.sha256(portrait.read_bytes()).hexdigest()=='83719262d46ad793deccf87964549c4debadd7a51673267b818379098eec8816'
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory='.')
server=http.server.ThreadingHTTPServer(('127.0.0.1',8765),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
checks=[]
with sync_playwright() as p:
 for name in ['chromium','webkit']:
  browser=getattr(p,name).launch()
  for width,height in [(1672,1100),(1440,1000),(1200,950),(1024,950),(768,1024),(390,844)]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   page.goto('http://127.0.0.1:8765/founders.html',wait_until='networkidle')
   hero=page.locator('.rva-founders110')
   page.locator('.rva-founders110__portrait').wait_for()
   page.wait_for_function("[...document.querySelectorAll('.rva-founders110 img')].every(i=>i.complete && i.naturalWidth>0)")
   info=hero.evaluate('''h=>{const p=h.querySelector('.rva-founders110__portrait'), a=h.querySelector('.rva-founders110__art'), b=h.querySelector('.rva-founders110__watch'); const s=getComputedStyle(p),r=p.getBoundingClientRect(),q=b.getBoundingClientRect(); return {portraitCount:h.querySelectorAll('.rva-founders110__portrait').length,portraitSrc:p.getAttribute('src'),naturalWidth:p.naturalWidth,naturalHeight:p.naturalHeight,filter:s.filter,opacity:s.opacity,mixBlendMode:s.mixBlendMode,ratio:r.width/r.height,backgroundWidth:a.naturalWidth,backgroundHeight:a.naturalHeight,overflow:h.scrollWidth>h.clientWidth+1,buttonWidth:q.width,buttonHeight:q.height,href:b.getAttribute('href'),oldCount:document.querySelectorAll('.founders-hero-exact').length,oldScripts:[...document.scripts].filter(s=>/f105b64|founders105-hero/.test(s.src)).length};}''')
   assert info['portraitCount']==1 and info['oldCount']==0 and info['oldScripts']==0,info
   assert info['portraitSrc']=='assets/images/justyn-elle-professional-approved-102.png',info
   assert (info['naturalWidth'],info['naturalHeight'])==(1348,1254),info
   assert (info['backgroundWidth'],info['backgroundHeight'])==(1672,941),info
   assert info['filter']=='none' and info['opacity']=='1' and info['mixBlendMode']=='normal',info
   assert abs(info['ratio']-1348/1254)<0.002,info
   assert not info['overflow'],info
   assert info['buttonHeight']>=44 and info['buttonWidth']>200,info
   assert info['href']=='index.html#brand-story-video',info
   hero.screenshot(path=str(OUT/f'{name}-{width}-hero.png'))
   button=page.locator('.rva-founders110__watch');button.scroll_into_view_if_needed()
   assert button.evaluate('''b=>{const r=b.getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===b || b.contains(e);}'''), 'Button covered'
   button.click()
   page.wait_for_url('**/index.html#brand-story-video')
   assert page.locator('#brand-story-video').count()==1
   info.update(browser=name,width=width,height=height,buttonClickPassed=True)
   checks.append(info)
   page.close()
  browser.close()
report={'portrait_sha256':hashlib.sha256(portrait.read_bytes()).hexdigest(),'checks':checks,'status':'passed'}
(OUT/'verification.json').write_text(json.dumps(report,indent=2))
for path in ['founders.html','css/founders110.css','css/styles.css','js/app.js','assets/images/founders110-background.avif','assets/images/justyn-elle-professional-approved-102.png','assets/images/revitalized-logo-dark-approved-v69.png','assets/images/revitalized-logo-light-approved.png']:
 dest=OUT/'site'/path;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,dest)
print(json.dumps(report))
server.shutdown()
