"""Generate simple placeholder PNG icons (no external assets). Run: npm run icons"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(OUT, exist_ok=True)
BG = (11, 95, 214)      # --accent
FG = (255, 255, 255)
GOLD = (242, 193, 78)

def font(size):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
              '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf']:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def make(size, maskable=False, rounded=False):
    scale = 4
    S = size * scale
    img = Image.new('RGBA', (S, S), BG + (255,))
    d = ImageDraw.Draw(img)
    pad = int(S * (0.2 if maskable else 0.1))
    # check-ring
    ring_w = int(S * 0.045)
    box = [pad, pad, S - pad, S - pad]
    d.ellipse(box, outline=FG, width=ring_w)
    # arc in gold (progress)
    d.arc(box, start=-90, end=150, fill=GOLD, width=ring_w)
    # text "7.0"
    f = font(int(S * (0.22 if maskable else 0.27)))
    t = '7.0'
    bb = d.textbbox((0, 0), t, font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((S - w) / 2 - bb[0], (S - h) / 2 - bb[1]), t, font=f, fill=FG)
    img = img.resize((size, size), Image.LANCZOS)
    return img.convert('RGB')

make(192).save(os.path.join(OUT, 'icon-192.png'))
make(512).save(os.path.join(OUT, 'icon-512.png'))
make(512, maskable=True).save(os.path.join(OUT, 'icon-maskable-512.png'))
make(180).save(os.path.join(OUT, 'apple-touch-icon.png'))
make(32).save(os.path.join(OUT, 'favicon-32.png'))
print('icons written to', os.path.abspath(OUT))
