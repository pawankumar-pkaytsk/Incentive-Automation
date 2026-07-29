/* =====================================================================
   Incentive Automation — calculation ENGINE
   Implements the real HITS logic on sheet-shaped raw data.

   Sheets mirrored (sample/seeded until live data is connected):
   • hitsmaster  — seller HITs by month/year      (Seller ID, Name, Month, Year)
   • 3weekgolive — set of 3-week HIT seller IDs    (→ counts as 1.5 HIT)
   • handover    — col J TRUE/FALSE, GC (E), GM (F)(→ only TRUE is counted)
   • target      — Name, Hits target, Month, Year, Role
   • inputs      — Spend/Live, Task, Callback, Escalations (for multiplier)

   LOGIC (from Logics.docx / Hypercare GC.docx):
   Final % = Output % × Input Multiplier
   Core GC output:  per-HIT rate by achievement band × HITs
       ≥120% → 6.25%/HIT · 90–<120% → 4.5% · 50–<90% → 1.5% · <50% → 0
   Hypercare output: cumulative progressive 7/8/9/11/15% then 20% flat (6th+)
   Input multiplier from A/B/C/D bands (G/Y/R):
       4G→1.5 · noRed+mix→1.3 · allY→1.0 · 1R→0.85 · 2-3R→0.7 · 4R→0
   PIP: Σ(raw achievement, last 2 months) ÷ Σ(target) < 50% (GC) / 70% (GM)
        — 3-week counts as 1 (NOT 1.5) for the PIP achievement sum.
   ===================================================================== */
(function () {
  const I = window.INCENTIVE;
  const { people, byEmail, MONTHS, rngFor, between, descendants } = I;

  /* ---- Logic constants ------------------------------------------------ */
  const CORE_BANDS = [
    { min: 120, max: Infinity, rate: 6.25, label: '≥ 120%' },
    { min: 90,  max: 120,      rate: 4.5,  label: '90% – <120%' },
    { min: 50,  max: 90,       rate: 1.5,  label: '50% – <90%' },
    { min: 0,   max: 50,       rate: 0,    label: '< 50%' },
  ];
  function coreBand(achPct) { return CORE_BANDS.find((b) => achPct >= b.min && achPct < b.max) || CORE_BANDS[CORE_BANDS.length - 1]; }

  const HYPERCARE_RATES = [7, 8, 9, 11, 15]; // 1st..5th, then 20 flat
  const HYPERCARE_FLAT = 20;
  function hypercareCumulative(hits) {
    let total = 0, remaining = hits, i = 0;
    while (remaining > 0.0001) {
      const rate = i < HYPERCARE_RATES.length ? HYPERCARE_RATES[i] : HYPERCARE_FLAT;
      const take = Math.min(1, remaining);
      total += rate * take; remaining -= take; i++;
    }
    return total;
  }
  // Per-HIT schedule for display
  const HYPERCARE_SCHEDULE = [
    { hit: '1st', rate: 7, cum: 7 }, { hit: '2nd', rate: 8, cum: 15 },
    { hit: '3rd', rate: 9, cum: 24 }, { hit: '4th', rate: 11, cum: 35 },
    { hit: '5th', rate: 15, cum: 50 }, { hit: '6th +', rate: 20, cum: null },
  ];

  /* ---- Input metric band definitions --------------------------------- */
  const INPUTS = [
    { key: 'A', label: 'Spend / Live',        unit: '%',  green: (v) => v > 80, yellow: (v) => v >= 70 && v <= 80, hint: '> 80% Green · 70–80% Yellow · < 70% Red' },
    { key: 'B', label: 'Task Adherence',      unit: '%',  green: (v) => v > 90, yellow: (v) => v >= 70 && v <= 90, hint: '> 90% Green · 70–90% Yellow · < 70% Red' },
    { key: 'C', label: 'Callback Adherence within SLA',  unit: '%',  green: (v) => v > 90, yellow: (v) => v >= 75 && v <= 90, hint: '> 90% Green · 75–90% Yellow · < 75% Red' },
    { key: 'D', label: 'WES (Escalations)',   unit: '',   green: (v) => v < 25, yellow: (v) => v >= 25 && v <= 45, hint: '< 25 Green · 25–45 Yellow · > 45 Red', lowerBetter: true },
  ];
  function bandOf(input, v) { return input.green(v) ? 'green' : input.yellow(v) ? 'yellow' : 'red'; }
  // WES = (Social Media × 3) + (SOS × 1.5) + (Internal/Sales × 1)
  function wesScore(social, sos, internal) { return social * 3 + sos * 1.5 + internal * 1; }

  /* ---- KAE strike-based incentive (₹, per doc §13) ------------------- */
  const KAE_BASE = 6000;
  const KAE_BANDS = [
    { max: 0,        amount: 6000, ded: 0,   label: '0 strikes' },
    { max: 3,        amount: 4800, ded: 20,  label: '1–3 strikes' },
    { max: 5,        amount: 3000, ded: 50,  label: '>3–5 strikes' },
    { max: Infinity, amount: 0,    ded: 100, label: '>5 strikes' },
  ];
  function kaeBand(n) { return KAE_BANDS.find((b) => n <= b.max); }
  const STRIKE_ISSUES = ['Late seller response (>24h SLA breach)', 'Missed daily check-in call', 'Catalogue QC rejection', 'Unresolved NDR beyond 48h', 'COD confirmation delay', 'Incorrect GST invoice raised', 'Escalation not actioned', 'Pricing approval missed'];

  /* ---- Revival GC count-based incentive (₹) -------------------------- */
  // Whole revival count × band rate (non-tiered). ≤20 = below threshold = ₹0.
  // 31–40 → 250 (max ₹10,000); >40 → 375 (uncapped). Cycle window is 20th→19th.
  const REVIVAL_BANDS = [
    { min: 0,  max: 20,       rate: 0,   maxAmount: 0,     label: '≤ 20 (below threshold)' },
    { min: 21, max: 30,       rate: 200, maxAmount: 6000,  label: '21–30' },
    { min: 31, max: 40,       rate: 250, maxAmount: 10000, label: '31–40' },
    { min: 41, max: Infinity, rate: 375, maxAmount: null,  label: '40+' },
  ];
  function revivalBand(c) { return REVIVAL_BANDS.find((b) => c >= b.min && c <= b.max) || REVIVAL_BANDS[0]; }

  function multiplierFromBands(bands) {
    const g = bands.filter((b) => b === 'green').length;
    const y = bands.filter((b) => b === 'yellow').length;
    const r = bands.filter((b) => b === 'red').length;
    if (r === 4) return { mult: 0.0, gcBand: 'Red', rule: 'All 4 inputs Red — incentive = 0' };
    if (r >= 2)  return { mult: 0.70, gcBand: 'Red', rule: '2–3 Reds' };
    if (r === 1) return { mult: 0.85, gcBand: 'Red', rule: 'Exactly 1 Red' };
    if (g === 4) return { mult: 1.50, gcBand: 'Green', rule: 'All 4 inputs Green' };
    if (y === 4) return { mult: 1.00, gcBand: 'Yellow', rule: 'All 4 inputs Yellow' };
    return { mult: 1.30, gcBand: 'Yellow', rule: 'Mix of Green & Yellow, no Red' };
  }

  /* ---- Which incentive logic a person uses --------------------------- */
  function logicFor(p) {
    if (p.team === 'hypercare') return 'hypercare';
    if (p.team === 'kae') return 'kae';
    if (p.team === 'revival') return 'revival';
    if (p.team === 'campaign') return 'campaign';
    if (p.team === 'midmarket') return 'midmarket';
    return 'core';
  }

  /* ---- Seller name pool (for demo HIT rows) -------------------------- */
  const BRANDS = ['Urban Threads', 'Kayra Fashions', 'Nykaa Looks', 'Veda Organics', 'Trendza', 'Sole Mate', 'Glow Co', 'Denim Bay', 'Lumen Décor', 'Spice Route', 'Petals & Co', 'FitFlex', 'Aroma Wick', 'Maple Kids', 'Zen Living', 'Rangoli Crafts', 'Pure Bloom', 'Crave Snacks', 'Aura Beauty', 'Nestwell'];

  /* ---- Generate one month of raw HIT rows for a GC ------------------- */
  function genMonthRaw(p, mi) {
    const m = MONTHS[mi];
    const rng = rngFor(p.empId + '|' + m.key);
    // target hits 3–6 (sample). Some months a target may be missing.
    const target = 3 + Math.floor(rng() * 4); // 3..6
    // achievement factor drives delivered count
    const factor = between(rng(), 0.25, 1.7);
    const deliveredCount = Math.max(0, Math.round(target * factor));
    const sellers = [];
    for (let s = 0; s < deliveredCount; s++) {
      const r2 = rngFor(p.empId + '|' + m.key + '|' + s);
      const threeWeek = r2() < 0.22;            // present in 3weekgolive sheet
      const handover = r2() < 0.86;             // handover col J TRUE
      sellers.push({
        sellerId: 'SD' + (10000 + Math.floor(r2() * 89999)),
        sellerName: BRANDS[Math.floor(r2() * BRANDS.length)],
        hitMonthName: m.label.split(' ')[0],    // hitsmaster col C
        hitYear: m.year,                        // hitsmaster col D
        threeWeek, handover,
      });
    }
    return { ...m, target, sellers };
  }

  /* ---- Compute a GC month record from raw rows ----------------------- */
  function computeGcMonth(p, raw, logic) {
    const counted = raw.sellers.filter((s) => s.handover); // only handover TRUE
    const disposed = raw.sellers.filter((s) => !s.handover);
    const threeWeekCounted = counted.filter((s) => s.threeWeek);
    // Hypercare: 3-week go-live is NOT counted as 1.5 — every counted HIT = 1.
    const weightedHits = logic === 'hypercare'
      ? counted.length
      : counted.reduce((sum, s) => sum + (s.threeWeek ? 1.5 : 1), 0);
    const rawHits = counted.length; // for PIP (3-week counts as 1)
    const target = raw.target;
    const achievementPct = target > 0 ? (weightedHits / target) * 100 : null;

    // Inputs A–D + multiplier apply to CORE GC only (Hypercare has no input bands).
    let rawVals = null, bands = null, bandArr = null, mx = { mult: 1, gcBand: null, rule: null };
    let spend = null, task = null, callback = null, escalations = null;
    if (logic === 'kae') return computeKaeMonth(p, raw);
    if (logic === 'revival') return computeRevivalMonth(p, raw);
    if (logic === 'campaign') return computeCampaignMonth(p, raw);
    if (logic === 'midmarket') return computeMidmarketMonth(p, raw);
    if (logic === 'core') {
      const rng = rngFor(p.empId + '|inp|' + raw.key);
      // WES sample: social-media, SOS, internal escalation counts (deduped per seller/day upstream)
      const social = Math.floor(between(rng(), 0, 6));
      const sos = Math.floor(between(rng(), 2, 16));
      const internal = Math.floor(between(rng(), 0, 10));
      const wes = wesScore(social, sos, internal);
      rawVals = {
        A: Math.round(between(rng(), 55, 98)),
        B: Math.round(between(rng(), 60, 99)),
        C: Math.round(between(rng(), 68, 99)),
        D: wes,
      };
      bands = {}; INPUTS.filter((inp) => rawVals[inp.key] != null).forEach((inp) => { bands[inp.key] = bandOf(inp, rawVals[inp.key]); });
      bandArr = INPUTS.map((inp) => bands[inp.key]);
      mx = multiplierFromBands(bandArr);
      // escalation drill rows (one per escalation; sample)
      const escRows = [];
      const mk = (type, n, weight) => { for (let i = 0; i < n; i++) escRows.push({ date: new Date(raw.year, raw.month - 1, 20 + (i % 22)).toISOString().slice(0, 10), type, sellerId: 'SD' + (10000 + Math.floor(rng() * 89999)), weight }); };
      mk('Social Media Escalations', social, 3); mk('SOS', sos, 1.5); mk('Internal Escalations', internal, 1);
      escalations = { wes, social, sos, internal, rows: escRows, band: bands.D };
      // ---- sample day-wise spend/live + task/callback rows (for drill-downs) ----
      const days = [], names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      let sumSpend = 0, sumLive = 0;
      for (let d = 0; d < 22; d++) {
        const live = Math.round(between(rng(), 8, 26));
        const spd = Math.max(0, Math.round(live * rawVals.A / 100 + between(rng(), -2, 2)));
        sumSpend += spd; sumLive += live;
        const dt = new Date(raw.year, raw.month - 1, 20 + d);
        days.push({ date: dt.toISOString().slice(0, 10), live, spend: spd, ratio: live > 0 ? +(spd / live * 100).toFixed(1) : null });
      }
      spend = { netPct: sumLive > 0 ? +(sumSpend / sumLive * 100).toFixed(1) : null, sumLive, sumSpend, days, band: bands.A };
      const mkTasks = (subs, pct) => {
        const total = Math.round(between(rng(), 14, 40)), done = Math.round(total * pct / 100);
        const rows = [];
        for (let i = 0; i < total; i++) rows.push({ id: 'SAMPLE-' + raw.key + '-' + (i + 1), date: new Date(raw.year, raw.month - 1, 20 + (i % 22)).toISOString().slice(0, 10), subtask: subs[i % subs.length], status: i < done ? (i % 2 ? 'completed' : 'closed') : 'open', done: i < done });
        return { pct, done, total, rows };
      };
      task = { ...mkTasks(['internal_seller_escalation_general_request', 'pre-live-call', 'troubleshoot_manual_action'], rawVals.B), band: bands.B };
      callback = { ...mkTasks(['schedule_call'], rawVals.C), band: bands.C };
    }

    // Output %
    let outputPct = 0, coreBnd = null;
    if (achievementPct != null) {
      if (logic === 'hypercare') {
        outputPct = hypercareCumulative(weightedHits);
      } else {
        coreBnd = coreBand(achievementPct);
        outputPct = coreBnd.rate * weightedHits;
      }
    }
    // Hypercare: final = output (no input multiplier). Core: output × multiplier.
    const multiplier = logic === 'hypercare' ? null : mx.mult;
    const finalPct = achievementPct != null ? (logic === 'hypercare' ? outputPct : outputPct * mx.mult) : null;

    return {
      ...raw, logic,
      counted, disposed, threeWeekCounted,
      weightedHits, rawHits, achievementPct,
      rawVals, bands, bandArr, multiplier, gcBand: mx.gcBand, multRule: mx.rule,
      coreBand: coreBnd, perHitRate: coreBnd ? coreBnd.rate : null,
      outputPct, finalPct,
      spend, task, callback, escalations,
      // ad-hoc (live-editable): adhocPct = relative %, adhocAbs = flat percentage-points
      adhocPct: 0, adhocAbs: 0, adhocNote: '',
      dataHealth: 'ok', missingFields: [],
    };
  }

  /* ---- KAE month: ₹6,500 base, strike-based deduction (doc §13) ------ */
  function computeKaeMonth(p, raw) {
    const rng = rngFor(p.empId + '|kae|' + raw.key);
    const n = Math.floor(between(rng(), 0, 7)); // 0..6 strikes (sample)
    const strikes = [];
    for (let i = 0; i < n; i++) {
      strikes.push({
        date: new Date(raw.year, raw.month - 1, 20 + Math.floor(rng() * 28)).toISOString().slice(0, 10),
        issue: STRIKE_ISSUES[Math.floor(rng() * STRIKE_ISSUES.length)],
      });
    }
    strikes.sort((a, b) => a.date < b.date ? -1 : 1);
    const band = kaeBand(n);
    return {
      ...raw, logic: 'kae',
      counted: [], disposed: [], threeWeekCounted: [], weightedHits: 0, rawHits: 0, achievementPct: null,
      rawVals: null, bands: null, bandArr: null, multiplier: null, gcBand: null, multRule: null,
      coreBand: null, perHitRate: null, outputPct: null, finalPct: null,
      spend: null, task: null, callback: null, escalations: null,
      // KAE-specific
      strikes, strikeCount: n, kaeBase: KAE_BASE, kaeBand: band, dedPct: band.ded, amount: band.amount,
      adhocPct: 0, adhocAbs: 0, adhocNote: '',
      dataHealth: 'ok', missingFields: [],
    };
  }

  function computeRevivalMonth(p, raw) {
    const rng = rngFor(p.empId + '|rev|' + raw.key);
    const count = Math.floor(between(rng(), 8, 46)); // sample revival count
    const rows = [];
    for (let i = 0; i < count; i++) {
      rows.push({
        date: new Date(raw.year, raw.month - 1, 20 + Math.floor(rng() * 29)).toISOString().slice(0, 10),
        seller: 'Sample Seller ' + (i + 1), sid: 'S' + (1000 + i), amt: '10000',
      });
    }
    rows.sort((a, b) => a.date < b.date ? -1 : 1);
    const band = revivalBand(count);
    const amount = count * band.rate;
    return {
      ...raw, logic: 'revival',
      counted: [], disposed: [], threeWeekCounted: [], weightedHits: 0, rawHits: 0, achievementPct: null,
      rawVals: null, bands: null, bandArr: null, multiplier: null, gcBand: null, multRule: null,
      coreBand: null, perHitRate: null, outputPct: null, finalPct: null,
      spend: null, task: null, callback: null, escalations: null,
      // Revival-specific
      revivalCount: count, revivalRows: rows, revivalBand: band, revivalRate: band.rate, amount: amount,
      adhocPct: 0, adhocAbs: 0, adhocNote: '',
      dataHealth: 'ok', missingFields: [],
    };
  }

  function computeCampaignMonth(p, raw) {
    const rng = rngFor(p.empId + '|camp|' + raw.key);
    const sg = +between(rng(), 38, 55).toFixed(2);   // sample Spend/GMV %
    const inc = 42 / sg * 25;                          // linear inverse: 25% × (42 ÷ Spend/GMV)
    return {
      ...raw, logic: 'campaign',
      counted: [], disposed: [], threeWeekCounted: [], weightedHits: 0, rawHits: 0, achievementPct: null,
      rawVals: null, bands: null, bandArr: null, multiplier: null, gcBand: null, multRule: null,
      coreBand: null, perHitRate: null, outputPct: null, finalPct: inc,
      spend: null, task: null, callback: null, escalations: null,
      // Campaign-specific
      campaignSpendGmv: sg, campaignBaseline: 42,
      adhocPct: 0, adhocAbs: 0, adhocNote: '',
      dataHealth: 'ok', missingFields: [],
    };
  }

  // HITS 1k-5k — HITs achievement unlocks the pool: ≥100% → 25%, 50–99% → 15%, <50% → 0%.
  // (ARR/churn/spend-live/go-live/NPS multipliers pending their data sources.)
  const MM_BANDS = [
    { min: 100, pct: 25, label: '≥ 100% of target' },
    { min: 50,  pct: 15, label: '50–99% of target' },
    { min: 0,   pct: 0,  label: '< 50% of target' },
  ];
  function mmBand(ach) { return MM_BANDS.find((b) => ach >= b.min) || MM_BANDS[MM_BANDS.length - 1]; }
  function computeMidmarketMonth(p, raw) {
    const rng = rngFor(p.empId + '|mm|' + raw.key);
    const target = Math.max(1, Math.round(between(rng(), 1, 3)));
    const hits = Math.round(between(rng(), 0, 4));
    const rows = [];
    for (let i = 0; i < hits; i++) rows.push({ date: new Date(raw.year, raw.month - 1, 20 + Math.floor(rng() * 29)).toISOString().slice(0, 10), seller: 'Sample Seller ' + (i + 1), sid: 'S' + (2000 + i), gl: p.name });
    rows.sort((a, b) => a.date < b.date ? -1 : 1);
    const ach = (hits / target) * 100;
    const band = mmBand(ach);
    return {
      ...raw, logic: 'midmarket',
      counted: [], disposed: [], threeWeekCounted: [], weightedHits: hits, rawHits: hits, achievementPct: ach,
      rawVals: null, bands: null, bandArr: null, multiplier: null, gcBand: null, multRule: null,
      coreBand: null, perHitRate: null, outputPct: band.pct, finalPct: band.pct,
      spend: null, task: null, callback: null, escalations: null,
      // 1k-5k specific
      mmHits: hits, mmRows: rows, mmBand: band, mmTarget: target, mmPending: true,
      target: target,
      adhocPct: 0, adhocAbs: 0, adhocNote: '',
      dataHealth: 'attention', missingFields: ['ARR / churn / Spend-Live / go-live / NPS multipliers pending — showing unlocked pool only'],
    };
  }

  /* ---- Build all GC records first ------------------------------------ */
  people.forEach((p) => {
    const logic = logicFor(p);
    p.logic = logic;
    p.byMonth = {};
    MONTHS.forEach((m, mi) => {
      const raw = genMonthRaw(p, mi);
      p.byMonth[m.key] = computeGcMonth(p, raw, logic);
    });
  });

  /* ---- Inject data-health issues (admin alerts) ---------------------- */
  people.forEach((p) => {
    const cur = p.byMonth[MONTHS[MONTHS.length - 1].key];
    const rng = rngFor('health|' + p.empId);
    const roll = rng();
    if (roll < 0.08) {
      cur.dataHealth = 'missing';
      if (rng() < 0.5) { cur.missingFields.push('Hits target not set in target sheet for ' + cur.label); cur.target = 0; cur.achievementPct = null; cur.outputPct = 0; cur.finalPct = null; }
      else { cur.missingFields.push('Handover sheet pending — seller HITs not yet confirmed'); }
    } else if (roll > 0.92 && p.logic === 'core') {
      cur.dataHealth = 'attention';
      cur.missingFields.push('Input metrics (Spend/Task/Callback) awaiting sync — multiplier provisional');
    } else if (cur.achievementPct != null && cur.achievementPct < 50) {
      cur.dataHealth = 'attention';
    }
  });

  /* ---- GM incentive (doc §3): achievement from handover col F (here:
     sum of reporting GCs), Output = (HITs ÷ Target) × 25%, then GC-Ops
     multiplier across reporting GCs: any Red→0.70, Yellow→1.20, Green→1.50. */
  const gmOpsMult = (gcs, mKey) => {
    const bands = gcs.map((d) => d.byMonth[mKey].gcBand).filter(Boolean);
    if (!bands.length) return { mult: 1, rule: 'No GC ops data', g: 0, y: 0, r: 0 };
    const r = bands.filter((b) => b === 'Red').length, y = bands.filter((b) => b === 'Yellow').length, g = bands.filter((b) => b === 'Green').length;
    if (r > 0) return { mult: 0.70, rule: 'Any GC Red', g, y, r };
    if (y > 0) return { mult: 1.20, rule: 'GC Yellow, none Red', g, y, r };
    return { mult: 1.50, rule: 'All GCs Green', g, y, r };
  };
  people.filter((p) => p.role !== 'gc').forEach((gm) => {
    const gcs = descendants(gm).filter((d) => d.role === 'gc');
    const is1k5k = gcs.some((d) => d.team === 'midmarket');
    MONTHS.forEach((m) => {
      const recs = gcs.map((d) => d.byMonth[m.key]);
      const weightedHits = recs.reduce((s, r) => s + r.weightedHits, 0);
      const rawHits = recs.reduce((s, r) => s + r.rawHits, 0);
      const threeWeekCounted = recs.reduce((a, r) => a.concat(r.threeWeekCounted || []), []);
      const counted = recs.reduce((a, r) => a.concat(r.counted || []), []);
      const target = Math.round(recs.reduce((s, r) => s + r.target, 0) * 0.9);
      const achievementPct = target > 0 ? (weightedHits / target) * 100 : null;
      const output = target > 0 ? (weightedHits / target) * 25 : null;
      const ops = gmOpsMult(gcs, m.key);
      const finalPct = output == null ? null : output * ops.mult;
      gm.byMonth[m.key].gm = {
        weightedHits, rawHits, threeWeekCounted, counted, target, achievementPct, outputPct: output,
        opsMult: ops.mult, opsRule: ops.rule, opsGreen: ops.g, opsYellow: ops.y, opsRed: ops.r,
        finalPct, teamSize: gcs.length,
        is1k5k, kickerPct: 0, kickerNote: is1k5k ? 'GL kicker (1/5 of GL incentive) pending GL logic' : '',
        dataHealth: target === 0 ? 'missing' : 'ok',
      };
    });
  });

  /* ---- PIP evaluation -----------------------------------------------
     Looks at the 2 months STRICTLY BEFORE the selected month (e.g. view
     June → April+May). Eligible only for Core GC and Hypercare GC.
     Skips "new" GCs who lack a target in either of those two months.   */
  function monthsBefore(periodKey, n = 2) {
    const idx = MONTHS.findIndex((m) => m.key === periodKey);
    const end = idx < 0 ? MONTHS.length - 1 : idx;
    return MONTHS.slice(Math.max(0, end - n), end); // n months before, excluding selected
  }
  function evaluatePIP(p, periodKey) {
    const months = monthsBefore(periodKey, 2);
    const labels = months.map((m) => m.label);
    const eligible = p.role === 'gc' && (p.team === 'core' || p.team === 'hypercare');
    if (!eligible) return { eligible: false, flagged: false, ratio: null, threshold: 50, months: labels, na: true, reason: 'PIP applies to Core & Hypercare GCs only' };
    if (months.length < 2) return { eligible: true, flagged: false, ratio: null, threshold: 50, months: labels, na: true, reason: 'Not enough history' };
    const recs = months.map((m) => p.byMonth[m.key]);
    // New GC: must have a target in BOTH months, else not applicable.
    if (!recs.every((r) => r && r.target > 0)) return { eligible: true, flagged: false, ratio: null, threshold: 50, months: labels, na: true, reason: 'New GC — target in only one of the two months' };
    let sumAch = 0, sumTgt = 0;
    recs.forEach((r) => { sumAch += r.rawHits; sumTgt += r.target; }); // rawHits: 3-week counts as 1
    const ratio = sumTgt > 0 ? (sumAch / sumTgt) * 100 : null;
    const threshold = 50;
    return { eligible: true, isGM: false, threshold, sumAch, sumTgt, ratio, flagged: ratio != null && ratio < threshold, months: labels };
  }
  /* ---- Active period + accessors (switchable in the header) ---------- */
  let activeKey = MONTHS[MONTHS.length - 1].key;
  const CURKEY = activeKey;
  function cur(p) { return p.byMonth[activeKey]; }
  function setPeriod(key) {
    if (!MONTHS.some((m) => m.key === key)) return;
    activeKey = key;
    I.PERIOD = MONTHS.find((m) => m.key === key).label;
    I.activeKey = key;
    people.forEach((p) => { p.m = cur(p); p.pip = evaluatePIP(p, key); });
  }
  // initial PIP relative to latest period
  people.forEach((p) => { p.pip = evaluatePIP(p, activeKey); p.m = cur(p); });

  // Ad-hoc: adhocPct = relative % bonus, adhocAbs = flat percentage-points.
  function finalPctWithAdhoc(p) {
    const c = cur(p);
    if (c.finalPct == null) return null;
    const ap = Number(c.adhocPct) || 0, aa = Number(c.adhocAbs) || 0;
    return c.finalPct * (1 + ap / 100) + aa;
  }

  /* ---- Aggregations -------------------------------------------------- */
  function teamMembers(key) {
    return people.filter((p) => {
      if (p.team !== key) return false;
      // 1k-5k membership is per-period: card-12100 GLs count in every period, and a GL who has
      // since left counts only in the months they had a target. (p.mmPeriods is set by the live
      // path; sample data has none, so it falls through and always shows.)
      if (key === 'midmarket' && p.mmPeriods) return !!p.mmPeriods[activeKey];
      return true;
    });
  }
  function avgFinalPct(list) {
    const c = list.filter((p) => finalPctWithAdhoc(p) != null);
    return c.length ? c.reduce((s, p) => s + finalPctWithAdhoc(p), 0) / c.length : 0;
  }

  function teamSummary(key) {
    const mem = teamMembers(key);
    const c = (p) => cur(p);
    const computable = mem.filter((p) => c(p).achievementPct != null);
    const flagged = mem.filter((p) => c(p).dataHealth !== 'ok');
    const missing = mem.filter((p) => c(p).dataHealth === 'missing');
    const pipCount = mem.filter((p) => p.pip.flagged).length;
    const avgAchievement = computable.length ? Math.round(computable.reduce((s, p) => s + c(p).achievementPct, 0) / computable.length) : 0;
    const totalHits = mem.reduce((s, p) => s + c(p).weightedHits, 0);
    // KAE: strike-based ₹ team — surface strikes & payout instead of %/hits
    const isKae = key === 'kae';
    const totalStrikes = isKae ? mem.reduce((s, p) => s + (c(p).strikeCount || 0), 0) : 0;
    const kaePayout = isKae ? mem.reduce((s, p) => s + (c(p).amount || 0), 0) : 0;
    // Revival: count-based ₹ team — surface revival counts & payout instead of %/hits
    const isRevival = key === 'revival';
    const totalRevivals = isRevival ? mem.reduce((s, p) => s + (c(p).revivalCount || 0), 0) : 0;
    const revivalPayout = isRevival ? mem.reduce((s, p) => s + (c(p).amount || 0), 0) : 0;
    const revivalQualified = isRevival ? mem.filter((p) => (c(p).amount || 0) > 0).length : 0;
    return { ...I.TEAMS[key], count: mem.length, flagged: flagged.length, missing: missing.length, pip: pipCount, avgFinal: avgFinalPct(mem), avgAchievement, totalHits, isKae, totalStrikes, kaePayout, isRevival, totalRevivals, revivalPayout, revivalQualified, members: mem };
  }
  function allTeamSummaries() { return I.TEAM_ORDER.map(teamSummary); }
  function flaggedPeople() {
    return people.filter((p) => cur(p).dataHealth !== 'ok')
      .sort((a, b) => (cur(a).dataHealth === 'missing' ? 0 : 1) - (cur(b).dataHealth === 'missing' ? 0 : 1));
  }
  function pipPeople() {
    return people.filter((p) => p.pip.flagged)
      .sort((a, b) => (a.pip.ratio ?? 999) - (b.pip.ratio ?? 999));
  }

  /* ---- Extend the global API ----------------------------------------- */
  Object.assign(I, {
    CORE_BANDS, coreBand, HYPERCARE_SCHEDULE, hypercareCumulative, INPUTS, bandOf, multiplierFromBands,
    REVIVAL_BANDS, revivalBand,
    logicFor, cur, finalPctWithAdhoc, setPeriod, monthsBefore, activeKey,
    teamMembers, avgFinalPct, teamSummary, allTeamSummaries, flaggedPeople, pipPeople, evaluatePIP,
    CURKEY,
  });
})();
