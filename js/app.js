/**
 * The Final Defense — main controller.
 * Handles screen flow, the battery progress meter, the damage dashboard
 * and the final celebration transition.
 */
import { CONFIG } from './config.js';
import { captureTokenFromUrl, initGift, renderGiftMessage, startCelebration, stopCelebration, tokenProblem } from './gift.js';
import { initQuiz } from './quiz.js';
import { initGallery } from './gallery.js';

// 1) Grab the token from the fragment before anything else (memory only).
const fragmentParams = captureTokenFromUrl();

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reducedMotion() ? Math.min(ms, 120) : ms));

const screens = [...document.querySelectorAll('.screen')];
const STEP = 100 / (screens.length - 1); // 0% → 100% across the five screens
const PARTIAL = STEP * 0.8; // how much a screen can charge before moving on

const battery = document.getElementById('battery');
const batteryPct = document.getElementById('battery-pct');
const hudPhase = document.getElementById('hud-phase');

let currentIndex = 0;
let charge = 0;
let transitioning = false;

/* ---------------------------------------------------------------------
   Battery
   --------------------------------------------------------------------- */
function setCharge(value) {
  const pct = Math.round(Math.max(0, Math.min(100, value)));
  if (pct === charge && battery.dataset.level) return;
  const rising = pct > charge;
  charge = pct;
  battery.style.setProperty('--charge', String(pct / 100));
  battery.setAttribute('aria-valuenow', String(pct));
  battery.setAttribute('aria-valuetext', `${pct}% charged, phase ${currentIndex + 1} of ${screens.length}`);
  batteryPct.textContent = `${pct}%`;
  battery.dataset.level = pct >= 100 ? 'full' : pct >= 60 ? 'high' : pct >= 25 ? 'mid' : 'low';
  if (rising) {
    battery.classList.remove('is-charging');
    void battery.offsetWidth;
    battery.classList.add('is-charging');
  }
}

/** Charge partially within the current screen (fraction 0–1). */
function setScreenProgress(fraction) {
  if (currentIndex >= screens.length - 1) return;
  const target = currentIndex * STEP + PARTIAL * Math.max(0, Math.min(1, fraction));
  if (target > charge) setCharge(target);
}

/* ---------------------------------------------------------------------
   Screen flow
   --------------------------------------------------------------------- */
const enterHooks = {
  2: () => gallery.activate(),
  3: () => runDashboard(),
  4: () => startCelebration(),
};

function activate(index, { animate = true } = {}) {
  const screen = screens[index];
  screen.hidden = false;
  screen.classList.remove('is-entering');
  if (animate) {
    void screen.offsetWidth;
    screen.classList.add('is-entering');
    screen.addEventListener('animationend', () => screen.classList.remove('is-entering'), { once: true });
  }
  currentIndex = index;
  hudPhase.textContent = `Phase ${index + 1}/${screens.length}`;
  setCharge(index * STEP);
  window.scrollTo({ top: 0, behavior: 'auto' });
  enterHooks[index]?.();
}

function focusHeading(index) {
  screens[index].querySelector('.title')?.focus({ preventScroll: true });
}

async function goTo(index, { animate = true } = {}) {
  if (transitioning || index === currentIndex || index < 0 || index >= screens.length) return;
  transitioning = true;
  const from = screens[currentIndex];

  if (animate && !reducedMotion()) {
    from.classList.add('is-leaving');
    await wait(300);
  }
  from.hidden = true;
  from.classList.remove('is-leaving', 'is-entering');

  activate(index, { animate });
  focusHeading(index);
  transitioning = false;
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-next]')) goTo(currentIndex + 1);
});

/* ---------------------------------------------------------------------
   Screen 4 — Damage dashboard
   --------------------------------------------------------------------- */
const metrics = [...document.querySelectorAll('.metric')];
const logLines = [...document.querySelectorAll('#research-log .log__line')];
const conclusion = document.getElementById('conclusion');
const compensationActions = document.getElementById('compensation-actions');
const compensationBtn = document.getElementById('request-compensation');
const LOG_TAGS = { warning: 'WARNING', error: 'ERROR', critical: 'CRITICAL', success: 'SUCCESS' };
const LOG_TIMES = ['Day 112 · 03:14', 'Day 389 · 07:02', 'Day 777 · 23:58', 'Day 1,024 · 02:31', 'Day 1,301 · 04:44', 'Day 1,460 · 14:00'];
let dashboardRun = 0;

// Decorate log lines once (timestamp + level tag), keeping the message text from the HTML.
logLines.forEach((line, i) => {
  const time = document.createElement('span');
  time.className = 'log__time';
  time.textContent = LOG_TIMES[i] || '';
  const tag = document.createElement('span');
  tag.className = 'log__tag';
  tag.textContent = `[${LOG_TAGS[line.dataset.level] || 'INFO'}]`;
  const msg = document.createElement('span');
  msg.className = 'log__msg';
  msg.textContent = line.textContent.trim();
  line.replaceChildren(time, tag, msg);
});

function countUp(node, target, duration) {
  if (reducedMotion()) {
    node.textContent = String(target);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    node.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

async function runDashboard() {
  const run = ++dashboardRun; // lets a restart cancel an in-progress run

  metrics.forEach((metric, i) => {
    const value = Number(metric.dataset.value) || 0;
    setTimeout(() => {
      if (run !== dashboardRun) return;
      metric.style.setProperty('--v', String(value / 100));
      countUp(metric.querySelector('[data-count]'), value, 1600);
    }, reducedMotion() ? 0 : 250 + i * 180);
  });

  await wait(900);
  for (let i = 0; i < logLines.length; i += 1) {
    if (run !== dashboardRun) return;
    logLines[i].hidden = false;
    setScreenProgress((i + 1) / logLines.length);
    await wait(i === logLines.length - 2 ? 1100 : 800); // dramatic pause before SUCCESS
  }
  if (run !== dashboardRun) return;
  conclusion.classList.replace('is-pending', 'is-revealed');
  await wait(700);
  if (run !== dashboardRun) return;
  compensationActions.classList.replace('is-pending', 'is-revealed');
}

function resetDashboard() {
  dashboardRun += 1;
  metrics.forEach((metric) => {
    metric.style.setProperty('--v', '0');
    metric.querySelector('[data-count]').textContent = '0';
  });
  logLines.forEach((line) => { line.hidden = true; });
  conclusion.classList.replace('is-revealed', 'is-pending');
  compensationActions.classList.replace('is-revealed', 'is-pending');
}

/* ---------------------------------------------------------------------
   Final celebration transition (screen 4 → 5)
   --------------------------------------------------------------------- */
const overlay = document.getElementById('processing');
const overlayStep = document.getElementById('processing-step');
const OVERLAY_STEPS = [
  'Submitting compensation request…',
  'Committee deliberating…',
  'Reviewer #2 objected.\nReviewer #2 was overruled.',
  'Transferring funds…',
];

async function runFinalTransition() {
  if (transitioning) return;
  transitioning = true;
  const stepMs = reducedMotion() ? 600 : 850;
  overlay.style.setProperty('--overlay-duration', `${(stepMs * OVERLAY_STEPS.length) / 1000}s`);
  overlayStep.classList.remove('is-final');
  overlay.classList.remove('is-closing', 'is-approved');
  overlay.hidden = false;

  for (const step of OVERLAY_STEPS) {
    overlayStep.textContent = step;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  overlayStep.textContent = 'Approved!';
  overlayStep.classList.add('is-final');
  overlay.classList.add('is-approved');
  setCharge(100);
  await new Promise((r) => setTimeout(r, reducedMotion() ? 500 : 900));

  // Swap screens underneath the overlay, then fade the overlay away.
  screens[currentIndex].hidden = true;
  activate(screens.length - 1, { animate: true });
  overlay.classList.add('is-closing');
  await wait(650);
  overlay.hidden = true;
  focusHeading(currentIndex);
  transitioning = false;
}
compensationBtn.addEventListener('click', runFinalTransition);

/* ---------------------------------------------------------------------
   Restart
   --------------------------------------------------------------------- */
document.getElementById('restart').addEventListener('click', () => {
  stopCelebration();
  quiz.reset();
  gallery.reset();
  resetDashboard();
  screens[currentIndex].hidden = true;
  activate(0);
  focusHeading(0);
});

/* ---------------------------------------------------------------------
   Init
   --------------------------------------------------------------------- */
function applyDoctorName() {
  const name = String(CONFIG.doctorName || '').trim();
  if (!name) return;
  document.querySelectorAll('[data-doctor-name]').forEach((node) => {
    node.textContent = node.classList.contains('c-str') ? `"${name}"` : name;
  });
}

/** Tell the visitor right away if they didn't arrive through the postcard QR link. */
function showLinkStatus() {
  const problem = tokenProblem();

  const badge = document.getElementById('badge-status'); // optional (lab console)
  if (badge) {
    badge.textContent = problem ? 'Not detected — open via the postcard QR code' : 'QR verified ✓';
    badge.className = problem ? 'is-warn' : 'is-ok';
  }

  const notice = document.getElementById('link-notice');
  if (problem) renderGiftMessage(notice, problem);
  else if (notice) notice.hidden = true;
}

const quiz = initQuiz({ onProgress: setScreenProgress });
const gallery = initGallery({ onProgress: setScreenProgress });
initGift();
applyDoctorName();
showLinkStatus();
setCharge(0);

// Developer shortcut, ONLY on localhost: add &screen=1..5 to the fragment,
// e.g. http://localhost:8000/#token=demo-token-1234&screen=5
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const devScreen = Number(fragmentParams.get('screen'));
if (isLocal && devScreen >= 2 && devScreen <= screens.length) {
  screens[0].hidden = true;
  activate(devScreen - 1, { animate: false });
}
