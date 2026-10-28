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
- The browser stores a signed session token for 180 days. It does not store the password.

Passwords are managed by editing the `pw` column, or by running `createUserFromPrompt()` in the Apps Script editor.

## Shift sheet

New shift rows are added at the top of the sheet named `Shifts`, directly below the header (newest first), or the first non-Personnel sheet. Change `SHIFTS_SHEET` at the top of [app-script.js](../app-script.js) if the shift sheet has another name.

The columns are: `Recorded at`, `User`, `Start`, `End`, `Hours`, `Notes`, `Timezone`, `Shift ID`, `Pending`.

`Start` and `End` include the full local date and time (`YYYY-MM-DD HH:mm:ss`), so shifts that cross midnight are unambiguous.

If the shift sheet still has the old `Date` column, run `removeDateColumn()` once in the Apps Script editor, or delete that column manually. New rows are written by header name, so they stay aligned even before the column is removed.

The script adds a `Pending` column automatically if it is missing. A normal clock-out leaves `Pending` blank.

## Checking shifts

The [Check shifts](../check-shifts/) page lists the signed-in user's own shifts from the last 32 days. After signing in with a Personnel user, the user can:

- request deletion of one of their own shifts, which sets its `Pending` cell to `Delete`;
- request addition of one of their own missing shifts, which inserts a new row with `Pending = Add`.

The manager reviews and clears the `Pending` column after processing the request.

A clock-out is rejected if the same user already has a shift with the same start or end time (for example, a row added manually by the admin). The failed write is not queued for retry; the user is prompted to open the Check shifts page instead. Resending the same Shift ID is treated as already saved, so it cannot create a duplicate row.

## Daily maximum and breaks

The Personnel sheet may have a column whose header contains `Daily Max` or `Max hours` (matched case-insensitively). Its value is in hours. When the user's recorded hours for today plus any local pending shifts reach that value, the active shift ends automatically with an alert. `Pending = Add` rows are not counted until approved. Starting again after the day's maximum is refused with an alert.

Every hour of an active shift ends the shift automatically and sets a 5-minute break. The alert is:

`Take a break, walk away, look away. Shift ended. Start shift after HH:MM:SS.`

The Start button stays disabled until the break ends. The break is stored in the browser per user, so reloading the page does not bypass it. The hourly auto-ended shift is uploaded normally; a manual end does not start a break. The daily maximum requires the `dailyStatus` action, so redeploy the Apps Script after updating it.

## Deploying the Apps Script endpoint

The Apps Script project is [here](https://script.google.com/u/1/home/projects/1GRTdpZ4PsTT_8QU0dw_fVMTaDJJFhyZDoSgh_dl64Ck9XKfwNeztwGJ9/edit).

Saving the script in the editor does **not** update the live web app. After saving, update the deployment: **Deploy → Manage deployments → Edit → Version: New version → Deploy**. If the `/exec` URL changes, update `DEFAULT_ENDPOINT` in [clock.js](../clock.js).


1. Open the private spreadsheet and choose **Extensions → Apps Script**.
2. Replace the default code with the contents of [app-script.js](../app-script.js).
3. Run `setup()` once.
4. Put a password in the `pw` column of the Personnel sheet for each user you want to enable.
5. For the first deployment, choose **Deploy → New deployment** and select type **Web app**.
6. Set **Execute as: Me** and **Who has access: Anyone**.
7. Deploy, approve the permissions, and copy the Web app URL ending in `/exec`.
8. After changing `app-script.js` later, update the existing deployment: **Deploy → Manage deployments → Edit → Version: New version** so the `/exec` URL stays the same.
9. If the URL changes, update `DEFAULT_ENDPOINT` in [clock.js](../clock.js).

The current deployed endpoint is:

```
https://script.google.com/macros/s/AKfycbw7LNoaHRJEktArmanWEN9XMYLC10GYeloiYXYh9RIAz1LELE2MTMxS4muiqPaGhogm6w/exec
```

## Deployment note

Use **Execute as: Me** with **Who has access: Anyone**. The script then runs with the owner's access to the private spreadsheet, so the sheet stays private. Choosing **Execute as: User accessing the web app** would require every user to have access to the private spreadsheet, and the page's requests would need Google authentication.
