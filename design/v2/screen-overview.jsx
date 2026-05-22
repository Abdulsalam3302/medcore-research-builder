// screen-overview.jsx — dashboard hero + workflow grid + system status + principles

const ScreenOverview = () => (
  <div className="mc" style={{ display: 'flex', minHeight: '100%', background: 'var(--mc-canvas)' }}>
    <Sidebar active="overview" pulse="title" />

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <TopBar
        title="Effect of intermittent fasting on HbA1c in T2DM"
        subtitle="Randomized controlled trial · CONSORT · started 14 May 2026"
      />

      <div style={{ flex: 1, padding: '28px 36px 40px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── HERO ── progress ring + status copy + next-step CTA */}
          <Card padding={28} style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFE 100%)',
            border: '1px solid var(--mc-line)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 36, alignItems: 'center' }}>
              <ProgressRing value={62} label="Manuscript readiness" sublabel="6 of 11 sections" />

              <div>
                <div className="mc-eyebrow" style={{ color: 'var(--mc-teal-700)' }}>Good morning · pick up where you left off</div>
                <h1 style={{ marginTop: 8, marginBottom: 10, fontSize: 30, fontFamily: 'var(--mc-font-serif)', fontWeight: 500, letterSpacing: -0.015 }}>
                  Your draft is <span style={{ color: 'var(--mc-blue-500)' }}>two steps</span> from a reviewer-ready submission.
                </h1>
                <p style={{ color: 'var(--mc-ink-500)', fontSize: 14, lineHeight: 1.55, maxWidth: 580 }}>
                  Next up — finalize your title in Title Lab and resolve 3 unverified references.
                  Everything stays on your device until you choose to export.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <Button variant="primary" icon="sparkle" iconR="arrow">Continue in Title Lab</Button>
                  <Button variant="secondary" icon="eye">Run reviewer simulation</Button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                <KeyMetric value="11" unit="sections" label="manuscript" />
                <KeyMetric value="47" unit="refs"     label="bibliography" />
                <KeyMetric value="3"  unit="flags"    label="integrity"   tone="warn" />
              </div>
            </div>
          </Card>

          {/* ── WORKFLOW STEPS ── 6 cards, numbered & color-coded by status */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 18 }}>Workflow</h2>
              <span className="mc-eyebrow">Reporting-guideline-driven · CONSORT 2025</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <StepCard n="01" title="Frame the question" desc="PICO, design, journal target — locked." status="good" cta="Review brief" icon="target" />
              <StepCard n="02" title="Draft sections"      desc="6 of 11 sections meet coverage threshold." status="good" cta="Continue drafting" icon="edit" />
              <StepCard n="03" title="Generate stats & figures" desc="Tables 1–3, Figure 1 generated. Awaiting Figure 2." status="warn" cta="Open Stats Copilot" icon="chart" />
              <StepCard n="04" title="Verify references"   desc="3 of 47 still unverified against PubMed / Crossref." status="warn" cta="Resolve unverified" icon="book" />
              <StepCard n="05" title="Reviewer simulation" desc="Last run 2 days ago · 4 issues raised, 2 unresolved." status="todo" cta="Run simulation" icon="eye" />
              <StepCard n="06" title="Export submission package" desc="DOCX · cover letter · figures · checklist." status="todo" cta="Set up export" icon="download" />
            </div>
          </div>

          {/* ── SYSTEM STATUS + PRINCIPLES ── 2-col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
            <Card eyebrow="System status" title="Integrations" padding={0}
              trailing={<Badge tone="good" dot>All systems operational</Badge>}
              style={{ overflow: 'hidden' }}>
              <div style={{ padding: '0 20px 20px' }}>
                <StatusGrid />
              </div>
            </Card>

            <Card eyebrow="Principles" title="How MedCore works" padding={20}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Principle icon="shield" title="Never fabricate" body="Suggested text is always marked AI-drafted until you accept it." />
                <Principle icon="check2" title="Always cite source" body="Every reference is verified against PubMed, Crossref or DOI before insertion." />
                <Principle icon="eye"    title="Guideline-driven"  body="CONSORT, STROBE, PRISMA and 14 more reporting guidelines are enforced inline." />
                <Principle icon="save"   title="Stays on your device" body="No login. No telemetry. You own the file." />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── KeyMetric ── serif numeric callout (top-right of hero)
const KeyMetric = ({ value, unit, label, tone = 'neutral' }) => {
  const color = { neutral: 'var(--mc-ink-900)', warn: 'var(--mc-draft)', good: 'var(--mc-verified)' }[tone];
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 0', minWidth: 150 }}>
      <div style={{ flex: 1, textAlign: 'right' }}>
        <div className="mc-eyebrow" style={{ fontSize: 9.5 }}>{label}</div>
      </div>
      <div className="mc-numeral" style={{ fontSize: 26, color, lineHeight: 1, fontWeight: 500 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--mc-ink-400)', fontFamily: 'var(--mc-font-mono)', width: 40 }}>{unit}</div>
    </div>
  );
};

// ── StepCard ── numbered workflow card; status pill + CTA arrow
const StepCard = ({ n, title, desc, status, cta, icon }) => {
  const cfg = {
    good: { tone: 'good',    label: 'Complete',   icon: 'check2', accent: 'var(--mc-verified)' },
    warn: { tone: 'warn',    label: 'In progress', icon: 'warn',   accent: 'var(--mc-draft)' },
    todo: { tone: 'neutral', label: 'To do',      icon: 'dot',    accent: 'var(--mc-ink-300)' },
  }[status];
  return (
    <div style={{
      background: 'var(--mc-surface)',
      border: '1px solid var(--mc-line)',
      borderRadius: 'var(--mc-r-xl)',
      padding: 20,
      position: 'relative',
      boxShadow: 'var(--mc-shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mc-numeral" style={{ fontSize: 24, color: cfg.accent, lineHeight: 1, fontWeight: 500 }}>{n}</span>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--mc-blue-50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={icon} size={15} color="var(--mc-blue-500)" />
          </div>
        </div>
        <Badge tone={cfg.tone} icon={cfg.icon}>{cfg.label}</Badge>
      </div>
      <h3 style={{ fontSize: 14.5, marginBottom: 6 }}>{title}</h3>
      <p style={{ color: 'var(--mc-ink-500)', fontSize: 12.5, lineHeight: 1.5, marginBottom: 14 }}>{desc}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--mc-blue-500)', fontSize: 12.5, fontWeight: 600 }}>
        <span>{cta}</span>
        <Icon name="arrow" size={13} strokeWidth={2} />
      </div>
    </div>
  );
};

// ── StatusGrid ── 10 integration rows in 2 columns
const StatusGrid = () => {
  const rows = [
    ['PubMed E-utilities',  'good', '124ms'],
    ['Crossref API',        'good', '212ms'],
    ['DOI resolution',      'good', '88ms'],
    ['Unpaywall',           'good', '301ms'],
    ['CONSORT 2025',        'good', 'v1.2.0'],
    ['STROBE checklist',    'good', 'v4.0.1'],
    ['PRISMA flow',         'warn', 'syncing'],
    ['ICMJE author roles',  'good', 'v6.1'],
    ['ORCID lookup',        'good', '93ms'],
    ['Anthropic Claude',    'good', 'haiku-4-5'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 28 }}>
      {rows.map(([name, s, meta]) => (
        <div key={name} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
          borderTop: '1px solid var(--mc-line-soft)',
        }}>
          <StatusDot status={s} />
          <span style={{ flex: 1, fontSize: 13, color: 'var(--mc-ink-900)' }}>{name}</span>
          <span className="mc-mono" style={{ fontSize: 11, color: 'var(--mc-ink-400)' }}>{meta}</span>
        </div>
      ))}
    </div>
  );
};

const StatusDot = ({ status }) => {
  const c = { good: 'var(--mc-verified)', warn: 'var(--mc-draft)', todo: 'var(--mc-ink-300)', risk: 'var(--mc-risk)' }[status];
  return <span style={{ width: 7, height: 7, borderRadius: 4, background: c, flexShrink: 0,
    boxShadow: `0 0 0 3px ${status === 'good' ? 'rgba(4,120,87,0.14)' : status === 'warn' ? 'rgba(180,83,9,0.16)' : 'transparent'}` }} />;
};

// ── Principle ── footer row
const Principle = ({ icon, title, body }) => (
  <div style={{ display: 'flex', gap: 12 }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      background: 'var(--mc-teal-100)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={14} color="var(--mc-teal-700)" strokeWidth={2} />
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--mc-ink-900)', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--mc-ink-500)', lineHeight: 1.5 }}>{body}</div>
    </div>
  </div>
);

Object.assign(window, { ScreenOverview });
