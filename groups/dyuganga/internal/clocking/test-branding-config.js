// Branding/config test for the shift clock pages.
// App identity is defined in clock-shared.js:
//   const RECORD_APP_ID = 'dyuganga';
//   const RECORD_APP_DISPLAY_NAME = 'Dyuganga';
// each overridable by the same-named window.RECORD_* global set before
// load. (There are no versions anywhere: every page load fetches fresh
// JS, so a stale client cannot exist and no version check remains.)
// Shared exposes them via ClockShared (APP_NAME, APP_DISPLAY_NAME, KEYS),
// which clock.js requires and uses directly (each page loader fetches
// shared before its page script). The HTML carries no config; its loader
// fetches fresh JS/CSS on every load with a per-load stamp.
// Run: node test-branding-config.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE = __dirname;
const sharedSrc = fs.readFileSync(path.join(BASE, 'clock-shared.js'), 'utf8');
const clockSrc = fs.readFileSync(path.join(BASE, 'clock.js'), 'utf8');

// Extract a top-level `function name(...) { ... }` block by brace matching.
function extract(src, name) {
  const start = src.indexOf('function ' + name + '(');
  assert.ok(start >= 0, 'must define function ' + name);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('unbalanced braces in ' + name);
}

function runFn(fnSrc, windowStub, documentStub, call) {
  return new Function('window', 'document', fnSrc + '; return (' + call + ');')(windowStub, documentStub);
}
const sharedConsts = ['RECORD_APP_ID', 'RECORD_APP_DISPLAY_NAME'].map((key) => {
  const m = new RegExp("const " + key + " = '[^']*';").exec(sharedSrc);
  assert.ok(m, 'shared must define const ' + key);
  return m[0];
}).join('\n');
const sharedBranding = sharedConsts + '\n' + extract(sharedSrc, 'getBranding');
const sharedSync = extract(sharedSrc, 'syncBrandElement');

function docStub(brandEl) {
  return {
    getElementById: (id) => (id === 'brand' ? (brandEl || null) : null),
    querySelector: () => null,
    readyState: 'complete',
    addEventListener: () => {}
  };
}
function getBrandingShared(w) { return runFn(sharedBranding, w, docStub(), 'getBranding()'); }

// Load the whole real shared file with stubs; returns window.ClockShared.
function loadShared(windowStub, brandEl) {
  const w = Object.assign({}, windowStub);
  new Function('window', 'document', sharedSrc)(w, docStub(brandEl || null));
  assert.ok(w.ClockShared, 'shared must define window.ClockShared');
  return w.ClockShared;
}

// 1. Configured identity flows through to branding and keys.
(function testConfigured() {
  const w = {
    RECORD_APP_ID: 'customapp',
    RECORD_APP_DISPLAY_NAME: 'CustomApp'
  };
  assert.deepStrictEqual(getBrandingShared(w), { name: 'customapp', display: 'CustomApp' });
  const shared = loadShared(w);
  assert.strictEqual(shared.APP_NAME, 'customapp');
  assert.strictEqual(shared.APP_DISPLAY_NAME, 'CustomApp');
  assert.strictEqual(shared.KEYS.users, 'customapp_clock_users_v1');
  console.log('✓ Test 1 passed: configured id/display flow through');
})();

// 2. Missing config falls back to dyuganga/Dyuganga.
(function testFallback() {
  const b = getBrandingShared({});
  assert.deepStrictEqual(b, { name: 'dyuganga', display: 'Dyuganga' });
  const shared = loadShared({});
  assert.strictEqual(shared.APP_NAME, 'dyuganga');
  assert.strictEqual(shared.KEYS.users, 'dyuganga_clock_users_v1');
  console.log('✓ Test 2 passed: missing config → dyuganga/Dyuganga');
})();

// 3. Messy id is sanitized; blank/empty parts fall back independently.
(function testSanitize() {
  assert.deepStrictEqual(
    getBrandingShared({ RECORD_APP_ID: '  Custom App! ', RECORD_APP_DISPLAY_NAME: 'Custom App!' }),
    { name: 'custom_app', display: 'Custom App!' });
  assert.deepStrictEqual(
    getBrandingShared({ RECORD_APP_ID: '!!!', RECORD_APP_DISPLAY_NAME: '' }),
    { name: 'dyuganga', display: 'Dyuganga' });
  assert.deepStrictEqual(
    getBrandingShared({ RECORD_APP_ID: 'customapp' }),
    { name: 'customapp', display: 'Dyuganga' });
  console.log('✓ Test 3 passed: id sanitized, blank parts fall back');
})();

// 4. clock.js keeps no branding/keys of its own: it requires ClockShared
// and reads branding and keys from it.
(function testClockUsesShared() {
  assert.ok(!/function getBranding\(/.test(clockSrc), 'clock.js must not define getBranding');
  assert.ok(!/function getKeys\(/.test(clockSrc), 'clock.js must not define getKeys');
  assert.ok(!clockSrc.includes('KEYS_STATIC'), 'clock.js must not keep static key fallbacks');
  assert.ok(!clockSrc.includes('new Proxy'), 'clock.js must not proxy keys');
  assert.ok(clockSrc.includes('const Shared = window.ClockShared;'),
    'clock.js must take Shared from window.ClockShared');
  assert.ok(clockSrc.includes('if (!Shared) { throw'),
    'clock.js must refuse to run without shared');
  assert.ok(clockSrc.includes('const KEYS = Shared.KEYS;'),
    'clock.js must take KEYS from shared');
  assert.ok(clockSrc.includes('Shared.getBranding()'),
    'clock.js must read branding from shared');
  console.log('✓ Test 4 passed: clock.js uses ClockShared, keeps no local copies');
})();

// 5. Brand element shows the configured display name; missing element is fine.
(function testSyncElement() {
  const brandEl = { textContent: 'Stale Text' };
  runFn(sharedBranding + '\n' + sharedSync,
    { RECORD_APP_DISPLAY_NAME: 'CustomApp' }, docStub(brandEl), 'syncBrandElement()');
  assert.strictEqual(brandEl.textContent, 'CustomApp');
  runFn(sharedBranding + '\n' + sharedSync, {}, docStub(null), 'syncBrandElement()');
  console.log('✓ Test 5 passed: #brand synced from config, absent element ignored');
})();

// 6. Brand element text is NOT read: DOM text cannot rebrand anymore.
(function testDomIgnored() {
  const brandEl = { textContent: 'EvilApp' };
  const shared = loadShared({}, brandEl);
  assert.strictEqual(shared.APP_NAME, 'dyuganga');
  assert.strictEqual(shared.KEYS.users, 'dyuganga_clock_users_v1');
  assert.strictEqual(brandEl.textContent, 'Dyuganga', 'element is overwritten, not read');
  console.log('✓ Test 6 passed: DOM brand text is ignored as config');
})();

// 7. HTML carries no config and no cache version: the loader fetches
// fresh JS/CSS on every load with a per-load stamp.
(function testLoaderFresh() {
  for (const name of ['clock.html', 'check-shifts.html']) {
    const html = fs.readFileSync(path.join(BASE, name), 'utf8');
    assert.ok(!/window\.RECORD_[A-Z_]+ =/.test(html), name + ' must not set RECORD_* globals');
    assert.ok(!/CACHE_VERSION/.test(html), name + ' must not version with CACHE_VERSION');
    assert.ok(!/\?v=/.test(html), name + ' must not use ?v= versioning');
    assert.ok(html.includes('var LOAD_STAMP = Date.now();'), name + ' loader must stamp per load');
    const uses = html.match(/\?t=' \+ LOAD_STAMP/g) || [];
    assert.strictEqual(uses.length, 2, name + ' must fetch JS and CSS fresh');
  }
  console.log('✓ Test 7 passed: no config, no versions; fresh JS/CSS per load');
})();

// 8. No DOM scraping remains in the JS.
(function testNoScraping() {
  for (const [name, src] of [['clock-shared.js', sharedSrc], ['clock.js', clockSrc]]) {
    assert.ok(!src.includes('getBrandingFromDom'), name + ' must not scrape branding from DOM');
    assert.ok(!src.includes('sc-brand, .cs-brand'), name + ' must not query brand classes');
  }
  console.log('✓ Test 8 passed: no DOM brand scraping in JS');
})();

// 9. Each page loader fetches shared before its page script, so shared
// always exists when the page script runs.
(function testLoaderOrder() {
  const order = [
    ['clock.html', "'./clock.js'"],
    ['check-shifts.html', "'./check-shifts.js'"]
  ];
  for (const [name, page] of order) {
    const html = fs.readFileSync(path.join(BASE, name), 'utf8');
    const sharedPos = html.indexOf("'./clock-shared.js'");
    const pagePos = html.indexOf(page);
    assert.ok(sharedPos >= 0 && pagePos > sharedPos,
      name + ' must fetch clock-shared.js before ' + page);
  }
  console.log('✓ Test 9 passed: loaders fetch shared before page scripts');
})();

console.log('\nAll tests passed. Branding is defined in the shared JS; no versions remain.');
