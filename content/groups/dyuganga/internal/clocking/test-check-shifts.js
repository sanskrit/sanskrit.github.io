// test-check-shifts.js — headless checks for the Check shifts page.
//
// Covers the addition flow, which consults the loaded shift list for the
// client-side 5-minute break check:
//  1. Requesting an addition clear of existing shifts sends exactly one
//     `requestAdd` request and reports success (no page error).
//  2. Requesting an addition within 5 minutes of an existing shift is
//     refused client-side with the break message and sends nothing.
//
// All server traffic is JSONP <script> requests (CORS-immune); window.fetch
// is blocked outright, so any fetch regression fails loudly.
//
// Run: node test-check-shifts.js (needs playwright; see test-clock-page.js).
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

let playwright;
try {
  playwright = require('/tmp/verify-clock/node_modules/playwright');
} catch (e) {
  playwright = require('playwright');
}
const { chromium } = playwright;

const BASE = __dirname;
const PORT = 8777;
const STUB_USERS = ['mrunaldatar', 'stub-user'];

const server = http.createServer((req, res) => {
  const name = path.basename(req.url.split('?')[0]);
  fs.readFile(path.join(BASE, name), (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    const ext = path.extname(name);
    const type = ext === '.html' ? 'text/html'
      : ext === '.js' ? 'text/javascript'
      : ext === '.css' ? 'text/css' : 'text/plain';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

const FETCH_GUARD = `
window.__fetchCalls = [];
window.fetch = function () {
  window.__fetchCalls.push(Array.prototype.map.call(arguments, String).join(' '));
  return Promise.reject(new TypeError('fetch is blocked in tests: use JSONP.'));
};
`;

function todayStamp() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// One existing shift today, 10:00–10:30, for the break-gap checks.
function stubShifts() {
  const today = todayStamp();
  return [{
    row: 2,
    recordedAt: today + ' 10:31:00',
    user: 'mrunaldatar',
    start: today + ' 10:00:00',
    end: today + ' 10:30:00',
    hours: 0.5,
    notes: '',
    timezone: 'Asia/Kolkata',
    id: 'seed-shift-1',
    pending: ''
  }];
}

function endpointHandler(stub) {
  return async (route) => {
    const reqUrl = new URL(route.request().url());
    const action = reqUrl.searchParams.get('action') || '';
    const cb = reqUrl.searchParams.get('callback');
    stub.calls.push({ action: action, url: route.request().url() });
    let body;
    if (action === 'users') {
      body = { ok: true, users: STUB_USERS };
    } else if (action === 'login') {
      body = { ok: true, token: 'tok', user: 'mrunaldatar', expiresAt: Date.now() + 86400000 };
    } else if (action === 'shifts') {
      body = { ok: true, shifts: stubShifts(), cutoff: '2000-01-01' };
    } else if (action === 'requestAdd') {
      body = { ok: true, requested: true };
    } else {
      body = { ok: false, error: 'Unknown action: ' + action };
    }
    const text = cb ? `${cb}(${JSON.stringify(body)});` : JSON.stringify(body);
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: text });
  };
}

function countCalls(stub, action) {
  return stub.calls.filter((c) => c.action === action).length;
}

server.listen(PORT, async () => {
  console.log('test server on', PORT);
  let failures = 0;
  const check = (name, cond, extra) => {
    console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
    if (!cond) failures++;
  };
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    const stub = { calls: [] };
    const ctx = await browser.newContext();
    const handler = endpointHandler(stub);
    await ctx.route('**/script.google.com/**', handler);
    await ctx.route('**/record.example.test/**', handler);
    await ctx.addInitScript({ content: FETCH_GUARD });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err && err.message || err)));
    await page.goto(`http://localhost:${PORT}/check-shifts.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Sign in.
    await page.waitForFunction(
      () => Array.from(document.getElementById('csLoginUser').options).some(o => o.value === 'mrunaldatar'),
      null, { timeout: 8000 });
    await page.selectOption('#csLoginUser', 'mrunaldatar');
    await page.fill('#csLoginPassword', 'pw');
    await page.click('#csSignInBtn');
    await page.waitForFunction(
      () => document.querySelectorAll('#csShiftsBody tr').length === 1 &&
            !document.getElementById('csAddCard').hidden,
      null, { timeout: 8000 });
    check('sign-in loads the shift list', countCalls(stub, 'shifts') >= 1, countCalls(stub, 'shifts'));

    const today = todayStamp();

    // ---- 1. Addition clear of existing shifts is sent ----
    await page.fill('#csAddStart', today + 'T12:00');
    await page.fill('#csAddEnd', today + 'T12:30');
    await page.click('#csAddBtn');
    await page.waitForFunction(
      () => document.getElementById('csAddMsg').textContent.includes('Addition requested'),
      null, { timeout: 8000 });
    let s = await page.evaluate(() => ({
      msg: document.getElementById('csAddMsg').textContent,
      btnDisabled: document.getElementById('csAddBtn').disabled,
      fetchCalls: window.__fetchCalls.length,
    }));
    check('clear addition sends one requestAdd', countCalls(stub, 'requestAdd') === 1, countCalls(stub, 'requestAdd'));
    check('clear addition reports success', /Addition requested/.test(s.msg), s.msg);
    check('add button re-enabled after success', s.btnDisabled === false, s.btnDisabled);
    check('no page error on clear addition', pageErrors.length === 0, pageErrors);
    check('no fetch() calls: all server traffic is JSONP', s.fetchCalls === 0, s.fetchCalls);

    // ---- 2. Addition inside the 5-minute gap is refused client-side ----
    const addsBefore = countCalls(stub, 'requestAdd');
    await page.fill('#csAddStart', today + 'T10:32');
    await page.fill('#csAddEnd', today + 'T10:40');
    await page.click('#csAddBtn');
    await page.waitForFunction(
      () => document.getElementById('csAddMsg').textContent.includes('5-minute break rule'),
      null, { timeout: 8000 });
    s = await page.evaluate(() => ({
      msg: document.getElementById('csAddMsg').textContent,
      btnDisabled: document.getElementById('csAddBtn').disabled,
    }));
    check('gap violation refused without a request', countCalls(stub, 'requestAdd') === addsBefore,
      countCalls(stub, 'requestAdd'));
    check('gap violation shows the break message', /5-minute break rule/.test(s.msg), s.msg);
    check('add button usable after refusal', s.btnDisabled === false, s.btnDisabled);
    check('no page error on gap violation', pageErrors.length === 0, pageErrors);

    await ctx.close();
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
});
