// test-shift-quota.js — headless checks that NOTHING hits the record server
// except Start/End presses and the users-list load (quota protection), and
// that the purely local hourly break auto-end still works.
//
//  1. Active shift with an already-exceeded cached daily limit: load fires
//     no dailyStatus at all, 3.5s of ticks fire zero requests, and the shift
//     is NOT auto-ended.
//  2. Hourly break: cumulative work 2s short of an hour auto-ends the shift
//     locally within seconds, sets the 5-minute break, and costs exactly the
//     one unavoidable shift-upload request (zero dailyStatus polls).
//
// Run: node test-shift-quota.js (needs playwright; see test-clock-page.js).
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
const PORT = 8776;

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

const FETCH_STUB = `
window.__fetchCalls = [];
window.fetch = function (url, opts) {
  let payload = {};
  try { payload = JSON.parse((opts && opts.body) || '{}'); } catch (e) {}
  window.__fetchCalls.push({ url: String(url), action: payload.action || '' });
  const d = new Date();
  const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const body = payload.action === 'shift'
    ? { ok: true, dailyMax: 8, dailyMaxSet: true, todayHours: 0.5, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' }
    : { ok: true, dailyMax: 1, dailyMaxSet: true, todayHours: 1, todayAddHours: 0, todayIds: [], date: today, timezone: 'Asia/Kolkata' };
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
};
`;

function seedBase() {
  return `
    localStorage.setItem('dyuganga_clock_users_v1', JSON.stringify({ users: ['mrunaldatar'], fetchedAt: Date.now() }));
    localStorage.setItem('dyuganga_clock_selected_user_v1', JSON.stringify('mrunaldatar'));
    localStorage.setItem('dyuganga_clock_auth_v1', JSON.stringify({ mrunaldatar: { token: 'tok', expiresAt: Date.now() + 86400000 } }));
    localStorage.removeItem('dyuganga_clock_break_v1');
    localStorage.removeItem('dyuganga_clock_pending_v1');
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

  const routeUsers = async (ctx) => {
    await ctx.route('**/script.google.com/**', async (route) => {
      const cb = new URL(route.request().url()).searchParams.get('callback');
      const body = cb
        ? `${cb}(${JSON.stringify({ ok: true, users: ['mrunaldatar'] })});`
        : JSON.stringify({ ok: true, users: ['mrunaldatar'] });
      await route.fulfill({ status: 200, contentType: 'application/javascript', body });
    });
  };

  try {
    // ---- 1. Exceeded limit + active shift: no polls, no auto-end ----
    const ctx = await browser.newContext();
    await routeUsers(ctx);
    await ctx.addInitScript({ content: FETCH_STUB });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}/clock.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(seedBase() + `
      (function () {
        const d = new Date();
        const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        localStorage.setItem('dyuganga_clock_daily_v1', JSON.stringify({ mrunaldatar: {
          dailyMax: 1, dailyMaxSet: true, todayHours: 1, todayAddHours: 0, shiftIds: [],
          timezone: 'Asia/Kolkata', date: today, fetchedAt: Date.now() } }));
        localStorage.setItem('dyuganga_clock_active_v1', JSON.stringify({ mrunaldatar: {
          id: 'quota-test-shift', user: 'mrunaldatar',
          startISO: new Date(Date.now() - 60000).toISOString(), alerted: false } }));
        localStorage.setItem('dyuganga_clock_work_v1', JSON.stringify({ mrunaldatar: { workMs: 0, lastEnd: 0 } }));
      })();
    `);
    await page.reload({ waitUntil: 'domcontentloaded' });
    // Load must fire no dailyStatus at all; then 3.5s of ticks (old code
    // auto-ended on the first tick here) must add none either.
    await page.waitForTimeout(1000);
    const settled = await page.evaluate(() => ({
      daily: window.__fetchCalls.filter(c => c.action === 'dailyStatus').length,
      total: window.__fetchCalls.length,
    }));
    check('load: zero dailyStatus requests', settled.daily === 0, settled);
    await page.waitForTimeout(3500);
    const after = await page.evaluate(() => ({
      daily: window.__fetchCalls.filter(c => c.action === 'dailyStatus').length,
      total: window.__fetchCalls.length,
      active: !!JSON.parse(localStorage.getItem('dyuganga_clock_active_v1') || '{}').mrunaldatar,
      panelHidden: document.getElementById('activePanel').hidden,
    }));
    check('mid-shift: still zero requests', after.daily === 0 && after.total === 0, after);
    check('mid-shift: exceeded shift NOT auto-ended', after.active === true && after.panelHidden === false, after);
    await ctx.close();

    // ---- 2. Hourly break still auto-ends locally ----
    const ctx2 = await browser.newContext();
    await routeUsers(ctx2);
    await ctx2.addInitScript({ content: FETCH_STUB });
    const p2 = await ctx2.newPage();
    await p2.goto(`http://localhost:${PORT}/clock.html`, { waitUntil: 'domcontentloaded' });
    await p2.evaluate(() => localStorage.clear());
    await p2.evaluate(seedBase() + `
      (function () {
        const d = new Date();
        const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        localStorage.setItem('dyuganga_clock_daily_v1', JSON.stringify({ mrunaldatar: {
          dailyMax: 8, dailyMaxSet: true, todayHours: 0, todayAddHours: 0, shiftIds: [],
          timezone: 'Asia/Kolkata', date: today, fetchedAt: Date.now() } }));
        localStorage.setItem('dyuganga_clock_active_v1', JSON.stringify({ mrunaldatar: {
          id: 'hourly-test-shift', user: 'mrunaldatar',
          startISO: new Date().toISOString(), alerted: false } }));
        localStorage.setItem('dyuganga_clock_work_v1', JSON.stringify({ mrunaldatar: { workMs: 3600000 - 2000, lastEnd: Date.now() } }));
      })();
    `);
    await p2.reload({ waitUntil: 'domcontentloaded' });
    // Wait for boot (panel visible with the seeded shift) BEFORE waiting for
    // the auto-end: the static HTML starts hidden, so waiting for hidden
    // first would resolve vacuously before the app loads.
    await p2.waitForFunction(() => document.getElementById('activePanel').hidden === false, null, { timeout: 10000 });
    await p2.waitForFunction(() => document.getElementById('activePanel').hidden === true, null, { timeout: 10000 });
    await p2.waitForTimeout(600);
    const h = await p2.evaluate(() => ({
      active: !!JSON.parse(localStorage.getItem('dyuganga_clock_active_v1') || '{}').mrunaldatar,
      startDisabled: document.getElementById('startBtn').disabled,
      notice: document.getElementById('startNotice').textContent,
      daily: window.__fetchCalls.filter(c => c.action === 'dailyStatus').length,
      uploads: window.__fetchCalls.filter(c => c.action === 'shift').length,
    }));
    check('hourly: shift auto-ended', h.active === false, h.active);
    check('hourly: 5-min break set', h.startDisabled === true && /break/.test(h.notice), h.notice);
    check('hourly: zero dailyStatus polls', h.daily === 0, h.daily);
    check('hourly: exactly one shift upload', h.uploads === 1, h.uploads);
    await ctx2.close();
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
});
