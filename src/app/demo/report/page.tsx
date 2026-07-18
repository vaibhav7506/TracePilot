import type { Metadata } from "next";
import { RunLiveReport } from "@/components/runs/run-live-report";
import { demoRun } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Demo QA report",
  description: "A public, credential-free TracePilot QA sample report.",
};

export default function DemoReportPage() {
  return <RunLiveReport initialRun={demoRun} isDemo />;
}
