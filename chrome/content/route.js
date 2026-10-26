(function (root) {
  'use strict';
  function isHome(value) {
    try { const url = new URL(value); return url.origin === 'https://www.youtube.com' && url.pathname === '/'; }
    catch { return false; }
  }
  function normalizeIntention(value) {
    return Array.from(String(value || '').trim().replace(/\s+/gu, ' ')).slice(0, 200).join('');
  }
  function searchURL(value) {
    const url = new URL('https://www.youtube.com/results');
    url.searchParams.set('search_query', normalizeIntention(value));
    return url.href;
  }
  const api = { isHome, normalizeIntention, searchURL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.IntentGateRoute = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
