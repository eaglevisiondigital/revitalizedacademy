(() => {
  const hero = document.querySelector('.founders-page-build69 .founders-hero-exact');
  const media = hero?.querySelector('.founders-hero-exact-media');
  const img = media?.querySelector('img');
  if (!hero || !media || !img || !window.__f105) return;

  /* Disable the earlier cream-mask workaround. It could hide parts of the
     gold artwork. The cleanup below changes only teal phrase pixels. */
  const override = document.createElement('style');
  override.textContent = `
    @media (min-width: 721px) {
      .founders-page-build69 .founders-hero-exact.founders105-exact-artwork .founders-hero-exact-media::after {
        content: none !important;
        display: none !important;
      }
    }
  `;
  document.head.appendChild(override);

  img.src = 'data:image/webp;base64,' + window.__f105;
  img.removeAttribute('srcset');
  img.alt = 'About Our Founders — Justyn and Elle Oliver';
  hero.classList.add('founders105-exact-artwork');

  const removeRightPhrase = () => {
    if (!window.matchMedia('(min-width: 721px)').matches) return;
    if (media.querySelector('.founders108-phrase-cleanup')) return;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;

    /* This crop contains only the far-right phrase area. The canvas overlays
       the same source pixels, then removes only teal lettering. Nothing over
       Justyn/Elle's faces or bodies is processed. */
    const x0 = Math.floor(w * 0.905);
    const y0 = Math.floor(h * 0.605);
    const x1 = Math.min(w, Math.ceil(w * 0.995));
    const y1 = Math.min(h, Math.ceil(h * 0.825));
    const cw = x1 - x0;
    const ch = y1 - y0;

    const canvas = document.createElement('canvas');
    canvas.className = 'founders108-phrase-cleanup';
    canvas.width = cw;
    canvas.height = ch;
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'absolute',
      left: `${(x0 / w) * 100}%`,
      top: `${(y0 / h) * 100}%`,
      width: `${(cw / w) * 100}%`,
      height: `${(ch / h) * 100}%`,
      zIndex: '3',
      pointerEvents: 'none'
    });

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, x0, y0, cw, ch, 0, 0, cw, ch);
    const frame = ctx.getImageData(0, 0, cw, ch);
    const px = frame.data;
    const mask = new Uint8Array(cw * ch);

    const isTealText = (r, g, b) => {
      /* Teal type is substantially greener/bluer than red. These limits avoid
         the orange/gold arcs and the brown jacket/sleeve. */
      return g > 62 && b > 54 && r < 190 &&
             g > r + 9 && b > r + 4 &&
             Math.abs(g - b) < 68;
    };

    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = (y * cw + x) * 4;
        if (isTealText(px[i], px[i + 1], px[i + 2])) mask[y * cw + x] = 1;
      }
    }

    /* Expand by two pixels to capture antialiased edges of each letter. */
    for (let pass = 0; pass < 2; pass++) {
      const next = mask.slice();
      for (let y = 1; y < ch - 1; y++) {
        for (let x = 1; x < cw - 1; x++) {
          if (!mask[y * cw + x]) continue;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) next[(y + dy) * cw + x + dx] = 1;
          }
        }
      }
      mask.set(next);
    }

    const isCreamBackground = (r, g, b) =>
      r > 188 && g > 180 && b > 158 && Math.max(r, g, b) - Math.min(r, g, b) < 72;

    const original = new Uint8ClampedArray(px);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        if (!mask[y * cw + x]) continue;

        let sample = -1;
        /* Prefer clean background immediately to the right, away from Elle's sleeve. */
        for (let d = 3; d <= 24 && sample < 0; d++) {
          const candidates = [x + d, x - d];
          for (const sx of candidates) {
            if (sx < 0 || sx >= cw || mask[y * cw + sx]) continue;
            const si = (y * cw + sx) * 4;
            if (isCreamBackground(original[si], original[si + 1], original[si + 2])) {
              sample = si;
              break;
            }
          }
        }
        if (sample < 0) continue;
        const di = (y * cw + x) * 4;
        px[di] = original[sample];
        px[di + 1] = original[sample + 1];
        px[di + 2] = original[sample + 2];
        px[di + 3] = original[sample + 3];
      }
    }

    ctx.putImageData(frame, 0, 0);
    media.appendChild(canvas);
  };

  img.addEventListener('load', () => {
    removeRightPhrase();
    window.__f105 = '';
  }, { once: true });
})();
