// ============================================================
//  KidBrainBreak — Background Service Worker (bundled)
// ============================================================

// ── github-fetcher (inlined) ─────────────────────────────────
// ✏️  CHANGE THIS to your GitHub raw JSON URL:
const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/questions.json';

const CACHE_KEY    = 'cachedQuestions';
const CACHE_TS_KEY = 'cachedQuestionsTimestamp';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function fetchAndCacheQuestions() {
  try {
    const cached = await getCacheIfFresh();
    if (cached) { console.log('[KBB] Using cached questions.'); return cached; }

    console.log('[KBB] Fetching fresh questions from GitHub…');
    const response = await fetch(GITHUB_RAW_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    await chrome.storage.local.set({ [CACHE_KEY]: data, [CACHE_TS_KEY]: Date.now() });
    console.log('[KBB] Questions cached ✓');
    return data;
  } catch (err) {
    console.warn('[KBB] GitHub fetch failed:', err.message);
    const stale = await getFromCache();
    if (stale) { console.log('[KBB] Serving stale cache.'); return stale; }
    try {
      const local = await fetch(chrome.runtime.getURL('questions.json'));
      return await local.json();
    } catch (e) { return null; }
  }
}

async function getCacheIfFresh() {
  const r = await chrome.storage.local.get([CACHE_KEY, CACHE_TS_KEY]);
  if (!r[CACHE_KEY] || !r[CACHE_TS_KEY]) return null;
  return (Date.now() - r[CACHE_TS_KEY]) < CACHE_TTL_MS ? r[CACHE_KEY] : null;
}

async function getFromCache() {
  const r = await chrome.storage.local.get(CACHE_KEY);
  return r[CACHE_KEY] || null;
}

// ── state-manager (inlined) ──────────────────────────────────
const STATE_KEY = 'kbbState';
const DEFAULT_STATE = {
  todayDate: null, todayCategory: null, todayCount: 0,
  lastBreakTimestamp: null, totalBreaks: 0, streakDays: 0, lastStreakDate: null
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

async function getState() {
  const result  = await chrome.storage.local.get(STATE_KEY);
  const state   = { ...DEFAULT_STATE, ...(result[STATE_KEY] || {}) };
  const today   = todayStr();
  if (state.todayDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr     = yesterday.toISOString().slice(0, 10);
    const newStreak = state.lastStreakDate === yStr ? state.streakDays + 1 : 1;
    const reset = { ...state, todayDate: today, todayCategory: null, todayCount: 0, streakDays: newStreak, lastStreakDate: today };
    await chrome.storage.local.set({ [STATE_KEY]: reset });
    return reset;
  }
  return state;
}

async function setState(newState) {
  await chrome.storage.local.set({ [STATE_KEY]: newState });
}

// ── media-muter (inlined) ────────────────────────────────────
function pauseAllMediaFn() {
  document.querySelectorAll('video, audio').forEach(el => {
    try { el.pause(); } catch (_) {}
    el.muted = true;
  });
}

async function muteAllMedia() {
  try {
    const tabs = await chrome.tabs.query({ audible: true });
    const jobs = tabs
      .filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'))
      .map(t => chrome.scripting.executeScript({ target: { tabId: t.id }, func: pauseAllMediaFn })
        .catch(e => console.warn(`[KBB] Mute tab ${t.id} failed:`, e)));
    await Promise.all(jobs);
    if (tabs.length) console.log(`[KBB] Muted ${tabs.length} tab(s).`);
  } catch (e) { console.error('[KBB] muteAllMedia error:', e); }
}

// ── Helpers ──────────────────────────────────────────────────
function isFirstBreakToday(state) { return state.todayDate !== todayStr(); }

// ── Boot ─────────────────────────────────────────────────────
const ALARM_NAME = 'brainBreakAlarm';

async function setupAlarm() {
  const stored  = await chrome.storage.local.get('intervalMinutes');
  const minutes = stored.intervalMinutes || 30;
  await chrome.alarms.clearAll();
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: minutes, periodInMinutes: minutes });
  console.log(`[KBB] Alarm set for every ${minutes} min.`);
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[KBB] Installed — setting up.');
  await setupAlarm();
  fetchAndCacheQuestions().catch(console.warn);
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[KBB] Browser started — re-registering alarm.');
  await setupAlarm();
});

// ── Alarm Handler ────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  console.log('[KBB] ⏰ Alarm fired!');

  const state       = await getState();
  const isFirstToday = isFirstBreakToday(state);

  fetchAndCacheQuestions().catch(console.warn); // refresh in background

  await muteAllMedia();

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;

  if (activeTab.url?.startsWith('chrome://') || activeTab.url?.startsWith('chrome-extension://')) {
    console.log('[KBB] Skipping restricted page.');
    return;
  }

  try {
    await chrome.tabs.sendMessage(activeTab.id, {
      type: 'SHOW_BRAIN_BREAK',
      isFirstToday,
      category: state.todayCategory || null,
      sessionCount: state.todayCount || 0
    });
    await setState({ ...state, lastBreakTimestamp: Date.now(), todayCount: (state.todayCount || 0) + 1, totalBreaks: (state.totalBreaks || 0) + 1 });
  } catch (err) {
    console.error('[KBB] Could not message tab:', err);
  }
});

// ── Message Handler ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SET_CATEGORY') {
    getState().then(state => {
      setState({ ...state, todayCategory: msg.category, todayDate: todayStr() });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'GET_STATE') {
    getState().then(sendResponse);
    return true;
  }

  if (msg.type === 'GET_QUESTIONS') {
    chrome.storage.local.get(CACHE_KEY, (res) => {
      if (res[CACHE_KEY]) {
        sendResponse({ questions: res[CACHE_KEY] });
      } else {
        fetch(chrome.runtime.getURL('questions.json'))
          .then(r => r.json())
          .then(data => sendResponse({ questions: data }))
          .catch(() => sendResponse({ questions: null }));
      }
    });
    return true;
  }

  if (msg.type === 'DISMISS_BREAK') {
    sendResponse({ ok: true });
  }
});
