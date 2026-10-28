import type { InjuryKind } from "@/components/coach/data";

export function InjuryIcon({ kind, className }: { kind: InjuryKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "cast" ? (
        <>
          <path d="M11 5.5v3.5M16 4.5v4.5M21 5.5v3.5" />
          <path d="M9 10h14v11.5a7 7 0 0 1-14 0Z" />
          <path d="M9 15h14M9 19.5h14" />
        </>
      ) : null}
      {kind === "joint" ? (
        <>
          <path d="M8 19h8.5a7 7 0 0 1 6.8 5.4H28" />
          <path d="M12 19v-6a3 3 0 0 1 3-3h.5" />
          <circle cx="15" cy="13.2" r="2.3" />
          <path d="M11.5 18.2c1 1.8 2.6 2.8 5 2.8" />
        </>
      ) : null}
      {kind === "muscle" ? (
        <>
          <path d="M12 28V16.2c0-2.2.3-4.1-.4-6.3C10.4 7.2 12 4.8 16 4.8s5.6 2.4 4.4 5.1c-.7 2.2-.4 4.1-.4 6.3V28" />
          <path d="M12.4 14.2c1.7 1.5 5.5 1.5 7.2 0" />
        </>
      ) : null}
      {kind === "head" ? (
        <>
          <circle cx="16" cy="13" r="7" />
          <path d="M11.5 12.5h9M16 8.2v8.6" />
          <path d="M13.2 22.2v5.2M18.8 22.2v5.2" />
        </>
      ) : null}
      {kind === "overload" ? (
        <>
          <circle cx="12.5" cy="6.8" r="2.2" />
          <path d="M12.5 9.2v7M12.5 13.2 8.2 16.8M12.5 13.2l4.2 2.6M12.5 16.2 9.2 25.2M12.5 16.2l3.4 9" />
          <path d="M22 11.5 24.4 15.2 22 18.8 24.4 22.6" />
        </>
      ) : null}
      {kind === "other" ? (
        <>
          <rect x="7" y="7" width="18" height="18" rx="3" />
          <path d="M16 11.5v9M11.5 16h9" />
        </>
      ) : null}
    </svg>
  );
}