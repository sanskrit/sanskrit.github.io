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

The columns are: `Recorded at`, `User`, `Date`, `Start`, `End`, `Hours`, `Notes`, `Timezone`, `Shift ID`.

`Start` and `End` include the full local date and time (`YYYY-MM-DD HH:mm:ss`), so shifts that cross midnight are unambiguous. `Date` is the shift's start date.

## Deploying the Apps Script endpoint

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
