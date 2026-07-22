/* =====================================================================
   Incentive Automation — Person view (real HITS transparency math)
   + CSV export, MetricTile, AdhocEditor, band/schedule components.
   ===================================================================== */

/* ---- CSV export (new model) ---------------------------------------- */
function exportCSV(list, filename) {
  const I = window.INCENTIVE;
  const cols = [
    'Emp Id', 'Name', 'Email', 'Team', 'Designation', 'Logic', 'Manager',
    'Period', 'HITs (counted)', '3-week HITs', 'Weighted HITs', 'Target HITs', 'Achievement %',
    'Band', 'Per-HIT %', 'Output %',
    'Input A (Spend/Live)', 'Input B (Task)', 'Input C (Callback within SLA)', 'Input D (Escalations)',
    'Input Bands', 'Multiplier', 'Final %',
    'Ad-hoc % (relative)', 'Ad-hoc pp (flat)', 'Ad-hoc Note', 'Final % (with ad-hoc)',
    'Revival Count', 'Revival Band', 'Revival Rate (₹)', 'Incentive Amount (₹)',
    'PIP Flag', 'PIP Ratio %', 'Data Status', 'Flags',
  ];
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = list.map((p) => {
    const c = I.cur(p); const mgr = I.byEmail[p.managerEmail]; const fp = I.finalPctWithAdhoc(p);
    return [
      p.empId, p.name, p.email, I.TEAMS[p.team].name, p.designation, p.logic, mgr ? mgr.name : '—',
      c.label, c.rawHits, c.threeWeekCounted.length, c.weightedHits, c.target,
      c.achievementPct == null ? '' : c.achievementPct.toFixed(1),
      c.coreBand ? c.coreBand.label : (p.logic === 'hypercare' ? 'Progressive' : ''),
      c.perHitRate == null ? '' : c.perHitRate,
      c.outputPct == null ? '' : c.outputPct.toFixed(2),
      c.rawVals ? c.rawVals.A : '', c.rawVals ? c.rawVals.B : '', c.rawVals ? c.rawVals.C : '', c.rawVals ? c.rawVals.D : '',
      c.bandArr ? c.bandArr.map((b) => b[0].toUpperCase()).join('') : 'n/a', c.multiplier == null ? 'n/a' : c.multiplier,
      c.finalPct == null ? '' : c.finalPct.toFixed(2),
      c.adhocPct || 0, c.adhocAbs || 0, c.adhocNote || '',
      fp == null ? '' : fp.toFixed(2),
      p.logic === 'revival' ? c.revivalCount : '', p.logic === 'revival' && c.revivalBand ? c.revivalBand.label : '', p.logic === 'revival' ? c.revivalRate : '',
      (p.logic === 'revival' || p.logic === 'kae') ? c.amount : '',
      p.pip.flagged ? 'YES' : 'NO', p.pip.ratio == null ? '' : p.pip.ratio.toFixed(1),
      c.dataHealth, (c.missingFields || []).join('; '),
    ].map(esc).join(',');
  });
  const csv = cols.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ---- PNG export (renders a DOM node to an image) ------------------- */
async function exportPNG(node, filename) {
  if (!node || !window.html2canvas) { alert('PNG export is still loading — try again in a moment.'); return; }
  const canvas = await window.html2canvas(node, {
    scale: Math.min(2, window.devicePixelRatio || 1) * 1.5,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    // Skip anything flagged, and never capture the loading splash.
    ignoreElements: (el) => el.id === 'boot' || (el.getAttribute && el.getAttribute('data-export-hide') === 'true'),
    // Freeze entrance animations so the capture is crisp even mid-transition.
    onclone: (doc) => {
      const s = doc.createElement('style');
      s.textContent = '*,*::before,*::after{animation:none !important;transition:none !important;opacity:1 !important;transform:none !important;}';
      doc.head.appendChild(s);
    },
  });
  await new Promise((resolve) => canvas.toBlob((blob) => {
    if (!blob) { resolve(); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    resolve();
  }, 'image/png'));
}

/* ---- Metric tile ---------------------------------------------------- */
const MetricTile = ({ label, value, sub, icon, accent = 'var(--sd-primary)', missing }) => (
  <div style={{ background: 'var(--sd-white)', border: '1px solid var(--sd-border)', borderRadius: 'var(--sd-radius-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: accent + '1a', color: accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={16} /></span>
      <span style={{ font: '600 11px/1.3 var(--sd-font-sans)', letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>{label}</span>
    </div>
    <div className="sd-num" style={{ font: '700 24px/1.1 var(--sd-font-sans)', color: missing ? 'var(--sd-red-500)' : 'var(--sd-heading)' }}>{value}</div>
    {sub ? <div style={{ font: '400 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{sub}</div> : null}
  </div>
);

/* ---- Band chip (Green/Yellow/Red) ---------------------------------- */
const BAND_STYLE = {
  green:  { bg: 'var(--sd-green-50)',  fg: 'var(--sd-green-900)',  dot: 'var(--sd-green-700)',  label: 'Green' },
  yellow: { bg: 'var(--sd-yellow-50)', fg: 'var(--sd-yellow-900)', dot: 'var(--sd-yellow-700)', label: 'Yellow' },
  red:    { bg: 'var(--sd-red-50)',    fg: 'var(--sd-red-900)',    dot: 'var(--sd-red-500)',    label: 'Red' },
};
const BandPill = ({ band, children }) => {
  const s = BAND_STYLE[band];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: s.bg, color: s.fg, font: '600 11px/1 var(--sd-font-sans)' }}>
    <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }}></span>{children || s.label}
  </span>;
};

/* ---- Input bands grid (null-safe; only renders inputs that exist) -- */
const InputBands = ({ rec, person }) => {
  const I = window.INCENTIVE;
  if (!rec.bands || !rec.rawVals) {
    return <div style={{ padding: '14px 12px', font: '400 12px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-3)', textAlign: 'center', background: 'var(--sd-bg-app)', borderRadius: 'var(--sd-radius-md)' }}>Input metrics (Spend/Live, Task, Callback) not found for this period — multiplier defaults to ×1.00.</div>;
  }
  const drillFor = { A: () => window.Drill.spend(rec, person && person.name), B: () => window.Drill.tasks(rec, person && person.name, 'task'), C: () => window.Drill.tasks(rec, person && person.name, 'callback'), D: () => window.Drill.escalations(rec, person && person.name) };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {I.INPUTS.filter((inp) => rec.bands[inp.key] != null).map((inp) => {
        const band = rec.bands[inp.key]; const s = BAND_STYLE[band] || BAND_STYLE.yellow; const v = rec.rawVals[inp.key];
        const payload = drillFor[inp.key] ? drillFor[inp.key]() : null;
        return (
          <div key={inp.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--sd-radius-md)', border: '1px solid var(--sd-stroke)', background: 'var(--sd-white)' }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--sd-bg-app)', color: 'var(--sd-fg-2)', font: '700 11px/1 var(--sd-font-sans)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{inp.key}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 13px/1.2 var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{inp.label}</div>
              <div style={{ font: '400 11px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 2 }}>{inp.hint}</div>
            </div>
            <DrillNumber payload={payload} color={s.dot} style={{ font: '700 15px/1 var(--sd-font-sans)' }}>{v}{inp.unit}</DrillNumber>
            <BandPill band={band} />
          </div>
        );
      })}
    </div>
  );
};

/* ---- Seller HIT breakdown (sellers counted for hits achievement) --- */
const SellerHits = ({ rec }) => {
  const counted = rec.counted || [];
  const disposed = rec.disposed || [];
  if (!counted.length && !disposed.length) return <div style={{ padding: 16, font: '400 13px var(--sd-font-sans)', color: 'var(--sd-fg-3)', textAlign: 'center' }}>No seller HITs recorded for {rec.label}.</div>;
  const isHC = rec.logic === 'hypercare';
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 0.8fr', gap: 8, padding: '8px 14px', background: 'var(--sd-bg-app)', font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>
        <span>Seller</span><span>3-week?</span><span>Handover</span><span style={{ textAlign: 'right' }}>Counts</span>
      </div>
      {[...counted, ...disposed].map((s, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 0.8fr', gap: 8, padding: '9px 14px', borderTop: '1px solid var(--sd-stroke)', alignItems: 'center', opacity: s.handover ? 1 : 0.5 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '600 12px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.sellerName}</div>
            <div className="sd-num" style={{ font: '400 10px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{s.sellerId} · {s.hitMonthName} {s.hitYear}</div>
          </div>
          <span>{s.threeWeek ? (isHC ? <BandPill band="yellow">3-week (×1)</BandPill> : <BandPill band="green">3-week ×1.5</BandPill>) : <span style={{ font: '400 12px var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>Standard</span>}</span>
          <span style={{ font: '600 12px var(--sd-font-sans)', color: s.handover ? 'var(--sd-green-700)' : 'var(--sd-red-500)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name={s.handover ? 'check-circle' : 'x-circle'} size={13} />{s.handover ? 'TRUE' : 'FALSE'}
          </span>
          <span className="sd-num" style={{ textAlign: 'right', font: '700 13px var(--sd-font-sans)', color: s.handover ? 'var(--sd-heading)' : 'var(--sd-lowlight-2)' }}>{s.handover ? ((s.threeWeek && !isHC) ? '1.5' : '1.0') : '—'}</span>
        </div>
      ))}
    </div>
  );
};

/* ---- Core band reference table ------------------------------------- */
const CoreBandTable = ({ active }) => {
  const I = window.INCENTIVE;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {I.CORE_BANDS.map((b, i) => {
        const on = active && b.min === active.min;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 13px', borderRadius: 'var(--sd-radius-md)', background: on ? 'var(--sd-accent-1)' : 'transparent', border: `1px solid ${on ? 'var(--sd-accent-2)' : 'var(--sd-stroke)'}` }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: on ? 'var(--sd-primary)' : 'var(--sd-lowlight-2)' }}></span>
            <div className="sd-num" style={{ flex: 1, font: `${on ? 700 : 600} 13px/1 var(--sd-font-sans)`, color: on ? 'var(--sd-primary)' : 'var(--sd-fg-1)' }}>{b.label} achievement</div>
            <div className="sd-num" style={{ font: '700 14px/1 var(--sd-font-sans)', color: on ? 'var(--sd-primary)' : 'var(--sd-fg-2)' }}>{b.rate}% / HIT</div>
          </div>
        );
      })}
    </div>
  );
};

/* ---- Hypercare schedule -------------------------------------------- */
const HypercareSchedule = ({ hits }) => {
  const I = window.INCENTIVE;
  const reached = Math.ceil(hits);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {I.HYPERCARE_SCHEDULE.map((r, i) => {
        const on = (i + 1) <= reached;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 13px', borderRadius: 'var(--sd-radius-md)', background: on ? 'var(--sd-cyan-50)' : 'transparent', border: `1px solid ${on ? 'var(--sd-cyan-700)' : 'var(--sd-stroke)'}` }}>
            <span className="sd-num" style={{ width: 30, font: '700 12px/1 var(--sd-font-sans)', color: on ? 'var(--sd-cyan-900)' : 'var(--sd-fg-3)' }}>{r.hit}</span>
            <div className="sd-num" style={{ flex: 1, font: '600 13px/1 var(--sd-font-sans)', color: on ? 'var(--sd-cyan-900)' : 'var(--sd-fg-2)' }}>+{r.rate}% per HIT</div>
            {r.cum != null ? <div className="sd-num" style={{ font: '700 13px/1 var(--sd-font-sans)', color: on ? 'var(--sd-cyan-900)' : 'var(--sd-fg-3)' }}>{r.cum}% cum.</div> : <span style={{ font: '400 11px var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>flat</span>}
          </div>
        );
      })}
    </div>
  );
};

/* ---- PIP detail card ----------------------------------------------- */
const PIPCard = ({ person }) => {
  const I = window.INCENTIVE; const pip = person.pip;
  return (
    <Card variant="flat" padding={18} style={{ background: 'var(--sd-red-50)', borderColor: 'var(--sd-red-100)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--sd-red-500)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="flag" size={16} /></span>
        <div>
          <div style={{ font: '700 14px/1.2 var(--sd-font-sans)', color: 'var(--sd-red-900)' }}>PIP flag raised</div>
          <div style={{ font: '400 12px/1.2 var(--sd-font-sans)', color: 'var(--sd-red-700)' }}>{pip.isGM ? 'GM' : 'GC'} criterion: 2-month achievement &lt; {pip.threshold}%</div>
        </div>
      </div>
      <div className="sd-num" style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '10px 0', borderTop: '1px dashed var(--sd-red-100)' }}>
        <span style={{ font: '400 12px var(--sd-font-sans)', color: 'var(--sd-red-700)', flex: 1 }}>Σ raw HITs ({pip.months.join(' + ')})</span>
        <span style={{ font: '700 14px var(--sd-font-sans)', color: 'var(--sd-red-900)' }}>{pip.sumAch}</span>
      </div>
      <div className="sd-num" style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '10px 0', borderTop: '1px dashed var(--sd-red-100)' }}>
        <span style={{ font: '400 12px var(--sd-font-sans)', color: 'var(--sd-red-700)', flex: 1 }}>Σ target HITs</span>
        <span style={{ font: '700 14px var(--sd-font-sans)', color: 'var(--sd-red-900)' }}>{pip.sumTgt}</span>
      </div>
      <div className="sd-num" style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '12px', marginTop: 6, background: 'var(--sd-red-500)', borderRadius: 'var(--sd-radius-md)' }}>
        <span style={{ font: '700 13px var(--sd-font-sans)', color: '#fff', flex: 1 }}>Achievement ratio</span>
        <span style={{ font: '700 18px var(--sd-font-sans)', color: '#fff' }}>{pip.ratio == null ? '—' : pip.ratio.toFixed(1) + '%'}</span>
      </div>
      <div style={{ font: '400 11px/1.4 var(--sd-font-sans)', color: 'var(--sd-red-700)', marginTop: 10 }}>Note: 3-week HITs count as 1 (not 1.5) in the PIP calculation.</div>
    </Card>
  );
};

/* ---- Ad-hoc editor (all in %) -------------------------------------- */
const AdhocEditor = ({ person, onChange, canEdit }) => {
  const I = window.INCENTIVE; const m = I.cur(person);
  const [pct, setPct] = React.useState(m.adhocPct || 0);
  const [abs, setAbs] = React.useState(m.adhocAbs || 0);
  const [note, setNote] = React.useState(m.adhocNote || '');
  const [saved, setSaved] = React.useState(false);
  const apply = () => { m.adhocPct = Number(pct) || 0; m.adhocAbs = Number(abs) || 0; m.adhocNote = note; setSaved(true); setTimeout(() => setSaved(false), 1600); onChange && onChange(); };
  const dirty = (Number(pct) || 0) !== (m.adhocPct || 0) || (Number(abs) || 0) !== (m.adhocAbs || 0) || note !== (m.adhocNote || '');
  const addPp = m.finalPct != null ? (m.finalPct * (Number(pct) || 0) / 100) + (Number(abs) || 0) : 0;
  return (
    <Card variant="flat" padding={18} style={{ background: 'var(--sd-orange-50)', borderColor: 'var(--sd-orange-200)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--sd-orange-200)', color: 'var(--sd-orange-900)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus-circle" size={17} /></span>
        <div><div style={{ font: '700 14px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>Ad-hoc incentive</div><div style={{ font: '400 12px/1.2 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>For special / ad-hoc projects · all in %</div></div>
      </div>
      {!canEdit ? (
        <div style={{ font: '400 13px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 12 }}>Only your manager or admin can add ad-hoc incentives.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Relative bonus" hint="× on final %"><TextInput type="number" value={pct} suffix="%" onChange={(e) => setPct(e.target.value)} placeholder="0" /></Field>
            <Field label="Flat add-on" hint="percentage points"><TextInput type="number" value={abs} suffix="pp" onChange={(e) => setAbs(e.target.value)} placeholder="0" /></Field>
          </div>
          <Field label="Reason / project"><TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Diwali campaign sprint" icon="note-pencil" /></Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button size="sm" variant="dark" icon={saved ? 'check' : 'floppy-disk'} disabled={!dirty && !saved} onClick={apply}>{saved ? 'Applied' : 'Apply'}</Button>
            <span className="sd-num" style={{ font: '500 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{m.finalPct != null ? `Adds +${I.pct(addPp, 2)}` : 'Base not computable'}</span>
          </div>
        </div>
      )}
    </Card>
  );
};

Object.assign(window, { exportCSV, exportPNG, MetricTile, BandPill, InputBands, SellerHits, CoreBandTable, HypercareSchedule, PIPCard, AdhocEditor, BAND_STYLE });
