// ============================================================
//  KidBrainBreak — State Manager
// ============================================================

const STATE_KEY = 'kbbState';

const DEFAULT_STATE = {
  todayDate: null,          // 'YYYY-MM-DD' — resets category each new day
  todayCategory: null,      // 'ipa' | 'youtube' | 'academic'
  todayCount: 0,            // how many breaks have happened today
  lastBreakTimestamp: null,
  totalBreaks: 0,           // lifetime count (for stats)
  streakDays: 0,
  lastStreakDate: null
};

export async function getState() {
  const result = await chrome.storage.local.get(STATE_KEY);
  const stored = result[STATE_KEY] || {};
  const state  = { ...DEFAULT_STATE, ...stored };

  // Auto-reset daily counters if it's a new day
  const todayStr = new Date().toISOString().slice(0, 10);
  if (state.todayDate !== todayStr) {
    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    const newStreak = state.lastStreakDate === yStr ? state.streakDays + 1 : 1;

    const reset = {
      ...state,
      todayDate: todayStr,
      todayCategory: null,
      todayCount: 0,
      streakDays: newStreak,
      lastStreakDate: todayStr
    };
    await chrome.storage.local.set({ [STATE_KEY]: reset });
    return reset;
  }

  return state;
}

export async function setState(newState) {
  await chrome.storage.local.set({ [STATE_KEY]: newState });
}
