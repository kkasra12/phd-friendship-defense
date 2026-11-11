/**
 * Screen 2 — Scientific Qualification Examination.
 *
 * Edit the questions below. Mark right answers with `correct: true`.
 * Every option has its own `feedback`. A wrong pick only disables that
 * option and shows its message; the correct answer is never revealed,
 * so wrong messages must not give it away.
 * The score counts questions answered correctly on the first try.
 */
export const QUESTIONS = [
  {
    question:
      'In hydrogen storage using metal hydrides, which thermodynamic parameters primarily govern the equilibrium hydrogen pressure at a fixed temperature?',
    options: [
      {
        text: 'The enthalpy and entropy of hydride formation',
        correct: true,
        feedback: {
          title: 'Correct ✓',
          text: 'Correct. Even after your defense, you still remember the van ’t Hoff relationship.',
        },
      },
      {
        text: "Only the material's electrical conductivity",
        feedback: {
          title: 'Revision requested',
          text: "Reviewer #2 requests that you revise your thermodynamics. Electrons are lovely, but they don't set the plateau pressure.",
        },
      },
      {
        text: 'The external magnetic field strength',
        feedback: {
          title: 'Rejected without review',
          text: 'Bold hypothesis. Unfortunately, the hydride is not that attracted to you. Please remove the magnets from the glovebox and try again.',
        },
      },
      {
        text: 'Only the particle size of the metal',
        feedback: {
          title: 'Minor revisions',
          text: "Particle size mostly changes the kinetics (and the number of nano-papers), not the main story here. Reviewer #2 suspects you've been reading too many abstracts.",
        },
      },
    ],
  },
  {
    question: 'What is the most efficient energy storage system?',
    options: [
      {
        text: 'Hydrogen battery',
        feedback: {
          title: 'Loyal, but…',
          text: 'Respect for staying on brand. By round-trip efficiency, though, hydrogen (electrolysis → fuel cell) still trails lithium-ion. Its superpower is long-duration storage. Think less chemistry, more survival.',
        },
      },
      {
        text: 'Lithium-ion battery',
        feedback: {
          title: 'Scientifically defensible',
          text: 'Li-ion round-trip efficiency is typically around 90%. Sadly, this examination is not scientifically defensible. Think about what actually powered your thesis.',
        },
      },
      {
        text: 'Coffee before a deadline',
        correct: true,
        feedback: {
          title: 'Correct (in this lab) ☕',
          text: 'Energy density: questionable. Discharge rate: instant. Known side effects: 3 a.m. thesis edits and a mild tremor.',
        },
      },
      {
        text: 'Friends who listen to PhD complaints',
        correct: true,
        feedback: {
          title: 'Committee accepts this answer ❤️',
          text: 'Unlimited cycle life, zero capacity fade, and they recharge you with food. Not peer-reviewed, but widely replicated.',
        },
      },
    ],
  },
  {
    question: 'What happens when a PhD student is exposed to Reviewer #2?',
    options: [
      {
        text: 'Hydrogen evolution',
        feedback: {
          title: 'Incomplete analysis',
          text: 'Gas evolution (sighing) confirmed. However, Reviewer #2 notes the degradation mechanism is "insufficiently characterized."',
        },
      },
      {
        text: 'Structural degradation',
        feedback: {
          title: 'Partially supported',
          text: 'Posture has indeed collapsed. Reviewer #2 nevertheless requests 12 additional experiments before accepting this conclusion.',
        },
      },
      {
        text: 'Thermal runaway',
        feedback: {
          title: 'Needs more data',
          text: 'The rebuttal letter did briefly catch fire. Reviewer #2 says the author "fails to consider other pathways."',
        },
      },
      {
        text: 'All of the above',
        correct: true,
        feedback: {
          title: 'Correct ✓',
          text: 'Full degradation pathway confirmed: gas evolution (sighing), structural degradation (posture), and thermal runaway (the rebuttal letter).',
        },
      },
    ],
  },
];

const FALLBACK_FEEDBACK = {
  correct: { title: 'Correct ✓', text: 'The committee is begrudgingly impressed.' },
  wrong: { title: 'Revision requested', text: 'Reviewer #2 is not convinced. Try again.' },
};

const SCORE_COMMENTS = [
  'Bold. Fearless. Wrong. That is the true spirit of research.',
  'Statistically, this is still a result. Publish it.',
  'Solid performance. Reviewer #2 is mildly disappointed they cannot fail you.',
  'Flawless. Suspiciously flawless. Reviewer #2 is already drafting objections.',
];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const scrollBehavior = () =>
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

/**
 * @param {{ onProgress?: (fraction:number) => void }} hooks
 */
export function initQuiz({ onProgress = () => {} } = {}) {
  const el = {
    card: document.getElementById('quiz-card'),
    count: document.getElementById('quiz-count'),
    pips: [...document.querySelectorAll('.quiz__pips i')],
    question: document.getElementById('quiz-question'),
    options: document.getElementById('quiz-options'),
    feedback: document.getElementById('quiz-feedback'),
    next: document.getElementById('quiz-next'),
    done: document.getElementById('quiz-done'),
    score: document.getElementById('quiz-score'),
    doneText: document.getElementById('quiz-done-text'),
  };

  let index = 0;
  let score = 0;
  let results = [];

  function renderPips() {
    el.pips.forEach((pip, i) => {
      pip.className = '';
      if (results[i] === true) pip.classList.add('is-correct');
      else if (results[i] === false) pip.classList.add('is-wrong');
      else if (i === index) pip.classList.add('is-current');
    });
  }

  function render() {
    const q = QUESTIONS[index];
    el.count.textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
    el.question.textContent = q.question;
    el.feedback.className = 'quiz__feedback';
    el.feedback.replaceChildren();
    el.next.hidden = true;
    el.next.classList.add('btn--primary');
    el.next.classList.remove('btn--ghost');

    const buttons = q.options.map((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.dataset.index = String(i);

      const letter = document.createElement('span');
      letter.className = 'option__letter';
      letter.setAttribute('aria-hidden', 'true');
      letter.textContent = LETTERS[i];

      const text = document.createElement('span');
      text.className = 'option__text';
      text.textContent = opt.text;

      const mark = document.createElement('span');
      mark.className = 'option__mark';
      mark.setAttribute('aria-hidden', 'true');

      btn.setAttribute('aria-label', `${LETTERS[i]}. ${opt.text}`);
      btn.append(letter, text, mark);
      btn.addEventListener('click', () => answer(i));
      return btn;
    });
    el.options.replaceChildren(...buttons);
    renderPips();
  }

  function answer(choice) {
    const q = QUESTIONS[index];
    const chosen = q.options[choice];
    const isCorrect = Boolean(chosen.correct);
    const buttons = [...el.options.children];
    const firstAttempt = results[index] === undefined;
    const isLast = index === QUESTIONS.length - 1;

    // Score and pips use the first attempt only.
    if (firstAttempt) {
      results[index] = isCorrect;
      if (isCorrect) score += 1;
      onProgress(results.length / QUESTIONS.length);
    }

    const btn = buttons[choice];
    btn.disabled = true;
    btn.classList.add(isCorrect ? 'is-correct' : 'is-wrong', 'is-chosen');
    btn.querySelector('.option__mark').textContent = isCorrect ? '✓' : '✗';
    btn.setAttribute('aria-label', `${btn.getAttribute('aria-label')} — ${isCorrect ? 'correct' : 'incorrect'}`);

    if (isCorrect) {
      // Lock the question; wrong picks keep their mark, untouched options fade.
      buttons.forEach((b) => {
        if (!b.disabled) b.classList.add('is-dimmed');
        b.disabled = true;
      });
    }

    const fb = chosen.feedback || FALLBACK_FEEDBACK[isCorrect ? 'correct' : 'wrong'];
    const icon = document.createElement('span');
    icon.className = 'feedback__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = isCorrect ? '🧪' : '📝';
    const body = document.createElement('div');
    const title = document.createElement('p');
    title.className = 'feedback__title';
    title.textContent = fb.title;
    const text = document.createElement('p');
    text.className = 'feedback__text';
    text.textContent = isCorrect ? fb.text : `${fb.text} Pick another answer, or skip.`;
    body.append(title, text);
    el.feedback.className = 'quiz__feedback';
    void el.feedback.offsetWidth; // restart the pop-in animation for each new message
    el.feedback.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
    el.feedback.replaceChildren(icon, body);

    // Continuing is always allowed, even without finding the right answer.
    el.next.querySelector('span').textContent = isCorrect
      ? (isLast ? 'See examination results' : 'Next question')
      : (isLast ? 'Skip to results' : 'Skip this question');
    el.next.classList.toggle('btn--primary', isCorrect);
    el.next.classList.toggle('btn--ghost', !isCorrect);
    el.next.hidden = false;

    if (isCorrect) {
      el.next.focus({ preventScroll: true });
      el.next.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
    } else {
      // The clicked option is now disabled, so hand focus to the next available one.
      const remaining = buttons.filter((b) => !b.disabled);
      (remaining.find((b) => buttons.indexOf(b) > choice) || remaining[0])?.focus({ preventScroll: true });
      el.feedback.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
    }

    renderPips();
  }

  function next() {
    if (index < QUESTIONS.length - 1) {
      index += 1;
      render();
      el.card.classList.remove('is-swapping');
      void el.card.offsetWidth; // restart the swap animation
      el.card.classList.add('is-swapping');
      el.question.focus({ preventScroll: true });
      el.card.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
    } else {
      finish();
    }
  }

  function finish() {
    el.card.hidden = true;
    el.done.hidden = false;
    const strong = document.createElement('strong');
    strong.textContent = `${score} / ${QUESTIONS.length}`;
    el.score.replaceChildren(strong, document.createTextNode(SCORE_COMMENTS[Math.min(score, SCORE_COMMENTS.length - 1)]));
    el.doneText.focus({ preventScroll: true });
    el.done.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
  }

  function reset() {
    index = 0;
    score = 0;
    results = [];
    el.card.hidden = false;
    el.done.hidden = true;
    render();
  }

  el.next.addEventListener('click', next);
  render();

  return { reset };
}
