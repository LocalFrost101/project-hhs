export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" data-testid="brand-logo-mark" aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" stroke="#38BDF8" strokeOpacity="0.4" />
      <circle cx="16" cy="16" r="2.6" fill="#38BDF8" />
      <path d="M16 5.5 A10.5 10.5 0 0 1 26.5 16" stroke="#38BDF8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 10 A6 6 0 0 1 22 16" stroke="#38BDF8" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16" y1="16" x2="24" y2="8" stroke="#E6EEF7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
