/**
 * URL helpers for keeping exploration inside a single site. The runner must
 * never wander onto external domains, so hostname checks are centralized here.
 */

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Resolve a possibly-relative href against the current page URL. */
export function resolveHref(base: string, href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  // Skip non-navigational schemes and in-page anchors outright.
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(trimmed)) return null;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return null;
  }
}

/** Case-insensitive hostname equality (www is treated as distinct — intentional). */
export function sameHostname(a: string, b: string): boolean {
  try {
    return new URL(a).hostname.toLowerCase() === new URL(b).hostname.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Canonical form used for the visited-set: drop the hash and trailing slash so
 * "/pricing", "/pricing/", and "/pricing#plans" count as one route.
 */
export function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    url.hash = "";
    let out = url.toString();
    if (out.endsWith("/") && url.pathname !== "/") out = out.slice(0, -1);
    return out;
  } catch {
    return null;
  }
}

/** Path + search, for compact display (e.g. "/checkout?step=2"). */
export function pathOf(value: string): string {
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}` || "/";
  } catch {
    return value;
  }
}
