/* =====================================================================
   Incentive Automation — Login (Google sign-in), AppHeader, TeamCard
   ===================================================================== */
const GOOGLE_CLIENT_ID = '334591605851-5e15787uo5lu6raii82a10n1u2le3jms.apps.googleusercontent.com';

/* ---- Google "G" logo ------------------------------------------------ */
const GoogleG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block' }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/* ---- decode a Google credential (JWT) ------------------------------- */
function decodeJwt(token) {
  try {
    const base = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (e) { return null; }
}

/* ---- Login ---------------------------------------------------------- */
const Login = ({ onLogin }) => {
  const I = window.INCENTIVE;
  const [email, setEmail] = React.useState('');
  const [err, setErr] = React.useState('');
  const [gReady, setGReady] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const btnRef = React.useRef(null);

  const tryLogin = (addr) => {
    const p = I.byEmail[(addr || '').trim().toLowerCase()];
    if (!p) { setErr('No incentive record found for ' + addr + '. Try a demo login below.'); return false; }
    onLogin(p); return true;
  };

  React.useEffect(() => {
    let cancelled = false;
    const init = () => {
      if (cancelled || !window.google || !window.google.accounts) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => {
            const payload = decodeJwt(resp.credential);
            const addr = payload && payload.email;
            if (I.backendUrl) {
              // Live: backend verifies the token and returns role-filtered data.
              setErr(''); setBusy(true);
              I.connectBackend(resp.credential).then((res) => {
                setBusy(false);
                if (res.ok && res.viewer) onLogin(res.viewer);
                else if (res.reason === 'no_record') setErr('Signed in as ' + addr + ', but no incentive record is mapped to it.');
                else setErr('Backend error: ' + (res.reason || 'unknown') + '. Check the /exec URL, deployment access, and column config.');
              });
            } else if (addr) {
              if (!tryLogin(addr)) setErr('Signed in as ' + addr + ', but no incentive record is mapped to it.');
            } else setErr('Could not read Google account email.');
          },
        });
        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, { theme: 'outline', size: 'large', width: 332, text: 'continue_with', shape: 'rectangular' });
        }
        window.google.accounts.id.prompt();
        setGReady(true);
      } catch (e) { setGReady(false); }
    };
    const existing = document.getElementById('gsi-script');
    if (existing) { init(); }
    else {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true; s.id = 'gsi-script';
      s.onload = init; s.onerror = () => setGReady(false);
      document.head.appendChild(s);
    }
    return () => { cancelled = true; };
  }, []);

  const personas = [
    { p: I.DEMO.admin, role: 'Admin', icon: 'shield-check', desc: 'All teams · data health · PIP' },
    { p: I.DEMO.manager, role: 'Manager (GM)', icon: 'users-three', desc: 'Own + team incentives' },
    { p: I.DEMO.gc, role: 'Core GC', icon: 'user', desc: 'Personal payout + maths' },
    { p: I.DEMO.hypercare, role: 'Hypercare GC', icon: 'first-aid-kit', desc: 'Progressive HIT logic' },
  ].filter((d) => d.p);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.05fr 1fr', background: 'var(--sd-bg-app)' }}>
      <div style={{ position: 'relative', overflow: 'hidden', color: '#fff', background: 'linear-gradient(135deg, #34499f 0%, #4764cd 55%, #5694f2 100%)', padding: 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, background: 'radial-gradient(600px 300px at 80% 10%, rgba(255,255,255,0.18), transparent), radial-gradient(500px 400px at 10% 90%, rgba(255,255,255,0.12), transparent)' }}></div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="shopdeck-mark.svg" alt="" style={{ width: 34, height: 34, filter: 'brightness(0) invert(1)' }} />
          <div style={{ font: '700 20px/1 var(--sd-font-sans)', letterSpacing: -0.3 }}>Shopdeck</div>
          <span style={{ marginLeft: 4, background: 'rgba(255,255,255,0.18)', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, padding: '4px 9px', borderRadius: 6 }}>INCENTIVES</span>
        </div>
        <div style={{ position: 'relative', maxWidth: 460 }}>
          <div style={{ font: '600 13px/1 var(--sd-font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 18 }}>Live incentive tracking · HITS</div>
          <h1 style={{ font: '700 44px/1.08 var(--sd-font-sans)', letterSpacing: '-0.01em', color: '#fff' }}>Every rupee of your payout, fully <span style={{ fontStyle: 'italic', opacity: 0.92 }}>transparent.</span></h1>
          <p style={{ font: '400 16px/1.6 var(--sd-font-sans)', color: 'rgba(255,255,255,0.85)', marginTop: 18 }}>Real-time incentives for every HITS team member — HIT-by-HIT maths, input multipliers, PIP tracking, ad-hoc bonuses, and one-click month-end export to HR.</p>
          <div style={{ display: 'flex', gap: 28, marginTop: 32 }}>
            {[['8', 'Teams tracked'], [String(I.people.length), 'Members live'], ['100%', 'Calc transparency']].map(([n, l]) => (
              <div key={l}><div className="sd-num" style={{ font: '700 30px/1 var(--sd-font-sans)' }}>{n}</div><div style={{ font: '400 13px/1.3 var(--sd-font-sans)', color: 'rgba(255,255,255,0.78)', marginTop: 6 }}>{l}</div></div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', font: '400 13px/1.4 var(--sd-font-sans)', color: 'rgba(255,255,255,0.7)' }}>{I.PERIOD} pay period · {I.backendUrl ? 'live data' : 'sample data'}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 340, animation: 'fadeUp 480ms ease both' }}>
          <h2 style={{ font: '700 28px/1.15 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>Sign in</h2>
          <p style={{ font: '400 14px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 8 }}>{I.backendUrl ? "Sign in with your company Google account to load your live data. You'll only see what your role allows." : 'Use your company Google account.'}</p>

          {/* Connection status banner */}
          {I.backendUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 12px', borderRadius: 'var(--sd-radius-md)', background: 'var(--sd-green-50)', color: 'var(--sd-green-900)', font: '600 12px/1.3 var(--sd-font-sans)' }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--sd-green-700)' }}></span>Live backend connected — sign in to fetch from your sheets.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, padding: '12px', borderRadius: 'var(--sd-radius-md)', background: 'var(--sd-yellow-50)', color: 'var(--sd-yellow-900)', font: '500 12px/1.5 var(--sd-font-sans)' }}>
              <Icon name="info" size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--sd-yellow-700)' }} />
              <span><b>Live data not connected.</b> Deploy the Apps Script backend and set <span style={{ font: '600 11px var(--sd-font-mono)' }}>INCENTIVE_BACKEND_URL</span> in <span style={{ font: '600 11px var(--sd-font-mono)' }}>index.html</span> (see backend/SETUP.md). Until then this is sample data.</span>
            </div>
          )}

          {/* Google sign-in */}
          <div style={{ marginTop: 18 }}>
            <div ref={btnRef} style={{ minHeight: gReady ? 44 : 0, display: 'flex', justifyContent: 'center' }}></div>
            {!gReady ? (
              <button onClick={() => { if (window.google) window.google.accounts.id.prompt(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--sd-white)', border: '1px solid var(--sd-lowlight-1)', borderRadius: 'var(--sd-radius-md)', padding: '12px 16px', font: '600 14px/1 var(--sd-font-sans)', color: 'var(--sd-fg-1)', cursor: 'pointer' }}>
                <GoogleG /> Continue with Google
              </button>
            ) : null}
          </div>

          {busy ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, font: '600 13px/1 var(--sd-font-sans)', color: 'var(--sd-primary)' }}><span className="dot" style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--sd-primary)', animation: 'pulse 1s infinite' }}></span>Fetching your data from the sheets…</div> : null}
          {err ? <div style={{ font: '500 12px/1.4 var(--sd-font-sans)', color: 'var(--sd-red-700)', display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 14 }}><Icon name="warning-circle" size={14} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div> : null}

          {/* Sample preview (only when no live backend is configured) */}
          {!I.backendUrl ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--sd-lowlight-1)' }}></div>
                <span style={{ font: '600 11px/1 var(--sd-font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sd-fg-3)' }}>or preview (sample)</span>
                <div style={{ flex: 1, height: 1, background: 'var(--sd-lowlight-1)' }}></div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); tryLogin(email); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <TextInput icon="envelope-simple" type="email" placeholder="name@blitzscale.co" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} />
                <Button type="submit" variant="outline" size="lg" iconRight="arrow-right" style={{ width: '100%' }}>Preview with sample data</Button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* ---- App header (period switch · data sources · PIP badge) --------- */
const AppHeader = ({ user, onHome, onLogout, activeKey, onPeriodChange, onOpenSources }) => {
  const I = window.INCENTIVE;
  const roleLabel = user.portal ? 'All teams' : { admin: 'Admin', manager: 'Manager (GM)', gc: user.logic === 'hypercare' ? 'Hypercare GC' : 'Core GC' }[user.role];
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, height: 60, background: 'rgba(255,255,255,0.9)', backdropFilter: 'saturate(140%) blur(8px)', borderBottom: '1px solid var(--sd-border)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px' }}>
      <button onClick={onHome || undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: onHome ? 'pointer' : 'default', padding: 0 }}>
        <img src="shopdeck-mark.svg" alt="" style={{ width: 26, height: 26 }} />
        <span style={{ font: '700 16px/1 var(--sd-font-sans)', letterSpacing: -0.2, color: 'var(--sd-heading)' }}>Incentives</span>
        {(() => {
          const f = I.SNAP_FRESH;                       // undefined for sample data
          const base = { fontSize: 10, fontWeight: 700, letterSpacing: 0.4, padding: '3px 7px', borderRadius: 5 };
          if (!f || !f.stale) return <span style={{ ...base, background: 'var(--sd-accent-1)', color: 'var(--sd-primary)' }}>LIVE</span>;
          const label = f.hours == null ? 'NO DATA'
            : f.hours >= 48 ? Math.floor(f.hours / 24) + 'd OLD' : f.hours + 'h OLD';
          const tip = f.oldest
            ? 'Snapshots last refreshed ' + new Date(f.oldest).toLocaleString() + '. The daily Metabase refresh may have failed — figures below are not current.'
            : 'Metabase snapshots did not load. Figures below are not current.';
          return <span title={tip} style={{ ...base, background: 'var(--sd-red-500)', color: '#fff' }}>{label}</span>;
        })()}
      </button>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {user.pip && user.pip.flagged ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: '700 12px/1 var(--sd-font-sans)', color: '#fff', background: 'var(--sd-red-500)', padding: '7px 12px', borderRadius: 999, boxShadow: '0 2px 8px rgba(244,67,54,0.35)' }}>
            <Icon name="flag" size={13} />PIP flagged
          </span>
        ) : null}
        <button onClick={onOpenSources} title="Data sources" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, font: '600 12px/1 var(--sd-font-sans)', color: 'var(--sd-primary)', background: 'var(--sd-accent-1)', border: '1px solid var(--sd-accent-2)', padding: '7px 12px', borderRadius: 999, cursor: 'pointer' }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--sd-primary)' }}></span>
          Data sources
        </button>
        <PeriodPicker activeKey={activeKey} onChange={onPeriodChange} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 999, background: 'var(--sd-accent-1)', color: 'var(--sd-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="buildings" size={18} /></span>
          <div style={{ lineHeight: 1.2 }}><div style={{ font: '600 13px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{user.name}</div><div style={{ font: '400 11px/1.2 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{roleLabel}</div></div>
        </div>
        {onLogout ? <button onClick={onLogout} title="Sign out" style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--sd-border)', borderRadius: 'var(--sd-radius-md)', cursor: 'pointer', color: 'var(--sd-fg-2)' }}><Icon name="sign-out" size={17} /></button> : null}
      </div>
    </header>
  );
};

/* ---- Unresolved sheet names ----------------------------------------
   Every sheet lookup is by NAME, and a name that fails to match a roster person
   silently drops the row: a missing HIT target reads as "Data missing", missing
   handover rows read as 0 HITs. That is how "Yash Sureshbhai" in the target sheet
   never reached "Desai Yash Sureshbhai" in the roster. This surfaces the misses so
   they are fixed in the sheet rather than rediscovered one person at a time. */
const NameAudit = () => {
  const I = window.INCENTIVE;
  const a = I.NAME_AUDIT;
  if (!a) return null;
  const un = Object.values(a.unresolved || {}).sort((x, y) => y.total - x.total);
  const am = Object.values(a.ambiguous || {}).sort((x, y) => y.total - x.total);
  const rk = Object.values(a.riskyPicks || {}).sort((x, y) => y.total - x.total);
  if (!un.length && !am.length && !rk.length) return null;
  const Row = ({ e, amb }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 0', borderTop: '1px solid var(--sd-stroke)' }}>
      <span style={{ font: '600 12px/1.4 var(--sd-font-mono)', color: 'var(--sd-heading)', minWidth: 170 }}>{e.name}</span>
      <span style={{ font: '400 11px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-3)', flex: 1 }}>
        {Object.keys(e.sources).map((k) => `${k} (${e.sources[k]})`).join(' · ') || '—'}
        {amb && e.candidates ? ` — could be: ${e.candidates.join(', ')}` : ''}
      </span>
    </div>
  );
  return (
    <div style={{ padding: 14, borderRadius: 'var(--sd-radius-md)', border: '1px solid var(--sd-red-500)', background: 'rgba(244,67,54,0.06)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name="flag" size={15} style={{ color: 'var(--sd-red-500)' }} />
        <span style={{ font: '700 13px/1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>
          {un.length + am.length} sheet name{un.length + am.length === 1 ? '' : 's'} did not match anyone in the roster{rk.length ? `, ${rk.length} matched ambiguously` : ''}
        </span>
      </div>
      <div style={{ font: '400 12px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-2)', marginBottom: 8 }}>
        Rows using these names are being dropped. Fix by making the sheet spelling match the People sheet exactly.
      </div>
      {un.map((e) => <Row key={e.name} e={e} />)}
      {am.length ? <div style={{ font: '700 11px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>Ambiguous — matched more than one person, so refused</div> : null}
      {am.map((e) => <Row key={e.name} e={e} amb />)}
      {rk.length ? (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '2px solid var(--sd-stroke)' }}>
          <div style={{ font: '700 11px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-3)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
            Matched, but more than one person fit — verify these
          </div>
          <div style={{ font: '400 12px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-2)', marginBottom: 4 }}>
            These resolved to a single person only because the matcher keeps the last candidate. The credit may be on the wrong person.
          </div>
          {rk.map((e) => (
            <div key={e.name} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 0', borderTop: '1px solid var(--sd-stroke)' }}>
              <span style={{ font: '600 12px/1.4 var(--sd-font-mono)', color: 'var(--sd-heading)', minWidth: 170 }}>{e.name}</span>
              <span style={{ font: '400 11px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-3)', flex: 1 }}>
                credited to <b>{e.picked}</b> · also fits: {(e.candidates || []).filter((c) => c !== e.picked).join(', ')}
                {' · '}{Object.keys(e.sources).map((k) => `${k} (${e.sources[k]})`).join(' · ')}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/* ---- Data sources panel (fetch status) ----------------------------- */
const DataSourcesPanel = () => {
  const I = window.INCENTIVE;
  const live = I.DATA_LIVE;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 'var(--sd-radius-md)', background: 'var(--sd-accent-1)', marginBottom: 16 }}>
        <Icon name="info" size={18} style={{ color: 'var(--sd-primary)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ font: '500 13px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-1)' }}>
          This is a <b>self-contained build</b> — no backend / Apps Script. All incentive logic runs in the browser on data bundled with the site. To load real figures, paste each sheet’s rows into <span style={{ font: '500 11px var(--sd-font-mono)' }}>data.js</span>. The sheets below are the source definitions the logic mirrors.
        </div>
      </div>
      <NameAudit />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {I.DATA_SOURCES.map((s) => (
          <div key={s.fileId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--sd-stroke)', borderRadius: 'var(--sd-radius-md)' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--sd-accent-1)', color: 'var(--sd-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="chart-bar" size={16} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 13px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{s.name} <span style={{ font: '400 12px var(--sd-font-mono)', color: 'var(--sd-fg-3)' }}>· {s.tab}</span></div>
              <div style={{ font: '400 11px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 2 }}>{s.desc}</div>
              <div className="sd-num" style={{ font: '400 10px/1.3 var(--sd-font-mono)', color: 'var(--sd-lowlight-2)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.fileId}</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px/1 var(--sd-font-sans)', color: 'var(--sd-primary)', background: 'var(--sd-accent-1)', padding: '5px 9px', borderRadius: 999, flexShrink: 0 }}>
              <Icon name="link" size={11} />Source
            </span>
          </div>
        ))}
      </div>
      <div style={{ font: '400 12px/1.6 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--sd-stroke)' }}>
        <b style={{ color: 'var(--sd-fg-2)' }}>App-Script-free:</b> the portal needs no server. Sign in with any company email and everyone can view all teams. Incentive maths is fully transparent — click any number to see the rows behind it.
      </div>
    </div>
  );
};

/* ---- Team card ------------------------------------------------------ */
const TeamCard = ({ summary, index, onOpen }) => {
  const I = window.INCENTIVE;
  const [hover, setHover] = React.useState(false);
  let seed = 1; for (const c of summary.key) seed += c.charCodeAt(0);
  return (
    <button onClick={() => onOpen(summary.key)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ textAlign: 'left', cursor: 'pointer', position: 'relative', overflow: 'hidden', background: 'var(--sd-white)', border: '1px solid var(--sd-border)', borderRadius: 'var(--sd-radius-xl)', padding: 20, boxShadow: hover ? 'var(--sd-shadow-regular)' : 'var(--sd-shadow-soft)', transform: hover ? 'translateY(-3px)' : 'none', transition: 'transform 180ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 180ms ease', animation: 'fadeUp 460ms ease both', animationDelay: `${index * 55}ms` }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: summary.accent }}></span>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: summary.tint, color: summary.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={summary.icon} size={24} /></span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          {summary.pip > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px/1 var(--sd-font-sans)', color: 'var(--sd-red-900)', background: 'var(--sd-red-50)', padding: '5px 9px', borderRadius: 999 }}><Icon name="flag" size={12} style={{ color: 'var(--sd-red-500)' }} />{summary.pip} PIP</span> : null}
          {summary.flagged > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px/1 var(--sd-font-sans)', color: 'var(--sd-yellow-900)', background: 'var(--sd-yellow-50)', padding: '5px 9px', borderRadius: 999 }}><Icon name="warning" size={12} style={{ color: 'var(--sd-yellow-700)' }} />{summary.flagged} review</span>
            : (summary.pip === 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px/1 var(--sd-font-sans)', color: 'var(--sd-green-900)', background: 'var(--sd-green-50)', padding: '5px 9px', borderRadius: 999 }}><Icon name="check-circle" size={12} style={{ color: 'var(--sd-green-700)' }} />All clear</span> : null)}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ font: '700 18px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{summary.name}</div>
        <div style={{ font: '400 13px/1.2 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 4 }}>{summary.count} members</div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div><div style={{ font: '600 10px/1 var(--sd-font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sd-fg-2)', marginBottom: 6 }}>{summary.isKae ? 'Total payout' : 'Avg final incentive'}</div><div style={{ font: '700 24px/1 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{summary.isKae ? I.inrShort(summary.kaePayout) : <CountUp value={summary.avgFinal} format={(v) => I.pct(v, 1)} />}</div></div>
        <Sparkline seed={seed} color={summary.accent} w={96} h={32} />
      </div>
      <div style={{ marginTop: 16 }}>
        {summary.isKae ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ font: '500 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>Total strikes</span><span className="sd-num" style={{ font: '700 12px/1 var(--sd-font-sans)', color: summary.totalStrikes ? 'var(--sd-red-500)' : 'var(--sd-green-700)' }}>{summary.totalStrikes}</span></div>
        ) : (<>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ font: '500 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>Avg achievement</span><span className="sd-num" style={{ font: '700 12px/1 var(--sd-font-sans)', color: summary.accent }}>{summary.avgAchievement}%</span></div>
          <ProgressBar pct={Math.min(100, summary.avgAchievement)} color={summary.accent} delay={index * 40} />
        </>)}
      </div>
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, font: '600 13px/1 var(--sd-font-sans)', color: hover ? 'var(--sd-primary)' : 'var(--sd-fg-2)', transition: 'color 120ms' }}>View team <Icon name="arrow-right" size={14} style={{ transform: hover ? 'translateX(3px)' : 'none', transition: 'transform 160ms' }} /></div>
    </button>
  );
};

/* ---- Admin card (9th) ----------------------------------------------- */
const AdminCard = ({ index, onOpen, flaggedCount, pipCount }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ textAlign: 'left', cursor: 'pointer', position: 'relative', overflow: 'hidden', color: '#fff', background: 'linear-gradient(135deg, #2c3e50 0%, #3a3f49 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--sd-radius-xl)', padding: 20, boxShadow: hover ? 'var(--sd-shadow-regular)' : 'var(--sd-shadow-soft)', transform: hover ? 'translateY(-3px)' : 'none', transition: 'transform 180ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 180ms ease', animation: 'fadeUp 460ms ease both', animationDelay: `${index * 55}ms`, minHeight: 240, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.6, background: 'radial-gradient(300px 160px at 90% 0%, rgba(86,148,242,0.4), transparent)' }}></div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="shield-check" size={24} /></span>
        <div style={{ display: 'flex', gap: 6 }}>
          {pipCount > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px/1 var(--sd-font-sans)', color: '#fff', background: 'rgba(244,67,54,0.85)', padding: '5px 9px', borderRadius: 999 }}><Icon name="flag" size={12} />{pipCount}</span> : null}
          {flaggedCount > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '600 11px/1 var(--sd-font-sans)', color: '#fff', background: 'rgba(255,255,255,0.18)', padding: '5px 9px', borderRadius: 999 }}><Icon name="warning" size={12} />{flaggedCount}</span> : null}
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 24 }}>
        <div style={{ font: '700 18px/1.2 var(--sd-font-sans)' }}>Admin View</div>
        <div style={{ font: '400 13px/1.4 var(--sd-font-sans)', color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>Data-health monitor, PIP flags &amp; full month-end export to HR.</div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, font: '600 13px/1 var(--sd-font-sans)', color: '#fff' }}>Open admin <Icon name="arrow-right" size={14} style={{ transform: hover ? 'translateX(3px)' : 'none', transition: 'transform 160ms' }} /></div>
      </div>
    </button>
  );
};

Object.assign(window, { Login, AppHeader, TeamCard, AdminCard, GoogleG, DataSourcesPanel, NameAudit });
