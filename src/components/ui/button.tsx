import { forwardRef, type ButtonHTMLAttributes, type Ref } from "react";
import { Slot } from "@/components/ui/slot";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium " +
  "transition-[color,background-color,border-color,box-shadow,transform] duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 " +
  "active:translate-y-px select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-subtle hover:bg-primary/90 " +
    "hover:shadow-[0_6px_20px_-8px_rgb(var(--primary)/0.7)]",
  secondary: "bg-muted text-foreground hover:bg-accent border border-border",
  outline: "border border-border bg-transparent text-foreground hover:bg-accent hover:border-primary/40",
  ghost: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
  destructive: "bg-primary text-primary-foreground hover:bg-primary/90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[0.8rem]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-[0.95rem]",
  icon: "h-10 w-10",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, type, ...props }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className);

    if (asChild) {
      return <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props} />;
    }

    return <button ref={ref} type={type ?? "button"} className={classes} {...props} />;
  },
);
Button.displayName = "Button";
