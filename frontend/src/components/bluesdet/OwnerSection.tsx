import { useState } from "react";
import { motion } from "motion/react";
import {
  Activity, Archive, Check, Copy, Eye, EyeOff, FileCode2, Lock, RefreshCw,
  ShieldCheck, Unlock,
} from "lucide-react";
import { apiPost } from "@/lib/api";
import { deobfuscateVault } from "@/lib/obfuscate";
import { ServerStatusBanner } from "@/components/bluesdet/ServerStatusBanner";

interface UnlockResponse {
  token: string;
  expires_in: number;
}

interface LogEntry {
  id: string;
  event: string;
  detail: string;
  timestamp: string;
  token_hash?: string;
}

interface ArchivedScript {
  id: string;
  source: string;
  size: number;
  created_at?: string | null;
}

type OwnerTab = "activity" | "scripts" | "deobfuscator";

const PANEL = "scanlines overflow-hidden rounded-md border border-amber-400/20 bg-[#0b0906]";
const INPUT =
  "w-full rounded-sm border border-amber-400/25 bg-[#04060b] px-4 py-2.5 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-400/60 focus:outline-none";
const AMBER_BUTTON =
  "rounded-sm bg-amber-400 px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a1000] transition-colors hover:bg-amber-300 disabled:opacity-50";

export function OwnerSection() {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<OwnerTab>("activity");
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [notify, setNotify] = useState<boolean | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [scripts, setScripts] = useState<ArchivedScript[] | null>(null);
  const [revoked, setRevoked] = useState<Set<string>>(new Set());

  const [deobIn, setDeobIn] = useState("");
  const [deobOut, setDeobOut] = useState<string | null>(null);
  const [deobError, setDeobError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const authed = (t: string) => ({ Authorization: `Bearer ${t}` });

  const refreshAll = async (t: string) => {
    try {
      const res = await fetch("/api/owner/logs", { headers: authed(t) });
      if (res.ok) {
        const data = (await res.json()) as { logs: LogEntry[]; notify: boolean; note?: string };
        setLogs(data.logs);
        setNotify(data.notify);
        setNote(data.note ?? null);
      }
    } catch {
      /* transient */
    }
    try {
      const res = await fetch("/api/scripts", { headers: authed(t) });
      if (res.ok) {
        const data = (await res.json()) as { scripts: ArchivedScript[] };
        setScripts(data.scripts);
      }
    } catch {
      /* archive optional */
    }
  };

  const unlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiPost<UnlockResponse>("/owner/unlock", { code });
      setToken(res.token);
      setCode("");
      await refreshAll(res.token);
    } catch (err) {
      const detail = (err as { body?: { detail?: string } })?.body?.detail;
      setError(
        detail ?? "Unlock endpoint unreachable — owner auth needs the Vercel functions or FastAPI backend.",
      );
    } finally {
      setBusy(false);
    }
  };

  const lock = () => {
    setToken(null);
    setLogs(null);
    setScripts(null);
    setDeobIn("");
    setDeobOut(null);
    setTab("activity");
  };

  const revokeToken = async (hash: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/owner/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authed(token) },
        body: JSON.stringify({ token_hash: hash }),
      });
      if (res.ok) setRevoked((prev) => new Set(prev).add(hash));
    } catch {
      /* ignore */
    }
  };

  const downloadScript = (s: ArchivedScript) => {
    const blob = new Blob([s.source], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bluesdet-${s.id.slice(0, 8)}.lua`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const runDeob = () => {
    setDeobError(null);
    setDeobOut(null);
    const out = deobfuscateVault(deobIn);
    if (out === null) {
      setDeobError("Not a Blues DET output — vault layers and deep-mode strings reverse; renaming and flattening are one-way by design.");
    } else {
      setDeobOut(out);
    }
  };

  const copyDeob = async () => {
    if (!deobOut) return;
    await navigator.clipboard.writeText(deobOut);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const TABS: Array<{ id: OwnerTab; label: string; icon: typeof Activity; count: number | null; testid: string }> = [
    { id: "activity", label: "Activity", icon: Activity, count: logs?.length ?? null, testid: "owner-tab-activity" },
    { id: "scripts", label: "Scripts", icon: Archive, count: scripts?.length ?? null, testid: "owner-tab-scripts" },
    { id: "deobfuscator", label: "Deobfuscator", icon: FileCode2, count: null, testid: "owner-tab-deobfuscator" },
  ];

  return (
    <section id="owner" data-testid="owner-section" className="border-t border-amber-400/15 bg-[#080604]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-400">
            Module 04 // Classified
          </p>
          <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black uppercase tracking-tight text-slate-50 sm:text-4xl">
            Owner's eyes only
          </h2>
        </motion.div>

        <ServerStatusBanner />

        {!token ? (
          <div className={`${PANEL} mx-auto mt-12 max-w-md`} data-testid="owner-locked-card">
            <div className="flex items-center gap-3 border-b border-amber-400/15 px-5 py-4">
              <Lock className="h-4 w-4 text-amber-300" />
              <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
                Restricted area
              </h3>
            </div>
            <div className="space-y-4 px-5 py-6">
              <p className="font-mono text-[11px] leading-relaxed text-slate-400">
                Enter the owner access code to open the command deck: activity log, script archive,
                and the vault deobfuscator. The code lives only in your deployment's environment.
              </p>
              <div className="relative">
                <input
                  data-testid="owner-code-input"
                  type={showCode ? "text" : "password"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && code.trim() && !busy && unlock()}
                  placeholder="Access code"
                  className={`${INPUT} pr-10`}
                  autoComplete="off"
                />
                <button
                  data-testid="owner-code-visibility"
                  onClick={() => setShowCode((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-300"
                  aria-label={showCode ? "Hide code" : "Show code"}
                >
                  {showCode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                data-testid="owner-unlock-button"
                onClick={unlock}
                disabled={busy || !code.trim()}
                className={`${AMBER_BUTTON} flex w-full items-center justify-center gap-2`}
              >
                <Unlock className="h-3.5 w-3.5" />
                {busy ? "Verifying…" : "Unlock"}
              </button>
              {error && (
                <p data-testid="owner-unlock-error" className="font-mono text-[11px] leading-relaxed text-red-300">
                  {error}
                </p>
              )}
              <p className="font-mono text-[10px] leading-relaxed text-slate-600">
                5 wrong codes from one network = 15 minute lockout. Sessions live 30 minutes in
                memory only — closing the tab locks it again.
              </p>
            </div>
          </div>
        ) : (
          <div data-testid="owner-panel" className="mt-12">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-amber-300">
                <ShieldCheck className="h-4 w-4" /> Owner session active · 30 min
              </p>
              <div className="flex items-center gap-2">
                <button
                  data-testid="owner-refresh-button"
                  onClick={() => token && refreshAll(token)}
                  className="flex items-center gap-2 rounded-sm border border-amber-400/30 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300 transition-colors hover:bg-amber-400/10"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
                <button
                  data-testid="owner-lock-button"
                  onClick={lock}
                  className="flex items-center gap-2 rounded-sm border border-amber-400/30 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300 transition-colors hover:bg-amber-400/10"
                >
                  <Lock className="h-3 w-3" /> Lock
                </button>
              </div>
            </div>

            <p
              data-testid="owner-notify-status"
              className={`mb-5 font-mono text-[10px] uppercase tracking-[0.2em] ${notify ? "text-amber-300" : "text-slate-500"}`}
            >
              {notify === null
                ? "Discord notify: —"
                : notify
                  ? "● Discord notify: ON — every event pings your webhook"
                  : "○ Discord notify: OFF — set OWNER_WEBHOOK in your deployment env"}
            </p>
            {note && (
              <p className="mb-5 rounded-sm border border-amber-400/20 bg-amber-400/5 p-3 font-mono text-[11px] leading-relaxed text-slate-400">
                {note}
              </p>
            )}

            <div className="mb-5 flex flex-wrap gap-2" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  data-testid={t.testid}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-sm border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                    tab === t.id
                      ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                      : "border-slate-800 text-slate-500 hover:border-amber-400/30 hover:text-amber-300"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  {t.count !== null && <span className="text-slate-500">({t.count})</span>}
                </button>
              ))}
            </div>

            {tab === "activity" && (
              <div className={PANEL} data-testid="owner-activity-panel">
                <div className="px-5 py-5">
                  {logs === null || logs.length === 0 ? (
                    <p className="font-mono text-[11px] text-slate-500">No events yet.</p>
                  ) : (
                    <ul data-testid="owner-logs-list" className="max-h-96 space-y-2 overflow-y-auto">
                      {logs.map((log, i) => (
                        <li
                          key={log.id}
                          data-testid={`log-row-${i}`}
                          className="rounded-sm border border-amber-400/10 bg-amber-400/5 px-3 py-2.5"
                        >
                          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-amber-300">
                            {log.event}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-slate-400">{log.detail}</p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="font-mono text-[9px] text-slate-600">
                              {log.timestamp.replace("T", " ").slice(0, 19)} UTC
                            </p>
                            {log.token_hash && (
                              <button
                                data-testid={`revoke-button-${i}`}
                                onClick={() => revokeToken(log.token_hash!)}
                                disabled={revoked.has(log.token_hash)}
                                className="rounded-sm border border-red-400/30 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-red-300 transition-colors hover:bg-red-400/10 disabled:border-slate-700 disabled:text-slate-600"
                              >
                                {revoked.has(log.token_hash) ? "Revoked" : "Revoke token"}
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {tab === "scripts" && (
              <div className={PANEL} data-testid="owner-scripts-panel">
                <div className="flex items-center justify-between border-b border-amber-400/15 px-5 py-4">
                  <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
                    Script archive — pre-obfuscation sources
                  </h3>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                    30-day auto-delete
                  </span>
                </div>
                <div className="px-5 py-5">
                  {scripts === null || scripts.length === 0 ? (
                    <p className="font-mono text-[11px] leading-relaxed text-slate-500">
                      No archived sources yet. Every obfuscate submission lands here — on Vercel
                      this tab needs KV storage connected.
                    </p>
                  ) : (
                    <ul data-testid="owner-scripts-list" className="max-h-96 space-y-2 overflow-y-auto">
                      {scripts.map((s, i) => (
                        <li
                          key={s.id}
                          data-testid={`script-row-${i}`}
                          className="flex items-center justify-between gap-3 rounded-sm border border-amber-400/10 bg-amber-400/5 px-3 py-2.5"
                        >
                          <div>
                            <p className="font-mono text-[11px] font-bold text-amber-200">
                              bluesdet-{s.id.slice(0, 8)}.lua
                            </p>
                            <p className="mt-0.5 font-mono text-[9px] text-slate-500">
                              {s.size} bytes{s.created_at ? ` · ${s.created_at.slice(0, 10)}` : ""}
                            </p>
                          </div>
                          <button
                            data-testid={`script-download-${i}`}
                            onClick={() => downloadScript(s)}
                            className="rounded-sm border border-amber-400/30 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-amber-300 transition-colors hover:bg-amber-400/10"
                          >
                            Download .lua
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {tab === "deobfuscator" && (
              <div className={PANEL} data-testid="deobfuscator-panel">
                <div className="px-5 py-5 space-y-4">
                  <textarea
                    data-testid="deob-input"
                    value={deobIn}
                    onChange={(e) => setDeobIn(e.target.value)}
                    rows={7}
                    spellCheck={false}
                    placeholder="Paste Blues DET vault or deep-mode output…"
                    className={`${INPUT} resize-y`}
                  />
                  <button
                    data-testid="deob-run-button"
                    onClick={runDeob}
                    disabled={!deobIn.trim()}
                    className={AMBER_BUTTON}
                  >
                    Deobfuscate
                  </button>
                  {deobError && (
                    <p data-testid="deob-error" className="font-mono text-[11px] leading-relaxed text-red-300">
                      {deobError}
                    </p>
                  )}
                  {deobOut !== null && (
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">
                          Recovered source
                        </p>
                        <button
                          data-testid="deob-copy-button"
                          onClick={copyDeob}
                          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-amber-300"
                        >
                          {copied ? <Check className="h-3 w-3 text-amber-300" /> : <Copy className="h-3 w-3" />}
                          Copy
                        </button>
                      </div>
                      <pre
                        data-testid="deob-output"
                        className="mt-2 max-h-72 overflow-auto rounded-sm border border-amber-400/20 bg-[#04060b] p-4 font-mono text-[11px] leading-relaxed text-amber-100/90"
                      >
                        {deobOut}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
