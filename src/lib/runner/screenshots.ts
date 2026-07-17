import { mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Screenshots are written under /public/screenshots/<runId>/ so they are served
 * statically by Next at /screenshots/<runId>/<file> and can be rendered on the
 * report page with a plain <img src>. The DB stores the public path (the value
 * returned by {@link publicPath}), never an absolute filesystem path.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public", "screenshots");

/** Absolute directory for a run's screenshots (created on demand). */
export function runDir(runId: string): string {
  return path.join(PUBLIC_DIR, sanitizeSegment(runId));
}

/** Ensure the run's screenshot directory exists. */
export async function ensureRunDir(runId: string): Promise<void> {
  await mkdir(runDir(runId), { recursive: true });
}

/** Absolute file path for a given step's screenshot. */
export function screenshotFile(runId: string, order: number): string {
  return path.join(runDir(runId), stepFileName(order));
}

/** Web-served path stored in the DB and used as an <img src>. */
export function publicPath(runId: string, order: number): string {
  return `/screenshots/${sanitizeSegment(runId)}/${stepFileName(order)}`;
}

function stepFileName(order: number): string {
  return `step-${String(order).padStart(2, "0")}.png`;
}

/** Defensive: run ids are cuids, but never let a segment escape the folder. */
function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9_-]/g, "");
}
