---
name: deploy
description: Deploy a change to the HITS Incentive app (hits-incentive.xyz) — the edit → cache-bust → commit → push → verify loop for this no-build GitHub Pages site. Use when editing any *.jsx, *.js, index.html or CSS in this repo.
---

# Deploy the HITS Incentive app

No-build static site on **GitHub Pages** (`pawankumar-pkaytsk/Incentive-Automation`, `main`, root) → **https://hits-incentive.xyz**. Push to `main` → live in ~1–2 min.

## The loop
1. Edit files in `~/Incentive-Automation`.
2. **If you touched incentive maths, change BOTH `engine.js` and `sheets.js`** (see `incentive-logic`).
3. New `.jsx`? Register it in `index.html` as `<script type="text/babel" src="…">` in dependency order: icons → components → drill → views → person → views2 → screens → app.
4. Syntax-check plain JS: `node --check sheets.js engine.js data.js live.js`
   (`.jsx` can't be node-checked — verify via `Babel.transform` in the browser, see below.)
5. **⚠️ BUMP THE CACHE-BUST** — every local asset in `index.html` is `foo.js?v=YYYYMMDDx`. Bump the shared value on **any** JS/CSS change:
   ```bash
   sed -i '' 's/?v=20260729j/?v=20260730a/g' index.html
   ```
   Pages serves these with `max-age=600`; without a bump users run stale code for up to 10 min. This has repeatedly looked like "the fix didn't work". CDN libs are already version-pinned — leave them.
6. Commit + push:
   ```bash
   git add -A && git commit -m "…" && git push origin main
   ```
   End commit messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
7. Wait ~1–2 min, hard-refresh (**Cmd+Shift+R**). The first load after a bump still needs one hard refresh because `index.html` itself is cached ~10 min; after that new deploys propagate on their own.

## Verifying before you push
Google sign-in **doesn't work on localhost** (origin not authorised), so you can't see live data locally. Instead:
```bash
python3 -m http.server 8767 --directory ~/Incentive-Automation
```
Everything is a global, so you can drive the app from the console with the **seeded sample data**:
- `window.INCENTIVE` (`I.people`, `I.cur(p)`, `I.teamSummary('core')`, `I.CURKEY`)
- Components: `window.TeamView`, `window.PersonView`, `window.Drill`, `window.DrillHost`
- Re-eval a changed file without a reload:
  ```js
  const s = await (await fetch('person.jsx?_='+Date.now(),{cache:'no-store'})).text();
  (0,eval)(Babel.transform(s,{presets:['react']}).code);   // also confirms it compiles
  ```
- To open a drill modal, mount `DrillHost` then call `window.__openDrill(payload)`.
- Mount a view with `ReactDOM.createRoot(el).render(React.createElement(window.PersonView, {...}))`.

To check what's actually live: `curl -s https://hits-incentive.xyz/sheets.js | grep -c "<marker>"`.

## Guardrails
- Repo is **public** — never commit secrets (`.mbcreds`, passwords, tokens).
- Never delete `CNAME` (binds the custom domain).
- Don't hand-edit `*.json` snapshots — they're machine-generated (see `refresh-data`).
