import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Logo className="h-5 w-5" />
          <span className="font-mono text-xs uppercase tracking-eyebrow">
            TracePilot QA
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Autonomous browser QA — explore, detect, and codify flows into Playwright tests.
        </p>
        <nav className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link href="/runs" className="transition-colors hover:text-foreground">
            Runs
          </Link>
          <Link href="/settings" className="transition-colors hover:text-foreground">
            Settings
          </Link>
        </nav>
      </div>
    </footer>
  );
}
