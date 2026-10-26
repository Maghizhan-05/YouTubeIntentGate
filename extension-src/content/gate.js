(function (root) {
  'use strict';
  const route = root.IntentGateRoute;
  const storage = root.IntentGateStorage;
  let mode;
  let currentURL = location.href;
  let generation = 0;
  let deadline;
  let failed = false;
  const html = document.documentElement;
  if (!html) return;
  if (route.isHome(location.href)) cover();

  function cover(force = false) {
    if (!force && !route.isHome(location.href)) return;
    html.setAttribute('data-intent-gate-cover', '');
    clearTimeout(deadline);
    const token = generation;
    deadline = setTimeout(() => {
      if (token !== generation) return;
      failed = true;
      html.removeAttribute('data-intent-gate-cover');
      removePrompt();
    }, 3000);
  }
  function reveal() { clearTimeout(deadline); html.removeAttribute('data-intent-gate-cover'); }
  function removePrompt() { document.getElementById('intent-gate-root')?.remove(); }
  function ready() {
    if (document.body) return Promise.resolve();
    return new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }
  async function asset(name) {
    const response = await fetch(chrome.runtime.getURL(name));
    if (!response.ok) throw new Error('Local extension asset unavailable');
    return response.text();
  }
  async function mountPrompt(token) {
    const [markup, css] = await Promise.all([asset('content/overlay.html'), asset('content/overlay.css')]);
    await ready();
    if (token !== generation || failed || !route.isHome(location.href)) return;
    const host = document.createElement('div');
    host.id = 'intent-gate-root';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    shadow.append(style);
    const template = document.createElement('template');
    template.innerHTML = markup;
    shadow.append(template.content.cloneNode(true));
    shadow.querySelector('[data-intent-icon]').src = chrome.runtime.getURL('icons/doctor-doom-48.png');
    const input = shadow.querySelector('#intent-input');
    const error = shadow.querySelector('#intent-error');
    const resize = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 190) + 'px'; };
    input.addEventListener('input', () => {
      const capped = Array.from(input.value).slice(0, 200).join('');
      if (input.value !== capped) input.value = capped;
      input.removeAttribute('aria-invalid'); error.hidden = true; resize();
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); shadow.querySelector('form').requestSubmit(); }
    });
    shadow.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      const intention = route.normalizeIntention(input.value);
      if (!intention) { input.setAttribute('aria-invalid', 'true'); error.hidden = false; input.focus(); return; }
      location.replace(route.searchURL(intention));
    });
    document.body.append(host);
    reveal();
    input.focus();
  }
  async function apply(nextMode, token) {
    if (token !== generation || failed) return;
    const home = route.isHome(location.href);
    root.IntentGateFeed.setActive(home && nextMode === 'no-doomscroll');
    removePrompt();
    if (!home || nextMode === 'off' || nextMode === 'no-doomscroll') { reveal(); return; }
    if (nextMode === 'watch-later') { reveal(); root.IntentGateWatchLater.redirect(); return; }
    try { await mountPrompt(token); }
    catch (error) { if (token === generation) { failed = true; reveal(); } console.warn('Intent Gate failed open:', error); }
  }
  function navigate(force = false) {
    const url = location.href;
    if (!force && url === currentURL) return;
    currentURL = url;
    generation++;
    failed = false;
    root.IntentGateWatchLater.reset();
    removePrompt();
    root.IntentGateFeed.setActive(false);
    if (route.isHome(url)) cover(); else reveal();
    if (mode !== undefined) void apply(mode, generation);
    else void resolveMode(generation);
  }
  async function resolveMode(token) {
    try {
      const loaded = await storage.getMode();
      if (token !== generation || failed) return;
      mode = loaded;
      await apply(mode, token);
    } catch (error) { if (token === generation) { failed = true; reveal(); } console.warn('Intent Gate storage failed open:', error); }
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.mode) return;
    mode = storage.valid(changes.mode.newValue);
    navigate(true);
  });
  addEventListener('yt-navigate-finish', () => navigate(true));
  addEventListener('yt-navigate-start', event => {
    const target = event.detail?.endpoint?.commandMetadata?.webCommandMetadata?.url;
    if (target && route.isHome(new URL(target, location.origin).href)) cover(true);
  });
  addEventListener('popstate', () => navigate(true));
  addEventListener('hashchange', () => navigate(true));
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (anchor && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && anchor.target !== '_blank' && route.isHome(anchor.href)) cover(true);
  }, true);
  const fallback = setInterval(() => navigate(), 250);
  addEventListener('pagehide', () => clearInterval(fallback), { once: true });
  void resolveMode(generation);
})(typeof globalThis !== 'undefined' ? globalThis : this);
