// test-app-script.js — checks for the Apps Script endpoint's response helpers.
//
// The real ContentService.TextOutput has setMimeType/getContent but NO
// setHeaders, so json() must not call it: that TypeError broke EVERY action,
// surfacing in the clock as "Shift not started ... setHeaders is not a
// function. No shift was started; try again."
//
// Loads the real app-script.js with a faithful ContentService stub (only the
// methods the real API has) and exercises json/jsonpOrJson/jsonpText plus the
// dispatch paths that need no spreadsheet access.
// Run: node test-app-script.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'app-script.js'), 'utf8');

// Faithful TextOutput stub: the real API has setMimeType and getContent.
// It deliberately has NO setHeaders — any call to it throws TypeError,
// exactly as in production.
function makeTextOutput(content) {
  return {
    _content: String(content),
    _mime: null,
    setMimeType: function (m) { this._mime = m; return this; },
    getContent: function () { return this._content; },
    getMimeType: function () { return this._mime; }
  };
}
const ContentService = {
  MimeType: { JSON: 'JSON', JAVASCRIPT: 'JAVASCRIPT' },
  createTextOutput: function (content) { return makeTextOutput(content); }
};

const api = new Function(
  'ContentService',
  src + '\nreturn { json: json, jsonpOrJson: jsonpOrJson, jsonpText: jsonpText, doGet: doGet, doPost: doPost };'
)(ContentService);

// 1. json() returns JSON output without throwing.
(function testJson() {
  const out = api.json({ ok: true, n: 1 });
  assert.deepStrictEqual(JSON.parse(out.getContent()), { ok: true, n: 1 });
  assert.strictEqual(out.getMimeType(), 'JSON');
  console.log('✓ Test 1 passed: json() serializes without setHeaders');
})();

// 2. jsonpOrJson() wraps for a safe callback, falls back otherwise.
(function testJsonpOrJson() {
  const good = api.jsonpOrJson({ parameter: { callback: 'dyugangaCb_1' } }, { ok: true });
  assert.strictEqual(good.getContent(), 'dyugangaCb_1({"ok":true});');
  assert.strictEqual(good.getMimeType(), 'JAVASCRIPT');
  const evil = api.jsonpOrJson({ parameter: { callback: 'alert(1)' } }, { ok: true });
  assert.strictEqual(evil.getContent(), '{"ok":true}');
  assert.strictEqual(evil.getMimeType(), 'JSON');
  console.log('✓ Test 2 passed: jsonpOrJson() wraps safe callbacks only');
})();

// 3. jsonpText() rewraps a handler TextOutput as JSONP.
(function testJsonpText() {
  const inner = api.json({ ok: true, date: '2026-11-14' });
  const wrapped = api.jsonpText({ parameter: { callback: 'cb9' } }, inner);
  assert.strictEqual(wrapped.getContent(), 'cb9({"ok":true,"date":"2026-11-14"});');
  assert.strictEqual(wrapped.getMimeType(), 'JAVASCRIPT');
  const plain = api.jsonpText({ parameter: {} }, inner);
  assert.strictEqual(plain.getContent(), '{"ok":true,"date":"2026-11-14"}');
  console.log('✓ Test 3 passed: jsonpText() rewraps handler output');
})();

// 4. doGet with no action answers the live ping.
(function testPing() {
  const out = api.doGet({ parameter: {} });
  const body = JSON.parse(out.getContent());
  assert.strictEqual(body.ok, true);
  assert.ok(/endpoint is live/.test(body.message));
  console.log('✓ Test 4 passed: action-less doGet answers the ping');
})();

// 5. doPost with an unknown action answers ok:false (no spreadsheet touched).
(function testUnknownAction() {
  const out = api.doPost({ postData: { contents: '{"action":"nope"}' } });
  const body = JSON.parse(out.getContent());
  assert.strictEqual(body.ok, false);
  assert.ok(/Unknown action/.test(body.error));
  console.log('✓ Test 5 passed: unknown action gets ok:false, not a TypeError');
})();

console.log('\nAll tests passed. Server responses never touch setHeaders.');
