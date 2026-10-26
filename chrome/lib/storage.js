(function (root) {
  'use strict';
  const modes = Object.freeze(['off', 'intention', 'no-doomscroll', 'watch-later']);
  const valid = value => modes.includes(value) ? value : 'intention';
  async function getMode() {
    const result = await chrome.storage.local.get('mode');
    return valid(result?.mode);
  }
  async function setMode(mode) {
    if (!modes.includes(mode)) throw new TypeError('Invalid mode');
    await chrome.storage.local.set({ mode });
  }
  const api = { modes, valid, getMode, setMode };
  root.IntentGateStorage = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
