// screen-tokens.jsx — design system reference card: colors, type, components

const ScreenTokens = () => (
  <div className="mc" style={{
    padding: '40px 48px', background: 'var(--mc-paper)', minHeight: '100%',
  }}>
    <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* HEADER */}
      <div>
        <div className="mc-eyebrow">Design system · v2</div>
        <h1 style={{ marginTop: 8, fontSize: 36, fontFamily: 'var(--mc-font-serif)', fontWeight: 500, letterSpacing: -0.02 }}>
          MedCore — visual language
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--mc-ink-500)', maxWidth: 720 }}>
          Editorial medical-tech. Plus Jakarta Sans for display moments, Inter for product surfaces,
          Newsreader serif for manuscript text and hero numerals, IBM Plex Mono for data and citations.
          Every content surface carries a provenance chip — Verified, AI-drafted, or You.
        </p>
      </div>

      {/* COLOR */}
      <section>
        <SectionTitle>Color</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <ColorScale name="Medical blue · primary" tokens={[
            ['mc-blue-50',  '#EEF5FB'], ['mc-blue-100', '#D8E7F4'], ['mc-blue-300', '#7DAED5'],
            ['mc-blue-500', '#0E6BA8'], ['mc-blue-700', '#084367'], ['mc-blue-900', '#042234'],
          ]} hero={3} />
          <ColorScale name="Teal · accent" tokens={[
            ['mc-teal-50',  '#ECFAF7'], ['mc-teal-100', '#CFF1E9'], ['mc-teal-300', '#5BC2A8'],
            ['mc-teal-500', '#0D9488'], ['mc-teal-700', '#0A6E66'],
          ]} hero={3} />
          <ColorScale name="Paper · neutrals" tokens={[
            ['mc-paper',   '#F4F2EC'], ['mc-canvas',  '#F4F7FB'], ['mc-surface', '#FFFFFF'],
            ['mc-line',    '#E2E8F0'], ['mc-ink-500', '#5A6878'], ['mc-ink-900', '#0F1B2A'],
          ]} />
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="mc-eyebrow" style={{ marginBottom: 10 }}>Semantic · integrity layer</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <SemanticChip name="Verified"   sub="PubMed / Crossref" fg="#047857" bg="#E7F4EC" />
            <SemanticChip name="AI-drafted" sub="Review before using" fg="#B45309" bg="#FBF1DC" />
            <SemanticChip name="You"        sub="User-entered"      fg="#0E6BA8" bg="#E5EFF8" />
            <SemanticChip name="Unverified" sub="Fabrication risk" fg="#BE123C" bg="#FBE7EC" />
          </div>
        </div>
      </section>

      {/* TYPE */}
      <section>
        <SectionTitle>Type</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <TypeSpec
            font="Plus Jakarta Sans" use="Display · headings"
            sample="Reporting-guideline-driven manuscript workspace."
            fz={28} ff="var(--mc-font-display)" fw={600} ls="-0.02em"
          />
          <TypeSpec
            font="Newsreader" use="Editorial · numerals · manuscript body"
            sample="62%  ·  Effect of intermittent fasting on HbA1c"
            fz={28} ff="var(--mc-font-serif)" fw={500} ls="-0.02em" italic={false}
          />
          <TypeSpec
            font="Inter" use="Body · UI text"
            sample="Your draft is saved locally · 2s ago"
            fz={14} ff="var(--mc-font-sans)" fw={500}
          />
          <TypeSpec
            font="IBM Plex Mono" use="Data · DOIs · citations · eyebrows"
            sample="10.1056/NEJMoa2114833 · n=184 · pmid 35443107"
            fz={13} ff="var(--mc-font-mono)" fw={500}
          />
        </div>
      </section>

      {/* COMPONENTS */}
      <section>
        <SectionTitle>Components</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card eyebrow="Buttons" title="Hierarchy">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Button variant="primary"   icon="check2">Primary</Button>
              <Button variant="secondary" icon="download">Secondary</Button>
              <Button variant="teal"      icon="sparkle">Accent</Button>
              <Button variant="ghost"     icon="arrow">Ghost</Button>
              <Button variant="quiet"     icon="refresh">Quiet</Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <Button variant="primary"   size="sm">Small</Button>
              <Button variant="primary"   size="md">Medium</Button>
              <Button variant="primary"   size="lg">Large</Button>
            </div>
          </Card>

          <Card eyebrow="Badges" title="Status">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Badge tone="good"    icon="check2">Complete</Badge>
              <Badge tone="warn"    icon="warn">Review</Badge>
              <Badge tone="bad"     icon="warn">Blocked</Badge>
              <Badge tone="info"    dot>In progress</Badge>
              <Badge tone="neutral" dot>To do</Badge>
              <Badge tone="teal"    icon="sparkle">Recommended</Badge>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              <ProvenanceChip kind="verified" source="PubMed" />
              <ProvenanceChip kind="draft" />
              <ProvenanceChip kind="user" />
              <ProvenanceChip kind="risk" />
            </div>
          </Card>

          <Card eyebrow="Form" title="Field & filter">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="mc-eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Outcome</div>
                <div style={{ padding: '10px 14px', background: 'var(--mc-canvas)',
                  border: '1px solid var(--mc-line)', borderRadius: 8, fontSize: 13.5, fontWeight: 500 }}>
                  Change in HbA1c at 12 weeks
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <PillTabs tabs={['All', 'Verified', 'Partial', 'Unverified']} active="Verified" />
              </div>
            </div>
          </Card>

          <Card eyebrow="Progress" title="Numerals & rings">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between' }}>
              <ProgressRing value={62} size={110} stroke={10} label="readiness" />
              <ProgressRing value={86} size={110} stroke={10} label="quality" accent="var(--mc-teal-500)" />
              <ProgressRing value={42} size={110} stroke={10} label="coverage" accent="var(--mc-draft)" />
            </div>
          </Card>
        </div>
      </section>

      {/* PRINCIPLES FOOTER */}
      <section style={{
        marginTop: 12, padding: '24px 28px',
        background: '#fff',
        border: '1px solid var(--mc-line)',
        borderRadius: 'var(--mc-r-xl)',
        display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 28, alignItems: 'center',
      }}>
        <div className="mc-numeral" style={{ fontSize: 88, color: 'var(--mc-blue-500)', lineHeight: 0.85, fontWeight: 500 }}>
          1k<span style={{ color: 'var(--mc-ink-400)', fontSize: 36 }}> nos</span>
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontFamily: 'var(--mc-font-serif)', fontWeight: 500, letterSpacing: -0.015 }}>
            One thousand no&rsquo;s for every yes.
          </h2>
          <p style={{ marginTop: 4, fontSize: 13.5, color: 'var(--mc-ink-500)', maxWidth: 660, lineHeight: 1.5 }}>
            MedCore refuses to fabricate data, invent citations, or auto-write conclusions.
            Every assistant suggestion is held in a draft state — marked, contained, and rejectable — until a human accepts it.
          </p>
        </div>
      </section>
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14,
  }}>
    <h2 style={{ fontSize: 18, color: 'var(--mc-ink-900)' }}>{children}</h2>
    <div style={{ flex: 1, height: 1, background: 'var(--mc-line)' }} />
  </div>
);

const ColorScale = ({ name, tokens, hero }) => (
  <div style={{
    background: '#fff', border: '1px solid var(--mc-line)', borderRadius: 'var(--mc-r-xl)',
    overflow: 'hidden',
  }}>
    {hero != null && (
      <div style={{
        height: 60, background: tokens[hero][1],
        display: 'flex', alignItems: 'flex-end', padding: 12,
        color: '#fff', fontFamily: 'var(--mc-font-mono)', fontSize: 11, fontWeight: 500,
      }}>{tokens[hero][1]}</div>
    )}
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--mc-ink-900)', marginBottom: 8 }}>{name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tokens.map(([tk, hex]) => (
          <div key={tk} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, background: hex, border: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }} />
            <span className="mc-mono" style={{ flex: 1, color: 'var(--mc-ink-700)' }}>--{tk}</span>
            <span className="mc-mono" style={{ color: 'var(--mc-ink-400)' }}>{hex}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SemanticChip = ({ name, sub, fg, bg }) => (
  <div style={{
    padding: '14px 16px', borderRadius: 14,
    background: bg, border: `1px solid ${fg}33`,
  }}>
    <div style={{ fontSize: 13.5, fontWeight: 700, color: fg }}>{name}</div>
    <div style={{ fontSize: 11.5, color: fg, opacity: 0.75, marginTop: 2 }}>{sub}</div>
    <div className="mc-mono" style={{ fontSize: 10.5, color: fg, marginTop: 10, opacity: 0.7 }}>{fg}</div>
  </div>
);

const TypeSpec = ({ font, use, sample, fz, ff, fw, ls = '0', italic = false }) => (
  <div style={{
    padding: '20px 22px',
    background: '#fff', border: '1px solid var(--mc-line)', borderRadius: 'var(--mc-r-xl)',
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <div className="mc-eyebrow">{use}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mc-ink-900)', marginTop: 3 }}>{font}</div>
      </div>
      <span className="mc-mono" style={{ fontSize: 10.5, color: 'var(--mc-ink-400)' }}>{fz}px / {fw}</span>
    </div>
    <div style={{
      fontFamily: ff, fontSize: fz, fontWeight: fw, letterSpacing: ls,
      fontStyle: italic ? 'italic' : 'normal',
      color: 'var(--mc-ink-900)', lineHeight: 1.3,
    }}>
      {sample}
    </div>
  </div>
);

Object.assign(window, { ScreenTokens });
