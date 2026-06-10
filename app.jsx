/* =====================================================================
   Incentive Automation — Home + App root (role-aware routing)
   ===================================================================== */
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

/* ---- Own incentive hero -------------------------------------------- */
const OwnIncentiveCard = ({ user, onOpen }) => {
  const I = window.INCENTIVE;
  const m = I.cur(user);
  const isGM = user.role !== 'gc';
  const finalPct = I.finalPctWithAdhoc(user);
  const gm = m.gm;
  const stats = isGM
    ? [['Team HITs', (gm ? gm.weightedHits : 0).toFixed(1)], ['Achievement', gm && gm.achievementPct != null ? gm.achievementPct.toFixed(0) + '%' : '—'], ['GCs', gm ? gm.teamSize : 0]]
    : (user.logic === 'hypercare'
      ? [['HITs', m.weightedHits], ['Achievement', m.achievementPct == null ? '—' : m.achievementPct.toFixed(0) + '%'], ['Output %', I.pct(m.outputPct, 1)]]
      : [['Weighted HITs', m.weightedHits.toFixed(1)], ['Achievement', m.achievementPct == null ? '—' : m.achievementPct.toFixed(0) + '%'], ['Multiplier', '×' + m.multiplier.toFixed(2)]]);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', color: '#fff', borderRadius: 'var(--sd-radius-xl)', background: 'linear-gradient(110deg, #34499f 0%, #4764cd 60%, #5694f2 100%)', boxShadow: 'var(--sd-shadow-primary)', padding: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.6, background: 'radial-gradient(420px 220px at 92% -20%, rgba(255,255,255,0.22), transparent)' }}></div>
      <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
        <div style={{ font: '600 11px/1 var(--sd-font-sans)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>Your incentive · {I.PERIOD}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
          {isGM ? <div style={{ font: '700 32px/1 var(--sd-font-sans)' }}>Team rollup</div>
            : <div style={{ font: '700 44px/1 var(--sd-font-sans)' }}>{m.finalPct != null ? <CountUp value={finalPct} format={(v) => I.pct(v, 2)} /> : 'Pending'}</div>}
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
          {stats.map(([l, v]) => <div key={l}><div className="sd-num" style={{ font: '700 18px/1 var(--sd-font-sans)' }}>{v}</div><div style={{ font: '400 12px/1.3 var(--sd-font-sans)', opacity: 0.8, marginTop: 4 }}>{l}</div></div>)}
        </div>
      </div>
      <button onClick={onOpen} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: 'var(--sd-primary)', border: 'none', borderRadius: 'var(--sd-radius-md)', padding: '12px 18px', font: '600 14px/1 var(--sd-font-sans)', cursor: 'pointer' }}>See the full maths <Icon name="arrow-right" size={16} /></button>
    </div>
  );
};

/* ---- Home ----------------------------------------------------------- */
const Home = ({ user, onOpenTeam, onOpenAdmin, onOpenPerson }) => {
  const I = window.INCENTIVE;

  if (user.role === 'manager') {
    const team = I.descendants(user);
    const meta = { name: 'Your Team', short: 'My-Team', icon: 'users-three', accent: 'var(--sd-primary)', tint: 'var(--sd-accent-1)' };
    return (
      <div>
        <h2 style={{ font: '700 26px/1.1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{greeting()}, {user.name.split(' ')[0]}</h2>
        <p style={{ font: '400 14px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 6 }}>Your incentive and your team's live standing for {I.PERIOD}.</p>
        <div style={{ margin: '20px 0' }}><OwnIncentiveCard user={user} onOpen={() => onOpenPerson(user)} /></div>
        {team.length > 0 ? <TeamView meta={meta} members={team} viewer={user} onOpenPerson={onOpenPerson} onBack={null} />
          : <Card variant="regular" padding={32} style={{ textAlign: 'center' }}><p style={{ color: 'var(--sd-fg-3)' }}>No direct reports mapped to you yet.</p></Card>}
      </div>
    );
  }

  const summaries = I.allTeamSummaries();
  const avgFinal = I.avgFinalPct(I.people);
  const flaggedTotal = I.flaggedPeople().length;
  const pipTotal = I.pipPeople().length;
  const totalHits = I.people.reduce((s, p) => s + I.cur(p).weightedHits, 0);
  const kpis = [
    { label: 'Avg final incentive', value: I.pct(avgFinal, 1), icon: 'percent', accent: 'var(--sd-green-700)', sub: `${I.people.length} members` },
    { label: 'HITs delivered', value: totalHits.toFixed(0), icon: 'target', accent: 'var(--sd-primary)', sub: 'weighted, this month' },
    { label: 'Needs review', value: flaggedTotal, icon: 'warning', accent: 'var(--sd-yellow-700)', sub: 'data flags' },
    { label: 'PIP flags', value: pipTotal, icon: 'flag', accent: pipTotal ? 'var(--sd-red-500)' : 'var(--sd-fg-3)', sub: 'GCs + GMs' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div><h2 style={{ font: '700 26px/1.1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{greeting()}</h2><p style={{ font: '400 14px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 6 }}>Live incentive tracking across all HITS teams · {I.PERIOD} pay period.</p></div>
        <div style={{ display: 'flex', gap: 10 }}><Button variant="dark" icon="download-simple" onClick={() => exportCSV(I.people, `ALL-incentives-${I.PERIOD.replace(' ', '-')}.csv`)}>Export all</Button></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>{kpis.map((k) => <MetricTile key={k.label} {...k} />)}</div>
      <SectionTitle eyebrow="Teams" title="Incentive by team" right={<span style={{ font: '400 13px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>Tap any card to drill in</span>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
        {summaries.map((s, i) => <TeamCard key={s.key} summary={s} index={i} onOpen={onOpenTeam} />)}
        <AdminCard index={summaries.length} onOpen={() => onOpenAdmin('health')} flaggedCount={flaggedTotal} pipCount={pipTotal} />
      </div>
    </div>
  );
};

/* ---- Google sign-in → live Sheets fetch (no backend) --------------- */
const EmailLogin = ({ onLogin }) => {
  const I = window.INCENTIVE;
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [err, setErr] = React.useState('');
  const signIn = async () => {
    setErr(''); setBusy(true); setStatus('Opening Google sign-in…');
    try {
      const who = await I.signInAndLoad((m) => setStatus(m));
      onLogin(who);
    } catch (e) {
      setBusy(false); setStatus('');
      const msg = String(e && e.message || e);
      if (/popup|denied|closed|interaction|oauth_error/i.test(msg)) setErr('Sign-in was cancelled. Please try again.');
      else if (/403|PERMISSION|forbidden/i.test(msg)) setErr('Signed in, but this account can’t read one of the sheets. Ask for view access, then retry.');
      else setErr('Could not load data: ' + msg);
    }
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sd-bg-app)', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(71,100,205,0.10), transparent 70%)' }}></div>
        <div style={{ position: 'absolute', bottom: '-12%', left: '-6%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,177,204,0.08), transparent 70%)' }}></div>
      </div>
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--sd-white)', border: '1px solid var(--sd-border)', borderRadius: 'var(--sd-radius-xl)', boxShadow: 'var(--sd-shadow-elevated)', padding: 32, animation: 'fadeUp 360ms ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <img src="assets/shopdeck-mark.svg" alt="" style={{ width: 34, height: 34 }} />
          <div><div style={{ font: '700 18px/1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>Incentives</div><div style={{ font: '400 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 3 }}>Live incentive tracking</div></div>
        </div>
        <h2 style={{ font: '700 22px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>Sign in</h2>
        <p style={{ font: '400 13px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-3)', margin: '6px 0 20px' }}>Sign in with your company Google account. Your data is read live from the sheets you already have access to.</p>
        <button onClick={signIn} disabled={busy} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--sd-white)', border: '1px solid var(--sd-border)', borderRadius: 'var(--sd-radius-md)', padding: '12px 16px', font: '600 14px/1 var(--sd-font-sans)', color: 'var(--sd-heading)', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, boxShadow: 'var(--sd-shadow-soft)' }}>
          <GoogleG size={18} />{busy ? 'Working…' : 'Continue with Google'}
        </button>
        {busy && status ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, font: '500 12px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}><span className="sd-spin" style={{ width: 13, height: 13, border: '2px solid var(--sd-accent-2)', borderTopColor: 'var(--sd-primary)', borderRadius: '50%', display: 'inline-block' }}></span>{status}</div> : null}
        {err ? <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 'var(--sd-radius-md)', background: 'var(--sd-red-50)', color: 'var(--sd-red-900)', font: '500 12px/1.5 var(--sd-font-sans)' }}>{err}</div> : null}
        <p style={{ font: '400 11px/1.4 var(--sd-font-sans)', color: 'var(--sd-lowlight-2)', marginTop: 16, textAlign: 'center' }}>Company Google account required · read-only access to incentive sheets.</p>
      </div>
    </div>
  );
};

/* ---- App root ------------------------------------------------------- */
const App = () => {
  const I = window.INCENTIVE;
  // Viewer identity from Google sign-in (who = { email, name, picture }).
  const makeViewer = (who) => ({ name: (who && who.name) || 'HITS Team', email: (who && who.email) || 'portal', picture: who && who.picture, role: 'admin', team: 'core', logic: 'core', designation: 'All teams', empId: '—', portal: true, pip: { flagged: false, ratio: null }, reports: [] });
  const [user, setUser] = React.useState(null);
  const [route, setRoute] = React.useState({ name: 'home' });
  const [activeKey, setActiveKey] = React.useState(I.CURKEY);
  const [sourcesOpen, setSourcesOpen] = React.useState(false);
  const [, setVersion] = React.useState(0);
  const bump = () => setVersion((v) => v + 1);

  React.useEffect(() => { const b = document.getElementById('boot'); if (b) { b.style.opacity = '0'; setTimeout(() => b.remove(), 320); } }, []);

  const changePeriod = (key) => { I.setPeriod(key); setActiveKey(key); window.scrollTo(0, 0); bump(); };
  const go = (r) => { setRoute(r); window.scrollTo(0, 0); };
  const login = (who) => { setActiveKey(I.CURKEY); setUser(makeViewer(who)); setRoute({ name: 'home' }); window.scrollTo(0, 0); };
  const logout = () => { setUser(null); setRoute({ name: 'home' }); };

  if (!user) return <EmailLogin onLogin={login} />;

  const home = () => go({ name: 'home' });
  const openTeam = (key) => go({ name: 'team', teamKey: key });
  const openPerson = (p, from) => go({ name: 'person', person: p, from });
  const openAdmin = (tab) => go({ name: 'admin', tab: tab || 'health' });

  let body;
  if (route.name === 'home') body = <Home user={user} onOpenTeam={openTeam} onOpenAdmin={openAdmin} onOpenPerson={(p) => openPerson(p)} />;
  else if (route.name === 'team') { const s = I.teamSummary(route.teamKey); body = <TeamView meta={I.TEAMS[route.teamKey]} members={s.members} viewer={user} onBack={home} onOpenPerson={(p) => openPerson(p, { name: 'team', teamKey: route.teamKey })} backLabel="All teams" />; }
  else if (route.name === 'admin') body = <AdminView viewer={user} initialTab={route.tab} onOpenPerson={(p) => openPerson(p, { name: 'admin', tab: route.tab })} onBack={home} />;
  else if (route.name === 'person') {
    const back = route.root ? null : (route.from ? () => go(route.from) : home);
    body = <PersonView person={route.person} viewer={user} onBack={back} onChange={bump} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sd-bg-app)' }}>
      <AppHeader user={user} onHome={home} onLogout={logout}
        activeKey={activeKey} onPeriodChange={changePeriod} onOpenSources={() => setSourcesOpen(true)} />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px 64px' }}>{body}</main>
      <Modal open={sourcesOpen} onClose={() => setSourcesOpen(false)} title="Data sources" subtitle="Connection status of the 9 source sheets" icon="chart-bar" width={580}>
        <DataSourcesPanel />
      </Modal>
      <DrillHost />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
