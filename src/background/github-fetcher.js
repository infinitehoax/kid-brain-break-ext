// ============================================================
//  KidBrainBreak — GitHub Question Fetcher with Caching
// ============================================================

// ✏️  CHANGE THIS to your GitHub raw JSON URL:
const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/questions.json';

const CACHE_KEY      = 'cachedQuestions';
const CACHE_TS_KEY   = 'cachedQuestionsTimestamp';
const CACHE_TTL_MS   = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Fetch questions from GitHub and cache them locally.
 * Falls back to the previously cached version, then to the bundled JSON.
 */
export async function fetchAndCacheQuestions() {
  try {
    const cached = await getCacheIfFresh();
    if (cached) {
      console.log('[KBB] Using cached questions (still fresh).');
      return cached;
    }

    console.log('[KBB] Fetching fresh questions from GitHub…');
    const response = await fetch(GITHUB_RAW_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    await chrome.storage.local.set({
      [CACHE_KEY]: data,
      [CACHE_TS_KEY]: Date.now()
    });
    console.log('[KBB] Questions fetched and cached ✓');
    return data;

  } catch (err) {
    console.warn('[KBB] GitHub fetch failed:', err.message);

    // Try returning stale cache
    const stale = await getFromCache();
    if (stale) {
      console.log('[KBB] Serving stale cache as fallback.');
      return stale;
    }

    // Final fallback: bundled local file
    console.log('[KBB] Loading bundled fallback questions.json');
    try {
      const local = await fetch(chrome.runtime.getURL('questions.json'));
      return await local.json();
    } catch (localErr) {
      console.error('[KBB] Even local fallback failed:', localErr);
      return null;
    }
  }
}

async function getCacheIfFresh() {
  const result = await chrome.storage.local.get([CACHE_KEY, CACHE_TS_KEY]);
  if (!result[CACHE_KEY] || !result[CACHE_TS_KEY]) return null;
  const age = Date.now() - result[CACHE_TS_KEY];
  return age < CACHE_TTL_MS ? result[CACHE_KEY] : null;
}

async function getFromCache() {
  const result = await chrome.storage.local.get(CACHE_KEY);
  return result[CACHE_KEY] || null;
}
