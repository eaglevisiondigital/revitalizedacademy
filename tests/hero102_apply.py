"""Apply only the approved homepage hero image and isolated stylesheet.
Run from the repository root after the original PNG is in assets/images.
Fails closed if the original file is missing or changed. Never modifies other
sections, assessment files, shared header files, or the original portrait bytes.
"""
from pathlib import Path
import hashlib
import struct

SOURCE = Path('assets/images/justyn-elle-professional-approved-102.png')
EXPECTED_SHA256 = '83719262d46ad793deccf87964549c4debadd7a51673267b818379098eec8816'
assert SOURCE.is_file(), 'Original approved PNG must be uploaded before activating this change.'
data = SOURCE.read_bytes()
assert hashlib.sha256(data).hexdigest() == EXPECTED_SHA256, 'Photo bytes differ from the original approved upload; do not publish.'
assert data[:8] == b'\x89PNG\r\n\x1a\n', 'Expected a complete original PNG, not a text or placeholder file.'
assert struct.unpack('>II', data[16:24]) == (1348, 1254), 'Original photo dimensions differ.'
assert data[-12:] == b'\x00\x00\x00\x00IEND\xaeB`\x82', 'PNG is incomplete.'

page = Path('index.html')
before = page.read_bytes()
old = b'class="hero54-founders" src="assets/images/justyn-elle-approved-untouched.png"'
new = b'class="hero54-founders" src="assets/images/justyn-elle-professional-approved-102.png"'
anchor = b'<link rel="stylesheet" href="css/hero54.css?v=54">'
addition = b'\n  <link rel="stylesheet" href="css/hero102-portrait.css?v=102">'
if new in before and addition in before:
    print('Approved hero update already applied; nothing changed.')
else:
    assert before.count(old) == 1, 'Homepage portrait selector changed; review before applying.'
    assert before.count(anchor) == 1, 'Homepage stylesheet anchor changed; review before applying.'
    assert new not in before and addition not in before, 'Partial implementation detected; review before applying.'
    after = before.replace(old, new, 1).replace(anchor, anchor + addition, 1)
    # Prove every other byte in the homepage is unchanged.
    assert after.replace(new, old, 1).replace(addition, b'', 1) == before
    page.write_bytes(after)
    print('Only the homepage portrait src and isolated CSS include were changed.')
print('Original photo SHA-256 verified:', EXPECTED_SHA256)
