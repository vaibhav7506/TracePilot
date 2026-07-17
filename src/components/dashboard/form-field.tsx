"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Labeled form field with an inline validation message slot. */
export function Field({
  label,
  hint,
  htmlFor,
  error,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {hint ? (
          <span className="font-mono text-[0.7rem] text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Form-level (non-field) error message. */
export function FormError({ message, className }: { message: string | null; className?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "rounded-md border border-primary/30 bg-primary/[0.07] px-3 py-2 text-sm text-primary",
        className,
      )}
    >
      {message}
    </p>
  );
}
