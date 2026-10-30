(function () {
  'use strict';

  const ENDPOINT = window.DYUGANGA_CHECK_SHIFTS_ENDPOINT ||
    'https://script.google.com/macros/s/AKfycbw7LNoaHRJEktArmanWEN9XMYLC10GYeloiYXYh9RIAz1LELE2MTMxS4muiqPaGhogm6w/exec';
  const AUTH_KEY = 'dyuganga_clock_auth_v1';
  const USERS_KEY = 'dyuganga_clock_users_v1';
  const SELECTED_USER_KEY = 'dyuganga_clock_selected_user_v1';

  const $ = function (id) { return document.getElementById(id); };
  let currentAuth = null;
  let loadingShifts = false;
  let loadingLogin = false;
  let loadingAdd = false;
  let usersFetchStarted = false;
  let shiftsFetchStarted = false;
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
      // Ignore storage failures; the page still works for this session.
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      // Ignore.
    }
  }

  function getAuthMap() {
    const map = read(AUTH_KEY, {});
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  }

  function findAuth() {
    const map = getAuthMap();
    const now = Date.now();
    const names = Object.keys(map);
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const entry = map[name];
      if (entry && entry.token && (!entry.expiresAt || entry.expiresAt > now + 60000)) {
        return { user: name, token: entry.token };
      }
    }
    return null;
  }

  function setAuth(user, token, expiresAt) {
    const map = getAuthMap();
    map[user] = {
      token: token,
      expiresAt: Number(expiresAt) || (Date.now() + 1000 * 60 * 60 * 24 * 30)
    };
    write(AUTH_KEY, map);
  }

  function clearAuth(user) {
    const map = getAuthMap();
    delete map[user];
    if (Object.keys(map).length === 0) {
      remove(AUTH_KEY);
    } else {
      write(AUTH_KEY, map);
    }
  }

  function toast(text) {
    const element = $('csToast');
    if (!element) {
      return;
    }
    element.textContent = text;
    element.classList.add('cs-show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      element.classList.remove('cs-show');
    }, 2200);
  }

  function getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (err) {
      return '';
    }
  }

  async function postJson(payload) {
    if (navigator.onLine === false) {
      throw new Error('You appear to be offline.');
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, 15000);
    let response;
    try {
      response = await fetch(ENDPOINT, {
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

  async function fetchUsers() {
    try {
      const separator = ENDPOINT.indexOf('?') === -1 ? '?' : '&';
      const response = await fetch(ENDPOINT + separator + 'action=users&t=' + Date.now(), {
        redirect: 'follow'
      });
      if (!response.ok) {
        throw new Error('Google returned HTTP ' + response.status + '.');
      }
      const body = await response.json();
      if (!body || body.ok !== true || !Array.isArray(body.users)) {
        throw new Error(body && body.error ? String(body.error) : 'Unexpected response.');
      }
      write(USERS_KEY, body.users);
      return body.users;
    } catch (err) {
      const cached = read(USERS_KEY, []);
      return Array.isArray(cached) ? cached : [];
    }
  }

  function fillSelect(select, users, preferred, placeholder) {
    if (!select) {
      return;
    }
    const previous = select.value || preferred || '';
    select.innerHTML = '';
    const first = document.createElement('option');
    first.value = '';
    first.textContent = placeholder;
    select.appendChild(first);
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

  function renderUserSelects(users) {
    const stored = String(read(SELECTED_USER_KEY, '') || '');
    fillSelect($('csLoginUser'), users, stored, 'Select user...');
  }

  function updateAuthUi() {
    currentAuth = findAuth();
    const loggedIn = !!currentAuth;
    const status = $('csStatus');
    if (status) {
      status.textContent = loggedIn ? 'Signed in as ' + currentAuth.user : 'Sign in to continue';
      status.classList.toggle('cs-ok', loggedIn);
    }
    if ($('csLoginCard')) {
      $('csLoginCard').hidden = loggedIn;
    }
    if ($('csShiftsCard')) {
      $('csShiftsCard').hidden = !loggedIn;
    }
    if ($('csAddCard')) {
      $('csAddCard').hidden = !loggedIn;
    }
    if ($('csViewerMsg')) {
      $('csViewerMsg').textContent = loggedIn
        ? 'Signed in as ' + currentAuth.user + '. Showing your shifts from the last 32 days.'
        : '';
    }
    if ($('csAddUserLabel')) {
      $('csAddUserLabel').textContent = loggedIn ? currentAuth.user : '';
    }
  }

  function handleAuthError() {
    if (currentAuth) {
      clearAuth(currentAuth.user);
    }
    currentAuth = null;
    shiftsFetchStarted = false;
    updateAuthUi();
    if ($('csLoginMsg')) {
      $('csLoginMsg').textContent = 'Session expired. Please sign in again.';
    }
  }

  function renderShifts(shifts) {
    const body = $('csShiftsBody');
    if (!body) {
      return;
    }
    body.innerHTML = '';
    if (!shifts.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 7;
      cell.className = 'cs-empty';
      cell.textContent = 'No shifts in the last 32 days.';
      row.appendChild(cell);
      body.appendChild(row);
      return;
    }

    shifts.forEach(function (shift) {
      const row = document.createElement('tr');

      const user = document.createElement('td');
      user.textContent = shift.user || '';
      row.appendChild(user);

      const start = document.createElement('td');
      start.className = 'cs-time';
      start.textContent = shift.start || '';
      row.appendChild(start);

      const end = document.createElement('td');
      end.className = 'cs-time';
      end.textContent = shift.end || '';
      row.appendChild(end);

      const hours = document.createElement('td');
      hours.className = 'cs-hours';
      hours.textContent = shift.hours === '' || shift.hours === null || shift.hours === undefined
        ? ''
        : String(shift.hours);
      row.appendChild(hours);

      const notes = document.createElement('td');
      notes.className = 'cs-notes';
      notes.textContent = shift.notes || '';
      row.appendChild(notes);

      const pending = document.createElement('td');
      if (shift.pending === 'Delete' || shift.pending === 'Add') {
        const badge = document.createElement('span');
        badge.className = 'cs-pending ' +
          (shift.pending === 'Delete' ? 'cs-pending-delete' : 'cs-pending-add');
        badge.textContent = shift.pending;
        pending.appendChild(badge);
      } else {
        pending.textContent = '-';
      }
      row.appendChild(pending);

      const action = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cs-btn cs-btn-danger cs-btn-small cs-delete-btn';
      button.setAttribute('data-id', shift.id || '');
      button.setAttribute('data-row', String(shift.row));
      if (shift.pending === 'Delete') {
        button.disabled = true;
        button.textContent = 'Delete requested';
      } else {
        button.textContent = 'Request delete';
      }
      action.appendChild(button);
      row.appendChild(action);

      body.appendChild(row);
    });
  }

  async function loadShifts() {
    if (!currentAuth || loadingShifts) {
      return;
    }
    loadingShifts = true;
    const message = $('csShiftsMsg');
    if (message) {
      message.textContent = 'Loading shifts...';
    }
    try {
      const body = await postJson({ action: 'shifts', token: currentAuth.token });
      const shifts = Array.isArray(body.shifts) ? body.shifts : [];
      renderShifts(shifts);
      if (message) {
        message.textContent = shifts.length ? '' : 'No shifts in the last 32 days.';
      }
    } catch (err) {
      if (err && err.code === 'AUTH') {
        handleAuthError();
      } else if (message) {
        message.textContent = 'Could not load shifts: ' + (err.message || 'network error');
      }
    } finally {
      loadingShifts = false;
    }
  }

  async function submitLogin() {
    if (loadingLogin) {
      return;
    }
    const user = $('csLoginUser').value;
    const password = $('csLoginPassword').value;
    const message = $('csLoginMsg');
    if (!user) {
      if (message) {
        message.textContent = 'Choose a user.';
      }
      return;
    }
    if (!password) {
      if (message) {
        message.textContent = 'Password is required.';
      }
      return;
    }

    loadingLogin = true;
    $('csSignInBtn').disabled = true;
    if (message) {
      message.textContent = 'Signing in...';
    }
    try {
      const body = await postJson({ action: 'login', user: user, password: password });
      if (!body.token) {
        throw new Error('The endpoint did not return a session token.');
      }
      setAuth(user, body.token, body.expiresAt);
      write(SELECTED_USER_KEY, user);
      currentAuth = { user: user, token: body.token };
      $('csLoginPassword').value = '';
      if (message) {
        message.textContent = '';
      }
      updateAuthUi();
      shiftsFetchStarted = true;
      toast('Signed in as ' + user);
      await loadShifts();
    } catch (err) {
      if (message) {
        message.textContent = err.message || 'Could not sign in.';
      }
    } finally {
      loadingLogin = false;
      $('csSignInBtn').disabled = false;
    }
  }

  async function requestDelete(id, row, button) {
    if (!currentAuth) {
      return;
    }
    if (!window.confirm('Request deletion of this shift?')) {
      return;
    }
    button.disabled = true;
    const message = $('csShiftsMsg');
    try {
      await postJson({
        action: 'requestDelete',
        token: currentAuth.token,
        id: id || '',
        row: row
      });
      toast('Deletion requested');
      await loadShifts();
    } catch (err) {
      if (err && err.code === 'AUTH') {
        handleAuthError();
      } else {
        button.disabled = false;
        if (message) {
          message.textContent = 'Could not request deletion: ' + (err.message || 'network error');
        }
      }
    }
  }

  function datetimeLocalToStamp(value) {
    if (!value) {
      return '';
    }
    const text = String(value);
    return (text.length === 16 ? text + ':00' : text).replace('T', ' ');
  }

  async function requestAddition() {
    if (!currentAuth || loadingAdd) {
      return;
    }
    const user = currentAuth.user;
    const startValue = $('csAddStart').value;
    const endValue = $('csAddEnd').value;
    const notes = $('csAddNotes').value.trim();
    const message = $('csAddMsg');
    if (!user) {
      if (message) {
        message.textContent = 'Choose a user.';
      }
      return;
    }
    if (!startValue || !endValue) {
      if (message) {
        message.textContent = 'Start and End are required.';
      }
      return;
    }
    const startDate = new Date(startValue);
    const endDate = new Date(endValue);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
      if (message) {
        message.textContent = 'End must be after Start. For a cross-midnight shift, choose the next day for End.';
      }
      return;
    }
    const hours = Math.round(((endDate.getTime() - startDate.getTime()) / 3600000) * 1000000) / 1000000;

    loadingAdd = true;
    $('csAddBtn').disabled = true;
    if (message) {
      message.textContent = 'Requesting addition...';
    }
    try {
      await postJson({
        action: 'requestAdd',
        token: currentAuth.token,
        user: user,
        start: datetimeLocalToStamp(startValue),
        end: datetimeLocalToStamp(endValue),
        hours: hours,
        notes: notes,
        timezone: getTimezone()
      });
      if (message) {
        message.textContent = 'Addition requested. The row is marked Pending = Add.';
      }
      $('csAddNotes').value = '';
      toast('Addition requested');
      await loadShifts();
    } catch (err) {
      if (err && err.code === 'AUTH') {
        handleAuthError();
      } else if (message) {
        if (err && err.code === 'COLLISION') {
          message.textContent = 'A shift with the same start or end time already exists. The existing shift is listed above; request its deletion if needed.';
        } else {
          message.textContent = 'Could not request addition: ' + (err.message || 'network error');
        }
      }
    } finally {
      loadingAdd = false;
      $('csAddBtn').disabled = false;
    }
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      const button = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!button) {
        return;
      }
      if (button.id === 'csSignInBtn') {
        event.preventDefault();
        submitLogin();
        return;
      }
      if (button.id === 'csRefreshBtn') {
        event.preventDefault();
        loadShifts();
        return;
      }
      if (button.id === 'csSignOutBtn') {
        event.preventDefault();
        remove(AUTH_KEY);
        currentAuth = null;
        shiftsFetchStarted = false;
        renderShifts([]);
        updateAuthUi();
        toast('Signed out');
        return;
      }
      if (button.id === 'csAddBtn') {
        event.preventDefault();
        requestAddition();
        return;
      }
      if (button.classList.contains('cs-delete-btn')) {
        event.preventDefault();
        requestDelete(
          button.getAttribute('data-id') || '',
          Number(button.getAttribute('data-row')),
          button
        );
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && event.target && event.target.id === 'csLoginPassword') {
        event.preventDefault();
        submitLogin();
      }
    });
  }

  async function hydrate() {
    updateAuthUi();
    const cached = read(USERS_KEY, []);
    if (Array.isArray(cached) && cached.length) {
      renderUserSelects(cached);
    }
    if (!usersFetchStarted) {
      usersFetchStarted = true;
      fetchUsers().then(function (users) {
        renderUserSelects(users);
        updateAuthUi();
        if (!currentAuth && $('csLoginMsg') && users.length === 0) {
          $('csLoginMsg').textContent = 'No users loaded. Check the Personnel sheet.';
        }
      });
    }
    if (currentAuth && !shiftsFetchStarted) {
      shiftsFetchStarted = true;
      loadShifts();
    }
  }

  bindEvents();
  document.addEventListener('sdThemeDone', hydrate);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
}());
