import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Check, Copy, KeyRound, ScanSearch, Webhook } from "lucide-react";
import { apiPost } from "@/lib/api";
import { ServerStatusBanner } from "@/components/bluesdet/ServerStatusBanner";

interface ProtectResponse {
  token: string;
  proxy_url: string;
}

interface InspectInfo {
  id: string;
  name: string;
  channel_id: string;
  guild_id: string;
  avatar: string | null;
}

const LEAK_RE = /https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+/g;
const INSPECT_RE = /discord(?:app)?\.com\/api\/webhooks\/(\d+)\/([\w-]+)/;

const maskUrl = (url: string) => (url.length > 52 ? `${url.slice(0, 44)}…${url.slice(-6)}` : url);

const CARD = "scanlines overflow-hidden rounded-md border border-sky-400/15 bg-[#070b12]";
const INPUT =
  "w-full rounded-sm border border-slate-700 bg-[#04060b] px-4 py-2.5 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-400/60 focus:outline-none";
const SKY_BUTTON =
  "rounded-sm bg-sky-400 px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#03121d] transition-colors hover:bg-sky-300 disabled:opacity-50";
const GHOST_BUTTON =
  "rounded-sm border border-slate-700 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 transition-colors hover:border-sky-400/50 hover:text-sky-300 disabled:opacity-50";

function buildSnippet(proxyUrl: string): string {
  return `-- Roblox / Luau — your real webhook URL never ships
local WEBHOOK = "${proxyUrl}"
local HttpService = game:GetService("HttpService")

request({
  Url = WEBHOOK,
  Method = "POST",
  Headers = { ["Content-Type"] = "application/json" },
  Body = HttpService:JSONEncode({ content = "Hello from a protected hook" }),
})`;
}

export function WebhookProtector() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProtectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [findings, setFindings] = useState<string[] | null>(null);

  const [inspectUrl, setInspectUrl] = useState("");
  const [info, setInfo] = useState<InspectInfo | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState(false);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const protect = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await apiPost<ProtectResponse>("/protect", { url }));
    } catch (err) {
      const detail = (err as { body?: { detail?: string } })?.body?.detail;
      if (detail) {
        setError(detail);
      } else {
        setError(
          "Server functions not reachable on this deployment. If you're on GitHub Pages that's expected — it's static-only. The protector runs on the Vercel deployment (see the Deploy section / VERCEL.md).",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const scan = () => {
    const found = code.match(LEAK_RE) ?? [];
    setFindings(Array.from(new Set(found)));
  };

  const inspect = async () => {
    setInspecting(true);
    setInfo(null);
    setInspectError(null);
    try {
      const m = INSPECT_RE.exec(inspectUrl);
      if (!m) throw new Error("That doesn't look like a Discord webhook URL.");
      const res = await fetch(`https://discord.com/api/webhooks/${m[1]}/${m[2]}`);
      if (!res.ok) throw new Error(`Discord answered ${res.status} — webhook is invalid or deleted.`);
      setInfo((await res.json()) as InspectInfo);
    } catch (err) {
      setInspectError(err instanceof Error ? err.message : "Inspection failed.");
    } finally {
      setInspecting(false);
    }
  };

  return (
    <section id="protector" data-testid="protector-section" className="border-t border-sky-400/10 bg-[#05080d]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-400">
            Module 02 // Webhook protector
          </p>
          <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black uppercase tracking-tight text-slate-50 sm:text-4xl">
            Hide the hook. Keep the signal.
          </h2>
          <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-slate-400">
            Your Discord webhook is encrypted server-side (AES-256-GCM) into an opaque token.
            Scripts call your proxy URL — the real webhook never exists in client code, so it can't
            be leaked, spammed, or deleted out from under you.
          </p>
        </motion.div>

        <ServerStatusBanner />

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className={`${CARD} lg:col-span-7`} data-testid="protect-card">
            <div className="flex items-center gap-3 border-b border-sky-400/10 px-5 py-4">
              <KeyRound className="h-4 w-4 text-sky-300" />
              <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
                Protect a webhook
              </h3>
            </div>
            <div className="space-y-4 px-5 py-5">
              <input
                data-testid="webhook-url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…"
                className={INPUT}
              />
              <button
                data-testid="protect-webhook-button"
                onClick={protect}
                disabled={busy || !url.trim()}
                className={SKY_BUTTON}
              >
                {busy ? "Encrypting…" : "Encrypt & protect"}
              </button>

              {error && (
                <div data-testid="protect-error" className="flex gap-3 rounded-sm border border-amber-400/25 bg-amber-400/5 p-4">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                  <p className="font-mono text-[11px] leading-relaxed text-slate-400">
                    {error} If it mentions WEBHOOK_SECRET, set that env var in your deployment —
                    steps in VERCEL.md.
                  </p>
                </div>
              )}

              {result && (
                <div data-testid="protect-result" className="space-y-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">
                      Protected proxy URL — ship this, not the webhook
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <code
                        data-testid="proxy-url-output"
                        className="flex-1 overflow-x-auto whitespace-nowrap rounded-sm border border-sky-400/20 bg-[#04060b] px-3 py-2 font-mono text-[11px] text-sky-300"
                      >
                        {result.proxy_url}
                      </code>
                      <button
                        data-testid="copy-proxy-url-button"
                        onClick={() => copy(result.proxy_url, "proxy")}
                        className="rounded-sm border border-slate-700 p-2 text-slate-400 transition-colors hover:border-sky-400/50 hover:text-sky-300"
                        aria-label="Copy proxy URL"
                      >
                        {copied === "proxy" ? <Check className="h-3.5 w-3.5 text-sky-300" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">
                        Drop-in usage
                      </p>
                      <button
                        data-testid="copy-snippet-button"
                        onClick={() => copy(buildSnippet(result.proxy_url), "snippet")}
                        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-300"
                      >
                        {copied === "snippet" ? <Check className="h-3 w-3 text-sky-300" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="mt-2 max-h-56 overflow-auto rounded-sm border border-slate-800 bg-[#04060b] p-4 font-mono text-[11px] leading-relaxed text-slate-400">
                      {buildSnippet(result.proxy_url)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-5">
            <div className={CARD} data-testid="leak-scanner-card">
              <div className="flex items-center gap-3 border-b border-sky-400/10 px-5 py-4">
                <ScanSearch className="h-4 w-4 text-sky-300" />
                <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
                  Leak scanner
                </h3>
              </div>
              <div className="space-y-4 px-5 py-5">
                <textarea
                  data-testid="leak-scan-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={5}
                  placeholder="Paste a script before you ship it — find exposed webhook URLs first."
                  className={`${INPUT} resize-y`}
                />
                <button data-testid="scan-leaks-button" onClick={scan} disabled={!code.trim()} className={GHOST_BUTTON}>
                  Scan for exposed hooks
                </button>
                {findings !== null && (
                  <div data-testid="leak-results">
                    {findings.length === 0 ? (
                      <p className="font-mono text-[11px] text-sky-300">Clean — no webhook URLs found.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
                          {findings.length} exposed webhook{findings.length === 1 ? "" : "s"}
                        </p>
                        {findings.map((f, i) => (
                          <div key={f} className="flex items-center justify-between gap-2 rounded-sm border border-red-400/20 bg-red-400/5 px-3 py-2">
                            <span className="truncate font-mono text-[10px] text-slate-400">{maskUrl(f)}</span>
                            <button
                              data-testid={`leak-protect-${i}`}
                              onClick={() => setUrl(f)}
                              className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-sky-300 hover:text-sky-200"
                            >
                              Protect this
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="font-mono text-[10px] leading-relaxed text-slate-600">
                  Runs 100% in your tab — pasted code never leaves the device.
                </p>
              </div>
            </div>

            <div className={CARD} data-testid="inspector-card">
              <div className="flex items-center gap-3 border-b border-sky-400/10 px-5 py-4">
                <Webhook className="h-4 w-4 text-sky-300" />
                <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
                  Webhook inspector
                </h3>
              </div>
              <div className="space-y-4 px-5 py-5">
                <input
                  data-testid="inspect-url-input"
                  value={inspectUrl}
                  onChange={(e) => setInspectUrl(e.target.value)}
                  placeholder="Validate a webhook before you protect it"
                  className={INPUT}
                />
                <button
                  data-testid="inspect-webhook-button"
                  onClick={inspect}
                  disabled={inspecting || !inspectUrl.trim()}
                  className={GHOST_BUTTON}
                >
                  {inspecting ? "Checking…" : "Check with Discord"}
                </button>
                {inspectError && (
                  <p data-testid="inspect-error" className="font-mono text-[11px] leading-relaxed text-red-300">
                    {inspectError}
                  </p>
                )}
                {info && (
                  <div data-testid="inspect-result" className="flex items-center gap-4 rounded-sm border border-sky-400/20 bg-sky-400/5 p-4">
                    {info.avatar && (
                      <img
                        src={`https://cdn.discordapp.com/avatars/${info.id}/${info.avatar}.png`}
                        alt=""
                        className="h-10 w-10 rounded-full border border-sky-400/30"
                      />
                    )}
                    <div className="font-mono text-[11px] leading-relaxed text-slate-300">
                      <p className="font-bold text-sky-300">{info.name}</p>
                      <p className="text-slate-500">guild {info.guild_id} · channel {info.channel_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
