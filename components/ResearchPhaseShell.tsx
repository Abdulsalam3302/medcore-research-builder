"use client";

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
  return (
    <div className="grid gap-4">
      <section className="card-elevated">
        <div className="p-5">
          <div className="eyebrow">{phaseLabel}</div>
          <h1 className="display-title">{title}</h1>
          <p className="muted mt-1">{subtitle}</p>
        </div>
      </section>
      {children}
    </div>
  );
}
