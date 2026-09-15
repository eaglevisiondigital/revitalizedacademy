"""Read-only Coaching-section layout checks. No forms are filled or submitted.
Build 100 also measures actual heading text, not just card/container widths.
The wide-serif check changes this test browser only; it does not edit the site.
"""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
import time
import urllib.request
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

LIVE = os.environ.get('COACHING_LIVE_URL', '').rstrip('/')
MODE = 'live' if LIVE else 'source'
OUT = Path('artifacts/coaching99') / MODE
OUT.mkdir(parents=True, exist_ok=True)
server = None
if LIVE:
    base = LIVE
    for attempt in range(60):
        try:
            req = urllib.request.Request(base + '/css/coaching76.css?verify100=' + str(time.time_ns()), headers={'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(req, timeout=15) as response:
                if '--ra-coaching-cleanup:100' in response.read().decode():
                    break
        except Exception as exc:
            print('Deployment check:', type(exc).__name__)
        time.sleep(5)
    else:
        raise RuntimeError('Coaching cleanup is not confirmed on the public site.')
else:
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    handler = functools.partial(QuietHandler, directory=str(Path.cwd()))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = 'http://127.0.0.1:8765'

METRICS = r'''() => {
    const root=document.querySelector('#coaching'), content=root.querySelector('.ra76-content');
    const button=root.querySelector('.ra76-native-action'), cs=getComputedStyle(root);
    const rect=e=>e.getBoundingClientRect();
    const body=[...root.querySelectorAll('.ra76-list li,.ra76-pillar p,.ra76-lead,.ra76-explainer')];
    const overflow=[...root.querySelectorAll('.ra76-compare,.ra76-pillar,.ra76-native-action')].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.className);
    const outside=[...root.querySelectorAll('.ra76-intro,.ra76-compare,.ra76-pillar,.ra76-native-action')].filter(e=>rect(e).left<rect(root).left-2||rect(e).right>rect(root).right+2).map(e=>e.className);
    const headingOverflow=[];
    for(const el of root.querySelectorAll('.ra76-intro h2,.ra76-compare-head h3,.ra76-compare-head p')){
        const bound=el.closest('.ra76-intro')||el.parentElement;
        const b=rect(bound), walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
        let node;
        while(node=walker.nextNode()){
            if(!node.textContent.trim())continue;
            const range=document.createRange();range.selectNodeContents(node);
            for(const r of range.getClientRects()){
                if(r.width>0&&(r.left<b.left-2||r.right>b.right+2)) headingOverflow.push({text:el.textContent,left:r.left,right:r.right,boundLeft:b.left,boundRight:b.right});
            }
        }
    }
    const intro=rect(root.querySelector('.ra76-intro')), card=rect(root.querySelector('.ra76-muted'));
    return {width:innerWidth,build:cs.getPropertyValue('--ra-coaching-build').trim(),cleanup:cs.getPropertyValue('--ra-coaching-cleanup').trim(),height:rect(root).height,
        contentWidth:rect(content).width,clip:getComputedStyle(content).clipPath,
        oldPosterHidden:getComputedStyle(root.querySelector('.ra76-desktop')).display==='none',backdrop:cs.backgroundImage,
        cards:root.querySelectorAll('.ra76-pillar').length,comparisons:[...root.querySelectorAll('.ra76-list')].map(e=>e.children.length),
        minBodyFont:Math.min(...body.map(e=>parseFloat(getComputedStyle(e).fontSize))),
        buttonUrl:button.href,buttonVisible:rect(button).height>=44,
        internalOverflow:overflow,outsideContent:outside,headingOverflow,
        headlineCardGap:innerWidth>=1200?card.left-intro.right:null,
        sectionOverflow:root.scrollWidth>root.clientWidth+2,
        headings:[...root.querySelectorAll('.ra76-intro h2,.ra76-compare-head h3')].map(e=>({text:e.textContent,font:getComputedStyle(e).fontFamily,size:getComputedStyle(e).fontSize,width:rect(e).width}))};
}'''

results, failures = [], []
def record(page, engine, font_mode):
    m = page.evaluate(METRICS)
    m.update(engine=engine, fontMode=font_mode)
    destination = urlsplit(m['buttonUrl'])
    checks = {
        'version': m['build']=='99' and m['cleanup']=='100',
        'native-layers': m['oldPosterHidden'] and m['contentWidth']>250 and m['clip']=='none',
        'unchanged-cards': m['cards']==6 and m['comparisons']==[5,5],
        'readability': m['minBodyFont']>=16,
        'enrollment-link': destination.netloc==urlsplit(base).netloc and destination.path.rstrip('/') in ['/enroll','/enroll.html'] and m['buttonVisible'],
        'card-containment': not m['internalOverflow'],
        'section-containment': not m['outsideContent'] and not m['sectionOverflow'],
        'actual-heading-text': not m['headingOverflow'],
        'headline-card-separation': m['headlineCardGap'] is None or m['headlineCardGap']>=8,
        'no-photo-backdrop': 'unsplash' not in m['backdrop'],
    }
    m['checks']=checks
    results.append(m)
    for label,passed in checks.items():
        if not passed: failures.append(f'{engine} {m["width"]} {font_mode}: {label}')
    print(engine,m['width'],font_mode,json.dumps(checks),flush=True)
    return m

try:
    with sync_playwright() as pw:
        for engine in ['chromium','webkit']:
            browser=getattr(pw,engine).launch()
            for width in [1920,1648,1568,1440,1400,1399,1280,1200,1024,820,780,768,480,390,320]:
                page=browser.new_page(viewport={'width':width,'height':1100},device_scale_factor=1)
                page.goto(base+'/index.html?coaching100='+str(time.time_ns()),wait_until='domcontentloaded',timeout=60000)
                page.wait_for_function("getComputedStyle(document.querySelector('#coaching')).getPropertyValue('--ra-coaching-cleanup').trim()==='100'",timeout=45000)
                section=page.locator('#coaching')
                section.scroll_into_view_if_needed()
                page.evaluate('document.fonts.ready')
                page.wait_for_timeout(350)
                page.evaluate("document.querySelectorAll('.vitality-popup-backdrop').forEach(e=>e.style.display='none')")
                m=record(page,engine,'site-fonts')
                if width in [1920,1648,1568,1440,390,320]:
                    page.set_viewport_size({'width':width,'height':max(1100,int(m['height'])+250)})
                    page.evaluate("window.scrollTo({top:Math.max(0,document.querySelector('#coaching').getBoundingClientRect().top+scrollY-150),behavior:'instant'})")
                    section.screenshot(path=str(OUT/f'coaching-{engine}-{width}.png'),timeout=45000)
                # Linux may substitute Times for Mac Georgia. A substantially wider
                # serif catches that font-metric gap instead of hiding clipped text.
                if width in [1920,1648,1568,1440,1200,820,390,320]:
                    page.add_style_tag(content='#coaching .ra76-intro h2,#coaching .ra76-compare-head h3{font-family:"DejaVu Serif",serif!important;}')
                    page.evaluate('document.fonts.ready')
                    record(page,engine,'wide-serif-stress')
                    if width==1568:
                        section.screenshot(path=str(OUT/f'coaching-{engine}-{width}-wide-serif.png'),timeout=45000)
                page.close()
            browser.close()
finally:
    (OUT/'report.json').write_text(json.dumps({'checks':results,'failures':failures},indent=2))
    if server: server.shutdown()
if failures:
    raise AssertionError('; '.join(failures))
print('PASS: native layers, actual heading text, wide-serif containment, and responsive layout.')
