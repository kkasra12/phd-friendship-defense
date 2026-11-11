/**
 * Screen 3 — full-width photo slideshow.
 *
 * Photos are listed in assets/photos.json, either as
 *   ["one.jpg", "two.jpg"]   or   { "photos": ["one.jpg", "two.jpg"] }
 * and loaded from assets/photos/. Only the current photo and its
 * neighbours are loaded, so large albums stay light on mobile data.
 */
import { CONFIG } from './config.js';

const SWIPE_THRESHOLD = 48; // px
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Turn a manifest entry into a safe, relative image URL (or null). */
function toPhotoUrl(entry) {
  const name = typeof entry === 'string' ? entry : entry && (entry.file || entry.src);
  if (typeof name !== 'string') return null;
  const clean = name.trim().replace(/^\/+/, '');
  // Only plain relative filenames inside the photos folder.
  if (!clean || /^[a-z][a-z0-9+.-]*:/i.test(clean) || clean.split('/').includes('..')) return null;
  return CONFIG.photosDirectory + clean.split('/').map(encodeURIComponent).join('/');
}

export function initGallery({ onProgress = () => {} } = {}) {
  const el = {
    root: document.getElementById('gallery'),
    frame: document.getElementById('gallery-frame'),
    viewport: document.getElementById('gallery-viewport'),
    prev: document.getElementById('gallery-prev'),
    next: document.getElementById('gallery-next'),
    counter: document.getElementById('gallery-counter'),
    empty: document.getElementById('gallery-empty'),
    loading: document.querySelector('.gallery__loading'),
  };

  let photos = [];
  let index = 0;
  let current = null; // current slide element
  let started = false;
  const seen = new Set();
  const preloaded = new Set();

  const manifestReady = fetch(CONFIG.photosManifest, { cache: 'no-cache' })
    .then((res) => (res.ok ? res.json() : []))
    .then((data) => {
      const list = Array.isArray(data) ? data : Array.isArray(data?.photos) ? data.photos : [];
      photos = list.map(toPhotoUrl).filter(Boolean);
    })
    .catch(() => {
      photos = [];
    });

  function showEmpty() {
    el.frame.hidden = true;
    el.empty.hidden = false;
    onProgress(1);
  }

  function preload(i) {
    const src = photos[(i + photos.length) % photos.length];
    if (!src || preloaded.has(src)) return;
    preloaded.add(src);
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }

  function createSlide(i) {
    const slide = document.createElement('div');
    slide.className = 'gallery__slide';
    const src = photos[i];

    const backdrop = document.createElement('img');
    backdrop.className = 'gallery__backdrop';
    backdrop.alt = '';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.decoding = 'async';

    const img = document.createElement('img');
    img.className = 'gallery__img';
    img.alt = `Photo evidence ${i + 1} of ${photos.length}`;
    img.decoding = 'async';
    img.draggable = false;

    img.addEventListener('load', () => {
      el.loading.hidden = true;
    });
    img.addEventListener('error', () => {
      el.loading.hidden = true;
      const broken = document.createElement('div');
      broken.className = 'gallery__broken';
      broken.setAttribute('role', 'img');
      broken.setAttribute('aria-label', `Photo ${i + 1} could not be loaded`);
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '🧯';
      const text = document.createElement('p');
      text.textContent = 'This piece of evidence was destroyed in an unexplained lab incident.';
      broken.append(icon, text);
      slide.replaceChildren(broken);
    });

    backdrop.addEventListener('error', () => backdrop.remove());
    img.src = src;
    backdrop.src = src;
    slide.append(backdrop, img);
    return slide;
  }

  function show(newIndex, direction = 0) {
    if (!photos.length) return;
    const total = photos.length;
    index = ((newIndex % total) + total) % total;

    // Drop any slide still animating out (rapid taps).
    el.viewport.querySelectorAll('.gallery__slide.is-leaving').forEach((s) => s.remove());

    const slide = createSlide(index);
    const animate = direction !== 0 && !reducedMotion();
    if (current) {
      const old = current;
      old.classList.remove('enter-next', 'enter-prev', 'enter-fade');
      old.classList.add('is-leaving');
      if (animate) {
        old.classList.add(direction > 0 ? 'leave-next' : 'leave-prev');
        old.addEventListener('animationend', () => old.remove(), { once: true });
        setTimeout(() => old.remove(), 700); // safety net if animationend never fires
      } else {
        old.remove();
      }
    }
    slide.classList.add(animate ? (direction > 0 ? 'enter-next' : 'enter-prev') : 'enter-fade');
    el.viewport.appendChild(slide);
    current = slide;

    el.counter.textContent = `${index + 1} / ${total}`;
    const single = total < 2;
    el.prev.disabled = single;
    el.next.disabled = single;

    seen.add(index);
    onProgress(seen.size / total);
    preload(index + 1);
    preload(index - 1);
  }

  const go = (delta) => show(index + delta, delta);

  el.prev.addEventListener('click', () => go(-1));
  el.next.addEventListener('click', () => go(1));

  el.root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    }
  });

  /* ---- Touch / pointer swipe with drag-follow ---- */
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let tracking = false;
  let horizontal = null;

  el.viewport.addEventListener('pointerdown', (event) => {
    if (!current || photos.length < 2 || (event.pointerType === 'mouse' && event.button !== 0)) return;
    tracking = true;
    horizontal = null;
    startX = event.clientX;
    startY = event.clientY;
    dx = 0;
  });

  el.viewport.addEventListener('pointermove', (event) => {
    if (!tracking || !current) return;
    dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      horizontal = Math.abs(dx) > Math.abs(dy);
      if (horizontal) {
        try {
          el.viewport.setPointerCapture(event.pointerId);
        } catch {
          /* capture is a nicety; swipe still works without it */
        }
      }
    }
    if (horizontal) {
      current.style.transform = `translateX(${dx}px)`;
      current.style.transition = 'none';
    }
  });

  function endDrag() {
    if (!tracking) return;
    tracking = false;
    if (!horizontal || !current) return;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      go(dx < 0 ? 1 : -1);
    } else {
      const slide = current;
      slide.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      slide.style.transform = '';
      slide.addEventListener('transitionend', () => { slide.style.transition = ''; }, { once: true });
    }
  }
  el.viewport.addEventListener('pointerup', endDrag);
  el.viewport.addEventListener('pointercancel', endDrag);
  el.viewport.addEventListener('lostpointercapture', endDrag);

  return {
    /** Called when the gallery screen becomes visible (lazy start). */
    async activate() {
      if (started) return;
      started = true;
      await manifestReady;
      if (!photos.length) {
        showEmpty();
        return;
      }
      show(0);
    },
    reset() {
      seen.clear();
      if (started && photos.length) show(0);
    },
  };
}
