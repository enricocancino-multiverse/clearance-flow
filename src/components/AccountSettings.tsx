"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

type SettingsDocument = "privacy" | "terms" | null;

interface Props {
  onCustomizeAccount?: () => void;
}

const documents = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "Information used by ClearanceFlow",
        text: "ClearanceFlow uses account and profile information to provide clearance tracking, campus coordination, and account features. This prototype policy describes intended use and must be reviewed against the final deployment.",
      },
      {
        heading: "How information is used",
        text: "Information may be used to identify your account, display your profile to other campus users, coordinate clearance progress, and maintain the operation and security of the service.",
      },
      {
        heading: "Storage and sharing",
        text: "Some demo features store information in this browser and may not sync across devices. Do not enter sensitive personal information into demo features. A production policy should specify retention, hosting, access controls, and contact details.",
      },
      {
        heading: "Your choices",
        text: "You may update profile details through Customize account. Contact your school administrator for questions about account data or requests to correct information.",
      },
    ],
  },
  terms: {
    title: "Terms and Regulations",
    sections: [
      {
        heading: "Appropriate use",
        text: "Use ClearanceFlow only for legitimate academic and campus coordination. Do not impersonate another user, misuse clearance decisions, or post unlawful, abusive, or confidential information.",
      },
      {
        heading: "Clearance information",
        text: "Clearance statuses are provided to support administrative workflows. Follow official school instructions; an on-screen status or prototype permit notice does not replace an official record or approval.",
      },
      {
        heading: "Account responsibility",
        text: "Keep your sign-in credentials private and notify an administrator if you believe your account has been accessed without permission.",
      },
      {
        heading: "Prototype notice",
        text: "These terms are a mock-up for the application interface, not a legal agreement. The school must review and replace this text before production use.",
      },
    ],
  },
} as const;

export default function AccountSettings({ onCustomizeAccount }: Props) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [document, setDocument] = useState<SettingsDocument>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
        setDocument(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setDocument(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const panelClass = "absolute right-0 top-full z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl shadow-black/40";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setDocument(null);
          setOpen(value => !value);
        }}
        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open settings"
      >
        Settings
      </button>

      {open && (
        <section className={panelClass} role="dialog" aria-label="Settings">
          {document ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setDocument(null)}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  aria-label="Back to settings"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-sm font-bold">{documents[document].title}</h2>
                  <p className="text-[10px] text-amber-400">Mock-up · requires school review</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close settings">×</button>
              </div>
              <div className="custom-scroll max-h-[min(65vh,440px)] space-y-4 overflow-y-auto p-4">
                {documents[document].sections.map(section => (
                  <article key={section.heading}>
                    <h3 className="text-xs font-semibold text-slate-200">{section.heading}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{section.text}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold">Settings</h2>
                  <p className="text-[10px] text-slate-500">Personalize your ClearanceFlow experience</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close settings">×</button>
              </div>

              <div className="p-2">
                <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Appearance</div>
                <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-violet-300" aria-hidden="true">
                      {theme === "dark" ? "☾" : "☼"}
                    </span>
                    <div>
                      <div className="text-xs font-semibold">Theme</div>
                      <div className="text-[10px] text-slate-500">Currently {theme} mode</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggle}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-violet-400 hover:bg-violet-500/10"
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                  >
                    Switch to {theme === "dark" ? "light" : "dark"}
                  </button>
                </div>

                <div className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Account</div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onCustomizeAccount?.();
                  }}
                  disabled={!onCustomizeAccount}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-300" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21a7 7 0 0 1 14 0" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-xs font-semibold">Customize account</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">Edit your profile in Freespace</span>
                  </span>
                  <svg className="ml-auto text-slate-500" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">About</div>
                <button type="button" onClick={() => setDocument("privacy")} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white">
                  Privacy Policy <span className="text-slate-500">›</span>
                </button>
                <button type="button" onClick={() => setDocument("terms")} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white">
                  Terms and Regulations <span className="text-slate-500">›</span>
                </button>
                <p className="px-3 pb-2 pt-1 text-[10px] leading-relaxed text-slate-600">
                  Privacy and terms shown here are mock-ups, not official school policies.
                </p>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
