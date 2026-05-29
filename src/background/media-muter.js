// ============================================================
//  KidBrainBreak — Media Muter
// ============================================================

/**
 * Finds all audible tabs and injects a script to pause
 * any <video> or <audio> elements on them.
 */
export async function muteAllMedia() {
  try {
    const tabs = await chrome.tabs.query({ audible: true });
    const injectPromises = tabs
      .filter(tab => tab.url && !tab.url.startsWith('chrome://'))
      .map(tab =>
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: pauseAllMedia
        }).catch(err => console.warn(`[KBB] Could not mute tab ${tab.id}:`, err))
      );
    await Promise.all(injectPromises);
    console.log(`[KBB] Muted media on ${tabs.length} tab(s).`);
  } catch (err) {
    console.error('[KBB] muteAllMedia error:', err);
  }
}

// This function is serialised and injected into the page
function pauseAllMedia() {
  document.querySelectorAll('video, audio').forEach(el => {
    try { el.pause(); } catch (_) {}
  });
  // Also mute so any autoplay won't restart
  document.querySelectorAll('video, audio').forEach(el => {
    el.muted = true;
  });
}
