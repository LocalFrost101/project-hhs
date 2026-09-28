import { useState } from "react";
import { Camera, Cpu, Fingerprint, Mic, ScanFace } from "lucide-react";

interface ListedSensor {
  kind: string;
  label: string;
}

export function DeviceInventory() {
  const [sensors, setSensors] = useState<ListedSensor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nav = navigator as unknown as { deviceMemory?: number; hardwareConcurrency?: number; maxTouchPoints?: number };
  const chips = [
    { label: "CPU threads", value: nav.hardwareConcurrency ? String(nav.hardwareConcurrency) : "—" },
    { label: "Memory", value: nav.deviceMemory ? `~${nav.deviceMemory} GB` : "—" },
    { label: "Touch points", value: typeof nav.maxTouchPoints === "number" ? String(nav.maxTouchPoints) : "—" },
    { label: "Platform", value: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop" },
  ];

  const enumerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      const list = await navigator.mediaDevices.enumerateDevices();
      setSensors(
        list
          .filter((d) => d.kind === "videoinput" || d.kind === "audioinput")
          .map((d) => ({ kind: d.kind, label: d.label || "Unlabeled sensor" })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Permission denied.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="device-inventory-panel"
      className="scanlines overflow-hidden rounded-md border border-sky-400/15 bg-[#070b12]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-400/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <ScanFace className="h-4 w-4 text-sky-300" />
          <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
            This Device — Sensor Inventory
          </h3>
        </div>
        <button
          data-testid="inventory-enumerate-button"
          onClick={enumerate}
          disabled={busy}
          className="rounded-sm border border-slate-700 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 transition-colors hover:border-sky-400/50 hover:text-sky-300 disabled:opacity-50"
        >
          {busy ? "Requesting…" : "Enumerate cameras & mics"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px bg-sky-400/5 md:grid-cols-4">
        {chips.map((chip) => (
          <div key={chip.label} className="bg-[#070b12] px-5 py-3.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">{chip.label}</p>
            <p className="mt-1 flex items-center gap-2 font-mono text-sm font-bold text-sky-300">
              <Cpu className="h-3.5 w-3.5 text-slate-500" />
              {chip.value}
            </p>
          </div>
        ))}
      </div>

      <div className="px-5 py-4">
        {error && (
          <p data-testid="inventory-error" className="font-mono text-[11px] leading-relaxed text-red-300">
            {error} — permission is required once so browsers reveal sensor labels.
          </p>
        )}
        {!error && sensors === null && (
          <p className="flex items-center gap-2 font-mono text-[11px] leading-relaxed text-slate-500">
            <Fingerprint className="h-3.5 w-3.5 shrink-0" />
            Enumerate to list every camera and microphone wired into this device. Access is granted
            for a split second, immediately released, and nothing is recorded.
          </p>
        )}
        {sensors !== null && (
          <ul data-testid="inventory-sensor-list" className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {sensors.map((sensor, i) => (
              <li
                key={`${sensor.kind}-${i}`}
                className="flex items-center gap-3 rounded-sm border border-sky-400/10 bg-sky-400/5 px-4 py-2.5"
              >
                {sensor.kind === "videoinput" ? (
                  <Camera className="h-3.5 w-3.5 shrink-0 text-sky-300" />
                ) : (
                  <Mic className="h-3.5 w-3.5 shrink-0 text-sky-300" />
                )}
                <span className="truncate font-mono text-[11px] text-slate-300">{sensor.label}</span>
              </li>
            ))}
            {sensors.length === 0 && (
              <li className="font-mono text-[11px] text-slate-500">No camera or microphone reported.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
