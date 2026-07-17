import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * An empty screen is an invitation to act — so this leads with a clear next
 * step rather than an apology.
 */
export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border",
        "bg-card/40 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/60 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      ) : null}
      {eyebrow ? <span className="eyebrow mb-2">{eyebrow}</span> : null}
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
