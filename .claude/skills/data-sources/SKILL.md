---
name: data-sources
description: Map of every data source behind the HITS incentive app — which Metabase card or Google Sheet feeds which number, how each reaches the browser, and the known attribution traps. Use when tracing where a figure comes from, adding a new source, or debugging wrong numbers.
---

# Data sources map

Three delivery mechanisms. Knowing which one a number uses tells you where to fix it.

| Mechanism | How | Why |
|---|---|---|
| **Live Google Sheet** | browser reads with the **signed-in user's OAuth token** (`SHEETS` in `sheets.js`) | no secrets in client; per-user permissions apply (a user without sheet access gets a 403) |
| **Committed JSON snapshot** | Python pulls Metabase → commits `*.json` → browser fetches same-origin, no auth | Metabase needs a password (can't be in public JS) + CORS + volume (one card is 135 MB) |
| **Hard-coded in `sheets.js`** | constants | interim, pending a real source |

## Google Sheets (live, OAuth)
`SHEETS` in `sheets.js` — each entry is `{ id, tab, col }`, `col` maps field → 0-based column, header row dropped.

| Key | What it feeds |
|---|---|
| `hitsmaster` | seller HITs by month/year |
| `people` | roster: empId, name, email, manager_email, team, designation |
| `target` | monthly HIT targets (core/GM) |
| `handover` | seller→GC/GM attribution + handover flag (GM hits come from col F) |
| `threeweek` | 3-week-go-live seller IDs (count ×1.5) |
| `spend` | daily spend/live per GC → Core Input A |
| `hits2` | **HITS-2 handover log** — the seller→GL *name* map for 1k-5k HIT2 credit |
| `sos` | escalations → WES (Core Input D) |
| `strikes` | KAE strikes |

⚠️ The **People sheet is NOT the source of team membership** for GM, 1k-5k, Revival or Campaign — see the traps below.

## Metabase cards → snapshots
Built by two scripts (see the `refresh-data` skill).

| Card | Provides | Lands in |
|---|---|---|
| **10181** | all tasks (incl. `id`, `sla_in_min`, `tat`) → Task + Callback-within-SLA | `task_data.json` (~20 MB) |
| **11911** | Revived Seller Log → Revival team | `revival_data.json` |
| **12101** | GM → core-GC mapping **+ `cl` (cluster lead)** | `gm_mapping.json` |
| **12100** | 1k-5k GL roster | `midmarket_data.json` |
| **11322** | HITS targets (`Role='1K-5K'` for 1k-5k) | `midmarket_data.json` |
| **11020** | per-age ARR TARGET row (M0–M5) | `midmarket_incentive.json` |
| **7336** | seller × month ARR | ″ |
| **10453** | cohort, HIT1/HIT2, `good_seller`, `team` | ″ |
| **10469** | **day-wise** seller spend + ARR, split Meta/Google (135 MB) | ″ |
| **7401** | `google_ad_account_id`, lifetime Google spend | ″ |
| **7753** | seller → GC/GM/GL | ″ |

## Hard-coded (needs replacing)
- **Campaign** `CAMPAIGN_W0` in `sheets.js` — week-0 Spend/GMV for 4 GCs, **Jun-2026 only**. TODO: rolling query + POC mapping.
- `FIXED_PCT = { 'WM363': 15 }` — per-person fixed incentive override.
- `NOTICE` — Good Seller → "Data awaiting from Rohit"; AI → "Flat incentive for now".

## ⚠️ Attribution traps (each cost real debugging — don't repeat)

1. **`7753.growth_lead_name` is NOT the 1k-5k GL.** It matches **0/252** sellers. The GL is in **`growth_consultant_name`** (210/252).
2. **Never credit HIT2 via card 7753** — it blanks after a seller moves out of 1k-5k, making HIT2 achieved read **0 for everyone**. Use the **HITS-2 handover sheet** for the GL name, card 10453 for which/when.
3. **Card 10992's changelog cannot attribute 1k-5k GLs.** It emits only GC/GM/KAM roles and reproduces just **45%** of the handover sheet's GLs. Evaluated and rejected.
4. **Team membership comes from cards, not the People sheet**: GM = card 12101, 1k-5k = card 12100 (+ target rows for past periods), Revival = card 11911 submitters, Campaign = `CAMPAIGN_W0`. `classify()` never returns `gm` or `midmarket`.
5. **Names are messy** — the handover sheet uses short forms ("Parth", "Shivon", "Lehar"); `buildResolver` in `sheets.js` does exact → first+last → first-token matching. "Saurabh Kumar" and "Sourabh Yadav" are **different people**.
6. **Don't average daily percentages** for Spend/Live — sum numerators and denominators, then divide.
7. **The cohort already matches card 11020 exactly** (15/24/59/66/44/44 = 252). There is no extra exclude list to apply.

## Verified facts worth keeping
- ARR TARGET row: `1859 · 3668 · 4133 · 4480 · 4748 · 4647`; **`m6` is NULL so the M5 cap is required**.
- Spend/Live universe: `team='HITS'` & not `good_seller` = **218**; 207 map to a known GL.
- Units are consistent — cohort median ARR ≈ 1,451 vs M0 target 1,859.
