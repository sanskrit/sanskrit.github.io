(function () {
  'use strict';

  const KEYS = {
    users: 'dyuganga_clock_users_v1',
    active: 'dyuganga_clock_active_v1',
    selectedUser: 'dyuganga_clock_selected_user_v1',
    pending: 'dyuganga_clock_pending_v1',
    auth: 'dyuganga_clock_auth_v1'
  };
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const COLUMNS = ['Recorded at', 'User', 'Date', 'Start', 'End', 'Hours', 'Notes', 'Timezone', 'Shift ID'];
  const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw7LNoaHRJEktArmanWEN9XMYLC10GYeloiYXYh9RIAz1LELE2MTMxS4muiqPaGhogm6w/exec';

  const $ = function (id) { return document.getElementById(id); };
  let currentRecord = null;
  let ending = false;
  let starting = false;
  let authPrompt = null;
  let usersFetchStarted = false;
  let usersLoaded = false;
  let usersLoadError = false;
  let timerStarted = false;
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

    const shift = activeShift();
    if (!shift) {
      showOver2h(false);
      return;
    }

    const elapsed = Math.max(0, now.getTime() - new Date(shift.startISO).getTime());
    $('elapsed').textContent = formatDuration(elapsed);

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
    $('startBtn').disabled = !user || !!shift || starting || ending || !!authPrompt;
    $('endBtn').disabled = !user || !shift || ending || starting;
    $('activePanel').hidden = !shift;

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
    } else if (authPrompt && authPrompt.user === user) {
      $('userHint').textContent = 'Sign in to start the shift.';
      showOver2h(false);
    } else if (getAuth(user)) {
      $('userHint').textContent = 'Signed in on this browser. Ready to start.';
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

    starting = true;
    refresh();
    try {
      const token = await ensureAuth(user);
      if (!token) {
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

  async function endShift() {
    if (ending) {
      return;
    }
    const user = selectedUser();
    const shift = activeShift();
    if (!user || !shift) {
      return;
    }

    ending = true;
    $('endBtn').disabled = true;

    const start = new Date(shift.startISO);
    const end = new Date();
    const ms = Math.max(0, end.getTime() - start.getTime());
    const hours = ms / 3600000;

    if (hours > 2 && !shift.alerted) {
      shift.alerted = true;
      setActiveShift(shift);
      window.alert('This shift is longer than 2 hours (' + formatDuration(ms) + '). Please check that the times are correct.');
    }

    const record = {
      id: shift.id,
      user: user,
      date: localDate(start),
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

    write(KEYS.pending, { record: record, error: 'The upload has not been confirmed yet.' });
    renderResult(record, { kind: 'saving' });

    try {
      await uploadRecord(record);
      const pending = read(KEYS.pending, null);
      if (pending && pending.record && pending.record.id === record.id) {
        remove(KEYS.pending);
      }
      renderResult(record, { kind: 'success' });
    } catch (err) {
      if (err && err.code === 'AUTH') {
        clearAuth(user);
      }
      const message = err && err.message ? err.message : 'The upload failed.';
      write(KEYS.pending, { record: record, error: message });
      renderResult(record, { kind: 'error', error: message });
    } finally {
      ending = false;
      refresh();
    }
  }

  function tsvHeader() {
    return COLUMNS.join('\t');
  }

  function tsvRow(record) {
    return [
      record.recordedAt,
      record.user,
      record.date,
      record.start,
      record.end,
      record.hours,
      record.notes || '',
      record.timezone,
      record.id
    ].join('\t');
  }

  function telegramText(record) {
    return [
      'Dyuganga shift record',
      'User: ' + record.user,
      'Date: ' + record.date,
      'Start: ' + record.start,
      'End: ' + record.end,
      'Duration: ' + record.durationText + ' (' + record.hours + ' h)',
      'Timezone: ' + record.timezone,
      'Shift ID: ' + record.id,
      '',
      'Spreadsheet row (TSV):',
      tsvHeader(),
      tsvRow(record)
    ].join('\n');
  }

  function renderResult(record, state) {
    currentRecord = record;
    const card = $('result');
    card.hidden = false;
    card.classList.toggle('sc-ok', state.kind === 'success');
    card.classList.toggle('sc-error', state.kind === 'error');
    $('retryBtn').hidden = state.kind !== 'error';
    $('dismissBtn').hidden = state.kind !== 'error';
    $('resultWarn').hidden = !record.over2h;
    $('resultWarn').textContent = record.over2h
      ? 'Warning: this shift is longer than 2 hours (' + record.durationText + ').'
      : '';
    $('dataBlock').textContent = tsvHeader() + '\n' + tsvRow(record);

    if (state.kind === 'saving') {
      $('resultTitle').textContent = 'Saving shift...';
      $('resultMsg').textContent = 'Trying to send ' + record.user + "'s shift to the Google spreadsheet.";
    } else if (state.kind === 'success') {
      $('resultTitle').textContent = 'Shift recorded in the spreadsheet';
      $('resultMsg').textContent = record.user + ': ' + record.start +
        ' to ' + record.end + ' (' + record.durationText + ', ' + record.hours + ' h).';
    } else {
      $('resultTitle').textContent = 'Could not save to the spreadsheet';
      $('resultMsg').textContent = (state.error || 'The upload failed.') +
        ' The shift data is safe below. Copy it and send it to your manager on Telegram, or paste it into the spreadsheet.';
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function hideResult() {
    currentRecord = null;
    $('result').hidden = true;
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
    const pending = read(KEYS.pending, null);
    if (!pending || !pending.record) {
      hideResult();
      return;
    }
    const record = pending.record;
    $('retryBtn').disabled = true;
    renderResult(record, { kind: 'saving' });
    try {
      await uploadRecord(record);
      const current = read(KEYS.pending, null);
      if (current && current.record && current.record.id === record.id) {
        remove(KEYS.pending);
      }
      renderResult(record, { kind: 'success' });
    } catch (err) {
      if (err && err.code === 'AUTH') {
        clearAuth(record.user);
      }
      const message = err && err.message ? err.message : 'The upload failed.';
      write(KEYS.pending, { record: record, error: message });
      renderResult(record, { kind: 'error', error: message });
    } finally {
      $('retryBtn').disabled = false;
    }
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

  function hydrate() {
    renderUsers();
    updateConnectionStatus();

    const storedUser = String(read(KEYS.selectedUser, '') || '');
    if (getUsers().indexOf(storedUser) !== -1 && $('userSelect')) {
      $('userSelect').value = storedUser;
    }

    refresh();

    const pending = read(KEYS.pending, null);
    if (pending && pending.record) {
      renderResult(pending.record, {
        kind: 'error',
        error: pending.error || 'This shift has not been uploaded yet.'
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
          if (currentRecord) {
            copyText(tsvRow(currentRecord));
          }
        },
        copyHeaderBtn: function () {
          if (currentRecord) {
            copyText(tsvHeader() + '\n' + tsvRow(currentRecord));
          }
        },
        copyTelegramBtn: function () {
          if (currentRecord) {
            copyText(telegramText(currentRecord));
          }
        },
        retryBtn: retryPending,
        dismissBtn: dismissPending,
        signInBtn: submitAuth,
        cancelAuthBtn: cancelAuth
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
