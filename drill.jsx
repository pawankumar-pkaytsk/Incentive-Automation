/* =====================================================================
   Drill-downs — every shown number is clickable, opening a popup with the
   underlying rows and a CSV download. Mount <DrillHost/> once in App;
   numbers use <DrillNumber> or call window.__openDrill(payload).
   payload = { title, subtitle, columns:[{key,label,align,fmt}], rows:[], filename }
   ===================================================================== */
(function () {
  function toCSV(columns, rows) {
    const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const head = columns.map((c) => esc(c.label)).join(',');
    const body = rows.map((r) => columns.map((c) => esc(c.fmt ? c.fmt(r[c.key], r) : r[c.key])).join(',')).join('\n');
    return head + '\n' + body;
  }
  window.__downloadCSV = function (filename, columns, rows) {
    const blob = new Blob([toCSV(columns, rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = (filename || 'data') + '.csv'; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };
})();

/* ---- A number that opens its own data ------------------------------ */
const DrillNumber = ({ children, payload, style, color, title }) => {
  if (!payload || !payload.rows || !payload.rows.length) {
    return <span className="sd-num" style={style}>{children}</span>;
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); window.__openDrill && window.__openDrill(payload); }}
      title={title || 'Click to see the data behind this number'}
      className="sd-num drill-num"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: color || 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'var(--sd-lowlight-2)', textUnderlineOffset: 3, ...style }}>
      {children}
    </button>
  );
};

/* ---- The popup that shows the rows + CSV --------------------------- */
const DrillModal = ({ data, onClose }) => {
  if (!data) return null;
  const cols = data.columns || [];
  const rows = data.rows || [];
  return (
    <Modal open={!!data} onClose={onClose} title={data.title} subtitle={data.subtitle} icon={data.icon || 'table'} width={data.width || 680}>
      {data.formula ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 'var(--sd-radius-md)', background: 'var(--sd-accent-1)', color: 'var(--sd-primary)', font: '600 12px/1.4 var(--sd-font-sans)', marginBottom: 14 }}>
          <Icon name="function" size={15} />{data.formula}
        </div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ font: '600 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{rows.length} row{rows.length === 1 ? '' : 's'}</span>
        <Button size="sm" variant="outline" icon="download-simple" onClick={() => window.__downloadCSV(data.filename || 'data', cols, rows)}>Download CSV</Button>
      </div>
      <div style={{ border: '1px solid var(--sd-stroke)', borderRadius: 'var(--sd-radius-md)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols.map((c) => c.w || '1fr').join(' '), gap: 8, padding: '9px 12px', background: 'var(--sd-bg-app)', font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>
          {cols.map((c) => <span key={c.key} style={{ textAlign: c.align || 'left' }}>{c.label}</span>)}
        </div>
        <div style={{ maxHeight: '46vh', overflowY: 'auto' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: cols.map((c) => c.w || '1fr').join(' '), gap: 8, padding: '9px 12px', borderTop: '1px solid var(--sd-stroke)', alignItems: 'center' }}>
              {cols.map((c) => {
                const val = c.fmt ? c.fmt(r[c.key], r) : r[c.key];
                return <span key={c.key} className={c.num ? 'sd-num' : ''} style={{ textAlign: c.align || 'left', font: (c.num ? '600' : '400') + ' 12px/1.3 var(--sd-font-sans)', color: c.color ? c.color(r[c.key], r) : 'var(--sd-fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</span>;
              })}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

const DrillHost = () => {
  const [data, setData] = React.useState(null);
  React.useEffect(() => { window.__openDrill = setData; return () => { if (window.__openDrill === setData) window.__openDrill = null; }; }, []);
  return <DrillModal data={data} onClose={() => setData(null)} />;
};

/* ---- Payload builders for the four metric types -------------------- */
const Drill = {
  bandColor(b) { return b === 'green' ? 'var(--sd-green-700)' : b === 'yellow' ? 'var(--sd-yellow-700)' : b === 'red' ? 'var(--sd-red-700)' : 'var(--sd-fg-2)'; },
  sellers(rec, name) {
    const rows = [...(rec.counted || []), ...(rec.disposed || [])];
    return {
      title: 'Sellers counted for HITs', subtitle: (name || '') + ' · ' + rec.label, icon: 'list-checks',
      filename: 'hits_' + rec.key, formula: 'Weighted HITs = Σ (3-week ×1.5, standard ×1) where handover = TRUE',
      columns: [
        { key: 'sellerId', label: 'Seller ID', w: '1fr', num: true },
        { key: 'sellerName', label: 'Seller', w: '1.4fr' },
        { key: 'hitMonthName', label: 'HIT month', w: '0.9fr', fmt: (v, r) => v + ' ' + r.hitYear },
        { key: 'threeWeek', label: '3-week', w: '0.7fr', fmt: (v) => v ? 'Yes' : 'No' },
        { key: 'handover', label: 'Handover', w: '0.8fr', fmt: (v) => v ? 'TRUE' : 'FALSE', color: (v) => v ? 'var(--sd-green-700)' : 'var(--sd-red-500)' },
        { key: 'counts', label: 'Counts', w: '0.6fr', align: 'right', num: true, fmt: (v, r) => r.handover ? ((r.threeWeek && rec.logic !== 'hypercare') ? '1.5' : '1.0') : '—' },
      ],
      rows,
    };
  },
  spend(rec, name) {
    const sp = rec.spend; if (!sp) return null;
    return {
      title: 'Spend / Live — day-wise', subtitle: (name || '') + ' · ' + rec.label + ' window (20th→20th)', icon: 'chart-line-up',
      filename: 'spendlive_' + rec.key, width: 620,
      formula: 'Net Spend/Live = Σ spend (' + sp.sumSpend + ') ÷ Σ live (' + sp.sumLive + ') = ' + (sp.netPct == null ? '—' : sp.netPct + '%'),
      columns: [
        { key: 'date', label: 'Date', w: '1.1fr', num: true },
        { key: 'spend', label: 'Spend (H)', w: '1fr', align: 'right', num: true },
        { key: 'live', label: 'Live (F)', w: '1fr', align: 'right', num: true },
        { key: 'ratio', label: 'Spend/Live', w: '1fr', align: 'right', num: true, fmt: (v) => v == null ? '—' : v + '%' },
      ],
      rows: sp.days || [],
    };
  },
  tasks(rec, name, kind) {
    const t = kind === 'callback' ? rec.callback : rec.task; if (!t) return null;
    const isCb = kind === 'callback';
    const label = isCb ? 'Callback adherence within SLA' : 'Task adherence';
    const formula = isCb
      ? label + ' = done within SLA (' + t.done + ') ÷ total schedule_call (' + t.total + ') = ' + (t.pct == null ? '—' : t.pct + '%') + '   · within SLA ⇔ tat ≤ sla_in_min'
      : label + ' = closed/completed (' + t.done + ') ÷ total (' + t.total + ') = ' + (t.pct == null ? '—' : t.pct + '%');
    const columns = isCb ? [
      { key: 'id', label: 'Task ID', w: '1.4fr' },
      { key: 'date', label: 'Date', w: '0.9fr', num: true },
      { key: 'subtask', label: 'Subtask', w: '1.3fr' },
      { key: 'status', label: 'Status', w: '0.8fr' },
      { key: 'tat', label: 'TAT / SLA (min)', w: '1.1fr', align: 'right', num: true, fmt: (v, r) => (v == null ? '—' : v) + ' / ' + (r && r.sla != null ? r.sla : '—') },
      { key: 'done', label: 'Within SLA', w: '0.9fr', align: 'right', fmt: (v) => v ? '✓ yes' : '—', color: (v) => v ? 'var(--sd-green-700)' : 'var(--sd-fg-3)' },
    ] : [
      { key: 'id', label: 'Task ID', w: '1.2fr' },
      { key: 'date', label: 'Date', w: '0.9fr', num: true },
      { key: 'subtask', label: 'Subtask', w: '1.8fr' },
      { key: 'status', label: 'Status', w: '0.9fr' },
      { key: 'done', label: 'Counts', w: '0.7fr', align: 'right', fmt: (v) => v ? '✓ done' : '—', color: (v) => v ? 'var(--sd-green-700)' : 'var(--sd-fg-3)' },
    ];
    const win = !isCb ? ' · window (20th→20th)' : (rec.key === '2026-06' ? ' · 2–19 Jul (SLA launch)' : ' · 20th→19th cycle');
    return {
      title: label + ' — tasks', subtitle: (name || '') + ' · ' + rec.label + win, icon: 'checks',
      filename: kind + '_' + rec.key, width: isCb ? 700 : 640,
      formula: formula,
      columns: columns,
      rows: t.rows || [],
    };
  },
  escalations(rec, name) {
    const e = rec.escalations; if (!e) return null;
    return {
      title: 'WES — escalations', subtitle: (name || '') + ' · ' + rec.label + ' window (20th→20th)', icon: 'warning',
      filename: 'wes_' + rec.key, width: 620,
      formula: 'WES = Social×3 (' + e.social + ') + SOS×1.5 (' + e.sos + ') + Internal×1 (' + e.internal + ') = ' + e.wes + '  · dup seller/day counted once',
      columns: [
        { key: 'date', label: 'Date', w: '1fr', num: true },
        { key: 'type', label: 'Escalation type', w: '2fr' },
        { key: 'sellerId', label: 'Seller', w: '1fr', num: true },
        { key: 'weight', label: 'Weight', w: '0.7fr', align: 'right', num: true, fmt: (v) => '×' + v },
      ],
      rows: e.rows || [],
    };
  },
  /* ---- HITS 1k-5k drill-downs ------------------------------------- */
  mmArr(rec, name) {
    const det = (rec.mmDet || []).filter((d) => d.t != null);
    const cyc = rec.mmCycle ? rec.mmCycle[0] + ' → ' + rec.mmCycle[1] : rec.label;
    const inr = (v) => v == null ? '—' : '₹' + Math.round(v).toLocaleString('en-IN');
    return {
      title: 'ARR — target vs achieved', subtitle: (name || '') + ' · ' + rec.label + ' · ' + cyc, icon: 'chart-line-up',
      filename: 'mm_arr_' + rec.key, width: 780,
      formula: 'ARR target is EARNED: each seller carries a per-age target (M0 ₹1,859 · M1 ₹3,668 · M2 ₹4,133 · M3 ₹4,480 · M4 ₹4,748 · M5+ ₹4,647, capped at M5). '
        + inr(rec.mmArrAch) + ' ÷ ' + inr(rec.mmArrTarget) + ' = ' + (rec.mmArrPct == null ? '—' : rec.mmArrPct.toFixed(1) + '%') + '  ·  ≥85% to qualify · ×' + rec.mmArrMult,
      columns: [
        { key: 'n', label: 'Seller', w: '2.2fr' },
        { key: 'age', label: 'Age', w: '0.6fr', align: 'right', num: true, fmt: (v) => v == null ? '—' : 'M' + Math.min(v, 5) },
        { key: 't', label: 'Target', w: '1fr', align: 'right', num: true, fmt: inr },
        { key: 'a', label: 'Achieved', w: '1fr', align: 'right', num: true, fmt: inr },
        { key: 'pct', label: '%', w: '0.8fr', align: 'right', num: true, fmt: (v, r) => r.t ? Math.round(r.a / r.t * 100) + '%' : '—', color: (v, r) => (r.t && r.a / r.t >= 1) ? 'var(--sd-green-700)' : 'var(--sd-fg-1)' },
        { key: 'f', label: 'Frozen', w: '0.7fr', align: 'right', fmt: (v) => v ? '✓ HIT2' : '—', color: (v) => v ? 'var(--sd-primary)' : 'var(--sd-fg-3)' },
      ],
      rows: det,
    };
  },
  mmChurn(rec, name) {
    const rows = rec.mmChurnDet || [];
    const cyc = rec.mmCycle ? rec.mmCycle[0] + ' → ' + rec.mmCycle[1] : rec.label;
    return {
      title: 'Churn — sellers lost this cycle', subtitle: (name || '') + ' · ' + rec.label + ' · ' + cyc, icon: 'trend-down',
      filename: 'mm_churn_' + rec.key, width: 720,
      formula: 'A churn is an EVENT inside the cycle: seller spent ≥ ₹11,800 and then went > 21 days with no spend, where day 22 falls inside ' + cyc
        + '.  ' + rows.length + ' churn' + (rows.length === 1 ? '' : 's') + ' → ×' + rec.mmChurnMult + ' (0→1× · 1→0.5× · 2+→0)',
      columns: [
        { key: 'n', label: 'Seller', w: '2.2fr' },
        { key: 'last', label: 'Last spend', w: '1fr', num: true },
        { key: 'cross', label: 'Idle >21d on', w: '1fr', num: true },
        { key: 'spend', label: 'Total spend', w: '1fr', align: 'right', num: true, fmt: (v) => v == null ? '—' : '₹' + Math.round(v).toLocaleString('en-IN') },
      ],
      rows: rows,
    };
  },
  mmSL(rec, name, channel) {
    const isMeta = channel === 'meta';
    const det = (rec.mmDet || []).filter((d) => isMeta ? true : d.live);
    const cyc = rec.mmCycle ? rec.mmCycle[0] + ' → ' + rec.mmCycle[1] : rec.label;
    const days = rec.mmDays || 0;
    const denom = isMeta ? rec.mmAssigned : rec.mmGlive;
    const pct = isMeta ? rec.mmMetaSL : rec.mmGoogleSL;
    const sum = det.reduce((s, d) => s + (isMeta ? d.md : d.gd), 0);
    return {
      title: 'Spend / Live — ' + (isMeta ? 'Meta' : 'Google'), subtitle: (name || '') + ' · ' + rec.label + ' · ' + cyc, icon: 'wallet',
      filename: 'mm_sl_' + channel + '_' + rec.key, width: 720,
      formula: 'Day-wise weighted: Σ(seller-days with ' + (isMeta ? 'Meta' : 'Google') + ' spend > 0) ÷ (settled days × ' + (isMeta ? 'assigned' : 'Google-live') + ' sellers) = '
        + sum + ' ÷ (' + days + ' × ' + (denom || 0) + ') = ' + (pct == null ? '—' : pct.toFixed(1) + '%')
        + '  ·  ' + (isMeta ? '<60→0 · 60–80→1× · >80→1.25×' : '<65→0 · 65–75→1× · >75→1.2×'),
      columns: [
        { key: 'n', label: 'Seller', w: '2.4fr' },
        { key: isMeta ? 'md' : 'gd', label: 'Days with spend', w: '1.2fr', align: 'right', num: true },
        { key: 'of', label: 'of settled days', w: '1.2fr', align: 'right', num: true, fmt: () => days },
        { key: 'p', label: 'Coverage', w: '1fr', align: 'right', num: true,
          fmt: (v, r) => days ? Math.round((isMeta ? r.md : r.gd) / days * 100) + '%' : '—',
          color: (v, r) => days && ((isMeta ? r.md : r.gd) / days) >= 0.8 ? 'var(--sd-green-700)' : 'var(--sd-fg-1)' },
      ],
      rows: det,
    };
  },
  mmGolive(rec, name) {
    const rows = rec.mmGoliveDet || [];
    return {
      title: 'Google go-lives', subtitle: (name || '') + ' · ' + rec.label + ' · frozen at cycle end', icon: 'seal-check',
      filename: 'mm_golive_' + rec.key, width: 740,
      formula: 'Google-live = has a Google ad account AND lifetime Google spend > ₹1 (frozen at the 19th). '
        + (rec.mmGlive || 0) + ' live ÷ ' + (rec.mmAssigned || 0) + ' assigned = ' + (rec.mmGolive == null ? '—' : rec.mmGolive.toFixed(1) + '%')
        + '  ·  <50→0 (gate) · 50–65→1× · >65→1.25×',
      columns: [
        { key: 'n', label: 'Seller', w: '2.4fr' },
        { key: 'acct', label: 'Ad account', w: '1fr', align: 'right', fmt: (v) => v ? '✓' : '—', color: (v) => v ? 'var(--sd-green-700)' : 'var(--sd-red-500)' },
        { key: 'gspend', label: 'Google spend', w: '1.2fr', align: 'right', num: true, fmt: (v) => v == null ? '—' : '₹' + Math.round(v).toLocaleString('en-IN') },
        { key: 'live', label: 'Google-live', w: '1fr', align: 'right', fmt: (v) => v ? '✓ live' : '—', color: (v) => v ? 'var(--sd-green-700)' : 'var(--sd-fg-3)' },
      ],
      rows: rows,
    };
  },
  mmHit2(rec, name) {
    return {
      title: 'HIT2 conversions', subtitle: (name || '') + ' · ' + rec.label + ' (calendar month)', icon: 'target',
      filename: 'mm_hit2_' + rec.key, width: 620,
      formula: 'HIT2 conversions from hit_master_data for ' + rec.label + ', credited to the GL named in the HITS-2 handover sheet. '
        + rec.mmHits + ' ÷ target ' + (rec.mmTarget == null ? '—' : rec.mmTarget) + ' = ' + (rec.achievementPct == null ? '—' : Math.round(rec.achievementPct) + '%')
        + ' → pool ' + (rec.mmBand ? rec.mmBand.pct : 0) + '%',
      columns: [
        { key: 'i', label: '#', w: '0.4fr', num: true, fmt: (v, r, i) => undefined },
        { key: 'seller', label: 'Seller', w: '2.6fr' },
        { key: 'sid', label: 'Seller ID', w: '1.6fr' },
      ],
      rows: (rec.mmRows || []).map((r, i) => ({ i: i + 1, seller: r.seller, sid: r.sid })),
    };
  },
  revival(rec, name) {
    const rows = rec.revivalRows || [];
    const band = rec.revivalBand || { label: '—', rate: 0 };
    const qualified = rec.amount > 0;
    return {
      title: 'Revivals — ' + rec.label, subtitle: (name || '') + ' · ' + rec.label + ' cycle (20th→19th)', icon: 'arrow-u-up-left',
      filename: 'revivals_' + rec.key, width: 660,
      formula: rec.revivalCount + ' revived → ' + band.label + (qualified ? ' → ' + rec.revivalCount + ' × ₹' + band.rate + ' = ₹' + Number(rec.amount).toLocaleString('en-IN') : ' → below threshold (needs 21+), ₹0'),
      columns: [
        { key: 'n', label: '#', w: '0.4fr', num: true },
        { key: 'date', label: 'Date', w: '1fr', num: true },
        { key: 'seller', label: 'Seller', w: '2.4fr' },
        { key: 'amt', label: 'Funds added', w: '1fr', align: 'right', num: true, fmt: (v) => v ? '₹' + v : '—' },
      ],
      rows: rows.map((s, i) => ({ n: i + 1, date: s.date, seller: s.seller || s.sid, amt: s.amt })),
    };
  },
};

Object.assign(window, { DrillNumber, DrillModal, DrillHost, Drill });
