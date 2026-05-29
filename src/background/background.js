// ============================================================
//  KidBrainBreak — Background Service Worker (The Brain)
// ============================================================

import { fetchAndCacheQuestions } from './github-fetcher.js';
import { getState, setState } from './state-manager.js';
import { muteAllMedia } from './media-muter.js';

const ALARM_NAME = 'brainBreakAlarm';
const INTERVAL_MINUTES = 30;

// ── Boot ────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[KBB] Extension installed — setting up alarm.');
  await setupAlarm();
  await fetchAndCacheQuestions(); // warm the cache on install
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[KBB] Browser started — re-registering alarm.');
  await setupAlarm();
});

async function setupAlarm() {
  await chrome.alarms.clearAll();
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: INTERVAL_MINUTES,
    periodInMinutes: INTERVAL_MINUTES
  });
}

// ── Alarm fires every 30 min ────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  console.log('[KBB] Alarm fired — initiating brain break!');

  const state = await getState();
  const isFirstToday = isFirstBreakToday(state);

  // Refresh question cache in the background (non-blocking)
  fetchAndCacheQuestions().catch(console.warn);

  // Mute all media before showing popup
  await muteAllMedia();

  // Send message to the active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;

  // Make sure we're not on a chrome:// page (can't inject there)
  if (activeTab.url?.startsWith('chrome://') || activeTab.url?.startsWith('chrome-extension://')) {
    console.log('[KBB] Skipping chrome:// page — cannot inject content script.');
    return;
  }

  try {
    await chrome.tabs.sendMessage(activeTab.id, {
      type: 'SHOW_BRAIN_BREAK',
      isFirstToday,
      category: state.todayCategory || null,
      sessionCount: state.todayCount || 0
    });

    // Update state
    await setState({
      ...state,
      lastBreakTimestamp: Date.now(),
      todayCount: (state.todayCount || 0) + 1
    });
  } catch (err) {
    console.error('[KBB] Could not send message to tab:', err);
  }
});

// ── Message handler (from content/popup) ───────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SET_CATEGORY') {
    getState().then(state => {
      setState({ ...state, todayCategory: msg.category, todayDate: todayStr() });
      sendResponse({ ok: true });
    });
    return true; // async
  }

  if (msg.type === 'GET_STATE') {
    getState().then(state => sendResponse(state));
    return true;
  }

  if (msg.type === 'GET_QUESTIONS') {
    chrome.storage.local.get('cachedQuestions', (res) => {
      if (res.cachedQuestions) {
        sendResponse({ questions: res.cachedQuestions });
      } else {
        // Fallback: load the local bundled JSON
        fetch(chrome.runtime.getURL('questions.json'))
          .then(r => r.json())
          .then(data => sendResponse({ questions: data }))
          .catch(() => sendResponse({ questions: null }));
      }
    });
    return true;
  }

  if (msg.type === 'DISMISS_BREAK') {
    // Nothing special needed — UI self-removes
    sendResponse({ ok: true });
  }
});

// ── Helpers ─────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isFirstBreakToday(state) {
  return state.todayDate !== todayStr();
}
