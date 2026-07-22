---
name: incentive-logic
description: Reference for how HITS incentives are calculated (team logics, achievement bands, input-band multiplier, callback-within-SLA, hypercare schedule, KAE strikes, PIP). Use when changing or explaining the incentive math, and to know which files to keep in sync.
---

# Incentive logic reference

> **Golden rule:** the math lives in BOTH `engine.js` (computes over the seeded sample roster; also defines `I.INPUTS` band labels/thresholds shown in the UI) and `sheets.js` (`computeAll`, over live rows). **Any logic change must be made in both**, or sample and live disagree. If it touches task/callback sub_types or the SLA rule, also update `tools/incentive_task_refresh.py` (see the `refresh-task-data` skill).

## Team → logic
Teams (from designation/team): core, midmarket, goodseller, hypercare, revival, campaign, ai, kae, gm → mapped by `logicFor()` to one of: **core**, **hypercare**, **kae**, **revival** (GM = rollup of GC descendants).

## core logic
`output = perHitRate × weightedHits`, then `finalPct = output × multiplier`.

- **Achievement %** = `weightedHits ÷ target × 100`.
- **Core rate bands** (by achievement %): `>120% → 6.25` · `90–120% → 4.5` · `50–90% → 1.5` · `<50% → 0`.
- **Multiplier** from 4 input bands, each graded green/yellow/red:
  - all green → **1.5** · mix green/yellow → **1.3** · all yellow → **1.0** · exactly 1 red → **0.85** · ≥2 red → **0.70** · all red → **0**.
- **Input bands** (A–D):
  | # | Input | Green | Yellow | Red |
  |---|---|---|---|---|
  | A | Spend / Live | >80% | 70–80% | <70% |
  | B | Task Adherence | >90% | 70–90% | <70% |
  | C | **Callback Adherence within SLA** | **>90%** | **75–90%** | **<75%** |
  | D | WES (Escalations) | <25 | 25–45 | >45 (lower is better) |

## Task & Callback (from Metabase card 10181 → task_data.json)
Bucketed per GC per pay-period window (**20th→20th**, `WINDOW_START_DAY=20`). "Done" = status `completed`/`closed`.
- **Task Adherence** = done ÷ total, over sub_types: `internal_seller_escalation_general_request`, `pre-live-call`, `troubleshoot_manual_action`.
- **Callback Adherence within SLA** = (done AND `tat ≤ sla_in_min`) ÷ total, over sub_type `schedule_call` **only**. `tat` and `sla_in_min` are minutes from the query.
- Code: `sheets.js` task/callback loop (`taskByPM`/`callByPM`); the callback bucket's `done` holds the *within-SLA* count so `pct = done/total`.

## WES (Input D)
`WES = social×3 + sos×1.5 + internal×1`, de-duped by seller/day/type. From the `sos` sheet.

## hypercare logic
Cumulative per-HIT schedule `[7, 8, 9, 11, 15]` then flat `20` per HIT beyond the 5th. No multiplier.

## kae logic
Flat base ₹6,500, reduced by strike bands (0 → full; more strikes → larger deduction, down to 0). From the `strikes` sheet, matched by Emp ID.

## revival logic (from Metabase card 11911 → revival_data.json)
Count-based ₹ payout, per revival GC per **20th→19th** cycle (note: NOT 20th→20th; uses `revivalWindowFor`). Count = number of revival-log rows attributed to the GC (`submitted_by`, resolved to roster) in the window. Amount = **whole count × the band's rate** (non-tiered):
| Revival count | Rate | Max |
|---|---|---|
| ≤ 20 | ₹0 | below threshold |
| 21–30 | ₹200/rev | ₹6,000 |
| 31–40 | ₹250/rev | ₹10,000 |
| 40+ (41+) | ₹375/rev | uncapped ("₹15,000 & up") |
Boundary: 40 → 250 (per literal "31–40" row); >40 → 375. Code: `REVIVAL_BANDS`/`revivalBandOf` + the `revival` branch in `computeAll` (sheets.js) and `computeRevivalMonth` (engine.js). Data source: `tools/incentive_task_refresh.py` also pulls card 11911. `revival` team is not PIP-eligible.

## Other concepts
- **weightedHits**: 3-week-go-live sellers count ×1.5; hypercare counts ×1.
- **GM rollup**: sum of GC descendants; GM output = (HITs ÷ target) × 25%, then a GC-ops multiplier across reporting GCs.
- **PIP flag**: last 2 months; threshold GC 50%, GM 70%; KAE n/a.
- **adhoc adjustments**: relative % and flat pp overrides per person (see AdhocEditor).
- **dataHealth**: ok / attention / missing, with `missingFields`.

## Where numbers surface
`I.finalPctWithAdhoc(p)`, `I.cur(p)`, `I.teamSummary(key)`, `I.INPUTS` (band defs). Every number is clickable → drill-down (`drill.jsx`) showing the underlying rows + CSV.
