---
name: troubleshoot-login
description: Diagnose and fix Google sign-in failures in the HITS Incentive app ("Sign-in was cancelled or blocked", COOP window.closed warnings, 403 on sheets, scope/consent issues). Use when a user reports they can't sign in or can't load data.
---

# Troubleshoot Google sign-in

The app signs in with Google Identity Services (`initTokenClient` → popup → access token), then reads Google Sheets with that token. Flow lives in `sheets.js` (`getToken`); error messages are mapped in `app.jsx` (EmailLogin `signIn`). Client ID (public): `334591605851-5e15787uo5lu6raii82a10n1u2le3jms.apps.googleusercontent.com`. Scopes: `spreadsheets.readonly openid email profile`.

## First, read the on-screen message — it's mapped to a cause
- **"Sign-in was cancelled or blocked. …make sure pop-ups are allowed."** → popup was blocked/closed (or a Testing-mode consent screen; see below). **Most common.**
- **"This site's web address isn't authorised in Google yet…"** → the current origin isn't in the OAuth client's **Authorized JavaScript origins**.
- **"…didn't include permission to read Google Sheets…"** → the Sheets scope checkbox wasn't ticked on the consent screen. Retry and tick it.
- **"…can't read '<sheet>'. Make sure your company account has at least view access…"** → 403: that Google account lacks view access to a source sheet (permissions are per-user; no service account).
- **"Your session expired."** → token expired; sign in again.

## Benign noise (NOT the bug)
- `Cross-Origin-Opener-Policy policy would block the window.closed call` — comes from **Google's own OAuth popup page**, appears even on successful sign-ins. Ignore.
- `GET /favicon.ico 404` — the app has no favicon. Harmless.

## Fix path for "cancelled or blocked" on the live domain (hits-incentive.xyz)
1. **Allow pop-ups** for the site (address-bar pop-up-blocked icon → always allow) → retry.
2. **Try Incognito** to rule out an ad/pop-up-blocker extension; allowlist the site if that's it.
3. Complete the Google popup fully with the **company** account; don't close it early.

## Check in Google Cloud Console (project owning the client ID)
- **OAuth consent screen → Publishing status = "In production."** If "Testing," only added test users can sign in; everyone else gets "cancelled or blocked." This is a frequent org-wide cause.
- **Credentials → OAuth client → Authorized JavaScript origins** must include every origin the app is served from (`https://hits-incentive.xyz`, and the github.io origin if used). Add any new domain/preview here.

## Durable COOP fix (only if genuinely needed)
GitHub Pages can't send custom headers, so you can't set `Cross-Origin-Opener-Policy: same-origin-allow-popups` there. If COOP ever hard-breaks sign-in, move hosting to **Netlify** (org already uses it) and add a `_headers` file with that header — keep the same domain/CNAME.
