export interface PromptInjectionDetectionResult {
  detected: boolean;
  matchedPatterns: string[];
}

const SUSPICIOUS_INSTRUCTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+)?(?:previous|prior)?(?:\s+safety)?\s+instructions/i,
  /system\s+message(?:\s*:|\s*-)/i,
  /developer\s+message(?:\s*:|\s*-)/i,
  /reveal\s+(?:all\s+)?(?:secrets|keys|passwords|credentials)/i,
  /send\s+(?:credentials|tokens|passwords)\s+to/i,
  /override\s+(?:security\s+)?policy/i,
  /execute\s+(?:this\s+)?(?:command|shell|script)/i,
  /bypass\s+(?:authorization|authentication|gatekeeper)/i,
  /\bexec\s*\(/i,
  /\beval\s*\(/i,
  /__proto__/i,
  /constructor\.prototype/i,
];

/**
 * Secondary heuristic classifier for suspicious instruction-like patterns.
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * This classifier is purely ADVISORY. It does NOT serve as the primary security boundary.
 * The primary security boundary is immutable provenance, strict trust classes,
 * exact argument binding, and human WebAuthn authorization.
 */
export class PromptInjectionHeuristics {
  public static inspect(text: string): PromptInjectionDetectionResult {
    const matchedPatterns: string[] = [];

    for (const pattern of SUSPICIOUS_INSTRUCTION_PATTERNS) {
      if (pattern.test(text)) {
        matchedPatterns.push(pattern.source);
      }
    }

    return {
      detected: matchedPatterns.length > 0,
      matchedPatterns,
    };
  }

  /**
   * Recursively inspect all string values in an unknown payload.
   */
  public static inspectPayload(payload: unknown): PromptInjectionDetectionResult {
    const matched = new Set<string>();

    const traverse = (val: unknown) => {
      if (typeof val === 'string') {
        const res = PromptInjectionHeuristics.inspect(val);
        for (const m of res.matchedPatterns) matched.add(m);
      } else if (val && typeof val === 'object') {
        for (const v of Object.values(val)) {
          traverse(v);
        }
      }
    };

    traverse(payload);

    return {
      detected: matched.size > 0,
      matchedPatterns: Array.from(matched),
    };
  }
}
