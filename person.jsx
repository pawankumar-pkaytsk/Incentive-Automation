/* =====================================================================
   Incentive Automation — PersonView (transparent HITS math, % only)
   Branches: GM rollup · Hypercare GC (clean, hits-only) · Core GC.
   ===================================================================== */
const BackBtn = ({ onBack }) => (
  <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sd-fg-2)', font: '600 13px/1 var(--sd-font-sans)', padding: 0, marginBottom: 16 }}>
    <Icon name="arrow-left" size={15} /> Back
  </button>
);

const PersonHeader = ({ person, viewer }) => {
  const I = window.INCENTIVE; const m = I.cur(person); const team = I.TEAMS[person.team];
  const isGM = person.team === 'gm'; const isSelf = viewer.email === person.email;
  const finalPctAdj = I.finalPctWithAdhoc(person);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
      <Avatar name={person.name} size={56} style={{ fontSize: 20 }} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ font: '700 26px/1.1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{person.name}{isSelf ? <span style={{ font: '500 14px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginLeft: 8 }}>(you)</span> : null}</h2>
          <StatusChip status={m.dataHealth} />
          {person.pip.flagged ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '700 11px/1 var(--sd-font-sans)', color: '#fff', background: 'var(--sd-red-500)', padding: '5px 10px', borderRadius: 999 }}><Icon name="flag" size={12} />PIP</span> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7, flexWrap: 'wrap' }}>
          <Badge tone="primary" style={{ background: team.tint, color: team.accent }}><Icon name={team.icon} size={13} /> {team.name}</Badge>
          <span style={{ font: '500 13px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{person.designation}</span>
          <span style={{ font: '400 13px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>· {person.empId}</span>
          {person.cl ? <span style={{ font: '400 13px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>· CL {person.cl}</span> : null}
          <Badge tone={person.logic === 'hypercare' ? 'info' : 'primary'} dot>{person.logic === 'hypercare' ? 'Hypercare logic' : person.logic === 'kae' ? 'KAE logic' : person.logic === 'revival' ? 'Revival logic' : person.logic === 'campaign' ? 'Campaign logic' : person.logic === 'midmarket' ? '1k-5k logic' : person.logic === 'goodseller' || person.logic === 'ai' ? 'Not yet calculated' : isGM ? 'GM rollup' : 'Core GC logic'}</Badge>
        </div>
      </div>
      <div style={{ textAlign: 'right', minWidth: 160 }}>
        <div style={{ font: '600 11px/1 var(--sd-font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sd-fg-2)', marginBottom: 6 }}>{I.PERIOD} · Final incentive</div>
        {m.notice ? <div style={{ font: '600 18px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{m.notice}</div>
          : person.logic === 'kae' || person.logic === 'revival' ? <div style={{ font: '700 40px/1 var(--sd-font-sans)', color: m.amount > 0 ? 'var(--sd-primary)' : 'var(--sd-fg-3)' }}>{I.inr(m.amount)}</div>
          : isGM ? (m.gm && m.gm.finalPct != null ? <div style={{ font: '700 40px/1 var(--sd-font-sans)', color: 'var(--sd-primary)' }}><CountUp value={m.gm.finalPct} format={(v) => I.pct(v, 2)} /></div> : <div style={{ font: '700 22px/1.1 var(--sd-font-sans)', color: 'var(--sd-red-500)' }}>Pending data</div>)
          : (m.finalPct != null ? <div style={{ font: '700 40px/1 var(--sd-font-sans)', color: 'var(--sd-primary)' }}><CountUp value={finalPctAdj} format={(v) => I.pct(v, 2)} /></div>
            : <div style={{ font: '700 22px/1.1 var(--sd-font-sans)', color: 'var(--sd-red-500)' }}>Pending data</div>)}
      </div>
    </div>
  );
};

const MissingBanner = ({ m }) => (
  <Card variant="flat" padding={16} style={{ background: 'var(--sd-red-50)', borderColor: 'var(--sd-red-100)', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <Icon name="warning-octagon" size={22} style={{ color: 'var(--sd-red-500)', flexShrink: 0 }} />
    <div><div style={{ font: '700 14px/1.3 var(--sd-font-sans)', color: 'var(--sd-red-900)' }}>Incentive can't be finalised yet</div>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{m.missingFields.map((f, i) => <li key={i} style={{ font: '400 13px/1.6 var(--sd-font-sans)', color: 'var(--sd-red-900)' }}>{f}</li>)}</ul></div>
  </Card>
);

const SellerLedgerCard = ({ m }) => (
  <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
    <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon name="list-checks" size={18} style={{ color: 'var(--sd-primary)' }} />
      <div style={{ font: '700 15px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', flex: 1 }}>Sellers counted for HITs — {m.label}</div>
      <span style={{ font: '600 12px/1 var(--sd-font-sans)', color: 'var(--sd-green-700)' }}>{m.counted.length} counted</span>
    </div>
    <SellerHits rec={m} />
  </Card>
);

const PersonView = ({ person, viewer, onBack, onChange, onOpenPerson }) => {
  const I = window.INCENTIVE;
  const m = I.cur(person);
  const team = I.TEAMS[person.team];
  const isGM = person.team === 'gm';
  const canEdit = viewer.role === 'admin' || (viewer.role === 'manager' && I.descendants(viewer).some((d) => d.email === person.email));
  const finalPctAdj = I.finalPctWithAdhoc(person);
  const apPct = Number(m.adhocPct) || 0, apAbs = Number(m.adhocAbs) || 0;
  const hasAdhoc = apPct || apAbs;

  /* ---------- GM incentive (doc §3) ---------- */
  if (isGM) {
    const gm = m.gm || { weightedHits: 0, rawHits: 0, threeWeekCounted: [], counted: [], target: 0, achievementPct: null, outputPct: null, opsMult: 1, opsRule: '—', opsGreen: 0, opsYellow: 0, opsRed: 0, finalPct: null, teamSize: 0, is1k5k: false, kickerNote: '' };
    const gcs = (person.reports || []).filter((d) => d.role === 'gc');
    const sellersPayload = {
      title: 'HITs counted for this GM', subtitle: person.name + ' · ' + m.label, icon: 'list-checks',
      filename: 'gm_hits_' + m.key, formula: 'Weighted HITs = Σ (3-week ×1.5, standard ×1) where handover = TRUE (handover col F = GM)',
      columns: [
        { key: 'sellerId', label: 'Seller ID', w: '1fr', num: true },
        { key: 'sellerName', label: 'Seller', w: '1.4fr' },
        { key: 'hitMonthName', label: 'HIT month', w: '0.9fr', fmt: (v, r) => v + ' ' + r.hitYear },
        { key: 'threeWeek', label: '3-week', w: '0.7fr', fmt: (v) => v ? 'Yes ×1.5' : 'No ×1' },
      ],
      rows: gm.counted || [],
    };
    const opsColor = gm.opsMult >= 1.5 ? 'var(--sd-green-700)' : gm.opsMult >= 1.2 ? 'var(--sd-heading)' : 'var(--sd-red-700)';
    return (
      <div style={{ animation: 'fadeUp 360ms ease both' }}>
        {onBack ? <BackBtn onBack={onBack} /> : null}
        <PersonHeader person={person} viewer={viewer} />
        {person.pip.flagged ? <div style={{ marginBottom: 20 }}><PIPCard person={person} /></div> : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 4px' }}><SectionTitle eyebrow="Full transparency · GM" title={`How your ${I.PERIOD} incentive is calculated`} /></div>
              <div style={{ padding: '0 16px 10px' }}>
                <MathRow label="Team HITs (handover = TRUE)" detail={`From handover sheet · GM column · ${gm.teamSize} GCs reporting`} value={<DrillNumber payload={sellersPayload}>{gm.counted.length}</DrillNumber>} />
                <MathRow label="3-week HITs (×1.5)" detail={`${gm.threeWeekCounted.length} sellers from 3-week go-live`} value={gm.threeWeekCounted.length ? '+' + (gm.threeWeekCounted.length * 0.5).toFixed(1) : '0'} indent accent="var(--sd-green-700)" />
                <MathRow label="Weighted HITs achievement" detail="Standard ×1 + 3-week ×1.5" value={<DrillNumber payload={sellersPayload}>{gm.weightedHits.toFixed(1)}</DrillNumber>} />
                <MathRow label="GM target" detail="From target sheet (month-wise)" value={gm.target || '—'} />
                <MathRow label="GM output" detail={`(${gm.weightedHits.toFixed(1)} ÷ ${gm.target || '—'}) × 25%`} value={gm.outputPct == null ? '—' : I.pct(gm.outputPct, 2)} accent="var(--sd-primary)" />
                <MathRow label={`GC Ops multiplier — ${gm.opsRule}`} detail={`Reporting GCs · ${gm.opsGreen} green · ${gm.opsYellow} yellow · ${gm.opsRed} red`} value={'×' + gm.opsMult.toFixed(2)} accent={opsColor} indent />
                {gm.is1k5k ? <MathRow label="1k–5k GL kicker" detail={gm.kickerNote} value="pending" accent="var(--sd-orange-700)" indent /> : null}
              </div>
              <div style={{ padding: '4px 16px 16px' }}>
                {gm.kickerPct ? (
                  <MathRow label="GL kicker" detail={gm.kickerNote + ' · ' + (gm.kickerRows || []).map((r) => r.name + ' ' + I.pct(r.pct, 2)).join(' · ')} value={'+' + I.pct(gm.kickerPct, 2)} accent="var(--sd-green-700)" indent />
                ) : null}
                <MathRow strong label={`Final incentive · ${I.PERIOD}`}
                  detail={gm.fixedPct != null ? 'Fixed incentive — overrides the computed figure'
                    : (gm.outputPct == null ? 'GM target missing'
                      : `Output ${I.pct(gm.outputPct, 2)} × ${gm.opsMult.toFixed(2)}` + (gm.kickerPct ? ` + ${I.pct(gm.kickerPct, 2)} GL kicker` : ''))}
                  value={gm.finalPct == null ? 'Pending' : I.pct(gm.finalPct, 2)} />
              </div>
            </Card>
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="users-three" size={18} style={{ color: team.accent }} />
                <div style={{ font: '700 15px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', flex: 1 }}>Reporting GCs &amp; their ops band</div>
                <span style={{ font: '600 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{gcs.length} GCs</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.5fr', gap: 8, padding: '8px 16px', background: 'var(--sd-bg-app)', font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>
                <span>GC</span><span style={{ textAlign: 'right' }}>HITs</span><span style={{ textAlign: 'center' }}>Ops band</span><span></span>
              </div>
              {gcs.map((d, i) => {
                const dm = d.byMonth[m.key]; const b = dm.gcBand;
                const bc = b === 'Green' ? 'var(--sd-green-700)' : b === 'Yellow' ? 'var(--sd-yellow-700)' : b === 'Red' ? 'var(--sd-red-500)' : 'var(--sd-fg-3)';
                return (
                  <div key={d.email} onClick={() => onOpenPerson && onOpenPerson(d)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.5fr', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--sd-stroke)', alignItems: 'center', cursor: onOpenPerson ? 'pointer' : 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}><Avatar name={d.name} size={26} /><span style={{ font: '600 12px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span></div>
                    <span className="sd-num" style={{ textAlign: 'right', font: '600 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{dm.weightedHits.toFixed(1)}</span>
                    <span style={{ textAlign: 'center' }}>{b ? <span style={{ font: '700 11px/1 var(--sd-font-sans)', color: bc }}>{b}</span> : <span style={{ font: '400 11px var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>—</span>}</span>
                    <Icon name="caret-right" size={14} style={{ color: 'var(--sd-lowlight-2)' }} />
                  </div>
                );
              })}
              {gcs.length === 0 ? <div style={{ padding: 20, textAlign: 'center', font: '400 13px var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>No reporting GCs mapped.</div> : null}
            </Card>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MetricTile label="Team HITs" value={gm.weightedHits.toFixed(1)} sub={`${gm.teamSize} GCs`} icon="users-three" accent={team.accent} />
              <MetricTile label="GM target" value={gm.target || '—'} sub="Target sheet" icon="target" accent="var(--sd-primary)" />
              <MetricTile label="Output %" value={gm.outputPct == null ? '—' : I.pct(gm.outputPct, 1)} sub="(HITs÷Target)×25%" icon="percent" accent="var(--sd-violet-700)" />
              <MetricTile label="Ops mult" value={'×' + gm.opsMult.toFixed(2)} sub={gm.opsRule} icon="arrows-down-up" accent={opsColor} />
            </div>
            <Card variant="regular" padding={18}>
              <div style={{ font: '700 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', marginBottom: 12 }}>GC Ops multiplier</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['All GCs Green', '1.50×', 1.5], ['GC Yellow, none Red', '1.20×', 1.2], ['Any GC Red', '0.70×', 0.7]].map((r) => {
                  const active = Math.abs(gm.opsMult - r[2]) < 0.001;
                  return (
                    <div key={r[0]} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--sd-radius-md)', background: active ? 'var(--sd-accent-1)' : 'transparent', border: active ? '1px solid var(--sd-primary)' : '1px solid var(--sd-stroke)' }}>
                      <span style={{ flex: 1, font: '600 12px/1 var(--sd-font-sans)', color: active ? 'var(--sd-primary)' : 'var(--sd-fg-2)' }}>{r[0]}</span>
                      <span className="sd-num" style={{ font: '700 13px/1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{r[1]}</span>
                      {active ? <Icon name="check" size={14} style={{ color: 'var(--sd-primary)' }} /> : null}
                    </div>
                  );
                })}
              </div>
              {gm.is1k5k ? <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 'var(--sd-radius-md)', background: 'var(--sd-orange-50)', font: '500 11px/1.4 var(--sd-font-sans)', color: 'var(--sd-orange-900)' }}><Icon name="info" size={13} style={{ marginRight: 5, verticalAlign: '-2px' }} />1k–5k GM: GL kicker (1/5 of GL incentive) will be added once the GL incentive logic is defined.</div> : null}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const missing = m.dataHealth === 'missing';

  /* ---------- KAE (strike-based ₹ incentive, doc §13) ---------- */
  if (person.logic === 'kae') {
    const band = m.kaeBand || { label: '—', ded: 0 };
    const strikePayload = {
      title: 'KAE strikes', subtitle: person.name + ' · ' + m.label + ' (20th→20th)', icon: 'warning-circle',
      filename: 'kae_strikes_' + m.key, width: 600,
      formula: 'Base ₹6,000 · ' + m.strikeCount + ' strike(s) → ' + band.label + ' → ' + band.ded + '% deduction',
      columns: [
        { key: 'n', label: '#', w: '0.4fr', num: true, fmt: (v, r, i) => undefined },
        { key: 'date', label: 'Strike date', w: '1fr', num: true },
        { key: 'issue', label: 'Strike issue', w: '2.4fr' },
      ],
      rows: m.strikes.map((s, i) => ({ n: i + 1, date: s.date, issue: s.issue })),
    };
    const tile = (n) => n === 0 ? 'var(--sd-green-700)' : n <= 3 ? 'var(--sd-yellow-700)' : n <= 5 ? 'var(--sd-orange-700)' : 'var(--sd-red-700)';
    return (
      <div style={{ animation: 'fadeUp 360ms ease both' }}>
        {onBack ? <BackBtn onBack={onBack} /> : null}
        <PersonHeader person={person} viewer={viewer} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 4px' }}><SectionTitle eyebrow="Full transparency · KAE" title={`How your ${I.PERIOD} incentive is calculated`} /></div>
              <div style={{ padding: '0 16px 10px' }}>
                <MathRow label="Base incentive" detail="Fixed ₹6,000 per KAE" value={I.inr(m.kaeBase)} />
                <MathRow label="Strikes (20th→20th)" detail={<DrillNumber payload={strikePayload} title="See which strikes counted">{m.strikeCount + ' strike' + (m.strikeCount === 1 ? '' : 's')}</DrillNumber>} value={band.label} accent={tile(m.strikeCount)} />
                <MathRow label="Deduction" detail={`${band.label} → ${band.ded}% of base`} value={'−' + band.ded + '%'} accent={band.ded ? 'var(--sd-red-700)' : 'var(--sd-green-700)'} indent />
              </div>
              <div style={{ padding: '4px 16px 16px' }}>
                <MathRow strong label={`Final incentive · ${I.PERIOD}`} detail={`₹6,000 × (1 − ${band.ded}%)`} value={I.inr(m.amount)} />
              </div>
            </Card>
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="warning-circle" size={18} style={{ color: m.strikeCount ? 'var(--sd-red-500)' : 'var(--sd-green-700)' }} />
                <div style={{ font: '700 15px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', flex: 1 }}>Strikes that affected your incentive</div>
                <span style={{ font: '600 12px/1 var(--sd-font-sans)', color: tile(m.strikeCount) }}>{m.strikeCount} this period</span>
              </div>
              {m.strikes.length === 0 ? (
                <div style={{ padding: '4px 16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="check-circle" size={20} style={{ color: 'var(--sd-green-700)' }} />
                  <span style={{ font: '500 13px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>No strikes — full ₹6,000 incentive, no deduction.</span>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1.1fr 2.4fr', gap: 8, padding: '8px 16px', background: 'var(--sd-bg-app)', font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>
                    <span>#</span><span>Date</span><span>Issue</span>
                  </div>
                  {m.strikes.map((s, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '0.5fr 1.1fr 2.4fr', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--sd-stroke)', alignItems: 'center' }}>
                      <span className="sd-num" style={{ font: '700 12px/1 var(--sd-font-sans)', color: 'var(--sd-red-500)' }}>{i + 1}</span>
                      <span className="sd-num" style={{ font: '500 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{s.date}</span>
                      <span style={{ font: '500 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{s.issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MetricTile label="Base" value={I.inr(m.kaeBase)} sub="Per KAE" icon="wallet" accent="var(--sd-fg-2)" />
              <MetricTile label="Strikes" value={m.strikeCount} sub={band.label} icon="warning-circle" accent={tile(m.strikeCount)} />
              <MetricTile label="Deduction" value={band.ded + '%'} sub="Of base" icon="trend-down" accent={band.ded ? 'var(--sd-red-500)' : 'var(--sd-green-700)'} />
              <MetricTile label="Final" value={I.inr(m.amount)} sub="This period" icon="hand-coins" accent="var(--sd-primary)" />
            </div>
            <Card variant="regular" padding={18}>
              <div style={{ font: '700 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', marginBottom: 12 }}>KAE strike schedule</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['0', '₹6,000', 'No deduction', 0], ['1–3', '₹4,800', '20% off', 3], ['>3–5', '₹3,000', '50% off', 5], ['>5', '₹0', '100% off', 99]].map((r) => {
                  const active = (r[3] === 0 && m.strikeCount === 0) || (r[0] === '1–3' && m.strikeCount >= 1 && m.strikeCount <= 3) || (r[0] === '>3–5' && m.strikeCount > 3 && m.strikeCount <= 5) || (r[0] === '>5' && m.strikeCount > 5);
                  return (
                    <div key={r[0]} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--sd-radius-md)', background: active ? 'var(--sd-accent-1)' : 'transparent', border: active ? '1px solid var(--sd-primary)' : '1px solid var(--sd-stroke)' }}>
                      <span style={{ flex: '0 0 52px', font: '700 12px/1 var(--sd-font-sans)', color: active ? 'var(--sd-primary)' : 'var(--sd-fg-2)' }}>{r[0]}</span>
                      <span className="sd-num" style={{ flex: 1, font: '600 13px/1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{r[1]}</span>
                      <span style={{ font: '400 11px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{r[2]}</span>
                      {active ? <Icon name="check" size={14} style={{ color: 'var(--sd-primary)' }} /> : null}
                    </div>
                  );
                })}
              </div>
            </Card>
            
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Revival GC (count-based ₹, 20th→19th cycle) ---------- */
  if (person.logic === 'revival') {
    const band = m.revivalBand || { label: '—', rate: 0 };
    const rows = m.revivalRows || [];
    const qualified = m.amount > 0;
    const revivalPayload = window.Drill.revival ? window.Drill.revival(m, person.name) : null;
    return (
      <div style={{ animation: 'fadeUp 360ms ease both' }}>
        {onBack ? <BackBtn onBack={onBack} /> : null}
        <PersonHeader person={person} viewer={viewer} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 4px' }}><SectionTitle eyebrow="Full transparency · Revival GC" title={`How your ${I.PERIOD} incentive is calculated`} /></div>
              <div style={{ padding: '0 16px 10px' }}>
                <MathRow label="Sellers revived (20th→19th)" detail={<DrillNumber payload={revivalPayload} title="See which revivals counted">{m.revivalCount + ' revived'}</DrillNumber>} value={band.label} accent={qualified ? 'var(--sd-green-700)' : 'var(--sd-fg-3)'} />
                <MathRow label="Per-revival rate" detail={qualified ? band.label + ' band' : 'Below minimum threshold (needs 21+)'} value={qualified ? '₹' + band.rate : '₹0'} indent />
              </div>
              <div style={{ padding: '4px 16px 16px' }}>
                <MathRow strong label={`Final incentive · ${I.PERIOD}`} detail={qualified ? m.revivalCount + ' × ₹' + band.rate + '/revival' : m.revivalCount + ' revivals — below 21, no payout'} value={I.inr(m.amount)} />
              </div>
            </Card>
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="arrow-u-up-left" size={18} style={{ color: qualified ? 'var(--sd-green-700)' : 'var(--sd-fg-3)' }} />
                <div style={{ font: '700 15px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', flex: 1 }}>Sellers you revived this cycle</div>
                <span style={{ font: '600 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{m.revivalCount} revived</span>
              </div>
              {rows.length === 0 ? (
                <div style={{ padding: '4px 16px 20px', font: '500 13px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>No revivals logged in this cycle.</div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr 2.2fr 1fr', gap: 8, padding: '8px 16px', background: 'var(--sd-bg-app)', font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>
                    <span>#</span><span>Date</span><span>Seller</span><span style={{ textAlign: 'right' }}>Funds</span>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {rows.map((s, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr 2.2fr 1fr', gap: 8, padding: '9px 16px', borderTop: '1px solid var(--sd-stroke)', alignItems: 'center' }}>
                        <span className="sd-num" style={{ font: '700 12px/1 var(--sd-font-sans)', color: 'var(--sd-primary)' }}>{i + 1}</span>
                        <span className="sd-num" style={{ font: '500 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{s.date}</span>
                        <span style={{ font: '500 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.seller || s.sid}</span>
                        <span className="sd-num" style={{ textAlign: 'right', font: '500 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{s.amt ? '₹' + s.amt : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MetricTile label="Revived" value={m.revivalCount} sub="This cycle" icon="arrow-u-up-left" accent="var(--sd-primary)" />
              <MetricTile label="Band" value={band.label} sub={qualified ? '₹' + band.rate + '/revival' : 'Below threshold'} icon="squares-four" accent={qualified ? 'var(--sd-green-700)' : 'var(--sd-fg-3)'} />
              <MetricTile label="Rate" value={qualified ? '₹' + band.rate : '₹0'} sub="Per revival" icon="hand-coins" accent="var(--sd-fg-2)" />
              <MetricTile label="Final" value={I.inr(m.amount)} sub="This cycle" icon="wallet" accent="var(--sd-primary)" />
            </div>
            <Card variant="regular" padding={18}>
              <div style={{ font: '700 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', marginBottom: 12 }}>Revival incentive schedule</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['≤ 20', '₹0', 'Below threshold', 0, 20], ['21–30', '₹200/rev', 'max ₹6,000', 21, 30], ['31–40', '₹250/rev', 'max ₹10,000', 31, 40], ['40+', '₹375/rev', '₹15,000 & up', 41, Infinity]].map((r) => {
                  const active = m.revivalCount >= r[3] && m.revivalCount <= r[4];
                  return (
                    <div key={r[0]} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--sd-radius-md)', background: active ? 'var(--sd-accent-1)' : 'transparent', border: active ? '1px solid var(--sd-primary)' : '1px solid var(--sd-stroke)' }}>
                      <span style={{ flex: '0 0 52px', font: '700 12px/1 var(--sd-font-sans)', color: active ? 'var(--sd-primary)' : 'var(--sd-fg-2)' }}>{r[0]}</span>
                      <span className="sd-num" style={{ flex: 1, font: '600 13px/1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{r[1]}</span>
                      <span style={{ font: '400 11px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{r[2]}</span>
                      {active ? <Icon name="check" size={14} style={{ color: 'var(--sd-primary)' }} /> : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Teams with no computed incentive yet (Good Seller · AI) ---------- */
  if (m.notice) {
    return (
      <div style={{ animation: 'fadeUp 360ms ease both' }}>
        {onBack ? <BackBtn onBack={onBack} /> : null}
        <PersonHeader person={person} viewer={viewer} />
        <Card variant="regular" padding={0} style={{ overflow: 'hidden', maxWidth: 640 }}>
          <div style={{ padding: '16px 16px 4px' }}><SectionTitle eyebrow={'Full transparency · ' + team.name} title={`${I.PERIOD} incentive`} /></div>
          <div style={{ padding: '4px 16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Icon name="clock" size={20} style={{ color: 'var(--sd-fg-3)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ font: '600 15px/1.4 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{m.notice}</div>
              <div style={{ font: '400 13px/1.6 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 6 }}>
                No incentive is calculated for {team.name} in the app yet, so nothing here is a payable figure.
              </div>
              {person.cl ? (
                <div style={{ font: '400 13px/1.6 var(--sd-font-sans)', color: 'var(--sd-fg-2)', marginTop: 10 }}>
                  Cluster lead · <b style={{ color: 'var(--sd-heading)' }}>{person.cl}</b>
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* ---------- HITS 1k-5k GL (HITs unlocks the pool; multipliers pending) ---------- */
  if (person.logic === 'midmarket') {
    const band = m.mmBand, rows = m.mmRows || [], hasTgt = m.mmTarget != null;
    const gates = m.mmGates || [];
    const pctOr = (v) => v == null ? '—' : v.toFixed(0) + '%';
    // Each step of the multiplier chain: label, value, multiplier, gate rule, failed?
    const D = window.Drill;
    const CHAIN = [
      ['ARR', m.mmArrPct == null ? '—' : m.mmArrPct.toFixed(0) + '%', m.mmArrMult, '≥85% to qualify · ≥150%→1.25× · ≥200%→2×', m.mmArrPct == null || m.mmArrPct < 85, () => D.mmArr(m, person.name)],
      ['Churn', String(m.mmChurn || 0), m.mmChurnMult, '0→1× · 1→0.5× · 2+→0', m.mmChurnMult === 0, () => D.mmChurn(m, person.name)],
      ['Spend / Live — Meta', pctOr(m.mmMetaSL), m.mmMetaMult, '<60→0 · 60–80→1× · >80→1.25×', m.mmMetaSL == null || m.mmMetaSL < 60, () => D.mmSL(m, person.name, 'meta')],
      ['Spend / Live — Google', pctOr(m.mmGoogleSL), m.mmGoogMult, '<65→0 · 65–75→1× · >75→1.2×', m.mmGoogleSL == null || m.mmGoogleSL < 65, () => D.mmSL(m, person.name, 'google')],
      ['Google go-lives', pctOr(m.mmGolive), m.mmGoliveMult, '<50→0 · 50–65→1× · >65→1.25×', m.mmGolive == null || m.mmGolive < 50, () => D.mmGolive(m, person.name)],
    ];
    return (
      <div style={{ animation: 'fadeUp 360ms ease both' }}>
        {onBack ? <BackBtn onBack={onBack} /> : null}
        <PersonHeader person={person} viewer={viewer} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 4px' }}><SectionTitle eyebrow="Full transparency · 1k-5k GL" title={`How your ${I.PERIOD} incentive is calculated`} /></div>
              {hasTgt ? (
                <div style={{ padding: '0 16px 10px' }}>
                  <MathRow label="HIT2 achieved (calendar month)" detail="Conversions from hit_master_data, credited via the HITS-2 handover sheet"
                    value={<DrillNumber payload={D.mmHit2(m, person.name)} title="See which conversions counted" style={{ font: '700 13px/1 var(--sd-font-sans)' }}>{String(m.mmHits)}</DrillNumber>} />
                  <MathRow label="HITS target" detail="From the HITS target sheet" value={String(m.mmTarget)} indent />
                  <MathRow label="Achievement" detail={band ? band.label : '—'} value={m.achievementPct == null ? '—' : I.pct(m.achievementPct, 0)} accent={(m.achievementPct || 0) >= 100 ? 'var(--sd-green-700)' : (m.achievementPct || 0) >= 50 ? 'var(--sd-heading)' : 'var(--sd-red-700)'} indent />
                </div>
              ) : <div style={{ padding: '4px 16px 14px', font: '500 13px/1.5 var(--sd-font-sans)', color: 'var(--sd-red-700)' }}>No 1k-5k HITS target set for {m.label} — incentive can't be computed.</div>}
              {hasTgt ? (
                <div style={{ padding: '4px 16px 10px' }}>
                  <MathRow label="Incentive pool unlocked" detail={band ? band.label + ' → ' + band.pct + '% of the incentive' : '—'} value={band ? band.pct + '%' : '—'} accent={band && band.pct ? 'var(--sd-green-700)' : 'var(--sd-red-700)'} />
                </div>
              ) : null}
              {m.mmHasInputs ? (
                <div style={{ padding: '0 16px 10px' }}>
                  <div style={{ font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sd-fg-3)', margin: '8px 2px 6px' }}>Multipliers &amp; gates</div>
                  {CHAIN.map((c) => (
                    <MathRow key={c[0]} label={c[0]} detail={c[3]} indent
                      accent={c[4] ? 'var(--sd-red-700)' : (c[2] > 1 ? 'var(--sd-green-700)' : 'var(--sd-fg-2)')}
                      value={<DrillNumber payload={c[5]()} color={c[4] ? 'var(--sd-red-700)' : (c[2] > 1 ? 'var(--sd-green-700)' : 'var(--sd-fg-1)')} style={{ font: '700 13px/1 var(--sd-font-sans)' }}>{c[1] + '  ·  ×' + c[2]}</DrillNumber>} />
                  ))}
                </div>
              ) : null}
              <div style={{ padding: '4px 16px 16px' }}>
                <MathRow strong label={`Final incentive · ${I.PERIOD}`}
                  detail={gates.length ? 'Gate failed: ' + gates.join(', ') : `${band ? band.pct : 0}% × ${m.mmArrMult} × ${m.mmChurnMult} × ${m.mmMetaMult} × ${m.mmGoogMult} × ${m.mmGoliveMult}`}
                  value={m.finalPct == null ? '—' : I.pct(m.finalPct, 2)} />
              </div>
            </Card>
            {gates.length ? (
              <Card variant="flat" padding={16} style={{ background: 'var(--sd-red-50)', borderColor: 'var(--sd-red-100)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Icon name="warning-octagon" size={20} style={{ color: 'var(--sd-red-500)', flexShrink: 0 }} />
                <div>
                  <div style={{ font: '700 13px/1.3 var(--sd-font-sans)', color: 'var(--sd-red-900)' }}>Incentive is 0% — {gates.length} gate{gates.length === 1 ? '' : 's'} failed</div>
                  <div style={{ font: '400 12px/1.6 var(--sd-font-sans)', color: 'var(--sd-red-900)', marginTop: 4 }}>{gates.join(' · ')}</div>
                  <div style={{ font: '400 11px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 6 }}>Any single failed gate zeroes the incentive, regardless of performance elsewhere.</div>
                </div>
              </Card>
            ) : null}
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="target" size={18} style={{ color: 'var(--sd-primary)' }} />
                <div style={{ font: '700 15px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', flex: 1 }}>HIT2 conversions credited</div>
                <span style={{ font: '600 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{m.mmHits} converted</span>
              </div>
              {rows.length === 0 ? (
                <div style={{ padding: '4px 16px 20px', font: '500 13px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>No HIT2 conversions credited this month.</div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 0.9fr 2fr 1.9fr', gap: 8, padding: '8px 16px', background: 'var(--sd-bg-app)', font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>
                    <span>#</span><span>Month</span><span>Seller</span><span>Seller ID</span>
                  </div>
                  {rows.map((s, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '0.4fr 0.9fr 2fr 1.9fr', gap: 8, padding: '9px 16px', borderTop: '1px solid var(--sd-stroke)', alignItems: 'center' }}>
                      <span className="sd-num" style={{ font: '700 12px/1 var(--sd-font-sans)', color: 'var(--sd-primary)' }}>{i + 1}</span>
                      <span className="sd-num" style={{ font: '500 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{s.date}</span>
                      <span style={{ font: '500 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.seller || s.sid}</span>
                      <span className="sd-num" style={{ font: '400 11px/1.3 var(--sd-font-mono, var(--sd-font-sans))', color: 'var(--sd-fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.sid}>{s.sid || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MetricTile label="HIT2" value={m.mmHits} sub="Converted this month" icon="target" accent="var(--sd-primary)" />
              <MetricTile label="Target" value={hasTgt ? m.mmTarget : '—'} sub="This cycle" icon="gauge" accent="var(--sd-fg-2)" />
              <MetricTile label="Achievement" value={m.achievementPct == null ? '—' : I.pct(m.achievementPct, 0)} sub={band ? band.label : '—'} icon="chart-line-up" accent={(m.achievementPct || 0) >= 100 ? 'var(--sd-green-700)' : 'var(--sd-fg-2)'} />
              <MetricTile label="Pool unlocked" value={band ? band.pct + '%' : '—'} sub="Before multipliers" icon="wallet" accent="var(--sd-primary)" />
            </div>
            <Card variant="regular" padding={18}>
              <div style={{ font: '700 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', marginBottom: 12 }}>HITs → incentive unlocked</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['≥ 100%', '25%', 100, Infinity], ['50–99%', '15%', 50, 99.999], ['< 50%', '0%', -Infinity, 49.999]].map((r) => {
                  const a = m.achievementPct;
                  const active = a != null && a >= r[2] && a <= r[3];
                  return (
                    <div key={r[0]} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--sd-radius-md)', background: active ? 'var(--sd-accent-1)' : 'transparent', border: active ? '1px solid var(--sd-primary)' : '1px solid var(--sd-stroke)' }}>
                      <span style={{ flex: '0 0 62px', font: '700 12px/1 var(--sd-font-sans)', color: active ? 'var(--sd-primary)' : 'var(--sd-fg-2)' }}>{r[0]}</span>
                      <span className="sd-num" style={{ flex: 1, font: '600 13px/1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{r[1]} of incentive</span>
                      {active ? <Icon name="check" size={14} style={{ color: 'var(--sd-primary)' }} /> : null}
                    </div>
                  );
                })}
              </div>
            </Card>
            {m.mmHasInputs ? (
              <Card variant="regular" padding={18}>
                <div style={{ font: '700 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', marginBottom: 12 }}>Inputs behind the gates</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    ['ARR achieved', m.mmArrAch == null ? '—' : I.inr(Math.round(m.mmArrAch))],
                    ['ARR target (earned)', m.mmArrTarget == null ? '—' : I.inr(Math.round(m.mmArrTarget))],
                    ['Assigned sellers', m.mmAssigned == null ? '—' : m.mmAssigned],
                    ['Google-live sellers', m.mmGlive == null ? '—' : m.mmGlive],
                    ['Churned sellers', m.mmChurn || 0],
                    ['Settled days averaged', m.mmDays == null ? '—' : m.mmDays],
                  ].map((r) => (
                    <div key={r[0]} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                      <span style={{ font: '400 12px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{r[0]}</span>
                      <span className="sd-num" style={{ font: '600 12px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{r[1]}</span>
                    </div>
                  ))}
                </div>
                <div style={{ font: '400 11px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sd-stroke)' }}>
                  ARR target is <b>earned</b> — each seller carries a per-age target (M0 ₹1,859 → M5 ₹4,647), capped at M5. Spend/Live is a day-wise weighted average over the cycle; go-live is frozen at the 19th.
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Campaign GC (linear inverse incentive on Spend/GMV) ---------- */
  if (person.logic === 'campaign') {
    const sg = m.campaignSpendGmv, base = m.campaignBaseline || 42, inc = m.finalPct, has = sg != null;
    return (
      <div style={{ animation: 'fadeUp 360ms ease both' }}>
        {onBack ? <BackBtn onBack={onBack} /> : null}
        <PersonHeader person={person} viewer={viewer} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 4px' }}><SectionTitle eyebrow="Full transparency · Campaign GC" title={`How your ${I.PERIOD} incentive is calculated`} /></div>
              {has ? (
                <div style={{ padding: '0 16px 10px' }}>
                  <MathRow label="Spend / GMV (week 0)" detail="Lower is better — the incentive moves inversely" value={sg + '%'} accent={sg <= base ? 'var(--sd-green-700)' : 'var(--sd-fg-1)'} />
                  <MathRow label="Baseline (target)" detail="At the baseline, incentive = 25%" value={base + '%'} indent />
                </div>
              ) : (
                <div style={{ padding: '4px 16px 16px', font: '500 13px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>Campaign Spend/GMV is hard-coded for Jun 2026 only — other periods populate once the rolling query is connected.</div>
              )}
              {has ? (
                <div style={{ padding: '4px 16px 16px' }}>
                  <MathRow strong label={`Final incentive · ${I.PERIOD}`} detail={`25% × (${base}% ÷ ${sg}%)`} value={inc == null ? '—' : I.pct(inc, 2)} />
                </div>
              ) : null}
            </Card>
            <Card variant="regular" padding={18}>
              <div style={{ font: '700 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', marginBottom: 10 }}>Linear inverse incentive</div>
              <div style={{ font: '400 13px/1.6 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>Incentive % = 25% × ({base}% ÷ Spend/GMV %). At {base}% → 25%; below {base}% → higher; above {base}% → lower.</div>
            </Card>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MetricTile label="Spend / GMV" value={has ? sg + '%' : '—'} sub="Week 0" icon="wallet" accent={has && sg <= base ? 'var(--sd-green-700)' : 'var(--sd-fg-2)'} />
              <MetricTile label="Baseline" value={base + '%'} sub="= 25% incentive" icon="target" accent="var(--sd-fg-2)" />
              <MetricTile label="Incentive" value={inc == null ? '—' : I.pct(inc, 2)} sub="This period" icon="percent" accent="var(--sd-primary)" />
              <MetricTile label="Multiplier" value={has ? '×' + (base / sg).toFixed(3) : '—'} sub={`${base} ÷ Spend/GMV`} icon="chart-line-up" accent="var(--sd-fg-2)" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Hypercare GC (clean: hits only, no bands/multiplier) ---------- */
  if (person.logic === 'hypercare') {
    return (
      <div style={{ animation: 'fadeUp 360ms ease both' }}>
        {onBack ? <BackBtn onBack={onBack} /> : null}
        <PersonHeader person={person} viewer={viewer} />
        {missing ? <MissingBanner m={m} /> : null}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 4px' }}><SectionTitle eyebrow="Full transparency · Hypercare" title={`How your ${I.PERIOD} incentive is calculated`} /></div>
              <div style={{ padding: '0 16px 10px' }}>
                <MathRow label="HITs counted (handover = TRUE)" detail={`${m.counted.length} sellers approved · ${m.disposed.length} disposed (handover FALSE)`} value={m.counted.length} />
                <MathRow label="3-week go-live" detail="Not weighted for Hypercare — every HIT counts as 1" value="×1.0" accent="var(--sd-fg-3)" indent />
                <MathRow label="Target HITs" detail="From target sheet (month-wise)" value={m.target} />
                <MathRow label="HITS achievement" detail={`${m.weightedHits} ÷ ${m.target}`} value={m.achievementPct == null ? '—' : m.achievementPct.toFixed(0) + '%'} accent={m.achievementPct >= 90 ? 'var(--sd-green-700)' : 'var(--sd-heading)'} />
                <MathRow label="Output incentive (progressive)" detail={`Cumulative schedule for ${m.weightedHits} HITs`} value={I.pct(m.outputPct, 2)} accent="var(--sd-cyan-700)" />
                {hasAdhoc ? (<>
                  <MathRow label="Ad-hoc bonus (relative)" detail={m.adhocNote || 'Special project'} value={I.pct(apPct, 0)} sign="× " accent="var(--sd-orange-700)" indent />
                  <MathRow label="Ad-hoc flat add-on" detail={m.adhocNote || 'Special project'} value={apAbs + ' pp'} sign="+ " accent="var(--sd-orange-700)" indent />
                </>) : null}
              </div>
              <div style={{ padding: '4px 16px 16px' }}>
                <MathRow strong label={`Final incentive · ${I.PERIOD}`} detail="Hypercare has no input multiplier — final = output %" value={m.finalPct != null ? I.pct(finalPctAdj, 2) : 'Pending'} />
              </div>
            </Card>
            <SellerLedgerCard m={m} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <MetricTile label="HITs" value={m.weightedHits} sub={`Target ${m.target}`} icon="target" accent={team.accent} />
              <MetricTile label="Achievement" value={m.achievementPct == null ? '—' : m.achievementPct.toFixed(0) + '%'} sub="Progressive" icon="gauge" accent="var(--sd-green-700)" />
              <MetricTile label="Output %" value={I.pct(m.outputPct, 1)} sub="Cumulative" icon="percent" accent="var(--sd-cyan-700)" />
              <MetricTile label="Final %" value={m.finalPct == null ? '—' : I.pct(finalPctAdj, 1)} sub="No multiplier" icon="hand-coins" accent="var(--sd-primary)" />
            </div>
            <Card variant="regular" padding={18}>
              <div style={{ font: '700 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', marginBottom: 12 }}>Hypercare per-HIT schedule</div>
              <HypercareSchedule hits={m.weightedHits} />
            </Card>
            {person.pip.flagged ? <PIPCard person={person} /> : null}
            
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Core GC ---------- */
  const hasInputs = !!(m.bandArr && m.bandArr.length);
  const mult = m.multiplier == null ? 1 : m.multiplier;
  const sellersPayload = window.Drill.sellers(m, person.name);
  return (
    <div style={{ animation: 'fadeUp 360ms ease both' }}>
      {onBack ? <BackBtn onBack={onBack} /> : null}
      <PersonHeader person={person} viewer={viewer} />
      {missing ? <MissingBanner m={m} /> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 16px 4px' }}><SectionTitle eyebrow="Full transparency · Core GC" title={`How your ${I.PERIOD} incentive is calculated`} /></div>
            <div style={{ padding: '0 16px 10px' }}>
              <MathRow label="HITs counted (handover = TRUE)" detail={`${m.counted.length} sellers approved · ${m.disposed.length} disposed (handover FALSE)`} value={<DrillNumber payload={sellersPayload}>{m.counted.length}</DrillNumber>} />
              <MathRow label="3-week HITs (×1.5)" detail={`${m.threeWeekCounted.length} sellers from 3-week go-live sheet`} value={m.threeWeekCounted.length ? '+' + (m.threeWeekCounted.length * 0.5).toFixed(1) : '0'} indent accent="var(--sd-green-700)" />
              <MathRow label="Weighted HITs delivered" detail="Standard ×1 + 3-week ×1.5" value={<DrillNumber payload={sellersPayload}>{m.weightedHits.toFixed(1)}</DrillNumber>} />
              <MathRow label="Target HITs" detail="From target sheet (month-wise)" value={m.target} />
              <MathRow label="HITS achievement" detail={`${m.weightedHits.toFixed(1)} ÷ ${m.target}`} value={m.achievementPct == null ? '—' : m.achievementPct.toFixed(0) + '%'} accent={m.achievementPct >= 90 ? 'var(--sd-green-700)' : m.achievementPct >= 50 ? 'var(--sd-heading)' : 'var(--sd-red-700)'} />
              <MathRow label={`Band — ${m.coreBand ? m.coreBand.label : '—'}`} detail={m.coreBand ? `${m.perHitRate}% incentive per HIT` : '—'} value={m.perHitRate != null ? m.perHitRate + '%' : '—'} />
              <MathRow label="Output incentive" detail={`${m.perHitRate == null ? '—' : m.perHitRate + '%'} × ${m.weightedHits.toFixed(1)} HITs`} value={I.pct(m.outputPct, 2)} accent="var(--sd-primary)" />
              {hasInputs
                ? <MathRow label={`Input multiplier — ${m.gcBand} band`} detail={`${m.bandArr.map((b, i) => I.INPUTS[i].key + ':' + b[0].toUpperCase()).join('  ')} · ${m.multRule}`} value={'×' + mult.toFixed(2)} accent={mult >= 1.3 ? 'var(--sd-green-700)' : mult >= 1 ? 'var(--sd-heading)' : 'var(--sd-red-700)'} indent />
                : <MathRow label="Input multiplier" detail="Spend/Live, Task &amp; Callback not found for this period" value="×1.00" accent="var(--sd-fg-3)" indent />}
              {hasAdhoc ? (<>
                <MathRow label="Ad-hoc bonus (relative)" detail={m.adhocNote || 'Special project'} value={I.pct(apPct, 0)} sign="× " accent="var(--sd-orange-700)" indent />
                <MathRow label="Ad-hoc flat add-on" detail={m.adhocNote || 'Special project'} value={apAbs + ' pp'} sign="+ " accent="var(--sd-orange-700)" indent />
              </>) : null}
            </div>
            <div style={{ padding: '4px 16px 16px' }}>
              <MathRow strong label={`Final incentive · ${I.PERIOD}`} detail={`Output ${I.pct(m.outputPct, 2)} × ${mult.toFixed(2)} multiplier`} value={m.finalPct != null ? I.pct(finalPctAdj, 2) : 'Pending'} />
            </div>
          </Card>
          <SpendLiveDetail rec={m} person={person} />
          <SellerLedgerCard m={m} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <MetricTile label="Weighted HITs" value={m.weightedHits.toFixed(1)} sub={`Target ${m.target}`} icon="target" accent={team.accent} />
            <MetricTile label="Achievement" value={m.achievementPct == null ? '—' : m.achievementPct.toFixed(0) + '%'} sub={m.coreBand ? m.coreBand.label : '—'} icon="gauge" accent="var(--sd-green-700)" />
            <MetricTile label="Output %" value={I.pct(m.outputPct, 1)} sub="Before multiplier" icon="percent" accent="var(--sd-primary)" />
            <MetricTile label="Multiplier" value={'×' + mult.toFixed(2)} sub={m.gcBand ? m.gcBand + ' band' : 'no inputs'} icon="arrows-down-up" accent="var(--sd-violet-700)" />
          </div>
          <Card variant="regular" padding={18}>
            <div style={{ font: '700 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', marginBottom: 12 }}>Input quality bands</div>
            <InputBands rec={m} person={person} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', background: 'var(--sd-bg-app)', borderRadius: 'var(--sd-radius-md)' }}>
              <Icon name="arrows-down-up" size={15} style={{ color: 'var(--sd-fg-2)' }} />
              <span style={{ flex: 1, font: '600 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{m.multRule}</span>
              <span className="sd-num" style={{ font: '700 16px/1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>×{mult.toFixed(2)}</span>
            </div>
          </Card>
          <Card variant="regular" padding={18}>
            <div style={{ font: '700 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', marginBottom: 12 }}>Core incentive bands</div>
            <CoreBandTable active={m.coreBand} />
          </Card>
          {person.pip.flagged ? <PIPCard person={person} /> : null}
          
        </div>
      </div>
    </div>
  );
};

/* ---- Spend/Live day-wise + average (with calc logic) --------------- */
const SpendLiveDetail = ({ rec, person }) => {
  const I = window.INCENTIVE;
  const sp = rec.spend;
  const tk = rec.task, cb = rec.callback;
  if (!sp && !tk && !cb) return null;
  const Adher = ({ label, kind, data }) => {
    if (!data) return null;
    const payload = window.Drill.tasks(rec, person.name, kind);
    const band = data.band; const col = window.Drill.bandColor(band);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--sd-radius-md)', border: '1px solid var(--sd-stroke)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 13px/1.2 var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{label}</div>
          <div className="sd-num" style={{ font: '400 11px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 2 }}>{kind === 'callback' ? 'done within SLA ' + data.done + ' ÷ total ' + data.total : 'closed/completed ' + data.done + ' ÷ total ' + data.total}</div>
        </div>
        <DrillNumber payload={payload} color={col} style={{ font: '700 16px/1 var(--sd-font-sans)' }}>{data.pct == null ? '—' : data.pct + '%'}</DrillNumber>
      </div>
    );
  };
  return (
    <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px' }}>
        <SectionTitle eyebrow="Input metrics · transparency" title="Spend / Live, Task & Callback" />
      </div>
      {sp ? (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--sd-radius-md)', background: 'var(--sd-accent-1)', marginBottom: 10 }}>
            <Icon name="chart-line-up" size={18} style={{ color: 'var(--sd-primary)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '700 13px/1.2 var(--sd-font-sans)', color: 'var(--sd-primary)' }}>Average Spend / Live</div>
              <div className="sd-num" style={{ font: '400 11px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-2)', marginTop: 2 }}>Σ spend {sp.sumSpend} ÷ Σ live {sp.sumLive} · window 20th→20th</div>
            </div>
            <DrillNumber payload={window.Drill.spend(rec, person.name)} color="var(--sd-primary)" style={{ font: '700 22px/1 var(--sd-font-sans)' }}>{sp.netPct == null ? '—' : sp.netPct + '%'}</DrillNumber>
          </div>
          <div style={{ font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--sd-fg-3)', margin: '6px 2px 8px' }}>Day-wise (click average above for full table + CSV)</div>
          <div style={{ border: '1px solid var(--sd-stroke)', borderRadius: 'var(--sd-radius-md)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr', gap: 8, padding: '7px 12px', background: 'var(--sd-bg-app)', font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>
              <span>Date</span><span style={{ textAlign: 'right' }}>Spend</span><span style={{ textAlign: 'right' }}>Live</span><span style={{ textAlign: 'right' }}>Ratio</span>
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {(sp.days || []).map((d, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr', gap: 8, padding: '7px 12px', borderTop: '1px solid var(--sd-stroke)' }}>
                  <span className="sd-num" style={{ font: '400 12px/1.2 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{d.date}</span>
                  <span className="sd-num" style={{ textAlign: 'right', font: '500 12px/1.2 var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{d.spend}</span>
                  <span className="sd-num" style={{ textAlign: 'right', font: '500 12px/1.2 var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{d.live}</span>
                  <span className="sd-num" style={{ textAlign: 'right', font: '700 12px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{d.ratio == null ? '—' : d.ratio + '%'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Adher label="Task adherence" kind="task" data={tk} />
        <Adher label="Callback adherence within SLA" kind="callback" data={cb} />
      </div>
    </Card>
  );
};

Object.assign(window, { PersonView, BackBtn, SpendLiveDetail });
