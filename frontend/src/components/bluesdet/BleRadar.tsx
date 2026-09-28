import { useEffect, useState } from "react";
import {
  Camera, Car, Crosshair, Headphones, HelpCircle, Home, Laptop, Play,
  Radio, Smartphone, Speaker, Square, Trash2, Tv, Watch,
} from "lucide-react";
import { classifyDevice, estimateDistance, signalBars, timeAgo, type Risk } from "@/lib/detect";
import type { BleScan } from "@/hooks/useBleScan";

const ICONS: Record<string, typeof Radio> = {
  crosshair: Crosshair, camera: Camera, headphones: Headphones, watch: Watch,
  speaker: Speaker, tv: Tv, smartphone: Smartphone, home: Home,
  laptop: Laptop, car: Car, radio: Radio, help: HelpCircle,
};

const RISK_STYLE: Record<Risk, string> = {
  low: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  high: "border-red-400/40 bg-red-400/10 text-red-300",
};

function SignalBars({ rssi }: { rssi: number | null }) {
  const bars = signalBars(rssi);
  return (
    <span className="flex items-end gap-0.5" aria-label={`Signal strength ${bars} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-1 rounded-sm ${i <= bars ? "bg-sky-400" : "bg-slate-700"}`}
          style={{ height: `${4 + i * 3}px` }}
        />
      ))}
    </span>
  );
}

export function BleRadar({ ble }: { ble: BleScan }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const scanning = ble.state === "scanning";
  const strongest = ble.devices.reduce<number | null>(
    (acc, d) => (d.rssi !== null && (acc === null || d.rssi > acc) ? d.rssi : acc),
    null,
  );

  return (
    <div
      data-testid="ble-radar-panel"
      className="scanlines flex h-full flex-col overflow-hidden rounded-md border border-sky-400/15 bg-[#070b12]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-400/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`pulse-dot h-2 w-2 rounded-full ${scanning ? "bg-sky-300" : "bg-slate-600"}`} />
          <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
            BLE Radar
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {ble.supported && (
            <>
              <button
                data-testid="ble-scan-toggle"
                onClick={scanning ? ble.stop : ble.start}
                className={`flex items-center gap-2 rounded-sm px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  scanning
                    ? "border border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                    : "bg-sky-400 text-[#03121d] hover:bg-sky-300"
                }`}
              >
                {scanning ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                {scanning ? "Stop" : "Radar scan"}
              </button>
              <button
                data-testid="ble-picker-button"
                onClick={ble.pick}
                className="rounded-sm border border-slate-700 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
              >
                Device picker
              </button>
              <button
                data-testid="ble-clear-button"
                onClick={ble.clear}
                className="rounded-sm border border-slate-800 p-2 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-300"
                aria-label="Clear detected devices"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-sky-400/10 border-b border-sky-400/10">
        {[
          { label: "Signals", value: String(ble.devices.length), testid: "ble-stat-count" },
          { label: "Strongest RSSI", value: strongest !== null ? `${strongest} dBm` : "—", testid: "ble-stat-rssi" },
          { label: "State", value: scanning ? "SWEEPING" : "STANDBY", testid: "ble-stat-state" },
        ].map((s) => (
          <div key={s.label} className="px-5 py-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">{s.label}</p>
            <p data-testid={s.testid} className="mt-1 font-mono text-sm font-bold text-sky-300">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="min-h-[280px] flex-1 overflow-y-auto">
        {!ble.supported && (
          <div data-testid="ble-unsupported-note" className="m-5 rounded-sm border border-amber-400/25 bg-amber-400/5 p-4">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              Web Bluetooth unavailable here
            </p>
            <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">
              Live BLE scanning needs Chrome, Edge, or Opera over HTTPS — Chrome on Android gives the
              best radar. Safari and Firefox don't expose Bluetooth to websites. On desktop Chrome,
              enable <span className="text-sky-300">chrome://flags/#enable-experimental-web-platform-features</span> for
              the continuous radar, or use the device picker.
            </p>
          </div>
        )}

        {ble.error && (
          <div data-testid="ble-error-note" className="m-5 rounded-sm border border-red-400/25 bg-red-400/5 p-4">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-red-300">Scan blocked</p>
            <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">
              {ble.error} — if you're on desktop Chrome, turn on the experimental web platform flag
              and retry, or use the device picker instead.
            </p>
          </div>
        )}

        {ble.supported && ble.devices.length === 0 && !ble.error && (
          <div data-testid="ble-empty-state" className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
            <Radio className="h-6 w-6 text-slate-600" />
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
              No signals yet — start the radar
            </p>
            <p className="max-w-sm font-mono text-[11px] leading-relaxed text-slate-600">
              Every BLE transmitter in range — trackers, earbuds, watches, cameras, beacons — will
              appear here with a classification and estimated distance.
            </p>
          </div>
        )}

        {ble.devices.map((device, i) => {
          const cls = classifyDevice(device.name);
          const Icon = ICONS[cls.icon] ?? Radio;
          return (
            <div
              key={device.id}
              data-testid={`ble-device-row-${i}`}
              className="flex items-start gap-4 border-b border-sky-400/5 px-5 py-4 transition-colors hover:bg-sky-400/5"
            >
              <span className="mt-0.5 rounded-sm border border-sky-400/20 bg-sky-400/5 p-2">
                <Icon className="h-4 w-4 text-sky-300" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-mono text-xs font-bold text-slate-100">
                    {device.name || "Unnamed beacon"}
                  </p>
                  <span
                    data-testid={`ble-device-type-${i}`}
                    className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] ${RISK_STYLE[cls.risk]}`}
                  >
                    {cls.type}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-500">{cls.blurb}</p>
                <p className="mt-1.5 font-mono text-[10px] text-slate-600">
                  {device.count} adv{device.count === 1 ? "" : "s"} · seen {timeAgo(device.lastSeen)}
                  {device.uuids.length > 0 && ` · ${device.uuids.length} svc`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <SignalBars rssi={device.rssi} />
                <span data-testid={`ble-device-distance-${i}`} className="font-mono text-[10px] font-bold text-sky-300">
                  {device.rssi !== null ? `~${estimateDistance(device.rssi)} m` : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
