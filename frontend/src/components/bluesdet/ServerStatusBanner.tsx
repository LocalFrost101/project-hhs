import { Server, TriangleAlert } from "lucide-react";
import { useServerStatus } from "@/hooks/useServerStatus";

export function ServerStatusBanner() {
  const status = useServerStatus();
  if (status === "checking") return null;

  if (status === "live") {
    return (
      <div
        data-testid="server-status-live"
        className="mt-8 flex items-center gap-3 rounded-sm border border-sky-400/25 bg-sky-400/5 px-4 py-3"
      >
        <Server className="h-3.5 w-3.5 shrink-0 text-sky-300" />
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-sky-300">
          Server modules live — protector, owner log & archive online
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="server-status-static"
      className="mt-8 flex items-start gap-3 rounded-sm border border-amber-400/30 bg-amber-400/5 px-4 py-3"
    >
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
      <p className="font-mono text-[11px] leading-relaxed text-slate-400">
        <span className="font-bold uppercase tracking-[0.2em] text-amber-300">Static deployment.</span>{" "}
        The detector and obfuscator work here, but the webhook protector, owner unlock, logs, and
        script archive need the serverless functions — deploy to Vercel (Deploy section below, or
        VERCEL.md) for the full suite.
      </p>
    </div>
  );
}
