const SPREADSHEET_ID = '1QxaP2bOIECnTphgmYgjxlD1tVyZA1zbHJKx4b78VKl0';
const PERSONNEL_SHEET = 'Personnel';
const SHIFTS_SHEET = 'Shifts';
const SHIFT_HEADERS = ['Recorded at', 'User', 'Start', 'End', 'Hours', 'Notes', 'Timezone', 'Shift ID', 'Pending'];
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 180;
const MAX_FAILURES = 8;
const FAILURE_WINDOW_SECONDS = 600;

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'users') {
    try {
      return json({ ok: true, users: listUsers() });
    } catch (err) {
      return json({ ok: false, error: String(err) });
    }
  }
  return json({ ok: true, message: 'Dyuganga shift clock endpoint is live.' });
}

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    const action = data.action || 'shift';
    if (action === 'login') {
      return login(data);
    }
    if (action === 'shift') {
      return appendShift(data);
    }
    if (action === 'dailyStatus') {
      return getDailyStatus(data);
    }
    if (action === 'shifts') {
      return listShifts(data);
    }
    if (action === 'requestDelete') {
      return requestDeleteShift(data);
    }
    if (action === 'requestAdd') {
      return requestAddShift(data);
    }
    return json({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function login(data) {
  const user = String(data.user || '').trim();
  const password = String(data.password || '').trim();
  if (!user || !password) {
    return json({ ok: false, code: 'AUTH', error: 'User and password are required.' });
  }
  if (tooManyFailures(user)) {
    return json({ ok: false, code: 'AUTH', error: 'Too many failed attempts. Try again in a few minutes.' });
  }
  const record = getUserRecord(user);
  if (!record || record.password !== password) {
    recordFailure(user);
    return json({ ok: false, code: 'AUTH', error: 'Wrong user or password.' });
  }
  clearFailures(user);
  return json({
    ok: true,
    token: issueToken(user),
    user: user,
    expiresAt: Date.now() + TOKEN_TTL_MS
  });
}

function appendShift(data) {
  const auth = verifyToken(data.token);
  if (!auth || auth.u !== data.user) {
    return json({ ok: false, code: 'AUTH', error: 'Sign-in expired. Please sign in again.' });
  }
  if (!data.start || !data.end) {
    return json({ ok: false, error: 'Missing required shift fields.' });
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getShiftsSheet(spreadsheet);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    ensureShiftHeaders(sheet);
    const collision = findShiftCollision(sheet, getHeaders(sheet), auth.u, data.start, data.end, data.id);
    if (collision) {
      return json({
        ok: false,
        code: 'COLLISION',
        error: 'A shift for this user with the same start or end time already exists.'
      });
    }
    const inserted = insertShiftRow(sheet, {
      'Recorded at': data.recordedAt || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      'User': auth.u,
      'Start': data.start,
      'End': data.end,
      'Hours': data.hours,
      'Notes': data.notes || '',
      'Timezone': data.timezone || Session.getScriptTimeZone(),
      'Shift ID': data.id || ''
    });
    if (!inserted) {
      return json({ ok: true, duplicate: true });
    }
  } finally {
    lock.releaseLock();
  }

  return json({ ok: true });
}

function listShifts(data) {
  const auth = verifyToken(data.token);
  if (!auth) {
    return json({ ok: false, code: 'AUTH', error: 'Sign-in expired. Please sign in again.' });
  }
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getShiftsSheet(spreadsheet);
  ensureShiftHeaders(sheet);
  const cutoff = cutoffDateText();
  if (sheet.getLastRow() < 2) {
    return json({ ok: true, shifts: [], cutoff: cutoff });
  }

  const headers = getHeaders(sheet);
  const columns = {
    recordedAt: findColumn(headers, 'Recorded at'),
    user: findColumn(headers, 'User'),
    start: findColumn(headers, 'Start'),
    end: findColumn(headers, 'End'),
    hours: findColumn(headers, 'Hours'),
    notes: findColumn(headers, 'Notes'),
    timezone: findColumn(headers, 'Timezone'),
    id: findColumn(headers, 'Shift ID'),
    pending: findColumn(headers, 'Pending')
  };
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  const shifts = [];
  const authUser = String(auth.u || '').trim();

  values.forEach(function (row, index) {
    const rowUser = columns.user > 0 ? String(row[columns.user - 1] || '').trim() : '';
    if (rowUser !== authUser) {
      return;
    }
    const recorded = columns.recordedAt > 0 ? row[columns.recordedAt - 1] : '';
    const recordedDate = datePart(recorded);
    if (!recordedDate || recordedDate < cutoff) {
      return;
    }
    const hoursValue = columns.hours > 0 ? row[columns.hours - 1] : '';
    const hours = Number(hoursValue);
    shifts.push({
      row: index + 2,
      recordedAt: displayValue(recorded),
      user: rowUser,
      start: columns.start > 0 ? displayValue(row[columns.start - 1]) : '',
      end: columns.end > 0 ? displayValue(row[columns.end - 1]) : '',
      hours: Number.isFinite(hours) ? hours : String(hoursValue || ''),
      notes: columns.notes > 0 ? String(row[columns.notes - 1] || '') : '',
      timezone: columns.timezone > 0 ? String(row[columns.timezone - 1] || '') : '',
      id: columns.id > 0 ? String(row[columns.id - 1] || '') : '',
      pending: columns.pending > 0 ? String(row[columns.pending - 1] || '') : ''
    });
  });

  return json({ ok: true, shifts: shifts, cutoff: cutoff });
}

function requestDeleteShift(data) {
  const auth = verifyToken(data.token);
  if (!auth) {
    return json({ ok: false, code: 'AUTH', error: 'Sign-in expired. Please sign in again.' });
  }
  const shiftId = String(data.id || '').trim();
  let row = Number(data.row);

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getShiftsSheet(spreadsheet);
  ensureShiftHeaders(sheet);
  const headers = getHeaders(sheet);

  if (shiftId) {
    const idColumn = findColumn(headers, 'Shift ID');
    if (idColumn > 0) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
          if (String(ids[i][0] || '').trim() === shiftId) {
            row = i + 2;
            break;
          }
        }
      }
    }
  }

  if (!row || row < 2 || row > sheet.getLastRow()) {
    return json({ ok: false, error: 'Shift not found.' });
  }

  const userColumn = findColumn(headers, 'User');
  if (userColumn > 0) {
    const rowUser = String(sheet.getRange(row, userColumn).getValue() || '').trim();
    if (rowUser !== String(auth.u || '').trim()) {
      return json({ ok: false, error: 'You can only change your own shifts.' });
    }
  }

  const pendingColumn = findColumn(headers, 'Pending');
  const recordedColumn = findColumn(headers, 'Recorded at');
  if (pendingColumn < 1) {
    return json({ ok: false, error: 'The shift sheet has no Pending column.' });
  }
  if (recordedColumn > 0) {
    const recorded = sheet.getRange(row, recordedColumn).getValue();
    const recordedDate = datePart(recorded);
    if (!recordedDate || recordedDate < cutoffDateText()) {
      return json({ ok: false, error: 'Only shifts from the last 32 days can be changed.' });
    }
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    sheet.getRange(row, pendingColumn).setValue('Delete');
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true, row: row, pending: 'Delete' });
}

function requestAddShift(data) {
  const auth = verifyToken(data.token);
  if (!auth) {
    return json({ ok: false, code: 'AUTH', error: 'Sign-in expired. Please sign in again.' });
  }
  const user = String(data.user || '').trim();
  const start = String(data.start || '').trim();
  const end = String(data.end || '').trim();
  const notes = String(data.notes || '').trim();
  const hours = Number(data.hours);
  if (!user || !start || !end) {
    return json({ ok: false, error: 'User, start, and end are required.' });
  }
  if (user !== String(auth.u || '').trim()) {
    return json({ ok: false, error: 'You can only request additions for yourself.' });
  }
  if (!isLocalStamp(start) || !isLocalStamp(end)) {
    return json({ ok: false, error: 'Start and End must use YYYY-MM-DD HH:mm:ss.' });
  }
  if (listUsers().indexOf(user) === -1) {
    return json({ ok: false, error: 'Unknown user.' });
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getShiftsSheet(spreadsheet);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    ensureShiftHeaders(sheet);
    const collision = findShiftCollision(sheet, getHeaders(sheet), user, start, end, '');
    if (collision) {
      return json({
        ok: false,
        code: 'COLLISION',
        error: 'A shift for this user with the same start or end time already exists.'
      });
    }
    const fields = {
      'Recorded at': Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      'User': user,
      'Start': start,
      'End': end,
      'Hours': Number.isFinite(hours) ? Math.round(hours * 1000000) / 1000000 : '',
      'Notes': notes,
      'Timezone': String(data.timezone || Session.getScriptTimeZone()),
      'Shift ID': Utilities.getUuid(),
      'Pending': 'Add'
    };
    let inserted = insertShiftRow(sheet, fields);
    if (!inserted) {
      fields['Shift ID'] = Utilities.getUuid();
      inserted = insertShiftRow(sheet, fields);
    }
    if (!inserted) {
      return json({ ok: false, error: 'Could not create a unique Shift ID. Please retry.' });
    }
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

function ensureShiftHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHIFT_HEADERS);
  }
  ensurePendingColumn(sheet);
}

function ensurePendingColumn(sheet) {
  const headers = getHeaders(sheet);
  if (findColumn(headers, 'Pending') > 0) {
    return;
  }
  const column = Math.max(headers.length, sheet.getLastColumn()) + 1;
  sheet.getRange(1, column).setValue('Pending');
}

function getDailyStatus(data) {
  const auth = verifyToken(data.token);
  if (!auth) {
    return json({ ok: false, code: 'AUTH', error: 'Sign-in expired. Please sign in again.' });
  }
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getShiftsSheet(spreadsheet);
  ensureShiftHeaders(sheet);
  const record = getUserRecord(auth.u);
  return json({
    ok: true,
    user: auth.u,
    dailyMax: record ? record.dailyMax : 0,
    todayHours: getTodayHours(sheet, auth.u),
    date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  });
}

function getTodayHours(sheet, user) {
  const headers = getHeaders(sheet);
  const userColumn = findColumn(headers, 'User');
  const startColumn = findColumn(headers, 'Start');
  const recordedColumn = findColumn(headers, 'Recorded at');
  const hoursColumn = findColumn(headers, 'Hours');
  const pendingColumn = findColumn(headers, 'Pending');
  if (userColumn < 1 || hoursColumn < 1) {
    return 0;
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 0;
  }
  const lastColumn = sheet.getLastColumn();
  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const targetUser = String(user || '').trim();
  let total = 0;

  values.forEach(function (row) {
    if (String(row[userColumn - 1] || '').trim() !== targetUser) {
      return;
    }
    if (pendingColumn > 0 && String(row[pendingColumn - 1] || '').trim() === 'Add') {
      return;
    }
    let shiftDate = startColumn > 0 ? datePart(row[startColumn - 1]) : '';
    if (!shiftDate && recordedColumn > 0) {
      shiftDate = datePart(row[recordedColumn - 1]);
    }
    if (shiftDate !== today) {
      return;
    }
    const hours = Number(row[hoursColumn - 1]);
    if (Number.isFinite(hours)) {
      total += hours;
    }
  });

  return Math.round(total * 1000000) / 1000000;
}

function findShiftCollision(sheet, headers, user, start, end, ignoreId) {
  const userColumn = findColumn(headers, 'User');
  const startColumn = findColumn(headers, 'Start');
  const endColumn = findColumn(headers, 'End');
  const idColumn = findColumn(headers, 'Shift ID');
  if (userColumn < 1 || startColumn < 1 || endColumn < 1) {
    return null;
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }
  const lastColumn = sheet.getLastColumn();
  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  const targetUser = String(user || '').trim();
  const targetStart = String(start || '').trim();
  const targetEnd = String(end || '').trim();
  const ignored = String(ignoreId || '').trim();

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowUser = String(row[userColumn - 1] || '').trim();
    if (rowUser !== targetUser) {
      continue;
    }
    const rowId = idColumn > 0 ? String(row[idColumn - 1] || '').trim() : '';
    if (ignored && rowId === ignored) {
      continue;
    }
    const rowStart = displayValue(row[startColumn - 1]).trim();
    const rowEnd = displayValue(row[endColumn - 1]).trim();
    if ((rowStart && rowStart === targetStart) || (rowEnd && rowEnd === targetEnd)) {
      return { row: i + 2, start: rowStart, end: rowEnd };
    }
  }
  return null;
}

function insertShiftRow(sheet, values) {
  const headers = getHeaders(sheet);
  const shiftId = String(values['Shift ID'] || '').trim();
  const idColumn = findColumn(headers, 'Shift ID');
  if (shiftId && idColumn > 0) {
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0] || '').trim() === shiftId) {
          return false;
        }
      }
    }
  }
  const row = [];
  for (let i = 0; i < Math.max(headers.length, 1); i++) {
    row.push('');
  }
  Object.keys(values).forEach(function (key) {
    const column = findColumn(headers, key);
    if (column > 0) {
      row[column - 1] = values[key];
    }
  });
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, row.length).setValues([row]);
  const startColumn = findColumn(headers, 'Start');
  const endColumn = findColumn(headers, 'End');
  const hoursColumn = findColumn(headers, 'Hours');
  if (startColumn > 0) {
    sheet.getRange(2, startColumn).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }
  if (endColumn > 0) {
    sheet.getRange(2, endColumn).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }
  if (hoursColumn > 0) {
    sheet.getRange(2, hoursColumn).setNumberFormat('0.000000');
  }
  return true;
}

function datePart(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const text = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }
  return '';
}

function displayValue(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  }
  return String(value || '');
}

function cutoffDateText() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 32);
  return Utilities.formatDate(cutoff, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function isLocalStamp(value) {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(String(value).trim());
}


function listUsers() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getPersonnelSheet(spreadsheet);
  if (!sheet) {
    return [];
  }
  const columns = personnelColumns(sheet);
  const lastRow = sheet.getLastRow();
  if (columns.name < 1 || columns.pw < 1 || lastRow < 2) {
    return [];
  }
  const lastColumn = sheet.getLastColumn();
  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  const users = [];
  values.forEach(function (row) {
    const name = String(row[columns.name - 1] || '').trim();
    const password = String(row[columns.pw - 1] || '').trim();
    if (name && password && users.indexOf(name) === -1) {
      users.push(name);
    }
  });
  return users;
}

function getUserRecord(user) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getPersonnelSheet(spreadsheet);
  if (!sheet) {
    return null;
  }
  const columns = personnelColumns(sheet);
  const lastRow = sheet.getLastRow();
  if (columns.name < 1 || columns.pw < 1 || lastRow < 2) {
    return null;
  }
  const lastColumn = sheet.getLastColumn();
  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  for (let i = 0; i < values.length; i++) {
    const name = String(values[i][columns.name - 1] || '').trim();
    if (name === user) {
      return {
        user: name,
        password: String(values[i][columns.pw - 1] || '').trim(),
        dailyMax: columns.dailyMax > 0 ? (Number(values[i][columns.dailyMax - 1]) || 0) : 0
      };
    }
  }
  return null;
}

function getPersonnelSheet(spreadsheet) {
  const named = spreadsheet.getSheetByName(PERSONNEL_SHEET);
  if (named) {
    return named;
  }
  const sheets = spreadsheet.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const headers = getHeaders(sheets[i]);
    if (findColumn(headers, 'name') > 0 && findColumn(headers, 'pw') > 0) {
      return sheets[i];
    }
  }
  return null;
}

function personnelColumns(sheet) {
  const headers = getHeaders(sheet);
  return {
    name: findColumn(headers, 'name'),
    pw: findColumn(headers, 'pw'),
    dailyMax: findDailyMaxColumn(headers)
  };
}

function findDailyMaxColumn(headers) {
  for (let i = 0; i < headers.length; i++) {
    const norm = String(headers[i] || '').toLowerCase().replace(/[\s_-]+/g, '');
    if ((norm.indexOf('daily') !== -1 && norm.indexOf('max') !== -1) ||
        (norm.indexOf('max') !== -1 && norm.indexOf('hour') !== -1) ||
        (norm.indexOf('max') !== -1 && norm.indexOf('day') !== -1)) {
      return i + 1;
    }
  }
  return -1;
}

function getHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    return [];
  }
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
}

function findColumn(headers, name) {
  const target = String(name).trim().toLowerCase();
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || '').trim().toLowerCase() === target) {
      return i + 1;
    }
  }
  return -1;
}

function getTokenSecret() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('CLOCK_TOKEN_SECRET');
  if (!secret) {
    secret = Utilities.base64EncodeWebSafe(Utilities.getUuid() + Utilities.getUuid());
    props.setProperty('CLOCK_TOKEN_SECRET', secret);
  }
  return secret;
}

function issueToken(user) {
  const payload = JSON.stringify({ u: user, exp: Date.now() + TOKEN_TTL_MS });
  const payloadB64 = Utilities.base64EncodeWebSafe(Utilities.newBlob(payload).getBytes());
  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(payloadB64, getTokenSecret())
  );
  return payloadB64 + '.' + signature;
}

function verifyToken(token) {
  if (!token || String(token).indexOf('.') === -1) {
    return null;
  }
  const parts = String(token).split('.');
  if (parts.length !== 2) {
    return null;
  }
  const expected = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(parts[0], getTokenSecret())
  );
  if (parts[1] !== expected) {
    return null;
  }
  let payload = null;
  try {
    payload = JSON.parse(
      Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()
    );
  } catch (err) {
    return null;
  }
  if (!payload || !payload.u || !payload.exp || payload.exp < Date.now()) {
    return null;
  }
  return payload;
}

function tooManyFailures(user) {
  return Number(CacheService.getScriptCache().get('fail_' + user) || 0) >= MAX_FAILURES;
}

function recordFailure(user) {
  const cache = CacheService.getScriptCache();
  const key = 'fail_' + user;
  const count = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(count), FAILURE_WINDOW_SECONDS);
}

function clearFailures(user) {
  CacheService.getScriptCache().remove('fail_' + user);
}

function getShiftsSheet(spreadsheet) {
  const candidates = ['Shifts', 'Shift', 'Shift Log', 'Shifts Log', 'Time Log'];
  for (let i = 0; i < candidates.length; i++) {
    const sheet = spreadsheet.getSheetByName(candidates[i]);
    if (sheet) {
      return sheet;
    }
  }
  const others = spreadsheet.getSheets().filter(function (sheet) {
    return sheet !== getPersonnelSheet(spreadsheet);
  });
  return others[0] || spreadsheet.insertSheet(SHIFTS_SHEET);
}

function setup() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let personnel = getPersonnelSheet(spreadsheet);
  if (!personnel) {
    personnel = spreadsheet.insertSheet(PERSONNEL_SHEET);
    personnel.appendRow(['Name', 'pw']);
  } else {
    const headers = getHeaders(personnel);
    if (findColumn(headers, 'pw') < 1) {
      personnel.getRange(1, headers.length + 1).setValue('pw');
    }
  }
  const shifts = getShiftsSheet(spreadsheet);
  ensureShiftHeaders(shifts);
  getTokenSecret();
  Logger.log('Setup complete. Put a password in the pw column of the Personnel sheet for each user.');
}

function setUserPassword(user, password) {
  const name = String(user || '').trim();
  const pass = String(password || '').trim();
  if (!name || !pass) {
    throw new Error('User and password are required.');
  }
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getPersonnelSheet(spreadsheet);
  if (!sheet) {
    throw new Error('Personnel sheet not found. Run setup() first.');
  }
  const columns = personnelColumns(sheet);
  if (columns.name < 1) {
    throw new Error('A Name column is required in the Personnel sheet.');
  }
  if (columns.pw < 1) {
    throw new Error('A pw column is required in the Personnel sheet. Run setup().');
  }
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const lastColumn = sheet.getLastColumn();
    const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][columns.name - 1] || '').trim() === name) {
        sheet.getRange(i + 2, columns.pw).setValue(pass);
        return 'Password set for ' + name;
      }
    }
  }
  const row = [];
  const width = Math.max(columns.name, columns.pw);
  for (let i = 0; i < width; i++) {
    row.push('');
  }
  row[columns.name - 1] = name;
  row[columns.pw - 1] = pass;
  sheet.appendRow(row);
  return 'User added: ' + name;
}

function createUserFromPrompt() {
  const ui = SpreadsheetApp.getUi();
  const userPrompt = ui.prompt('Shift clock user', 'User name:', ui.ButtonSet.OK_CANCEL);
  if (userPrompt.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  const passwordPrompt = ui.prompt('Shift clock user', 'Password:', ui.ButtonSet.OK_CANCEL);
  if (passwordPrompt.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  const message = setUserPassword(userPrompt.getResponseText(), passwordPrompt.getResponseText());
  ui.alert(message);
}

function removeDateColumn() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getShiftsSheet(spreadsheet);
  const headers = getHeaders(sheet);
  const dateColumn = findColumn(headers, 'Date');
  if (dateColumn > 0) {
    sheet.deleteColumn(dateColumn);
    Logger.log('Deleted the Date column from ' + sheet.getName() + '.');
  } else {
    Logger.log('No Date column found in ' + sheet.getName() + '.');
  }
}

function json(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
