import { type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Constrain content width and center it. */
  container?: boolean;
  /** Vertical rhythm preset. */
  spacing?: "none" | "sm" | "md" | "lg";
}

const spacingMap: Record<NonNullable<SectionProps["spacing"]>, string> = {
  none: "",
  sm: "py-8",
  md: "py-12 md:py-16",
  lg: "py-16 md:py-24",
};

export function Section({
  as: Tag = "section",
  container = true,
  spacing = "md",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <Tag className={cn(spacingMap[spacing], className)} {...props}>
      {container ? <div className="container">{children}</div> : children}
    </Tag>
  );
}

export interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-[1.7rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
