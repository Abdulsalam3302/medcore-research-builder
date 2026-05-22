// screen-section-builder.jsx — checklist sidebar + draft area + LLM refine panel

const ScreenSectionBuilder = () => (
  <div className="mc" style={{ display: 'flex', minHeight: '100%', background: 'var(--mc-canvas)' }}>
    <Sidebar active="methods" />

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <TopBar
        title="Effect of intermittent fasting on HbA1c in T2DM"
        breadcrumb={['Manuscript', 'Methods']}
      />

      <div style={{ flex: 1, padding: '20px 28px 28px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid',
          gridTemplateColumns: '260px 1fr 340px', gap: 16, alignItems: 'flex-start' }}>

          {/* ── LEFT: CONSORT coverage checklist ── */}
          <Card padding={0} eyebrow={null} title={null} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--mc-line-soft)' }}>
              <div className="mc-eyebrow">CONSORT 2025 · Methods</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
                <h3 style={{ fontSize: 14.5 }}>Coverage</h3>
                <span className="mc-numeral" style={{ fontSize: 18, color: 'var(--mc-teal-500)', fontWeight: 500 }}>
                  8<span style={{ fontSize: 11, color: 'var(--mc-ink-400)' }}>/11</span>
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--mc-line-soft)', borderRadius: 2, marginTop: 8 }}>
                <div style={{ width: '73%', height: '100%', background: 'var(--mc-teal-500)', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ padding: '6px 8px 10px' }}>
              <ChecklistItem n="6"  label="Trial design"    status="good" />
              <ChecklistItem n="7"  label="Participants"    status="good" />
              <ChecklistItem n="8"  label="Interventions"   status="good" />
              <ChecklistItem n="9"  label="Outcomes"        status="good" active />
              <ChecklistItem n="10" label="Sample size"     status="good" />
              <ChecklistItem n="11" label="Randomization"   status="warn"  note="Sequence generation thin" />
              <ChecklistItem n="12" label="Allocation"      status="good" />
              <ChecklistItem n="13" label="Blinding"        status="good" />
              <ChecklistItem n="14" label="Statistics"      status="todo" />
              <ChecklistItem n="15" label="Safety analysis" status="risk"  note="Awaiting AE data" />
              <ChecklistItem n="16" label="Subgroups"       status="todo" />
            </div>
          </Card>

          {/* ── CENTER: draft editor ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card padding={0} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid var(--mc-line-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div className="mc-eyebrow">Methods · 9</div>
                  <h2 style={{ marginTop: 4 }}>Outcomes</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge tone="good" icon="check2">CONSORT-covered</Badge>
                  <span style={{ fontSize: 11.5, color: 'var(--mc-ink-500)' }}>·</span>
                  <span className="mc-mono" style={{ fontSize: 11.5, color: 'var(--mc-ink-500)' }}>284 words</span>
                </div>
              </div>

              {/* draft body — serif so it reads like manuscript text */}
              <div style={{
                padding: '24px 28px 28px',
                fontFamily: 'var(--mc-font-serif)',
                fontSize: 15.5, lineHeight: 1.7, color: 'var(--mc-ink-900)',
              }}>
                <p style={{ marginBottom: 14 }}>
                  The <Highlight kind="user">primary outcome</Highlight> was the change in glycated
                  hemoglobin (HbA1c) from baseline to week 12, measured by HPLC at the central
                  laboratory and reported as a percentage point difference.
                </p>
                <p style={{ marginBottom: 14 }}>
                  Secondary outcomes included <Highlight kind="user">fasting plasma glucose</Highlight>,
                  body weight, waist circumference, and adherence to the assigned eating window,
                  captured weekly via the participant smartphone log.
                </p>
                <p style={{ marginBottom: 14 }}>
                  <Highlight kind="draft">Patient-reported outcomes were assessed using the validated
                  Diabetes Treatment Satisfaction Questionnaire (DTSQs) at baseline, week 6, and
                  week 12, with higher scores reflecting greater satisfaction</Highlight>
                  <span style={{ fontSize: 11, color: 'var(--mc-draft)', fontFamily: 'var(--mc-font-sans)', fontWeight: 600, marginLeft: 4 }}>
                    [AI · review before using]
                  </span>.
                </p>
                <p style={{ color: 'var(--mc-ink-400)', fontStyle: 'italic' }}>
                  <Highlight kind="risk">Safety outcomes — adverse events, hypoglycemic episodes — pending data upload.</Highlight>
                </p>
                <div style={{
                  marginTop: 18, padding: 12, borderRadius: 10,
                  background: 'var(--mc-blue-50)',
                  fontFamily: 'var(--mc-font-sans)', fontSize: 12.5, color: 'var(--mc-ink-700)',
                  display: 'flex', alignItems: 'center', gap: 10, lineHeight: 1.5,
                }}>
                  <Icon name="plus" size={14} color="var(--mc-blue-500)" />
                  <span>Continue drafting or insert a paragraph…</span>
                </div>
              </div>

              {/* draft toolbar */}
              <div style={{
                padding: '10px 16px', borderTop: '1px solid var(--mc-line-soft)',
                display: 'flex', alignItems: 'center', gap: 6, background: 'var(--mc-canvas)',
              }}>
                <Tool icon="quote" label="Cite" />
                <Tool icon="link"  label="Insert" />
                <Tool icon="chart" label="Figure" />
                <div style={{ width: 1, height: 16, background: 'var(--mc-line)', margin: '0 4px' }} />
                <Tool icon="sparkle" label="AI refine" primary />
                <div style={{ flex: 1 }} />
                <ProvenanceChip kind="verified" source="autosave 7s ago" size="sm" />
              </div>
            </Card>

            {/* inline-banner: missing data */}
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: '#FFF7EE',
              border: '1px solid #F5D5A8',
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <Icon name="warn" size={16} color="var(--mc-draft)" strokeWidth={2} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--mc-ink-900)' }}>Safety analysis section is blocked</div>
                <div style={{ fontSize: 12, color: 'var(--mc-ink-500)' }}>
                  Upload <span className="mc-mono">adverse_events.csv</span> to unlock auto-generated CONSORT safety table.
                </div>
              </div>
              <Button variant="secondary" size="sm" icon="download">Upload data</Button>
            </div>
          </div>

          {/* ── RIGHT: LLM refine panel ── */}
          <Card padding={0} style={{ overflow: 'hidden', position: 'sticky', top: 0 }}>
            <div style={{ padding: '14px 18px 12px', background: 'linear-gradient(180deg, #F5FAFD, #FFFFFF)',
              borderBottom: '1px solid var(--mc-line-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Icon name="sparkle" size={14} color="var(--mc-blue-500)" />
                <div className="mc-eyebrow" style={{ color: 'var(--mc-blue-500)' }}>Refine assistant</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--mc-ink-500)', lineHeight: 1.5 }}>
                Reviews your selection against CONSORT 2025 §9. Suggestions are marked
                <span style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 4px' }}>
                  <ProvenanceChip kind="draft" size="sm" />
                </span>
                until you accept.
              </div>
            </div>

            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <CoverageItem dim="Outcome definition"   score={92} />
              <CoverageItem dim="Measurement method"   score={88} />
              <CoverageItem dim="Time points"          score={84} />
              <CoverageItem dim="Pre-specification"    score={64} warn="Hierarchy not declared" />
              <CoverageItem dim="Adverse events"       score={0}  risk="Missing entirely" />
            </div>

            <div style={{ padding: '0 16px 16px' }}>
              <div className="mc-eyebrow" style={{ marginTop: 6, marginBottom: 8 }}>Suggested edits</div>
              <Suggestion
                title="Clarify hierarchy"
                body="Add: &ldquo;Outcomes were pre-specified in this hierarchy and reported with adjustment for multiplicity.&rdquo;"
              />
              <Suggestion
                title="Add measurement instrument detail"
                body="Specify HPLC method (e.g., Tosoh G8) and intra-assay CV for HbA1c."
              />
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--mc-canvas)',
              borderTop: '1px solid var(--mc-line-soft)', display: 'flex', gap: 8 }}>
              <Button variant="primary" fullWidth icon="check2">Apply all (2)</Button>
              <Button variant="secondary" icon="refresh" size="md" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

// ── Highlight ── provenance-aware text underline
const Highlight = ({ kind, children }) => {
  const c = {
    user:     'rgba(14,107,168,0.20)',
    draft:    'rgba(180,83,9,0.22)',
    risk:     'rgba(190,18,60,0.16)',
    verified: 'rgba(4,120,87,0.22)',
  }[kind];
  return (
    <span style={{
      background: `linear-gradient(180deg, transparent 70%, ${c} 70%, ${c} 96%, transparent 96%)`,
      padding: '0 1px',
    }}>{children}</span>
  );
};

const ChecklistItem = ({ n, label, status, note, active }) => {
  const icon = { good: 'check2', warn: 'warn', risk: 'warn', todo: 'dot' }[status];
  const col  = { good: 'var(--mc-verified)', warn: 'var(--mc-draft)', risk: 'var(--mc-risk)', todo: 'var(--mc-ink-300)' }[status];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '7px 8px', borderRadius: 8,
      background: active ? 'var(--mc-blue-50)' : 'transparent',
    }}>
      <span className="mc-mono" style={{ width: 18, fontSize: 10.5, color: 'var(--mc-ink-400)', textAlign: 'right', paddingTop: 2 }}>{n}</span>
      <div style={{
        width: 16, height: 16, borderRadius: 8, flexShrink: 0,
        background: status === 'todo' ? 'transparent' : col + '22',
        border: status === 'todo' ? `1.5px solid ${col}` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
      }}>
        {status !== 'todo' && <Icon name={icon} size={10} color={col} strokeWidth={2.6} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: active ? 'var(--mc-blue-700)' : 'var(--mc-ink-900)',
          fontWeight: active ? 600 : 500 }}>{label}</div>
        {note && <div style={{ fontSize: 10.5, color: col, marginTop: 1 }}>{note}</div>}
      </div>
    </div>
  );
};

const Tool = ({ icon, label, primary }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 9px', borderRadius: 6,
    background: primary ? 'var(--mc-blue-500)' : 'transparent',
    color: primary ? '#fff' : 'var(--mc-ink-700)',
    fontSize: 12, fontWeight: 600,
  }}>
    <Icon name={icon} size={13} strokeWidth={2} />
    {label}
  </div>
);

const CoverageItem = ({ dim, score, warn, risk }) => {
  const tone = score >= 80 ? 'var(--mc-verified)' : score >= 50 ? 'var(--mc-draft)' : 'var(--mc-risk)';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, color: 'var(--mc-ink-700)', fontWeight: 500 }}>{dim}</span>
        <Badge tone={score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad'}>
          {score >= 80 ? 'Strong' : score >= 50 ? 'Thin' : 'Missing'}
        </Badge>
      </div>
      <div style={{ height: 3, background: 'var(--mc-line-soft)', borderRadius: 2 }}>
        <div style={{ width: `${score}%`, height: '100%', background: tone, borderRadius: 2 }} />
      </div>
      {(warn || risk) && (
        <div style={{ fontSize: 11, color: risk ? 'var(--mc-risk)' : 'var(--mc-draft)', marginTop: 4 }}>
          {warn || risk}
        </div>
      )}
    </div>
  );
};

const Suggestion = ({ title, body }) => (
  <div style={{
    padding: 12, borderRadius: 10, marginBottom: 8,
    background: 'var(--mc-draft-bg)',
    border: '1px solid rgba(180,83,9,0.22)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <Icon name="sparkle" size={11} color="var(--mc-draft)" strokeWidth={2} />
      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--mc-draft)', textTransform: 'uppercase', letterSpacing: 0.05 }}>{title}</span>
    </div>
    <div style={{ fontSize: 12, color: 'var(--mc-ink-700)', lineHeight: 1.5, fontFamily: 'var(--mc-font-serif)', fontStyle: 'italic' }}>{body}</div>
  </div>
);

Object.assign(window, { ScreenSectionBuilder });
