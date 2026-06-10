/* =====================================================================
   Incentive Automation — LIVE Google Sheets (no backend, no Apps Script)
   ---------------------------------------------------------------------
   1. Google Sign-In (GIS OAuth token flow) with the Sheets read scope.
   2. Read every source sheet straight from the browser using the SIGNED-IN
      user's own access token (so company-email permissions still apply).
   3. Run the full incentive engine here and hand the result to the UI.
   ===================================================================== */
(function () {
  const I = window.INCENTIVE;
  const CLIENT_ID = window.GOOGLE_CLIENT_ID || '';
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly openid email profile';

  /* ---- Source sheets (fileId + tab + 0-based columns) ---------------- */
  const SHEETS = {
    hitsmaster: { id: '118VOymNnTx_9xVSVr5AHLYZemTi-kxj2uBYURZPSGbQ', tab: 'hitsmaster', col: { sellerId: 0, sellerName: 1, month: 2, year: 3 } },
    people:     { id: '1HliC-KU8MaUptWtlIXnvBn-MoOG07h1KJt-gJ-cvcno', tab: 'People',     col: { empId: 0, name: 1, email: 2, managerEmail: 3, team: 4, designation: 5 } },
    target:     { id: '1jsH10XfE1QQfx6ZgbiNt7FrKClPBZSVSiyT2CGn4AuE', tab: 'target',     col: { name: 0, target: 1, month: 2, year: 3, role: 4 } },
    handover:   { id: '1ZLOcj648aYvVaEGHX_QHB1Qx3OMUT3K_eeW-SBUbCso', tab: 'handover',   col: { sellerId: 2, gcName: 4, gmName: 5, handover: 9 } },
    threeweek:  { id: '1i89A3_In2FGdfbc5HErMWquPFKfJLMcGekQBsYFfwZI', tab: '3weekgolive',col: { sellerId: 0 } },
    spend:      { id: '1wwfbMVkMKq80Znq1mkpO-NCLI-fc7d2hPIepCp04bQ0', tab: 'spendinputs',col: { date: 0, gcName: 1, live: 5, spend: 7 } },
    tasks:      { id: '12rfk37xtBfletLM1w-gfeiuPZof5ctxnDy_75V5yL-o', tab: 'Task',       col: { subtask: 3, date: 6, gcName: 8, status: 12 } },
    sos:        { id: '1SIww2UQnmcVs6lgLGYMxGLcxdCVf3MYkPZk7BfY3hIU', tab: 'sos',        col: { type: 0, sellerId: 1, date: 2, context: 3, gcName: 4, gmName: 5 } },
    strikes:    { id: '16JUSC2vOsG6SvN1-RhnFWZ5fdIrF1SyAYo_EiGbckkE', tab: 'Strikes_Log',col: { date: 1, kaeName: 2, kaeEmpId: 3, issue: 6 } },
  };
  const WINDOW_START_DAY = 20;
  const TASK_SUBS = ['internal_seller_escalation_general_request', 'pre-live-call', 'troubleshoot_manual_action'];
  const CALL_SUBS = ['schedule_call', 'seller_callback_overdue_sub_task', 'seller_callback_primary_task'];
  const DONE = ['closed', 'completed'];
  const WES_W = [{ m: 'social', w: 3 }, { m: 'sos', w: 1.5 }, { m: 'internal', w: 1 }];

  /* ---- Helpers ------------------------------------------------------- */
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function buildMonths() {
    const now = new Date(), eY = now.getFullYear(), eM = now.getMonth() + 1;
    let y = 2026, m = 1; const out = [];
    while (y < eY || (y === eY && m <= eM)) { out.push({ key: y + '-' + String(m).padStart(2, '0'), label: MN[m - 1] + ' ' + y, month: m, year: y }); m++; if (m > 12) { m = 1; y++; } }
    return out;
  }
  function toDate(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    const s = String(v).trim();
    let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) { let dd = +m[1], mm = +m[2], yy = +m[3]; if (yy < 100) yy += 2000; return new Date(yy, mm - 1, dd); }
    const d = new Date(s); return isNaN(d.getTime()) ? null : d;
  }
  function fmtDate(d) { return d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') : ''; }
  function monthNum(v) { if (typeof v === 'number') return v; const s = String(v).trim(); if (/^\d+$/.test(s)) return +s; const i = MN.findIndex((n) => s.toLowerCase().startsWith(n.toLowerCase())); return i >= 0 ? i + 1 : NaN; }
  function windowFor(month, year) { return { start: new Date(year, month - 1, WINDOW_START_DAY, 0, 0, 0), end: new Date(year, month, WINDOW_START_DAY, 23, 59, 59) }; }
  function inWindow(d, w) { return d && d.getTime() >= w.start.getTime() && d.getTime() <= w.end.getTime(); }

  const CORE_BANDS = [{ min: 120, max: Infinity, rate: 6.25, label: '> 120%' }, { min: 90, max: 120, rate: 4.5, label: '90–120%' }, { min: 50, max: 90, rate: 1.5, label: '50–90%' }, { min: 0, max: 50, rate: 0, label: '< 50%' }];
  function coreBandOf(p) { return CORE_BANDS.find((x) => p >= x.min && p < x.max) || CORE_BANDS[CORE_BANDS.length - 1]; }
  const HC_RATES = [7, 8, 9, 11, 15], HC_FLAT = 20;
  function hypercareCum(n) { let t = 0, i = 0, r = n; while (r > 0.0001) { const rate = i < HC_RATES.length ? HC_RATES[i] : HC_FLAT; const take = Math.min(1, r); t += rate * take; r -= take; i++; } return t; }
  const bandSpend = (v) => v > 80 ? 'green' : v >= 70 ? 'yellow' : 'red';
  const bandTask = (v) => v > 90 ? 'green' : v >= 70 ? 'yellow' : 'red';
  const bandCall = (v) => v > 95 ? 'green' : v >= 75 ? 'yellow' : 'red';
  const bandWes = (v) => v < 25 ? 'green' : v <= 45 ? 'yellow' : 'red';
  function multiplier(b) { const n = b.length, g = b.filter(x => x === 'green').length, y = b.filter(x => x === 'yellow').length, r = b.filter(x => x === 'red').length; if (!n) return { mult: 1, gcBand: null, rule: 'no inputs' }; if (r === n) return { mult: 0, gcBand: 'Red', rule: 'All ' + n + ' Red' }; if (r >= 2) return { mult: 0.70, gcBand: 'Red', rule: r + ' Reds' }; if (r === 1) return { mult: 0.85, gcBand: 'Red', rule: 'Exactly 1 Red' }; if (g === n) return { mult: 1.50, gcBand: 'Green', rule: 'All ' + n + ' Green' }; if (y === n) return { mult: 1.00, gcBand: 'Yellow', rule: 'All ' + n + ' Yellow' }; return { mult: 1.30, gcBand: 'Yellow', rule: 'Mix Green & Yellow, no Red' }; }
  const KAE_BASE = 6500;
  const KAE_BANDS = [{ max: 0, amount: 6500, ded: 0, label: '0 strikes' }, { max: 3, amount: 5200, ded: 20, label: '1–3 strikes' }, { max: 5, amount: 3250, ded: 50, label: '>3–5 strikes' }, { max: Infinity, amount: 0, ded: 100, label: '>5 strikes' }];
  const kaeBandOf = (n) => KAE_BANDS.find((b) => n <= b.max);
  const ADMINS = (I.ADMINS || []).map((e) => e.toLowerCase());

  function classify(p) {
    const d = (p.designation || '').toLowerCase(), t = p.teamRaw;
    if (d.includes('key account')) return 'kae';
    if (d.includes('ai ')) return 'ai';
    if (d.includes('campaign')) return 'campaign';
    if (d.includes('growth manager') || d.includes('category lead') || d.includes('business manager') || d.includes('assistant manager')) return 'gm';
    if (t === '1k-5k') return 'midmarket';
    if (t === 'Good Seller') return 'goodseller';
    if (t === 'Hyper Care') return 'hypercare';
    if (t === 'Revenue' || d.includes('escalation')) return 'revival';
    if (t === 'Hits') return 'core';
    return 'gm';
  }
  function logicFor(team) { return team === 'hypercare' ? 'hypercare' : team === 'kae' ? 'kae' : 'core'; }

  /* ---- Fuzzy name resolver (Nikita S → Nikita Sinha, etc.) ----------- */
  const norm = (s) => String(s == null ? '' : s).replace(/[\u00a0\u200b\u200c\u200d]/g, ' ').toLowerCase().replace(/[._]/g, ' ').replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
  const toks = (s) => norm(s).split(' ').filter(Boolean);
  function buildResolver(people) {
    const exact = {}, fl = {}, fi = {};
    people.forEach((p) => { const t = toks(p.name); if (!t.length) return; exact[t.join(' ')] = p; const f = t[0], l = t[t.length - 1]; fl[f + '|' + l] = p; fi[f + '|' + l[0]] = p; });
    const cache = {};
    return (name) => {
      const k = norm(name); if (!k) return null; if (cache[k] !== undefined) return cache[k];
      let res = null; const t = toks(name);
      if (exact[k]) res = exact[k];
      else if (t.length) { const f = t[0], l = t[t.length - 1]; if (fl[f + '|' + l]) res = fl[f + '|' + l]; else if (fi[f + '|' + l[0]]) res = fi[f + '|' + l[0]]; else { let best = null; people.forEach((p) => { const pt = toks(p.name); if (!pt.length || pt[0] !== f) return; const sub = t.slice(1).every((x) => pt.indexOf(x) >= 0) || pt.slice(1).every((x) => t.indexOf(x) >= 0); if (sub || pt[pt.length - 1][0] === l[0]) best = p; }); res = best; } }
      cache[k] = res; return res;
    };
  }

  /* ---- Compute everyone from raw rows -------------------------------- */
  function computeAll(RAW) {
    const MONTHS = buildMonths();
    const row = (k) => RAW[k] || [];
    // roster
    const people = row('people').filter((r) => r[SHEETS.people.col.email]).map((r) => {
      const c = SHEETS.people.col;
      return { empId: String(r[c.empId]).trim(), name: String(r[c.name]).trim(), email: String(r[c.email]).trim().toLowerCase(), managerEmail: String(r[c.managerEmail] || '').trim().toLowerCase(), teamRaw: String(r[c.team] || '').trim(), designation: String(r[c.designation] || '').trim(), byMonth: {}, reports: [] };
    });
    const byEmail = {}; people.forEach((p) => byEmail[p.email] = p);
    const byEmpId = {}; people.forEach((p) => { if (p.empId) byEmpId[p.empId] = p; });
    people.forEach((p) => { if (p.managerEmail && byEmail[p.managerEmail]) byEmail[p.managerEmail].reports.push(p); });
    const roleOf = (p) => ADMINS.includes(p.email) ? 'admin' : (p.reports.length ? 'manager' : 'gc');
    people.forEach((p) => { p.team = classify(p); p.logic = logicFor(p.team); p.role = roleOf(p); });
    const descendants = (p, acc, seen) => { acc = acc || []; seen = seen || {}; p.reports.forEach((r) => { if (seen[r.email]) return; seen[r.email] = true; acc.push(r); descendants(r, acc, seen); }); return acc; };
    const resolve = buildResolver(people);

    // 3-week + hits master + targets
    const threeWeek = {}; row('threeweek').forEach((r) => { const id = String(r[SHEETS.threeweek.col.sellerId]).trim(); if (id) threeWeek[id] = true; });
    const hm = {}; row('hitsmaster').forEach((r) => { const c = SHEETS.hitsmaster.col; const id = String(r[c.sellerId]).trim(); if (id) hm[id] = { name: String(r[c.sellerName] || '').trim(), month: monthNum(r[c.month]), year: Number(r[c.year]) }; });
    const targets = {}; row('target').forEach((r) => { const c = SHEETS.target.col; const who = resolve(r[c.name]); if (!who) return; targets[who.email + '|' + monthNum(r[c.month]) + '|' + Number(r[c.year])] = { target: Number(r[c.target]) || 0 }; });

    // spend/live
    const spendByPM = {}; row('spend').forEach((r) => { const c = SHEETS.spend.col; const who = resolve(r[c.gcName]); if (!who) return; const d = toDate(r[c.date]); if (!d) return; const live = Number(r[c.live]) || 0, sp = Number(r[c.spend]) || 0; MONTHS.forEach((m) => { if (!inWindow(d, windowFor(m.month, m.year))) return; const key = who.email + '|' + m.key; const rec = spendByPM[key] || (spendByPM[key] = { sumLive: 0, sumSpend: 0, days: [] }); rec.sumLive += live; rec.sumSpend += sp; rec.days.push({ date: fmtDate(d), live: live, spend: sp, ratio: live > 0 ? +(sp / live * 100).toFixed(1) : null }); }); });

    // task + callback
    const taskByPM = {}, callByPM = {}; const bucket = (s, k) => s[k] || (s[k] = { done: 0, total: 0, rows: [] });
    row('tasks').forEach((r) => { const c = SHEETS.tasks.col; const who = resolve(r[c.gcName]); if (!who) return; const d = toDate(r[c.date]); if (!d) return; const sub = String(r[c.subtask] || '').trim().toLowerCase(); const st = String(r[c.status] || '').trim().toLowerCase(); const done = DONE.indexOf(st) >= 0; const isT = TASK_SUBS.indexOf(sub) >= 0, isC = CALL_SUBS.indexOf(sub) >= 0; if (!isT && !isC) return; MONTHS.forEach((m) => { if (!inWindow(d, windowFor(m.month, m.year))) return; const store = (isT ? bucket(taskByPM, who.email + '|' + m.key) : bucket(callByPM, who.email + '|' + m.key)); store.total++; if (done) store.done++; store.rows.push({ date: fmtDate(d), subtask: sub, status: st, done: done }); }); });

    // SOS → WES (dedupe same seller/day/type)
    const wesByPM = {}, seen = {};
    const wesW = (t) => { t = String(t || '').toLowerCase(); for (const w of WES_W) if (t.indexOf(w.m) >= 0) return w; return null; };
    row('sos').forEach((r) => { const c = SHEETS.sos.col; const who = resolve(r[c.gcName]); if (!who) return; const d = toDate(r[c.date]); if (!d) return; const ww = wesW(r[c.type]); if (!ww) return; const sid = String(r[c.sellerId] || '').trim(); MONTHS.forEach((m) => { if (!inWindow(d, windowFor(m.month, m.year))) return; const dk = who.email + '|' + m.key + '|' + ww.m + '|' + sid + '|' + fmtDate(d); if (seen[dk]) return; seen[dk] = true; const key = who.email + '|' + m.key; const rec = wesByPM[key] || (wesByPM[key] = { social: 0, sos: 0, internal: 0, rows: [] }); if (ww.m === 'social') rec.social++; else if (ww.m === 'sos') rec.sos++; else rec.internal++; rec.rows.push({ date: fmtDate(d), type: String(r[c.type]).trim(), sellerId: sid, weight: ww.w }); }); });

    // KAE strikes (by Emp ID)
    const strikesByPM = {}; row('strikes').forEach((r) => { const c = SHEETS.strikes.col; const d = toDate(r[c.date]); if (!d) return; const who = byEmpId[String(r[c.kaeEmpId] || '').trim()] || resolve(r[c.kaeName]); if (!who) return; MONTHS.forEach((m) => { if (!inWindow(d, windowFor(m.month, m.year))) return; (strikesByPM[who.empId + '|' + m.key] || (strikesByPM[who.empId + '|' + m.key] = [])).push({ date: fmtDate(d), issue: String(r[c.issue] || '').trim() }); }); });

    // blank month records + handover attribution
    people.forEach((p) => MONTHS.forEach((m) => p.byMonth[m.key] = { key: m.key, label: m.label, month: m.month, year: m.year, counted: [], disposed: [] }));
    row('handover').forEach((r) => { const c = SHEETS.handover.col; const sid = String(r[c.sellerId]).trim(); const gc = resolve(r[c.gcName]); const master = hm[sid]; if (!master || !gc) return; const mObj = MONTHS.find((m) => m.month === master.month && m.year === master.year); if (!mObj) return; const is3w = !!threeWeek[sid]; const ho = String(r[c.handover]).toUpperCase() === 'TRUE' || r[c.handover] === true; const rr = { sellerId: sid, sellerName: master.name, hitMonthName: mObj.label.split(' ')[0], hitYear: master.year, threeWeek: is3w, handover: ho }; if (ho) gc.byMonth[mObj.key].counted.push(rr); else gc.byMonth[mObj.key].disposed.push(rr); });

    // finalise each month per person
    people.forEach((p) => MONTHS.forEach((m) => {
      const rec = p.byMonth[m.key];
      if (p.logic === 'kae') {
        const ks = (strikesByPM[p.empId + '|' + m.key] || []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
        const n = ks.length, kb = kaeBandOf(n);
        Object.assign(rec, { threeWeekCounted: [], weightedHits: 0, rawHits: 0, target: 0, achievementPct: null, rawVals: null, bands: null, bandArr: null, multiplier: null, gcBand: null, multRule: null, coreBand: null, perHitRate: null, outputPct: null, finalPct: null, spend: null, task: null, callback: null, escalations: null, strikes: ks, strikeCount: n, kaeBase: KAE_BASE, kaeBand: kb, dedPct: kb.ded, amount: kb.amount, adhocPct: 0, adhocAbs: 0, adhocNote: '', dataHealth: 'ok', missingFields: [] });
        return;
      }
      const c3 = rec.counted.filter((s) => s.threeWeek);
      const weighted = p.logic === 'hypercare' ? rec.counted.length : rec.counted.reduce((s, x) => s + (x.threeWeek ? 1.5 : 1), 0);
      const raw = rec.counted.length;
      const tgt = targets[p.email + '|' + m.month + '|' + m.year] ? targets[p.email + '|' + m.month + '|' + m.year].target : 0;
      const ach = tgt > 0 ? (weighted / tgt) * 100 : null;
      const pm = p.email + '|' + m.key, sp = spendByPM[pm], tk = taskByPM[pm], cb = callByPM[pm], wes = wesByPM[pm];
      const spendPct = sp && sp.sumLive > 0 ? +(sp.sumSpend / sp.sumLive * 100).toFixed(1) : null;
      const taskPct = tk && tk.total > 0 ? +(tk.done / tk.total * 100).toFixed(1) : null;
      const callPct = cb && cb.total > 0 ? +(cb.done / cb.total * 100).toFixed(1) : null;
      let bands = {}, bandArr = [], rawVals = {}, mx = { mult: 1, gcBand: null, rule: 'inputs pending' }, wesScore = null;
      if (p.logic === 'core') {
        if (spendPct != null) { rawVals.A = spendPct; bands.A = bandSpend(spendPct); bandArr.push(bands.A); }
        if (taskPct != null) { rawVals.B = taskPct; bands.B = bandTask(taskPct); bandArr.push(bands.B); }
        if (callPct != null) { rawVals.C = callPct; bands.C = bandCall(callPct); bandArr.push(bands.C); }
        if (wes) { wesScore = wes.social * 3 + wes.sos * 1.5 + wes.internal; rawVals.D = wesScore; bands.D = bandWes(wesScore); bandArr.push(bands.D); }
        if (bandArr.length) mx = multiplier(bandArr);
      }
      let output = 0, coreBnd = null;
      if (ach != null) { if (p.logic === 'hypercare') output = hypercareCum(weighted); else { coreBnd = coreBandOf(ach); output = coreBnd.rate * weighted; } }
      const finalPct = ach == null ? null : (p.logic === 'hypercare' ? output : output * mx.mult);
      Object.assign(rec, {
        threeWeekCounted: c3, weightedHits: weighted, rawHits: raw, target: tgt, achievementPct: ach,
        rawVals: (p.logic === 'core' && bandArr.length) ? rawVals : null, bands: (p.logic === 'core' && bandArr.length) ? bands : null, bandArr: (p.logic === 'core' && bandArr.length) ? bandArr : null,
        multiplier: p.logic === 'hypercare' ? null : mx.mult, gcBand: mx.gcBand, multRule: mx.rule,
        coreBand: coreBnd ? { rate: coreBnd.rate, label: coreBnd.label } : null, perHitRate: coreBnd ? coreBnd.rate : null, outputPct: output, finalPct: finalPct,
        spend: sp ? { netPct: spendPct, sumLive: sp.sumLive, sumSpend: sp.sumSpend, days: sp.days, band: bands.A || null } : null,
        task: tk ? { pct: taskPct, done: tk.done, total: tk.total, rows: tk.rows, band: bands.B || null } : null,
        callback: cb ? { pct: callPct, done: cb.done, total: cb.total, rows: cb.rows, band: bands.C || null } : null,
        escalations: wes ? { wes: wesScore, social: wes.social, sos: wes.sos, internal: wes.internal, rows: wes.rows, band: bands.D || null } : null,
        adhocPct: 0, adhocAbs: 0, adhocNote: '',
        dataHealth: tgt === 0 ? 'missing' : (p.logic === 'core' && !bandArr.length ? 'attention' : 'ok'),
        missingFields: tgt === 0 ? ['Hits target not set in target sheet for ' + m.label] : (p.logic === 'core' && !bandArr.length ? ['Input metrics not found for ' + m.label] : []),
      });
    }));

    // GM rollup
    people.filter((p) => p.role !== 'gc').forEach((gm) => { const team = descendants(gm).filter((d) => d.role === 'gc'); MONTHS.forEach((m) => { const recs = team.map((d) => d.byMonth[m.key]); const weighted = recs.reduce((s, r) => s + r.weightedHits, 0); const raw = recs.reduce((s, r) => s + r.rawHits, 0); const tgt = targets[gm.email + '|' + m.month + '|' + m.year] ? targets[gm.email + '|' + m.month + '|' + m.year].target : Math.round(recs.reduce((s, r) => s + r.target, 0) * 0.9); gm.byMonth[m.key].gm = { weightedHits: weighted, rawHits: raw, target: tgt, achievementPct: tgt > 0 ? (weighted / tgt) * 100 : null, teamSize: team.length }; }); });

    // PIP (last 2 months)
    people.forEach((p) => {
      const months = MONTHS.slice(-2);
      if (p.team === 'kae') { p.pip = { isGM: false, threshold: null, sumAch: 0, sumTgt: 0, ratio: null, flagged: false, months: months.map((m) => m.label), na: true }; return; }
      const isGM = p.role !== 'gc', threshold = isGM ? 70 : 50; let a = 0, t = 0;
      months.forEach((m) => { const rec = p.byMonth[m.key]; if (isGM && rec.gm) { a += rec.gm.rawHits; t += rec.gm.target; } else { a += rec.rawHits; t += rec.target; } });
      const ratio = t > 0 ? (a / t) * 100 : null;
      p.pip = { isGM, threshold, sumAch: a, sumTgt: t, ratio, flagged: ratio != null && ratio < threshold, months: months.map((m) => m.label) };
    });

    return { people, MONTHS };
  }

  /* ---- Apply computed data into the live app ------------------------- */
  function applyLive(people, MONTHS) {
    const byEmail = {}; people.forEach((p) => byEmail[p.email] = p);
    people.forEach((p) => p.reports = []);
    people.forEach((p) => { if (p.managerEmail && byEmail[p.managerEmail]) byEmail[p.managerEmail].reports.push(p); });
    I.people.length = 0; people.forEach((p) => I.people.push(p));
    Object.keys(I.byEmail).forEach((k) => delete I.byEmail[k]); Object.assign(I.byEmail, byEmail);
    I.MONTHS.length = 0; MONTHS.forEach((m) => I.MONTHS.push(m));
    if (I.MONTHS.length) I.setPeriod(I.MONTHS[I.MONTHS.length - 1].key);
    I.DATA_LIVE = true; I.connStatus = 'live'; I.lastSynced = new Date();
  }

  /* ---- Google OAuth token + Sheets API fetch ------------------------- */
  let tokenClient = null, accessToken = null;
  function ensureClient() {
    if (tokenClient) return tokenClient;
    if (!window.google || !google.accounts || !google.accounts.oauth2) throw new Error('Google Identity script not loaded yet');
    tokenClient = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPES, callback: () => {} });
    return tokenClient;
  }
  function getToken() {
    return new Promise((resolve, reject) => {
      let tc;
      try { tc = ensureClient(); } catch (e) { return reject(e); }
      tc.callback = (resp) => { if (resp && resp.access_token) { accessToken = resp.access_token; resolve(resp.access_token); } else reject(new Error(resp && resp.error ? resp.error : 'no_token')); };
      tc.error_callback = (err) => reject(new Error((err && err.type) || 'oauth_error'));
      tc.requestAccessToken({ prompt: '' });
    });
  }
  async function userInfo(token) {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) throw new Error('userinfo ' + r.status); return r.json();
  }
  async function fetchSheet(token, cfg) {
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + cfg.id + '/values/' + encodeURIComponent(cfg.tab) + '?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING';
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (!r.ok) { const txt = await r.text().catch(() => ''); throw new Error(cfg.tab + ': ' + r.status + ' ' + txt.slice(0, 120)); }
    const j = await r.json(); const vals = j.values || []; return vals.length ? vals.slice(1) : []; // drop header row
  }

  /* Public: sign in, fetch every sheet, compute, apply. onStatus(msg). */
  I.signInAndLoad = async function (onStatus) {
    const say = (m) => { try { onStatus && onStatus(m); } catch (e) {} };
    if (!CLIENT_ID) throw new Error('Missing GOOGLE_CLIENT_ID');
    say('Opening Google sign-in…');
    const token = await getToken();
    say('Verifying account…');
    const info = await userInfo(token);
    say('Reading sheets…');
    const keys = Object.keys(SHEETS); const RAW = {};
    for (let i = 0; i < keys.length; i++) { say('Reading ' + SHEETS[keys[i]].tab + ' (' + (i + 1) + '/' + keys.length + ')…'); RAW[keys[i]] = await fetchSheet(token, SHEETS[keys[i]]); }
    say('Calculating incentives…');
    const { people, MONTHS } = computeAll(RAW);
    if (!people.length) throw new Error('People sheet returned no rows');
    applyLive(people, MONTHS);
    return { email: (info.email || '').toLowerCase(), name: info.name || info.email, picture: info.picture };
  };

  I.SHEETS_META = SHEETS;
})();
