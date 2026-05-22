// screen-reference-verifier.jsx — paste area + verification table + filter pills

const ScreenReferenceVerifier = () => (
  <div className="mc" style={{ display: 'flex', minHeight: '100%', background: 'var(--mc-canvas)' }}>
    <Sidebar active="refs" />

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <TopBar
        title="Effect of intermittent fasting on HbA1c in T2DM"
        breadcrumb={['Quality', 'References']}
      />

      <div style={{ flex: 1, padding: '24px 36px 40px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* HEADER + summary stats */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div className="mc-eyebrow">Quality · References</div>
              <h1 style={{ marginTop: 4, fontSize: 24 }}>Reference Verifier</h1>
              <p style={{ color: 'var(--mc-ink-500)', fontSize: 13, marginTop: 6, maxWidth: 640 }}>
                Every citation in your manuscript is checked against PubMed, Crossref and DOI resolution.
                Unverified or fabricated-looking references are flagged in red.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 22 }}>
              <SummaryStat value="47" label="total"      tone="neutral" />
              <SummaryStat value="42" label="verified"   tone="good" />
              <SummaryStat value="2"  label="partial"    tone="warn" />
              <SummaryStat value="3"  label="unverified" tone="risk" />
            </div>
          </div>

          {/* PASTE AREA */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--mc-line-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div className="mc-eyebrow">Paste references</div>
                <div style={{ fontSize: 11.5, color: 'var(--mc-ink-500)', marginTop: 2 }}>
                  Accepts Vancouver, APA, BibTeX, RIS, or plain DOIs — one per line.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" size="sm" icon="download">Import .bib</Button>
                <Button variant="primary"   size="sm" icon="check2">Verify all</Button>
              </div>
            </div>
            <div style={{
              padding: '14px 18px',
              fontFamily: 'var(--mc-font-mono)', fontSize: 12, color: 'var(--mc-ink-500)',
              lineHeight: 1.7, background: 'var(--mc-canvas)',
              minHeight: 84,
            }}>
              <span style={{ color: 'var(--mc-ink-900)' }}>10.1001/jamainternmed.2023.4172</span><br />
              <span style={{ color: 'var(--mc-ink-900)' }}>Sutton EF, et al. Early time-restricted feeding...</span><br />
              <span style={{ color: 'var(--mc-ink-400)', fontStyle: 'italic' }}>+ 45 more lines</span>
            </div>
          </Card>

          {/* FILTER PILLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <FilterPill active count={47}>All</FilterPill>
            <FilterPill count={42} icon="check2" tone="good">Verified</FilterPill>
            <FilterPill count={2}  icon="warn"   tone="warn">Partial match</FilterPill>
            <FilterPill count={3}  icon="warn"   tone="bad" pulse>Unverified</FilterPill>
            <FilterPill count={5}  icon="quote"  tone="neutral">Open-access PDF</FilterPill>
            <FilterPill count={1}  icon="warn"   tone="bad">Possible fabrication</FilterPill>
            <div style={{ flex: 1 }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', background: '#fff',
              border: '1px solid var(--mc-line)', borderRadius: 8,
            }}>
              <Icon name="search" size={13} color="var(--mc-ink-400)" />
              <span style={{ fontSize: 12.5, color: 'var(--mc-ink-400)' }}>Search by author, year, journal…</span>
            </div>
          </div>

          {/* TABLE */}
          <Card padding={0} style={{ overflow: 'hidden' }}>
            {/* head */}
            <div style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 130px 130px 130px 110px',
              padding: '10px 18px', gap: 12,
              background: 'var(--mc-canvas)', borderBottom: '1px solid var(--mc-line)',
            }}>
              {['#', 'Reference', 'PubMed', 'Crossref', 'DOI', 'Status'].map((h, i) => (
                <div key={h} className="mc-eyebrow" style={{ fontSize: 10, textAlign: i === 0 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            <RefRow
              n={1}
              authors="Sutton EF, Beyl R, Early KS, et al."
              title="Early time-restricted feeding improves insulin sensitivity in men with prediabetes."
              venue="Cell Metab. 2018;27(6):1212–1221.e3"
              pmid="29754952" cr="ok" doi="10.1016/j.cmet.2018.04.010" status="verified"
            />
            <RefRow
              n={2}
              authors="Patikorn C, Roubal K, Veettil SK, et al."
              title="Intermittent fasting and obesity-related health outcomes: an umbrella review of meta-analyses."
              venue="JAMA Netw Open. 2021;4(12):e2139558"
              pmid="34928392" cr="ok" doi="10.1001/jamanetworkopen.2021.39558" status="verified"
            />
            <RefRow
              n={3}
              authors="Liu D, Huang Y, Huang C, et al."
              title="Calorie restriction with or without time-restricted eating in weight loss."
              venue="N Engl J Med. 2022;386(16):1495–1504"
              pmid="35443107" cr="ok" doi="10.1056/NEJMoa2114833" status="verified"
            />
            <RefRow
              n={4}
              authors="Lowe DA, Wu N, Rohdin-Bibby L, et al."
              title="Effects of time-restricted eating on weight loss and other metabolic parameters in women and men with overweight or obesity."
              venue="JAMA Intern Med. 2020;180(11):1491–1499"
              pmid="32986097" cr="partial" doi="10.1001/jamainternmed.2020.4153" status="partial"
              note="Pages differ between Crossref (1491–1499) and PubMed (1491–9)."
            />
            <RefRow
              n={5}
              authors="Mohammed FR, Al-Tashi MQ."
              title="A 12-week trial of 16:8 fasting in T2DM patients showed dramatic HbA1c reduction at a single Boston clinic."
              venue="J Diabetes Innov. 2024;3(2):88–95"
              pmid="—" cr="missing" doi="10.9999/jdi.2024.0188" status="unverified"
              risk="Possible fabrication — journal not indexed in any database; DOI does not resolve."
            />
            <RefRow
              n={6}
              authors="Carter S, Clifton PM, Keogh JB."
              title="Effect of intermittent compared with continuous energy restricted diet on glycemic control in patients with T2DM."
              venue="JAMA Netw Open. 2018;1(3):e180756"
              pmid="—" cr="ok" doi="10.1001/jamanetworkopen.2018.0756" status="partial"
              note="No PubMed ID returned — verify manually."
            />
            <RefRow
              n={7}
              authors="Varady KA, Cienfuegos S, Ezpeleta M, Gabel K."
              title="Cardiometabolic benefits of intermittent fasting."
              venue="Annu Rev Nutr. 2021;41:333–361"
              pmid="34633860" cr="ok" doi="10.1146/annurev-nutr-052020-041327" status="verified"
            />
          </Card>

          {/* BOTTOM ACTION BAR */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderRadius: 14,
            background: 'var(--mc-risk-bg)',
            border: '1px solid rgba(190,18,60,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="warn" size={18} color="var(--mc-risk)" strokeWidth={2} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mc-risk)' }}>3 references cannot be verified</div>
                <div style={{ fontSize: 12, color: 'var(--mc-ink-700)' }}>
                  Resolve these before export — submission packages with unverified citations are blocked by default.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" icon="eye">Review flagged</Button>
              <Button variant="primary" size="sm" icon="search" style={{ background: 'var(--mc-risk)' }}>Find replacements</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── SummaryStat ── top-right cluster
const SummaryStat = ({ value, label, tone }) => {
  const c = { neutral: 'var(--mc-ink-900)', good: 'var(--mc-verified)', warn: 'var(--mc-draft)', risk: 'var(--mc-risk)' }[tone];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
      <div className="mc-numeral" style={{ fontSize: 28, color: c, lineHeight: 1, fontWeight: 500 }}>{value}</div>
      <div className="mc-eyebrow" style={{ fontSize: 9.5, marginTop: 4 }}>{label}</div>
    </div>
  );
};

// ── FilterPill ── header filter
const FilterPill = ({ active, count, icon, tone, pulse, children }) => {
  const toneFg = { good: 'var(--mc-verified)', warn: 'var(--mc-draft)', bad: 'var(--mc-risk)', neutral: 'var(--mc-ink-500)' }[tone];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '7px 12px', borderRadius: 999,
      background: active ? 'var(--mc-ink-900)' : '#fff',
      color: active ? '#fff' : 'var(--mc-ink-700)',
      border: active ? '1px solid var(--mc-ink-900)' : '1px solid var(--mc-line)',
      fontSize: 12.5, fontWeight: 600,
      position: 'relative',
    }}>
      {icon && <Icon name={icon} size={12} color={active ? '#fff' : toneFg} strokeWidth={2.2} />}
      <span>{children}</span>
      <span className="mc-mono" style={{
        fontSize: 10.5, padding: '1px 6px', borderRadius: 6,
        background: active ? 'rgba(255,255,255,0.15)' : 'var(--mc-canvas)',
        color: active ? 'rgba(255,255,255,0.85)' : toneFg || 'var(--mc-ink-500)',
        fontWeight: 700,
      }}>{count}</span>
      {pulse && (
        <span style={{
          position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4,
          background: 'var(--mc-risk)', border: '2px solid var(--mc-canvas)',
        }} />
      )}
    </div>
  );
};

// ── RefRow ── table row with provenance chips per source
const RefRow = ({ n, authors, title, venue, pmid, cr, doi, status, note, risk }) => {
  const isRisk = status === 'unverified';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '36px 1fr 130px 130px 130px 110px',
      padding: '14px 18px', gap: 12,
      borderTop: '1px solid var(--mc-line-soft)',
      background: isRisk ? 'rgba(190,18,60,0.04)' : 'transparent',
      alignItems: 'flex-start',
    }}>
      <div className="mc-mono" style={{ fontSize: 11.5, color: 'var(--mc-ink-400)', textAlign: 'right', paddingTop: 2 }}>
        {String(n).padStart(2, '0')}
      </div>
      <div>
        <div style={{ fontSize: 12.5, color: 'var(--mc-ink-500)', marginBottom: 2 }}>{authors}</div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--mc-ink-900)', lineHeight: 1.4 }}>
          {title}
        </div>
        <div style={{ fontFamily: 'var(--mc-font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--mc-ink-500)', marginTop: 4 }}>
          {venue}
        </div>
        {note && (
          <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--mc-draft)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="warn" size={11} color="var(--mc-draft)" strokeWidth={2.2} /> {note}
          </div>
        )}
        {risk && (
          <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--mc-risk)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="warn" size={11} color="var(--mc-risk)" strokeWidth={2.4} /> {risk}
          </div>
        )}
      </div>
      <SourceCell label="PubMed"   value={pmid} status={pmid === '—' ? 'missing' : 'ok'} />
      <SourceCell label="Crossref" value={cr === 'ok' ? '✓ matched' : cr === 'partial' ? '⚠ partial' : '✕ no match'} status={cr} />
      <SourceCell label="DOI"      value={doi} status={status === 'unverified' ? 'missing' : 'ok'} />
      <div style={{ paddingTop: 2 }}>
        {status === 'verified' && <ProvenanceChip kind="verified" size="sm" />}
        {status === 'partial'  && <Badge tone="warn" icon="warn">Partial</Badge>}
        {status === 'unverified' && <Badge tone="bad" icon="warn">Unverified</Badge>}
      </div>
    </div>
  );
};

const SourceCell = ({ value, status }) => {
  const col = status === 'ok' ? 'var(--mc-verified)' : status === 'partial' ? 'var(--mc-draft)' : 'var(--mc-risk)';
  return (
    <div style={{ paddingTop: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: col, flexShrink: 0 }} />
      </div>
      <span className="mc-mono" style={{ fontSize: 11, color: 'var(--mc-ink-700)', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
};

Object.assign(window, { ScreenReferenceVerifier });
