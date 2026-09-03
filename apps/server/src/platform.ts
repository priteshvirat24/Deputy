/**
 * Derive WebAuthn / origin configuration from the hosting platform on first
 * boot, so a single-origin deploy comes up correctly without hand-setting four
 * env vars that all encode the same hostname.
 *
 * Render exposes RENDER_EXTERNAL_HOSTNAME (and RENDER_EXTERNAL_URL). When the
 * WebAuthn config is still at its localhost default and such a hostname is
 * present, adopt it: RP_ID = hostname, ORIGIN / WEBAUTHN_ORIGIN = https://host,
 * ALLOWED_ORIGINS = that origin. The production env guard still validates the
 * result (https + non-localhost), so this is a convenience, not a bypass.
 *
 * Explicitly-set values always win — this only fills gaps.
 */
export function applyPlatformDefaults(env: NodeJS.ProcessEnv = process.env): void {
  const host = env.RENDER_EXTERNAL_HOSTNAME?.trim();
  if (!host) return;

  const origin = `https://${host}`;
  const isUnset = (v: string | undefined): boolean =>
    !v || v === 'localhost' || v.startsWith('http://localhost') || v.startsWith('http://127.0.0.1');

  if (isUnset(env.RP_ID)) env.RP_ID = host;
  if (isUnset(env.ORIGIN)) env.ORIGIN = origin;
  if (isUnset(env.WEBAUTHN_ORIGIN)) env.WEBAUTHN_ORIGIN = origin;
  if (isUnset(env.ALLOWED_ORIGINS)) env.ALLOWED_ORIGINS = origin;
}
