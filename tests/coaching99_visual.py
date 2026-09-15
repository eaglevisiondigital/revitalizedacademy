"""Read-only browser regression checks for the approved layered Coaching section.
No forms are submitted. The original assessment and the rest of the page are not edited.
"""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
import time
import urllib.request
from playwright.sync_api import sync_playwright

LIVE = os.environ.get('COACHING_LIVE_URL', '').rstrip('/')
MODE = 'live' if LIVE else 'source'
OUT = Path('artifacts/coaching99') / MODE
OUT.mkdir(parents=True, exist_ok=True)
server = None
if LIVE:
    base = LIVE
    # A successful git push is not proof of a deployed page. Wait for its CSS.
    for attempt in range(60):
        try:
            req = urllib.request.Request(base + '/css/coaching76.css?verify99=' + str(time.time_ns()), headers={'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(req, timeout=15) as response:
                if 'coaching99-brand-layers.css' in response.read().decode():
                    break
        except Exception as exc:
            print('Deployment check:', type(exc).__name__)
        time.sleep(5)
    else:
        raise RuntimeError('Build 99 is not confirmed on the public site; do not report it live.')
else:
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(Path.cwd()))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = 'http://127.0.0.1:8765'

results = []
try:
    with sync_playwright() as playwright:
        for engine in ['chromium', 'webkit']:
            browser = getattr(playwright, engine).launch()
            for width in [1648, 1440, 390, 320]:
                page = browser.new_page(viewport={'width': width, 'height': 1100}, device_scale_factor=1)
                page.goto(base + '/index.html?coaching99=' + str(time.time_ns()), wait_until='domcontentloaded', timeout=60000)
                page.wait_for_function("getComputedStyle(document.querySelector('#coaching')).getPropertyValue('--ra-coaching-build').trim() === '99'", timeout=45000)
                section = page.locator('#coaching')
                section.scroll_into_view_if_needed()
                page.evaluate('document.fonts.ready')
                page.wait_for_timeout(1200)
                # Dismiss an optional lead popup if it appears during read-only visual QA.
                page.evaluate("document.querySelectorAll('.vitality-popup-backdrop').forEach(e => e.style.display = 'none')")
                metrics = page.evaluate('''() => {
                    const root = document.querySelector('#coaching');
                    const content = root.querySelector('.ra76-content');
                    const button = root.querySelector('.ra76-native-action');
                    const cs = getComputedStyle(root);
                    const paragraphs = [...root.querySelectorAll('.ra76-list li,.ra76-pillar p,.ra76-lead,.ra76-explainer')];
                    const overflow = [...root.querySelectorAll('.ra76-compare,.ra76-pillar,.ra76-native-action')].filter(e => e.scrollWidth > e.clientWidth + 2).map(e=>e.className);
                    return {width:innerWidth,build:cs.getPropertyValue('--ra-coaching-build').trim(),height:root.getBoundingClientRect().height,
                        contentWidth:content.getBoundingClientRect().width,clip:getComputedStyle(content).clipPath,
                        oldPosterHidden:getComputedStyle(root.querySelector('.ra76-desktop')).display==='none',
                        backdrop:cs.backgroundImage,cards:root.querySelectorAll('.ra76-pillar').length,
                        comparisons:[...root.querySelectorAll('.ra76-list')].map(e=>e.children.length),
                        minBodyFont:Math.min(...paragraphs.map(e=>parseFloat(getComputedStyle(e).fontSize))),
                        buttonHref:button.getAttribute('href'),buttonVisible:button.getBoundingClientRect().height>=44,
                        internalOverflow:overflow,
                        sectionOverflow:root.scrollWidth > root.clientWidth + 2,
                        liveText:root.querySelector('#ra76-title').textContent};
                }''')
                metrics['engine'] = engine
                results.append(metrics)
                section.screenshot(path=str(OUT / f'coaching-{engine}-{width}.png'), timeout=45000)
                assert metrics['build'] == '99'
                assert metrics['oldPosterHidden'] and metrics['contentWidth'] > 250 and metrics['clip'] == 'none'
                assert metrics['cards'] == 6 and metrics['comparisons'] == [5, 5]
                assert metrics['minBodyFont'] >= 16
                assert metrics['buttonHref'] == 'enroll.html' and metrics['buttonVisible']
                assert not metrics['internalOverflow'], metrics['internalOverflow']
                assert not metrics['sectionOverflow']
                assert 'unsplash' not in metrics['backdrop']
                page.close()
            browser.close()
finally:
    (OUT / 'report.json').write_text(json.dumps(results, indent=2))
    if server:
        server.shutdown()
print(json.dumps(results, indent=2))
