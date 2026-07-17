import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export default function NotFound() {
  return (
    <Section spacing="lg" className="flex min-h-[60vh] items-center">
      <div className="mx-auto max-w-md text-center">
        <span className="eyebrow">404 · route not found</span>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          The agent hit a dead end.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This route doesn&apos;t exist — much like the broken flows TracePilot is built to catch.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/runs">View runs</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
