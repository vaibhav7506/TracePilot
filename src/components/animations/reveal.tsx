"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger direct children instead of animating the container as one block. */
  stagger?: boolean;
  delay?: number;
}

/**
 * Scroll-triggered reveal. Subtle by design — a short rise + fade once, on
 * enter. Honors prefers-reduced-motion by rendering content statically.
 */
export function Reveal({ children, className, stagger = false, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const targets: Element | HTMLCollection = stagger ? node.children : node;
      gsap.from(targets, {
        y: 18,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        delay,
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: node,
          start: "top 85%",
          once: true,
        },
      });
    }, node);

    return () => ctx.revert();
  }, [stagger, delay]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
