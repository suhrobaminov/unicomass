/** Storage key for the post-sign-in destination across OAuth redirects. */
export const NEXT_KEY = "uc_auth_next";

/** Only allow same-origin, absolute app paths. */
export function safeNext(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}
