import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Terminal, XCircle } from "lucide-react";

const MODULES = [
  { name: "Burner inbox", statik: true, note: "Talks to the disposable-mail API straight from your tab — works on every host, Pages included." },
  { name: "Lua obfuscator", statik: true, note: "Pure in-browser engine — strings, renaming, junk, flattening, vault." },
  { name: "Webhook protector", statik: false, note: "Needs the serverless functions (Vercel) or the FastAPI backend to hold the encryption secret." },
  { name: "Canary tripwire + owner notify", statik: false, note: "Server-side: link probes and relays alarm the owner's Discord webhook." },
  { name: "Owner tab · logs · archive · revoke", statik: false, note: "Server auth; Vercel KV powers lockout, revocation, and the 30-day script archive." },
];

const DEPLOY_STEPS = [
  "git push the repo to GitHub",
  "Repo → Settings → Pages → Source: GitHub Actions",
  "The included workflow builds frontend/ and ships it — done",
];

const cell = "border border-sky-400/10 px-4 py-3 align-top";

export function Compatibility() {
  return (
    <section id="compatibility" data-testid="compatibility-section" className="border-t border-sky-400/10 bg-[#05080d]">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-400">
            Module 06 // Reality check
          </p>
          <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black uppercase tracking-tight text-slate-50 sm:text-4xl">
            What's real, and where it runs
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="lg:col-span-7"
          >
            <div className="overflow-x-auto rounded-md border border-sky-400/15 bg-[#070b12]">
              <table className="w-full border-collapse font-mono text-xs" data-testid="compatibility-table">
                <thead>
                  <tr className="bg-sky-400/5 text-left">
                    <th className={`${cell} text-[10px] uppercase tracking-[0.2em] text-slate-400`}>Module</th>
                    <th className={`${cell} text-[10px] uppercase tracking-[0.2em] text-slate-400`}>Static (Pages)</th>
                    <th className={`${cell} text-[10px] uppercase tracking-[0.2em] text-slate-400`}>Vercel</th>
                    <th className={`${cell} text-[10px] uppercase tracking-[0.2em] text-slate-400`}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((row) => (
                    <tr key={row.name} className="transition-colors hover:bg-sky-400/5">
                      <td className={`${cell} font-bold text-slate-200`}>{row.name}</td>
                      <td className={cell}>
                        {row.statik ? (
                          <CheckCircle2 className="h-4 w-4 text-sky-300" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-600" />
                        )}
                      </td>
                      <td className={cell}>
                        <CheckCircle2 className="h-4 w-4 text-sky-300" />
                      </td>
                      <td className={`${cell} leading-relaxed text-slate-500`}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex gap-3 rounded-md border border-amber-400/25 bg-amber-400/5 p-5" data-testid="reality-check-note">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p className="font-mono text-xs leading-relaxed text-slate-400">
                Straight talk: a static host (GitHub Pages) can't keep secrets or remember
                anything — no encryption keys, no owner sessions, no logs. That's physics, not a
                bug. Pages serves the inbox and obfuscator perfectly; anything that protects or
                records needs the Vercel functions. The site detects which one it's on and tells
                you at the top of each server module.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="lg:col-span-5"
            id="deploy"
          >
            <div className="scanlines h-full rounded-md border border-sky-400/15 bg-[#070b12] p-6">
              <div className="flex items-center gap-3">
                <Terminal className="h-4 w-4 text-sky-300" />
                <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
                  Ship it to GitHub Pages
                </h3>
              </div>
              <ol className="mt-6 space-y-5">
                {DEPLOY_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-4" data-testid={`deploy-step-${i}`}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-sky-400/30 bg-sky-400/10 font-mono text-[11px] font-bold text-sky-300">
                      {i + 1}
                    </span>
                    <p className="pt-1 font-mono text-xs leading-relaxed text-slate-400">{step}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-t border-sky-400/10 pt-5 font-mono text-[11px] leading-relaxed text-slate-500">
                Pages serves over HTTPS automatically — the one hard requirement for Web Bluetooth.
                Full instructions live in <span className="text-sky-300">GITHUB_PAGES.md</span>.
              </p>
              <div className="mt-5 rounded-sm border border-sky-400/20 bg-sky-400/5 p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">
                  Full suite on Vercel
                </p>
                <ol className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed text-slate-400">
                  <li>1. Import the repo at vercel.com/new</li>
                  <li>2. Root directory: <span className="text-sky-300">frontend</span></li>
                  <li>3. Env var: <span className="text-sky-300">WEBHOOK_SECRET</span> — any long random string</li>
                  <li>4. Deploy — the webhook protector activates</li>
                </ol>
                <p className="mt-3 font-mono text-[10px] leading-relaxed text-slate-500">
                  Details in VERCEL.md. Pages stays perfect for the static detector + obfuscator;
                  the protector needs the serverless functions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
