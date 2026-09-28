import { useEffect, useState } from "react";
import { Logo } from "@/components/bluesdet/Logo";

export function Footer() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <footer data-testid="site-footer" className="border-t border-sky-400/10 bg-[#03050a]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={34} />
              <p className="font-heading text-4xl font-black uppercase tracking-tight text-slate-50 sm:text-5xl">
                Blues<span className="text-sky-400">·</span>DET
              </p>
            </div>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-slate-500">
              A detection and awareness instrument. Blues DET only listens — it never jams, blocks,
              injects, or interferes with any signal. Use it in spaces you own or are authorized to
              sweep.
            </p>
          </div>
          <div className="font-mono text-xs text-slate-500">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-600">System clock</p>
            <p data-testid="footer-utc-clock" className="mt-2 text-lg font-bold text-sky-300">
              {now.toISOString().slice(11, 19)} UTC
            </p>
            <p className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em]">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-sky-400" />
              All modules operational
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-sky-400/10 pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600">
            © {new Date().getFullYear()} Blues DET — static build, zero backend
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600">
            Deploy anywhere · GitHub Pages ready
          </p>
        </div>
      </div>
    </footer>
  );
}
