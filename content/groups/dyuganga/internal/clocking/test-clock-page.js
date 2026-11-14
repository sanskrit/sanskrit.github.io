// test-clock-page.js — headless checks for the Shift Clock page.
//
// Covers:
//  1. Try-shift-start: with a cached explicit-0 block, Start stays ENABLED
//     labeled "Try shift start"; pressing it costs exactly one `start`
//     request; a server DAILY_MAX refusal shows the alert and starts no
//     shift; a transport failure (no server answer at all) also starts no
//     shift — the clock runs ONLY after a positive server response; a
//     server ok starts the shift. No Check again / Test daily limit
//     buttons exist; the manual Retry upload button re-sends queued failed
//     uploads. No dailyStatus request fires outside Start/End presses.
//  2. Transport: every server call is a JSONP <script> request
//     (CORS-immune); window.fetch is never used.
//  3. Users dropdown repopulates on every page load (stale cache is
//     overwritten from the server).
//  4. Endpoint override via window.RECORD_SERVER_ENDPOINT (old global
//     ignored).
//  5. Dynamic CSS loading like the JS loader, incl. candidate fallback.
//
// Run: node test-clock-page.js
// Needs: playwright module + a Chromium build. It first tries
// /tmp/verify-clock/node_modules/playwright (this dev machine's install),
// then a plain require('playwright'). Browsers resolve via
// PLAYWRIGHT_BROWSERS_PATH or playwright's default cache.
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

const BASE = __dirname; // staged fix dir
const PORT = 8773;
const STUB_USERS = ['mrunaldatar', 'stub-user'];

function send(res, full) {
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    const ext = path.extname(full);
    const type = ext === '.html' ? 'text/html'
      : ext === '.js' ? 'text/javascript'
      : ext === '.css' ? 'text/css' : 'text/plain';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  // /deep/deep.html serves clock.html from a nested path to exercise the
  // CSS/JS candidate fallback: ./clock.css 404s, ../clock.css hits /clock.css.
  if (url === '/deep/deep.html') { return send(res, path.join(BASE, 'clock.html')); }
  // /clock-override.html serves clock.html with the inline endpoint line
  // stripped, so a test-set window.RECORD_SERVER_ENDPOINT is the only value.
  if (url === '/clock-override.html') {
    const html = fs.readFileSync(path.join(BASE, 'clock.html'), 'utf8');
    const stripped = html.replace(/window\.RECORD_SERVER_ENDPOINT = '[^']*';/, '/* stripped for override test */');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(stripped);
    return;
  }
  if (url.startsWith('/deep/')) { res.writeHead(404); res.end('not found'); return; }
  const name = path.basename(url);
  if (['clock.html', 'check-shifts.html', 'clock.js', 'clock-shared.js',
       'check-shifts.js', 'clock.css', 'check-shifts.css'].includes(name)) {
    return send(res, path.join(BASE, name));
  }
  res.writeHead(404);
  res.end('not found');
});

// fetch() must never be used: the Apps Script /exec redirect strips CORS
// headers, so every server call goes through JSONP <script> tags instead.
// Block fetch outright so any regression fails loudly; the route stub below
// answers the JSONP requests.
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

// Node-side endpoint stub: answers the page's JSONP <script> requests.
// stub = { startMode: 'refuse'|'open'|'fail', shiftMode: 'ok'|'fail',
// calls: [{ action, url }] }. 'fail' aborts the request (transport
// failure: no server answer at all).
function endpointHandler(stub) {
  return async (route) => {
    const reqUrl = new URL(route.request().url());
    const action = reqUrl.searchParams.get('action') || '';
    const cb = reqUrl.searchParams.get('callback');
    stub.calls.push({ action: action, url: route.request().url() });
    if (action === 'start' && stub.startMode === 'fail') {
      await route.abort('connectionrefused');
      return;
    }
    const today = todayStamp();
    let body;
    if (action === 'users') {
      body = { ok: true, users: STUB_USERS };
    } else if (action === 'start') {
      body = stub.startMode === 'open'
        ? { ok: true, dailyMax: 8, dailyMaxSet: true, todayHours: 0, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' }
        : { ok: false, code: 'DAILY_MAX', error: "You can't start any shift today. Contact admin for details.",
            dailyMax: 0, dailyMaxSet: true, todayHours: 0, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' };
    } else if (action === 'shift') {
      body = stub.shiftMode === 'fail'
        ? { ok: false, error: 'boom' }
        : { ok: true, dailyMax: 8, dailyMaxSet: true, todayHours: 0.5, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' };
    } else if (action === 'dailyStatus') {
      body = { ok: true, user: 'mrunaldatar', dailyMax: 8, dailyMaxSet: true, todayHours: 0, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' };
    } else {
      body = { ok: false, error: 'Unknown action: ' + action };
    }
    const text = cb ? `${cb}(${JSON.stringify(body)});` : JSON.stringify(body);
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: text });
  };
}

async function routeEndpoint(browser, stub) {
  const ctx = await browser.newContext();
  const handler = endpointHandler(stub);
  await ctx.route('**/script.google.com/**', handler);
  await ctx.route('**/record.example.test/**', handler);
  return ctx;
}

function countCalls(stub, action) {
  return stub.calls.filter((c) => c.action === action).length;
}

function seedBlockedAuthed() {
  // mrunaldatar, signed in, cached explicit-0 block for today.
  return `
    localStorage.setItem('dyuganga_clock_auth_v1', JSON.stringify({ mrunaldatar: { token: 'tok', expiresAt: Date.now() + 86400000 } }));
    localStorage.setItem('dyuganga_clock_selected_user_v1', JSON.stringify('mrunaldatar'));
    (function () {
      const d = new Date();
      const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const map = { mrunaldatar: { dailyMax: 0, dailyMaxSet: true, todayHours: 0, todayAddHours: 0, shiftIds: [], timezone: 'Asia/Kolkata', date: today, fetchedAt: Date.now() } };
      localStorage.setItem('dyuganga_clock_daily_v1', JSON.stringify(map));
    })();
    localStorage.removeItem('dyuganga_clock_active_v1');
    localStorage.removeItem('dyuganga_clock_break_v1');
    localStorage.removeItem('dyuganga_clock_pending_v1');
    localStorage.removeItem('dyuganga_clock_work_v1');
  `;
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
    // ---- Try shift start: server refuses ----
    const stub = { startMode: 'refuse', shiftMode: 'ok', calls: [] };
    const ctx = await routeEndpoint(browser, stub);
    await ctx.addInitScript({ content: FETCH_GUARD });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}/clock.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    // Stale users cache: must be overwritten by the load-time repopulate.
    await page.evaluate(() => {
      localStorage.setItem('dyuganga_clock_users_v1', JSON.stringify({ users: ['mrunaldatar'], fetchedAt: Date.now() - 86400000 }));
    });
    await page.evaluate(seedBlockedAuthed());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => Array.from(document.getElementById('userSelect').options).some(o => o.value === 'stub-user'),
      null, { timeout: 8000 });
    await page.waitForTimeout(1200); // let any stray background traffic happen

    let s = await page.evaluate(() => ({
      startLabel: document.getElementById('startBtn').textContent,
      startDisabled: document.getElementById('startBtn').disabled,
      noCheckAgain: !document.getElementById('checkAgainBtn'),
      hasRetry: !!document.getElementById('retryBtn'),
      noTestDaily: !document.getElementById('testDailyBtn'),
      dailyVisible: !document.getElementById('dailySummary').hidden,
      dailyOrange: document.getElementById('dailySummary').className.includes('sc-daily-reached'),
      hint: document.getElementById('userHint').textContent,
      userOptions: Array.from(document.getElementById('userSelect').options).map(o => o.value),
      cacheAge: Date.now() - JSON.parse(localStorage.getItem('dyuganga_clock_users_v1')).fetchedAt,
    }));
    check('blocked cached: Start ENABLED (info only)', s.startDisabled === false, s.startDisabled);
    check('button renamed to Try shift start', s.startLabel === 'Try shift start', s.startLabel);
    check('no Check again button', s.noCheckAgain === true);
    check('Retry upload button present', s.hasRetry === true);
    check('no Test daily limit button', s.noTestDaily === true);
    check('daily line shown orange as info', s.dailyVisible && s.dailyOrange, s.dailyVisible);
    check('hint says server decides', /server decides/.test(s.hint), s.hint);
    check('users repopulated on load', s.userOptions.includes('stub-user') && s.cacheAge < 60000 && countCalls(stub, 'users') >= 1,
      { options: s.userOptions, users: countCalls(stub, 'users') });
    check('no dailyStatus on load', countCalls(stub, 'dailyStatus') === 0);
    check('no start request before press', countCalls(stub, 'start') === 0);

    await page.click('#startBtn');
    await page.waitForFunction(() => !document.getElementById('criticalAlert').hidden, null, { timeout: 4000 });
    s = await page.evaluate(() => ({
      title: document.getElementById('criticalAlertTitle').textContent,
      msg: document.getElementById('criticalAlertMsg').textContent,
      active: !!JSON.parse(localStorage.getItem('dyuganga_clock_active_v1') || '{}').mrunaldatar,
      startDisabled: document.getElementById('startBtn').disabled,
    }));
    check('one Start press costs exactly one request', countCalls(stub, 'start') === 1, countCalls(stub, 'start'));
    check('no dailyStatus prefetch on Start', countCalls(stub, 'dailyStatus') === 0, countCalls(stub, 'dailyStatus'));
    check('server refusal shown', /Cannot start shift/.test(s.title) && /can't start any shift/.test(s.msg), s.title);
    check('refused start runs no shift', s.active === false, s.active);
    check('Start re-enabled after refusal', s.startDisabled === false, s.startDisabled);
    await page.click('#criticalAlertDismiss');

    // ---- Try shift start: transport failure starts nothing ----
    stub.startMode = 'fail';
    await page.click('#startBtn');
    await page.waitForFunction(() => !document.getElementById('criticalAlert').hidden, null, { timeout: 8000 });
    s = await page.evaluate(() => ({
      title: document.getElementById('criticalAlertTitle').textContent,
      msg: document.getElementById('criticalAlertMsg').textContent,
      active: !!JSON.parse(localStorage.getItem('dyuganga_clock_active_v1') || '{}').mrunaldatar,
      startDisabled: document.getElementById('startBtn').disabled,
    }));
    check('failed press costs one request', countCalls(stub, 'start') === 2, countCalls(stub, 'start'));
    check('failed start shows no-shift alert',
      /Shift not started/.test(s.title) && /No shift was started/.test(s.msg), s);
    check('failed start runs no shift', s.active === false, s.active);
    check('Start re-enabled after failure', s.startDisabled === false, s.startDisabled);
    await page.click('#criticalAlertDismiss');

    // ---- Try shift start: server allows ----
    stub.startMode = 'open';
    await page.click('#startBtn');
    await page.waitForFunction(() => !document.getElementById('activePanel').hidden, null, { timeout: 4000 });
    s = await page.evaluate(() => ({
      endDisabled: document.getElementById('endBtn').disabled,
      active: !!JSON.parse(localStorage.getItem('dyuganga_clock_active_v1') || '{}').mrunaldatar,
      fetchCalls: window.__fetchCalls.length,
    }));
    check('allowed start runs the shift', s.active === true && s.endDisabled === false, s);
    check('third press costs one more request, still no dailyStatus',
      countCalls(stub, 'start') === 3 && countCalls(stub, 'dailyStatus') === 0,
      { starts: countCalls(stub, 'start'), daily: countCalls(stub, 'dailyStatus') });
    check('no fetch() calls: all server traffic is JSONP', s.fetchCalls === 0, s.fetchCalls);
    const shot1 = '/tmp/test-try-start.png';
    await page.screenshot({ path: shot1, fullPage: true });
    console.log('screenshot', shot1, fs.statSync(shot1).size);
    await ctx.close();

    // ---- Retry upload: failed End queues, Retry re-sends ----
    const stubR = { startMode: 'refuse', shiftMode: 'ok', calls: [] };
    const ctxR = await routeEndpoint(browser, stubR);
    await ctxR.addInitScript({ content: FETCH_GUARD });
    const pR = await ctxR.newPage();
    await pR.goto(`http://localhost:${PORT}/clock.html`, { waitUntil: 'domcontentloaded' });
    await pR.evaluate(() => localStorage.clear());
    await pR.evaluate(seedBlockedAuthed() + `
      (function () {
        const d = new Date();
        const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        localStorage.setItem('dyuganga_clock_daily_v1', JSON.stringify({ mrunaldatar: {
          dailyMax: 8, dailyMaxSet: true, todayHours: 0, todayAddHours: 0, shiftIds: [],
          timezone: 'Asia/Kolkata', date: today, fetchedAt: Date.now() } }));
        localStorage.setItem('dyuganga_clock_active_v1', JSON.stringify({ mrunaldatar: {
          id: 'retry-test-shift', user: 'mrunaldatar',
          startISO: new Date(Date.now() - 60000).toISOString(), alerted: false } }));
        localStorage.setItem('dyuganga_clock_work_v1', JSON.stringify({ mrunaldatar: { workMs: 0, lastEnd: 0 } }));
      })();
    `);
    await pR.reload({ waitUntil: 'domcontentloaded' });
    await pR.waitForFunction(() => !document.getElementById('endBtn').disabled, null, { timeout: 8000 });
    stubR.shiftMode = 'fail';
    await pR.click('#endBtn');
    await pR.waitForFunction(
      () => !document.getElementById('result').hidden && !document.getElementById('retryBtn').hidden,
      null, { timeout: 8000 });
    let r = await pR.evaluate(() => ({
      title: document.getElementById('resultTitle').textContent,
      retryLabel: document.getElementById('retryBtn').textContent,
      queued: JSON.parse(localStorage.getItem('dyuganga_clock_pending_v1') || '[]').length,
    }));
    check('failed End queues the shift', /Could not save/.test(r.title) && r.queued === 1, r);
    check('retry button shows the count', r.retryLabel === 'Retry upload (1)', r.retryLabel);
    stubR.shiftMode = 'ok';
    await pR.click('#retryBtn');
    await pR.waitForFunction(
      () => document.getElementById('resultTitle').textContent.includes('Pending shifts recorded'),
      null, { timeout: 8000 });
    r = await pR.evaluate(() => ({
      title: document.getElementById('resultTitle').textContent,
      queued: localStorage.getItem('dyuganga_clock_pending_v1'),
      retryHidden: document.getElementById('retryBtn').hidden,
    }));
    check('retry uploads the queue', /Pending shifts recorded/.test(r.title) && r.queued === null, r.title);
    check('retry button hides after success', r.retryHidden === true, r.retryHidden);
    check('exactly two shift requests (fail + retry)', countCalls(stubR, 'shift') === 2, countCalls(stubR, 'shift'));
    await ctxR.close();

    // ---- Endpoint override via RECORD_SERVER_ENDPOINT ----
    const stubO = { startMode: 'refuse', shiftMode: 'ok', calls: [] };
    const ctxO = await routeEndpoint(browser, stubO);
    await ctxO.addInitScript({ content: `
      window.RECORD_SERVER_ENDPOINT = 'https://record.example.test/exec';
      window.DYUGANGA_CLOCK_ENDPOINT = 'https://old.example.test/exec';
    ` + FETCH_GUARD });
    const pOv = await ctxO.newPage();
    await pOv.goto(`http://localhost:${PORT}/clock-override.html`, { waitUntil: 'domcontentloaded' });
    await pOv.evaluate(() => localStorage.clear());
    await pOv.evaluate(seedBlockedAuthed());
    await pOv.reload({ waitUntil: 'domcontentloaded' });
    await pOv.waitForFunction(
      () => Array.from(document.getElementById('userSelect').options).some(o => o.value === 'stub-user'),
      null, { timeout: 8000 });
    await pOv.click('#startBtn');
    await pOv.waitForFunction(
      () => !document.getElementById('criticalAlert').hidden,
      null, { timeout: 8000 });
    const urls = {
      starts: stubO.calls.filter((c) => c.action === 'start').map((c) => c.url),
      shared: await pOv.evaluate(() => (window.ClockShared ? window.ClockShared.getEndpoint() : null)),
    };
    check('override: start posted to RECORD_SERVER_ENDPOINT',
      urls.starts.length > 0 && urls.starts.every(u => u.startsWith('https://record.example.test/exec')), urls.starts);
    check('override: old global ignored',
      urls.starts.every(u => !u.startsWith('https://old.example.test/exec')), urls.starts);
    check('override: Shared.getEndpoint() honors it',
      urls.shared === 'https://record.example.test/exec', urls.shared);
    await ctxO.close();

    // ---- Dynamic CSS: raw HTML has no static link ----
    for (const name of ['clock.html', 'check-shifts.html']) {
      const raw = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${PORT}/${name}`, (res) => {
          let body = '';
          res.on('data', c => { body += c; });
          res.on('end', () => resolve(body));
        }).on('error', reject);
      });
      check(`${name}: no static <link> element`, !/<link\s+rel[\s=]/.test(raw));
      check(`${name}: no inline <style>`, !/<style[\s>]/.test(raw));
      check(`${name}: has loadCss loader`, raw.includes('loadCss('));
    }

    // ---- Dynamic CSS: DOM link created by loader ----
    const cssStub = { startMode: 'refuse', shiftMode: 'ok', calls: [] };
    const cssCtx = await routeEndpoint(browser, cssStub);
    const p2 = await cssCtx.newPage();
    await p2.goto(`http://localhost:${PORT}/clock.html`, { waitUntil: 'domcontentloaded' });
    await p2.waitForFunction(() => document.querySelectorAll('link[href*=".css"]').length === 1, null, { timeout: 4000 });
    const cssState = await p2.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[href*=".css"]'));
      return {
        n: links.length,
        dyn: links[0] && links[0].getAttribute('data-dyn-css'),
        inHead: links[0] && links[0].parentElement === document.head,
        rules: (() => { try { return links[0].sheet ? links[0].sheet.cssRules.length : 0; } catch (e) { return -1; } })(),
      };
    });
    check('clock.css: exactly one loader stylesheet', cssState.n === 1 && cssState.dyn === '1' && cssState.inHead === true, cssState);
    check('clock.css: rules loaded', cssState.rules > 10, cssState.rules);
    await cssCtx.close();

    // ---- Dynamic CSS: candidate fallback (./ 404s, ../ loads) ----
    const fbStub = { startMode: 'refuse', shiftMode: 'ok', calls: [] };
    const fbCtx = await routeEndpoint(browser, fbStub);
    const p3 = await fbCtx.newPage();
    await p3.goto(`http://localhost:${PORT}/deep/deep.html`, { waitUntil: 'domcontentloaded' });
    await p3.waitForFunction(() => document.querySelectorAll('link[href*=".css"]').length === 1, null, { timeout: 6000 });
    const fb = await p3.evaluate(() => {
      const l = document.querySelector('link[href*=".css"]');
      return {
        pathname: l ? new URL(l.href).pathname : null,
        rules: (() => { try { return l.sheet ? l.sheet.cssRules.length : 0; } catch (e) { return -1; } })(),
      };
    });
    check('css fallback: resolved via ../ candidate', fb.pathname === '/clock.css', fb);
    check('css fallback: rules loaded', fb.rules > 10, fb.rules);
    await fbCtx.close();
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
});

