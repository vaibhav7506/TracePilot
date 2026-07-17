import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Status palette stays inside the brand: neutral "ink" for calm/passed states,
 * ruby for failures, rust for warnings, outline/muted for idle. No green / blue
 * / yellow — differentiation comes from weight and the leading dot, not hue.
 */
type BadgeVariant = "neutral" | "ruby" | "rust" | "outline" | "muted";

const variants: Record<BadgeVariant, string> = {
  neutral: "border-transparent bg-foreground/90 text-background",
  ruby: "border-transparent bg-primary/12 text-primary",
  rust: "border-transparent bg-rust/15 text-rust",
  outline: "border-border bg-transparent text-foreground",
  muted: "border-transparent bg-muted text-muted-foreground",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ className, variant = "muted", dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "font-mono text-[0.68rem] font-medium uppercase tracking-wider",
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current",
            variant === "ruby" && "animate-pulse-ring",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}
