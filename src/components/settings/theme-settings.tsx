"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

const options: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme preference">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          onClick={() => setTheme(option.value)}
          className={cn(
            "flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border px-3 text-sm transition-all",
            theme === option.value
              ? "border-primary/40 bg-primary/[0.07] text-foreground shadow-subtle"
              : "border-border bg-background/35 text-muted-foreground hover:border-primary/25 hover:text-foreground",
          )}
        >
          <option.icon className="h-4 w-4" />
          {option.label}
        </button>
      ))}
    </div>
  );
}
