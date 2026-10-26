const test = require('node:test');
const assert = require('node:assert/strict');
const { isHome, searchURL, normalizeIntention } = require('../extension-src/content/route.js');

test('exact Home path includes queries and fragments but excludes other routes', () => {
  for (const url of ['https://www.youtube.com/', 'https://www.youtube.com/?foo=1', 'https://www.youtube.com/#fragment']) assert.equal(isHome(url), true);
  for (const url of ['https://www.youtube.com/results?search_query=x', 'https://www.youtube.com/playlist?list=WL', 'https://www.youtube.com/shorts/abc']) assert.equal(isHome(url), false);
});
test('intention whitespace normalizes, caps at 200 Unicode characters and safely encodes search', () => {
  assert.equal(normalizeIntention('   \t '), '');
  assert.equal(normalizeIntention('  learn   coffee\n brewing  '), 'learn coffee brewing');
  assert.equal(Array.from(normalizeIntention('🎬'.repeat(210))).length, 200);
  assert.equal(searchURL('coffee & tea'), 'https://www.youtube.com/results?search_query=coffee+%26+tea');
});
