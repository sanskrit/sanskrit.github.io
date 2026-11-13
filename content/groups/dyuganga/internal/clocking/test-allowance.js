// Minimal test for dyuganga shift clock daily-limit display logic.
// The cached limit is INFO ONLY: it drives the summary line + hint, and
// NEVER disables Start. Only the server refuses a start (DAILY_MAX).
// Run: node test-allowance.js
'use strict';
const assert = require('assert');

// Mock localStorage
const store = {};
function read(key, fallback) {
  const raw = store[key];
  return raw === undefined ? fallback : JSON.parse(raw);
}
function write(key, value) {
  store[key] = JSON.stringify(value);
}
function remove(key) { delete store[key]; }

const KEYS = {
  daily: 'dyuganga_clock_daily_v1',
  auth: 'dyuganga_clock_auth_v1',
};

// Copied logic from clock.js (current version)
const CACHE_TTL_MS = 60 * 60 * 1000;
function localDate(date) {
  return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
}
function isDailyStatusFresh(status) {
  if (!status || status.date !== localDate(new Date())) return false;
  const fetchedAt = Number(status.fetchedAt || 0);
  if (!Number.isFinite(fetchedAt) || fetchedAt <= 0) return false;
  return Date.now() - fetchedAt < CACHE_TTL_MS;
}
function getCachedDailyStatus(user) {
  const map = read(KEYS.daily, {});
  return map && typeof map === 'object' && !Array.isArray(map) ? map[user] || null : null;
}
function getPendingTodayHours(user, savedIds) {
  return 0; // simplified: no pending in this test
}
function getDailyAllowance(user) {
  const status = getCachedDailyStatus(user);
  const max = status ? Number(status.dailyMax) || 0 : 0;
  const hasLimit = !!status && (status.dailyMaxSet !== undefined ? !!status.dailyMaxSet : max > 0);
  const today = localDate(new Date());
  const hasTodayStatus = !!status && status.date === today;
  const fresh = isDailyStatusFresh(status);
  if (!hasTodayStatus) {
    return { max, hasLimit, used:0, recorded:0, pendingApproval:0, pendingUpload:0, fresh:false, stale:false, hasTodayStatus:false };
  }
  const recordedTotal = Number(status.todayHours) || 0;
  const pendingApproval = Number(status.todayAddHours) || 0;
  const pendingUpload = getPendingTodayHours(user, status.shiftIds);
  return {
    max, hasLimit,
    used: recordedTotal + pendingUpload,
    recorded: Math.max(0, recordedTotal - pendingApproval),
    pendingApproval, pendingUpload,
    fresh, stale: !fresh, hasTodayStatus:true
  };
}
// Info flag for the summary line + hint (never gates Start).
function dailyReachedInfo(user) {
  const allowance = getDailyAllowance(user);
  return allowance.hasLimit && allowance.hasTodayStatus && allowance.used >= allowance.max;
}
// Mirrors clock.js refresh(): the limit plays NO role here.
function startDisabled(user, flags) {
  const f = Object.assign({ shift: null, starting: false, ending: false, authPrompt: null, onBreak: false }, flags);
  return !user || !!f.shift || f.starting || f.ending || !!f.authPrompt || f.onBreak;
}
function endDisabled(user, shift) {
  return !user || !shift;
}

// Helper to set daily cache
function setDaily(user, dailyMax, dailyMaxSet, todayHours, fetchedAt) {
  const map = read(KEYS.daily, {});
  map[user] = {
    dailyMax, dailyMaxSet,
    todayHours: todayHours || 0,
    todayAddHours: 0,
    shiftIds: [],
    timezone: 'Asia/Kolkata',
    date: localDate(new Date()),
    fetchedAt: fetchedAt !== undefined ? fetchedAt : Date.now()
  };
  write(KEYS.daily, map);
}

const USER = 'mrunaldatar';
function reset() { remove(KEYS.daily); remove(KEYS.auth); }

// 1. No cached status: no limit info, Start enabled, End disabled.
(function testNoCache() {
  reset();
  assert.strictEqual(getDailyAllowance(USER).hasLimit, false);
  assert.strictEqual(dailyReachedInfo(USER), false);
  assert.strictEqual(startDisabled(USER, {}), false, 'Start must be ENABLED with no cached limit');
  assert.strictEqual(endDisabled(USER, null), true, 'End disabled with no active shift');
  console.log('✓ Test 1 passed: no cache → Start enabled, End disabled');
})();

// 2. Explicit Daily Max 0: info shows reached, Start STAYS ENABLED (server refuses on press).
(function testExplicitZero() {
  reset();
  setDaily(USER, 0, true, 0, Date.now());
  const a = getDailyAllowance(USER);
  assert.strictEqual(a.hasLimit, true);
  assert.strictEqual(a.max, 0);
  assert.strictEqual(dailyReachedInfo(USER), true, 'info line must show reached');
  assert.strictEqual(startDisabled(USER, {}), false, 'Start must stay ENABLED even for explicit 0');
  console.log('✓ Test 2 passed: explicit 0 → info reached, Start still enabled');
})();

// 3. Empty Daily Max (no limit): nothing shown, Start enabled.
(function testEmptyNoLimit() {
  reset();
  setDaily(USER, 0, false, 0, Date.now());
  assert.strictEqual(getDailyAllowance(USER).hasLimit, false);
  assert.strictEqual(dailyReachedInfo(USER), false);
  assert.strictEqual(startDisabled(USER, {}), false);
  console.log('✓ Test 3 passed: empty Daily Max → no limit, Start enabled');
})();

// 4. Limit not reached: info not reached, Start enabled.
(function testNotReached() {
  reset();
  setDaily(USER, 8, true, 0, Date.now());
  assert.strictEqual(dailyReachedInfo(USER), false);
  assert.strictEqual(startDisabled(USER, {}), false);
  console.log('✓ Test 4 passed: 0/8h → Start enabled');
})();

// 5. Limit reached in cache: info reached, Start STAYS ENABLED (server decides on press).
(function testReachedCached() {
  reset();
  setDaily(USER, 8, true, 8, Date.now());
  assert.strictEqual(dailyReachedInfo(USER), true);
  assert.strictEqual(startDisabled(USER, {}), false, 'cached reached must NOT disable Start');
  console.log('✓ Test 5 passed: cached 8/8h → Start still enabled');
})();

// 6. Break still disables Start (bound includes break completion).
(function testBreak() {
  reset();
  setDaily(USER, 8, true, 0, Date.now());
  assert.strictEqual(startDisabled(USER, { onBreak: true }), true, 'break must disable Start');
  assert.strictEqual(endDisabled(USER, null), true);
  console.log('✓ Test 6 passed: break → Start disabled');
})();

// 7. Active shift: Start disabled, End enabled — regardless of cached limit.
(function testActiveShift() {
  reset();
  setDaily(USER, 0, true, 0, Date.now()); // even explicit 0 in cache...
  assert.strictEqual(startDisabled(USER, { shift: { id: 'x' } }), true);
  assert.strictEqual(endDisabled(USER, { id: 'x' }), false);
  console.log('✓ Test 7 passed: active shift → Start disabled, End enabled');
})();

// 8. Stale cache is flagged outdated for display, never blocks.
(function testStale() {
  reset();
  setDaily(USER, 8, true, 8, Date.now() - 2*60*60*1000);
  const a = getDailyAllowance(USER);
  assert.strictEqual(a.stale, true, 'old cache must read stale for display');
  assert.strictEqual(startDisabled(USER, {}), false);
  console.log('✓ Test 8 passed: stale cache → outdated display, Start enabled');
})();

console.log('\nAll tests passed. Cached daily limit is display-only; Start is gated only by user/shift/break/inflight state, and only the server refuses a start.');
