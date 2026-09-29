import { motion } from "motion/react";
import { Activity, Archive, Bell, Fingerprint, Github, MailPlus, ScanSearch } from "lucide-react";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

const CARD =
  "group relative overflow-hidden rounded-md border border-sky-400/15 bg-[#070b12] p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-sky-400/45";

function Metric({ children }: { children: string }) {
  return <p className="mt-4 font-heading text-3xl font-black tracking-tight text-sky-300">{children}</p>;
}

export function Bento() {
  return (
    <section id="features" data-testid="features-section" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <motion.div {...reveal} transition={{ duration: 0.7 }}>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-400">
          Module 05 // Capability matrix
        </p>
        <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black uppercase tracking-tight text-slate-50 sm:text-4xl">
          Built to find what shouldn't be there
        </h2>
      </motion.div>

      <div className="mt-12 grid grid-cols-12 gap-5">
        <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.05 }} className={`${CARD} col-span-12 md:col-span-7`} data-testid="bento-card-mail">
          <MailPlus className="h-5 w-5 text-sky-300" />
          <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">
            Burner inbox
          </h3>
          <p className="mt-2 max-w-md font-mono text-xs leading-relaxed text-slate-400">
            One click mints a real receiving email address — no signup, no key, no trace. Mail
            lands live in the tab; burn it and it never existed.
          </p>
          <Metric>0 signup</Metric>
        </motion.div>

        <motion.div
          {...reveal}
          transition={{ duration: 0.7, delay: 0.12 }}
          className={`${CARD} col-span-12 min-h-[220px] md:col-span-5`}
          data-testid="bento-card-vault"
        >
          <img
            src="img/detector_detail.jpeg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity duration-500 group-hover:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-[#070b12]/60 to-transparent" />
          <div className="relative">
            <ScanSearch className="h-5 w-5 text-sky-300" />
            <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">
              Lua vault
            </h3>
            <p className="mt-2 max-w-sm font-mono text-xs leading-relaxed text-slate-400">
              String encryption, scope-aware renaming, junk injection, control-flow flattening,
              and a hardened nested loader — stacked, not swapped.
            </p>
            <Metric>5 layers</Metric>
          </div>
        </motion.div>

        <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.05 }} className={`${CARD} col-span-12 md:col-span-4`} data-testid="bento-card-canary">
          <Bell className="h-5 w-5 text-sky-300" />
          <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">Canary links</h3>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">
            Protected webhook links carry a silent tripwire — anyone who opens one in a browser
            pings your Discord instantly and sees a 404.
          </p>
          <Metric>Instant</Metric>
        </motion.div>

        <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.1 }} className={`${CARD} col-span-12 md:col-span-4`} data-testid="bento-card-archive">
          <Archive className="h-5 w-5 text-sky-300" />
          <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">Script archive</h3>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">
            Every obfuscation submission is archived for the owner — downloadable as .lua,
            auto-deleted after 30 days.
          </p>
          <Metric>30-day TTL</Metric>
        </motion.div>

        <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.15 }} className={`${CARD} col-span-12 md:col-span-4`} data-testid="bento-card-privacy">
          <Fingerprint className="h-5 w-5 text-sky-300" />
          <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">
            Zero accounts
          </h3>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">
            No signup anywhere on the site. The only gate is the owner's access code — everything
            else just works, in the open.
          </p>
          <Metric>1 code</Metric>
        </motion.div>

        <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.2 }} className={`${CARD} col-span-12`} data-testid="bento-card-github">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <Github className="h-5 w-5 text-sky-300" />
              <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">
                GitHub Pages ready
              </h3>
              <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">
                Ships with a deploy workflow. Push the repo, enable Pages, and your detector is live
                on HTTPS — exactly what Web Bluetooth requires.
              </p>
            </div>
            <p className="font-heading text-4xl font-black tracking-tight text-sky-300">1 push</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
