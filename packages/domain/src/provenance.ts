/**
 * Provenance domain model.
 * Foundation for tracking data origins, trust classes, and future QUARANTINE layer.
 */

export type TrustClass =
  'FIRST_PARTY' | 'USER_GENERATED' | 'THIRD_PARTY' | 'EXTERNAL' | 'SYSTEM_GENERATED' | 'UNKNOWN';

export interface ProvenanceRecord {
  /** Source identifier (e.g. 'ui.form.refund', 'api.stripe.webhook', 'agent.prompt') */
  source: string;
  /** Origin URL or domain (e.g. 'https://admin.deputy.internal') */
  origin: string;
  /** Trust boundary classification */
  trustClass: TrustClass;
  /** Timestamp when the data was received or observed */
  retrievedAt: Date;
  /** Content hash or identifier for deterministic tracking */
  contentId: string;
  /** Optional taint or quarantine flags */
  taintFlags?: string[];
}
