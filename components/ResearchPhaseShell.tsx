"use client";

/**
 * Phase accent colours echo the lifecycle nav so a section's header visibly
 * belongs to its stage. Matched by a keyword in the phase label.
 */
function phaseAccent(label: string): { bar: string; eyebrow: string } {
  const l = label.toLowerCase();
  if (l.includes("platform")) return { bar: "from-violet-400 to-violet-600", eyebrow: "text-violet-700" };
  if (l.includes("pre-research")) return { bar: "from-sky-400 to-sky-600", eyebrow: "text-sky-700" };
  if (l.includes("intra")) return { bar: "from-teal-400 to-teal-600", eyebrow: "text-teal-700" };
  if (l.includes("post-research") || l.includes("submission"))
    return { bar: "from-amber-400 to-amber-600", eyebrow: "text-amber-700" };
  if (l.includes("quality") || l.includes("empower"))
    return { bar: "from-fuchsia-400 to-fuchsia-600", eyebrow: "text-fuchsia-700" };
  if (l.includes("post-publication") || l.includes("impact"))
    return { bar: "from-rose-400 to-rose-600", eyebrow: "text-rose-700" };
  return { bar: "from-slate-300 to-slate-400", eyebrow: "text-med-sub" };
}

export function ResearchPhaseShell({
  phaseLabel,
  title,
  subtitle,
  children,
}: {
  phaseLabel: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const accent = phaseAccent(phaseLabel);
  return (
    <div className="grid gap-4">
      <section className="card-elevated overflow-hidden">
        <div className={`h-1 w-full bg-gradient-to-r ${accent.bar}`} aria-hidden />
        <div className="p-5">
          <div className={`eyebrow font-bold ${accent.eyebrow}`}>{phaseLabel}</div>
          <h1 className="display-title">{title}</h1>
          <p className="muted mt-1">{subtitle}</p>
        </div>
      </section>
      {children}
    </div>
  );
}
