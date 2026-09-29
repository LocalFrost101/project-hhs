const ITEMS = [
  "Burner inbox",
  "Webhook armor",
  "Canary tripwire",
  "Lua vault",
  "Control-flow flatten",
  "Junk injection",
  "Zero accounts",
  "30-day archive",
];

export function Marquee() {
  return (
    <div data-testid="telemetry-marquee" className="overflow-hidden border-y border-sky-400/10 bg-[#060a10] py-4">
      <div className="marquee-track flex w-max items-center gap-12">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-12 font-mono text-[11px] uppercase tracking-[0.35em] text-sky-400/60"
          >
            {item}
            <span className="text-sky-400/25">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}
