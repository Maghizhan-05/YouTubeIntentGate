const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..', 'extension-src');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function boot(url = 'https://www.youtube.com/', initialMode = 'intention', opts = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><ytd-app><ytd-browse page-subtype="home"><ytd-rich-grid-renderer id="grid"></ytd-rich-grid-renderer></ytd-browse></ytd-app></body></html>', { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  let listener;
  let resolver;
  window.chrome = { runtime: { getURL: name => `ext://${name}` }, storage: { local: { get: () => opts.stuck ? new Promise(resolve => { resolver = resolve; }) : Promise.resolve({ mode: initialMode }) }, onChanged: { addListener: fn => { listener = fn; } } } };
  window.fetch = async url => ({ ok: true, text: async () => read(String(url).replace('ext://', '')) });
  window.eval(read('content/route.js'));
  window.eval(read('lib/storage.js'));
  window.eval(read('content/feed-suppress.js'));
  window.eval(read('content/watch-later-redirect.js'));
  window.eval(read('content/gate.js'));
  return { window, dom, change(mode) { listener({ mode: { newValue: mode } }, 'local'); }, release() { resolver?.({ mode: initialMode }); } };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 25));

test('Home is covered synchronously then mounts a labeled prompt; blank submit shows inline error', async t => {
  const ctx = boot(); t.after(() => ctx.window.close());
  assert.equal(ctx.window.document.documentElement.hasAttribute('data-intent-gate-cover'), true);
  await tick();
  const shadow = ctx.window.document.getElementById('intent-gate-root').shadowRoot;
  const input = shadow.querySelector('textarea');
  assert.ok(shadow.querySelector('label[for="intent-input"]'));
  assert.equal(ctx.window.document.documentElement.hasAttribute('data-intent-gate-cover'), false);
  input.value = '   ';
  shadow.querySelector('form').dispatchEvent(new ctx.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.match(shadow.querySelector('[role="alert"]').textContent, /enter a topic/i);
  assert.equal(shadow.activeElement, input);
});
test('Off restores page and immediate mode change on Home remounts overlay', async t => {
  const ctx = boot('https://www.youtube.com/?foo=1', 'off'); t.after(() => ctx.window.close()); await tick();
  assert.equal(ctx.window.document.getElementById('intent-gate-root'), null);
  ctx.change('intention'); await tick();
  assert.ok(ctx.window.document.getElementById('intent-gate-root'));
  ctx.change('no-doomscroll'); await tick();
  assert.equal(ctx.window.document.getElementById('intent-gate-root'), null);
  assert.equal(ctx.window.document.documentElement.getAttribute('data-intent-gate-no-doomscroll'), '');
  ctx.change('off'); await tick();
  assert.equal(ctx.window.document.documentElement.hasAttribute('data-intent-gate-no-doomscroll'), false);
});
test('non-Home loads do not cover or mount prompt', async t => {
  const ctx = boot('https://www.youtube.com/watch?v=abc'); t.after(() => ctx.window.close()); await tick();
  assert.equal(ctx.window.document.documentElement.hasAttribute('data-intent-gate-cover'), false);
  assert.equal(ctx.window.document.getElementById('intent-gate-root'), null);
});
test('Home link interception covers before the SPA URL changes', async t => {
  const ctx = boot('https://www.youtube.com/results?search_query=test'); t.after(() => ctx.window.close()); await tick();
  const anchor = ctx.window.document.createElement('a'); anchor.href = '/'; anchor.textContent = 'Home'; ctx.window.document.body.append(anchor);
  anchor.dispatchEvent(new ctx.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(ctx.window.document.documentElement.hasAttribute('data-intent-gate-cover'), true);
});

test('unresponsive storage fails open after three seconds', async t => {
  const ctx = boot('https://www.youtube.com/', 'intention', { stuck: true }); t.after(() => ctx.window.close());
  assert.equal(ctx.window.document.documentElement.hasAttribute('data-intent-gate-cover'), true);
  await new Promise(resolve => setTimeout(resolve, 3100));
  assert.equal(ctx.window.document.documentElement.hasAttribute('data-intent-gate-cover'), false);
  ctx.release(); await tick();
  assert.equal(ctx.window.document.getElementById('intent-gate-root'), null);
});
