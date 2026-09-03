export interface OriginValidationResult {
  allowed: boolean;
  normalizedOrigin?: string;
  refusalReason?: string;
  refusalCode?: string;
}

export class OriginValidator {
  /**
   * Safely normalize an origin string using proper URL parsing semantics.
   * Rejects malformed URLs and naive string representations.
   */
  public static normalizeOrigin(rawOrigin: string): string | null {
    if (!rawOrigin || typeof rawOrigin !== 'string') {
      return null;
    }

    try {
      const url = new URL(rawOrigin);
      // Ensure protocol is http or https
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      return url.origin;
    } catch {
      return null;
    }
  }

  /**
   * Validate whether a request origin is authorized by tool origin restrictions.
   *
   * Crucial Security Rule:
   * - Deny-by-default for cross-origin access.
   * - Strict WHATWG origin matching prevents prefix attacks (e.g. 'https://example.com.attacker.com'
   *   is rejected when 'https://example.com' is allowed).
   */
  public static validate(
    requestOrigin: string,
    allowedOrigins: string[],
    currentAppOrigin?: string,
  ): OriginValidationResult {
    const normalizedRequest = OriginValidator.normalizeOrigin(requestOrigin);
    if (!normalizedRequest) {
      return {
        allowed: false,
        refusalReason: `Invalid or malformed request origin: '${requestOrigin}'.`,
        refusalCode: 'MALFORMED_ORIGIN',
      };
    }

    // Default to same-origin if no specific origin restrictions are configured
    if (!allowedOrigins || allowedOrigins.length === 0) {
      if (currentAppOrigin) {
        const normalizedApp = OriginValidator.normalizeOrigin(currentAppOrigin);
        if (normalizedApp && normalizedRequest === normalizedApp) {
          return { allowed: true, normalizedOrigin: normalizedRequest };
        }
      }
      return {
        allowed: false,
        normalizedOrigin: normalizedRequest,
        refusalReason:
          'Cross-origin access denied by default: No explicit cross-origin permissions granted.',
        refusalCode: 'ORIGIN_NOT_PERMITTED',
      };
    }

    // Check against allowed origin list
    for (const rawAllowed of allowedOrigins) {
      if (rawAllowed === 'self' || rawAllowed === currentAppOrigin) {
        if (currentAppOrigin) {
          const normalizedApp = OriginValidator.normalizeOrigin(currentAppOrigin);
          if (normalizedApp && normalizedRequest === normalizedApp) {
            return { allowed: true, normalizedOrigin: normalizedRequest };
          }
        }
        continue;
      }

      const normalizedAllowed = OriginValidator.normalizeOrigin(rawAllowed);
      if (normalizedAllowed && normalizedRequest === normalizedAllowed) {
        return { allowed: true, normalizedOrigin: normalizedRequest };
      }
    }

    return {
      allowed: false,
      normalizedOrigin: normalizedRequest,
      refusalReason: `Origin '${normalizedRequest}' is not permitted by tool origin restrictions.`,
      refusalCode: 'ORIGIN_NOT_PERMITTED',
    };
  }
}
