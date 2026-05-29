// ============================================================
//  KidBrainBreak — Content Script (bundled)
// ============================================================

(function () {
  'use strict';

  let shadowHost = null;
  let isInjected  = false;

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'SHOW_BRAIN_BREAK' && !isInjected) {
      injectBrainBreak(msg).then(() => sendResponse({ ok: true })).catch(err => {
        console.error('[KBB] Injection error:', err);
        sendResponse({ ok: false });
      });
      return true;
    }
  });

  async function injectBrainBreak({ isFirstToday, category, sessionCount }) {
    isInjected = true;

    // ── 1. Shadow host ───────────────────────────────────────
    shadowHost = document.createElement('div');
    shadowHost.id = 'kbb-shadow-host';
    Object.assign(shadowHost.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });
    document.body.appendChild(shadowHost);

    const shadow = shadowHost.attachShadow({ mode: 'open' });

    // ── 2. CSS ───────────────────────────────────────────────
    const cssLink = document.createElement('link');
    cssLink.rel   = 'stylesheet';
    cssLink.href  = chrome.runtime.getURL('injected-ui/popup.css');
    shadow.appendChild(cssLink);

    // ── 3. HTML ──────────────────────────────────────────────
    const htmlText = await fetch(chrome.runtime.getURL('injected-ui/popup.html')).then(r => r.text());
    const wrapper  = document.createElement('div');
    wrapper.innerHTML = htmlText;
    wrapper.style.pointerEvents = 'all';
    shadow.appendChild(wrapper);

    // ── 4. Globals for popup.js ──────────────────────────────
    window.__kbbShadowRoot = shadow;
    window.__kbbConfig = { isFirstToday, category, sessionCount };

    // ── 5. Load popup.js as a module ─────────────────────────
    // We use a regular <script type="module"> appended to document head
    // It reads window.__kbbShadowRoot to find its DOM
    const script = document.createElement('script');
    script.type  = 'module';
    script.src   = chrome.runtime.getURL('injected-ui/popup.js');
    document.head.appendChild(script);
  }

  // Called by popup.js when the user dismisses the overlay
  window.__kbbDismiss = function () {
    if (shadowHost) {
      shadowHost.remove();
      shadowHost = null;
    }
    isInjected = false;
    // Clean up globals
    delete window.__kbbShadowRoot;
    delete window.__kbbConfig;
    delete window.__kbbDismiss;
  };

})();
