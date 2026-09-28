import { Activity, Play, Square } from "lucide-react";
import { useMagnetometer } from "@/hooks/useMagnetometer";

const ANOMALY_THRESHOLD = 40;

export function EmfMeter() {
  const emf = useMagnetometer();
  const anomaly = emf.active && emf.delta > ANOMALY_THRESHOLD;
  const barWidth = Math.min(100, Math.max(0, (emf.delta / 120) * 100));

  return (
    <div
      data-testid="emf-panel"
      className="scanlines overflow-hidden rounded-md border border-sky-400/15 bg-[#070b12]"
    >
      <div className="flex items-center justify-between border-b border-sky-400/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-sky-300" />
          <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
            EMF Field
          </h3>
        </div>
        {emf.supported && (
          <button
            data-testid="emf-toggle"
            onClick={emf.active ? emf.stop : emf.start}
            className={`flex items-center gap-2 rounded-sm px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
              emf.active
                ? "border border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                : "bg-sky-400 text-[#03121d] hover:bg-sky-300"
            }`}
          >
            {emf.active ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
            {emf.active ? "Stop" : "Sense"}
          </button>
        )}
      </div>

      <div className="px-5 py-5">
        {!emf.supported ? (
          <p data-testid="emf-unsupported-note" className="font-mono text-[11px] leading-relaxed text-slate-500">
            No magnetometer on this device — most laptops lack one. Open Blues DET on an Android
            phone in Chrome to measure magnetic anomalies; spikes near walls or furniture can
            betray hidden electronics.
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span data-testid="emf-reading" className="font-heading text-4xl font-black tracking-tight text-sky-300">
                {emf.magnitude !== null ? emf.magnitude.toFixed(1) : "--.-"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">µT</span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                data-testid="emf-delta-bar"
                className={`h-full rounded-full transition-all duration-300 ${anomaly ? "bg-amber-400" : "bg-sky-400"}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <p
              data-testid="emf-status"
              className={`mt-3 font-mono text-[10px] uppercase tracking-[0.25em] ${anomaly ? "text-amber-300" : "text-slate-500"}`}
            >
              {!emf.active
                ? "Standby — press sense"
                : anomaly
                  ? `Field anomaly +${emf.delta.toFixed(0)} µT — sweep slowly`
                  : `Field nominal · Δ ${emf.delta.toFixed(0)} µT`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
