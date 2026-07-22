---
name: refresh-task-data
description: Refresh the task/callback data (task_data.json) from Metabase card 10181, and set up or repair the daily auto-refresh. Use when task/callback numbers look stale, after changing the task/callback logic, or when moving the pipeline to a new machine.
---

# Refresh task/callback data (Metabase → task_data.json)

Task & Callback input metrics do NOT come from a Google Sheet — they come from **Metabase card 10181** ("All Tasks (Pawan) - for website built"), pulled into `task_data.json` (committed to the repo, read same-origin by the app with no auth). The browser can't hit Metabase directly (public site, password can't be in client JS, CORS, ~184k rows), so a script snapshots it. **The same script also pulls Metabase card 11911** (Revived Seller Log) into `revival_data.json`, which powers the Revival team's count-based incentive (see the `incentive-logic` skill). Both files are refreshed and committed together.

## Refresh now (and deploy)
```bash
python3 ~/metabase-arr-refresh/incentive_task_refresh.py --push
```
This: auths to Metabase → pulls card 10181 → keeps GC-bucket rows for the used sub_types since `START_DATE` (default `2026-01-01`) → writes `~/Incentive-Automation/task_data.json` → commits + pushes → Pages redeploys in ~1–2 min. Omit `--push` to build the file without deploying. A repo copy of the script also lives at `~/Incentive-Automation/tools/incentive_task_refresh.py`.

## The daily auto-refresh (macOS LaunchAgent)
Runs `--push` daily at **6:00 AM IST**. Label `com.blitzscale.incentive-task-refresh`.
- Status:  `launchctl list com.blitzscale.incentive-task-refresh`  (want `"LastExitStatus" = 0`)
- Run once: `launchctl kickstart -k gui/$(id -u)/com.blitzscale.incentive-task-refresh`
- Log:      `~/metabase-arr-refresh/incentive_task_refresh.log`
- Note: LaunchAgents don't wake a sleeping Mac — it runs on next wake. For always-on scheduling, move to a server/cron or the org's scheduler.

## Set up on a NEW machine
1. Clone the repo; ensure `gh` is authed with write access (`gh auth status`) and `gh auth setup-git`.
2. Create Metabase creds at `~/metabase-arr-refresh/.mbcreds` (JSON — NEVER commit):
   ```json
   {"METABASE_URL":"https://…","METABASE_USER_EMAIL":"…","METABASE_PASSWORD":"…"}
   ```
   Prefer a Metabase **service account** so it survives staff changes.
3. Copy the script: `cp ~/Incentive-Automation/tools/incentive_task_refresh.py ~/metabase-arr-refresh/`
4. Install the schedule: copy `~/Incentive-Automation/tools/com.blitzscale.incentive-task-refresh.plist` to `~/Library/LaunchAgents/`, **edit the absolute paths** for the new user, then:
   `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.blitzscale.incentive-task-refresh.plist`
5. Test: run the manual command above; confirm a new commit lands and the site updates.

## Logic reminder
Callback within SLA counts `schedule_call` tasks that are done (`completed`/`closed`) AND `tat ≤ sla_in_min`. If you change which sub_types or the SLA rule, update the script AND `engine.js`/`sheets.js` (see the `incentive-logic` skill), then re-run the refresh.
