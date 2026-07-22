# HITS Incentive Automation — Maintainer Onboarding

Everything the next maintainer needs to run, change, deploy, and debug this app. Read this top-to-bottom once, then use the skills in `.claude/skills/` for day-to-day tasks.

> ⚠️ **Secrets are NOT in this doc or this repo.** The Metabase password and Google account access are transferred separately (see [§8 Secrets & access](#8-secrets--access)). This repo is **public** — never commit a password, token, or `.mbcreds`.

---

## 1. What this app is

A single-page web app showing live sales-incentive calculations for ShopDeck's "HITS" growth teams. **No build step, no backend, no framework CLI.** Plain `<script>` tags + in-browser Babel. Users sign in with their company Google account; the app reads Google Sheets directly with the signed-in user's own OAuth token and computes everything client-side. Task/callback metrics come from a Metabase snapshot committed to the repo.

- **Live:** https://hits-incentive.xyz  (also https://pawankumar-pkaytsk.github.io/Incentive-Automation/)
- **Repo:** https://github.com/pawankumar-pkaytsk/Incentive-Automation  (**public**, GitHub Pages, `main` branch, root)
- **Hosting:** GitHub Pages + GoDaddy DNS. `CNAME` file binds the domain — **never delete CNAME.**

Everything hangs off one global: `window.INCENTIVE` (alias `I`).

---

## 2. Tech stack

- React 18.3.1 (UMD) + ReactDOM + `@babel/standalone` 7.29.0, from unpkg (pinned, with SRI hashes).
- `html2canvas` 1.4.1 (pinned, SRI) — used for PNG export of team tables.
- Google Identity Services (`accounts.google.com/gsi/client`) for the OAuth token flow.
- Google Sheets API v4 (read-only), called directly from the browser.
- Order of `<script>` tags in `index.html` matters (dependency order).

---

## 3. File map (load order = order in `index.html`)

| File | Role |
|---|---|
| `index.html` | Entry point. Loads CDN libs, sets `window.GOOGLE_CLIENT_ID`, loads data/engine/sheets, then JSX via Babel. |
| `colors_and_type.css` | Shopdeck design tokens (`--sd-*` CSS vars). Outfit webfont. |
| `data.js` | Defines `window.INCENTIVE`. Roster CSV, TEAMS, TEAM_ORDER, ADMINS, MONTHS, seeded sample data (fallback before sign-in), `DATA_SOURCES`. |
| `engine.js` | Incentive engine over the **seeded sample** roster + shared band/logic definitions (`I.INPUTS`, bands, multipliers, hypercare schedule). Drives the UI band legend. |
| `live.js` | Optional backend adapter (`INCENTIVE_BACKEND_URL`, currently empty/unused). |
| `sheets.js` | **The live data path.** Google sign-in → fetch source sheets with user's token + fetch `task_data.json` → `computeAll(RAW)` → swap into `I`. Contains `SHEETS` config and a full re-implementation of the calc over raw rows. |
| `icons.jsx` | Inline SVG icon set: `<Icon name="…" size={} />`. |
| `components.jsx` | Shared primitives: Button, Card, Modal, MetricTile, Avatar, ProgressBar, TextInput, etc. |
| `drill.jsx` | Drill-down popups (every number is clickable → underlying rows + CSV). `<DrillHost/>` + `window.__openDrill()`. |
| `views.jsx` | CSV export (`exportCSV`), **PNG export (`exportPNG`)**, MetricTile, band/schedule components, InputBands. |
| `person.jsx` | PersonView — transparent per-person math. |
| `views2.jsx` | Roster rows, **TeamView (leaderboard medals + CSV/PNG export)**, AdminView (data-health + PIP tabs). |
| `screens.jsx` | Google sign-in screen, AppHeader, TeamCard, DataSourcesPanel. |
| `app.jsx` | Root `<App/>` + router (home/team/admin/person), EmailLogin (sign-in handler + error mapping), role-aware home. Mounts to `#root`. |
| `task_data.json` | **Metabase snapshot** (card 10181) of task/callback rows. Refreshed daily (see §6). ~15–20 MB. |
| `tools/` | The refresh script + LaunchAgent plist (copies of the off-repo tooling, for portability). |
| `assets/`, `fonts/`, `*.svg`, `*.ttf` | Logos + Outfit font. |
| `CNAME` | `hits-incentive.xyz`. **Do not remove.** |

> **The golden rule:** the incentive math lives in **both** `engine.js` (sample) **and** `sheets.js` (live). A logic change MUST be applied to both, or sample and live will disagree.

---

## 4. Login / OAuth (how sign-in works & how to fix it)

- **Client ID** (public, in `index.html` + `screens.jsx`): `334591605851-5e15787uo5lu6raii82a10n1u2le3jms.apps.googleusercontent.com`
- **Scopes:** `spreadsheets.readonly openid email profile`
- **Flow:** `google.accounts.oauth2.initTokenClient(...)` → `requestAccessToken()` opens a Google popup → returns an access token → the app calls Sheets API with it. Per-user permissions apply (no service account): if a user lacks view access to a source sheet, that fetch 403s.
- **Where the flow lives:** `sheets.js` → `ensureClient()` / `getToken()`; error mapping in `app.jsx` (EmailLogin `signIn`).

**Google Cloud Console** (project owning the client ID) is where you manage:
- **Authorized JavaScript origins** — must include `https://hits-incentive.xyz` (and the github.io origin if used). A new domain/preview won't sign in until added here.
- **OAuth consent screen** — publishing status must be **"In production"**. If it's in **"Testing"**, only explicitly-added test users can sign in; everyone else is blocked and the app shows *"Sign-in was cancelled or blocked."*

See the **`troubleshoot-login`** skill for the full decision tree. Quick version of the common failure: on the live domain, *"cancelled or blocked"* almost always = **pop-ups blocked** (allow pop-ups for the site / try Incognito). The red `Cross-Origin-Opener-Policy … window.closed` console warnings come from **Google's own popup page** and are benign noise, not our bug. GitHub Pages cannot set custom headers, so a header-based COOP fix would require moving hosting to Netlify (which the org already uses elsewhere).

---

## 5. Data sources

**8 Google Sheets** (read live per-user via OAuth), configured in `SHEETS` in `sheets.js`. Each = `{ id, tab, col }` where `col` maps field → 0-based column index; header row dropped:
`hitsmaster` (seller HITs) · `people` (roster) · `target` (monthly targets) · `handover` (seller→GC/GM attribution) · `threeweek` (3-week go-live IDs) · `spend` (daily spend/live) · `sos` (escalations → WES) · `strikes` (KAE strikes).

**Task + Callback are NOT a Google Sheet** — they come from **Metabase card 10181** ("All Tasks (Pawan) - for website built") as the committed `task_data.json` snapshot (see §6). This is because the browser can't read Metabase directly (public static site, password can't live in client JS, CORS, 184k rows).

- **Attribution window:** the 20th of month M to the 20th of M+1 (`WINDOW_START_DAY = 20`).
- **DATA_SOURCES** in `data.js` is just the human-readable list shown in the app's "Data sources" panel.

---

## 6. The daily data refresh (task_data.json)

`task_data.json` is a point-in-time snapshot; it's kept fresh by a script + a scheduled job. **Both live in `tools/` in this repo AND on the current maintainer's Mac.**

- **Script:** `tools/incentive_task_refresh.py` (canonical copy runs from `~/metabase-arr-refresh/incentive_task_refresh.py`).
  - Pulls Metabase card **10181**, keeps GC-bucket rows for the used sub_types from `START_DATE` (default `2026-01-01`), writes a compact `task_data.json`, and with `--push` commits + pushes → Pages redeploys.
  - Fields per row: `st` (sub_type), `gc` (assignee_name), `status`, `cr` (created date), `sla` (`sla_in_min`), `tat`.
- **Run manually:** `python3 ~/metabase-arr-refresh/incentive_task_refresh.py --push`
- **Scheduled (daily 6:00 AM IST):** macOS LaunchAgent `com.blitzscale.incentive-task-refresh` (`tools/com.blitzscale.incentive-task-refresh.plist`, installed at `~/Library/LaunchAgents/`). Log: `~/metabase-arr-refresh/incentive_task_refresh.log`.
  - Check it: `launchctl list com.blitzscale.incentive-task-refresh` (LastExitStatus should be 0).
  - Trigger now: `launchctl kickstart -k gui/$(id -u)/com.blitzscale.incentive-task-refresh`

See the **`refresh-task-data`** skill for setup on a new machine (creds, install, verify).

---

## 7. Incentive logic (reference)

Full detail lives in the **`incentive-logic`** skill. In brief — teams map to one of 3 calc logics:

- **core** — `output = perHitRate × weightedHits`, then `× multiplier`.
  - Core rate bands by achievement %: `>120%→6.25 · 90–120%→4.5 · 50–90%→1.5 · <50%→0`.
  - Multiplier from 4 input bands (A Spend/Live, B Task, C **Callback within SLA**, D WES): all green→1.5, mix g/y→1.3, all yellow→1.0, 1 red→0.85, ≥2 red→0.70, all red→0.
  - **Input band thresholds:** Spend `>80/≥70`; Task `>90/≥70`; **Callback within SLA `>90/≥75`**; WES `<25/≤45` (lower is better).
- **hypercare** — cumulative per-HIT schedule `[7,8,9,11,15]` then flat 20; no multiplier.
- **kae** — flat base ₹6,500 (₹6,000 in some copy), reduced by strike bands.

**Callback Adherence within SLA** (changed most recently): `schedule_call` tasks only; a task counts as done-within-SLA if `status ∈ {completed, closed}` AND `tat ≤ sla_in_min`. `% = done-within-SLA ÷ total schedule_call`. Task Adherence is unchanged (`closed/completed ÷ total` over its 3 sub_types).

Other concepts: `weightedHits` (3-week sellers ×1.5, hypercare ×1), `achievementPct`, GM rollup, PIP flag (last 2 months; GC 50%, GM 70%), adhoc adjustments, dataHealth.

---

## 8. Secrets & access

Transfer these to the new maintainer **out-of-band** (1Password / secure handover), never in this repo:

1. **Metabase login** — used by the refresh script. Currently stored at `~/metabase-arr-refresh/.mbcreds` as JSON: `{"METABASE_URL": "...", "METABASE_USER_EMAIL": "...", "METABASE_PASSWORD": "..."}`. Recreate this file on the new machine. Consider switching to a Metabase **service account** so it doesn't break when a person leaves.
2. **Google Cloud Console access** — to the project owning the OAuth client ID (for origins + consent screen). Ensure the new maintainer is an owner/editor.
3. **GitHub** — write access to `pawankumar-pkaytsk/Incentive-Automation` (or transfer the repo to an org). Deploys use `gh auth` on the maintainer's machine.
4. **GoDaddy DNS** — for the `hits-incentive.xyz` domain (A/CNAME records → GitHub Pages). Needed only if the domain/hosting changes.

---

## 9. Deploy (the handsfree loop)

Edit files locally → commit → push `main` → GitHub Pages auto-deploys in ~1–2 min → hard-refresh (Cmd+Shift+R) to bust cache. See the **`deploy`** skill. Data changes deploy automatically via the daily refresh job (§6).

---

## 10. Gotchas

- **Sync engine.js ↔ sheets.js** on any logic change (§3 golden rule).
- New `.jsx` must be added as a `<script type="text/babel">` in `index.html` **in dependency order** (icons → components → drill → views → person → views2 → screens → app).
- Styling is inline-style objects referencing `--sd-*` CSS vars — no Tailwind/CSS modules.
- Fuzzy name matching in `sheets.js` (`buildResolver`) maps sheet names like "Nikita S" → roster "Nikita Sinha". Names in Metabase data can have double spaces.
- Dates may be serial numbers or strings; `toDate()` handles both.
- `task_data.json` is large (~15–20 MB) and rewrites daily — expect steady `.git` growth (acceptable; matches the sibling metrics-site repo).
- Nothing is persisted server-side; all money/percentages are derived client-side each load.
