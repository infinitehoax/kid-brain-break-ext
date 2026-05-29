// Settings popup script
document.addEventListener('DOMContentLoaded', async () => {
  // Load state
  const state = await new Promise(resolve =>
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, resolve)
  );

  if (state) {
    document.getElementById('stat-today').textContent  = state.todayCount  || 0;
    document.getElementById('stat-total').textContent  = state.totalBreaks || 0;
    document.getElementById('stat-cat').textContent    = state.todayCategory
      ? { ipa: '🔤', youtube: '▶️', academic: '📚' }[state.todayCategory] || '—'
      : '—';
    document.getElementById('streak-display').textContent =
      `🔥 ${state.streakDays || 0} day streak — keep it going!`;
  }

  // Load saved interval
  const stored = await chrome.storage.local.get('intervalMinutes');
  const interval = stored.intervalMinutes || 30;
  document.getElementById('interval-input').value = interval;

  // Save on change
  document.getElementById('interval-input').addEventListener('change', async e => {
    const val = Math.max(5, Math.min(120, parseInt(e.target.value) || 30));
    e.target.value = val;
    await chrome.storage.local.set({ intervalMinutes: val });

    // Reschedule alarm
    await chrome.alarms.clearAll();
    chrome.alarms.create('brainBreakAlarm', {
      delayInMinutes: val,
      periodInMinutes: val
    });
  });

  // Test break
  document.getElementById('test-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_BRAIN_BREAK',
      isFirstToday: true,
      category: null,
      sessionCount: 0
    });
    window.close();
  });
});
