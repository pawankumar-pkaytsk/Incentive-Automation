---
name: incentive-logic
description: How every HITS incentive is calculated — Core GC, Hypercare, KAE, Revival, Campaign, 1k-5k (midmarket), GM rollup — plus team-membership rules, windows, overrides and which files to keep in sync. Use when changing or explaining the incentive maths.
---

# Incentive logic reference

> **Golden rule:** the maths lives in **both** `engine.js` (seeded sample + shared band definitions) and `sheets.js` (`computeAll`, live rows). **Every logic change must go in both**, or sample and live disagree. If it changes what's counted upstream, also update the refresh scripts (see `refresh-data`).

## Team → logic
`logicFor(team)` → `core` · `hypercare` · `kae` · `revival` · `campaign` · `midmarket` · `goodseller` · `ai`.

**Membership comes from cards, not the People sheet** (`classify()` never returns `gm` or `midmarket`):

| Team | Source of truth |
|---|---|
| **GM** | card **12101** (strictly). Anyone listed is a GM; nobody else is. |
| **1k-5k** | card **12100**, **plus** anyone with a 1k-5k target row for *that* month (`p.mmPeriods`, enforced in `teamMembers()`) so past GLs appear in their own months only |
| **Revival** | card **11911** submitters (synthesized if absent from the roster) |
| **Campaign** | `CAMPAIGN_W0` in `sheets.js` |
| everything else | `classify()` on designation/teamRaw |

**Cluster lead** (`p.cl`) comes from card 12101's `cl` — constant per GM, inherited by their GCs.

## Windows (deliberately not uniform)
- Most metrics: **20th → 20th** (`windowFor`, `WINDOW_START_DAY = 20`)
- Revival + 1k-5k ARR/Spend-Live: **20th → 19th** (`cycleWindowFor`)
- Callback-within-SLA: 20th→19th, **except Jun-2026 = 2 Jul → 19 Jul** (policy launched mid-cycle on 2 Jul; `callbackWindowFor`)
- 1k-5k HIT2 achieved: **calendar month**

---

## core
`output = perHitRate × weightedHits`, then `× multiplier`.
- Achievement % = `weightedHits ÷ target`. `weightedHits`: 3-week sellers ×1.5, hypercare ×1.
- Rate bands: `>120% → 6.25` · `90–120% → 4.5` · `50–90% → 1.5` · `<50% → 0`
- Multiplier from 4 input bands: all green→**1.5** · mix g/y→**1.3** · all yellow→**1.0** · exactly 1 red→**0.85** · ≥2 red→**0.70** · all red→**0**

| # | Input | Green | Yellow | Red |
|---|---|---|---|---|
| A | Spend / Live | >80% | 70–80% | <70% |
| B | Task Adherence | >90% | 70–90% | <70% |
| C | **Callback Adherence within SLA** | **>90%** | **75–90%** | **<75%** |
| D | WES (escalations) | <25 | 25–45 | >45 (lower better) |

- **Task** = closed/completed ÷ total over sub_types `internal_seller_escalation_general_request`, `pre-live-call`, `troubleshoot_manual_action`.
- **Callback within SLA** = (done AND `tat ≤ sla_in_min`) ÷ total, sub_type **`schedule_call` only**.
- **WES** = social×3 + sos×1.5 + internal×1, de-duped per seller/day/type.

## hypercare
Cumulative per-HIT schedule `[7, 8, 9, 11, 15]`, then flat `20` beyond the 5th. No multiplier.

## kae
Flat base ₹6,500 reduced by strike bands (0 → full, more strikes → larger deduction → 0). From the strikes sheet by Emp ID.

## revival
Whole count × band rate on the 20th→19th cycle (non-tiered):
`≤20 → ₹0` · `21–30 → ₹200/rev` · `31–40 → ₹250/rev` · `41+ → ₹375/rev`
Boundary: 40 uses 250 (per the literal "31–40" row); >40 uses 375.

## campaign
Linear **inverse** on Spend/GMV: `Incentive% = 25% × (42% ÷ Spend/GMV%)`. At 42% → 25%; lower is better.
**Hard-coded for Jun-2026 only** (`CAMPAIGN_KEY`, `CAMPAIGN_W0`). **TODO:** rolling query + POC mapping.

## midmarket (HITS 1k-5k) — full chain
```
Final % = pool × ARR × churn × MetaSL × GoogleSL × Golive     — any failed gate ⇒ 0%
```
| Component | Value | Gate | Multiplier |
|---|---|---|---|
| **Pool** | HIT2 achieved ÷ target | pool 0 ⇒ 0 | ≥100%→25% · 50–99%→15% · <50%→0 |
| **ARR** | achieved ÷ **earned** target | **<85% ⇒ 0** | ≥150%→1.25× · ≥200%→2× |
| **Churn** | events in cycle | **2+ ⇒ 0** | 0→1× · 1→0.5× |
| **Meta S/L** | day-wise weighted | **<60% ⇒ 0** | >80%→1.25× |
| **Google S/L** | day-wise weighted | **<65% ⇒ 0** | >75%→1.2× |
| **Go-live** | live ÷ assigned | **<50% ⇒ 0** | >65%→1.25× |

- **ARR target is *earned***: each cohort seller carries a per-age target from card 11020's TARGET row (M0 1859 · M1 3668 · M2 4133 · M3 4480 · M4 4748 · M5 4647), **capped at M5** (`m6` is NULL — the cap is required). Age = report month − HIT1 month.
- **HIT2 freeze**: at conversion the seller stops accruing target and **drops out of later months** (contributes from HIT1 handover until HIT2 handover). Frozen ARR = latest **daily** `arr_overall` (card 10469) on/before the conversion Friday. Guard: only freeze if `HIT1 ≤ conversion ≤ report month`, else treat as bad data (fires on 1 real seller).
- **HIT2 achieved** = card 10453 `hit2=1`, `hit2_year/month = report month`, excluding `good_seller`, credited to the GL named in the **HITS-2 handover sheet**.
- **Spend/Live** = Σ(seller-days with channel spend > 0) ÷ (settled days × live sellers). Sum numerators/denominators — never average day-rates. Meta denominator = assigned sellers; Google denominator = Google-live sellers. "Settled days" = cycle days with market-wide booked spend > 0.
- **Google-live** = has `google_ad_account_id` AND lifetime Google spend > ₹1, **frozen at the cycle end** by cumulating daily `spend_google`. (Stricter than 7401's current state: 80 vs 99 sellers — 7401 isn't historised.)
- **Churn** is an **event**: cumulative spend ≥ ₹11,800 then the >21-day idle threshold crossed within `[cycle start, min(cycle end, today)]`. Never a standing "currently idle" state, and never measured against a future cycle end — both bugs inflated counts.
- **Target 0 vs no row** are different: `0` → "HIT2 target is 0" (intentional, pool 0); missing row → "No HIT2 target set" + `dataHealth: attention`.
- **Task/TS compliance and NPS are deliberately NOT gated** (not available per-GL).

## GM rollup
`output = (HITs ÷ target) × 25%`, then the **GC-ops multiplier** over the GM's card-12101 GCs: any Red→**0.70** · any Yellow, none Red→**1.20** · all Green→**1.50**.
- **GL kicker**: the GM also earns **1/5 of each reporting 1k-5k GL's incentive** (card 12100 gm→gl), **summed** and added on top. ⚠️ If it should be an *average* for multi-GL GMs, that's a one-line change.
- `gm.gcEmails` carries the card-12101 GC list — the roster hierarchy (`person.reports`) is only a fallback for sample data.

## Overrides & notices
- `FIXED_PCT = { 'WM363': 15 }` — pins a person's final %; **wins over everything, kicker included**.
- `NOTICE` — **Good Seller** → "Data awaiting from Rohit"; **AI** → "Flat incentive for now". Both render a notice instead of a number (`finalPct: null`) and show the CL.
- Good Seller and AI have **no computed logic** — they are placeholders awaiting rules.

## Other concepts
PIP flag (last 2 months; GC 50%, GM 70%; Core & Hypercare GCs only) · adhoc adjustments (relative % + flat pp) · `dataHealth` ok/attention/missing with `missingFields` · every number is clickable → drill-down with the formula substituted and CSV export.
