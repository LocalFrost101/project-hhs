import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { useNetworkInfo } from "@/hooks/useNetworkInfo";

export function NetworkPanel() {
  const net = useNetworkInfo();

  const rows = [
    { label: "Link", value: net.online ? net.type.toUpperCase() : "OFFLINE", testid: "net-row-type" },
    { label: "Effective", value: net.supported ? net.effectiveType.toUpperCase() : "N/A", testid: "net-row-effective" },
    { label: "Downlink", value: net.downlink !== null ? `${net.downlink} Mb/s` : "—", testid: "net-row-downlink" },
    { label: "RTT", value: net.rtt !== null ? `${net.rtt} ms` : "—", testid: "net-row-rtt" },
  ];

  return (
    <div
      data-testid="network-panel"
      className="scanlines overflow-hidden rounded-md border border-sky-400/15 bg-[#070b12]"
    >
      <div className="flex items-center gap-3 border-b border-sky-400/10 px-5 py-4">
        {net.online ? (
          <Wifi className="h-4 w-4 text-sky-300" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-300" />
        )}
        <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
          Network Intel
        </h3>
      </div>

      <div className="grid grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="border-b border-r border-sky-400/5 px-5 py-3.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">{row.label}</p>
            <p data-testid={row.testid} className="mt-1 font-mono text-sm font-bold text-sky-300">
              {row.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 px-5 py-4">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
        <p className="font-mono text-[11px] leading-relaxed text-slate-500">
          Browsers sandbox Wi-Fi: no website can list SSIDs or other LAN devices — that requires a
          native app with OS privileges. Any site claiming otherwise is faking it. This panel shows
          everything the web platform legitimately exposes about your connection.
        </p>
      </div>
    </div>
  );
}
