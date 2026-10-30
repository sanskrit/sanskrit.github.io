(function () {
  'use strict';

  const KEYS = {
    users: 'dyuganga_clock_users_v1',
    active: 'dyuganga_clock_active_v1',
    selectedUser: 'dyuganga_clock_selected_user_v1',
    pending: 'dyuganga_clock_pending_v1',
    auth: 'dyuganga_clock_auth_v1',
    breakUntil: 'dyuganga_clock_break_v1',
    daily: 'dyuganga_clock_daily_v1'
  };
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const HOURLY_MS = 60 * 60 * 1000;
  const BREAK_MS = 5 * 60 * 1000;
  const COLUMNS = ['Recorded at', 'User', 'Start', 'End', 'Hours', 'Notes', 'Timezone', 'Shift ID'];
  const DEFAULT_ENDPOINT = window.DYUGANGA_CLOCK_ENDPOINT || 'https://script.google.com/macros/s/AKfycbw7LNoaHRJEktArmanWEN9XMYLC10GYeloiYXYh9RIAz1LELE2MTMxS4muiqPaGhogm6w/exec';

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
  let dailyFetchStarted = false;
  let lastTickDate = localDate(new Date());
  let toastTimer = null;

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

  function getPendingTodayHours(user) {
    const today = localDate(new Date());
    return getPendingList().reduce(function (sum, item) {
      const record = item.record;
      if (record.user !== user) {
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

  function getDailyAllowance(user) {
    const status = getCachedDailyStatus(user);
    const max = status ? Number(status.dailyMax) || 0 : 0;
    const today = localDate(new Date());
    const todayHours = status && status.date === today ? Number(status.todayHours) || 0 : 0;
    return {
      max: max,
      used: todayHours + getPendingTodayHours(user)
    };
  }

  async function loadDailyStatus(user) {
    const auth = getAuth(user);
    if (!auth) {
      return getCachedDailyStatus(user);
    }
    try {
      const body = await postJson({ action: 'dailyStatus', token: auth.token });
      const status = {
        dailyMax: Number(body.dailyMax) || 0,
        todayHours: Number(body.todayHours) || 0,
        date: String(body.date || ''),
        fetchedAt: Date.now()
      };
      const map = getDailyMap();
      map[user] = status;
      write(KEYS.daily, map);
      return status;
    } catch (err) {
      return getCachedDailyStatus(user);
    }
  }

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

  function getUsers() {
    const stored = read(KEYS.users, null);
    const list = Array.isArray(stored) ? stored : [];
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
      const current = selectedUser();
      if (current && getAuth(current)) {
        loadDailyStatus(current).then(function () {
          refresh();
        });
      }
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
      return;
    }

    const startMs = new Date(shift.startISO).getTime();
    const elapsed = Math.max(0, now.getTime() - startMs);
    $('elapsed').textContent = formatDuration(elapsed);

    if (!ending && !starting) {
      const allowance = getDailyAllowance(user);
      const remainingMs = allowance.max > 0
        ? Math.max(0, (allowance.max - allowance.used) * 3600000)
        : Infinity;
      if (allowance.max > 0 && elapsed >= remainingMs) {
        autoEndShift(user, shift, 'daily-max', allowance.max, new Date(startMs + remainingMs));
        return;
      }
      if (elapsed >= HOURLY_MS) {
        autoEndShift(user, shift, 'hourly', 0, new Date(startMs + HOURLY_MS));
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
    const allowance = user ? getDailyAllowance(user) : { max: 0, used: 0 };
    const dailyReached = allowance.max > 0 && allowance.used >= allowance.max;
    $('startBtn').disabled = !user || !!shift || starting || ending || !!authPrompt || onBreak || dailyReached;
    $('endBtn').disabled = !user || !shift || ending || starting;
    $('activePanel').hidden = !shift;

    const notice = $('startNotice');
    if (notice) {
      if (onBreak) {
        notice.hidden = false;
        notice.textContent = 'Start disabled for a mandatory 5-minute break. It will be enabled at ' + localTime(new Date(breakUntil)) + '.';
      } else if (dailyReached) {
        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 0, 0);
        notice.hidden = false;
        notice.textContent = 'Start disabled: daily maximum of ' + allowance.max + ' hours reached. It will be enabled after midnight at ' + localTime(nextMidnight) + '.';
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
      $('userHint').textContent = 'Daily maximum of ' + allowance.max + ' hours already reached.';
      showOver2h(false);
    } else if (authPrompt && authPrompt.user === user) {
      $('userHint').textContent = 'Sign in to start the shift.';
      showOver2h(false);
    } else if (getAuth(user)) {
      const usedText = allowance.max > 0
        ? ' Daily max ' + allowance.max + 'h, used ' + (Math.round(allowance.used * 100) / 100) + 'h.'
        : '';
      $('userHint').textContent = 'Signed in on this browser. Ready to start.' + usedText;
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
    const breakUntil = getBreakUntil(user);
    if (breakUntil > Date.now()) {
      window.alert('Take a break. Start shift after ' + localTime(new Date(breakUntil)) + '.');
      return;
    }

    starting = true;
    refresh();
    try {
      const token = await ensureAuth(user);
      if (!token) {
        return;
      }
      await loadDailyStatus(user);
      const allowance = getDailyAllowance(user);
      if (allowance.max > 0 && allowance.used >= allowance.max) {
        window.alert('Daily maximum of ' + allowance.max + ' hours already reached.');
        return;
      }
      const now = new Date();
      const shift = {
        id: uuid(),
        user: user,
        startISO: now.toISOString(),
        alerted: false
      };
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

    if (reason === 'manual' && hours > 2 && !shift.alerted) {
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

    loadDailyStatus(user).then(function () {
      refresh();
    });
  }

  function autoEndShift(user, shift, reason, dailyMax, endTime) {
    if (ending || starting) {
      return;
    }
    if (reason === 'hourly') {
      const breakUntil = Date.now() + BREAK_MS;
      setBreakUntil(user, breakUntil);
      window.alert('Take a break, walk away, look away. Shift ended. Start shift after ' + localTime(new Date(breakUntil)) + '.');
    } else if (reason === 'daily-max') {
      window.alert('Daily maximum of ' + dailyMax + ' hours reached. Shift ended.');
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
      'Subject: Dyuganga shift record' + (list.length === 1 ? '' : 's'),
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

  async function postJson(payload) {
    const endpoint = getEndpoint();
    if (!endpoint) {
      throw new Error('The spreadsheet endpoint is not configured.');
    }
    if (navigator.onLine === false) {
      throw new Error('You appear to be offline.');
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, 15000);
    let response;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
        signal: controller.signal
      });
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new Error('The request timed out after 15 seconds.');
      }
      throw new Error('Could not reach Google (network or CORS problem).');
    } finally {
      window.clearTimeout(timeout);
    }

    const text = await response.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch (err) {
      body = null;
    }

    if (!response.ok) {
      throw new Error('Google returned HTTP ' + response.status + '.');
    }
    if (!body || body.ok !== true) {
      const error = new Error(body && body.error ? String(body.error) : 'The spreadsheet endpoint returned an unexpected response.');
      error.code = body && body.code;
      throw error;
    }
    return body;
  }

  async function uploadRecord(record) {
    let auth = getAuth(record.user);
    if (!auth) {
      const token = await ensureAuth(record.user);
      if (!token) {
        throw new Error('Sign-in is required to upload this shift.');
      }
      auth = getAuth(record.user);
    }
    if (!auth) {
      throw new Error('Sign-in is required to upload this shift.');
    }
    try {
      return await postJson(Object.assign({}, record, {
        action: 'shift',
        token: auth.token
      }));
    } catch (err) {
      if (err && err.code === 'AUTH') {
        clearAuth(record.user);
      }
      throw err;
    }
  }

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

  async function loadUsersFromServer() {
    const endpoint = getEndpoint();
    if (!endpoint) {
      usersLoaded = true;
      usersLoadError = true;
      refresh();
      return;
    }
    try {
      const separator = endpoint.indexOf('?') === -1 ? '?' : '&';
      const response = await fetch(endpoint + separator + 'action=users&t=' + Date.now(), {
        redirect: 'follow'
      });
      if (!response.ok) {
        throw new Error('Google returned HTTP ' + response.status + '.');
      }
      const body = await response.json();
      if (!body || body.ok !== true || !Array.isArray(body.users)) {
        throw new Error(body && body.error ? String(body.error) : 'Unexpected response.');
      }
      write(KEYS.users, body.users);
      usersLoaded = true;
      usersLoadError = false;
      renderUsers();
      refresh();
    } catch (err) {
      usersLoaded = true;
      usersLoadError = true;
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

  function ensureAuth(user) {
    const existing = getAuth(user);
    if (existing) {
      return Promise.resolve(existing.token);
    }
    return new Promise(function (resolve) {
      authPrompt = { user: user, resolve: resolve };
      $('authTitle').textContent = 'Sign in as ' + user;
      $('authMsg').textContent = 'Enter the password once. This browser will remember the session; the password itself is not stored.';
      $('passwordInput').value = '';
      $('authPanel').hidden = false;
      refresh();
      $('authPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      $('passwordInput').focus();
    });
  }

  function resolveAuth(token) {
    const prompt = authPrompt;
    authPrompt = null;
    $('authPanel').hidden = true;
    $('passwordInput').value = '';
    if (prompt) {
      prompt.resolve(token);
    }
    refresh();
  }

  async function submitAuth() {
    if (!authPrompt) {
      return;
    }
    const user = authPrompt.user;
    const password = $('passwordInput').value;
    if (!password) {
      $('authMsg').textContent = 'Password is required.';
      return;
    }
    $('signInBtn').disabled = true;
    $('authMsg').textContent = 'Signing in...';
    try {
      const body = await postJson({ action: 'login', user: user, password: password });
      if (!body.token) {
        throw new Error('The spreadsheet endpoint did not return a session token.');
      }
      setAuth(user, body.token, body.expiresAt);
      toast('Signed in as ' + user);
      resolveAuth(body.token);
    } catch (err) {
      $('authMsg').textContent = (err && err.message) ? err.message : 'Could not sign in.';
    } finally {
      $('signInBtn').disabled = false;
    }
  }

  function cancelAuth() {
    if (!authPrompt) {
      return;
    }
    resolveAuth(null);
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

  function testHourlyBreak() {
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
    if (!start) {
      setTestMessage('Choose a shift start time.');
      return;
    }
    const elapsed = Math.max(0, Date.now() - start.getTime());
    if (elapsed < HOURLY_MS) {
      setTestMessage('Hourly break is not due yet: ' + formatDuration(elapsed) + ' of 1h.');
      return;
    }
    const breakUntil = Date.now() + BREAK_MS;
    setBreakUntil(user, breakUntil);
    window.alert('Take a break, walk away, look away. Shift ended. Start shift after ' + localTime(new Date(breakUntil)) + '.');
    setTestMessage('Hourly break simulated. Start is disabled until ' + localTime(new Date(breakUntil)) + '. No shift was uploaded.');
    refresh();
  }

  async function testDailyLimit() {
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
    if (!start) {
      setTestMessage('Choose a shift start time.');
      return;
    }
    if (!getCachedDailyStatus(user)) {
      await loadDailyStatus(user);
    }
    const allowance = getDailyAllowance(user);
    if (allowance.max <= 0) {
      setTestMessage('No daily maximum found for this user. Check the Personnel sheet and sign in.');
      return;
    }
    const elapsedHours = Math.max(0, Date.now() - start.getTime()) / 3600000;
    const used = allowance.used + elapsedHours;
    const usedText = Math.round(used * 100) / 100;
    if (used >= allowance.max) {
      window.alert('Daily maximum of ' + allowance.max + ' hours reached. Shift ended.');
      setTestMessage('Daily maximum reached: ' + usedText + ' of ' + allowance.max + ' h. No shift was uploaded.');
    } else {
      setTestMessage('Daily maximum not reached: ' + usedText + ' of ' + allowance.max + ' h.');
    }
  }

  function resetTest() {
    const user = selectedUser();
    if (user) {
      clearBreakUntil(user);
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

    const currentUser = selectedUser();
    if (!dailyFetchStarted && currentUser && getAuth(currentUser)) {
      dailyFetchStarted = true;
      loadDailyStatus(currentUser).then(function () {
        refresh();
      });
    }

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
        const selected = event.target.value;
        if (selected && getAuth(selected)) {
          loadDailyStatus(selected).then(function () {
            refresh();
          });
        }
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && event.target && event.target.id === 'passwordInput') {
        event.preventDefault();
        submitAuth();
      }
    });

    document.addEventListener('click', function (event) {
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
        testDailyBtn: testDailyLimit,
        testResetBtn: resetTest
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
