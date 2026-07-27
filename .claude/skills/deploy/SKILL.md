---
name: deploy
description: Deploy a code change to the HITS Incentive app (hits-incentive.xyz). Use when editing app files (*.jsx, *.js, index.html, css) and pushing them live via GitHub Pages. Covers the edit→commit→push→verify loop and cache-busting.
---

# Deploy the HITS Incentive app

The app is a no-build static site on **GitHub Pages** (repo `pawankumar-pkaytsk/Incentive-Automation`, `main` branch, root) served at **https://hits-incentive.xyz**. Push to `main` → Pages auto-deploys in ~1–2 min.

## Loop
1. Edit files in the repo (`~/Incentive-Automation`).
2. **If you changed incentive math, apply it in BOTH `engine.js` (sample) and `sheets.js` (live)** — they must stay in sync.
3. If you added a new `.jsx`, register it as a `<script type="text/babel" src="…">` in `index.html` in dependency order: icons → components → drill → views → person → views2 → screens → app.
4. Sanity-check plain JS: `node --check sheets.js engine.js data.js live.js`.
5. Commit + push:
   ```bash
   cd ~/Incentive-Automation
   git add -A
   git commit -m "…"
   git push origin main
   ```
   End commit messages with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
6. **Bump the cache-bust version** whenever you change any local `.js`/`.jsx`/`.css`: in `index.html`, all local resources are loaded as `foo.js?v=YYYYMMDDx` — bump the shared `?v=` value (e.g. `20260727a` → `20260727b`). GitHub Pages serves these with `max-age=600`, so without a bump users can run stale JS for up to 10 min. (CDN libs — React/Babel/html2canvas — are already version-pinned; leave them.)
7. Wait ~1–2 min, then hard-refresh the site (**Cmd+Shift+R**). Even with the `?v=` bump, the *first* load needs one hard refresh because `index.html` itself is cached ~10 min; after that, new deploys propagate automatically.

## Verify before/after
- Locally: serve the folder (`python3 -m http.server 8767 --directory ~/Incentive-Automation`) and open it. Note: **Google sign-in won't work on localhost** (origin not authorized) — to verify UI/logic without signing in, the seeded sample data is available via `window.INCENTIVE` (`I.people`, `I.teamSummary('core')`, etc.), and components are global (`window.TeamView`, `window.PersonView`).
- Never delete `CNAME` (binds the custom domain).

## Guardrails
- Repo is **public** — never commit secrets (`.mbcreds`, passwords, tokens).
- Don't hand-edit `task_data.json` — it's machine-generated (see the `refresh-task-data` skill).
