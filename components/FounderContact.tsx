"use client";

import { LogoMark } from "./ui/Logo";
import { IconSpark, IconArrowRight } from "./ui/Icon";

const FOUNDER = {
  name: "Abdulsalam Aleid",
  title: "Founder · MedCore Research Builder",
  bio:
    "MedCore is built by a clinician-engineer who got tired of watching solid research stall on formatting, reference verification, and reporting-checklist nitpicks. The goal is simple: keep the science honest, automate the busywork, and never invent a citation.",
  contactEmail: "kubee3302@gmail.com",
};

export function FounderContact() {
  const subjectSuggest = encodeURIComponent("MedCore — feature suggestion");
  const subjectComplain = encodeURIComponent("MedCore — issue / complaint");
  const subjectContact = encodeURIComponent("MedCore — hello");

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 border-t border-med-line">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-10 md:py-14 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
        <div>
          <div className="eyebrow mb-2">About the founder</div>
          <div className="flex items-center gap-3 mb-3">
            <LogoMark size={42} />
            <div>
              <h3 className="font-display text-xl font-semibold text-med-ink leading-tight">
                {FOUNDER.name}
              </h3>
              <p className="text-[12.5px] text-med-sub">{FOUNDER.title}</p>
            </div>
          </div>
          <p className="text-[13.5px] text-med-inkSoft leading-relaxed max-w-xl">
            {FOUNDER.bio}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="badge-info">
              <IconSpark size={11} /> No fabrication
            </span>
            <span className="badge-info">EQUATOR-aware</span>
            <span className="badge-info">Open APIs only</span>
          </div>
        </div>

        <div className="grid gap-3">
          <ContactCard
            label="Suggest a feature"
            desc="Have an idea, journal, or guideline you want supported? Send a one-liner."
            href={`mailto:${FOUNDER.contactEmail}?subject=${subjectSuggest}`}
            cta="Send suggestion"
            tone="teal"
          />
          <ContactCard
            label="Report a problem"
            desc="Bug, mis-parsed reference, broken export — tell me what broke and I'll fix it."
            href={`mailto:${FOUNDER.contactEmail}?subject=${subjectComplain}`}
            cta="Report issue"
            tone="amber"
          />
          <ContactCard
            label="Just say hello"
            desc="Collaborations, research questions, or general feedback — happy to hear from you."
            href={`mailto:${FOUNDER.contactEmail}?subject=${subjectContact}`}
            cta={FOUNDER.contactEmail}
            tone="indigo"
          />
        </div>
      </div>
    </section>
  );
}

function ContactCard({
  label,
  desc,
  href,
  cta,
  tone,
}: {
  label: string;
  desc: string;
  href: string;
  cta: string;
  tone: "teal" | "amber" | "indigo";
}) {
  const t: Record<typeof tone, string> = {
    teal: "bg-teal-50 text-teal-700 ring-teal-200/60",
    amber: "bg-amber-50 text-amber-700 ring-amber-200/60",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200/60",
  };
  return (
    <a
      href={href}
      className="card lift block hover:border-med-lineStrong transition"
    >
      <div className="p-4 flex gap-3 items-start">
        <span
          className={`inline-flex items-center justify-center h-9 w-9 rounded-xl ring-1 shrink-0 ${t[tone]}`}
        >
          <IconArrowRight size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[13.5px] text-med-ink">{label}</div>
          <p className="text-[12.5px] text-med-sub leading-relaxed mt-0.5">
            {desc}
          </p>
          <div className="mt-1.5 text-[12px] text-med-brand font-medium truncate">
            {cta}
          </div>
        </div>
      </div>
    </a>
  );
}
