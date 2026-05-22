// screen-launch.jsx — Research Launch: readiness 0-100, checklist form, design recommender

const ScreenLaunch = () => (
  <div className="mc" style={{ display: 'flex', minHeight: '100%', background: 'var(--mc-canvas)' }}>
    <Sidebar active="launch" />

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <TopBar
        title="Effect of intermittent fasting on HbA1c in T2DM"
        breadcrumb={['Workspace', 'Research Launch']}
      />

      <div style={{ flex: 1, padding: '28px 36px 40px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── HEADER STRIP ── */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div className="mc-eyebrow">Step 1 of 6 · Workspace</div>
              <h1 style={{ marginTop: 6, fontSize: 26 }}>Research Launch</h1>
              <p style={{ color: 'var(--mc-ink-500)', fontSize: 13.5, marginTop: 6, maxWidth: 720 }}>
                Capture the essentials. Your readiness score updates as you go — we recommend a design
                and reporting guideline once you cross 80.
              </p>
            </div>
            <Button variant="primary" icon="check2">Save brief</Button>
          </div>

          {/* ── 2-COL: form + side rail ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'flex-start' }}>

            {/* LEFT — checklist form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card eyebrow="Brief" title="Research question (PICO)">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  <Field label="Population" value="Adults 30–65 with T2DM (HbA1c 7.0–9.5%)" />
                  <Field label="Intervention" value="16:8 time-restricted eating, 12 weeks" />
                  <Field label="Comparator" value="Standard dietary counselling" />
                  <Field label="Outcome" value="Change in HbA1c at 12 weeks" />
                </div>
              </Card>

              <Card eyebrow="Methods at a glance" title="Setting & sample">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <Field label="Setting" value="2 endocrinology clinics, Boston" compact />
                  <Field label="Sample size" value="n = 184" compact />
                  <Field label="Allocation" value="1:1, block randomization" compact />
                  <Field label="Blinding" value="Open-label" compact />
                  <Field label="Primary outcome" value="ΔHbA1c at 12w" compact />
                  <Field label="Analysis" value="ITT, mixed-effects" compact />
                </div>
              </Card>

              <Card eyebrow="Data" title="Data sources">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <DataRow name="trial_outcomes.csv"  meta="184 rows · 27 cols · uploaded today"  tone="good" />
                  <DataRow name="adherence_log.xlsx" meta="2,944 rows · 9 cols · uploaded today"  tone="good" />
                  <DataRow name="baseline_chars.csv" meta="184 rows · 18 cols · uploaded today"  tone="good" />
                  <DataRow name="adverse_events.csv" meta="missing — needed for safety table"     tone="risk" />
                </div>
              </Card>

              <Card eyebrow="Compliance" title="Ethics & registration">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  <Field label="IRB approval" value="BH-2024-188 · 12 Jan 2025" compact verified />
                  <Field label="Trial registration" value="NCT06281234 (ClinicalTrials.gov)" compact verified />
                  <Field label="Funding" value="NIH R01 DK-128xxx" compact />
                  <Field label="Conflicts" value="None declared" compact />
                </div>
              </Card>
            </div>

            {/* RIGHT — readiness + recommender */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 0 }}>
              <Card padding={24}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <ProgressRing value={78} size={172} stroke={14} label="Readiness" sublabel="Almost ready to draft" accent="var(--mc-teal-500)" />
                </div>
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <ReadinessRow label="Research question"     score={100} />
                  <ReadinessRow label="Methods detail"        score={92} />
                  <ReadinessRow label="Data sources"          score={70} note="Missing safety data" />
                  <ReadinessRow label="Ethics & registration" score={100} />
                  <ReadinessRow label="Reporting guideline"   score={30} note="Not yet selected" />
                </div>
              </Card>

              <Card eyebrow="Recommended" title="Design & guideline">
                <div style={{
                  padding: 14, borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--mc-teal-50), var(--mc-blue-50))',
                  border: '1px solid var(--mc-teal-100)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon name="sparkle" size={14} color="var(--mc-teal-700)" />
                    <span className="mc-eyebrow" style={{ color: 'var(--mc-teal-700)' }}>Best match · 94%</span>
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--mc-ink-900)', marginBottom: 4 }}>
                    Randomized controlled trial
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--mc-ink-700)', lineHeight: 1.5 }}>
                    Follow <strong>CONSORT 2025</strong>. We&rsquo;ll auto-load Methods scaffolding,
                    flow diagram, and Table 1 templates.
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    <Badge tone="info">parallel-group</Badge>
                    <Badge tone="info">superiority</Badge>
                    <Badge tone="info">open-label</Badge>
                  </div>
                  <Button variant="teal" fullWidth icon="check2" style={{ marginTop: 14 }}>Use this design</Button>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--mc-ink-500)' }}>
                  Also considered: <span style={{ color: 'var(--mc-ink-700)', fontWeight: 500 }}>Pragmatic trial (78%)</span> · Cluster RCT (44%)
                </div>
              </Card>

              <div style={{
                padding: '12px 14px', background: 'var(--mc-draft-bg)', borderRadius: 10,
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <Icon name="warn" size={14} color="var(--mc-draft)" strokeWidth={2} style={{ marginTop: 1 }} />
                <div style={{ fontSize: 12, color: 'var(--mc-draft)', lineHeight: 1.5 }}>
                  Upload <strong>adverse_events.csv</strong> to unlock CONSORT safety section auto-fill.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Field ── label + value, optional verified chip
const Field = ({ label, value, compact = false, verified = false }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <label className="mc-eyebrow" style={{ fontSize: 10 }}>{label}</label>
      {verified && <Icon name="check2" size={11} color="var(--mc-verified)" strokeWidth={2.4} />}
    </div>
    <div style={{
      padding: compact ? '8px 12px' : '10px 14px',
      background: 'var(--mc-canvas)',
      border: '1px solid var(--mc-line)',
      borderRadius: 8,
      fontSize: compact ? 12.5 : 13.5,
      color: 'var(--mc-ink-900)',
      fontWeight: 500,
    }}>{value}</div>
  </div>
);

const DataRow = ({ name, meta, tone }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px',
    background: 'var(--mc-canvas)',
    border: '1px solid var(--mc-line)',
    borderRadius: 10,
  }}>
    <Icon name="file" size={16} color={tone === 'risk' ? 'var(--mc-risk)' : 'var(--mc-ink-400)'} />
    <div style={{ flex: 1 }}>
      <div className="mc-mono" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--mc-ink-900)' }}>{name}</div>
      <div style={{ fontSize: 11.5, color: 'var(--mc-ink-500)', marginTop: 1 }}>{meta}</div>
    </div>
    {tone === 'good'
      ? <Badge tone="good" icon="check2">Loaded</Badge>
      : <Badge tone="bad" icon="warn">Required</Badge>}
  </div>
);

const ReadinessRow = ({ label, score, note }) => {
  const tone = score >= 90 ? 'var(--mc-verified)' : score >= 60 ? 'var(--mc-teal-500)' : 'var(--mc-draft)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, color: 'var(--mc-ink-700)', fontWeight: 500 }}>{label}</span>
        <span className="mc-mono" style={{ fontSize: 11.5, color: tone, fontWeight: 600 }}>{score}/100</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--mc-line-soft)', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: tone, borderRadius: 2 }} />
      </div>
      {note && <div style={{ fontSize: 11, color: 'var(--mc-draft)', marginTop: 4 }}>{note}</div>}
    </div>
  );
};

Object.assign(window, { ScreenLaunch });
