+++
title = "Clock setup"
+++
The browser clock is at [Shift Clock](../clock/).

## Users and passwords

- Users are read from the **Personnel** sheet of the private Dyuganga spreadsheet.
- Only rows with a non-empty `pw` cell are listed in the dropdown.
- The `Name` and `pw` columns are found by header name.
- The value of the `pw` cell is the password.
- Clear a `pw` cell to disable that user.
- The browser stores a signed session token for 180 days. It does not store the password; the password is sent once, with the start or stop request, when this browser has no session yet.

Passwords are managed by editing the `pw` column, or by running `createUserFromPrompt()` in the Apps Script editor.

## Shift sheet

New shift rows are added at the top of the sheet named `Shifts`, directly below the header (newest first), or the first non-Personnel sheet. Change `SHIFTS_SHEET` at the top of [app-script.js](../app-script.js) if the shift sheet has another name.

The columns are: `Recorded at`, `User`, `Start`, `End`, `Hours`, `Notes`, `Timezone`, `Shift ID`, `Pending`.

A row is created as soon as the clock is started, with `Start` filled in and `End` and `Hours` left empty. When the clock is stopped, the same row is completed: `End` and `Hours` are filled in and `Pending` is left blank. The row is matched by `Shift ID`, so the clock updates it instead of adding a second row.

If the start row could not be saved (offline, endpoint error), the clock keeps running and the row is created when the shift ends. If a shift is never ended (browser closed, user forgot), the row stays in the sheet with an empty `End` and shows as `in progress` on the Check shifts page, so the manager can see and correct it.

`Start` and `End` include the full local date and time (`YYYY-MM-DD HH:mm:ss`), so shifts that cross midnight are unambiguous.

If the shift sheet still has the old `Date` column, run `removeDateColumn()` once in the Apps Script editor, or delete that column manually. New rows are written by header name, so they stay aligned even before the column is removed.

The script adds a `Pending` column automatically if it is missing. A normal clock-out leaves `Pending` blank.

## Checking shifts

The [Check shifts](../check-shifts/) page lists the signed-in user's own shifts from the last 32 days. After signing in with a Personnel user, the user can:

- request deletion of one of their own shifts, which sets its `Pending` cell to `Delete`;
- request addition of one of their own missing shifts, which inserts a new row with `Pending = Add`.

The manager reviews and clears the `Pending` column after processing the request.

A clock-out is rejected if the same user already has a shift with the same start or end time (for example, a row added manually by the admin). The failed write is not queued for retry; the user is prompted to open the Check shifts page instead. Resending the same Shift ID is treated as already saved, so it cannot create a duplicate row.

Addition requests on the Check shifts page are limited to 1 hour. A request is also rejected if it would overlap or be less than 5 minutes away from an existing shift.

## Daily maximum and breaks

The Personnel sheet may have a column whose header contains `Daily Max` or `Max hours` (matched case-insensitively). Its value is in hours. The limit is enforced only when a shift is started: pressing Try shift start sends one `start` request, and the Apps Script refuses it with an alert when that day's maximum is reached. The browser never blocks the button on the limit — the cached total is shown for information only. `Pending = Add` rows are counted toward the daily limit; `Pending = Delete` rows are not counted. Nothing is checked while a shift runs — a shift that crosses the limit keeps running (to save Apps Script quota there is no mid-shift polling or auto-end) and the next Start is refused instead.

An **empty** `Daily Max` cell means no daily limit. An explicit **`0`** means the user cannot start any shift that day: the Try shift start button stays enabled (the browser does not enforce), and pressing it shows the server's refusal `You can't start any shift today. Contact admin for details.`.

The daily total comes back with the start and stop responses, and only there — the page makes no separate `dailyStatus` request at all. The hint and the refusal alert show the breakdown, for example `7h approved + 0.5h pending approval + 0.5h waiting to upload`. A pending upload whose `Shift ID` already appears in the sheet is not counted twice.

For a selected user whose daily maximum is known, the clock shows a line below the clock time with the daily maximum and the hours used today (with the same breakdown). It turns orange when the maximum is reached. The line refreshes with the daily total whenever a shift starts or ends. Between those moments it may be outdated, which the line says.

A cumulative hour of work since the last break ends the current shift automatically and sets a 5-minute break. The cumulative total is kept per user across manual stops and restarts. Stopping for at least 5 minutes counts as the break and resets the total; restarting sooner continues it. When the cumulative hour is reached, the current shift is force-stopped at that point (or immediately on a manual end if the threshold is reached). The alert is:

`Take a break, walk away, look away. Shift ended. Start shift after HH:MM:SS.`

The Start button stays disabled until the break ends. The break and cumulative state are stored in the browser per user, so reloading does not bypass them. The active panel shows time since the last break, and the idle hint shows the accumulated total. The auto-ended shift is uploaded normally.

Break and daily-limit alerts use a browser notification (allow notifications when prompted), two beeps, a flashing tab title, and a modal that stays until dismissed. The notification and flashing title remain visible when the clock page is in another tab; the modal is shown when the user returns.

The Test details block in the clock page only simulates the alerts; it does not set a real break or upload a shift. **Reset test** clears a break left by an earlier test.

The start row requires the `start` action and the daily total is returned with `start`/`shift`, so redeploy the Apps Script after updating it.

## Requests and quotas

The Apps Script free quota is limited, so the clock keeps requests to a minimum:

- **Try shift start**: exactly one request (`action: start`). It signs in with the password if this browser has no session yet, refuses the start when the daily maximum is reached, creates the row, and returns the refreshed daily total and a session token.
- **End shift**: exactly one request (`action: shift`). It completes the row and returns the refreshed daily total and a session token.
- **Page load**: exactly one request, repopulating the user dropdown (the cached list stays as fallback if it fails). No daily-limit check happens on load.
- There is no other communication: no polling, no per-minute refresh, no request on tab focus, tab return, or user change, and no test request. The Retry upload button re-sends queued shifts when pressed.
- **Retry upload**: one request per queued shift (`action: shift`), only when pressed.

If the endpoint is not reachable, the clock still runs; the start row is created when the shift ends and the shift is queued for Retry upload, with its rows also shown for copy-paste.

## Deploying the Apps Script endpoint

The Apps Script project is [here](https://script.google.com/u/1/home/projects/1GRTdpZ4PsTT_8QU0dw_fVMTaDJJFhyZDoSgh_dl64Ck9XKfwNeztwGJ9/edit).

Saving the script in the editor does **not** update the live web app.

1. Open the private spreadsheet and choose **Extensions → Apps Script**.
2. Replace the default code with the contents of [app-script.js](../app-script.js).
3. Run `setup()` once.
4. Put a password in the `pw` column of the Personnel sheet for each user you want to enable.
5. For the first deployment, choose **Deploy → New deployment** and select type **Web app**.
6. Set **Execute as: Me** and **Who has access: Anyone**.
7. Deploy, approve the permissions, and copy the Web app URL ending in `/exec`.
8. If the URL changes, update `DEFAULT_ENDPOINT` in [clock.js](../clock.js).

### Redeployment

Same project/deployment: **Deploy → Manage deployments → Edit → Version: New version → Deploy**.

The current deployed endpoint is the one pointed by RECORD_SERVER_ENDPOINT .  
Client and remote versions should match.


### Deployment note

Use **Execute as: Me** with **Who has access: Anyone**. The script then runs with the owner's access to the private spreadsheet, so the sheet stays private. Choosing **Execute as: User accessing the web app** would require every user to have access to the private spreadsheet, and the page's requests would need Google authentication.

### Apps Script quotas and limits

Google's published quotas do not specify a general daily limit of 100 script executions. Each request to this web app runs a script execution. Current documented limits include 6 minutes per execution, 30 simultaneous executions per user, and 1,000 per script. Daily quotas for individual services vary between consumer and Google Workspace accounts and reset 24 hours after the first request.

Because this web app is deployed to **Execute as: Me**, its Apps Script quotas apply to the deployment owner's account, not separately to each clock user. The clock's periodic status checks and other requests use that capacity. Limits may change; review the [current quotas and limitations](https://developers.google.com/apps-script/guides/services/quotas#current_limitations) and the Apps Script dashboard's **My Executions** when troubleshooting.
