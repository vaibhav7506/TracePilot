"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// WebGL is browser-only — load the scene client-side with a graceful fallback.
const AgentScene = dynamic(() => import("@/components/hero/agent-scene"), {
  ssr: false,
  loading: () => <HeroFallback />,
});

function HeroFallback() {
  return (
    <div className="grid-lines h-full w-full opacity-60" aria-hidden />
  );
}

export function AgentHero({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <AgentScene />
    </div>
  );
}
