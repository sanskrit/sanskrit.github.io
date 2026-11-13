// dyuganga-shared.js — shared helpers for clock + check-shifts.
// Load this BEFORE clock.js / check-shifts.js:
//   <script src="/groups/dyuganga/internal/clocking/dyuganga-shared.js?v=20261113-shared"></script>
//   <script src="/groups/dyuganga/internal/clocking/clock.js?v=20261113-shared"></script>
// No bundler, no modules — plain <script> tags, same style as the other files.
(function () {
    'use strict';

    const SHARED_VERSION = '2026-11-13-shared-v1';
    const DEFAULT_ENDPOINT = window.DYUGANGA_CLOCK_ENDPOINT || 'https://script.google.com/macros/s/AKfycbzw7S2068932Jm3LOABbV-IU4oy43FTi6HuMrYTJmx8qspIJv13biVpFAMXdivSzWuwVA/exec';
    const KEYS = {
        users: 'dyuganga_clock_users_v1',
        active: 'dyuganga_clock_active_v1',
        selectedUser: 'dyuganga_clock_selected_user_v1',
        pending: 'dyuganga_clock_pending_v1',
        auth: 'dyuganga_clock_auth_v1',
        breakUntil: 'dyuganga_clock_break_v1',
        daily: 'dyuganga_clock_daily_v1',
        work: 'dyuganga_clock_work_v1'
    };
    const CACHE_TTL_MS = 60 * 60 * 1000;

    function $(id) { return document.getElementById(id); }

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

    function getEndpoint() {
        return String(DEFAULT_ENDPOINT || '').trim();
    }

    function getTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch (err) {
            return '';
        }
    }

    // Generic JSONP: <script> tags are not subject to CORS, unlike fetch().
    // Apps Script /exec redirects to script.googleusercontent.com without CORS
    // headers, so fetch() gets blocked even when the deployment is alive.
    // params is e.g. { action: 'users' }. Returns the parsed JSONP body.
    function jsonpRequest(endpoint, params) {
        return new Promise(function (resolve, reject) {
            const query = Object.keys(params || {}).map(function (k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            }).join('&');
            const separator = endpoint.indexOf('?') === -1 ? '?' : '&';
            const cbName = 'dyugangaCb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
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

    // --- Users (shared cache format: { users: [...], fetchedAt: ms }) ---
    // Both pages used to disagree here: clock wrote { users, fetchedAt },
    // check-shifts wrote a bare array. This one format is now canonical.

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

    function cleanUsers(list) {
        const clean = [];
        (list || []).forEach(function (name) {
            const value = String(name).trim();
            if (value && clean.indexOf(value) === -1) {
                clean.push(value);
            }
        });
        return clean;
    }

    function getUsers() {
        return cleanUsers(getUsersCache().users);
    }

    async function loadUsers() {
        const endpoint = getEndpoint();
        if (!endpoint) {
            throw new Error('No endpoint configured.');
        }
        const body = await jsonpRequest(endpoint, { action: 'users' });
        if (!body || body.ok !== true || !Array.isArray(body.users)) {
            throw new Error(body && body.error ? String(body.error) : 'Unexpected response, no users array. Got: ' + JSON.stringify(body).slice(0, 200));
        }
        const users = cleanUsers(body.users);
        write(KEYS.users, { users: users, fetchedAt: Date.now() });
        return users;
    }

    // --- Auth (shared map: { user: { token, expiresAt } }) ---

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

    // check-shifts used to scan the whole map for any valid login.
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

    // --- POST (still fetch — same as before, shared so it only lives once) ---
    // Note: POST goes through the same Apps Script redirect as GET did.
    // If POST ever hits the same CORS block, it will need the same treatment
    // as users (e.g. a form / JSONP-style path). For now keep one copy.

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
            error.body = body || null;
            throw error;
        }
        return body;
    }

    // --- UI helpers ---

    // Toasts differ only by element + show-class. Factory keeps one copy.
    // Usage: const toast = DyugangaShared.makeToast(function () { return $('toast'); }, 'sc-show');
    function makeToast(getElement, showClass) {
        let timer = null;
        return function (text) {
            const element = getElement();
            if (!element) { return; }
            element.textContent = text;
            element.classList.add(showClass);
            window.clearTimeout(timer);
            timer = window.setTimeout(function () {
                element.classList.remove(showClass);
            }, 2200);
        };
    }

    // Fill any user <select>: clear, placeholder, options, restore previous.
    // select may be null (page without that dropdown) — then it is a no-op.
    function fillUserSelect(select, users, preferred, placeholderText) {
        if (!select) { return; }
        const previous = select.value || String(preferred || '');
        const clean = cleanUsers(users);
        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = placeholderText || 'Select user...';
        select.appendChild(placeholder);
        clean.forEach(function (name) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
        if (clean.indexOf(previous) !== -1) {
            select.value = previous;
        }
    }

    window.DyugangaShared = {
        VERSION: SHARED_VERSION,
        KEYS: KEYS,
        CACHE_TTL_MS: CACHE_TTL_MS,
        $: $,
        read: read,
        write: write,
        remove: remove,
        getEndpoint: getEndpoint,
        getTimezone: getTimezone,
        jsonpRequest: jsonpRequest,
        getUsersCache: getUsersCache,
        cleanUsers: cleanUsers,
        getUsers: getUsers,
        loadUsers: loadUsers,
        getAuthMap: getAuthMap,
        getAuth: getAuth,
        findAuth: findAuth,
        setAuth: setAuth,
        clearAuth: clearAuth,
        postJson: postJson,
        makeToast: makeToast,
        fillUserSelect: fillUserSelect
    };
})();
