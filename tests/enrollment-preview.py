"""Local preview QA. No requests are sent to the real site or form service."""
from pathlib import Path
import json, os, shutil
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('ENROLLMENT_QA_OUTPUT', str(ROOT / 'qa-output' / 'enrollment')))
OUT.mkdir(parents=True, exist_ok=True)
URL = 'about:blank'
HTML = (ROOT / 'enroll.html').read_text()
results = []
with sync_playwright() as pw:
    for engine in ['chromium', 'webkit']:
        try:
            browser = getattr(pw, engine).launch(**({'executable_path':shutil.which('chromium') or shutil.which('chromium-browser'),'args':['--no-sandbox']} if engine == 'chromium' and (shutil.which('chromium') or shutil.which('chromium-browser')) else {}))
        except Exception as exc:
            results.append({'engine':engine, 'unavailable':str(exc).splitlines()[0]})
            continue
        for width in [320,375,390,768,1024,1440]:
            page = browser.new_page(viewport={'width':width,'height':1000}, device_scale_factor=1)
            errors=[]
            page.on('pageerror', lambda exc: errors.append(str(exc)))
            page.set_content(HTML)
            page.wait_for_timeout(80)
            assert not errors, errors
            assert page.locator('h1').inner_text() == 'Apply to join\nReVitalized Academy.'
            assert page.locator('#sex option').all_text_contents() == ['Select','Male','Female']
            assert page.locator('#country option').all_text_contents() == ['Select your country','United States','Canada']
            assert page.locator('#monthly-investment').is_disabled()
            assert page.locator('#program-confidence').is_disabled()
            assert page.locator('[data-netlify]').count() == 0
            assert page.locator('form').get_attribute('method') == 'dialog'
            assert page.locator('input[name="commitment"]').count() == 5
            # Reject empty required fields and place focus on the first invalid field.
            page.locator('#review-application').click()
            assert page.locator('#full-name').evaluate('(el)=>el===document.activeElement')
            assert page.locator('#full-name-error').is_visible()
            # Country is unset initially and never guessed. Switching countries removes stale regions.
            page.locator('.en-location summary').click()
            assert page.locator('#region').is_disabled()
            page.locator('#country').select_option('US')
            assert page.locator('#region option').count() == 52
            page.locator('#region').select_option('FL')
            assert page.locator('#region-selected').inner_text() == 'Florida · United States'
            page.locator('#country').select_option('CA')
            assert page.locator('#region option').count() == 14
            assert page.locator('#region').input_value() == ''
            assert not page.locator('#region-selected').is_visible()
            page.locator('#region').select_option('NL')
            assert page.locator('#region-selected').inner_text() == 'Newfoundland and Labrador · Canada'
            assert page.locator('#region-label').inner_text() == 'Province / territory'
            selected_box = page.locator('#region-selected').bounding_box()
            assert selected_box['x'] >= 0 and selected_box['x'] + selected_box['width'] <= width
            page.locator('#country').select_option('US')
            assert page.locator('#region').input_value() == ''
            assert page.locator('#region option[value="NL"]').count() == 0
            page.locator('#country').select_option('')
            assert page.locator('#region').is_disabled()
            page.locator('.en-location summary').click()
            # Check semantic/range validation; all values here are fictional sample data.
            for selector,value in {'#full-name':'Sample Applicant','#email':'sample@example.com','#phone':'202-555-0146','#age':'35','#start-timing':'In the next month','#health-goals':'Build consistent everyday routines.','#roadblock':'Finding time for daily habits.','#meeting-goal':'Understand how coaching works.'}.items():
                page.locator(selector).fill(value)
            page.locator('#sex').select_option('female')
            page.locator('label.en-star').nth(3).click()
            assert page.locator('.en-star.is-on').count() == 4
            assert page.locator('#commitment-help').inner_text() == '4 out of 5 selected.'
            page.locator('#age').fill('35.5')
            page.locator('#review-application').click()
            assert page.locator('#age-error').is_visible()
            page.locator('#age').fill('35')
            page.locator('#review-application').click()
            assert 'Nothing has been submitted or saved' in page.locator('#en-review-message').inner_text()
            assert page.locator('#en-review-message').evaluate('(el)=>el===document.activeElement')
            assert 'localStorage' not in HTML and 'sessionStorage' not in HTML
            # Native keyboard navigation on the rating group.
            page.locator('#commitment-4').focus()
            page.keyboard.press('ArrowRight')
            assert page.locator('#commitment-5').is_checked()
            assert page.locator('.en-star.is-on').count() == 5
            overflow = page.evaluate('({client:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth})')
            assert overflow['scroll'] <= overflow['client'], overflow
            # Clean screenshot of empty review form rather than error/sample data.
            page.set_content(HTML)
            page.wait_for_timeout(50)
            if engine == 'chromium' and width in [390,1440]:
                page.screenshot(path=str(OUT / f'enrollment-{width}.png'),full_page=True)
            if engine == 'chromium' and width == 375:
                page.locator('.en-location summary').click()
                page.locator('#country').select_option('CA')
                page.locator('#region').select_option('NL')
                page.locator('.en-location').screenshot(path=str(OUT / 'canada-location-375.png'))
            results.append({'engine':engine,'width':width,'passed':True,'overflow':False,'us_regions':51,'canadian_regions':13})
            page.close()
        # Preview must not make a GET/POST even with JavaScript disabled.
        context = browser.new_context(java_script_enabled=False)
        page = context.new_page()
        requests=[]
        page.on('request', lambda r: requests.append(r.url))
        page.set_content(HTML)
        page.locator('#full-name').fill('Sample Applicant')
        page.locator('#full-name').press('Enter')
        assert page.url == URL
        assert page.locator('#review-application').is_disabled()
        assert not any('?' in r for r in requests)
        context.close()
        browser.close()
assert any(row.get('passed') for row in results), 'No browser tests were executed'
(OUT/'qa.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
