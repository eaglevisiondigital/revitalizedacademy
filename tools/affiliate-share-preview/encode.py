"""Local fictional QR encoder. Uses installed ReportLab QR encoder and Pillow only."""
import io, json, sys, base64
from urllib.parse import urlsplit, parse_qs
from reportlab.graphics.barcode.qr import QrCodeWidget
from PIL import Image, ImageDraw
raw = sys.stdin.buffer.read(4097)
if len(raw) > 4096:
    raise ValueError('input_limit')
payload = json.loads(raw)['payload']
url = urlsplit(payload)
query = parse_qs(url.query, strict_parsing=True)
if (url.scheme != 'https' or url.netloc != 'academy.synthetic.invalid' or url.path != '/enroll'
    or url.fragment or set(query) != {'ref', 'rva_campaign', 'rva_creative', 'rva_channel'}
    or query['ref'] != ['RVA-FICTIONAL001'] or query['rva_campaign'] != ['fictional-campaign']
    or query['rva_creative'] != ['fictional-creative']
    or query['rva_channel'] not in [['email'], ['sms'], ['dm'], ['social']]):
    raise ValueError('fictional_payload_required')
qr = QrCodeWidget(payload, barLevel='M')
qr.qr.make()
matrix = qr.qr.modules
border, scale = 4, 8
size = (len(matrix) + border * 2) * scale
image = Image.new('RGB', (size, size), 'white')
draw = ImageDraw.Draw(image)
for y, row in enumerate(matrix):
    for x, dark in enumerate(row):
        if dark:
            left, top = (x + border) * scale, (y + border) * scale
            draw.rectangle((left, top, left + scale - 1, top + scale - 1), fill='black')
output = io.BytesIO()
image.save(output, format='PNG')
print(json.dumps({'png': base64.b64encode(output.getvalue()).decode('ascii'), 'modules': len(matrix), 'quiet_zone_modules': border, 'error_correction': 'M'}))
