/* =====================================================================
   Incentive Automation — shared components
   Token-aligned primitives + custom UI. Attaches to window.
   ===================================================================== */

/* ---- Button --------------------------------------------------------- */
const Button = ({ children, variant = 'primary', size = 'md', icon, iconRight, onClick, disabled, style = {}, ...rest }) => {
  const [hover, setHover] = React.useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--sd-font-sans)', fontWeight: 600,
    borderRadius: 'var(--sd-radius-md)', border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 120ms ease, color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
    whiteSpace: 'nowrap',
  };
  const sizes = {
    sm: { fontSize: 12, padding: '8px 12px', lineHeight: 1 },
    md: { fontSize: 14, padding: '10px 16px', lineHeight: 1 },
    lg: { fontSize: 16, padding: '13px 22px', lineHeight: 1 },
  };
  const variants = {
    primary:   { background: hover ? '#3f59be' : 'var(--sd-primary)', color: '#fff', boxShadow: 'var(--sd-shadow-primary)' },
    secondary: { background: hover ? '#e3e9fa' : 'var(--sd-accent-1)', color: 'var(--sd-primary)' },
    ghost:     { background: hover ? 'var(--sd-bg-hover)' : 'transparent', color: 'var(--sd-primary)' },
    outline:   { background: hover ? 'var(--sd-bg-hover)' : 'var(--sd-white)', color: 'var(--sd-fg-1)', borderColor: 'var(--sd-lowlight-1)' },
    danger:    { background: hover ? '#d62915' : 'var(--sd-red-500)', color: '#fff' },
    dark:      { background: hover ? '#000' : 'var(--sd-heading)', color: '#fff' },
  };
  const disabledStyle = disabled ? { background: 'var(--sd-lowlight-1)', color: 'var(--sd-lowlight-2)', boxShadow: 'none' } : {};
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...base, ...sizes[size], ...variants[variant], ...disabledStyle, ...style }}
      {...rest}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={16} /> : null}
    </button>
  );
};

/* ---- Badge ---------------------------------------------------------- */
const Badge = ({ children, tone = 'neutral', dot = false, style = {} }) => {
  const tones = {
    neutral: { bg: 'var(--sd-lowlight-1)', fg: 'var(--sd-fg-2)', d: 'var(--sd-lowlight-2)' },
    primary: { bg: 'var(--sd-accent-1)', fg: 'var(--sd-primary)', d: 'var(--sd-primary)' },
    success: { bg: 'var(--sd-green-50)', fg: 'var(--sd-green-900)', d: 'var(--sd-green-700)' },
    warning: { bg: 'var(--sd-yellow-50)', fg: 'var(--sd-yellow-900)', d: 'var(--sd-yellow-700)' },
    danger:  { bg: 'var(--sd-red-50)',   fg: 'var(--sd-red-900)',   d: 'var(--sd-red-500)' },
    info:    { bg: 'var(--sd-cyan-50)',  fg: 'var(--sd-cyan-900)',  d: 'var(--sd-cyan-700)' },
    violet:  { bg: 'var(--sd-violet-50)',fg: 'var(--sd-violet-900)',d: 'var(--sd-violet-700)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      fontFamily: 'var(--sd-font-sans)', fontWeight: 600, fontSize: 12, lineHeight: 1,
      background: t.bg, color: t.fg, ...style,
    }}>
      {dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: t.d }}></span> : null}
      {children}
    </span>
  );
};

/* ---- Card ----------------------------------------------------------- */
const Card = ({ children, padding = 16, variant = 'regular', style = {}, ...rest }) => {
  const variants = {
    soft:     { boxShadow: 'var(--sd-shadow-soft)' },
    regular:  { boxShadow: 'var(--sd-shadow-regular)' },
    elevated: { boxShadow: 'var(--sd-shadow-elevated)' },
    flat:     { border: '1px solid var(--sd-border)' },
  };
  return (
    <div style={{ background: 'var(--sd-white)', borderRadius: 'var(--sd-radius-lg)', padding, ...variants[variant], ...style }} {...rest}>
      {children}
    </div>
  );
};

/* ---- Avatar (deterministic color) ----------------------------------- */
const AV_COLORS = ['#4764cd', '#673ab7', '#22a12a', '#00b1cc', '#e08a2d', '#e91e63', '#531ba8', '#d62915'];
const Avatar = ({ name, size = 36, style = {} }) => {
  const { initials } = window.INCENTIVE;
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const c = AV_COLORS[h % AV_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      background: c, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      font: `600 ${Math.round(size * 0.38)}px/1 var(--sd-font-sans)`,
      textTransform: 'uppercase', letterSpacing: 0.2, ...style,
    }}>{initials(name)}</div>
  );
};

/* ---- Status chip (data-health) -------------------------------------- */
const StatusChip = ({ status, size = 'md' }) => {
  const map = {
    ok:        { tone: 'success', icon: 'check-circle',   label: 'On track' },
    attention: { tone: 'warning', icon: 'warning',        label: 'Needs review' },
    missing:   { tone: 'danger',  icon: 'warning-octagon',label: 'Data missing' },
  };
  const m = map[status] || map.ok;
  const tones = {
    success: { bg: 'var(--sd-green-50)', fg: 'var(--sd-green-900)', ic: 'var(--sd-green-700)' },
    warning: { bg: 'var(--sd-yellow-50)', fg: 'var(--sd-yellow-900)', ic: 'var(--sd-yellow-700)' },
    danger:  { bg: 'var(--sd-red-50)', fg: 'var(--sd-red-900)', ic: 'var(--sd-red-500)' },
  };
  const t = tones[m.tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: size === 'sm' ? '3px 8px' : '5px 11px', borderRadius: 999,
      background: t.bg, color: t.fg, font: `600 ${size === 'sm' ? 11 : 12}px/1 var(--sd-font-sans)`,
    }}>
      <Icon name={m.icon} size={size === 'sm' ? 13 : 15} style={{ color: t.ic }} />
      {m.label}
    </span>
  );
};

/* ---- Animated count-up --------------------------------------------- */
const CountUp = ({ value, format = (v) => Math.round(v).toLocaleString('en-IN'), duration = 900, style = {} }) => {
  const [disp, setDisp] = React.useState(Number(value) || 0);
  const ref = React.useRef({ raf: 0, from: 0 });
  React.useEffect(() => {
    const to = Number(value) || 0;
    // If the tab is hidden or motion is reduced, rAF won't fire — show the final value.
    if (document.visibilityState !== 'visible' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisp(to); ref.current.from = to; return;
    }
    const from = ref.current.from;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    cancelAnimationFrame(ref.current.raf);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * ease(t);
      setDisp(v);
      if (t < 1) ref.current.raf = requestAnimationFrame(tick);
      else ref.current.from = to;
    };
    ref.current.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current.raf);
  }, [value, duration]);
  return <span className="sd-num" style={style}>{format(disp)}</span>;
};

/* ---- Mini progress bar --------------------------------------------- */
const ProgressBar = ({ pct, color = 'var(--sd-primary)', track = 'var(--sd-lowlight-1)', height = 6, delay = 0 }) => {
  const target = Math.max(0, Math.min(100, pct));
  const visible = typeof document !== 'undefined' && document.visibilityState === 'visible';
  const [w, setW] = React.useState(visible ? 0 : target);
  React.useEffect(() => {
    if (document.visibilityState !== 'visible') { setW(target); return; }
    const t = setTimeout(() => setW(target), 60 + delay); return () => clearTimeout(t);
  }, [target, delay]);
  return (
    <div style={{ background: track, borderRadius: 999, height, overflow: 'hidden' }}>
      <div style={{ width: w + '%', height: '100%', background: color, borderRadius: 999, transition: 'width 800ms cubic-bezier(0.2,0.8,0.2,1)' }}></div>
    </div>
  );
};

/* ---- Sparkline (seeded, decorative trend) -------------------------- */
const Sparkline = ({ seed = 1, color = 'var(--sd-primary)', w = 120, h = 34 }) => {
  const pts = React.useMemo(() => {
    let a = seed * 9301 + 49297; const out = [];
    for (let i = 0; i < 12; i++) { a = (a * 9301 + 49297) % 233280; out.push(0.25 + 0.6 * (a / 233280)); }
    // gentle upward drift
    return out.map((v, i) => v * (0.7 + 0.3 * (i / 11)));
  }, [seed]);
  const max = Math.max(...pts), min = Math.min(...pts);
  const x = (i) => (w * i) / (pts.length - 1);
  const y = (v) => h - 3 - (h - 6) * ((v - min) / (max - min || 1));
  const d = pts.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  const gid = 'spark' + seed;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.20" /><stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ---- Field (label + input) ----------------------------------------- */
const Field = ({ label, hint, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ font: '600 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-2)' }}>{label}</span>
    {children}
    {hint ? <span style={{ font: '400 11px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{hint}</span> : null}
  </label>
);

const TextInput = ({ icon, prefix, suffix, style = {}, ...rest }) => {
  const [f, setF] = React.useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, background: 'var(--sd-white)',
      border: `1px solid ${f ? 'var(--sd-primary)' : 'var(--sd-lowlight-1)'}`,
      borderRadius: 'var(--sd-radius-md)', padding: '0 12px',
      boxShadow: f ? '0 0 0 3px rgba(71,100,205,0.18)' : 'none',
      transition: 'box-shadow 120ms ease, border-color 120ms ease', ...style,
    }}>
      {icon ? <Icon name={icon} size={16} style={{ color: 'var(--sd-fg-3)' }} /> : null}
      {prefix ? <span style={{ font: '500 14px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{prefix}</span> : null}
      <input {...rest}
        onFocus={(e) => { setF(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setF(false); rest.onBlur?.(e); }}
        style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', font: '400 14px/1.5 var(--sd-font-sans)', color: 'var(--sd-fg-1)', flex: 1, minWidth: 0 }} />
      {suffix ? <span style={{ font: '500 14px/1 var(--sd-font-sans)', color: 'var(--sd-fg-3)' }}>{suffix}</span> : null}
    </div>
  );
};

/* ---- Math breakdown row -------------------------------------------- */
const MathRow = ({ label, detail, value, strong, accent, sign, indent }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 12,
    padding: strong ? '14px 16px' : '11px 16px',
    paddingLeft: indent ? 32 : 16,
    background: strong ? 'var(--sd-accent-1)' : 'transparent',
    borderRadius: strong ? 'var(--sd-radius-md)' : 0,
    borderTop: strong ? 'none' : '1px solid var(--sd-stroke)',
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ font: `${strong ? 700 : 600} ${strong ? 15 : 14}px/1.3 var(--sd-font-sans)`, color: strong ? 'var(--sd-heading)' : 'var(--sd-fg-1)' }}>{label}</div>
      {detail ? <div style={{ font: '400 12px/1.4 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 3 }}>{detail}</div> : null}
    </div>
    <div className="sd-num" style={{
      font: `${strong ? 700 : 600} ${strong ? 20 : 15}px/1 var(--sd-font-sans)`,
      color: accent || (strong ? 'var(--sd-primary)' : 'var(--sd-heading)'), whiteSpace: 'nowrap',
    }}>{sign}{value}</div>
  </div>
);

/* ---- Section heading ----------------------------------------------- */
const SectionTitle = ({ eyebrow, title, right }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
    <div>
      {eyebrow ? <div style={{ font: '600 11px/1 var(--sd-font-sans)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sd-primary)', marginBottom: 7 }}>{eyebrow}</div> : null}
      <h3 style={{ font: '700 20px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{title}</h3>
    </div>
    {right}
  </div>
);

Object.assign(window, {
  Button, Badge, Card, Avatar, StatusChip, CountUp, ProgressBar, Sparkline, Field, TextInput, MathRow, SectionTitle,
  Modal, PeriodPicker,
});

/* ---- Modal ---------------------------------------------------------- */
function Modal({ open, onClose, title, subtitle, icon, children, width = 560 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20,24,33,0.45)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '64px 20px', animation: 'fadeIn 160ms ease both' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: width, background: 'var(--sd-white)', borderRadius: 'var(--sd-radius-xl)', boxShadow: 'var(--sd-shadow-elevated)', overflow: 'hidden', animation: 'fadeUp 200ms ease both', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--sd-stroke)' }}>
          {icon ? <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--sd-accent-1)', color: 'var(--sd-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} /></span> : null}
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 16px/1.2 var(--sd-font-sans)', color: 'var(--sd-heading)' }}>{title}</div>
            {subtitle ? <div style={{ font: '400 12px/1.3 var(--sd-font-sans)', color: 'var(--sd-fg-3)', marginTop: 2 }}>{subtitle}</div> : null}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--sd-border)', background: 'var(--sd-white)', cursor: 'pointer', color: 'var(--sd-fg-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x-circle" size={18} /></button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

/* ---- Period picker (month/year switch) ----------------------------- */
function PeriodPicker({ activeKey, onChange }) {
  const I = window.INCENTIVE;
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const active = I.MONTHS.find((m) => m.key === activeKey) || I.MONTHS[I.MONTHS.length - 1];
  // group by year (desc), months desc
  const years = [...new Set(I.MONTHS.map((m) => m.year))].sort((a, b) => b - a);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '600 12px/1 var(--sd-font-sans)', color: 'var(--sd-fg-1)', background: 'var(--sd-white)', border: '1px solid var(--sd-border)', padding: '7px 12px', borderRadius: 999, cursor: 'pointer' }}>
        <Icon name="calendar-dots" size={14} style={{ color: 'var(--sd-primary)' }} />{active.label}
        <Icon name="caret-down" size={13} style={{ color: 'var(--sd-fg-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }} />
      </button>
      {open ? (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 40, background: 'var(--sd-white)', border: '1px solid var(--sd-border)', borderRadius: 'var(--sd-radius-lg)', boxShadow: 'var(--sd-shadow-elevated)', padding: 8, minWidth: 220, animation: 'fadeUp 160ms ease both' }}>
          {years.map((y) => (
            <div key={y} style={{ marginBottom: 4 }}>
              <div style={{ font: '700 10px/1 var(--sd-font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sd-fg-3)', padding: '8px 10px 6px' }}>{y}</div>
              {I.MONTHS.filter((m) => m.year === y).slice().reverse().map((m) => {
                const on = m.key === activeKey;
                return (
                  <button key={m.key} onClick={() => { onChange(m.key); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '9px 10px', borderRadius: 'var(--sd-radius-md)', border: 'none', cursor: 'pointer', background: on ? 'var(--sd-accent-1)' : 'transparent', color: on ? 'var(--sd-primary)' : 'var(--sd-fg-1)', font: `${on ? 700 : 500} 13px/1 var(--sd-font-sans)` }}
                    onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--sd-bg-hover)'; }}
                    onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ flex: 1 }}>{m.label.split(' ')[0]}</span>
                    {on ? <Icon name="check" size={14} /> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
