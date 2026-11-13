(function () {
  'use strict';


  const Shared = window.DyugangaShared;
  if (!Shared) { throw new Error('DyugangaShared not loaded. Load dyuganga-shared.js before check-shifts.js.'); }
  const $ = Shared.$;
  const read = Shared.read;
  const write = Shared.write;
  const remove = Shared.remove;
  const getEndpoint = Shared.getEndpoint;
  const getTimezone = Shared.getTimezone;
  const postJson = Shared.postJson;
  const getAuthMap = Shared.getAuthMap;
  const findAuth = Shared.findAuth;
  const setAuth = Shared.setAuth;
  const clearAuth = Shared.clearAuth;
  const toast = Shared.makeToast(function () { return $('csToast'); }, 'cs-show');
  const AUTH_KEY = Shared.KEYS.auth;
  const USERS_KEY = Shared.KEYS.users;
  const SELECTED_USER_KEY = Shared.KEYS.selectedUser;
  const ENDPOINT = Shared.getEndpoint();
  let currentAuth = null;
  let loadingShifts = false;
  let loadingLogin = false;
  let loadingAdd = false;
  let usersFetchStarted = false;
  let shiftsFetchStarted = false;
  let toastTimer = null;

  async function fetchUsers() {
    try {
      return await Shared.loadUsers();
    } catch (err) {
      try { console.error('[check-shifts] fetchUsers failed:', err); } catch (e) {}
      usersFetchStarted = false;
      return Shared.getUsers();
    }
  }

  function renderUserSelects(users) {
    Shared.fillUserSelect($('csLoginUser'), users, String(read(SELECTED_USER_KEY, '') || ''), 'Select user...');
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
      end.textContent = shift.end || 'in progress';
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

  function violatesBreakRule(user, start, end) {
    const startDate = new Date(String(start).replace(' ', 'T'));
    const endDate = new Date(String(end).replace(' ', 'T'));
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }
    const fiveMinutes = 5 * 60 * 1000;
    return (shifts || []).some(function (other) {
      if (other.user !== user || other.pending === 'Delete') {
        return false;
      }
      const otherStart = new Date(String(other.start || '').replace(' ', 'T'));
      // A row created at clock start has no End yet; treat it as still running.
      const otherEnd = other.end ? new Date(String(other.end).replace(' ', 'T')) : new Date();
      if (isNaN(otherStart.getTime()) || isNaN(otherEnd.getTime())) {
        return false;
      }
      const gapAfter = startDate.getTime() - otherEnd.getTime();
      const gapBefore = otherStart.getTime() - endDate.getTime();
      return !(gapAfter >= fiveMinutes || gapBefore >= fiveMinutes);
    });
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
    if (hours > 1) {
      if (message) {
        message.textContent = 'Additions are limited to 1 hour per shift.';
      }
      return;
    }
    const startStamp = datetimeLocalToStamp(startValue);
    const endStamp = datetimeLocalToStamp(endValue);
    if (violatesBreakRule(user, startStamp, endStamp)) {
      if (message) {
        message.textContent = 'This shift would violate the 5-minute break rule.';
      }
      return;
    }

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
        start: startStamp,
        end: endStamp,
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
    const cached = Shared.getUsers();
    if (cached.length) {
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
