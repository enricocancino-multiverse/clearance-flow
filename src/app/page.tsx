"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { authApi } from "@/lib/api";
import { ViewType, DeptKey, DEPT_CONFIG } from "@/types";

// ─── Credential Classification (matches backend logic) ────────────────────────

function classify(credential: string): { view: ViewType; dept: DeptKey } {
  const val = credential.trim().toLowerCase();

  // Student ID pattern: YYYY-NNNNN or YYYY-STU-NNN
  if (/^\d{4}-\d{3,6}$/.test(val) || /^\d{4}-stu-\d{3}$/i.test(val)) {
    const last = parseInt(val.slice(-2), 10);
    const depts: DeptKey[] = ["cs", "hm", "crim", "basiced", "tesda"];
    return { view: "student", dept: depts[last % depts.length] };
  }

  // SuperAdmin detection
  if (val.includes("admin") || val === "superadmin") {
    return { view: "superadmin", dept: "cs" };
  }

  // Faculty — email pattern
  const deptMap: Record<string, DeptKey> = {
    cs: "cs",
    hm: "hm",
    crim: "crim",
    bsed: "basiced",
    tvoc: "tesda",
  };
  const prefix = val.split("@")[0].split(".").pop() ?? "";
  const dept = deptMap[prefix] ?? "cs";
  return { view: "faculty", dept };
}

const HINTS = [
  { label: "Student", credential: "2026-STU-001", color: DEPT_CONFIG.cs.color },
  { label: "Faculty", credential: "faculty@clearanceflow.edu", color: DEPT_CONFIG.basiced.color },
  { label: "Admin", credential: "admin@clearanceflow.edu", color: DEPT_CONFIG.tesda.color },
];

export default function Landing() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();
  const { isDark, toggle } = useTheme();

  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [dept, setDept] = useState<DeptKey>("cs");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const detected = credential.trim() ? classify(credential) : null;
  const isStudent = detected?.view === "student";
  const detectedLabel = isStudent
    ? "Student"
    : detected?.view === "faculty"
    ? "Faculty"
    : detected?.view === "superadmin"
    ? "Administrator"
    : null;
  const detectedColor = isStudent
    ? DEPT_CONFIG[dept].color
    : detected?.view === "faculty"
    ? DEPT_CONFIG.basiced.color
    : DEPT_CONFIG.tesda.color;

  const handleLogin = async (credentialOverride?: string, passwordOverride?: string) => {
    const loginCredential = credentialOverride ?? credential;
    const loginPassword = passwordOverride ?? password;

    if (!loginCredential.trim()) {
      setError("Please enter your ID or email.");
      return;
    }
    if (!loginPassword.trim()) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      await login({ credential: loginCredential.trim(), password: loginPassword });
      const { view } = classify(loginCredential);
      // Redirect based on role
      switch (view) {
        case "student":
          router.push("/dashboard/student");
          break;
        case "faculty":
          router.push("/dashboard/faculty");
          break;
        case "superadmin":
          router.push("/dashboard/admin");
          break;
      }
    } catch (err: any) {
      setError(err.message ?? "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (credential: string) => {
    setCredential(credential);
    setPassword("password123");
    setError("");
    setDemoOpen(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setResetMessage("Enter the email you use to sign in.");
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      const result = await authApi.forgotPassword(resetEmail.trim());
      setResetToken(result.reset_token ?? "");
      setResetMessage(result.message + (result.reset_token ? " Your local dev reset token is shown below." : ""));
    } catch (err: any) {
      setResetMessage(err.message ?? "Unable to request a password reset.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim()) {
      setResetMessage("Use the reset token returned by the forgot-password request.");
      return;
    }
    if (!resetPassword.trim() || resetPassword.length < 8) {
      setResetMessage("Choose a new password with at least 8 characters.");
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      const result = await authApi.resetPassword(resetToken, resetPassword);
      setResetMessage(result.message);
      setResetPassword("");
      setResetToken("");
      setResetEmail("");
      setTimeout(() => setShowResetDialog(false), 1200);
    } catch (err: any) {
      setResetMessage(err.message ?? "Unable to reset the password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-geist-sans)" }}>
      {/* Left Panel — Brand & Graph Background */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-slate-950 overflow-hidden flex-col items-center justify-center">
        <GraphBackground />
        <div className="relative z-10 px-16 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="5" cy="12" r="2.5" />
                <circle cx="19" cy="6" r="2.5" />
                <circle cx="19" cy="18" r="2.5" />
                <line x1="7.4" y1="11.1" x2="16.6" y2="7" />
                <line x1="7.4" y1="12.9" x2="16.6" y2="17" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ClearanceFlow</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-3">
            Saint John Bosco College<br />
            <span className="text-blue-400">Clearance System</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xs mx-auto leading-relaxed">
            Graph-powered clearance routing with intelligent dependency resolution and algorithmic scheduling.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {["Kahn's Algorithm", "DAG Traversal", "Priority Queues", "Role-Based Access"].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-8 text-slate-700 text-xs" style={{ fontFamily: "var(--font-geist-mono)" }}>
          v2.4.1 · AY 2026–2027
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md animate-float-in">
          <div className="lg:hidden text-center mb-8">
            <div className="text-2xl font-bold text-slate-900">ClearanceFlow</div>
            <p className="text-sm text-slate-500 mt-1">Saint John Bosco College Clearance System</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">Sign In</h2>
            <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: "var(--font-geist-sans)" }}>
              Enter your credentials — your role is detected automatically.
            </p>

            <div className="space-y-4" style={{ fontFamily: "var(--font-geist-sans)" }}>
              {/* Credential Field with Live Detection */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Student ID or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={credential}
                    onChange={(e) => {
                      setCredential(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="2026-STU-001  or  name@university.edu"
                    className="w-full px-4 py-2.5 rounded-lg border text-sm text-slate-900 placeholder-slate-400 outline-none transition-all pr-32"
                    style={{
                      borderColor: detected ? detectedColor + "88" : "#e2e8f0",
                      boxShadow: detected ? `0 0 0 3px ${detectedColor}18` : "none",
                    }}
                  />
                  {/* Role Badge */}
                  {detectedLabel && (
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-xs font-bold pointer-events-none transition-all"
                      style={{ background: detectedColor + "20", color: detectedColor }}
                    >
                      {detectedLabel}
                    </span>
                  )}
                </div>
                {/* Department Picker — shown only when student ID detected */}
                {isStudent && (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Department</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(Object.entries(DEPT_CONFIG) as [DeptKey, typeof DEPT_CONFIG[DeptKey]][]).map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setDept(k)}
                          className="py-2 rounded-lg text-xs font-bold transition-all duration-150 border"
                          style={
                            dept === k
                              ? { background: v.color, color: "#fff", borderColor: v.color }
                              : { background: "transparent", color: "#94a3b8", borderColor: "#e2e8f0" }
                          }
                          title={v.label}
                        >
                          {v.abbr}
                        </button>
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: DEPT_CONFIG[dept].color }} />
                      <span className="text-xs text-slate-400">{DEPT_CONFIG[dept].label}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                onClick={() => handleLogin()}
                disabled={submitting || authLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-md disabled:opacity-70"
                style={{
                  background: detected
                    ? `linear-gradient(135deg, ${detectedColor}cc, ${detectedColor})`
                    : `linear-gradient(135deg, #1d4ed8, ${DEPT_CONFIG.cs.color})`,
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                {submitting ? "Authenticating…" : "Sign In →"}
              </button>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">G</span>
                  Log in with Gmail
                </button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-[10px] font-bold text-white">f</span>
                  Log in with Facebook
                </button>
              </div>

              <div className="relative mt-4">
                <button
                  type="button"
                  aria-expanded={demoOpen}
                  onClick={() => setDemoOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Demo accounts</p>
                    <p className="mt-0.5 text-xs text-slate-400">Quick sign-in shortcuts</p>
                  </div>
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-all duration-300"
                    style={{ transform: demoOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    ▾
                  </span>
                </button>

                <div
                  className={[
                    "absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-lg transition-all duration-300 ease-out",
                    demoOpen
                      ? "pointer-events-auto max-h-64 translate-y-0 opacity-100"
                      : "pointer-events-none max-h-0 -translate-y-2 opacity-0",
                  ].join(" ")}
                >
                  <div className="space-y-2">
                    {HINTS.map((h) => (
                      <button
                        key={h.label}
                        type="button"
                        onClick={() => handleDemoLogin(h.credential)}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white group"
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: h.color }} />
                        <span className="text-xs font-semibold text-slate-600 w-28 shrink-0">{h.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-500">
                Demo password: <span className="font-semibold text-slate-700">password123</span>
                <span className="block text-[10px] text-slate-400 mt-1">Selected demo accounts auto-fill this password.</span>
              </p>

              <button
                type="button"
                onClick={() => router.push("/developer")}
                className="mt-4 w-full rounded-xl border border-dashed border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
              >
                Open developer view — no sign-in required
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-5" style={{ fontFamily: "var(--font-geist-sans)" }}>
              University Academic Records System · AY 2026-2027
            </p>
          </div>
        </div>
      </div>

      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Reset password</h3>
                <p className="mt-1 text-xs text-slate-500">No domain is required in dev mode — a local reset token is generated instead.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetDialog(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                aria-label="Close reset dialog"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="student@clearanceflow.edu"
                />
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {resetLoading ? "Sending…" : "Send reset token"}
              </button>

              {resetToken && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">Reset token</p>
                  <p className="mt-1 break-all text-xs text-slate-700">{resetToken}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">New password</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {resetLoading ? "Resetting…" : "Reset password"}
              </button>

              {resetMessage && (
                <p className="text-xs text-slate-600">{resetMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GraphBackground() {
  const nodes = [
    { x: 100, y: 100 },
    { x: 280, y: 60 },
    { x: 460, y: 110 },
    { x: 580, y: 60 },
    { x: 60, y: 240 },
    { x: 200, y: 210 },
    { x: 380, y: 250 },
    { x: 540, y: 220 },
    { x: 130, y: 380 },
    { x: 310, y: 350 },
    { x: 480, y: 390 },
    { x: 600, y: 330 },
    { x: 80, y: 510 },
    { x: 240, y: 480 },
    { x: 420, y: 510 },
    { x: 570, y: 470 },
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
    [4, 5],
    [5, 6],
    [6, 7],
    [4, 8],
    [5, 9],
    [6, 10],
    [7, 11],
    [8, 9],
    [9, 10],
    [10, 11],
    [8, 12],
    [9, 13],
    [10, 14],
    [11, 15],
    [12, 13],
    [13, 14],
    [14, 15],
  ];
  const accent = [1, 5, 9, 13];
  const accentColor = DEPT_CONFIG.cs.color;
  const accentColorDark = "#0ea5e9";
  const edgeColor = "#1e3a5f";

  return (
    <div className="absolute inset-0">
      <svg width="100%" height="100%" viewBox="0 0 680 580" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0f2244" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <radialGradient id="accentGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="680" height="580" fill="url(#bgGrad)" />
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={edgeColor} strokeWidth="1" />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            {accent.includes(i) && <circle cx={n.x} cy={n.y} r="22" fill="url(#accentGlow)" />}
            <circle
              cx={n.x}
              cy={n.y}
              r="5"
              fill={accent.includes(i) ? accentColorDark : "#0f2244"}
              stroke={accent.includes(i) ? accentColor : edgeColor}
              strokeWidth={accent.includes(i) ? 1.5 : 1}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}