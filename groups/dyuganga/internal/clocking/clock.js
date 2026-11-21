(function () {
  'use strict';

  // clock-shared.js always loads first (each page loader fetches its
  // page script only after shared succeeds), so branding and storage keys
  // come straight from it — clock.js keeps no local copies.
  const Shared = window.ClockShared;
  if (!Shared) { throw new Error('Shared helpers not loaded. Load clock-shared.js before clock.js.'); }
  const KEYS = Shared.KEYS;
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const HOURLY_MS = 60 * 60 * 1000;
  const BREAK_MS = 5 * 60 * 1000;
  const CACHE_TTL_MS = 60 * 60 * 1000;
  const NO_SHIFT_TODAY = "You can't start any shift today. Contact admin for details.";
  const COLUMNS = ['Recorded at', 'User', 'Start', 'End', 'Hours', 'Notes', 'Timezone', 'Shift ID'];
  // Record-server endpoint override. Set window.RECORD_SERVER_ENDPOINT
  // before the scripts load to point at another Apps Script deployment
  // (local development); otherwise the built-in deployment URL is used.
  function getDefaultEndpoint() {
    try {
      return window.RECORD_SERVER_ENDPOINT || 'https://script.google.com/macros/s/AKfycbzw7S2068932Jm3LOABbV-IU4oy43FTi6HuMrYTJmx8qspIJv13biVpFAMXdivSzWuwVA/exec';
    } catch (e) {
      return 'https://script.google.com/macros/s/AKfycbzw7S2068932Jm3LOABbV-IU4oy43FTi6HuMrYTJmx8qspIJv13biVpFAMXdivSzWuwVA/exec';
    }
  }
  const DEFAULT_ENDPOINT = getDefaultEndpoint();

  const $ = function (id) { return document.getElementById(id); };
  let currentRecord = null;
  let currentPending = null;
  let ending = false;
  let starting = false;
  let authPrompt = null;
  let usersFetchStarted = false;
  let usersLoaded = false;
  let usersLoadError = false;
  let timerStarted = false;
  let lastTickDate = localDate(new Date());
  let toastTimer = null;
  let audioContext = null;
  let currentNotification = null;
  let titleFlashTimer = null;
  let titleFlashOriginal = null;
  let titleFlashOn = false;
  let testBreakTimer = null;
  let testCountdownTimer = null;

  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // Storage can be unavailable in private mode; the app still works for this session.
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      // Ignore.
    }
  }

  function getPendingList() {
    const value = read(KEYS.pending, null);
    let list = [];
    if (Array.isArray(value)) {
      list = value;
    } else if (value && value.record) {
      list = [value];
    }
    return list.filter(function (item) {
      return item && item.record;
    });
  }

  function savePendingList(list) {
    if (!list.length) {
      remove(KEYS.pending);
    } else {
      write(KEYS.pending, list);
    }
  }

  function addPending(record, error) {
    const list = getPendingList();
    let found = false;
    for (let i = 0; i < list.length; i++) {
      if (list[i].record.id === record.id) {
        list[i] = { record: record, error: error };
        found = true;
        break;
      }
    }
    if (!found) {
      list.push({ record: record, error: error });
    }
    savePendingList(list);
    return list;
  }

  function removePending(id) {
    const list = getPendingList().filter(function (item) {
      return item.record.id !== id;
    });
    savePendingList(list);
    return list;
  }

  function getBreakMap() {
    const map = read(KEYS.breakUntil, {});
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  }

  function getBreakUntil(user) {
    if (!user) {
      return 0;
    }
    return Number(getBreakMap()[user]) || 0;
  }

  function setBreakUntil(user, until) {
    const map = getBreakMap();
    map[user] = until;
    write(KEYS.breakUntil, map);
  }

  function clearBreakUntil(user) {
    const map = getBreakMap();
    delete map[user];
    if (Object.keys(map).length === 0) {
      remove(KEYS.breakUntil);
    } else {
      write(KEYS.breakUntil, map);
    }
  }

  function getDailyMap() {
    const map = read(KEYS.daily, {});
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  }

  function getCachedDailyStatus(user) {
    return getDailyMap()[user] || null;
  }

  function getPendingTodayHours(user, savedIds) {
    const today = localDate(new Date());
    const saved = Array.isArray(savedIds) ? savedIds.map(String) : null;
    return getPendingList().reduce(function (sum, item) {
      const record = item.record;
      if (record.user !== user) {
        return sum;
      }
      if (saved && record.id && saved.indexOf(String(record.id)) !== -1) {
        return sum;
      }
      const startDate = record.start ? String(record.start).slice(0, 10) : '';
      if (startDate !== today) {
        return sum;
      }
      const hours = Number(record.hours);
      return sum + (Number.isFinite(hours) ? hours : 0);
    }, 0);
  }

  // A cached status is fresh only if it is for today AND was fetched within
  // CACHE_TTL_MS. Previously any status dated today counted as fresh
  // forever, so an admin edit to Daily Max in the Personnel sheet never
  // showed up until the next day.
  function isDailyStatusFresh(status) {
    if (!status || status.date !== localDate(new Date())) {
      return false;
    }
    const fetchedAt = Number(status.fetchedAt || 0);
    if (!Number.isFinite(fetchedAt) || fetchedAt <= 0) {
      return false;
    }
    return Date.now() - fetchedAt < CACHE_TTL_MS;
  }

  function getDailyAllowance(user) {
    const status = getCachedDailyStatus(user);
    const max = status ? Number(status.dailyMax) || 0 : 0;
    // Older cached statuses have no dailyMaxSet flag; fall back to the old rule.
    const hasLimit = !!status && (status.dailyMaxSet !== undefined
        ? !!status.dailyMaxSet
        : max > 0);
    const today = localDate(new Date());
    const hasTodayStatus = !!status && status.date === today;
    const fresh = isDailyStatusFresh(status);
    if (!hasTodayStatus) {
      return {
        max: max,
        hasLimit: hasLimit,
        used: 0,
        recorded: 0,
        pendingApproval: 0,
        pendingUpload: 0,
        fresh: false,
        stale: false,
        hasTodayStatus: false
      };
    }
    const recordedTotal = Number(status.todayHours) || 0;
    const pendingApproval = Number(status.todayAddHours) || 0;
    const pendingUpload = getPendingTodayHours(user, status.shiftIds);
    return {
      max: max,
      hasLimit: hasLimit,
      used: recordedTotal + pendingUpload,
      recorded: Math.max(0, recordedTotal - pendingApproval),
      pendingApproval: pendingApproval,
      pendingUpload: pendingUpload,
      // fresh = fetched within CACHE_TTL_MS. stale = a today value that is
      // shown as outdated; it refreshes with the next start/stop response.
      fresh: fresh,
      stale: !fresh,
      hasTodayStatus: true
    };
  }

  function dailyUsageText(allowance) {
    const parts = [];
    if (allowance.recorded > 0) {
      parts.push((Math.round(allowance.recorded * 100) / 100) + 'h approved');
    }
    if (allowance.pendingApproval > 0) {
      parts.push((Math.round(allowance.pendingApproval * 100) / 100) + 'h pending approval');
    }
    if (allowance.pendingUpload > 0) {
      parts.push((Math.round(allowance.pendingUpload * 100) / 100) + 'h waiting to upload');
    }
    return parts.length ? parts.join(' + ') : '0h recorded';
  }

  function formatHours(hours) {
    return (Math.round((Number(hours) || 0) * 100) / 100) + 'h';
  }

  function dailyBlockMessage(allowance) {
    if (allowance.max <= 0) {
      return NO_SHIFT_TODAY;
    }
    return 'Daily maximum of ' + allowance.max + ' hours already reached (' + dailyUsageText(allowance) + ').';
  }

  function renderDailySummary(user, allowance) {
    const dailySummary = $('dailySummary');
    if (!dailySummary || user !== selectedUser()) {
      return;
    }
    const hasLimit = !!user && allowance.hasLimit;
    // Display only: the cached today value, refreshed by start/stop
    // responses. It never gates Start; only the server refuses a start.
    const reached = hasLimit && !!allowance.hasTodayStatus && allowance.used >= allowance.max;
    dailySummary.hidden = !hasLimit;
    dailySummary.classList.toggle('sc-daily-reached', reached);
    if (!hasLimit) {
      return;
    }
    $('dailyMaxValue').textContent = formatHours(allowance.max);
    $('dailyUsedValue').textContent = !allowance.hasTodayStatus
        ? 'will update on start/stop'
        : formatHours(allowance.used) + (allowance.used > 0 ? ' (' + dailyUsageText(allowance) + ')' : '') +
        (allowance.stale ? ' (outdated)' : '');
  }

  function getWorkMap() {
    const map = read(KEYS.work, {});
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  }

  function getWorkState(user) {
    const state = getWorkMap()[user];
    return {
      workMs: state ? Math.max(0, Number(state.workMs) || 0) : 0,
      lastEnd: state ? Number(state.lastEnd) || 0 : 0
    };
  }

  function setWorkState(user, state) {
    const map = getWorkMap();
    map[user] = {
      workMs: Math.max(0, Number(state.workMs) || 0),
      lastEnd: Number(state.lastEnd) || 0
    };
    write(KEYS.work, map);
  }

  function getEffectiveWorkMs(user) {
    const state = getWorkState(user);
    if (state.lastEnd && Date.now() - state.lastEnd >= BREAK_MS) {
      return 0;
    }
    return state.workMs;
  }

  function applyDailyStatus(user, body) {
    if (!body || body.dailyMax === undefined) {
      return null;
    }
    const status = {
      dailyMax: Number(body.dailyMax) || 0,
      dailyMaxSet: body.dailyMaxSet !== undefined
          ? !!body.dailyMaxSet
          : Number(body.dailyMax) > 0,
      todayHours: Number(body.todayHours) || 0,
      todayAddHours: Number(body.todayAddHours) || 0,
      shiftIds: Array.isArray(body.todayIds) ? body.todayIds.map(String) : null,
      timezone: String(body.timezone || ''),
      date: String(body.date || ''),
      fetchedAt: Date.now()
    };
    const map = getDailyMap();
    map[user] = status;
    write(KEYS.daily, map);
    renderDailySummary(user, getDailyAllowance(user));
    return status;
  }

  // NOTE: there is deliberately no standalone dailyStatus fetch on this
  // page. Server communication happens only on Start/End presses (whose
  // responses carry fresh daily totals), the users-list load, and the
  // manual Retry upload button. The cached total is display-only; only
  // the server refuses a start.

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function localDate(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function localTime(date) {
    return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  function localStamp(date) {
    return localDate(date) + ' ' + localTime(date);
  }

  function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours > 0) {
      return hours + 'h ' + pad(minutes) + 'm ' + pad(seconds) + 's';
    }
    return minutes + 'm ' + pad(seconds) + 's';
  }

  function getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (err) {
      return '';
    }
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
      const random = Math.random() * 16 | 0;
      const value = ch === 'x' ? random : (random & 0x3 | 0x8);
      return value.toString(16);
    });
  }

  function getUsersCache() {
    const stored = read(KEYS.users, null);
    if (Array.isArray(stored)) {
      return { users: stored, fetchedAt: 0 };
    }
    if (stored && Array.isArray(stored.users)) {
      return { users: stored.users, fetchedAt: Number(stored.fetchedAt) || 0 };
    }
    return { users: [], fetchedAt: 0 };
  }

  function getUsers() {
    const list = getUsersCache().users;
    const clean = [];
    list.forEach(function (name) {
      const value = String(name).trim();
      if (value && clean.indexOf(value) === -1) {
        clean.push(value);
      }
    });
    return clean;
  }

  function renderUsers() {
    const select = $('userSelect');
    const previous = select.value || String(read(KEYS.selectedUser, '') || '');
    const users = getUsers();
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select user...';
    select.appendChild(placeholder);
    users.forEach(function (name) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    if (users.indexOf(previous) !== -1) {
      select.value = previous;
    }
  }

  function getActiveMap() {
    const map = read(KEYS.active, {});
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  }

  function setActiveShift(shift) {
    const map = getActiveMap();
    map[shift.user] = shift;
    write(KEYS.active, map);
  }

  function clearActiveShift(user) {
    const map = getActiveMap();
    delete map[user];
    write(KEYS.active, map);
  }

  function selectedUser() {
    return $('userSelect').value;
  }

  function activeShift() {
    const user = selectedUser();
    if (!user) {
      return null;
    }
    return getActiveMap()[user] || null;
  }

  function showOver2h(visible) {
    $('over2h').hidden = !visible;
  }

  function tick() {
    const now = new Date();
    $('liveClock').textContent = localTime(now);
    $('liveDate').textContent = now.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const dateText = localDate(now);
    if (dateText !== lastTickDate) {
      lastTickDate = dateText;
      refresh();
    }

    const user = selectedUser();
    const breakUntil = user ? getBreakUntil(user) : 0;
    if (breakUntil && breakUntil <= now.getTime()) {
      clearBreakUntil(user);
      refresh();
      return;
    }

    const shift = activeShift();
    if (!shift) {
      showOver2h(false);
      // No requests here: idle ticks never touch the server (quota).
      return;
    }

    const startMs = new Date(shift.startISO).getTime();
    const elapsed = Math.max(0, now.getTime() - startMs);
    const work = getWorkState(user);
    $('elapsed').textContent = formatDuration(elapsed);
    $('cumulativeWork').textContent = formatDuration(work.workMs + elapsed);

    if (!ending && !starting) {
      // Deliberately no daily-limit check while a shift runs: the limit is
      // enforced at Start (fresh fetch plus a server re-check), and polling
      // the sheet from every tick would burn the free Apps Script quota. A
      // shift that crosses the limit keeps running; the next Start is
      // refused instead. The hourly break below is purely local storage
      // math and costs no requests.
      const hourlyRemainingMs = Math.max(0, HOURLY_MS - work.workMs);
      if (elapsed >= hourlyRemainingMs) {
        autoEndShift(user, shift, 'hourly', 0, new Date(startMs + hourlyRemainingMs));
        return;
      }
    }

    if (elapsed >= TWO_HOURS) {
      showOver2h(true);
      if (!shift.alerted) {
        shift.alerted = true;
        setActiveShift(shift);
        window.alert('This shift has exceeded 2 hours (' + formatDuration(elapsed) + '). Please check that the start time is correct.');
      }
    } else {
      showOver2h(false);
    }
  }

  function refresh() {
    const user = selectedUser();
    const shift = activeShift();
    const breakUntil = user ? getBreakUntil(user) : 0;
    const onBreak = breakUntil > Date.now();
    const allowance = user
        ? getDailyAllowance(user)
        : { max: 0, hasLimit: false, used: 0, fresh: false, stale: false, hasTodayStatus: false };
    // Info only: the cached daily total is shown (summary line + hint) but
    // never disables Start. Only the server refuses a start, when the
    // Try shift start button is pressed. No refresh is kicked off here:
    // totals arrive with start/stop responses.
    const dailyReached = allowance.hasLimit && allowance.hasTodayStatus && allowance.used >= allowance.max;

    renderDailySummary(user, allowance);

    $('startBtn').disabled = !user || !!shift || starting || ending || !!authPrompt || onBreak;
    $('endBtn').disabled = !user || !shift || ending || starting;
    $('activePanel').hidden = !shift;

    const notice = $('startNotice');
    if (notice) {
      if (onBreak) {
        notice.hidden = false;
        notice.textContent = 'Start disabled for a mandatory 5-minute break. It will be enabled at ' + localTime(new Date(breakUntil)) + '.';
      } else {
        notice.hidden = true;
        notice.textContent = '';
      }
    }

    if (shift) {
      $('activeUser').textContent = shift.user;
      $('activeStart').textContent = localStamp(new Date(shift.startISO));
      $('userHint').textContent = 'Shift in progress. Press End shift when the work is finished.';
    } else if (!user) {
      const users = getUsers();
      if (!usersLoaded) {
        $('userHint').textContent = 'Loading users from the Personnel sheet...';
      } else if (usersLoadError) {
        $('userHint').textContent = 'Could not load users. Check the endpoint and reload.';
      } else if (users.length === 0) {
        $('userHint').textContent = 'No users with a pw value found in the Personnel sheet.';
      } else {
        $('userHint').textContent = 'Choose a user to enable the buttons.';
      }
      showOver2h(false);
    } else if (onBreak) {
      $('userHint').textContent = 'Take a break. Start again after ' + localTime(new Date(breakUntil)) + '.';
      showOver2h(false);
    } else if (dailyReached) {
      // Info only: Start stays enabled; the server decides on press.
      $('userHint').textContent = dailyBlockMessage(allowance) + ' The server decides when you press Try shift start.';
      showOver2h(false);
    } else if (authPrompt && authPrompt.user === user) {
      $('userHint').textContent = 'Sign in to start the shift.';
      showOver2h(false);
    } else if (starting) {
      $('userHint').textContent = 'Contacting the server to start the shift...';
      showOver2h(false);
    } else if (getAuth(user)) {
      const effectiveWork = getEffectiveWorkMs(user);
      const workText = effectiveWork > 0
          ? ' Since last break: ' + formatDuration(effectiveWork) + '.'
          : '';
      const usedText = allowance.max > 0
          ? ' Daily max ' + allowance.max + 'h, used ' + (Math.round(allowance.used * 100) / 100) + 'h' +
          (allowance.fresh ? ' (' + dailyUsageText(allowance) + ')' : ' (total may be outdated)') + '.'
          : '';
      $('userHint').textContent = 'Signed in on this browser. Ready to start.' + workText + usedText;
      showOver2h(false);
    } else {
      $('userHint').textContent = 'The password is asked once, on this browser, when you first start.';
      showOver2h(false);
    }

    tick();
  }

  async function startShift() {
    if (starting) {
      return;
    }
    const user = selectedUser();
    if (!user) {
      return;
    }
    const map = getActiveMap();
    if (map[user]) {
      window.alert('A shift is already running for ' + user + '.');
      return;
    }
    ensureAudio();
    ensureNotificationPermission();
    const breakUntil = getBreakUntil(user);
    if (breakUntil > Date.now()) {
      showCriticalAlert('Mandatory break', 'Take a break. Start shift after ' + localTime(new Date(breakUntil)) + '.');
      return;
    }
    const work = getWorkState(user);
    if (work.lastEnd && Date.now() - work.lastEnd >= BREAK_MS) {
      setWorkState(user, { workMs: 0, lastEnd: work.lastEnd });
    }

    starting = true;
    refresh();
    try {
      // Ask for the password (if this browser is not signed in yet) before
      // contacting the server, so the single start request can also sign in.
      const authFields = await getAuthFields(user);
      if (!authFields) {
        return;
      }
      // No client-side limit check and no prefetch: one Start press costs
      // exactly one request, and the server verdict in uploadStart() below is
      // the only enforcement. The shift starts ONLY after a positive server
      // response — a refusal, a transport failure, or an outdated-server
      // reply must never start a local-only shift.
      const now = new Date();
      const shift = {
        id: uuid(),
        user: user,
        startISO: now.toISOString(),
        alerted: false
      };
      try {
        await uploadStart(shift, authFields);
      } catch (err) {
        if (err && err.code === 'AUTH') {
          clearAuth(user);
          showCriticalAlert('Sign-in failed', err.message || 'Please start the shift again.');
        } else if (err && err.code === 'DAILY_MAX') {
          applyResponseMeta(user, err.body);
          const blocked = getDailyAllowance(user);
          showCriticalAlert(
              blocked.hasLimit && blocked.max <= 0 ? 'Cannot start shift' : 'Daily limit reached',
              err.message || dailyBlockMessage(blocked)
          );
        } else if (err && err.code === 'COLLISION') {
          applyResponseMeta(user, err.body);
          showCriticalAlert('Shift not started', err.message || 'A row with this start time already exists.');
        } else {
          if (err && err.body) {
            applyResponseMeta(user, err.body);
          }
          showCriticalAlert('Shift not started',
              (err && err.message ? err.message : 'Could not reach the server.') +
              ' No shift was started; try again.');
        }
        return;
      }
      // Positive server response: the start row exists, so run the clock.
      setActiveShift(shift);
      hideResult();
      toast('Shift started');
      $('endBtn').focus();
    } finally {
      starting = false;
      refresh();
    }
  }

  function endShift() {
    if (ending) {
      return;
    }
    const user = selectedUser();
    const shift = activeShift();
    if (!user || !shift) {
      return;
    }
    finishShift(user, shift, 'manual');
  }

  async function finishShift(user, shift, reason, endTime) {
    if (ending) {
      return;
    }
    ending = true;
    $('endBtn').disabled = true;

    const start = new Date(shift.startISO);
    const end = endTime ? new Date(endTime) : new Date();
    const ms = Math.max(0, end.getTime() - start.getTime());
    const hours = ms / 3600000;
    const priorWork = getWorkState(user);
    const accumulatedWork = priorWork.workMs + ms;
    let breakUntil = 0;

    if (reason === 'hourly') {
      setWorkState(user, { workMs: 0, lastEnd: Date.now() });
    } else if (reason === 'manual' && accumulatedWork >= HOURLY_MS) {
      breakUntil = Date.now() + BREAK_MS;
      setBreakUntil(user, breakUntil);
      setWorkState(user, { workMs: 0, lastEnd: Date.now() });
    } else {
      setWorkState(user, { workMs: accumulatedWork, lastEnd: Date.now() });
    }

    if (breakUntil) {
      showCriticalAlert('Mandatory break', 'Take a break, walk away, look away. Shift ended. Start shift after ' + localTime(new Date(breakUntil)) + '.');
    } else if (reason === 'manual' && hours > 2 && !shift.alerted) {
      shift.alerted = true;
      setActiveShift(shift);
      window.alert('This shift is longer than 2 hours (' + formatDuration(ms) + '). Please check that the times are correct.');
    }

    const record = {
      id: shift.id,
      user: user,
      start: localStamp(start),
      end: localStamp(end),
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      recordedAt: localStamp(end),
      hours: Number(hours.toFixed(6)),
      durationText: formatDuration(ms),
      timezone: getTimezone(),
      notes: '',
      over2h: hours > 2
    };

    clearActiveShift(user);
    refresh();

    addPending(record, 'The upload has not been confirmed yet.');
    renderResult(record, { kind: 'saving' });

    try {
      await uploadRecord(record);
      const remaining = removePending(record.id);
      if (remaining.length) {
        renderPendingError(remaining, 'The latest shift was recorded, but earlier shifts are still pending.');
      } else {
        renderResult(record, { kind: 'success' });
      }
    } catch (err) {
      if (err && err.code === 'COLLISION') {
        const remaining = removePending(record.id);
        renderCollision(record, err.message, remaining);
      } else {
        if (err && err.code === 'AUTH') {
          clearAuth(user);
        }
        const message = err && err.message ? err.message : 'The upload failed.';
        const pending = addPending(record, message);
        renderPendingError(pending, message);
      }
    } finally {
      ending = false;
      refresh();
    }
  }

  function autoEndShift(user, shift, reason, dailyMax, endTime) {
    if (ending || starting) {
      return;
    }
    if (reason === 'hourly') {
      const breakUntil = Date.now() + BREAK_MS;
      setBreakUntil(user, breakUntil);
      showCriticalAlert('Mandatory break', 'Take a break, walk away, look away. Shift ended. Start shift after ' + localTime(new Date(breakUntil)) + '.');
    }
    finishShift(user, shift, reason, endTime);
  }

  function tsvHeader() {
    return COLUMNS.join('\t');
  }

  function tsvRow(record) {
    return [
      record.recordedAt,
      record.user,
      record.start,
      record.end,
      record.hours,
      record.notes || '',
      record.timezone,
      record.id
    ].join('\t');
  }

  function emailText(records) {
    const list = Array.isArray(records) ? records : [records];
    const lines = [
      'Subject: ' + Shared.getBranding().display + ' shift record' + (list.length === 1 ? '' : 's'),
      '',
      'Please add the following row' + (list.length === 1 ? '' : 's') + ' to the shift sheet:',
      tsvHeader()
    ];
    list.forEach(function (record) {
      lines.push(tsvRow(record));
    });
    lines.push('');
    list.forEach(function (record) {
      lines.push('User: ' + record.user + ' | Start: ' + record.start + ' | End: ' + record.end +
          ' | Duration: ' + record.durationText + ' (' + record.hours + ' h) | Shift ID: ' + record.id);
    });
    return lines.join('\n');
  }

  function recordsForCopy() {
    if (currentPending && currentPending.length) {
      return currentPending.map(function (item) {
        return item.record;
      });
    }
    return currentRecord ? [currentRecord] : [];
  }

  function renderResult(record, state) {
    currentRecord = record;
    currentPending = null;
    const card = $('result');
    card.hidden = false;
    $('editShiftLink').hidden = true;
    card.classList.toggle('sc-ok', state.kind === 'success');
    card.classList.remove('sc-error');
    $('retryBtn').hidden = true;
    $('retryBtn').disabled = false;
    $('retryBtn').textContent = 'Retry upload';
    $('dismissBtn').hidden = true;
    $('resultWarn').hidden = !record.over2h;
    $('resultWarn').textContent = record.over2h
        ? 'Warning: this shift is longer than 2 hours (' + record.durationText + ').'
        : '';
    $('dataBlock').textContent = tsvHeader() + '\n' + tsvRow(record);

    if (state.kind === 'saving') {
      $('resultTitle').textContent = 'Saving shift...';
      $('resultMsg').textContent = 'Trying to send ' + record.user + "'s shift to the Google spreadsheet.";
    } else {
      $('resultTitle').textContent = state.title || 'Shift recorded in the spreadsheet';
      $('resultMsg').textContent = state.message || (record.user + ': ' + record.start +
          ' to ' + record.end + ' (' + record.durationText + ', ' + record.hours + ' h).');
    }
  }

  function renderPendingError(list, message) {
    currentPending = list;
    currentRecord = null;
    const card = $('result');
    card.hidden = false;
    $('editShiftLink').hidden = true;
    card.classList.remove('sc-ok');
    card.classList.add('sc-error');
    $('retryBtn').hidden = false;
    $('retryBtn').disabled = false;
    $('retryBtn').textContent = 'Retry upload (' + list.length + ')';
    $('dismissBtn').hidden = false;
    const over2h = list.some(function (item) { return item.record.over2h; });
    $('resultWarn').hidden = !over2h;
    $('resultWarn').textContent = over2h
        ? 'Warning: at least one pending shift is longer than 2 hours.'
        : '';
    $('dataBlock').textContent = tsvHeader() + '\n' + list.map(function (item) {
      return tsvRow(item.record);
    }).join('\n');
    $('resultTitle').textContent = 'Could not save ' + list.length + ' shift' +
        (list.length === 1 ? '' : 's') + ' to the spreadsheet';
    $('resultMsg').textContent = (message || 'The upload failed.') + ' ' + list.length +
        ' shift' + (list.length === 1 ? '' : 's') +
        ' waiting. "Retry upload" sends all of them. Copy the rows below and send them to your manager by email, or paste them into the spreadsheet.';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderCollision(record, message, remaining) {
    currentRecord = record;
    currentPending = null;
    const card = $('result');
    card.hidden = false;
    $('editShiftLink').hidden = false;
    card.classList.remove('sc-ok');
    card.classList.add('sc-error');
    const pendingCount = remaining ? remaining.length : 0;
    $('retryBtn').hidden = pendingCount === 0;
    $('retryBtn').disabled = false;
    $('retryBtn').textContent = 'Retry other pending (' + pendingCount + ')';
    $('dismissBtn').hidden = true;
    $('resultWarn').hidden = !record.over2h;
    $('resultWarn').textContent = record.over2h
        ? 'Warning: this shift is longer than 2 hours (' + record.durationText + ').'
        : '';
    $('dataBlock').textContent = tsvHeader() + '\n' + tsvRow(record);
    $('resultTitle').textContent = 'Shift already exists in the spreadsheet';
    $('resultMsg').textContent = (message || 'A shift with the same start or end time already exists.') +
        ' This write was not saved and will not be retried. Open Check shifts to request a correction.' +
        (pendingCount ? ' ' + pendingCount + ' other pending shift(s) can be retried below.' : '');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideResult() {
    currentRecord = null;
    currentPending = null;
    $('result').hidden = true;
    $('editShiftLink').hidden = true;
    $('retryBtn').hidden = true;
    $('dismissBtn').hidden = true;
  }

  function getEndpoint() {
    return String(DEFAULT_ENDPOINT || '').trim();
  }

  function updateConnectionStatus() {
    const connected = !!getEndpoint();
    const pill = $('connStatus');
    pill.textContent = connected ? 'Spreadsheet connected' : 'Spreadsheet setup needed';
    pill.classList.toggle('sc-ok', connected);
    pill.title = connected
        ? 'Shift rows are sent to the configured Google Apps Script web app.'
        : 'The built-in Google Apps Script endpoint is not configured.';
  }

  // Server requests go through JSONP <script> tags, never fetch(): the Apps
  // Script /exec redirect strips CORS headers, so fetch() POST is blocked
  // even when the deployment is alive. Shape-checked by shared code, so an
  // outdated deployment's generic ping never counts as a positive response.
  async function requestJson(payload) {
    const endpoint = getEndpoint();
    if (!endpoint) {
      throw new Error('The spreadsheet endpoint is not configured.');
    }
    if (navigator.onLine === false) {
      throw new Error('You appear to be offline.');
    }
    const body = await jsonpRequest(endpoint, payload || {});
    return Shared.checkActionBody(payload && payload.action, body);
  }

  // Returns { token } or { password } for the next request, so a single request
  // can carry the sign-in and the shift itself.
  async function getAuthFields(user) {
    const auth = getAuth(user);
    if (auth) {
      return { token: auth.token };
    }
    const password = await requestPassword(user);
    if (!password) {
      return null;
    }
    return { password: password };
  }

  function applyResponseMeta(user, body) {
    if (!body) {
      return;
    }
    if (body.token) {
      setAuth(user, body.token, body.expiresAt);
    }
    applyDailyStatus(user, body);
  }

  function startRecord(shift) {
    const start = new Date(shift.startISO);
    return {
      id: shift.id,
      user: shift.user,
      start: localStamp(start),
      recordedAt: localStamp(start),
      timezone: getTimezone()
    };
  }

  async function uploadStart(shift, authFields) {
    const fields = authFields || await getAuthFields(shift.user);
    if (!fields) {
      throw new Error('Sign-in is required to save this shift.');
    }
    try {
      const body = await requestJson(Object.assign({}, startRecord(shift), fields, {
        action: 'start'
      }));
      applyResponseMeta(shift.user, body);
      return body;
    } catch (err) {
      if (err && err.code === 'AUTH') {
        clearAuth(shift.user);
      }
      throw err;
    }
  }

  async function uploadRecord(record) {
    const fields = await getAuthFields(record.user);
    if (!fields) {
      throw new Error('Sign-in is required to save this shift.');
    }
    try {
      const body = await requestJson(Object.assign({}, record, fields, {
        action: 'shift'
      }));
      applyResponseMeta(record.user, body);
      return body;
    } catch (err) {
      if (err && err.code === 'AUTH') {
        clearAuth(record.user);
      }
      throw err;
    }
  }

  // Manual re-send of queued failed uploads. The only server contact on
  // this page besides Start/End presses and the users-list load.
  async function retryPending() {
    const list = getPendingList();
    if (!list.length) {
      hideResult();
      return;
    }

    $('retryBtn').disabled = true;
    $('resultTitle').textContent = 'Retrying ' + list.length + ' shift' + (list.length === 1 ? '' : 's') + '...';
    $('resultMsg').textContent = 'Sending all pending shifts to the spreadsheet.';
    let successCount = 0;
    let lastRecord = null;
    let lastError = '';
    let collisionRecord = null;
    let collisionError = '';

    for (let i = 0; i < list.length; i++) {
      const record = list[i].record;
      lastRecord = record;
      try {
        await uploadRecord(record);
        removePending(record.id);
        successCount++;
      } catch (err) {
        if (err && err.code === 'AUTH') {
          clearAuth(record.user);
          lastError = err.message || 'Sign-in expired. Please sign in again.';
          addPending(record, lastError);
          break;
        }
        if (err && err.code === 'COLLISION') {
          removePending(record.id);
          collisionRecord = record;
          collisionError = err.message || 'A shift with the same start or end time already exists.';
          continue;
        }
        lastError = err && err.message ? err.message : 'The upload failed.';
        addPending(record, lastError);
      }
    }

    const remaining = getPendingList();
    if (collisionRecord) {
      const message = collisionError + (successCount > 0
          ? ' ' + successCount + ' other shift(s) were uploaded.'
          : '');
      renderCollision(collisionRecord, message, remaining);
    } else if (remaining.length) {
      const message = successCount > 0
          ? successCount + ' shift(s) uploaded; ' + remaining.length + ' still pending. ' + lastError
          : (lastError || 'The upload failed.');
      renderPendingError(remaining, message);
    } else {
      renderResult(lastRecord, {
        kind: 'success',
        title: 'Pending shifts recorded',
        message: 'Uploaded ' + successCount + ' pending shift' + (successCount === 1 ? '' : 's') + '.'
      });
    }
    $('retryBtn').disabled = false;
  }

  function dismissPending() {
    remove(KEYS.pending);
    hideResult();
    toast('Dismissed');
  }

  function toast(text) {
    const element = $('toast');
    element.textContent = text;
    element.classList.add('sc-show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      element.classList.remove('sc-show');
    }, 2200);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable.');
      }
    } catch (err) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy');
      } catch (copyError) {
        window.alert('Copy failed. Please select the text manually.');
      }
      area.remove();
    }
    toast('Copied to clipboard');
  }

  function jsonpRequest(endpoint, params) {
    return new Promise(function (resolve, reject) {
      const query = Object.keys(params || {}).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
      const separator = endpoint.indexOf('?') === -1 ? '?' : '&';
      const bName = Shared.getBranding().name;
      const cbName = bName + 'Cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
      let done = false;
      const script = document.createElement('script');
      function cleanup() {
        try { window.clearTimeout(timer); } catch (e) {}
        try { delete window[cbName]; } catch (e) { try { window[cbName] = undefined; } catch (e2) {} }
        if (script.parentNode) { script.parentNode.removeChild(script); }
      }
      const timer = window.setTimeout(function () {
        if (done) { return; }
        done = true;
        cleanup();
        reject(new Error('Request timed out after 15 seconds.'));
      }, 15000);
      window[cbName] = function (body) {
        if (done) { return; }
        done = true;
        cleanup();
        resolve(body);
      };
      script.onerror = function () {
        if (done) { return; }
        done = true;
        cleanup();
        reject(new Error('Could not reach Google (script failed to load).'));
      };
      script.src = endpoint + separator + query + (query ? '&' : '') + 'callback=' + cbName + '&t=' + Date.now();
      document.head.appendChild(script);
    });
  }

  async function loadUsersFromServer() {
    const endpoint = getEndpoint();
    if (!endpoint) {
      usersLoaded = true;
      usersLoadError = true;
      usersFetchStarted = false;
      refresh();
      return;
    }
    try {
      const body = await jsonpRequest(endpoint, { action: 'users' });
      if (!body || body.ok !== true || !Array.isArray(body.users)) {
        throw new Error(body && body.error ? String(body.error) : 'Unexpected response.');
      }
      // Use the shared clean logic: trim and dedupe
      const clean = [];
      body.users.forEach(function (name) {
        const value = String(name).trim();
        if (value && clean.indexOf(value) === -1) {
          clean.push(value);
        }
      });
      write(KEYS.users, { users: clean, fetchedAt: Date.now() });
      usersLoaded = true;
      usersLoadError = false;
      renderUsers();
      refresh();
    } catch (err) {
      usersLoaded = true;
      usersLoadError = true;
      usersFetchStarted = false;
      refresh();
    }
  }

  function getAuthMap() {
    const map = read(KEYS.auth, {});
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  }

  function getAuth(user) {
    const map = getAuthMap();
    const entry = map[user];
    if (!entry || !entry.token) {
      return null;
    }
    if (entry.expiresAt && entry.expiresAt <= Date.now() + 60000) {
      delete map[user];
      write(KEYS.auth, map);
      return null;
    }
    return entry;
  }

  function setAuth(user, token, expiresAt) {
    const map = getAuthMap();
    map[user] = {
      token: token,
      expiresAt: Number(expiresAt) || (Date.now() + 1000 * 60 * 60 * 24 * 30)
    };
    write(KEYS.auth, map);
  }

  function clearAuth(user) {
    const map = getAuthMap();
    delete map[user];
    if (Object.keys(map).length === 0) {
      remove(KEYS.auth);
    } else {
      write(KEYS.auth, map);
    }
  }

  // Asks for the password and hands it to the caller, which sends it with the
  // start/stop request itself. The server returns a session token with that reply.
  function requestPassword(user) {
    return new Promise(function (resolve) {
      authPrompt = { user: user, resolve: resolve };
      $('authTitle').textContent = 'Sign in as ' + user;
      $('authMsg').textContent = 'Enter the password once. It is sent with this shift, and this browser remembers the session afterwards; the password itself is not stored.';
      $('passwordInput').value = '';
      $('authPanel').hidden = false;
      refresh();
      $('authPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      $('passwordInput').focus();
    });
  }

  function resolveAuth(password) {
    const prompt = authPrompt;
    authPrompt = null;
    $('authPanel').hidden = true;
    $('passwordInput').value = '';
    if (prompt) {
      prompt.resolve(password);
    }
    refresh();
  }

  function submitAuth() {
    if (!authPrompt) {
      return;
    }
    const password = $('passwordInput').value;
    if (!password) {
      $('authMsg').textContent = 'Password is required.';
      return;
    }
    resolveAuth(password);
  }

  function cancelAuth() {
    if (!authPrompt) {
      return;
    }
    resolveAuth(null);
  }

  function ensureAudio() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return null;
    }
    if (!audioContext) {
      try {
        audioContext = new AudioCtor();
      } catch (err) {
        return null;
      }
    }
    if (audioContext.state === 'suspended') {
      try {
        const resume = audioContext.resume();
        if (resume && typeof resume.catch === 'function') {
          resume.catch(function () {});
        }
      } catch (err) {
        // Ignore audio resume failures.
      }
    }
    return audioContext;
  }

  function playBeeps() {
    const ctx = ensureAudio();
    if (!ctx) {
      return;
    }
    const schedule = function () {
      const start = ctx.currentTime;
      [0, 0.4].forEach(function (offset) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, start + offset);
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.35, start + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.25);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start + offset);
        oscillator.stop(start + offset + 0.3);
      });
    };
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      try {
        ctx.resume().then(schedule).catch(function () {});
        return;
      } catch (err) {
        // Fall through and try to schedule directly.
      }
    }
    schedule();
  }

  function ensureNotificationPermission() {
    if (!('Notification' in window) || Notification.permission !== 'default') {
      return;
    }
    try {
      const request = Notification.requestPermission();
      if (request && typeof request.catch === 'function') {
        request.catch(function () {});
      }
    } catch (err) {
      // Ignore unsupported notification prompts.
    }
  }

  function showNotificationNow(title, message) {
    if (!('Notification' in window)) {
      return;
    }
    if (currentNotification) {
      try { currentNotification.close(); } catch (err) {}
      currentNotification = null;
    }
    try {
      currentNotification = new Notification(Shared.getBranding().display + ': ' + title, {
        body: message,
        tag: Shared.getBranding().name + '-shift-alert',
        renotify: true,
        requireInteraction: true,
        silent: true
      });
      currentNotification.onclick = function () {
        try { window.focus(); } catch (err) {}
        try { currentNotification.close(); } catch (err) {}
        currentNotification = null;
      };
    } catch (err) {
      currentNotification = null;
    }
  }

  function showNotification(title, message) {
    if (!('Notification' in window)) {
      return;
    }
    if (Notification.permission === 'granted') {
      showNotificationNow(title, message);
      return;
    }
    if (Notification.permission === 'default') {
      try {
        const request = Notification.requestPermission();
        if (request && typeof request.then === 'function') {
          request.then(function (permission) {
            if (permission === 'granted') {
              showNotificationNow(title, message);
            }
          }).catch(function () {});
        }
      } catch (err) {
        // Ignore.
      }
    }
  }

  function stopTitleFlash() {
    if (titleFlashTimer) {
      window.clearInterval(titleFlashTimer);
      titleFlashTimer = null;
    }
    if (titleFlashOriginal !== null) {
      document.title = titleFlashOriginal;
      titleFlashOriginal = null;
    }
  }

  function startTitleFlash(text) {
    stopTitleFlash();
    titleFlashOriginal = document.title;
    titleFlashOn = true;
    document.title = text;
    titleFlashTimer = window.setInterval(function () {
      titleFlashOn = !titleFlashOn;
      document.title = titleFlashOn ? text : titleFlashOriginal;
    }, 1000);
  }

  function dismissCriticalAlert() {
    const modal = $('criticalAlert');
    if (modal) {
      modal.hidden = true;
    }
    if (currentNotification) {
      try { currentNotification.close(); } catch (err) {}
      currentNotification = null;
    }
    stopTitleFlash();
  }

  function showCriticalAlert(title, message) {
    ensureAudio();
    playBeeps();
    showNotification(title, message);
    startTitleFlash('ALERT: ' + title);
    const modal = $('criticalAlert');
    if (modal) {
      $('criticalAlertTitle').textContent = title;
      $('criticalAlertMsg').textContent = message;
      modal.hidden = false;
      const dismiss = $('criticalAlertDismiss');
      if (dismiss) {
        window.setTimeout(function () {
          try { dismiss.focus(); } catch (err) {}
        }, 0);
      }
    }
  }

  function testStartDate() {
    const input = $('testStartTime');
    if (!input || !input.value) {
      return null;
    }
    const parts = String(input.value).split(':');
    if (parts.length < 2) {
      return null;
    }
    const date = new Date();
    date.setHours(Number(parts[0]) || 0, Number(parts[1]) || 0, 0, 0);
    if (date.getTime() > Date.now()) {
      date.setDate(date.getDate() - 1);
    }
    return date;
  }

  function setTestMessage(text) {
    const element = $('testMsg');
    if (element) {
      element.textContent = text || '';
    }
  }

  function testHourlyBreak(force) {
    ensureAudio();
    ensureNotificationPermission();
    const user = selectedUser();
    if (!user) {
      setTestMessage('Choose a user first.');
      return;
    }
    if (activeShift()) {
      setTestMessage('End the active shift before testing.');
      return;
    }
    const start = testStartDate();
    if (!start && !force) {
      setTestMessage('Choose a shift start time.');
      return;
    }
    const elapsed = start ? Math.max(0, Date.now() - start.getTime()) : HOURLY_MS;
    if (!force && elapsed < HOURLY_MS) {
      setTestMessage('Hourly break is not due yet: ' + formatDuration(elapsed) + ' of 1h.');
      return;
    }
    const breakUntil = Date.now() + BREAK_MS;
    const breakTime = localTime(new Date(breakUntil));
    showCriticalAlert('Test: mandatory break', 'Take a break, walk away, look away. Shift ended. Start shift after ' + breakTime + '. Test only; no real break was set.');
    setTestMessage('Hourly break simulated. Real notice would be: "Start disabled for a mandatory 5-minute break. It will be enabled at ' + breakTime + '." No shift was uploaded and no real break was set.');
  }

  function scheduleTestHourlyBreak() {
    ensureAudio();
    ensureNotificationPermission();
    if (testBreakTimer) {
      window.clearTimeout(testBreakTimer);
      testBreakTimer = null;
    }
    if (testCountdownTimer) {
      window.clearInterval(testCountdownTimer);
      testCountdownTimer = null;
    }
    const button = $('testBreakAfter30Btn');
    const deadline = Date.now() + 30000;
    const updateCountdown = function () {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (button) {
        button.textContent = 'Test hourly break after ' + remaining + ' sec';
      }
      setTestMessage('Hourly break test scheduled. Alert in ' + remaining + ' seconds. Switch to another tab now.');
    };
    if (button) {
      button.disabled = true;
    }
    updateCountdown();
    testCountdownTimer = window.setInterval(updateCountdown, 1000);
    testBreakTimer = window.setTimeout(function () {
      testBreakTimer = null;
      if (testCountdownTimer) {
        window.clearInterval(testCountdownTimer);
        testCountdownTimer = null;
      }
      if (button) {
        button.disabled = false;
        button.textContent = 'Test hourly break after 30 sec';
      }
      testHourlyBreak(true);
    }, 30000);
  }

  function resetTest() {
    const user = selectedUser();
    if (user) {
      clearBreakUntil(user);
    }
    if (testBreakTimer) {
      window.clearTimeout(testBreakTimer);
      testBreakTimer = null;
    }
    if (testCountdownTimer) {
      window.clearInterval(testCountdownTimer);
      testCountdownTimer = null;
    }
    const thirtyButton = $('testBreakAfter30Btn');
    if (thirtyButton) {
      thirtyButton.disabled = false;
      thirtyButton.textContent = 'Test hourly break after 30 sec';
    }
    setTestMessage('');
    refresh();
  }

  function hydrate() {
    renderUsers();
    updateConnectionStatus();

    const storedUser = String(read(KEYS.selectedUser, '') || '');
    if (getUsers().indexOf(storedUser) !== -1 && $('userSelect')) {
      $('userSelect').value = storedUser;
    }

    const testTime = $('testStartTime');
    if (testTime && !testTime.value) {
      const shift = activeShift();
      testTime.value = shift
          ? localTime(new Date(shift.startISO)).slice(0, 5)
          : localTime(new Date(Date.now() - HOURLY_MS)).slice(0, 5);
    }

    refresh();

    const pending = getPendingList();
    if (pending.length) {
      renderPendingError(pending, pending[pending.length - 1].error || 'This shift has not been uploaded yet.');
    }

    // No daily-limit fetch on load: totals arrive with start/stop
    // responses. The users dropdown IS repopulated on every page load;
    // on failure the cached list stays in place (see loadUsersFromServer).
    if (!usersFetchStarted && getEndpoint()) {
      usersFetchStarted = true;
      loadUsersFromServer();
    }

    if (!timerStarted) {
      timerStarted = true;
      window.setInterval(tick, 1000);
    }
  }

  function bindEvents() {
    document.addEventListener('change', function (event) {
      if (event.target && event.target.id === 'userSelect') {
        if (authPrompt) {
          cancelAuth();
        }
        write(KEYS.selectedUser, event.target.value);
        refresh();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && $('criticalAlert') && !$('criticalAlert').hidden) {
        dismissCriticalAlert();
        return;
      }
      if (event.key === 'Enter' && event.target && event.target.id === 'passwordInput') {
        event.preventDefault();
        submitAuth();
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        stopTitleFlash();
      }
    });

    document.addEventListener('click', function (event) {
      if (event.target && event.target.id === 'criticalAlert') {
        dismissCriticalAlert();
        return;
      }
      const button = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!button || !button.id) {
        return;
      }
      const actions = {
        startBtn: startShift,
        endBtn: endShift,
        copyRowBtn: function () {
          const records = recordsForCopy();
          if (records.length) {
            copyText(records.map(tsvRow).join('\n'));
          }
        },
        copyHeaderBtn: function () {
          const records = recordsForCopy();
          if (records.length) {
            copyText(tsvHeader() + '\n' + records.map(tsvRow).join('\n'));
          }
        },
        copyEmailBtn: function () {
          const records = recordsForCopy();
          if (records.length) {
            copyText(emailText(records));
          }
        },
        retryBtn: retryPending,
        dismissBtn: dismissPending,
        signInBtn: submitAuth,
        cancelAuthBtn: cancelAuth,
        testBreakBtn: testHourlyBreak,
        testBreakAfter30Btn: scheduleTestHourlyBreak,
        testResetBtn: resetTest,
        criticalAlertDismiss: dismissCriticalAlert
      };
      if (actions[button.id]) {
        event.preventDefault();
        actions[button.id]();
      }
    });
  }

  bindEvents();
  document.addEventListener('sdThemeDone', hydrate);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
}());
