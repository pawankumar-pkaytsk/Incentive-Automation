/* =====================================================================
   Incentive Automation — roster rows, TeamView, AdminView (+ PIP tab)
   ===================================================================== */

/* ---- Leaderboard medal ---------------------------------------------- */
const MEDALS = {
  1: { grad: 'linear-gradient(135deg,#FFE07A 0%,#F5B301 100%)', ring: '#E0A100', label: '1st' },
  2: { grad: 'linear-gradient(135deg,#E4E9F0 0%,#A9B2C0 100%)', ring: '#95A0AE', label: '2nd' },
  3: { grad: 'linear-gradient(135deg,#EEC08C 0%,#C77B3B 100%)', ring: '#B06A2E', label: '3rd' },
};
const RankBadge = ({ rank, size = 22 }) => {
  const m = MEDALS[rank];
  if (!m) return null;
  return (
    <span title={`${m.label} — top performer`} aria-label={`Rank ${rank}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: 999, background: m.grad, boxShadow: `inset 0 0 0 1px ${m.ring}, 0 1px 2px rgba(20,23,38,0.2)`, flexShrink: 0 }}>
      <Icon name="medal" size={Math.round(size * 0.62)} strokeWidth={2.1} style={{ color: '#fff' }} />
    </span>
  );
};

/* ---- Roster row ----------------------------------------------------- */
const RosterRow = ({ person, onOpen, index, rank }) => {
  const I = window.INCENTIVE;
  const [hover, setHover] = React.useState(false);
  const m = I.cur(person);
  const team = I.TEAMS[person.team];
  const isGM = person.role !== 'gc' && person.logic !== 'kae' && person.logic !== 'revival';
  const src = isGM ? (m.gm || { achievementPct: null, weightedHits: 0, finalPct: null }) : m;
  return (
    <div onClick={() => onOpen(person)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.5fr 1fr 1.2fr', gap: 12, alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: hover ? 'var(--sd-bg-hover)' : 'transparent', borderTop: '1px solid var(--sd-stroke)', transition: 'background 120ms ease', animation: 'fadeUp 380ms ease both', animationDelay: `${Math.min(index * 20, 360)}ms` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ position: 'relative', flexShrink: 0, lineHeight: 0 }}>
          <Avatar name={person.name} size={36} />
          {rank ? <span style={{ position: 'absolute', bottom: -4, right: -5 }}><RankBadge rank={rank} size={18} /></span> : null}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: '600 14px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.name}</span>
            {person.pip.flagged ? <Icon name="flag" size={13} style={{ color: 'var(--sd-red-500)', flexShrink: 0 }} /> : null}
          </div>
          <div style={{ font: '400 12px/1.2 var(--sd-font-sans)', color: 'var(--sd-fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.designation}</div>
        </div>
      </div>
      <div>
        {person.logic === 'kae' ? (
          <span className="sd-num" style={{ font: '600 13px var(--sd-font-sans)', color: m.strikeCount ? 'var(--sd-red-500)' : 'var(--sd-green-700)' }}>{m.strikeCount} strike{m.strikeCount === 1 ? '' : 's'}</span>
        ) : person.logic === 'revival' ? (
          <span className="sd-num" style={{ font: '600 13px var(--sd-font-sans)', color: m.amount > 0 ? 'var(--sd-green-700)' : 'var(--sd-fg-3)' }}>{m.revivalCount} revived{m.amount > 0 ? '' : ' · below 21'}</span>
        ) : src.achievementPct != null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, maxWidth: 80 }}><ProgressBar pct={Math.min(100, src.achievementPct)} color={src.achievementPct >= 90 ? 'var(--sd-green-700)' : src.achievementPct >= 50 ? team.accent : 'var(--sd-red-500)'} delay={index * 18} /></div>
            <span className="sd-num" style={{ font: '600 13px/1 var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{src.achievementPct.toFixed(0)}%</span>
          </div>
        ) : <span style={{ font: '400 13px var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>—</span>}
      </div>
      <div className="sd-num" style={{ font: '500 13px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{person.logic === 'kae' || person.logic === 'revival' ? '—' : src.weightedHits.toFixed(1)}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {person.logic === 'kae' || person.logic === 'revival'
          ? <span className="sd-num" style={{ font: '700 14px/1 var(--sd-font-sans)', color: m.amount > 0 ? 'var(--sd-primary)' : 'var(--sd-fg-3)' }}>{I.inr(m.amount)}</span>
          : isGM
            ? <span className="sd-num" style={{ font: '700 14px/1 var(--sd-font-sans)', color: src.finalPct != null ? 'var(--sd-primary)' : 'var(--sd-red-500)' }}>{src.finalPct != null ? I.pct(src.finalPct, 1) : 'Pending'}</span>
            : <span className="sd-num" style={{ font: '700 14px/1 var(--sd-font-sans)', color: m.finalPct != null ? 'var(--sd-primary)' : 'var(--sd-red-500)' }}>{m.finalPct != null ? I.pct(I.finalPctWithAdhoc(person), 1) : 'Pending'}</span>}
        <Icon name="caret-right" size={15} style={{ color: hover ? 'var(--sd-primary)' : 'var(--sd-lowlight-2)', transition: 'color 120ms' }} />
      </div>
    </div>
  );
};
const RosterHeader = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.5fr 1fr 1.2fr', gap: 12, padding: '10px 16px', background: 'var(--sd-bg-app)' }}>
    {['Team member', 'Achievement', 'Wtd HITs', 'Final %'].map((h) => (
      <div key={h} style={{ font: '600 11px/1 var(--sd-font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>{h}</div>
    ))}
  </div>
);

/* ---- Team stat bar -------------------------------------------------- */
const TeamStatBar = ({ summary }) => {
  const I = window.INCENTIVE;
  const tiles = summary.isRevival ? [
    { label: 'Members', value: summary.count, icon: 'users', accent: 'var(--sd-primary)' },
    { label: 'Revivals', value: summary.totalRevivals, icon: 'arrow-u-up-left', accent: summary.accent },
    { label: 'Qualified (>20)', value: summary.revivalQualified, icon: 'check-circle', accent: 'var(--sd-green-700)' },
    { label: 'Total payout', value: I.inr(summary.revivalPayout), icon: 'hand-coins', accent: 'var(--sd-primary)' },
  ] : [
    { label: 'Members', value: summary.count, icon: 'users', accent: 'var(--sd-primary)' },
    { label: 'HITs (weighted)', value: summary.totalHits.toFixed(1), icon: 'target', accent: summary.accent },
    { label: 'Avg achievement', value: summary.avgAchievement + '%', icon: 'gauge', accent: 'var(--sd-green-700)' },
    { label: 'PIP flags', value: summary.pip, icon: 'flag', accent: summary.pip ? 'var(--sd-red-500)' : 'var(--sd-fg-3)' },
  ];
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>{tiles.map((t) => <MetricTile key={t.label} {...t} />)}</div>;
};

/* ---- Team / roster view -------------------------------------------- */
const TeamView = ({ meta, members: memberList, viewer, onBack, onOpenPerson, backLabel = 'All teams' }) => {
  const I = window.INCENTIVE;
  const team = meta;
  const computable = memberList.filter((p) => I.cur(p).achievementPct != null);
  const isRevival = team.key === 'revival';
  const summary = {
    count: memberList.length,
    totalHits: memberList.reduce((s, p) => s + I.cur(p).weightedHits, 0),
    avgAchievement: computable.length ? Math.round(computable.reduce((s, p) => s + I.cur(p).achievementPct, 0) / computable.length) : 0,
    pip: memberList.filter((p) => p.pip.flagged).length,
    accent: team.accent, members: memberList,
    isRevival,
    totalRevivals: isRevival ? memberList.reduce((s, p) => s + (I.cur(p).revivalCount || 0), 0) : 0,
    revivalPayout: isRevival ? memberList.reduce((s, p) => s + (I.cur(p).amount || 0), 0) : 0,
    revivalQualified: isRevival ? memberList.filter((p) => (I.cur(p).amount || 0) > 0).length : 0,
  };
  const [sort, setSort] = React.useState('final');
  const [q, setQ] = React.useState('');
  const captureRef = React.useRef(null);
  let members = memberList.slice();
  if (q.trim()) { const s = q.toLowerCase(); members = members.filter((p) => p.name.toLowerCase().includes(s) || p.designation.toLowerCase().includes(s) || p.empId.toLowerCase().includes(s)); }
  members.sort((a, b) => {
    if (sort === 'final') return (I.finalPctWithAdhoc(b) ?? -1) - (I.finalPctWithAdhoc(a) ?? -1);
    if (sort === 'achievement') return (I.cur(b).achievementPct ?? -1) - (I.cur(a).achievementPct ?? -1);
    if (sort === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  // Leaderboard medals: top 3 by the active ranking metric (payout / achievement).
  // Computed over the full team so search/sort never changes who is a top performer.
  const rankVal = (p) => {
    if (p.logic === 'kae' || p.logic === 'revival') return I.cur(p).amount ?? -Infinity;
    if (sort === 'achievement') return I.cur(p).achievementPct ?? -Infinity;
    return I.finalPctWithAdhoc(p) ?? -Infinity;
  };
  const rankMap = {};
  memberList.slice()
    .filter((p) => rankVal(p) > -Infinity)
    .sort((a, b) => rankVal(b) - rankVal(a))
    .slice(0, 3)
    .forEach((p, i) => { rankMap[p.email] = i + 1; });

  const baseName = `${team.short.replace(/[^a-z0-9]/gi, '-')}-incentives-${I.PERIOD.replace(' ', '-')}`;

  return (
    <div ref={captureRef} style={{ animation: 'fadeUp 360ms ease both' }}>
      {onBack ? <button data-export-hide="true" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sd-fg-2)', font: '600 13px/1 var(--sd-font-sans)', padding: 0, marginBottom: 16 }}><Icon name="arrow-left" size={15} /> {backLabel}</button> : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ width: 52, height: 52, borderRadius: 14, background: team.tint, color: team.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={team.icon} size={26} /></span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ font: '700 26px/1.1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{team.name}</h2>
          <div style={{ font: '400 14px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 4 }}>{summary.count} members · {I.PERIOD} pay period</div>
        </div>
        <div data-export-hide="true" style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" icon="download-simple" onClick={() => exportCSV(memberList, `${baseName}.csv`)}>CSV</Button>
          <Button variant="dark" icon="chart-bar" onClick={() => exportPNG(captureRef.current, `${baseName}.png`)}>PNG</Button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}><TeamStatBar summary={summary} /></div>

      <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', flexWrap: 'wrap' }}>
          <div style={{ font: '700 15px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', flex: 1 }}>Members</div>
          <div data-export-hide="true" style={{ width: 220 }}><TextInput icon="magnifying-glass" placeholder="Search name or role…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div data-export-hide="true" style={{ display: 'flex', gap: 6 }}>
            {[['final', 'Final %'], ['achievement', 'Achievement'], ['name', 'Name']].map(([k, l]) => (
              <button key={k} onClick={() => setSort(k)} style={{ background: sort === k ? 'var(--sd-accent-1)' : 'transparent', color: sort === k ? 'var(--sd-primary)' : 'var(--sd-fg-2)', border: `1px solid ${sort === k ? 'var(--sd-accent-2)' : 'var(--sd-lowlight-1)'}`, borderRadius: 999, padding: '6px 12px', font: '600 12px/1 var(--sd-font-sans)', cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
        </div>
        <RosterHeader />
        <div>
          {members.map((p, i) => <RosterRow key={p.email} person={p} index={i} rank={rankMap[p.email]} onOpen={onOpenPerson} />)}
          {members.length === 0 ? <div style={{ padding: 32, textAlign: 'center', font: '400 14px var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>No members match “{q}”.</div> : null}
        </div>
      </Card>
    </div>
  );
};

/* ---- Admin view (Data health + PIP tabs) --------------------------- */
const AdminView = ({ viewer, onOpenPerson, onBack, initialTab = 'health' }) => {
  const I = window.INCENTIVE;
  const [tab, setTab] = React.useState(initialTab);
  const flagged = I.flaggedPeople();
  const missing = flagged.filter((p) => I.cur(p).dataHealth === 'missing');
  const attention = flagged.filter((p) => I.cur(p).dataHealth === 'attention');
  const pip = I.pipPeople();
  const pipCore = pip.filter((p) => p.team === 'core');
  const pipHyper = pip.filter((p) => p.team === 'hypercare');
  const avgFinal = I.avgFinalPct(I.people);
  const computable = I.people.filter((p) => I.cur(p).finalPct != null);
  const readiness = Math.round((computable.length / I.people.length) * 100);

  const HealthGroup = ({ title, list, tone, icon, desc }) => (
    <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: '1px solid var(--sd-stroke)' }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: tone === 'danger' ? 'var(--sd-red-50)' : 'var(--sd-yellow-50)', color: tone === 'danger' ? 'var(--sd-red-500)' : 'var(--sd-yellow-700)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={20} /></span>
        <div style={{ flex: 1 }}><div style={{ font: '700 15px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{title}</div><div style={{ font: '400 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 2 }}>{desc}</div></div>
        <span className="sd-num" style={{ font: '700 18px/1 var(--sd-font-sans)', color: tone === 'danger' ? 'var(--sd-red-500)' : 'var(--sd-yellow-700)' }}>{list.length}</span>
      </div>
      <div>
        {list.map((p, i) => (
          <div key={p.email} onClick={() => onOpenPerson(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderTop: i ? '1px solid var(--sd-stroke)' : 'none', animation: 'fadeUp 360ms ease both', animationDelay: `${Math.min(i * 28, 300)}ms` }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sd-bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <Avatar name={p.name} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 13px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{p.name} <span style={{ font: '400 12px var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>· {I.TEAMS[p.team].short}</span></div>
              <div style={{ font: '400 12px/1.3 var(--sd-font-sans)', color: tone === 'danger' ? 'var(--sd-red-700)' : 'var(--sd-yellow-900)', marginTop: 2 }}>{I.cur(p).missingFields.length ? I.cur(p).missingFields.join(' · ') : `Achievement ${I.cur(p).achievementPct == null ? '—' : I.cur(p).achievementPct.toFixed(0) + '%'} — below threshold`}</div>
            </div>
            <Icon name="caret-right" size={15} style={{ color: 'var(--sd-lowlight-2)' }} />
          </div>
        ))}
        {list.length === 0 ? <div style={{ padding: 24, textAlign: 'center', font: '400 13px var(--sd-font-sans)', color: 'var(--sd-green-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="check-circle" size={14} /> All clear</div> : null}
      </div>
    </Card>
  );

  const PipGroup = ({ title, list, threshold, role }) => (
    <Card padding={0} variant="regular" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: '1px solid var(--sd-stroke)' }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sd-red-500)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="flag" size={18} /></span>
        <div style={{ flex: 1 }}><div style={{ font: '700 15px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{title}</div><div style={{ font: '400 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 2 }}>Prior 2 months&rsquo; achievement &lt; {threshold}% &middot; 3-week counts as 1</div></div>
        <span className="sd-num" style={{ font: '700 18px/1 var(--sd-font-sans)', color: 'var(--sd-red-500)' }}>{list.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.4fr', gap: 10, padding: '9px 16px', background: 'var(--sd-bg-app)', font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sd-fg-2)' }}>
        <span>{role}</span><span>Σ HITs</span><span>Σ Target</span><span>Ratio</span><span></span>
      </div>
      <div>
        {list.map((p, i) => (
          <div key={p.email} onClick={() => onOpenPerson(p)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.4fr', gap: 10, alignItems: 'center', padding: '11px 16px', cursor: 'pointer', borderTop: '1px solid var(--sd-stroke)', animation: 'fadeUp 360ms ease both', animationDelay: `${Math.min(i * 28, 300)}ms` }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sd-bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}><Avatar name={p.name} size={32} /><div style={{ minWidth: 0 }}><div style={{ font: '600 13px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div><div style={{ font: '400 11px var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{I.TEAMS[p.team].short}</div></div></div>
            <span className="sd-num" style={{ font: '600 13px var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{p.pip.sumAch}</span>
            <span className="sd-num" style={{ font: '600 13px var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>{p.pip.sumTgt}</span>
            <span className="sd-num" style={{ font: '700 13px var(--sd-font-sans)', color: 'var(--sd-red-500)' }}>{p.pip.ratio == null ? '—' : p.pip.ratio.toFixed(0) + '%'}</span>
            <Icon name="caret-right" size={15} style={{ color: 'var(--sd-lowlight-2)' }} />
          </div>
        ))}
        {list.length === 0 ? <div style={{ padding: 24, textAlign: 'center', font: '400 13px var(--sd-font-sans)', color: 'var(--sd-green-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="check-circle" size={14} /> No {role} on PIP</div> : null}
      </div>
    </Card>
  );

  const Tab = ({ id, label, icon, count }) => (
    <button onClick={() => setTab(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${tab === id ? 'transparent' : 'var(--sd-lowlight-1)'}`, background: tab === id ? 'var(--sd-heading)' : 'var(--sd-white)', color: tab === id ? '#fff' : 'var(--sd-fg-2)', font: '600 13px/1 var(--sd-font-sans)' }}>
      <Icon name={icon} size={15} />{label}{count != null ? <span style={{ background: tab === id ? 'rgba(255,255,255,0.2)' : 'var(--sd-lowlight-1)', color: tab === id ? '#fff' : 'var(--sd-fg-2)', borderRadius: 999, padding: '1px 7px', font: '700 11px var(--sd-font-sans)' }}>{count}</span> : null}
    </button>
  );

  return (
    <div style={{ animation: 'fadeUp 360ms ease both' }}>
      {onBack ? <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sd-fg-2)', font: '600 13px/1 var(--sd-font-sans)', padding: 0, marginBottom: 16 }}><Icon name="arrow-left" size={15} /> All teams</button> : null}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ font: '600 11px/1 var(--sd-font-sans)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sd-primary)', marginBottom: 7 }}>Admin view</div>
          <h2 style={{ font: '700 26px/1.1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>Month-end control room</h2>
          <div style={{ font: '400 14px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 6 }}>Resolve flags and PIP cases before exporting the {I.PERIOD} file to HR.</div>
        </div>
        <Button variant="dark" icon="download-simple" onClick={() => exportCSV(I.people, `ALL-incentives-${I.PERIOD.replace(' ', '-')}.csv`)}>Export full file</Button>
      </div>

      <Card variant="regular" padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div><div style={{ font: '700 16px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>Payroll readiness</div><div style={{ font: '400 13px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 3 }}>{computable.length} of {I.people.length} computable · {missing.length} blocked · {attention.length} to review · {pip.length} on PIP</div></div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}><span className="sd-num" style={{ font: '700 30px/1 var(--sd-font-sans)', color: readiness >= 90 ? 'var(--sd-green-700)' : readiness >= 75 ? 'var(--sd-yellow-700)' : 'var(--sd-red-500)' }}>{readiness}%</span><span style={{ font: '500 13px var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>ready</span></div>
        </div>
        <ProgressBar pct={readiness} color={readiness >= 90 ? 'var(--sd-green-700)' : readiness >= 75 ? 'var(--sd-yellow-700)' : 'var(--sd-red-500)'} height={10} />
        <div style={{ display: 'flex', gap: 28, marginTop: 16, flexWrap: 'wrap' }}>
          {[['Avg final %', I.pct(avgFinal, 1)], ['Headcount', I.people.length], ['PIP cases', pip.length]].map(([l, v]) => (
            <div key={l}><div style={{ font: '600 11px/1 var(--sd-font-sans)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--sd-fg-2)' }}>{l}</div><div className="sd-num" style={{ font: '700 22px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)', marginTop: 4 }}>{v}</div></div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <Tab id="health" label="Data health" icon="warning" count={flagged.length} />
        <Tab id="pip" label="PIP flags" icon="flag" count={pip.length} />
      </div>

      {tab === 'health' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <HealthGroup title="Blocked — data missing" list={missing} tone="danger" icon="warning-octagon" desc="Cannot compute until resolved" />
          <HealthGroup title="Needs review" list={attention} tone="warning" icon="warning" desc="Computable, but off-track / provisional" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <PipGroup title="Core GCs eligible for PIP" list={pipCore} threshold={50} role="Core GC" />
          <PipGroup title="Hypercare GCs eligible for PIP" list={pipHyper} threshold={50} role="Hypercare GC" />
        </div>
      )}
    </div>
  );
};

Object.assign(window, { RosterRow, RosterHeader, TeamStatBar, TeamView, AdminView });
