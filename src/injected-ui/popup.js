// ============================================================
//  KidBrainBreak — Popup UI Controller (popup.js)
//  Loaded as a module script; accesses shadow root via window.__kbbShadowRoot
// ============================================================

import { CanvasWheel }  from './components/CanvasWheel.js';
import { Confetti }     from './components/Confetti.js';
import { renderQuestion } from './core/renderer.js';
import { calculateXP, getResultData } from './core/validator.js';

const root    = window.__kbbShadowRoot;
const config  = window.__kbbConfig || {};

const QUESTION_TIME_SEC = 120; // 2 minutes per question
const CATEGORY_LABELS = {
  ipa:      { label: '🔤 IPA Transcriber', cls: 'ipa'      },
  youtube:  { label: '▶️ YouTube Learner',  cls: 'youtube'  },
  academic: { label: '📚 Academic Quiz',    cls: 'academic' }
};

// ── DOM helpers ─────────────────────────────────────────────
const $ = sel => root.querySelector(sel);

// ── State ────────────────────────────────────────────────────
let allQuestions   = null;
let currentCat     = config.category || null;
let currentQ       = null;
let currentComp    = null;
let timerInterval  = null;
let timeLeft       = QUESTION_TIME_SEC;
let streakDays     = 0;
let confetti       = null;

// ── Boot ─────────────────────────────────────────────────────
async function boot() {
  // Spawn background particles
  spawnParticles();

  // Fetch state for streak count
  const state = await sendMsg({ type: 'GET_STATE' });
  streakDays = state?.streakDays || 0;
  $('#kbb-streak-count').textContent = streakDays;
  $('#kbb-session-num').textContent  = (config.sessionCount || 0) + 1;

  confetti = new Confetti($('#kbb-confetti-canvas'));

  if (config.isFirstToday) {
    showScreen('wheel');
    initWheel();
  } else if (currentCat) {
    await loadAndShowQuestion(currentCat);
  } else {
    showScreen('pick');
    initCategoryPicker();
  }

  // Close on backdrop click (after small delay to prevent accidental close)
  setTimeout(() => {
    $('#kbb-backdrop').addEventListener('click', dismiss);
  }, 2000);
}

// ── Wheel Screen ─────────────────────────────────────────────
function initWheel() {
  const canvas = $('#kbb-wheel-canvas');
  const wheel  = new CanvasWheel(canvas);

  $('#kbb-spin-btn').addEventListener('click', () => {
    $('#kbb-spin-btn').disabled = true;
    wheel.spin(async (result) => {
      const resultEl = $('#kbb-spin-result');
      resultEl.textContent = result.label;
      resultEl.style.display = 'block';

      const kidPicks = result.label.includes('You Pick');
      await new Promise(r => setTimeout(r, 1800)); // let them read the result

      if (kidPicks) {
        showScreen('pick');
        initCategoryPicker();
      } else {
        // System picks random category
        const cats = ['ipa', 'youtube', 'academic'];
        const cat  = cats[Math.floor(Math.random() * cats.length)];
        await setCategory(cat);
        await loadAndShowQuestion(cat);
      }
    });
  });
}

// ── Category Picker ───────────────────────────────────────────
function initCategoryPicker() {
  $('#kbb-category-cards').addEventListener('click', async e => {
    const card = e.target.closest('.kbb-cat-card');
    if (!card) return;
    const cat = card.dataset.cat;
    await setCategory(cat);
    await loadAndShowQuestion(cat);
  });
}

async function setCategory(cat) {
  currentCat = cat;
  await sendMsg({ type: 'SET_CATEGORY', category: cat });
}

// ── Question Screen ───────────────────────────────────────────
async function loadAndShowQuestion(cat) {
  if (!allQuestions) {
    const res = await sendMsg({ type: 'GET_QUESTIONS' });
    allQuestions = res?.questions;
  }

  const pool = allQuestions?.questions?.[cat] || [];
  if (!pool.length) {
    showFallbackMessage();
    return;
  }

  currentQ = pool[Math.floor(Math.random() * pool.length)];
  showScreen('question');
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const q = currentQ;

  // Category pill
  const pill = $('#kbb-cat-pill');
  const meta = CATEGORY_LABELS[currentCat] || { label: '🧠 Brain Break', cls: 'academic' };
  pill.textContent = meta.label;
  pill.className   = `kbb-cat-pill ${meta.cls}`;

  // Prompt
  $('#kbb-prompt-text').textContent = q.prompt;

  // Hint
  const hintBtn  = $('#kbb-hint-btn');
  const hintText = $('#kbb-hint-text');
  if (q.hint) {
    hintBtn.style.display = '';
    hintBtn.onclick = () => {
      hintText.textContent = `💡 ${q.hint}`;
      hintText.style.display = '';
    };
  } else {
    hintBtn.style.display = 'none';
  }

  // YouTube embed
  const ytContainer = $('#kbb-yt-container');
  if (q.videoId) {
    const frame = $('#kbb-yt-frame');
    frame.src = `https://www.youtube-nocookie.com/embed/${q.videoId}?autoplay=0&rel=0`;
    ytContainer.style.display = '';
  } else {
    ytContainer.style.display = 'none';
  }

  // Render question component
  const area   = $('#kbb-question-area');
  const submit = $('#kbb-submit-btn');
  submit.disabled = true;

  currentComp = renderQuestion(area, q, (ready) => {
    submit.disabled = !ready;
  });

  // Submit
  submit.onclick = () => submitAnswer();

  // Timer
  startTimer();
}

function submitAnswer() {
  stopTimer();
  const correct = currentComp.validate();
  showResult(correct);
}

// ── Timer ────────────────────────────────────────────────────
function startTimer() {
  timeLeft = QUESTION_TIME_SEC;
  updateTimerUI();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) {
      stopTimer();
      submitAnswer(); // auto-submit when time runs out
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerUI() {
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  $('#kbb-timer-text').textContent = `${mins}:${secs}`;

  // Update arc
  const arc        = $('#kbb-timer-arc');
  const circumf    = 94.25;
  const fraction   = timeLeft / QUESTION_TIME_SEC;
  arc.style.strokeDashoffset = circumf * (1 - fraction);

  // Color transitions
  if (fraction > 0.5)      arc.style.stroke = 'var(--kbb-green)';
  else if (fraction > 0.2) arc.style.stroke = 'var(--kbb-yellow)';
  else                     arc.style.stroke = 'var(--kbb-red)';

  const timerText = $('#kbb-timer-text');
  if (fraction <= 0.2) timerText.style.color = 'var(--kbb-red)';
}

// ── Result Screen ─────────────────────────────────────────────
function showResult(correct) {
  showScreen('result');

  const xp   = calculateXP({ correct, timeLeft, totalTime: QUESTION_TIME_SEC, streakDays });
  const data = getResultData(correct);

  $('#kbb-result-anim').textContent = data.emoji;
  $('#kbb-result-title').textContent = data.title;
  $('#kbb-result-title').style.color = correct ? 'var(--kbb-green)' : 'var(--kbb-orange)';

  const expl = currentQ?.explanation || '';
  $('#kbb-result-explanation').textContent = expl;
  $('#kbb-result-explanation').style.display = expl ? '' : 'none';

  $('#kbb-xp-amount').textContent = xp;
  $('#kbb-xp-bar-wrap').style.display = correct ? '' : 'none';

  if (correct) {
    confetti.burst(150);
    setTimeout(() => { $('#kbb-xp-fill').style.width = '100%'; }, 200);
  }

  $('#kbb-next-btn').onclick = async () => {
    await loadAndShowQuestion(currentCat);
  };

  $('#kbb-done-btn').onclick = dismiss;
}

// ── Screens ──────────────────────────────────────────────────
function showScreen(name) {
  ['wheel','pick','question','result'].forEach(s => {
    const el = $(`#kbb-screen-${s}`);
    if (el) el.style.display = s === name ? '' : 'none';
  });
}

// ── Particles ────────────────────────────────────────────────
function spawnParticles() {
  const container = $('#kbb-particles');
  const colors    = ['#7b61ff','#ff61b6','#00e5ff','#ffe456','#4dffb4'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'kbb-particle';
    const size  = 4 + Math.random() * 8;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
}

// ── Dismiss ───────────────────────────────────────────────────
function dismiss() {
  stopTimer();
  const modal = $('#kbb-modal');
  modal.style.animation = 'kbb-pop-in 0.3s cubic-bezier(0.6,-0.28,0.74,0.05) reverse forwards';
  $('#kbb-backdrop').style.animation = 'kbb-fade-in 0.3s ease reverse forwards';
  setTimeout(() => {
    if (window.__kbbDismiss) window.__kbbDismiss();
  }, 320);
}

// ── Message helper ─────────────────────────────────────────────
function sendMsg(msg) {
  return new Promise(resolve => {
    try {
      chrome.runtime.sendMessage(msg, resolve);
    } catch (e) {
      resolve(null);
    }
  });
}

function showFallbackMessage() {
  showScreen('question');
  $('#kbb-prompt-text').textContent = 'No questions available for this category. Check your questions.json!';
  $('#kbb-question-area').innerHTML = '<p style="color:var(--kbb-text-muted);text-align:center;padding:20px;">🤷 No questions found. Update your GitHub JSON!</p>';
  $('#kbb-answer-controls').style.display = 'none';
}

// ── Start ─────────────────────────────────────────────────────
boot().catch(console.error);
