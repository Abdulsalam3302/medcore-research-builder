// ui-shell.jsx — Sidebar + TopBar
// Sidebar groups match the brief exactly. Each item carries an optional
// status badge (todo/warn/good) that surfaces section-level progress.

const NAV_GROUPS = [
  { label: 'Workspace', items: [
    { id: 'launch',   name: 'Research Launch', icon: 'rocket', status: 'good' },
    { id: 'overview', name: 'Overview',        icon: 'home' },
  ]},
  { label: 'Manuscript', items: [
    { id: 'type',       name: 'Research Type', icon: 'flask',  status: 'good' },
    { id: 'title',      name: 'Title Lab',     icon: 'sparkle', status: 'warn' },
    { id: 'intro',      name: 'Introduction',  icon: 'edit',   status: 'good' },
    { id: 'methods',    name: 'Methods',       icon: 'edit',   status: 'good' },
    { id: 'results',    name: 'Results',       icon: 'edit',   status: 'warn' },
    { id: 'discussion', name: 'Discussion',    icon: 'edit',   status: 'todo' },
    { id: 'conclusion', name: 'Conclusion',    icon: 'edit',   status: 'todo' },
    { id: 'appendix',   name: 'Appendices',    icon: 'file',   status: 'todo' },
  ]},
  { label: 'Analysis', items: [
    { id: 'stats',    name: 'Stats & Figures',   icon: 'chart' },
    { id: 'copilot',  name: 'Stats Copilot',     icon: 'cpu' },
    { id: 'flow',     name: 'Flow Diagram',      icon: 'flow' },
  ]},
  { label: 'Quality', items: [
    { id: 'refs',       name: 'References',          icon: 'book',   status: 'warn' },
    { id: 'quality',    name: 'Quality Suite',       icon: 'shield' },
    { id: 'reviewer',   name: 'Reviewer Simulator',  icon: 'eye' },
    { id: 'compliance', name: 'Compliance Report',   icon: 'check2' },
  ]},
  { label: 'Submission', items: [
    { id: 'cover',   name: 'Cover Letter',    icon: 'mail' },
    { id: 'history', name: 'Version History', icon: 'history' },
    { id: 'share',   name: 'Share / Merge',   icon: 'merge' },
    { id: 'export',  name: 'Export',          icon: 'download' },
  ]},
];

// Sidebar — 260px fixed. Mark `active` with the item id; mark `pulse` items
// to give them an animated "next step" cue. Status dot uses verified/draft/
// risk palette.
const Sidebar = ({ active = 'overview', pulse, dense = false }) => {
  const px = dense ? { itemY: 5, groupGap: 16, label: 11 } : { itemY: 7, groupGap: 22, label: 11.5 };
  return (
    <aside style={{
      width: 260, flexShrink: 0, background: 'var(--mc-surface)',
      borderRight: '1px solid var(--mc-line)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* logo / app mark */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--mc-line-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logomark />
          <div>
            <div style={{ fontFamily: 'var(--mc-font-display)', fontWeight: 700, fontSize: 15, letterSpacing: -0.01, color: 'var(--mc-ink-900)' }}>
              MedCore
            </div>
            <div style={{ fontFamily: 'var(--mc-font-mono)', fontSize: 10, color: 'var(--mc-ink-500)', letterSpacing: 0.04, marginTop: 1 }}>
              RESEARCH BUILDER
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '14px 10px 18px' }}>
        {NAV_GROUPS.map((g, i) => (
          <div key={g.label} style={{ marginBottom: px.groupGap }}>
            <div className="mc-eyebrow" style={{
              padding: '4px 10px 6px',
              fontSize: px.label,
              color: 'var(--mc-ink-400)',
            }}>{g.label}</div>
            {g.items.map(it => {
              const isActive = it.id === active;
              const isPulse = it.id === pulse;
              return (
                <div key={it.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: `${px.itemY}px 10px`,
                  borderRadius: 8,
                  margin: '1px 0',
                  background: isActive ? 'var(--mc-blue-50)' : 'transparent',
                  color: isActive ? 'var(--mc-blue-700)' : 'var(--mc-ink-700)',
                  position: 'relative',
                }}>
                  {isActive && (
                    <div style={{ position: 'absolute', left: -10, top: 6, bottom: 6, width: 3,
                      borderRadius: '0 3px 3px 0', background: 'var(--mc-blue-500)' }} />
                  )}
                  <Icon name={it.icon} size={15}
                    color={isActive ? 'var(--mc-blue-500)' : 'var(--mc-ink-400)'}
                    strokeWidth={isActive ? 2 : 1.6} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 500 }}>{it.name}</span>
                  {it.status && <StatusDot status={it.status} />}
                  {isPulse && !it.status && (
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--mc-teal-500)',
                      boxShadow: '0 0 0 3px rgba(13,148,136,0.18)' }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--mc-line-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--mc-ink-500)' }}>
          <Icon name="shield" size={13} color="var(--mc-teal-500)" strokeWidth={2} />
          <span>Local-only · No login</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--mc-ink-500)', marginTop: 6 }}>
          <Icon name="info" size={13} color="var(--mc-ink-400)" strokeWidth={2} />
          <span>v2.0 · open-source</span>
        </div>
      </div>
    </aside>
  );
};

const StatusDot = ({ status }) => {
  const c = {
    good: 'var(--mc-verified)',
    warn: 'var(--mc-draft)',
    risk: 'var(--mc-risk)',
    todo: 'var(--mc-ink-300)',
  }[status] || 'var(--mc-ink-300)';
  return <span style={{ width: 6, height: 6, borderRadius: 3, background: c, flexShrink: 0 }} />;
};

// Logomark — geometric: paper sheet + cross. Original mark, no clip-art.
const Logomark = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="2" y="2" width="24" height="24" rx="7" fill="var(--mc-blue-500)" />
    <path d="M9 7h8a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2z"
      fill="none" stroke="white" strokeWidth="1.6" opacity="0.95" />
    <path d="M13 12h4M13 15h4M13 18h2" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
    <circle cx="22" cy="7" r="3" fill="var(--mc-teal-500)" stroke="var(--mc-blue-500)" strokeWidth="1.5"/>
    <path d="M22 5.5v3M20.5 7h3" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// TopBar — project title, autosave, breadcrumbs, IO actions
const TopBar = ({ title = 'Effect of intermittent fasting on HbA1c in T2DM', subtitle, breadcrumb }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 28px', background: 'var(--mc-surface)',
    borderBottom: '1px solid var(--mc-line)', gap: 24, flexShrink: 0,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      {breadcrumb && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--mc-ink-500)', marginBottom: 4 }}>
          {breadcrumb.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Icon name="chevron" size={11} color="var(--mc-ink-300)" />}
              <span style={{ fontWeight: i === breadcrumb.length - 1 ? 600 : 500, color: i === breadcrumb.length - 1 ? 'var(--mc-ink-700)' : undefined }}>{b}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--mc-ink-900)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h2>
        <Icon name="edit" size={13} color="var(--mc-ink-400)" />
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--mc-ink-500)', marginTop: 2 }}>{subtitle}</div>
      )}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {/* autosave */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--mc-ink-500)' }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--mc-verified)',
          boxShadow: '0 0 0 3px rgba(4,120,87,0.16)' }} />
        Your draft is saved locally · 2s ago
      </div>
      <div style={{ width: 1, height: 22, background: 'var(--mc-line)' }} />
      <Button variant="ghost" size="sm" icon="download">Import</Button>
      <Button variant="ghost" size="sm" icon="save">Export</Button>
      <Button variant="ghost" size="sm" icon="refresh">Reset</Button>
    </div>
  </div>
);

Object.assign(window, { Sidebar, TopBar, NAV_GROUPS });
