// screen-title-lab.jsx — PICO inputs → title candidates → novelty scan + 7-dim rubric

const ScreenTitleLab = () => (
  <div className="mc" style={{ display: 'flex', minHeight: '100%', background: 'var(--mc-canvas)' }}>
    <Sidebar active="title" />

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <TopBar
        title="Effect of intermittent fasting on HbA1c in T2DM"
        breadcrumb={['Manuscript', 'Title Lab']}
      />

      <div style={{ flex: 1, padding: '24px 36px 40px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* HEADER */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div className="mc-eyebrow">Manuscript · Title</div>
              <h1 style={{ marginTop: 4, fontSize: 24 }}>Title Lab</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <PillTabs tabs={['Candidates', 'Novelty scan', 'Style check']} active="Novelty scan" />
              <Button variant="primary" icon="sparkle">Generate variants</Button>
            </div>
          </div>

          {/* PICO INPUTS — compact horizontal row */}
          <Card padding={18}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 12, alignItems: 'flex-end' }}>
              <PicoInput letter="P" label="Population"   value="Adults with T2DM" />
              <PicoInput letter="I" label="Intervention" value="Intermittent fasting (16:8)" />
              <PicoInput letter="C" label="Comparator"   value="Standard counselling" />
              <PicoInput letter="O" label="Outcome"      value="HbA1c at 12 weeks" />
              <Button variant="secondary" icon="refresh" size="md">Re-run</Button>
            </div>
          </Card>

          {/* 2-COL: candidates (left, 1.2fr) + novelty scan (right, 1fr) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>

            {/* CANDIDATES */}
            <Card eyebrow="Candidates" title="Generated titles" padding={0}
              trailing={<Badge tone="neutral">6 variants</Badge>}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <TitleCandidate
                  rank={1} score={86} selected
                  text="Time-restricted eating reduces HbA1c in adults with type 2 diabetes: a 12-week randomized trial"
                  tags={['CONSORT', '15 words', 'declarative']}
                />
                <TitleCandidate
                  rank={2} score={81}
                  text="A 12-week randomized trial of intermittent fasting versus standard counselling for glycemic control in type 2 diabetes"
                  tags={['CONSORT', '19 words', 'methods-first']}
                />
                <TitleCandidate
                  rank={3} score={74}
                  text="Glycemic effects of 16:8 time-restricted eating in adults with type 2 diabetes: a randomized controlled trial"
                  tags={['CONSORT', '17 words', 'mechanistic']}
                />
                <TitleCandidate
                  rank={4} score={68}
                  text="Does intermittent fasting improve HbA1c in type 2 diabetes? Findings from the FAST-T2D randomized trial"
                  tags={['question', '15 words', 'branded']}
                />
                <TitleCandidate
                  rank={5} score={62}
                  text="Intermittent fasting and diabetes: a randomized trial of glycemic outcomes"
                  tags={['terse', '10 words', 'low-specificity']}
                  warn="Drops the 12-week duration — referees may flag specificity."
                />
              </div>
            </Card>

            {/* NOVELTY SCAN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* 7-dim rubric */}
              <Card eyebrow="Selected title · scored" title="Quality rubric"
                trailing={<div className="mc-numeral" style={{ fontSize: 32, color: 'var(--mc-blue-500)', fontWeight: 500 }}>86<span style={{ fontSize: 14, color: 'var(--mc-ink-400)' }}>/100</span></div>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <RubricRow dim="Specificity"     score={92} />
                  <RubricRow dim="Clarity"         score={90} />
                  <RubricRow dim="Reporting compliance" score={95} />
                  <RubricRow dim="Findability (MeSH)"   score={82} />
                  <RubricRow dim="Brevity"         score={78} />
                  <RubricRow dim="Novelty"         score={71} />
                  <RubricRow dim="Tone"            score={88} />
                </div>
              </Card>

              {/* Novelty scan — similar published titles */}
              <Card eyebrow="Novelty scan · PubMed 2018–2026" title="Similar published titles"
                trailing={<Badge tone="warn" icon="warn">Moderate overlap</Badge>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <SimilarRow
                    sim={0.71}
                    title="Effects of time-restricted eating on glycemic control in type 2 diabetes"
                    venue="JAMA Intern Med · 2023"
                    n="n=137"
                  />
                  <SimilarRow
                    sim={0.64}
                    title="Intermittent fasting and HbA1c reduction in obese adults: a meta-analysis"
                    venue="Diabetes Care · 2022"
                    n="systematic review"
                  />
                  <SimilarRow
                    sim={0.52}
                    title="16:8 time-restricted feeding for prediabetes: pilot RCT"
                    venue="Obesity · 2021"
                    n="n=84"
                  />
                </div>
                <div style={{ marginTop: 12, padding: 12, borderRadius: 10,
                  background: 'var(--mc-blue-50)', border: '1px solid var(--mc-blue-100)',
                  display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Icon name="sparkle" size={14} color="var(--mc-blue-500)" style={{ marginTop: 1 }} />
                  <div style={{ fontSize: 12, color: 'var(--mc-ink-700)', lineHeight: 1.5 }}>
                    Consider emphasizing the <strong>16:8 schedule</strong> and the <strong>community-clinic setting</strong> —
                    both are under-represented in the closest matches.
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── PicoInput ── colored letter chip + field
const PicoInput = ({ letter, label, value }) => {
  const c = { P: 'var(--mc-blue-500)', I: 'var(--mc-teal-500)', C: 'var(--mc-ink-500)', O: 'var(--mc-draft)' }[letter];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 5, background: c, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mc-font-display)',
        }}>{letter}</div>
        <label className="mc-eyebrow" style={{ fontSize: 10 }}>{label}</label>
      </div>
      <div style={{
        padding: '8px 12px', background: 'var(--mc-canvas)',
        border: '1px solid var(--mc-line)', borderRadius: 8,
        fontSize: 13, color: 'var(--mc-ink-900)', fontWeight: 500,
      }}>{value}</div>
    </div>
  );
};

// ── TitleCandidate ── numbered list row, score chip, selectable
const TitleCandidate = ({ rank, score, text, tags, selected, warn }) => (
  <div style={{
    padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
    background: selected ? 'var(--mc-blue-50)' : 'transparent',
    borderTop: rank === 1 ? 'none' : '1px solid var(--mc-line-soft)',
    borderLeft: selected ? '3px solid var(--mc-blue-500)' : '3px solid transparent',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2, minWidth: 40 }}>
      <span className="mc-numeral" style={{ fontSize: 22, color: 'var(--mc-ink-900)', lineHeight: 1, fontWeight: 500 }}>0{rank}</span>
      <span className="mc-mono" style={{ fontSize: 10.5, color: 'var(--mc-blue-500)', fontWeight: 600 }}>{score}/100</span>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--mc-font-serif)', fontSize: 17, lineHeight: 1.35, color: 'var(--mc-ink-900)', fontWeight: 500 }}>
        {text}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {tags.map(t => (
          <span key={t} className="mc-mono" style={{
            fontSize: 10.5, padding: '2px 7px', borderRadius: 4,
            background: 'var(--mc-canvas)', color: 'var(--mc-ink-500)',
            border: '1px solid var(--mc-line)', fontWeight: 500,
          }}>{t}</span>
        ))}
        {selected && <ProvenanceChip kind="user" size="sm" />}
        {!selected && <ProvenanceChip kind="draft" size="sm" />}
      </div>
      {warn && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--mc-draft)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="warn" size={11} color="var(--mc-draft)" strokeWidth={2.2} /> {warn}
        </div>
      )}
    </div>
  </div>
);

// ── RubricRow ── horizontal bar with score
const RubricRow = ({ dim, score }) => {
  const tone = score >= 85 ? 'var(--mc-verified)'
            : score >= 70 ? 'var(--mc-teal-500)'
            : 'var(--mc-draft)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 130, fontSize: 12.5, color: 'var(--mc-ink-700)', fontWeight: 500 }}>{dim}</div>
      <div style={{ flex: 1, height: 6, background: 'var(--mc-line-soft)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: `${score}%`, height: '100%', background: tone, borderRadius: 3 }} />
      </div>
      <div className="mc-mono" style={{ width: 28, textAlign: 'right', fontSize: 11.5, color: tone, fontWeight: 600 }}>{score}</div>
    </div>
  );
};

// ── SimilarRow ── novelty-scan similar-title table row
const SimilarRow = ({ sim, title, venue, n }) => {
  const tone = sim >= 0.7 ? 'var(--mc-risk)' : sim >= 0.55 ? 'var(--mc-draft)' : 'var(--mc-ink-500)';
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '10px 12px',
      background: 'var(--mc-canvas)', borderRadius: 10,
      border: '1px solid var(--mc-line)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 46 }}>
        <span className="mc-numeral" style={{ fontSize: 18, color: tone, fontWeight: 500, lineHeight: 1 }}>
          .{Math.round(sim * 100)}
        </span>
        <span className="mc-mono" style={{ fontSize: 9, color: 'var(--mc-ink-400)', marginTop: 2 }}>SIM</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: 'var(--mc-ink-900)', fontWeight: 500, lineHeight: 1.4 }}>{title}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: 'var(--mc-ink-500)' }}>
          <span style={{ fontFamily: 'var(--mc-font-serif)', fontStyle: 'italic' }}>{venue}</span>
          <span>·</span>
          <span className="mc-mono">{n}</span>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenTitleLab });
