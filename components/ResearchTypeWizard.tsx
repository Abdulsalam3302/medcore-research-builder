"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DesignCategory,
  DesignSpec,
  ExpandedNotes,
  FeatureCategory,
  FeatureSpec,
  JournalSpec,
  ManuscriptType,
  ProjectState,
  ResearchTypeAnswersV2,
  ResearchTypeResult,
} from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { InfoHint } from "./ui/InfoHint";
import {
  isManuscriptTypeCompatible,
  manuscriptTypesAllowed,
  recommendFeatures,
  type FeatureRecommendation,
} from "@/lib/alignment";

type RegistryPayload = {
  designs: Array<
    Pick<
      DesignSpec,
      | "id"
      | "category"
      | "name"
      | "shortLabel"
      | "primaryGuideline"
      | "whenToUseChecklist"
      | "manuscriptSections"
      | "supportingDocuments"
      | "commonExtensions"
      | "pitfalls"
      | "legacyGuidelines"
      | "appliesTo"
    >
  >;
  designCategories: { id: DesignCategory; label: string; emoji: string }[];
  journals: JournalSpec[];
  features: FeatureSpec[];
  featureCategories: { id: FeatureCategory; label: string; emoji: string }[];
};

export function ResearchTypeWizard({
  project,
  update,
  onJump,
}: {
  project: ProjectState;
  update: (fn: (p: ProjectState) => ProjectState) => void;
  /** Jump to another workspace lane (e.g. the full Journal Finder). */
  onJump?: (key: string) => void;
}) {
  const answers = project.researchTypeAnswers;
  const [registry, setRegistry] = useState<RegistryPayload | null>(null);
  const [loadingReg, setLoadingReg] = useState(true);
  const [busy, setBusy] = useState<"recommend" | "expand" | "generate-notes" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch("/api/registry")
      .then((r) => r.json())
      .then((d: RegistryPayload) => setRegistry(d))
      .catch(() => setErr("Failed to load registry"))
      .finally(() => setLoadingReg(false));
  }, []);

  function setAns(patch: Partial<ResearchTypeAnswersV2>) {
    update((p) => ({ ...p, researchTypeAnswers: { ...p.researchTypeAnswers, ...patch } }));
  }
  function toggleFeature(id: string) {
    const cur = new Set(answers.featureIds || []);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    setAns({ featureIds: Array.from(cur) });
  }

  async function recommend() {
    if (!answers.designId) {
      setErr("Pick a study design first.");
      return;
    }
    setBusy("recommend");
    setErr(null);
    try {
      const r = await fetch("/api/llm/research-type", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await r.json()) as ResearchTypeResult & { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({ ...p, researchTypeResult: data }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function expandNotes() {
    setBusy("expand");
    setErr(null);
    try {
      const r = await fetch("/api/llm/expand-notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await r.json()) as { expandedNotes?: ExpandedNotes; error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setAns({ expandedNotes: data.expandedNotes });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function aiGenerateNotes() {
    setBusy("generate-notes");
    setErr(null);
    try {
      const r = await fetch("/api/llm/enhance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          field: "research-notes",
          value: answers.notes || "",
          answers,
          hint:
            "Draft a comprehensive 'notes for the assistant' paragraph for a medical research project. Cover PICO (population/intervention/comparator/outcome), setting, country, time period, sample size, data source, ethics, registration, and funding. Use the design and journal context. Where information is missing, write placeholder square-bracket prompts like [author: specify sample size] instead of inventing.",
        }),
      });
      const data = (await r.json()) as {
        value?: string;
        note?: string;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      if (data.value) setAns({ notes: data.value });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  /* ---------- Derived state ---------- */
  const selectedDesign = useMemo(
    () => registry?.designs.find((d) => d.id === answers.designId),
    [registry, answers.designId]
  );
  const selectedJournal = useMemo(
    () => registry?.journals.find((j) => j.id === answers.journalId),
    [registry, answers.journalId]
  );
  const selectedFeatures = useMemo(
    () => registry?.features.filter((f) => answers.featureIds?.includes(f.id)) || [],
    [registry, answers.featureIds]
  );

  /* ---------- Steps ---------- */
  const steps = [
    { id: "design", label: "Design", done: !!answers.designId },
    { id: "type", label: "Manuscript type", done: !!answers.manuscriptType },
    { id: "journal", label: "Journal", done: !!answers.journalId },
    { id: "features", label: "Features", done: (answers.featureIds || []).length > 0 || step >= 4 },
    { id: "notes", label: "Notes", done: !!answers.notes || step >= 5 },
    { id: "review", label: "Review", done: !!project.researchTypeResult },
  ];

  if (loadingReg) {
    return (
      <Card>
        <CardBody>
          <div className="muted flex items-center gap-2">
            <Spinner dark /> Loading guideline registry…
          </div>
        </CardBody>
      </Card>
    );
  }
  if (!registry) {
    return (
      <Card>
        <CardBody>
          <div className="text-med-bad">Registry failed to load. Refresh to retry.</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      {/* Stepper */}
      <Card>
        <CardHeader
          title="Research Type Wizard"
          subtitle="Pick design → manuscript type → journal → features → notes → review. Each step pulls in the right checklist, supporting documents, and journal style automatically."
          right={
            <button
              className="btn-ghost text-med-brand text-xs"
              onClick={() =>
                setAns({
                  designId: "interv.rct.parallel",
                  manuscriptType: "original_investigation",
                  journalId: "bmj",
                  featureIds: ["intervention.tidier", "pp.gripp2", "open.data-sharing"],
                  notes:
                    "Adults aged 18+ with heart failure (NYHA II-III) randomised 1:1 to a structured discharge education programme vs usual care across 6 tertiary teaching hospitals between 2022 and 2024. Primary outcome: 30-day all-cause readmission. Sample size 800. Ethics approved (REC ref 22/045). Registered on ISRCTN.",
                })
              }
            >
              Load demo
            </button>
          }
        />
        <CardBody>
          <Stepper steps={steps} step={step} onJump={setStep} />
        </CardBody>
      </Card>

      {/* STEP 1: DESIGN */}
      {step === 0 && (
        <DesignPicker
          registry={registry}
          selectedId={answers.designId}
          onSelect={(id) => {
            const newDesign = registry.designs.find((d) => d.id === id);
            const newCat = newDesign?.category;
            const stillCompatible = isManuscriptTypeCompatible(newCat, answers.manuscriptType);
            setAns({
              designId: id,
              ...(stillCompatible ? {} : { manuscriptType: undefined }),
            });
            setStep(1);
          }}
          selected={selectedDesign}
        />
      )}

      {/* STEP 2: MANUSCRIPT TYPE */}
      {step === 1 && (
        <ManuscriptTypePicker
          journal={selectedJournal}
          design={selectedDesign}
          selected={answers.manuscriptType}
          onSelect={(t) => {
            setAns({ manuscriptType: t });
            setStep(2);
          }}
          onBack={() => setStep(0)}
        />
      )}

      {/* STEP 3: JOURNAL */}
      {step === 2 && (
        <JournalPicker
          journals={registry.journals}
          selectedId={answers.journalId}
          onSelect={(id) => {
            setAns({ journalId: id });
            setStep(3);
          }}
          onBack={() => setStep(1)}
          onOpenFinder={onJump ? () => onJump("journal-finder") : undefined}
        />
      )}

      {/* STEP 4: FEATURES */}
      {step === 3 && (
        <FeaturesPicker
          registry={registry}
          selectedIds={answers.featureIds || []}
          onToggle={toggleFeature}
          onContinue={() => setStep(4)}
          onBack={() => setStep(2)}
          designId={answers.designId}
          manuscriptType={answers.manuscriptType}
          notes={answers.notes}
          onApplyAll={(ids) => setAns({ featureIds: Array.from(new Set([...(answers.featureIds || []), ...ids])) })}
        />
      )}

      {/* STEP 5: NOTES */}
      {step === 4 && (
        <NotesEditor
          notes={answers.notes || ""}
          onChange={(t) => setAns({ notes: t })}
          expanded={answers.expandedNotes}
          onExpand={expandNotes}
          onAIGenerate={aiGenerateNotes}
          busy={busy === "expand"}
          generating={busy === "generate-notes"}
          err={err}
          onContinue={() => setStep(5)}
          onBack={() => setStep(3)}
          onApplyClarification={(q, a) => {
            const e = answers.expandedNotes || { confidence: "medium" as const };
            const newNotes = (answers.notes || "") + `\n${q} ${a}`;
            const remaining = (e.clarifyingQuestions || []).filter((x) => x !== q);
            setAns({
              notes: newNotes,
              expandedNotes: { ...e, clarifyingQuestions: remaining },
            });
          }}
        />
      )}

      {/* STEP 6: REVIEW */}
      {step === 5 && (
        <ReviewStep
          design={selectedDesign}
          journal={selectedJournal}
          features={selectedFeatures}
          answers={answers}
          onBack={() => setStep(4)}
          onRecommend={recommend}
          busy={busy === "recommend"}
          result={project.researchTypeResult}
          err={err}
        />
      )}
    </div>
  );
}

/* ============================================================
   Stepper
   ============================================================ */
function Stepper({
  steps,
  step,
  onJump,
}: {
  steps: { id: string; label: string; done: boolean }[];
  step: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const active = i === step;
        const done = s.done && !active;
        return (
          <button
            key={s.id}
            onClick={() => onJump(i)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm shrink-0 ${
              active
                ? "bg-med-brand text-white"
                : done
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
              active ? "bg-white/20" : done ? "bg-emerald-500 text-white" : "bg-white text-slate-500"
            }`}>{done ? "✓" : i + 1}</span>
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   Step 1 — Design picker (two-level category → specific design)
   ============================================================ */
function DesignPicker({
  registry,
  selectedId,
  onSelect,
  selected,
}: {
  registry: RegistryPayload;
  selectedId?: string;
  onSelect: (id: string) => void;
  selected?: RegistryPayload["designs"][number];
}) {
  const [cat, setCat] = useState<DesignCategory>(
    (selected?.category as DesignCategory) || "interventional"
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registry.designs.filter((d) => d.category === cat);
    return registry.designs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.shortLabel.toLowerCase().includes(q) ||
        d.appliesTo.some((t) => t.includes(q)) ||
        d.primaryGuideline.acronym.toLowerCase().includes(q)
    );
  }, [registry.designs, cat, search]);

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader title="1. Category" subtitle={`${registry.designs.length} designs · ${registry.designCategories.length} categories`} />
          <CardBody>
            <input
              className="input mb-3"
              placeholder="Search any design, guideline, or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <nav className="grid gap-1 max-h-[480px] overflow-y-auto">
              {registry.designCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSearch("");
                    setCat(c.id);
                  }}
                  className={`flex items-center justify-between text-left px-3 py-2 rounded-md text-sm ${
                    cat === c.id && !search
                      ? "bg-med-brand text-white"
                      : "hover:bg-slate-100 text-med-ink"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{c.emoji}</span>
                    <span>{c.label}</span>
                  </span>
                  <span className="text-xs opacity-60">
                    {registry.designs.filter((d) => d.category === c.id).length}
                  </span>
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-1.5">
                2. Specific design
                <InfoHint
                  title="Why design comes first"
                  text="Your study design is the single decision that drives everything downstream: which reporting guideline applies (CONSORT, STROBE, PRISMA…), which statistics are valid, and which causal claims you're allowed to make. Pick it deliberately — changing it later means re-doing the checklist, the analysis plan, and often the title."
                />
              </span>
            }
            subtitle="Each design carries its own checklist, eligibility criteria, supporting documents, and guideline."
          />
          <CardBody className="grid gap-3 max-h-[600px] overflow-y-auto">
            {filtered.length === 0 && <div className="muted">No designs match.</div>}
            {filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelect(d.id)}
                className={`text-left border rounded-lg p-3 transition ${
                  selectedId === d.id
                    ? "border-med-brand bg-sky-50"
                    : "border-med-line hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-med-ink">{d.name}</div>
                    <div className="muted mt-0.5">
                      {d.primaryGuideline.acronym}
                      {d.primaryGuideline.year ? ` · ${d.primaryGuideline.year}` : ""}
                    </div>
                  </div>
                  {d.legacyGuidelines?.some((l) => l.deprecated) && (
                    <Badge kind="info">supersedes {d.legacyGuidelines.find((l) => l.deprecated)?.acronym}</Badge>
                  )}
                </div>
                <div className="text-xs text-med-sub mt-2 line-clamp-2">
                  When to use: {d.whenToUseChecklist.slice(0, 2).join(" · ")}
                </div>
              </button>
            ))}
          </CardBody>
        </Card>
        {selected && <DesignDetail design={selected} />}
      </div>
    </div>
  );
}

function DesignDetail({ design }: { design: RegistryPayload["designs"][number] }) {
  return (
    <Card className="mt-4">
      <CardHeader
        title={design.name}
        subtitle={`${design.primaryGuideline.acronym} ${design.primaryGuideline.year ? `(${design.primaryGuideline.year})` : ""}`}
        right={
          <a
            className="text-med-brand text-xs hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href={design.primaryGuideline.officialUrl}
          >
            Official guideline →
          </a>
        }
      />
      <CardBody className="grid gap-4">
        <Accordion title="Eligibility / 'when to use' criteria" defaultOpen>
          <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
            {design.whenToUseChecklist.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Accordion>
        <Accordion title="Supporting documents you'll need">
          <ul className="text-sm text-med-sub grid gap-2">
            {design.supportingDocuments.map((d) => (
              <li key={d.id} className="border border-med-line rounded p-2">
                <div className="font-medium text-med-ink text-sm">
                  {d.name}
                  {d.url && (
                    <a
                      className="ml-2 text-med-brand hover:underline text-xs"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={d.url}
                    >
                      open →
                    </a>
                  )}
                </div>
                <div className="text-xs mt-0.5">{d.description}</div>
                {d.whenRequired && (
                  <div className="text-[11px] text-med-sub mt-1 italic">{d.whenRequired}</div>
                )}
              </li>
            ))}
          </ul>
        </Accordion>
        <Accordion title="Common extensions / sub-guidelines">
          <ul className="text-sm text-med-sub grid gap-1">
            {design.commonExtensions.map((e, i) => (
              <li key={i} className="border border-med-line rounded p-2">
                <div className="font-medium text-med-ink">{e.acronym} — {e.fullName}</div>
                <div className="text-xs">When: {e.whenToUse}</div>
              </li>
            ))}
            {design.commonExtensions.length === 0 && <div className="muted">No standard extensions.</div>}
          </ul>
        </Accordion>
        <Accordion title="Top reporting pitfalls">
          <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
            {design.pitfalls.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
            {design.pitfalls.length === 0 && <div className="muted">—</div>}
          </ul>
        </Accordion>
      </CardBody>
    </Card>
  );
}

/* ============================================================
   Step 2 — Manuscript type
   ============================================================ */
function ManuscriptTypePicker({
  journal,
  design,
  selected,
  onSelect,
  onBack,
}: {
  journal?: JournalSpec;
  design?: RegistryPayload["designs"][number];
  selected?: ManuscriptType;
  onSelect: (t: ManuscriptType) => void;
  onBack: () => void;
}) {
  const types: { id: ManuscriptType; label: string; desc: string }[] = [
    { id: "original_investigation", label: "Original investigation / research article", desc: "Full research report (main RCT, cohort, etc.)" },
    { id: "research_letter", label: "Research letter / brief report", desc: "Shorter version with limited word count." },
    { id: "systematic_review", label: "Systematic review / meta-analysis", desc: "Full SR with synthesis." },
    { id: "case_report", label: "Case report", desc: "One patient or small case series." },
    { id: "review", label: "Narrative or scoping review", desc: "Non-systematic review." },
    { id: "protocol", label: "Study protocol", desc: "Pre-conduct plan." },
    { id: "viewpoint", label: "Viewpoint / commentary", desc: "Opinion or perspective piece." },
    { id: "correspondence", label: "Correspondence", desc: "Letter to the editor." },
  ];

  const designCategory = design?.category;
  const allowed = manuscriptTypesAllowed(designCategory);
  const compatible = (id: ManuscriptType) => isManuscriptTypeCompatible(designCategory, id);
  const compatibleTypes = types.filter((t) => compatible(t.id));
  const incompatibleTypes = types.filter((t) => !compatible(t.id));
  const banner =
    designCategory && allowed !== "any" ? (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs p-2">
        <span className="font-semibold">Aligned with your design</span> · only manuscript types compatible
        with <strong>{design?.name}</strong> ({design?.primaryGuideline.acronym}) are enabled. Others are
        hidden to prevent conflicts (e.g., choosing "systematic review" for an observational study).
      </div>
    ) : null;

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            Manuscript type
            <InfoHint
              title="Why this matters"
              text="The manuscript type sets the rules of the format: word limit, abstract structure, figure/table caps, and reference count. Editors desk-reject submissions that ignore these. It also narrows the reporting guideline — a research letter and a full original investigation of the same trial are held to different length and detail expectations."
            />
          </span>
        }
        subtitle="Drives word limits, abstract structure, figure caps, and which guideline applies."
        right={<button className="btn-ghost text-xs" onClick={onBack}>← Back</button>}
      />
      <CardBody className="grid gap-3">
        {banner}
        <div className="grid sm:grid-cols-2 gap-3">
          {compatibleTypes.map((t) => {
            const active = selected === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`text-left border rounded-lg p-3 ${
                  active ? "border-med-brand bg-sky-50" : "border-med-line hover:bg-slate-50"
                }`}
              >
                <div className="font-medium text-med-ink">{t.label}</div>
                <div className="muted mt-1">{t.desc}</div>
                {journal &&
                  journal.manuscriptTypes.find((m) => m.type === t.id) && (
                    <div className="text-xs mt-2 text-med-sub">
                      {journal.name}: {journal.manuscriptTypes.find((m) => m.type === t.id)?.mainTextWordLimit || "—"} words ·
                      {" "}
                      {journal.manuscriptTypes.find((m) => m.type === t.id)?.referencesMax || "—"} refs ·
                      {" "}
                      {journal.manuscriptTypes.find((m) => m.type === t.id)?.displayItemsMax || "—"} display items
                    </div>
                  )}
              </button>
            );
          })}
        </div>
        {incompatibleTypes.length > 0 && designCategory && (
          <details className="mt-1 text-xs">
            <summary className="cursor-pointer text-med-sub">
              {incompatibleTypes.length} manuscript type(s) hidden because they conflict with your design
            </summary>
            <ul className="mt-2 grid gap-1 text-med-sub">
              {incompatibleTypes.map((t) => (
                <li key={t.id} className="border border-med-line rounded p-2 opacity-70">
                  <span className="line-through">{t.label}</span> — incompatible with {design?.name}
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardBody>
    </Card>
  );
}

/* ============================================================
   Step 3 — Journal picker
   ============================================================ */
function JournalPicker({
  journals,
  selectedId,
  onSelect,
  onBack,
  onOpenFinder,
}: {
  journals: JournalSpec[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onOpenFinder?: () => void;
}) {
  const [q, setQ] = useState("");
  const [otherName, setOtherName] = useState("");

  const tierA = journals.filter((j) => j.tier === "A");
  const tierB = journals.filter((j) => j.tier === "B");
  const tierC = journals.filter((j) => j.tier === "C");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return tierA;
    return [...tierA, ...tierB].filter(
      (j) => j.name.toLowerCase().includes(t) || j.publisher.toLowerCase().includes(t) || j.id.includes(t)
    );
  }, [tierA, tierB, q]);

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            Target journal
            <InfoHint
              title="Why pick a journal now"
              text="Choosing the target journal early lets every later step write to its rules — reference style, abstract format, word and figure limits, and the editor/reviewer lens it's known for. Matching scope and audience before you draft reduces avoidable desk rejections and saves a full reformatting pass later."
            />
          </span>
        }
        subtitle="Locks reference style, abstract structure, word limits, figure rules, and reviewer/editor lens for every downstream step."
        right={<button className="btn-ghost text-xs" onClick={onBack}>← Back</button>}
      />
      <CardBody className="grid gap-4">
        {onOpenFinder && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-2xl" aria-hidden>🎯</div>
            <div className="flex-1">
              <div className="font-semibold text-amber-900 text-sm inline-flex items-center gap-1.5">
                Choose your journal in the full Journal Finder
                <InfoHint
                  title="Why use the Journal Finder"
                  text="The Journal Finder is the dedicated Post-Research tool: it compares fit, indexing (WoS SCIE/ESCI, Scopus, PubMed/MEDLINE, DOAJ, Saudi SDL), cost, speed, and predatory-risk signals across journals — far more than a quick pick here. Pick there for a confident, evidence-backed choice; this quick selector only locks a reference/format style for drafting."
                />
              </div>
              <div className="text-[12.5px] text-amber-900/80 mt-0.5">
                Compare indexation, fit, cost, and speed across journals — then your choice flows back here.
              </div>
            </div>
            <button type="button" className="btn-primary shrink-0" onClick={onOpenFinder}>
              Open Journal Finder →
            </button>
          </div>
        )}
        <div className="text-[12px] text-med-sub">
          Or pick a quick style below just to lock a reference/abstract format for drafting:
        </div>
        <input
          className="input"
          placeholder="Search journal or publisher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <section>
          <div className="label">Top medical journals (hand-curated)</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map((j) => (
              <JournalCard key={j.id} j={j} active={selectedId === j.id} onSelect={onSelect} />
            ))}
          </div>
        </section>
        {!q && (
          <section>
            <div className="label">Publisher templates (generic per-publisher style)</div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {tierB.map((j) => (
                <JournalCard key={j.id} j={j} active={selectedId === j.id} onSelect={onSelect} />
              ))}
            </div>
          </section>
        )}
        <section>
          <div className="label">Other journal</div>
          <div className="border border-med-line rounded-lg p-3 grid gap-2">
            <div className="text-xs text-med-sub">
              Paste a journal name. We'll apply an ICMJE-conformant fallback style. Reviewer/editor lenses will be generic.
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="input flex-1 min-w-[200px]"
                placeholder="e.g. Diabetes Care"
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
              />
              <button
                className="btn-primary"
                disabled={!otherName.trim()}
                onClick={() => onSelect(`other:${otherName.trim()}`)}
              >
                Use this journal
              </button>
              <button
                className="btn-secondary"
                onClick={() => onSelect("icmje-generic")}
              >
                Generic ICMJE
              </button>
            </div>
          </div>
        </section>
      </CardBody>
    </Card>
  );
}

function JournalCard({
  j,
  active,
  onSelect,
}: {
  j: JournalSpec;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(j.id)}
      className={`text-left border rounded-lg p-3 transition ${
        active ? "border-med-brand bg-sky-50" : "border-med-line hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium text-med-ink">{j.name}</div>
        <Badge kind="neutral">{j.tier}</Badge>
      </div>
      <div className="muted text-xs mt-0.5">{j.publisher}{j.impactFactor ? ` · IF ${j.impactFactor}` : ""}</div>
      <div className="text-[11px] text-med-sub mt-2 line-clamp-2">{j.scope || j.notes || "—"}</div>
    </button>
  );
}

/* ============================================================
   Step 4 — Features
   ============================================================ */
function FeaturesPicker({
  registry,
  selectedIds,
  onToggle,
  onContinue,
  onBack,
  designId,
  manuscriptType,
  notes,
  onApplyAll,
}: {
  registry: RegistryPayload;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
  designId?: string;
  manuscriptType?: string;
  notes?: string;
  onApplyAll: (ids: string[]) => void;
}) {
  const [mode, setMode] = useState<"recommended" | "expert">("recommended");
  const [search, setSearch] = useState("");

  const recommendations: FeatureRecommendation[] = useMemo(
    () =>
      recommendFeatures({
        designId,
        manuscriptType,
        notes,
        features: registry.features as unknown as FeatureSpec[],
      }),
    [registry.features, designId, manuscriptType, notes]
  );
  const core = recommendations.filter((r) => r.tier === "core");
  const reco = recommendations.filter((r) => r.tier === "recommended");
  const recommendedIds = useMemo(
    () => new Set(recommendations.map((r) => r.feature.id)),
    [recommendations]
  );

  const expertFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (registry.features as FeatureSpec[]).filter(
      (f) =>
        !recommendedIds.has(f.id) &&
        (!q ||
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          (f.addExtensions || []).some((e) => e.acronym.toLowerCase().includes(q)))
    );
  }, [registry.features, recommendedIds, search]);

  function applyAll() {
    onApplyAll(recommendations.map((r) => r.feature.id));
  }
  function applyCoreOnly() {
    onApplyAll(core.map((r) => r.feature.id));
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            Special features
            <InfoHint
              title="What features are — and how to use them"
              text={
                "Each feature is a recognised reporting-guideline extension or method (e.g. TIDieR for intervention detail, CONSORT-PRO for patient-reported outcomes, STARD for diagnostic accuracy, TRIPOD+AI for prediction models). Turning one on does three things: (1) its checklist items and supporting documents are added to your package, (2) its agent-hints are injected into every draft and into the Review & Improve swarm, and (3) it appears as a dedicated reviewer lens. Every feature shown is evidence-backed: each card carries a concrete example of use and a live link to the published articles that actually used it, so you can see how it's applied. Guidelines still under development are clearly badged 'forthcoming' and make no published-use claim. How to use: open a card, read the example of use, click 'See published articles using this' to study real exemplars, then enable the ones that fit your study."
              }
            />
          </span>
        }
        subtitle="Features attach reporting-guideline extensions, checklist items, supporting documents, and agent-hints — and feed extra reviewer lenses into Review & Improve. We auto-suggest the most suitable ones for your design, manuscript type, and notes; expert add-ons live in the 'Expert add-ons' tab. Every feature is evidence-backed with an example of use and a live link to published articles that used it."
        right={
          <div className="flex gap-2">
            <button className="btn-ghost text-xs" onClick={onBack}>← Back</button>
            <button className="btn-primary" onClick={onContinue}>Continue</button>
          </div>
        }
      />
      <CardBody className="grid gap-4">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setMode("recommended")}
            className={`pill-tab text-xs ${mode === "recommended" ? "pill-tab-active" : ""}`}
          >
            ⭐ Suggested for you ({recommendations.length})
          </button>
          <button
            onClick={() => setMode("expert")}
            className={`pill-tab text-xs ${mode === "expert" ? "pill-tab-active" : ""}`}
          >
            🧪 Expert add-ons ({expertFeatures.length})
          </button>
          <div className="flex-1" />
          {mode === "recommended" && recommendations.length > 0 && (
            <div className="flex gap-1">
              <button className="btn-ghost text-xs text-med-brand" onClick={applyCoreOnly}>
                Apply core ({core.length})
              </button>
              <button className="btn-secondary text-xs" onClick={applyAll}>
                Apply all suggested
              </button>
            </div>
          )}
        </div>

        {mode === "recommended" ? (
          <div className="grid gap-5">
            {recommendations.length === 0 && (
              <div className="border border-med-line rounded p-4 text-sm text-med-sub">
                Pick a design (and optionally fill in notes) to see suggested features. You can
                always switch to <strong>Expert add-ons</strong> to browse the full catalogue.
              </div>
            )}
            {core.length > 0 && (
              <RecGroup
                title="Core — strongly suggested for this design"
                items={core}
                selectedIds={selectedIds}
                onToggle={onToggle}
                tone="emerald"
              />
            )}
            {reco.length > 0 && (
              <RecGroup
                title="Recommended — likely useful based on your manuscript / notes"
                items={reco}
                selectedIds={selectedIds}
                onToggle={onToggle}
                tone="sky"
              />
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            <input
              className="input"
              placeholder="Search expert add-ons (e.g. 'CHEERS', 'imaging', 'Bayesian')…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {registry.featureCategories.map((c) => {
              const list = expertFeatures.filter((f) => f.category === c.id);
              if (list.length === 0) return null;
              return (
                <section key={c.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>{c.emoji}</span>
                    <div className="text-sm font-semibold text-med-ink">{c.label}</div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {list.map((f) => (
                      <FeatureCardSmall
                        key={f.id}
                        f={f}
                        on={selectedIds.includes(f.id)}
                        onToggle={() => onToggle(f.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            {expertFeatures.length === 0 && (
              <div className="muted text-sm">All features are already in the Suggested list.</div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function RecGroup({
  title,
  items,
  selectedIds,
  onToggle,
  tone,
}: {
  title: string;
  items: FeatureRecommendation[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  tone: "emerald" | "sky";
}) {
  const toneCls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/40"
      : "border-sky-200 bg-sky-50/40";
  return (
    <section>
      <div className="text-sm font-semibold text-med-ink mb-2">{title}</div>
      <div className="grid md:grid-cols-2 gap-2">
        {items.map((rec) => {
          const f = rec.feature;
          const on = selectedIds.includes(f.id);
          return (
            <div
              key={f.id}
              className={`border rounded-lg p-3 transition ${
                on ? "border-med-brand bg-sky-50" : `${toneCls}`
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(f.id)}
                className="text-left w-full"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-med-ink text-sm">{f.name}</div>
                  {on ? (
                    <Badge kind="info">on</Badge>
                  ) : (
                    <Badge kind={tone === "emerald" ? "good" : "info"}>
                      {tone === "emerald" ? "core" : "suggested"}
                    </Badge>
                  )}
                </div>
                <div className="muted text-xs mt-1">{f.description}</div>
                <div className="text-[11px] text-med-sub mt-1 italic">{rec.reason}</div>
                {f.addExtensions && f.addExtensions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {f.addExtensions.map((e, i) => (
                      <Badge key={i} kind="neutral">+ {e.acronym}</Badge>
                    ))}
                  </div>
                )}
              </button>
              <FeatureEvidenceBlock ev={f.evidence} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Verifiable real-world evidence shown under a feature card. */
function FeatureEvidenceBlock({ ev }: { ev?: FeatureSpec["evidence"] }) {
  if (!ev) return null;
  const tone = ev.status === "established" ? "good" : ev.status === "emerging" ? "info" : "warn";
  const label =
    ev.status === "forthcoming"
      ? "forthcoming"
      : ev.status === "emerging"
      ? "emerging · evidence-backed"
      : "evidence-backed";
  return (
    <div className="mt-2 border-t border-med-line/70 pt-2 grid gap-1">
      <div className="flex items-center gap-1.5">
        <Badge kind={tone}>{label}</Badge>
        <span className="text-[10px] uppercase tracking-wide text-med-sub font-semibold">
          Example of use
        </span>
      </div>
      <div className="text-[11px] text-med-sub leading-relaxed">{ev.exampleOfUse}</div>
      {ev.publishedUse && (
        <div className="text-[11px] text-med-ink leading-relaxed">
          <span className="font-medium">Published use: </span>
          <span className="italic">{ev.publishedUse}</span>
        </div>
      )}
      <a
        href={ev.verifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-med-brand hover:underline w-fit"
        onClick={(e) => e.stopPropagation()}
      >
        {ev.status === "forthcoming"
          ? "Guideline status & development →"
          : "See published articles using this →"}
      </a>
    </div>
  );
}

function FeatureCardSmall({
  f,
  on,
  onToggle,
}: {
  f: FeatureSpec;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`border rounded-lg p-3 transition ${
        on ? "border-med-brand bg-sky-50" : "border-med-line"
      }`}
    >
      <button type="button" onClick={onToggle} className="text-left w-full">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-med-ink text-sm">{f.name}</div>
          {on && <Badge kind="info">on</Badge>}
        </div>
        <div className="muted text-xs mt-1">{f.description}</div>
        {f.addExtensions && f.addExtensions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {f.addExtensions.map((e, i) => (
              <Badge key={i} kind="neutral">+ {e.acronym}</Badge>
            ))}
          </div>
        )}
      </button>
      <FeatureEvidenceBlock ev={f.evidence} />
    </div>
  );
}

/* ============================================================
   Step 5 — Notes (with anticipator)
   ============================================================ */
function NotesEditor({
  notes,
  onChange,
  expanded,
  onExpand,
  onAIGenerate,
  busy,
  generating,
  err,
  onContinue,
  onBack,
  onApplyClarification,
}: {
  notes: string;
  onChange: (s: string) => void;
  expanded?: ExpandedNotes;
  onExpand: () => void;
  onAIGenerate: () => void;
  busy: boolean;
  generating: boolean;
  err: string | null;
  onContinue: () => void;
  onBack: () => void;
  onApplyClarification: (q: string, a: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-1.5">
                Notes for the assistant
                <InfoHint
                  title="Why detail pays off here"
                  text="Spell out your PICO (population, intervention/exposure, comparator, outcome) plus setting, dates, sample size, data source, ethics, registration, and funding. The more concrete context you give, the more accurate every downstream draft is — and the assistant will never fill these in for you. Anything missing is flagged as an [author: …] prompt, not invented."
                />
              </span>
            }
            subtitle="Free-text. We'll never invent details; the Expand button structures what you wrote and surfaces clarifying questions."
            right={
              <div className="flex gap-2">
                <button className="btn-ghost text-xs" onClick={onBack}>← Back</button>
                <button className="btn-primary" onClick={onContinue}>Continue</button>
              </div>
            }
          />
          <CardBody className="grid gap-3">
            <textarea
              className="textarea min-h-[260px]"
              placeholder="Population, intervention/exposure, comparator, outcome, setting, time period, sample size, data source, ethics, registration, funding — anything that isn't obvious from your earlier choices."
              value={notes}
              onChange={(e) => onChange(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn-primary"
                onClick={onAIGenerate}
                disabled={generating || busy}
                title="Draft a comprehensive notes paragraph from your design + journal context. No fabrication — missing facts become [author: …] placeholders."
              >
                {generating && <Spinner />} 🤖 AI generate notes
              </button>
              <button className="btn-secondary" onClick={onExpand} disabled={busy || generating || !notes.trim()}>
                {busy && <Spinner dark />} ✨ Expand notes (PICO + conflicts)
              </button>
              <InfoHint
                title="Generate vs Expand"
                text="'AI generate' drafts a structured notes paragraph from your design and journal — useful as a scaffold, but you must verify and replace any [author: …] placeholders. 'Expand' instead parses what you already wrote into PICO fields and flags conflicts with your design (e.g. a comparator that doesn't fit the study type). Both assist your thinking; neither replaces your judgement on the facts."
              />
              {err && <div className="text-sm text-med-bad">{err}</div>}
            </div>
          </CardBody>
        </Card>
      </div>
      <div>
        {expanded ? (
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-1.5">
                  Structured context
                  <InfoHint
                    title="Your PICO, made explicit"
                    text="This breaks your notes into the building blocks every downstream step relies on: population, intervention/exposure, comparator, and outcome (PICO), plus setting, dates, sample size, and governance. Seeing them laid out is a check on your own thinking — if a field is empty or wrong, fix the note now, because the title, methods, and analysis all inherit it. The 'confidence' badge reflects how clearly your notes mapped onto these fields, not whether the facts are correct."
                  />
                </span>
              }
              right={<Badge kind={expanded.confidence === "high" ? "good" : expanded.confidence === "medium" ? "info" : "warn"}>{expanded.confidence}</Badge>}
            />
            <CardBody className="grid gap-2 text-sm">
              <KV k="Population" v={expanded.population} />
              <KV k="Condition" v={expanded.condition} />
              <KV k="Intervention" v={expanded.intervention} />
              <KV k="Exposure" v={expanded.exposure} />
              <KV k="Comparator" v={expanded.comparator} />
              <KV k="Primary outcome" v={expanded.primaryOutcome} />
              <KV k="Secondary outcomes" v={expanded.secondaryOutcomes?.join("; ")} />
              <KV k="Setting" v={expanded.setting} />
              <KV k="Country" v={expanded.country} />
              <KV k="Time period" v={expanded.timePeriod} />
              <KV k="Sample size" v={expanded.sampleSize} />
              <KV k="Data source" v={expanded.dataSource} />
              <KV k="Ethics" v={expanded.ethicsApproval} />
              <KV k="Registration" v={expanded.registration} />
              <KV k="Funding" v={expanded.funding} />
              {expanded.conflictsDetected && expanded.conflictsDetected.length > 0 && (
                <div className="mt-2 border border-amber-200 bg-amber-50 rounded-md p-2">
                  <div className="text-xs font-semibold text-amber-800 mb-1">Conflicts detected</div>
                  <ul className="list-disc list-inside text-xs text-amber-900 space-y-1">
                    {expanded.conflictsDetected.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              {expanded.clarifyingQuestions && expanded.clarifyingQuestions.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold mb-1">Clarifying questions</div>
                  <ul className="grid gap-2 text-xs">
                    {expanded.clarifyingQuestions.map((q, i) => (
                      <li key={i} className="border border-med-line rounded p-2">
                        <div className="text-med-ink mb-1">{q}</div>
                        <div className="flex gap-2">
                          <input
                            className="input text-xs"
                            placeholder="Your answer"
                            value={answers[q] || ""}
                            onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                          />
                          <button
                            className="btn-secondary text-xs"
                            disabled={!answers[q]?.trim()}
                            onClick={() => {
                              onApplyClarification(q, answers[q]);
                              const copy = { ...answers };
                              delete copy[q];
                              setAnswers(copy);
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <div className="muted text-sm">
                Click <strong>Expand notes</strong> to structure what you wrote into PICO-style fields, detect conflicts with your design, and surface clarifying questions.
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-med-sub min-w-[10ch]">{k}:</span>
      <span className="text-med-ink break-words">{v}</span>
    </div>
  );
}

/* ============================================================
   Step 6 — Review (recommend / show result)
   ============================================================ */
function ReviewStep({
  design,
  journal,
  features,
  answers,
  onBack,
  onRecommend,
  busy,
  result,
  err,
}: {
  design?: RegistryPayload["designs"][number];
  journal?: JournalSpec;
  features: FeatureSpec[];
  answers: ResearchTypeAnswersV2;
  onBack: () => void;
  onRecommend: () => void;
  busy: boolean;
  result?: ResearchTypeResult;
  err: string | null;
}) {
  const customJournalName = (answers.journalId || "").startsWith("other:")
    ? answers.journalId!.slice(6)
    : undefined;
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              Review & confirm
              <InfoHint
                title="What 'Build my checklist' does"
                text="This merges your design, manuscript type, journal, and selected features into one tailored package: the matched reporting guideline, a section-by-section checklist, the supporting documents you'll need, and warnings about likely conflicts. It's the blueprint the rest of the workspace writes against — confirm the four choices above are right before you build, since changing them later re-derives everything."
              />
            </span>
          }
          subtitle="Generate the merged checklist, supporting documents, warnings, and journal-aware lenses."
          right={
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" onClick={onBack}>← Back</button>
              <button className="btn-primary" onClick={onRecommend} disabled={busy || !design}>
                {busy && <Spinner />} Build my checklist
              </button>
            </div>
          }
        />
        <CardBody className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="border border-med-line rounded-lg p-3">
            <div className="label">Design</div>
            <div className="font-medium text-med-ink">{design?.name || "—"}</div>
            <div className="muted">{design?.primaryGuideline.acronym} {design?.primaryGuideline.year}</div>
          </div>
          <div className="border border-med-line rounded-lg p-3">
            <div className="label">Manuscript type</div>
            <div className="font-medium text-med-ink">{answers.manuscriptType || "—"}</div>
          </div>
          <div className="border border-med-line rounded-lg p-3">
            <div className="label">Journal</div>
            <div className="font-medium text-med-ink">{journal?.name || customJournalName || answers.journalId || "—"}</div>
            {journal && <div className="muted">{journal.publisher}</div>}
          </div>
          <div className="border border-med-line rounded-lg p-3">
            <div className="label">Special features</div>
            {features.length === 0 ? (
              <div className="muted">None</div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {features.map((f) => (
                  <Badge key={f.id} kind="info">{f.name}</Badge>
                ))}
              </div>
            )}
          </div>
        </CardBody>
        {err && <div className="px-5 pb-4 text-sm text-med-bad">{err}</div>}
      </Card>

      {result && (
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-1.5">
                Recommended guideline & checklist
                <InfoHint
                  title="Why follow the guideline"
                  text="Reporting guidelines like CONSORT, PRISMA, and STROBE are the checklist editors and reviewers use to judge completeness. Following the one matched to your design makes the manuscript easier to review and is associated with smoother acceptance and clearer reporting — many top journals require a completed checklist at submission. It's a quality standard, not a guarantee, but skipping items is a common, avoidable reason for revisions."
                />
              </span>
            }
            subtitle={result.primaryGuidelineName}
            right={<Badge kind="good">{result.requiredSections.length} sections</Badge>}
          />
          <CardBody className="grid gap-4">
            {result.warnings.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
                <div className="font-semibold mb-1 inline-flex items-center gap-1.5">
                  Warnings
                  <InfoHint
                    title="Why read these first"
                    text="These flag mismatches between your choices — for example a manuscript type or feature that doesn't fit the design, or a guideline whose extension you haven't accounted for. They surface conflicts now, while they're cheap to fix, rather than as reviewer comments later. Resolve or consciously accept each one before you start drafting."
                  />
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            {result.notes && <div className="muted text-xs italic">{result.notes}</div>}
            {result.possibleExtensionIds.length > 0 && (
              <Accordion title={`Extensions in play (${result.possibleExtensionIds.length})`}>
                <div className="flex flex-wrap gap-1">
                  {result.possibleExtensionIds.map((e) => (
                    <Badge key={e} kind="neutral">{e}</Badge>
                  ))}
                </div>
              </Accordion>
            )}
            {result.supportingDocuments && result.supportingDocuments.length > 0 && (
              <Accordion title={`Supporting documents needed (${result.supportingDocuments.length})`}>
                <ul className="grid gap-2 text-sm">
                  {result.supportingDocuments.map((d) => (
                    <li key={d.id} className="border border-med-line rounded p-2">
                      <div className="font-medium text-med-ink">
                        {d.name}
                        {d.url && (
                          <a className="ml-2 text-med-brand hover:underline text-xs" target="_blank" rel="noopener noreferrer" href={d.url}>
                            open →
                          </a>
                        )}
                      </div>
                      <div className="text-xs">{d.description}</div>
                      {d.whenRequired && <div className="text-[11px] italic text-med-sub mt-1">{d.whenRequired}</div>}
                    </li>
                  ))}
                </ul>
              </Accordion>
            )}
            <Accordion title="Merged section-by-section checklist" defaultOpen>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(result.sectionChecklists).map(([sec, items]) => (
                  <div key={sec} className="border border-med-line rounded-lg p-3 bg-slate-50">
                    <div className="text-sm font-semibold capitalize mb-1.5 text-med-ink">{sec}</div>
                    <ul className="space-y-1 text-sm text-med-sub list-disc list-inside">
                      {(items as string[]).map((it, i) => <li key={i}>{it}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Accordion>
            {result.pitfalls && result.pitfalls.length > 0 && (
              <Accordion title="Top pitfalls to avoid">
                <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
                  {result.pitfalls.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </Accordion>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   Accordion primitive
   ============================================================ */
function Accordion({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border border-med-line rounded-lg">
      <button
        className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-semibold text-med-ink">{title}</span>
        <span className="text-med-sub text-xs">{open ? "▼" : "▶"}</span>
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}
