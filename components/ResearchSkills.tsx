"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardBody } from "./ui/Card";
import { Badge, type BadgeKind } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import {
  researchSkills,
  skillsByArea,
  skillCount,
  type ResearchSkill,
  type SkillArea,
  type SkillLevel,
} from "@/lib/knowledge/skills";
import {
  researchTips,
  tipsByCategory,
  type ResearchTip,
  type TipCategory,
} from "@/lib/knowledge/methods";

type Tab = "skills" | "tips";

function levelKind(level: SkillLevel): BadgeKind {
  if (level === "beginner") return "good";
  if (level === "intermediate") return "info";
  return "warn";
}

function evidenceKind(level: ResearchTip["evidenceLevel"]): BadgeKind {
  return level === "established-practice" ? "good" : "info";
}

function titleCase(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ResearchSkills() {
  const [tab, setTab] = useState<Tab>("skills");
  const [query, setQuery] = useState("");
  const [activeArea, setActiveArea] = useState<SkillArea | "all">("all");
  const [activeCategory, setActiveCategory] = useState<TipCategory | "all">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const skillAreas = useMemo(() => {
    const grouped = skillsByArea();
    return (Object.keys(grouped) as SkillArea[]).sort();
  }, []);

  const tipCategories = useMemo(() => {
    const grouped = tipsByCategory();
    return (Object.keys(grouped) as TipCategory[]).sort();
  }, []);

  const totalSkills = skillCount();
  const totalTips = researchTips.length;

  const q = query.trim().toLowerCase();

  const filteredSkills = useMemo(() => {
    return researchSkills.filter((s) => {
      if (activeArea !== "all" && s.area !== activeArea) return false;
      if (!q) return true;
      const hay = [
        s.title,
        s.whatYouLearn,
        s.area,
        s.level,
        ...s.steps,
        ...s.pitfalls,
        ...(s.standards ?? []),
        s.promptTemplate ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeArea, q]);

  const filteredTips = useMemo(() => {
    return researchTips.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [t.title, t.category, t.insight, t.why, t.how, t.evidenceLevel ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeCategory, q]);

  return (
    <Card>
      <CardHeader
        title="Research Skills Library"
        subtitle={
          tab === "skills"
            ? `${totalSkills} skills across ${skillAreas.length} areas`
            : `${totalTips} tips & methods across ${tipCategories.length} categories`
        }
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={tab === "skills" ? "btn-primary" : "btn-secondary"}
              onClick={() => setTab("skills")}
            >
              Skills
            </button>
            <button
              type="button"
              className={tab === "tips" ? "btn-primary" : "btn-secondary"}
              onClick={() => setTab("tips")}
            >
              Tips &amp; Methods
            </button>
          </div>
        }
      />
      <CardBody className="grid gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === "skills"
              ? "Search skills (e.g. CARS, sample size, reviewer response)"
              : "Search tips (e.g. p-value, FAIR, novelty)"
          }
          className="w-full rounded-lg border border-med-line px-3 py-2 text-sm"
          aria-label="Search the research knowledge base"
        />

        {tab === "skills" ? (
          <FilterChips
            options={skillAreas}
            active={activeArea}
            onSelect={(v) => setActiveArea(v as SkillArea | "all")}
            allLabel={`All areas (${totalSkills})`}
          />
        ) : (
          <FilterChips
            options={tipCategories}
            active={activeCategory}
            onSelect={(v) => setActiveCategory(v as TipCategory | "all")}
            allLabel={`All categories (${totalTips})`}
          />
        )}

        {tab === "skills" ? (
          <div className="grid gap-2">
            <div className="text-[12px] text-med-sub">
              Showing {filteredSkills.length} of {totalSkills} skills
            </div>
            {filteredSkills.length === 0 ? (
              <EmptyState />
            ) : (
              filteredSkills.map((s) => (
                <SkillCard
                  key={s.id}
                  skill={s}
                  open={!!expanded[s.id]}
                  onToggle={() => toggle(s.id)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-2">
            <div className="text-[12px] text-med-sub">
              Showing {filteredTips.length} of {totalTips} tips
            </div>
            {filteredTips.length === 0 ? (
              <EmptyState />
            ) : (
              filteredTips.map((t) => (
                <TipCard
                  key={t.id}
                  tip={t}
                  open={!!expanded[t.id]}
                  onToggle={() => toggle(t.id)}
                />
              ))
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function FilterChips({
  options,
  active,
  onSelect,
  allLabel,
}: {
  options: string[];
  active: string;
  onSelect: (value: string) => void;
  allLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={chipClass(active === "all")}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={chipClass(active === opt)}
        >
          {titleCase(opt)}
        </button>
      ))}
    </div>
  );
}

function chipClass(activeState: boolean): string {
  return [
    "text-[12px] rounded-full border px-2.5 py-1 transition-colors",
    activeState
      ? "border-med-ink bg-med-ink text-white"
      : "border-med-line bg-white text-med-sub hover:bg-slate-50",
  ].join(" ");
}

function SkillCard({
  skill,
  open,
  onToggle,
}: {
  skill: ResearchSkill;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-med-line rounded-lg bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3 flex items-start justify-between gap-3"
        aria-expanded={open}
      >
        <div>
          <div className="font-medium text-sm text-med-ink">{skill.title}</div>
          <div className="text-xs text-med-sub mt-0.5">{skill.whatYouLearn}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge kind="neutral">{titleCase(skill.area)}</Badge>
          <Badge kind={levelKind(skill.level)}>{skill.level}</Badge>
        </div>
      </button>

      {open && (
        <div className="border-t border-med-line p-3 grid gap-3 text-sm">
          <Section title="Steps">
            <ol className="list-decimal pl-5 grid gap-1 text-med-inkSoft">
              {skill.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </Section>

          <Section title="Pitfalls to avoid">
            <ul className="list-disc pl-5 grid gap-1 text-med-inkSoft">
              {skill.pitfalls.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </Section>

          {skill.standards && skill.standards.length > 0 && (
            <Section title="Relevant standards">
              <div className="flex flex-wrap gap-1.5">
                {skill.standards.map((std) => (
                  <Badge key={std} kind="info">
                    {std}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {skill.promptTemplate && (
            <Section title="Reusable prompt template">
              <div className="grid gap-2">
                <pre className="whitespace-pre-wrap text-xs bg-slate-50 border border-med-line rounded-lg p-3 text-med-inkSoft">
                  {skill.promptTemplate}
                </pre>
                <div>
                  <CopyButton text={skill.promptTemplate} label="Copy prompt" />
                </div>
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function TipCard({
  tip,
  open,
  onToggle,
}: {
  tip: ResearchTip;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-med-line rounded-lg bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-3 flex items-start justify-between gap-3"
        aria-expanded={open}
      >
        <div>
          <div className="font-medium text-sm text-med-ink">{tip.title}</div>
          <div className="text-xs text-med-sub mt-0.5">{tip.insight}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge kind="neutral">{titleCase(tip.category)}</Badge>
          {tip.evidenceLevel && (
            <Badge kind={evidenceKind(tip.evidenceLevel)}>
              {tip.evidenceLevel === "established-practice" ? "Established" : "Expert view"}
            </Badge>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-med-line p-3 grid gap-3 text-sm">
          <Section title="Why it matters">
            <p className="text-med-inkSoft leading-relaxed">{tip.why}</p>
          </Section>
          <Section title="How to do it">
            <p className="text-med-inkSoft leading-relaxed">{tip.how}</p>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-med-sub mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-sm text-med-sub border border-med-line rounded-lg p-3 bg-slate-50">
      No matches. Try a different search term or clear the filter.
    </div>
  );
}
