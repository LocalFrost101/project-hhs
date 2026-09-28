import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import { RadarCanvas } from "@/components/bluesdet/RadarCanvas";
import { scrollToId } from "@/lib/scroll";
import type { BleScan } from "@/hooks/useBleScan";

const LINES = ["HIDDEN DEVICES.", "EXPOSED LIVE."];

export function Hero({ ble }: { ble: BleScan }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const radarY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const scanning = ble.state === "scanning";

  return (
    <section ref={sectionRef} id="top" className="bg-blueprint relative overflow-hidden pt-16">
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[480px] w-[480px] rounded-full bg-sky-500/10 blur-[140px]" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-12 lg:pt-24">
        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            data-testid="hero-status-badge"
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-sky-400/25 bg-sky-400/5 px-4 py-1.5"
          >
            <span className={`pulse-dot h-1.5 w-1.5 rounded-full ${scanning ? "bg-sky-300" : "bg-sky-500"}`} />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-300">
              {scanning ? "Radar live // sweeping 2.4 GHz" : "Blues DET // Browser signal recon"}
            </span>
          </motion.div>

          <h1 className="font-heading text-5xl font-black uppercase leading-[0.95] tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">
            {LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-1">
                <motion.span
                  className={`block ${i === 1 ? "text-glow text-sky-400" : ""}`}
                  initial={{ y: "115%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="mt-7 max-w-xl font-mono text-sm leading-relaxed text-slate-400 sm:text-base"
          >
            Blues DET turns this browser tab into a real recon dashboard — live Bluetooth Low
            Energy radar, magnetic anomaly sensing, and network intel. Every signal is classified:
            trackers, cameras, phones, wearables. No install, no server, nothing leaves your device.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <button
              data-testid="hero-btn-start-scan"
              onClick={() => scrollToId("scanner")}
              className="group flex items-center gap-3 rounded-sm bg-sky-400 px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#03121d] transition-colors hover:bg-sky-300"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start live scan
            </button>
            <button
              data-testid="hero-btn-how-it-works"
              onClick={() => scrollToId("compatibility")}
              className="group flex items-center gap-3 rounded-sm border border-slate-700 px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-slate-300 transition-colors hover:border-sky-400/50 hover:text-sky-300"
            >
              Reality check
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        <div className="relative lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: radarY }}
            className="scanlines relative overflow-hidden rounded-md border border-sky-400/15 bg-[#070b12]"
          >
            <div className="flex items-center justify-between border-b border-sky-400/10 px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
                BLE-RADAR // CH-37·38·39
              </span>
              <span
                data-testid="hero-radar-status"
                className={`font-mono text-[10px] uppercase tracking-[0.3em] ${scanning ? "text-sky-300" : "text-slate-500"}`}
              >
                {scanning ? "● LIVE" : "○ STANDBY"}
              </span>
            </div>
            <div className="p-4">
              <RadarCanvas devices={ble.devices} scanning={scanning} />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-sky-400/10 px-4 py-3">
              {["BLE Radar", "EMF Field", "Net Intel"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-slate-700/80 bg-[#0a0f16] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400"
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: imgY }}
            className="absolute -bottom-16 -right-2 hidden w-44 rotate-3 overflow-hidden rounded-md border border-sky-400/25 shadow-[0_20px_80px_-20px_rgba(56,189,248,0.35)] md:block lg:w-52"
          >
            <img
              src="img/detector_hero.jpeg"
              alt="Handheld RF signal detector with radar display"
              data-testid="hero-device-image"
              className="aspect-[2/3] w-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
