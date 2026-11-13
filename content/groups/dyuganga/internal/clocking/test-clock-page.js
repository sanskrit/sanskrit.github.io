// test-clock-page.js — headless checks for the Shift Clock page.
//
// Covers:
//  1. Try-shift-start: with a cached explicit-0 block, Start stays ENABLED
//     labeled "Try shift start"; pressing it costs exactly one `start`
//     request; a server DAILY_MAX refusal shows the alert and starts no
//     shift; a server ok starts the shift. No Check again / Test daily limit
//     buttons exist; the manual Retry upload button re-sends queued failed
//     uploads. No dailyStatus request fires outside Start/End presses.
//  2. Users dropdown repopulates on every page load (stale cache is
//     overwritten from the server).
//  3. Endpoint override via window.RECORD_SERVER_ENDPOINT (old global
//     ignored).
//  4. Dynamic CSS loading like the JS loader, incl. candidate fallback.
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

// Stub window.fetch before any page script runs: canned start/shift replies
// and a call log. dailyStatus is answered too (it must never be called).
const FETCH_STUB = `
window.__fetchCalls = [];
window.__startMode = 'refuse';
window.__shiftMode = 'ok';
window.fetch = function (url, opts) {
  let payload = {};
  try { payload = JSON.parse((opts && opts.body) || '{}'); } catch (e) {}
  window.__fetchCalls.push({ url: String(url), action: payload.action || '' });
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const ok = function (body) {
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  };
  if (payload.action === 'start') {
    if (window.__startMode === 'open') {
      return ok({ ok: true, dailyMax: 8, dailyMaxSet: true, todayHours: 0, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' });
    }
    return ok({ ok: false, code: 'DAILY_MAX', error: "You can't start any shift today. Contact admin for details.",
      dailyMax: 0, dailyMaxSet: true, todayHours: 0, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' });
  }
  if (payload.action === 'shift') {
    if (window.__shiftMode === 'fail') {
      return ok({ ok: false, error: 'boom' });
    }
    return ok({ ok: true, dailyMax: 8, dailyMaxSet: true, todayHours: 0.5, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' });
  }
  return ok({ ok: true, dailyMax: 8, dailyMaxSet: true, todayHours: 0, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' });
};
`;

// Users JSONP goes to the real endpoint host via script tags; intercept it
// so the tests are deterministic and offline-safe. Returns hit counter.
async function routeUsers(browser) {
  const ctx = await browser.newContext();
  const hits = { n: 0 };
  const handler = async (route) => {
    const reqUrl = new URL(route.request().url());
    hits.n++;
    const cb = reqUrl.searchParams.get('callback');
    const body = cb
      ? `${cb}(${JSON.stringify({ ok: true, users: STUB_USERS })});`
      : JSON.stringify({ ok: true, users: STUB_USERS });
    await route.fulfill({ status: 200, contentType: 'application/javascript', body });
  };
  await ctx.route('**/script.google.com/**', handler);
  await ctx.route('**/record.example.test/**', handler);
  return { ctx, hits };
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

async function calls(page, action) {
  return page.evaluate((a) => (window.__fetchCalls || []).filter(c => c.action === a).length, action);
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
    const { ctx, hits } = await routeUsers(browser);
    await ctx.addInitScript({ content: FETCH_STUB });
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
    check('users repopulated on load', s.userOptions.includes('stub-user') && s.cacheAge < 60000 && hits.n >= 1,
      { options: s.userOptions, hits: hits.n });
    check('no dailyStatus on load', (await calls(page, 'dailyStatus')) === 0);
    check('no start request before press', (await calls(page, 'start')) === 0);

    await page.click('#startBtn');
    await page.waitForFunction(() => !document.getElementById('criticalAlert').hidden, null, { timeout: 4000 });
    s = await page.evaluate(() => ({
      starts: window.__fetchCalls.filter(c => c.action === 'start').length,
      daily: window.__fetchCalls.filter(c => c.action === 'dailyStatus').length,
      title: document.getElementById('criticalAlertTitle').textContent,
      msg: document.getElementById('criticalAlertMsg').textContent,
      active: !!JSON.parse(localStorage.getItem('dyuganga_clock_active_v1') || '{}').mrunaldatar,
      startDisabled: document.getElementById('startBtn').disabled,
    }));
    check('one Start press costs exactly one request', s.starts === 1, s.starts);
    check('no dailyStatus prefetch on Start', s.daily === 0, s.daily);
    check('server refusal shown', /Cannot start shift/.test(s.title) && /can't start any shift/.test(s.msg), s.title);
    check('refused start runs no shift', s.active === false, s.active);
    check('Start re-enabled after refusal', s.startDisabled === false, s.startDisabled);
    await page.click('#criticalAlertDismiss');

    // ---- Try shift start: server allows ----
    await page.evaluate(() => { window.__startMode = 'open'; });
    await page.click('#startBtn');
    await page.waitForFunction(() => !document.getElementById('activePanel').hidden, null, { timeout: 4000 });
    s = await page.evaluate(() => ({
      starts: window.__fetchCalls.filter(c => c.action === 'start').length,
      daily: window.__fetchCalls.filter(c => c.action === 'dailyStatus').length,
      endDisabled: document.getElementById('endBtn').disabled,
      active: !!JSON.parse(localStorage.getItem('dyuganga_clock_active_v1') || '{}').mrunaldatar,
    }));
    check('allowed start runs the shift', s.active === true && s.endDisabled === false, s);
    check('second press costs one more request, still no dailyStatus', s.starts === 2 && s.daily === 0, s);
    const shot1 = '/tmp/test-try-start.png';
    await page.screenshot({ path: shot1, fullPage: true });
    console.log('screenshot', shot1, fs.statSync(shot1).size);
    await ctx.close();

    // ---- Retry upload: failed End queues, Retry re-sends ----
    const rt = await routeUsers(browser);
    await rt.ctx.addInitScript({ content: FETCH_STUB });
    const pR = await rt.ctx.newPage();
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
    await pR.evaluate(() => { window.__shiftMode = 'fail'; });
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
    await pR.evaluate(() => { window.__shiftMode = 'ok'; });
    await pR.click('#retryBtn');
    await pR.waitForFunction(
      () => document.getElementById('resultTitle').textContent.includes('Pending shifts recorded'),
      null, { timeout: 8000 });
    r = await pR.evaluate(() => ({
      title: document.getElementById('resultTitle').textContent,
      queued: localStorage.getItem('dyuganga_clock_pending_v1'),
      retryHidden: document.getElementById('retryBtn').hidden,
      uploads: window.__fetchCalls.filter(c => c.action === 'shift').length,
    }));
    check('retry uploads the queue', /Pending shifts recorded/.test(r.title) && r.queued === null, r.title);
    check('retry button hides after success', r.retryHidden === true, r.retryHidden);
    check('exactly two shift requests (fail + retry)', r.uploads === 2, r.uploads);
    await rt.ctx.close();

    // ---- Endpoint override via RECORD_SERVER_ENDPOINT ----
    const ov = await routeUsers(browser);
    await ov.ctx.addInitScript({ content: `
      window.RECORD_SERVER_ENDPOINT = 'https://record.example.test/exec';
      window.DYUGANGA_CLOCK_ENDPOINT = 'https://old.example.test/exec';
    ` + FETCH_STUB });
    const pOv = await ov.ctx.newPage();
    await pOv.goto(`http://localhost:${PORT}/clock-override.html`, { waitUntil: 'domcontentloaded' });
    await pOv.evaluate(() => localStorage.clear());
    await pOv.evaluate(seedBlockedAuthed());
    await pOv.reload({ waitUntil: 'domcontentloaded' });
    await pOv.waitForFunction(
      () => Array.from(document.getElementById('userSelect').options).some(o => o.value === 'stub-user'),
      null, { timeout: 8000 });
    await pOv.click('#startBtn');
    await pOv.waitForFunction(
      () => (window.__fetchCalls || []).some(c => c.action === 'start'),
      null, { timeout: 8000 });
    const urls = await pOv.evaluate(() => ({
      starts: (window.__fetchCalls || []).filter(c => c.action === 'start').map(c => c.url),
      shared: window.ClockShared ? window.ClockShared.getEndpoint() : null,
    }));
    check('override: start posted to RECORD_SERVER_ENDPOINT',
      urls.starts.length > 0 && urls.starts.every(u => u.startsWith('https://record.example.test/exec')), urls.starts);
    check('override: old global ignored',
      urls.starts.every(u => !u.startsWith('https://old.example.test/exec')), urls.starts);
    check('override: Shared.getEndpoint() honors it',
      urls.shared === 'https://record.example.test/exec', urls.shared);
    await ov.ctx.close();

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
    const css = await routeUsers(browser);
    const p2 = await css.ctx.newPage();
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
    await css.ctx.close();

    // ---- Dynamic CSS: candidate fallback (./ 404s, ../ loads) ----
    const fbCtx = await browser.newContext();
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
