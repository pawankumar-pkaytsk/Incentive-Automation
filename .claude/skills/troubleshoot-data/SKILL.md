---
name: troubleshoot-data
description: Diagnose wrong or missing numbers in the HITS incentive app — a person on the wrong team, someone missing entirely, a metric reading 0 or absurdly high, stale figures after a deploy, or two parts of a page disagreeing. Use when someone says "this number looks wrong".
---

# Troubleshoot wrong numbers

Work down this list — the first four causes account for nearly every report so far.

## 1. Stale JavaScript (check this FIRST)
GitHub Pages serves with `max-age=600` and this has caused *multiple* "the fix didn't work" reports.
- Every local asset in `index.html` carries `?v=YYYYMMDDx`. **Did you bump it?** (see `deploy`)
- Ask the user to **hard-refresh (Cmd+Shift+R)**, or check in Incognito.
- Confirm what's actually live: `curl -s https://hits-incentive.xyz/sheets.js | grep -c "<a marker from your change>"`

## 2. Person on the wrong team / missing entirely
Team membership comes from **cards, not the People sheet**:
- **GM** → card 12101 · **1k-5k** → card 12100 (+ target rows per month) · **Revival** → card 11911 submitters · **Campaign** → `CAMPAIGN_W0`
- Not in the card → not on that team (that's the design). Someone showing under Core who shouldn't be usually just isn't in their team's card.
- **1k-5k is per-period**: a GL appears in a month only if they're in card 12100 *or* have a target row for that month. Missing in one month but present in another is expected.
- Missing from the roster entirely? Revival and 1k-5k **synthesize** absent people; Core/GM need a People-sheet row.

## 3. A metric reads 0 for everyone
Almost always an **attribution** break, not a maths bug:
- **HIT2 = 0 for all GLs** → something is crediting via card **7753**, which blanks post-move. Must use the **HITS-2 handover sheet**.
- **ARR rolled up to unknown people** → someone used `7753.growth_lead_name` (matches 0/252). The GL is **`growth_consultant_name`**.
- Check name resolution: the handover sheet uses short names; `buildResolver` does exact → first+last → first-token. "Saurabh Kumar" ≠ "Sourabh Yadav".

## 4. A count looks absurdly high
- **Churn** must be an **event inside the cycle**, not "currently idle", and must never measure idle against a **future** cycle end. Both bugs produced inflated counts (13 vs a real 3).
- For any in-progress month, evaluation is capped at `min(cycle end, today)`.

## 5. Two parts of the page disagree
Means two code paths read different sources. Precedent: the GM ops multiplier read card 12101 while the "Reporting GCs" table read `person.reports` — showing "1 green · 2 yellow" above "0 GCs". Fix by pointing both at the same list (`gm.gcEmails`).

## 6. Numbers are right but stale
- Snapshots refresh at **6 AM IST** via the LaunchAgent; a sleeping Mac skips it. Check `launchctl list com.blitzscale.incentive-task-refresh` (want `LastExitStatus = 0`) and the log.
- Re-run manually — see `refresh-data`.

## 7. Missing targets
Card 11322 has real gaps. Known: **no June row** for Parth Mohanty; **no row at all** for Priyanshu Raj, Aitesam Khan, Patil Jayesh; **null July** for Pranjal Dhing, Rayala Bhanu Sriraj; **zero** for Saurabh Kumar/Sankhajit Ghosh (Jun), LEHAR GUPTA/Tuleshwar Sahu (Jul). A missing row flags `dataHealth: attention`; a zero is treated as intentional.

## 8. Silent cohort loss (known, unsurfaced)
Sellers whose GC isn't in the GL list are dropped from **both** 1k-5k target and achievement (**26 in June**). The ratio still looks clean. Not yet surfaced in the UI — worth adding as a data-health count.

## How to verify a number properly
Don't eyeball it — recompute from source and compare:
1. Pull the card with `~/metabase-arr-refresh/.mbcreds` (see `refresh-data`).
2. Recompute the metric in Python for one person/month.
3. Compare against the app (`I.cur(person)` in the browser console).

This is how the `growth_lead_name`, HIT2-zero and churn bugs were each caught. Attribution changes especially **must** be checked against a known-good source (e.g. the handover CSV) before shipping.
