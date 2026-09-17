from pathlib import Path
import hashlib, re, shutil
p=Path('founders.html')
old=p.read_text()
assert hashlib.sha1(b'blob '+str(len(p.read_bytes())).encode()+b'\0'+p.read_bytes()).hexdigest()=='56c18b9df2a735b71ddc2350b049f3f2025733e0', 'Founders changed: rebase before applying'
portrait=Path('assets/images/justyn-elle-professional-approved-102.png').read_bytes()
assert hashlib.sha256(portrait).hexdigest()=='83719262d46ad793deccf87964549c4debadd7a51673267b818379098eec8816'
background=Path('assets/images/founders110-background.avif').read_bytes()
assert hashlib.sha256(background).hexdigest()=='92997712deeba47a3e5022476fe1635e033edbf997653f8b6b9b5ecad30870c8'
hero='''    <section class="rva-founders110" aria-labelledby="founders-hero-title" data-build="110">
      <img class="rva-founders110__art" src="assets/images/founders110-background.avif" width="1672" height="941" alt="" aria-hidden="true" fetchpriority="high">
      <div class="rva-founders110__copy">
        <span>Justyn &amp; Elle Oliver</span>
        <h1 id="founders-hero-title">About Our Founders</h1>
        <p>We’re Justyn &amp; Elle Oliver — longevity coaches, parents, and your partners in building a healthier, more vibrant life.</p>
        <p>Our mission is to give you the clarity, tools, and support you need to live stronger for longer and create a legacy of health for you and your family.</p>
      </div>
      <!-- The ORIGINAL uploaded PNG is displayed directly; never a generated composite. -->
      <img class="rva-founders110__portrait" src="assets/images/justyn-elle-professional-approved-102.png" width="1348" height="1254" alt="Justyn and Elle Oliver" fetchpriority="high">
      <a class="rva-founders110__watch" href="index.html#brand-story-video" aria-label="Watch Our Story">
        <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M19 14 L34 24 L19 34 Z" fill="currentColor"/></svg>
        <span>Watch Our Story</span>
      </a>
      <p class="rva-founders110__tagline">BUILT FROM EXPERIENCE. DRIVEN BY PURPOSE.</p>
    </section>'''
start=old.index('    <section class="founders-hero-exact"')
end=old.index('    </section>',start)+len('    </section>')
new=old[:start]+hero+old[end:]
new=new.replace('  <link rel="stylesheet" href="css/founders103.css?v=104">\n  <link rel="stylesheet" href="css/founders105.css?v=107">','  <link rel="stylesheet" href="css/founders110.css?v=110">')
new,count=re.subn(r'^  <script src="js/(?:f105b64-\d+|founders105-hero)\.js\?v=\d+"></script>\n','',new,flags=re.M)
assert count==11, f'Expected exactly 11 retired hero loaders, found {count}'
assert 'founders-hero-exact' not in new and 'f105b64' not in new and 'founders105-hero' not in new
assert old.split('  <header')[1].split('  </header>')[0]==new.split('  <header')[1].split('  </header>')[0]
assert old.split('    <section class="founder-belief')[1].split('  <script src="js/f105b64')[0]==new.split('    <section class="founder-belief')[1].split('  <script src="js/app.js')[0]
p.write_text(new)
shutil.copyfile('.founders110-transfer/founders110.css','css/founders110.css')
print('Only Founders hero markup, isolated stylesheet link and obsolete hero script references replaced.')
