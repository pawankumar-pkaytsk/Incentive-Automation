# HITS Incentive Automation — Maintainer Onboarding

Everything needed to run, change, deploy and debug this app. Read this once, then use the skills in `.claude/skills/` for day-to-day work.

> ⚠️ **No secrets here, and none in this repo — it is PUBLIC.** The Metabase password and account access transfer separately (§8). Never commit `.mbcreds`, a password or a token.

---

## 1. What this is
A single-page app showing live sales-incentive calculations for ShopDeck's HITS teams. **No build step, no backend.** Plain `<script>` tags + in-browser Babel. Users sign in with their company Google account; sheets are read with **their own** OAuth token, and Metabase data arrives as committed JSON snapshots. Everything computes client-side.

- **Live:** https://hits-incentive.xyz
- **Repo:** https://github.com/pratyushboppana-shopdeck/Incentive-Automation (**public**, GitHub Pages, `main`, root)
- **Hosting:** GitHub Pages + GoDaddy DNS. `CNAME` binds the domain — **never delete it**.
- Everything hangs off one global: `window.INCENTIVE` (alias `I`).

## 2. The five skills (start here)
| Skill | Use for |
|---|---|
| **`deploy`** | shipping a change (incl. the mandatory cache-bust bump) |
| **`data-sources`** | which card/sheet feeds which number + **the attribution traps** |
| **`refresh-data`** | the two Metabase refresh scripts and the daily job |
| **`incentive-logic`** | how every team's incentive is calculated |
| **`troubleshoot-data`** | "this number looks wrong" |
| **`troubleshoot-login`** | "I can't sign in" |

## 3. Stack
React 18.3.1 UMD + `@babel/standalone` 7.29.0 + `html2canvas` 1.4.1, all from unpkg (pinned, SRI). Google Identity Services for OAuth; Google Sheets API v4 read-only. Script order in `index.html` matters.

## 4. File map (load order = order in `index.html`)
| File | Role |
|---|---|
| `index.html` | entry point; CDN libs, `GOOGLE_CLIENT_ID`, then data → engine → sheets → JSX. **All local assets carry `?v=` cache-bust.** |
| `colors_and_type.css` | Shopdeck design tokens (`--sd-*`) |
| `data.js` | defines `window.INCENTIVE`: roster, TEAMS, TEAM_ORDER, ADMINS, MONTHS, seeded sample data, `DATA_SOURCES` |
| `engine.js` | sample-data engine + shared band definitions (`I.INPUTS`, CORE_BANDS, REVIVAL_BANDS, MM_BANDS…) |
| `live.js` | unused backend adapter |
| `sheets.js` | **the live path** — `SHEETS` config, snapshot fetches, `computeAll`, all team logics, `applyLive` |
| `icons.jsx` · `components.jsx` | inline SVG icons; Button/Card/Modal/MetricTile/Avatar/ProgressBar |
| `drill.jsx` | drill-down popups (every number clickable → rows + CSV) |
| `views.jsx` | `exportCSV`, `exportPNG`, MetricTile, band components |
| `person.jsx` | PersonView — one branch per logic (GM · notice · 1k-5k · campaign · hypercare · revival · KAE · core) |
| `views2.jsx` | roster rows, TeamView (medals + CSV/PNG export), AdminView |
| `screens.jsx` · `app.jsx` | sign-in, AppHeader, DataSourcesPanel; root router + `DrillHost` |
| `tools/` | the 2 refresh scripts + LaunchAgent plist |
| `*.json` | **machine-generated snapshots** — never hand-edit |
| `CNAME` | `hits-incentive.xyz` |

## 5. Data flow (3 mechanisms)
1. **Live Google Sheets** via the signed-in user's OAuth token (`SHEETS` in `sheets.js`).
2. **Committed JSON snapshots** from Metabase, built by the refresh scripts — because Metabase needs a password (can't be in public JS), plus CORS, plus volume (card 10469 is 135 MB).
3. **Hard-coded constants** for interim gaps (Campaign June, `FIXED_PCT`, `NOTICE`).

**Team membership comes from Metabase cards, NOT the People sheet** — GM = 12101, 1k-5k = 12100 (+ target rows per month), Revival = 11911, Campaign = `CAMPAIGN_W0`. Full map + traps in `data-sources`.

## 6. Login / OAuth
Client ID (public): `334591605851-5e15787uo5lu6raii82a10n1u2le3jms.apps.googleusercontent.com`; scopes `spreadsheets.readonly openid email profile`. Flow in `sheets.js` (`getToken`), error mapping in `app.jsx`. In **Google Cloud Console** keep **Authorized JavaScript origins** correct and the consent screen **In production** (Testing mode blocks everyone but listed test users). See `troubleshoot-login`.

## 7. Status by team
| Team | State |
|---|---|
| Core GC · Hypercare · KAE · Revival · GM | ✅ complete |
| **1k-5k** | ✅ full chain live (pool × ARR × churn × Meta S/L × Google S/L × go-live, any gate ⇒ 0%) |
| **Campaign** | ⚠️ **Jun-2026 hard-coded** — needs the rolling Spend/GMV query + POC mapping |
| **Good Seller** | ⛔ "Data awaiting from Rohit" |
| **AI** | ⛔ "Flat incentive for now" |

**Known open items**
1. 🐞 **OPEN BUG — "Jaison" (WM1621) shows *Data missing*** on the 1k-5k view while his data exists in the snapshot. Fully triaged (code, data and cache all ruled out) — see `troubleshoot-data` §3b for exactly what's been eliminated and the one console command that identifies the cause. Durable fix: key `midmarket_incentive.json` by **email** instead of name.
2. **Campaign** rolling Spend/GMV query + POC mapping (Jul onward still hard-coded).
3. **Missing/zero target rows** in card 11322 (Parth Mohanty has no June row; Priyanshu Raj, Aitesam Khan, Patil Jayesh have none at all).
4. **26 sellers silently dropped** from 1k-5k (GC not in the GL list) — not surfaced in the UI.
5. **GL kicker sums** across multi-GL GMs — confirm sum vs average.
6. Task/TS compliance and NPS deliberately ungated.

## 8. Secrets & access (transfer out-of-band)
1. **Metabase credential** → `~/metabase-arr-refresh/.mbcreds`. Now a **`METABASE_API_KEY`**, which survives staff changes (this was the single biggest continuity risk). Subject to a **daily BigQuery scan quota** that allows roughly one full refresh per day — see `refresh-data`.
2. **Google Cloud Console** access to the project owning the OAuth client.
3. **GitHub** write access (or transfer the repo to an org).
4. **GoDaddy DNS** for `hits-incentive.xyz`.

## 9. Deploy
Edit → **bump `?v=`** → commit → push `main` → live in ~1–2 min → hard-refresh. Details in `deploy`.

## 10. Gotchas
- **Sync `engine.js` ↔ `sheets.js`** on any logic change.
- **Bump the cache-bust** or users run stale JS for 10 min.
- Sign-in doesn't work on localhost — verify against the seeded sample data via globals (see `deploy`).
- New `.jsx` must be registered in `index.html` in dependency order.
- Styling is inline-style objects using `--sd-*` vars — no Tailwind/CSS modules.
- Names are messy across sources; `buildResolver` does fuzzy matching. "Saurabh Kumar" ≠ "Sourabh Yadav".
  All ten sheet lookups are **by name**, and a miss drops the row silently — check
  `INCENTIVE.NAME_AUDIT` or the Data sources panel, which now lists every unresolved, ambiguous and
  ambiguously-matched name with its source sheet. See `troubleshoot-data` §2b.
- Snapshots rewrite daily so `.git` grows steadily — accepted.
- The daily **11 AM IST** refresh needs the Mac **awake**; it runs on next wake otherwise. This stalled the pipeline for 10 days in Aug 2026 with no visible error.
