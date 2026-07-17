import { cn } from "@/lib/utils";

/**
 * TracePilot mark: a route node with an agent trace threading through it.
 * Drawn in currentColor so it inherits ruby / ivory per context.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      className={cn("h-6 w-6", className)}
    >
      <path
        d="M3 20 L10 12 L18 16 L25 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
      <circle cx="10" cy="12" r="1.9" className="fill-current text-foreground" />
      <circle cx="18" cy="16" r="1.9" className="fill-current text-foreground" />
      <circle cx="25" cy="7" r="2.4" className="fill-current text-primary" />
      <circle cx="3" cy="20" r="1.6" className="fill-current text-muted-foreground" />
    </svg>
  );
}
