---
name: refresh-data
description: Refresh the committed Metabase snapshots that power the HITS incentive app (task/callback, revival, GM+CL mapping, 1k-5k targets, and the full 1k-5k ARR/Spend-Live/churn engine), and set up or repair the daily auto-refresh. Use when numbers look stale, after changing any incentive logic, or when moving the pipeline to a new machine.
---

# Refresh the data snapshots

Metabase can't be read from the browser (password can't live in public JS, plus CORS and volume — card 10469 alone is 135 MB), so two Python scripts pull the cards and **commit JSON snapshots** the app reads same-origin. See the `data-sources` skill for the full card map.

## The two scripts

**1. `incentive_task_refresh.py`** — small cards, fast (~2 min)
```bash
python3 ~/metabase-arr-refresh/incentive_task_refresh.py --push
```
Cards **10181** → `task_data.json` · **11911** → `revival_data.json` · **12101** → `gm_mapping.json` (incl. `cl`) · **12100 + 11322** → `midmarket_data.json`

**2. `midmarket_incentive_refresh.py`** — the 1k-5k engine, slower (~2–3 min, pulls the 135 MB daily card)
```bash
python3 ~/metabase-arr-refresh/midmarket_incentive_refresh.py --push
```
Cards **11020, 7336, 10453, 10469, 7401, 7753** → `midmarket_incentive.json` (~260 KB). Computes per GL per month: ARR earned-target & achieved (with the HIT2 freeze), Meta/Google Spend/Live (day-wise weighted), Google go-live (frozen at cycle end), churn events, the HIT2 seller list, **and per-seller detail for every drill-down**.

Omit `--push` to build without deploying. Repo copies live in `tools/`.

## Daily auto-refresh
macOS LaunchAgent **`com.blitzscale.incentive-task-refresh`** runs *both* scripts at **6:00 AM IST**.
- Status: `launchctl list com.blitzscale.incentive-task-refresh` (want `"LastExitStatus" = 0`)
- Run now: `launchctl kickstart -k gui/$(id -u)/com.blitzscale.incentive-task-refresh`
- Log: `~/metabase-arr-refresh/incentive_task_refresh.log`
- Plist (also in `tools/`): `~/Library/LaunchAgents/com.blitzscale.incentive-task-refresh.plist`
- ⚠️ LaunchAgents don't wake a sleeping Mac — it runs on next wake. For always-on, move to a server/cron.

## Setup on a NEW machine
1. Clone the repo; `gh auth status` must show write access; run `gh auth setup-git`.
2. Create `~/metabase-arr-refresh/.mbcreds` (**never commit**):
   ```json
   {"METABASE_URL":"https://…","METABASE_USER_EMAIL":"…","METABASE_PASSWORD":"…"}
   ```
   Prefer a Metabase **service account** so it survives staff changes.
3. `mkdir -p ~/metabase-arr-refresh && cp ~/Incentive-Automation/tools/*.py ~/metabase-arr-refresh/`
4. Copy `tools/com.blitzscale.incentive-task-refresh.plist` to `~/Library/LaunchAgents/`, **edit the absolute paths for the new user**, then:
   `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.blitzscale.incentive-task-refresh.plist`
5. Test: run both scripts manually, confirm commits land and the site updates.

## After changing incentive logic
If you change what's counted, re-run the relevant script **and** keep `engine.js` + `sheets.js` in sync (see `incentive-logic`). Snapshot shape changes need matching reads in `sheets.js`.

## Gotchas
- The scripts are **idempotent** — safe to re-run; they only commit when content changed.
- `task_data.json` (~20 MB) and `midmarket_incentive.json` rewrite daily, so `.git` grows steadily. Accepted (mirrors the sibling metrics-site repo).
- `midmarket_incentive_refresh.py` reads `midmarket_data.json`, so **run script 1 before script 2** on a fresh clone (the LaunchAgent already does).
- Don't hand-edit any `*.json` snapshot — it's machine-generated and will be overwritten.
