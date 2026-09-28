import { Logo } from "@/components/bluesdet/Logo";
import { scrollToId } from "@/lib/scroll";
import { Radar } from "lucide-react";

const LINKS = [
  { id: "scanner", label: "Detector", testid: "nav-link-detector" },
  { id: "protector", label: "Protector", testid: "nav-link-protector" },
  { id: "obfuscator", label: "Obfuscator", testid: "nav-link-obfuscator" },
  { id: "deploy", label: "Deploy", testid: "nav-link-deploy" },
];

export function Header() {
  return (
    <header
      data-testid="tactical-nav-header"
      className="fixed inset-x-0 top-0 z-50 border-b border-sky-400/10 bg-[#04060b]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <button
          data-testid="nav-brand-button"
          onClick={() => scrollToId("top")}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Logo size={26} />
          <span className="font-heading text-sm font-black uppercase tracking-[0.22em] text-slate-100">
            Blues<span className="text-sky-400">·</span>DET
          </span>
        </button>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <button
              key={link.id}
              data-testid={link.testid}
              onClick={() => scrollToId(link.id)}
              className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-400 transition-colors hover:text-sky-300"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <button
          data-testid="header-btn-launch-scanner"
          onClick={() => scrollToId("scanner")}
          className="group flex items-center gap-2 rounded-sm border border-sky-400/40 bg-sky-400/10 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300 transition-colors hover:bg-sky-400/20"
        >
          <Radar className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
          Launch Scanner
        </button>
      </div>
    </header>
  );
}
