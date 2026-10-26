(function (root) {
  'use strict';
  let inFlight = false;
  function redirect() {
    if (inFlight || !root.IntentGateRoute.isHome(location.href)) return false;
    inFlight = true;
    location.replace('https://www.youtube.com/playlist?list=WL');
    return true;
  }
  function reset() { inFlight = false; }
  root.IntentGateWatchLater = { redirect, reset };
  if (typeof module !== 'undefined' && module.exports) module.exports = { redirect, reset };
})(typeof globalThis !== 'undefined' ? globalThis : this);
