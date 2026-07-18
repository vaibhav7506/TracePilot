/** Return a non-sensitive display value without exposing the secret itself. */
export function maskSecret(secret: string): string {
  const value = secret.trim();
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  const knownPrefix = ["sk-ant-", "gsk_", "AIza", "sk-"].find((prefix) => value.startsWith(prefix));
  return `${knownPrefix ?? value.slice(0, 3)}••••••••${value.slice(-4)}`;
}
