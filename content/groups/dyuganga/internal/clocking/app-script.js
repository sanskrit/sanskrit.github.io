const SPREADSHEET_ID = '1QxaP2bOIECnTphgmYgjxlD1tVyZA1zbHJKx4b78VKl0';
const PERSONNEL_SHEET = 'Personnel';
const SHIFTS_SHEET = 'Shifts';
const SHIFT_HEADERS = ['Recorded at', 'User', 'Date', 'Start', 'End', 'Hours', 'Notes', 'Timezone', 'Shift ID'];
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
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SHIFT_HEADERS);
    }
    if (data.id) {
      const existing = sheet.createTextFinder(data.id).findNext();
      if (existing) {
        return json({ ok: true, duplicate: true });
      }
    }
    const hours = Number(data.hours);
    const row = [
      data.recordedAt || new Date(),
      auth.u,
      data.date,
      data.start,
      data.end,
      Number.isFinite(hours) ? hours : data.hours,
      data.notes || '',
      data.timezone || '',
      data.id || ''
    ];
    sheet.insertRowBefore(2);
    sheet.getRange(2, 1, 1, row.length).setValues([row]);
    sheet.getRange(2, 4).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(2, 5).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(2, 6).setNumberFormat('0.000000');
  } finally {
    lock.releaseLock();
  }

  return json({ ok: true });
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
        password: String(values[i][columns.pw - 1] || '').trim()
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
    pw: findColumn(headers, 'pw')
  };
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
  if (shifts.getLastRow() === 0) {
    shifts.appendRow(SHIFT_HEADERS);
  }
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

function json(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
