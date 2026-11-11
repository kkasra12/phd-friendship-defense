/**
 * Gift token handling + finale celebration (flying money & confetti).
 *
 * SECURITY NOTES
 * - The token is read once from the URL fragment (#token=...) and kept ONLY
 *   in this module's memory. It is never written to storage, logged, sent
 *   to any API, or placed in the DOM except transiently as a link href at
 *   the moment the user clicks to redeem.
 * - The redemption URL is built from the public template in config.js and
 *   validated before opening (HTTPS only, and the token can never change the host).
 * - This is NOT authentication: whoever has the QR URL has the token.
 */
import { CONFIG } from './config.js';

/** In-memory only. Never persisted. */
let token = null;

/**
 * Read the token from the URL fragment on initial page load.
 * Optionally strip it from the address bar (it stays in memory).
 * Returns the remaining fragment parameters (non-secret, e.g. dev helpers).
 */
export function captureTokenFromUrl() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const value = params.get(CONFIG.tokenParam);

  if (value !== null) {
    token = value.trim() || null;
    params.delete(CONFIG.tokenParam);

    if (CONFIG.removeTokenFromAddressBar && window.history?.replaceState) {
      const rest = params.toString();
      const cleanUrl = window.location.pathname + window.location.search + (rest ? `#${rest}` : '');
      try {
        window.history.replaceState(window.history.state, '', cleanUrl);
      } catch {
        /* Some embedded browsers forbid this — harmless, token is still only in memory. */
      }
    }
  }
  return params;
}

/** True when a token is present and passes the basic format check. */
export function hasValidToken() {
  return typeof token === 'string' && CONFIG.tokenPattern.test(token);
}

/** Explains why a redemption link could not be produced. */
export class GiftLinkError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason; // 'missing' | 'invalid' | 'config'
  }
}

/**
 * Build and validate the redemption URL. Throws GiftLinkError on any problem.
 * Only called at click time; the result is not stored anywhere.
 */
function buildRedemptionUrl() {
  if (!token) throw new GiftLinkError('missing');
  if (!hasValidToken()) throw new GiftLinkError('invalid');

  const template = String(CONFIG.redemptionUrlTemplate || '');
  if (!template.includes('{token}')) throw new GiftLinkError('config');

  let expected;
  let url;
  try {
    // The template's own origin (with a harmless placeholder) is the only allowed destination.
    expected = new URL(template.replaceAll('{token}', 'TOKEN'));
    url = new URL(template.replaceAll('{token}', encodeURIComponent(token)));
  } catch {
    throw new GiftLinkError('config');
  }

  // The token must never be able to change where the link goes (e.g. {token} placed in the host).
  const sameOrigin = url.origin === expected.origin;
  const isHttps = url.protocol === 'https:';
  const noCredentials = !url.username && !url.password;
  if (!sameOrigin || !isHttps || !noCredentials) throw new GiftLinkError('config');

  return url.href;
}

/** Open a URL in a new tab with no opener and no referrer. */
function openExternal(href) {
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.referrerPolicy = 'no-referrer';
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const ERROR_MESSAGES = {
  missing: {
    title: 'The grant paperwork is missing its secret code. 🧾',
    text: 'Please open this page by scanning the QR code on your postcard. (The code only lives in memory, so reloading the page makes the lab forget it — just scan again.)',
  },
  invalid: {
    title: 'This grant code failed quality control. 🧪',
    text: "The code from the QR link doesn't look right. Please rescan the postcard. If it still fails, notify the committee (a.k.a. your friends).",
  },
  config: {
    title: 'The grant office failed its own safety check. 🛑',
    text: "The redemption link didn't pass validation, so it was not opened. Please ask the committee to check the site configuration.",
  },
};

/* ======================================================================
   Celebration UI
   ====================================================================== */

const MONEY = ['💸', '💶', '💰'];
const PATHS = ['money-rise-a', 'money-rise-b', 'money-drift', 'money-fall'];
const CONFETTI_COLORS = ['#ffc94d', '#ffe08a', '#3fe0ff', '#7af0ff', '#2f8bff', '#ffffff', '#ff8fab'];

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let els = null;
let celebrating = false;

export function initGift() {
  els = {
    layer: document.getElementById('money-layer'),
    confetti: document.getElementById('confetti-layer'),
    error: document.getElementById('gift-error'),
    hint: document.querySelector('.catch-hint'),
    fallback: document.getElementById('claim-fallback'),
    toggle: document.getElementById('toggle-money'),
  };
  els.hintMarkup = els.hint.innerHTML; // static copy, restored on restart

  els.fallback.addEventListener('click', () => redeem());
  els.toggle.addEventListener('click', () => {
    const paused = els.layer.classList.toggle('is-paused');
    els.toggle.setAttribute('aria-pressed', String(paused));
    els.toggle.textContent = paused ? 'Resume the money' : 'Pause the money';
  });

  // One delegated listener for every flying bill.
  els.layer.addEventListener('click', (event) => {
    const bill = event.target.closest('.money');
    if (bill) redeem(bill);
  });
}

/** Try to open the gift. Shows a friendly error instead of a wrong link. */
function redeem(sourceEl) {
  let href;
  try {
    href = buildRedemptionUrl();
  } catch (err) {
    showError(err instanceof GiftLinkError ? err.reason : 'config');
    return;
  }

  hideError();
  openExternal(href);
  href = null;

  if (sourceEl && !reducedMotion()) {
    sourceEl.classList.add('is-caught');
    sourceEl.addEventListener('animationend', () => sourceEl.classList.remove('is-caught'), { once: true });
  }
  els.hint.textContent = '💸 Grant collected! It opened in a new tab. (Feel free to keep catching money — it is very therapeutic.)';
  burstConfetti(40);
}

function showError(reason) {
  const msg = ERROR_MESSAGES[reason] || ERROR_MESSAGES.config;
  const title = document.createElement('strong');
  title.textContent = msg.title;
  els.error.replaceChildren(title, document.createTextNode(msg.text));
  els.error.hidden = false;
}

function hideError() {
  els.error.hidden = true;
  els.error.replaceChildren();
}

function createMoney() {
  const count = Math.max(1, Number(CONFIG.moneyCount) || 16);
  const still = reducedMotion();
  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const bill = document.createElement('button');
    const path = PATHS[i % PATHS.length];
    const dur = rand(8, 14);
    bill.type = 'button';
    bill.className = path === 'money-fall' ? 'money money--fall' : 'money';
    bill.textContent = MONEY[i % MONEY.length];
    bill.setAttribute('aria-label', `Collect your grant, bill ${i + 1} of ${count} (opens in a new tab)`);

    // Spread bills evenly across the width, with a little randomness.
    const x = still
      ? (i % 2 === 0 ? rand(4, 14) : rand(86, 96)) // reduced motion: keep to the edges
      : ((i + rand(0.15, 0.85)) / count) * 92 + 4;
    bill.style.setProperty('--x', `${x.toFixed(2)}%`);
    bill.style.setProperty('--y', `${(12 + ((i * 83) / count) % 80).toFixed(2)}%`);
    bill.style.setProperty('--r', `${rand(-18, 18).toFixed(1)}deg`);
    bill.style.setProperty('--path', path);
    bill.style.setProperty('--dur', `${dur.toFixed(2)}s`);
    // Negative delay → bills are already mid-flight when the screen appears.
    bill.style.setProperty('--delay', `${(-rand(0, dur)).toFixed(2)}s`);
    bill.style.setProperty('--size', `${rand(2.1, 3).toFixed(2)}rem`);
    frag.appendChild(bill);
  }
  els.layer.replaceChildren(frag);
}

function burstConfetti(count, { loop = false } = {}) {
  if (reducedMotion()) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('span');
    piece.className = Math.random() < 0.3 ? 'confetti confetti--round' : 'confetti';
    const w = rand(6, 10);
    piece.style.setProperty('--x', `${rand(0, 100).toFixed(2)}%`);
    piece.style.setProperty('--w', `${w.toFixed(1)}px`);
    piece.style.setProperty('--h', `${(piece.classList.contains('confetti--round') ? w : rand(10, 16)).toFixed(1)}px`);
    piece.style.setProperty('--c', pick(CONFETTI_COLORS));
    piece.style.setProperty('--dur', `${rand(2.8, 5.2).toFixed(2)}s`);
    piece.style.setProperty('--delay', `${(loop ? rand(0, 8) : rand(0, 0.9)).toFixed(2)}s`);
    piece.style.setProperty('--drift', `${rand(-90, 90).toFixed(0)}px`);
    piece.style.setProperty('--rot', `${rand(-720, 720).toFixed(0)}deg`);
    if (loop) {
      piece.style.setProperty('--iter', 'infinite');
    } else {
      piece.addEventListener('animationend', () => piece.remove(), { once: true });
    }
    frag.appendChild(piece);
  }
  els.confetti.appendChild(frag);
}

/** Called when the finale screen is shown. */
export function startCelebration() {
  if (celebrating) return;
  celebrating = true;
  hideError();
  createMoney();
  els.layer.hidden = false;
  burstConfetti(90);
  burstConfetti(22, { loop: true });
}

/** Called when leaving the finale (e.g. "Repeat the experiment"). */
export function stopCelebration() {
  celebrating = false;
  els.layer.hidden = true;
  els.layer.replaceChildren();
  els.layer.classList.remove('is-paused');
  els.toggle.setAttribute('aria-pressed', 'false');
  els.toggle.textContent = 'Pause the money';
  els.confetti.replaceChildren();
  els.hint.innerHTML = els.hintMarkup;
  hideError();
}
