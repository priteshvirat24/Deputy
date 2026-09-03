import { ProvenanceRecord, QuarantinedContentPart, TrustClass } from '@deputy/domain';

export class ContentEnvelope {
  /**
   * Wrap any content in a typed quarantine envelope with explicit provenance and trust class.
   */
  public static wrap(
    value: unknown,
    provenance: ProvenanceRecord,
    taintFlags: string[] = [],
  ): QuarantinedContentPart {
    let type: QuarantinedContentPart['type'] = 'text';
    if (typeof value === 'object' && value !== null) {
      type = 'json';
    }

    return {
      type,
      value,
      provenance,
      trustClass: provenance.trustClass,
      taintFlags: [...taintFlags],
    };
  }

  /**
   * Transform the inner value of a quarantined content part while preserving immutable provenance.
   */
  public static transform<T, R>(
    part: QuarantinedContentPart,
    transformer: (val: T) => R,
    additionalFlags: string[] = [],
  ): QuarantinedContentPart {
    const transformedValue = transformer(part.value as T);
    return {
      type: typeof transformedValue === 'object' && transformedValue !== null ? 'json' : 'text',
      value: transformedValue,
      provenance: part.provenance, // Immutable provenance preserved
      trustClass: part.trustClass,
      taintFlags: Array.from(new Set([...part.taintFlags, ...additionalFlags])),
    };
  }

  /**
   * Check if content part has a specific trust class.
   */
  public static hasTrustClass(part: QuarantinedContentPart, expected: TrustClass): boolean {
    return part.trustClass === expected;
  }
}
