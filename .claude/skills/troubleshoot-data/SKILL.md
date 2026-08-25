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

## 2b. "Data missing" / 0 HITs for ONE person — check name resolution FIRST

Every sheet lookup is by **name**, not email: target, handover (GC *and* GM columns), spend, sos,
strikes, revival log, HITS-2 handover, and the card-12100 1k-5k targets — ten call sites. A name that
fails to match a roster person **drops the row silently**. A missing target renders as "Data missing";
missing handover rows render as 0 HITs. Nothing else indicates a problem.

**Real case:** the target sheet said `Yash Sureshbhai`; the roster says `Desai Yash Sureshbhai`. Every
matcher tier anchors on the **first token**, so a roster name carrying an extra *leading* token never
matched and a GM's target of 13 was dropped. Meanwhile his GC list and ops multiplier computed fine —
because those come from card 12101 keyed by **email**. That split (email paths work, name paths fail)
is the signature of this bug.

**Diagnose it in one step — open the Data sources panel.** Unresolved names are listed there with the
sheet each came from. Or in the console:

```js
INCENTIVE.NAME_AUDIT      // { unresolved, ambiguous, riskyPicks, byTier }
```

- **unresolved** — no roster match; every row using this name was dropped
- **ambiguous** — matched several people, so the matcher refused rather than guess
- **riskyPicks** — ⚠️ matched, but several people fit and the matcher kept the *last* one. A bare
  `Rahul` lands on whichever Rahul sorts last out of five. Credit may be on the wrong person.

**Fix in the sheet, not the code** — make the spelling match the People sheet exactly. These sheets
are read live, so it takes effect on the next page load.

### Matcher tiers (`buildResolver`)
`exact` → `first+last` → `first+initial` → `first-anchored` → `compact` → `contains`.

The last two are the safety net: `compact` ignores spacing (`Ameen AR` = `Ameen A R`); `contains`
does order-insensitive token containment, which is what catches a leading surname. **Both accept only
a unique match** — this roster holds five Rahuls and two Rohits, and a wrong silent match is worse
than a visible miss. Do NOT loosen this without the uniqueness guard.

## 3. A metric reads 0 for everyone
Almost always an **attribution** break, not a maths bug:
- **HIT2 = 0 for all GLs** → something is crediting via card **7753**, which blanks post-move. Must use the **HITS-2 handover sheet**.
- **ARR rolled up to unknown people** → someone used `7753.growth_lead_name` (matches 0/252). The GL is **`growth_consultant_name`**.
- Check name resolution: the handover sheet uses short names; `buildResolver` does exact → first+last → first-token. "Saurabh Kumar" ≠ "Sourabh Yadav".

## 3b. One GL has no breakdown while others do
`midmarket_incentive.json` is keyed by the **card-12100 GL name** (`Jaison s`, `LEHAR GUPTA`,
`SHREYASH KOTLAWAR`), which often differs in case/spelling from the roster name. Looking the row
up by `p.name` silently returns null and the entire ARR/Spend-Live breakdown vanishes for that
person only. Persons carry `p.mmName` (the canonical card name) — look up by that first, then the
roster name, then a normalised match. Same trap applies to any future snapshot keyed by name;
prefer keying by email where possible.

### ⚠️ OPEN BUG (unresolved as of 2026-08-01) — "Jaison" still shows *Data missing*
The §3b fix resolved LEHAR GUPTA and SHREYASH KOTLAWAR but **Jaison (WM1621) still renders the
null state** on the live site. Everything below was verified and is **NOT** the cause — don't redo it:

- Deployed `sheets.js` contains both halves of the fix (`who.mmName = nm` at ~line 208; the
  `mmName → name → normalised` lookup at ~line 350).
- Live `midmarket_data.json`: `{gl:'Jaison s', glEmail:'jaison@blitzscale.co'}`, Jul target 1.
- Live `midmarket_incentive.json`: `months['2026-07'].gls['Jaison s']` exists with 16 detail rows
  (arrPct 61.93, arrTarget 60650, metaSL 58.33, googleSL 51.39, golive 37.5, churn 1).
- Replaying his exact case (roster name `Jaison`, email `jaison@blitzscale.co`) through the
  deployed resolver **does** return the row — so the logic is right in isolation.
- The snapshot **is** loading in his session: his HIT2 = 1 comes from that same file.
- Cache was suspected and ruled out (live `index.html` → `?v=20260730a`; that URL serves the fix).

**Next step — get runtime state** (can't be done without signing in). On his page, console:
```js
(p=>({name:p.name,mmName:p.mmName,team:p.team,meta:INCENTIVE.MMINC_META,
      gi:(INCENTIVE.cur(p)||{}).mmHasInputs,arr:(INCENTIVE.cur(p)||{}).mmArrPct}))
 (INCENTIVE.people.find(x=>/jaison/i.test(x.name)))
```
- `mmName:'Jaison s'` + `gi:false` → the lookup genuinely fails at runtime; instrument `mi.gls` keys.
- `mmName:undefined` → he reaches the team via a path that skips `mkMM` — find it.
- `meta:null` → the snapshot didn't load that session.

**Likely durable fix regardless:** key `midmarket_incentive.json` by **email**, not name. The Python
script already resolves each seller to a GL; emit `glEmail` alongside `gl` and look up by email.
That removes this whole class of bug permanently.

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
