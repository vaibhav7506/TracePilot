import "server-only";
import { lookup } from "node:dns/promises";
import { isPrivateHostname } from "@/lib/security/network-address";

/** Resolve a target before browser launch to reject DNS names pointing at private networks. */
export async function assertPubliclyResolvedUrl(
  value: string,
  allowPrivateNetwork = false,
): Promise<void> {
  if (allowPrivateNetwork) return;
  const hostname = new URL(value).hostname;
  if (isPrivateHostname(hostname)) {
    throw new Error("Localhost and private network targets are blocked.");
  }
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("The target hostname could not be resolved.");
  }
  if (!addresses.length || addresses.some((entry) => isPrivateHostname(entry.address))) {
    throw new Error("The target hostname resolves to a private or non-routable address.");
  }
}
