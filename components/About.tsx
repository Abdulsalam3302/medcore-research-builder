"use client";

import { LogoMark } from "./ui/Logo";
import { Card, CardBody } from "./ui/Card";

const LINKEDIN_URL =
  "https://www.linkedin.com/in/abdulsalam-aleid-mbbs-mba-mim-911446142/";

function Pillar({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>{icon}</span>
          <h3 className="font-semibold text-med-ink">{title}</h3>
        </div>
        <p className="text-[13.5px] text-med-inkSoft leading-relaxed mt-2">{children}</p>
      </CardBody>
    </Card>
  );
}

/** About content — shared by the /about route and the in-app About lane. */
export function About() {
  return (
    <div className="grid gap-6">
      {/* Hero */}
      <Card>
        <CardBody className="text-center py-8">
          <div className="flex justify-center mb-4">
            <LogoMark size={52} className="drop-shadow-sm" />
          </div>
          <h1 className="display-title">
            Med<span className="text-med-brand">Core</span> Research Platform
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-[15px] text-med-sub leading-relaxed">
            A guideline-driven workspace that helps clinicians, students, and research teams
            move from idea to a credible, submission-ready manuscript — with evidence you can
            verify and integrity built into every step.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px]">
            <span className="badge-info">EQUATOR-aligned</span>
            <span className="badge-good">Verify-at-source</span>
            <span className="badge-neutral">No account required</span>
            <span className="badge-brand">Independent & open</span>
          </div>
        </CardBody>
      </Card>

      {/* Mission / Vision */}
      <div className="grid md:grid-cols-2 gap-4">
        <Pillar icon="🎯" title="Our mission">
          To make rigorous, transparent medical research achievable for everyone — by turning
          best-practice reporting standards, trustworthy evidence, and honest AI assistance into
          a clear, step-by-step workflow that raises quality while protecting integrity.
        </Pillar>
        <Pillar icon="🔭" title="Our vision">
          A world where any researcher — regardless of institution, budget, or language — can
          produce work that is accurate, original, and impactful, and where readers can trust
          that what they read was reported honestly and checked against the source.
        </Pillar>
      </div>

      {/* What we stand for */}
      <Card>
        <CardBody>
          <div className="eyebrow">What we stand for</div>
          <h2 className="section-title text-[16px] mt-1">Principles that don&apos;t bend</h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[13.5px] text-med-inkSoft">
            <li>• <strong className="text-med-ink">Never fabricate.</strong> No invented citations, PMIDs, DOIs, or statistics — ever.</li>
            <li>• <strong className="text-med-ink">Verify at the source.</strong> Indexing and metrics link to official records.</li>
            <li>• <strong className="text-med-ink">Human in control.</strong> AI assists; the researcher decides the science.</li>
            <li>• <strong className="text-med-ink">Guideline-first.</strong> Built around CONSORT, PRISMA, STROBE and the EQUATOR family.</li>
            <li>• <strong className="text-med-ink">Privacy by default.</strong> Guest drafts stay in your browser; cloud sync is opt-in.</li>
            <li>• <strong className="text-med-ink">Open & accessible.</strong> Full features with no paywall and no mandatory login.</li>
          </ul>
        </CardBody>
      </Card>

      {/* Founder letter */}
      <Card>
        <CardBody>
          <div className="eyebrow">A letter from the founder</div>
          <h2 className="section-title text-[16px] mt-1">To every researcher using MedCore</h2>
          <div className="mt-3 space-y-3 text-[14px] text-med-inkSoft leading-relaxed">
            <p>
              I built MedCore because I watched too many good ideas stall — not for lack of
              effort, but for lack of structure, access, and honest guidance. A strong study can
              be rejected over avoidable reporting gaps; a new researcher can spend months learning
              what a checklist could have taught in an afternoon.
            </p>
            <p>
              This platform is my attempt to level that field. It won&apos;t write your science for
              you, and it shouldn&apos;t. What it will do is keep you aligned with the standards
              journals expect, surface real evidence you can verify, flag the conflicts and
              overclaims before a reviewer does, and help you say what you mean clearly and
              honestly. Every feature here is built on one rule: <em>assist, never fabricate.</em>
            </p>
            <p>
              Use it freely. Tell me what&apos;s missing. This is a living tool, and your feedback
              shapes where it goes next. Thank you for trusting it with your work — I don&apos;t
              take that lightly.
            </p>
            <p className="pt-1">
              <span className="font-semibold text-med-ink">— Dr. Abdulsalam Aleid</span>
              <span className="block text-[12px] text-med-sub">Founder, MedCore Research Platform</span>
            </p>
          </div>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-[13px] font-medium text-med-brand hover:underline"
          >
            Connect on LinkedIn →
          </a>
        </CardBody>
      </Card>

      {/* Disclaimer */}
      <Card>
        <CardBody>
          <p className="text-[12px] text-med-sub leading-relaxed">
            MedCore is an independent academic-productivity platform. It supports research writing
            and reporting-guideline compliance and does <strong>not</strong> provide medical, legal,
            ethical, or clinical advice, nor ethics/IRB approval. It is independent of the EQUATOR
            Network, NCBI, Crossref, OpenAlex, Clarivate, and Scopus. You remain responsible for
            data governance, approvals, research integrity, and journal requirements.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
