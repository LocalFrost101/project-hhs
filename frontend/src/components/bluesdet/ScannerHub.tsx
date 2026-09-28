import { BleRadar } from "@/components/bluesdet/BleRadar";
import { NetworkPanel } from "@/components/bluesdet/NetworkPanel";
import { EmfMeter } from "@/components/bluesdet/EmfMeter";
import { DeviceInventory } from "@/components/bluesdet/DeviceInventory";
import type { BleScan } from "@/hooks/useBleScan";

export function ScannerHub({ ble }: { ble: BleScan }) {
  return (
    <section id="scanner" data-testid="scanner-section" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-400">
        Module 01 // Live recon
      </p>
      <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black uppercase tracking-tight text-slate-50 sm:text-4xl">
        The detection deck
      </h2>
      <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-slate-400">
        Four real sensor modules running entirely in this tab. Grant a permission, get live data —
        everything is processed locally and never uploaded.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BleRadar ble={ble} />
        </div>
        <div className="flex flex-col gap-5 lg:col-span-5">
          <NetworkPanel />
          <EmfMeter />
        </div>
        <div className="lg:col-span-12">
          <DeviceInventory />
        </div>
      </div>
    </section>
  );
}
