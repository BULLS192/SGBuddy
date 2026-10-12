/* V3.11.1 — Remove only the exterior white matte around Merli's approved mascot.
 * Keep the character, lettering and enclosed white details intact. No remote services.
 */
(() => {
  'use strict';
  const SOURCE = '/assets/merlion-companion.webp';
  const SELECTOR = '.buddy-symbol img, .ux-merli-home-hint img';
  let cleaned = null;

  function isExteriorWhite(pixels, offset) {
    const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
    return pixels[offset + 3] > 0 &&
      Math.min(r, g, b) >= 225 &&
      Math.max(r, g, b) - Math.min(r, g, b) <= 35;
  }

  function removeExteriorMatte(image) {
    const width = image.naturalWidth, height = image.naturalHeight;
    if (!width || !height || width * height > 1024 * 1024) return null;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0);
    const frame = ctx.getImageData(0, 0, width, height);
    const pixels = frame.data, size = width * height;
    const visited = new Uint8Array(size);
    const queue = new Int32Array(size);
    let head = 0, tail = 0;

    function enqueue(index) {
      if (visited[index]) return;
      visited[index] = 1;
      if (isExteriorWhite(pixels, index * 4)) queue[tail++] = index;
    }

    for (let x = 0; x < width; x++) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }

    while (head < tail) {
      const index = queue[head++];
      pixels[index * 4 + 3] = 0;
      const x = index % width, y = Math.floor(index / width);
      if (x) enqueue(index - 1);
      if (x + 1 < width) enqueue(index + 1);
      if (y) enqueue(index - width);
      if (y + 1 < height) enqueue(index + width);
    }

    if (!tail || tail === size) return null;
    ctx.putImageData(frame, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function apply(root) {
    if (!cleaned) return;
    if (root instanceof HTMLImageElement && root.matches(SELECTOR) &&
        root.getAttribute('src') === SOURCE) {
      root.src = cleaned;
      root.dataset.merliClean = 'true';
    }
    if (!root.querySelectorAll) return;
    root.querySelectorAll(SELECTOR).forEach(img => {
      if (img.getAttribute('src') === SOURCE) {
        img.src = cleaned;
        img.dataset.merliClean = 'true';
      }
    });
  }

  function start() {
    const original = new Image();
    original.onload = () => {
      try { cleaned = removeExteriorMatte(original); }
      catch (error) { console.warn('Merli matte cleanup unavailable:', error); }
      apply(document);
    };
    original.onerror = () => console.warn('Merli original artwork unavailable');
    original.src = SOURCE;

    const observer = new MutationObserver(records => {
      if (!cleaned) return;
      for (const record of records) {
        if (record.type === 'attributes') {
          apply(record.target);
        } else {
          for (const node of record.addedNodes) {
            if (node.nodeType === 1) apply(node);
          }
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src']
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
