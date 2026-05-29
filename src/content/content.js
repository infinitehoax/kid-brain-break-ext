// ============================================================
//  KidBrainBreak — Content Script (The Injector)
// ============================================================

let shadowHost = null;
let isInjected  = false;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SHOW_BRAIN_BREAK' && !isInjected) {
    injectBrainBreak(msg).then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function injectBrainBreak({ isFirstToday, category, sessionCount }) {
  try {
    isInjected = true;

    // ── 1. Create Shadow Host ────────────────────────────────
    shadowHost = document.createElement('div');
    shadowHost.id = 'kbb-shadow-host';
    shadowHost.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      pointer-events: none;
    `;
    document.body.appendChild(shadowHost);

    const shadow = shadowHost.attachShadow({ mode: 'open' });

    // ── 2. Load CSS ─────────────────────────────────────────
    const cssUrl  = chrome.runtime.getURL('injected-ui/popup.css');
    const styleEl = document.createElement('link');
    styleEl.rel   = 'stylesheet';
    styleEl.href  = cssUrl;
    shadow.appendChild(styleEl);

    // ── 3. Load HTML template ────────────────────────────────
    const htmlUrl = chrome.runtime.getURL('injected-ui/popup.html');
    const html    = await fetch(htmlUrl).then(r => r.text());

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    wrapper.style.pointerEvents = 'all';
    shadow.appendChild(wrapper);

    // ── 4. Boot the UI ──────────────────────────────────────
    // We can't use ES modules directly in shadow DOM scripts,
    // so we pass config via dataset and load popup.js as a script
    const config = { isFirstToday, category, sessionCount };
    wrapper.dataset.kbbConfig = JSON.stringify(config);

    const script = document.createElement('script');
    script.src   = chrome.runtime.getURL('injected-ui/popup.js');
    script.type  = 'module';
    // Pass shadow root reference via global
    window.__kbbShadowRoot = shadow;
    window.__kbbConfig     = config;
    document.head.appendChild(script);

  } catch (err) {
    console.error('[KBB] Injection failed:', err);
    cleanup();
  }
}

// Cleanup function called when the popup dismisses
window.__kbbDismiss = function () {
  cleanup();
};

function cleanup() {
  if (shadowHost) {
    shadowHost.remove();
    shadowHost = null;
  }
  isInjected = false;
}
