const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('packages shared source into Chrome and Safari with only Chrome identity key', () => {
  const chrome = JSON.parse(fs.readFileSync(path.join(root, 'chrome/manifest.json'), 'utf8'));
  const safari = JSON.parse(fs.readFileSync(path.join(root, 'safari/staged/manifest.json'), 'utf8'));
  assert.equal(chrome.manifest_version, 3);
  assert.deepEqual(chrome.permissions, ['storage']);
  assert.deepEqual(chrome.host_permissions, ['https://www.youtube.com/*']);
  assert.equal(chrome.content_scripts[0].run_at, 'document_start');
  assert.deepEqual(chrome.content_scripts[0].matches, ['https://www.youtube.com/*']);
  assert.ok(chrome.key);
  assert.equal(safari.key, undefined);
  assert.equal(chrome.action.default_popup, 'popup/popup.html');
  assert.equal(fs.readFileSync(path.join(root, 'chrome/content/gate.js'), 'utf8'), fs.readFileSync(path.join(root, 'safari/staged/content/gate.js'), 'utf8'));
  for (const size of [16, 32, 48, 128]) assert.ok(fs.statSync(path.join(root, `chrome/icons/doctor-doom-${size}.png`)).size > 0);
});
