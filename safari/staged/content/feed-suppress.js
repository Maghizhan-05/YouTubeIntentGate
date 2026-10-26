(function (root) {
  'use strict';
  function setActive(active) {
    const html = document.documentElement;
    if (!html) return;
    html.toggleAttribute('data-intent-gate-no-doomscroll', Boolean(active));
  }
  root.IntentGateFeed = { setActive };
  if (typeof module !== 'undefined' && module.exports) module.exports = { setActive };
})(typeof globalThis !== 'undefined' ? globalThis : this);
