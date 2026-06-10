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
    const label = kind === 'callback' ? 'Callback adherence' : 'Task adherence';
    return {
      title: label + ' — tasks', subtitle: (name || '') + ' · ' + rec.label + ' window (20th→20th)', icon: 'checks',
      filename: kind + '_' + rec.key, width: 640,
      formula: label + ' = closed/completed (' + t.done + ') ÷ total (' + t.total + ') = ' + (t.pct == null ? '—' : t.pct + '%'),
      columns: [
        { key: 'date', label: 'Date', w: '0.9fr', num: true },
        { key: 'subtask', label: 'Subtask', w: '2fr' },
        { key: 'status', label: 'Status', w: '1fr' },
        { key: 'done', label: 'Counts', w: '0.7fr', align: 'right', fmt: (v) => v ? '✓ done' : '—', color: (v) => v ? 'var(--sd-green-700)' : 'var(--sd-fg-3)' },
      ],
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
};

Object.assign(window, { DrillNumber, DrillModal, DrillHost, Drill });
