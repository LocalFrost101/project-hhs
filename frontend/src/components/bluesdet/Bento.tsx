import { motion } from "motion/react";
import { Activity, Fingerprint, Github, Radio, ScanSearch, Wifi } from "lucide-react";

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
          Module 02 // Capability matrix
        </p>
        <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black uppercase tracking-tight text-slate-50 sm:text-4xl">
          Built to find what shouldn't be there
        </h2>
      </motion.div>

      <div className="mt-12 grid grid-cols-12 gap-5">
        <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.05 }} className={`${CARD} col-span-12 md:col-span-7`} data-testid="bento-card-radar">
          <Radio className="h-5 w-5 text-sky-300" />
          <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">
            Live BLE radar
          </h3>
          <p className="mt-2 max-w-md font-mono text-xs leading-relaxed text-slate-400">
            A continuous 2.4 GHz advertisement sweep. Every beacon in range is captured, plotted on
            the scope, and tracked over time with RSSI history.
          </p>
          <Metric>2.4 GHz sweep</Metric>
        </motion.div>

        <motion.div
          {...reveal}
          transition={{ duration: 0.7, delay: 0.12 }}
          className={`${CARD} col-span-12 min-h-[220px] md:col-span-5`}
          data-testid="bento-card-classifier"
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
              Signature classifier
            </h3>
            <p className="mt-2 max-w-sm font-mono text-xs leading-relaxed text-slate-400">
              Broadcast names are matched against a signature bank — trackers, covert cameras,
              wearables, vehicles, smart-home gear — and risk-rated on sight.
            </p>
            <Metric>40+ signatures</Metric>
          </div>
        </motion.div>

        <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.05 }} className={`${CARD} col-span-12 md:col-span-4`} data-testid="bento-card-emf">
          <Activity className="h-5 w-5 text-sky-300" />
          <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">EMF field meter</h3>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">
            Your phone's magnetometer watches for field spikes that betray powered electronics
            behind walls, in clocks, or inside fixtures.
          </p>
          <Metric>±0.1 µT</Metric>
        </motion.div>

        <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.1 }} className={`${CARD} col-span-12 md:col-span-4`} data-testid="bento-card-network">
          <Wifi className="h-5 w-5 text-sky-300" />
          <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">Network intel</h3>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">
            Live read on your own link — medium, effective speed, latency — plus a straight answer
            on what browsers can and cannot see on Wi-Fi.
          </p>
          <Metric>Real-time</Metric>
        </motion.div>

        <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.15 }} className={`${CARD} col-span-12 md:col-span-4`} data-testid="bento-card-privacy">
          <Fingerprint className="h-5 w-5 text-sky-300" />
          <h3 className="mt-4 font-heading text-lg font-black uppercase tracking-tight text-slate-100">
            Zero-upload privacy
          </h3>
          <p className="mt-2 font-mono text-xs leading-relaxed text-slate-400">
            Pure static site. No backend, no analytics, no account. Every byte of sensor data is
            processed in your tab and dies with it.
          </p>
          <Metric>100% local</Metric>
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
