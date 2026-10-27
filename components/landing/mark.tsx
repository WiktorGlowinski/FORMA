export function PitchMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect
        x="1.75"
        y="5"
        width="28.5"
        height="22"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M16 5v22" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PitchArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 105 68" className={className} fill="none" aria-hidden="true">
      <rect x="0.6" y="0.6" width="103.8" height="66.8" stroke="currentColor" strokeWidth="0.7" />
      <path d="M52.5 0.6v66.8" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="52.5" cy="34" r="9.15" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="52.5" cy="34" r="0.65" fill="currentColor" />
      <rect x="0.6" y="13.84" width="16.5" height="40.32" stroke="currentColor" strokeWidth="0.7" />
      <rect x="0.6" y="24.84" width="5.5" height="18.32" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="11.6" cy="34" r="0.5" fill="currentColor" />
      <path d="M17.1 26.7a9.15 9.15 0 0 1 0 14.6" stroke="currentColor" strokeWidth="0.7" />
      <rect x="87.9" y="13.84" width="16.5" height="40.32" stroke="currentColor" strokeWidth="0.7" />
      <rect x="98.9" y="24.84" width="5.5" height="18.32" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="93.4" cy="34" r="0.5" fill="currentColor" />
      <path d="M87.9 26.7a9.15 9.15 0 0 0 0 14.6" stroke="currentColor" strokeWidth="0.7" />
      <path d="M0.6 2.3A1.7 1.7 0 0 0 2.3 0.6" stroke="currentColor" strokeWidth="0.7" />
      <path d="M102.7 0.6a1.7 1.7 0 0 0 1.7 1.7" stroke="currentColor" strokeWidth="0.7" />
      <path d="M0.6 65.7a1.7 1.7 0 0 1 1.7 1.7" stroke="currentColor" strokeWidth="0.7" />
      <path d="M104.4 65.7a1.7 1.7 0 0 1-1.7 1.7" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  );
}

export function CornerFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 96" className={className} aria-hidden="true">
      <path d="M14 92 V10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path className="flag-cloth fill-bib" d="M14 12h34l-8 10 8 10H14Z" />
      <circle cx="14" cy="92" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function BallMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="16" fill="currentColor" />
      <path
        d="M24 12.5 30.2 17l-2.3 7.2h-7.8L17.8 17Z"
        fill="none"
        stroke="var(--chalk)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M17.8 17 12 20.2M30.2 17 36 20.2M20.1 24.2 16.2 33M27.9 24.2 31.8 33M24 31.2 V37"
        fill="none"
        stroke="var(--chalk)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}