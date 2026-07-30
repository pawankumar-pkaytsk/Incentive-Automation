# HITS Incentive Automation

Single-page web app showing live sales-incentive calculations for ShopDeck's "HITS" growth teams. No build step, no backend — plain `<script>` + in-browser Babel; users sign in with their company Google account and everything is computed client-side.

- **Live:** https://hits-incentive.xyz
- **Hosting:** GitHub Pages (`main`, root) + GoDaddy DNS. Do not delete `CNAME`.

## New maintainer? Start here
- **[ONBOARDING.md](ONBOARDING.md)** — the full handoff: architecture, login/OAuth, data sources, daily refresh, incentive logic, secrets to transfer, deploy, gotchas.
- **`.claude/skills/`** — task-ready skills for Claude Code:
  - `deploy` — ship a change live (incl. the mandatory cache-bust bump)
  - `data-sources` — which card/sheet feeds which number + the attribution traps
  - `refresh-data` — the two Metabase refresh scripts and the daily job
  - `incentive-logic` — how every team's incentive is calculated
  - `troubleshoot-data` — "this number looks wrong"
  - `troubleshoot-login` — Google sign-in failures
- **`tools/`** — both Metabase refresh scripts + the LaunchAgent for the daily auto-refresh.

## Golden rule
Incentive math lives in **both** `engine.js` (sample) and `sheets.js` (live) — change both or they'll disagree. See ONBOARDING §3 and the `incentive-logic` skill.
