import { cn } from "@/lib/utils";

/**
 * Tiled brand mark — the favicon rendered as a self-contained component for
 * sidebar/navbar use where a filled tile reads better than the inline
 * currentColor {@link ./logo.tsx Logo}. Colors are fixed so it holds up on any
 * surface. Palette: graphite / ivory / ruby / wine.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("h-8 w-8", className)}
    >
      <rect width="64" height="64" rx="14" fill="#1E1B18" />
      <rect
        x="0.75"
        y="0.75"
        width="62.5"
        height="62.5"
        rx="13.25"
        stroke="#EFE7DA"
        strokeOpacity="0.1"
        strokeWidth="1.5"
      />
      <path d="M18 19 H46" stroke="#EFE7DA" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M32 19 V34 L42 44"
        stroke="#EFE7DA"
        strokeOpacity="0.9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 34 L22 44" stroke="#9E2B3B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="19" r="3.4" fill="#EFE7DA" />
      <circle cx="46" cy="19" r="3.4" fill="#EFE7DA" />
      <circle cx="32" cy="34" r="3.6" fill="#70202F" />
      <circle cx="42" cy="44" r="3.2" fill="#EFE7DA" fillOpacity="0.75" />
      <circle cx="22" cy="44" r="8" fill="#9E2B3B" fillOpacity="0.22" />
      <circle cx="22" cy="44" r="4.4" fill="#BE3E50" />
      <circle cx="22" cy="44" r="1.7" fill="#EFE7DA" />
    </svg>
  );
}
