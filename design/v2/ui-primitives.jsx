// ui-primitives.jsx — atoms: Icon, Badge, ProvenanceChip, Card, Button, ProgressRing

// ── Icon ── tiny inline Lucide-style stroke icons; consistent 1.6 stroke
const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.6, style }) => {
  const paths = {
    // navigation
    rocket:  'M5 14l-3 3 4 1 1 4 3-3 M9.5 14.5l-4-4 M13 3a9 9 0 019 9c0 4-3 6-3 6l-7-7s2-3 6-3z M6 17l-2 2',
    home:    'M3 11l9-8 9 8 M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5',
    flask:   'M9 3h6 M10 3v6L4 19a2 2 0 002 2h12a2 2 0 002-2L14 9V3 M7 14h10',
    edit:    'M4 20h4l11-11-4-4L4 16v4z M14 5l4 4',
    chart:   'M3 21h18 M6 17v-5 M11 17v-9 M16 17v-3 M21 17v-7',
    cpu:     'M5 5h14v14H5z M9 9h6v6H9z M9 2v3 M15 2v3 M9 19v3 M15 19v3 M2 9h3 M2 15h3 M19 9h3 M19 15h3',
    flow:    'M5 4h6v6H5z M13 14h6v6h-6z M8 10v3a1 1 0 001 1h4',
    book:    'M4 4v16h13a3 3 0 013 3V7a3 3 0 00-3-3H4z M4 4a3 3 0 003 3h13',
    shield:  'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4',
    eye:     'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 9a3 3 0 100 6 3 3 0 000-6z',
    check2:  'M5 13l4 4L19 7',
    mail:    'M3 5h18v14H3z M3 5l9 8 9-8',
    history: 'M3 12a9 9 0 109-9 M3 4v5h5 M12 7v5l3 2',
    merge:   'M6 3v7a4 4 0 004 4h8 M14 10l4 4-4 4 M18 3v5',
    download:'M12 3v12 M7 11l5 5 5-5 M4 20h16',
    // status
    check:   'M4 11l4 4 8-9',
    warn:    'M12 3l10 18H2z M12 10v5 M12 18.5v.01',
    info:    'M12 4a8 8 0 100 16 8 8 0 000-16z M12 8.5v.01 M12 11v5',
    sparkle: 'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2 2 M16.4 16.4l2 2 M5.6 18.4l2-2 M16.4 7.6l2-2',
    plus:    'M12 5v14 M5 12h14',
    arrow:   'M5 12h14 M13 6l6 6-6 6',
    arrowDown:'M12 5v14 M6 13l6 6 6-6',
    chevron: 'M9 6l6 6-6 6',
    chevronD:'M6 9l6 6 6-6',
    dot:     'M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0',
    search:  'M11 4a7 7 0 100 14 7 7 0 000-14z M16 16l5 5',
    cog:     'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2 2 M16.4 16.4l2 2 M5.6 18.4l2-2 M16.4 7.6l2-2 M12 8a4 4 0 100 8 4 4 0 000-8z',
    save:    'M5 3h11l4 4v14H5z M8 3v6h8V3 M8 21v-7h8v7',
    file:    'M6 3h8l5 5v13H6z M14 3v5h5',
    link:    'M9 14l6-6 M9 9l-3 3a4 4 0 005.6 5.6L14 15 M15 15l3-3a4 4 0 00-5.6-5.6L10 9',
    pin:     'M12 3l-3 5-5 1 4 4-1 6 5-3 5 3-1-6 4-4-5-1z',
    grid:    'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
    list:    'M4 6h16 M4 12h16 M4 18h16',
    quote:   'M5 17V9a3 3 0 013-3 M5 13h5 M13 17V9a3 3 0 013-3 M13 13h5',
    target:  'M12 3a9 9 0 100 18 9 9 0 000-18z M12 8a4 4 0 100 8 4 4 0 000-8z M12 12v0',
    refresh: 'M3 12a9 9 0 0115-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 01-15 6.7L3 16 M3 21v-5h5',
    chevronR:'M9 6l6 6-6 6',
  };
  const d = paths[name] || paths.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
};

// ── Badge ── small status pill
const Badge = ({ tone = 'neutral', children, icon, dot = false, style }) => {
  const tones = {
    good:    { fg: 'var(--mc-verified)', bg: 'var(--mc-verified-bg)' },
    warn:    { fg: 'var(--mc-draft)',    bg: 'var(--mc-draft-bg)' },
    bad:     { fg: 'var(--mc-risk)',     bg: 'var(--mc-risk-bg)' },
    info:    { fg: 'var(--mc-user)',     bg: 'var(--mc-user-bg)' },
    neutral: { fg: 'var(--mc-neutral)',  bg: 'var(--mc-neutral-bg)' },
    teal:    { fg: 'var(--mc-teal-700)', bg: 'var(--mc-teal-100)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px 3px 7px',
      background: t.bg, color: t.fg,
      borderRadius: 999, fontSize: 11.5, fontWeight: 600,
      letterSpacing: 0.01, lineHeight: 1.2,
      fontFamily: 'var(--mc-font-sans)',
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: t.fg }} />}
      {icon && <Icon name={icon} size={11} color={t.fg} strokeWidth={2} />}
      {children}
    </span>
  );
};

// ── ProvenanceChip ── the integrity-layer signature element
// shows where a piece of content came from: Verified · AI-drafted · You
const ProvenanceChip = ({ kind = 'verified', source, size = 'sm' }) => {
  const cfg = {
    verified: { label: 'Verified',    icon: 'check2', fg: 'var(--mc-verified)', bg: 'var(--mc-verified-bg)' },
    draft:    { label: 'AI-drafted',  icon: 'sparkle', fg: 'var(--mc-draft)',    bg: 'var(--mc-draft-bg)' },
    user:     { label: 'You',         icon: 'edit',    fg: 'var(--mc-user)',     bg: 'var(--mc-user-bg)' },
    risk:     { label: 'Unverified',  icon: 'warn',    fg: 'var(--mc-risk)',     bg: 'var(--mc-risk-bg)' },
  }[kind] || {};
  const px = size === 'sm' ? { y: 3, x: 8, fz: 11 } : { y: 5, x: 10, fz: 12.5 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: `${px.y}px ${px.x}px`,
      background: cfg.bg, color: cfg.fg,
      borderRadius: 999, fontSize: px.fz, fontWeight: 600,
      fontFamily: 'var(--mc-font-sans)',
      lineHeight: 1.2,
    }}>
      <Icon name={cfg.icon} size={px.fz} color={cfg.fg} strokeWidth={2} />
      <span>{cfg.label}</span>
      {source && (
        <span style={{ opacity: 0.7, fontWeight: 500, fontFamily: 'var(--mc-font-mono)', fontSize: px.fz - 1, marginLeft: 2 }}>
          · {source}
        </span>
      )}
    </span>
  );
};

// ── Card ── white surface, rounded-2xl, hairline border, optional eyebrow
const Card = ({ children, padding = 20, style, eyebrow, title, trailing }) => (
  <div style={{
    background: 'var(--mc-surface)',
    border: '1px solid var(--mc-line)',
    borderRadius: 'var(--mc-r-xl)',
    boxShadow: 'var(--mc-shadow-sm)',
    padding,
    ...style,
  }}>
    {(eyebrow || title || trailing) && (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
        <div>
          {eyebrow && <div className="mc-eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
          {title && <h3 style={{ fontSize: 16 }}>{title}</h3>}
        </div>
        {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
      </div>
    )}
    {children}
  </div>
);

// ── Button ── primary | secondary | ghost | danger
const Button = ({ variant = 'primary', size = 'md', icon, iconR, children, style, fullWidth }) => {
  const sizes = {
    sm: { h: 28, px: 10, fz: 12.5, gap: 6, ic: 13 },
    md: { h: 36, px: 14, fz: 13.5, gap: 7, ic: 15 },
    lg: { h: 42, px: 18, fz: 14.5, gap: 8, ic: 16 },
  }[size];
  const variants = {
    primary:   { bg: 'var(--mc-blue-500)', bgH: 'var(--mc-blue-600)', fg: '#fff', bd: 'transparent' },
    secondary: { bg: '#fff',               bgH: '#fafbfd',            fg: 'var(--mc-ink-900)', bd: 'var(--mc-line)' },
    ghost:     { bg: 'transparent',        bgH: 'rgba(14,107,168,0.06)', fg: 'var(--mc-blue-500)', bd: 'transparent' },
    teal:      { bg: 'var(--mc-teal-500)', bgH: 'var(--mc-teal-700)', fg: '#fff', bd: 'transparent' },
    quiet:     { bg: 'var(--mc-canvas)',   bgH: 'var(--mc-line-soft)', fg: 'var(--mc-ink-700)', bd: 'transparent' },
  };
  const v = variants[variant];
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: sizes.gap, height: sizes.h, padding: `0 ${sizes.px}px`,
      background: v.bg, color: v.fg,
      border: `1px solid ${v.bd}`, borderRadius: 8,
      fontSize: sizes.fz, fontWeight: 600, letterSpacing: 0,
      fontFamily: 'var(--mc-font-sans)',
      width: fullWidth ? '100%' : undefined,
      transition: 'background 120ms', whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon && <Icon name={icon} size={sizes.ic} strokeWidth={2} />}
      <span>{children}</span>
      {iconR && <Icon name={iconR} size={sizes.ic} strokeWidth={2} />}
    </button>
  );
};

// ── ProgressRing ── value 0..100; serif numeral in center; teal track
const ProgressRing = ({ value = 0, size = 168, stroke = 14, label, sublabel, accent = 'var(--mc-blue-500)' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--mc-blue-100)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={accent} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <div className="mc-numeral" style={{ fontSize: size * 0.36, color: 'var(--mc-ink-900)', lineHeight: 0.95 }}>
          {value}
          <span style={{ fontSize: size * 0.14, color: 'var(--mc-ink-400)', marginLeft: 1, letterSpacing: 0 }}>%</span>
        </div>
        {label && <div className="mc-eyebrow" style={{ marginTop: 2 }}>{label}</div>}
        {sublabel && <div style={{ fontSize: 11.5, color: 'var(--mc-ink-500)' }}>{sublabel}</div>}
      </div>
    </div>
  );
};

// ── KeyValue ── small definition list row
const KeyValue = ({ label, value, mono = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--mc-line-soft)' }}>
    <div style={{ color: 'var(--mc-ink-500)', fontSize: 12.5 }}>{label}</div>
    <div className={mono ? 'mc-mono' : ''} style={{ color: 'var(--mc-ink-900)', fontSize: 12.5, fontWeight: 500 }}>{value}</div>
  </div>
);

// ── PillTabs ── sub-navigation
const PillTabs = ({ tabs, active }) => (
  <div style={{ display: 'inline-flex', padding: 4, background: 'var(--mc-canvas)', borderRadius: 10, gap: 2, border: '1px solid var(--mc-line)' }}>
    {tabs.map(t => (
      <div key={t} style={{
        padding: '6px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
        color: t === active ? 'var(--mc-ink-900)' : 'var(--mc-ink-500)',
        background: t === active ? '#fff' : 'transparent',
        boxShadow: t === active ? 'var(--mc-shadow-xs)' : undefined,
      }}>{t}</div>
    ))}
  </div>
);

Object.assign(window, { Icon, Badge, ProvenanceChip, Card, Button, ProgressRing, KeyValue, PillTabs });
