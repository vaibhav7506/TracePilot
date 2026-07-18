export function safeSpecFileName(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.toLowerCase().endsWith(".spec.ts") ? normalized : "generated.spec.ts";
}

/** Sanitize an archive/file set and suffix collisions after normalization. */
export function uniqueSafeSpecFileNames(values: string[]): string[] {
  const used = new Set<string>();
  return values.map((value) => {
    const safe = safeSpecFileName(value);
    let candidate = safe;
    let suffix = 2;
    while (used.has(candidate.toLowerCase())) {
      candidate = safe.replace(/\.spec\.ts$/i, `-${suffix}.spec.ts`);
      suffix += 1;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}
