"use client";

import { useCallback, useRef } from "react";
import { APP_VERSION } from "@/lib/constants";
import { LogoMark } from "./ui/Logo";
import { IconCheck, IconArrowRight, IconShield } from "./ui/Icon";

const LINKEDIN_URL =
  "https://www.linkedin.com/in/abdulsalam-aleid-mbbs-mba-mim-911446142/";

const PRIVACY_FEATURES = [
  "No mandatory login required",
  "Local draft support available",
  "No patient data collection",
  "Privacy-first workflow",
  "AI-assisted research support",
  "Independent academic platform",
] as const;

type DisclaimerSplashProps = {
  onContinue: () => void;
};

export function DisclaimerSplash({ onContinue }: DisclaimerSplashProps) {
  const disclaimerRef = useRef<HTMLElement>(null);

  const scrollToDisclaimer = useCallback(() => {
    disclaimerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-hero-mesh dark:bg-[linear-gradient(180deg,#0b1220_0%,#111827_100%)] text-med-ink dark:text-slate-100">
      {/* Ambient accents */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute bottom-[-10%] left-[-5%] h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-10 sm:px-6 sm:py-14 lg:py-16">
        {/* Header */}
        <header className="text-center motion-safe:animate-fade-in-up">
          <div className="mb-6 flex justify-center">
            <LogoMark size={44} className="drop-shadow-sm" />
          </div>
          <p className="eyebrow mb-3 dark:text-sky-400">Welcome</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-med-ink dark:text-white sm:text-4xl">
            MedCore Research Builder
          </h1>
          <p className="mt-3 text-base text-med-sub dark:text-slate-300 sm:text-lg">
            AI-assisted academic research workflow platform
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-med-sub dark:text-slate-400">
            Built to support researchers, clinicians, students, and academic teams
            through structured scientific workflows.
          </p>
        </header>

        {/* Disclaimer card */}
        <section
          ref={disclaimerRef}
          id="disclaimer-details"
          className="mt-10 motion-safe:animate-fade-in-up motion-safe:[animation-delay:80ms] motion-safe:[animation-fill-mode:both]"
          aria-labelledby="disclaimer-heading"
        >
          <div className="card-glass dark:bg-white/[0.04] dark:border-white/10 dark:shadow-none overflow-hidden">
            <div className="border-b border-med-line/80 bg-white/50 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-med-brand ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20">
                  <IconShield size={18} />
                </span>
                <h2
                  id="disclaimer-heading"
                  className="font-display text-lg font-semibold text-med-ink dark:text-white"
                >
                  Important Disclaimer
                </h2>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6 text-[14px] leading-relaxed text-med-inkSoft dark:text-slate-300">
              <p>
                MedCore Research Builder is independently developed by{" "}
                <strong className="font-medium text-med-ink dark:text-white">
                  Dr. Abdulsalam Aleid
                </strong>{" "}
                for educational, research support, workflow guidance, and academic
                productivity.
              </p>
              <p>
                The platform helps researchers organize, plan, draft, validate, and
                refine scientific workflows using AI-assisted tools and structured
                methodologies — always with you in control of the final science.
              </p>
              <p>
                Please do not enter personal healthcare data, patient-identifiable
                information, or other sensitive identifiers. MedCore is not a
                clinical record system and does not provide medical advice, legal
                advice, ethical approval, institutional review board approval,
                diagnosis, or clinical decision-making authority.
              </p>
              <p>
                In local draft mode, your manuscript work stays in your browser unless
                you choose to sign in for optional cloud sync. We do not intentionally
                store, sell, or use your activity for external tracking in that mode.
              </p>
              <p>You remain fully responsible for:</p>
              <ul className="list-disc space-y-1.5 pl-5 marker:text-med-brand dark:marker:text-sky-400">
                <li>Data governance and confidentiality</li>
                <li>Ethical and regulatory approvals</li>
                <li>Research integrity and authorship decisions</li>
                <li>Scientific accuracy and journal submission requirements</li>
              </ul>
              <p>
                We encourage you to avoid uploading confidential, sensitive,
                institutional, or otherwise protected information. By continuing, you
                acknowledge that MedCore is provided for guidance and support purposes
                only.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy highlights */}
        <section
          className="mt-6 motion-safe:animate-fade-in-up motion-safe:[animation-delay:160ms] motion-safe:[animation-fill-mode:both]"
          aria-label="Platform privacy highlights"
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            {PRIVACY_FEATURES.map((feature, i) => (
              <div
                key={feature}
                className="flex items-start gap-2.5 rounded-xl border border-med-line/70 bg-white/60 px-3.5 py-3 text-[13px] text-med-inkSoft backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 motion-safe:animate-fade-in-up motion-safe:[animation-fill-mode:both]"
                style={{ animationDelay: `${220 + i * 40}ms` }}
              >
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                  <IconCheck size={12} strokeWidth={2.5} />
                </span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section
          className="mt-8 motion-safe:animate-fade-in-up motion-safe:[animation-delay:280ms] motion-safe:[animation-fill-mode:both]"
          aria-labelledby="contact-heading"
        >
          <div className="rounded-2xl border border-med-line/70 bg-white/50 px-5 py-5 dark:border-white/10 dark:bg-white/[0.03]">
            <h3
              id="contact-heading"
              className="text-[12px] font-semibold uppercase tracking-[0.12em] text-med-sub dark:text-slate-400"
            >
              Suggestions, partnerships, collaborations, or reports
            </h3>
            <p className="mt-2 font-display text-base font-semibold text-med-ink dark:text-white">
              Dr. Abdulsalam Aleid
            </p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-3 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-med-brand transition hover:text-med-brandDark dark:text-sky-400 dark:hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-med-brand/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b1220]"
            >
              <IconLinkedIn size={16} />
              <span>LinkedIn profile</span>
              <IconExternalLink
                size={14}
                className="opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
              />
            </a>
          </div>
        </section>

        {/* Actions */}
        <div
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center motion-safe:animate-fade-in-up motion-safe:[animation-delay:340ms] motion-safe:[animation-fill-mode:both]"
        >
          <button
            type="button"
            onClick={onContinue}
            className="btn-primary w-full rounded-xl px-6 py-3 text-[15px] font-semibold shadow-elevated sm:w-auto sm:min-w-[240px]"
          >
            Continue to Platform
            <IconArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={scrollToDisclaimer}
            className="btn-secondary w-full rounded-xl px-6 py-3 text-[15px] sm:w-auto dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Learn More
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-10 text-center motion-safe:animate-fade-in motion-safe:[animation-delay:420ms] motion-safe:[animation-fill-mode:both]">
          <p className="text-[13px] font-medium text-med-ink dark:text-slate-200">
            Independent AI-assisted research workflow platform
          </p>
          <p className="mt-1.5 text-[12px] text-med-sub dark:text-slate-500">
            Designed for academic productivity, workflow structuring, and research
            support.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-med-subtle dark:text-slate-500">
            <span>MedCore Research Builder</span>
            <span aria-hidden>·</span>
            <span>v{APP_VERSION}</span>
            <span aria-hidden>·</span>
            <span>Open-source · local draft mode</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function IconLinkedIn({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.127 0 2.063 2.063 0 01-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconExternalLink({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}
