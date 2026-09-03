import { ProvenanceRecord, TrustClass } from './provenance.js';

export interface QuarantinedContentPart {
  type: 'text' | 'json' | 'reference';
  value: unknown;
  provenance: ProvenanceRecord;
  trustClass: TrustClass;
  taintFlags: string[];
}

export interface ResponseBudget {
  maxBytes: number;
  maxCharacters: number;
  maxItems: number;
  maxDepth: number;
}

export const DEFAULT_RESPONSE_BUDGET: ResponseBudget = {
  maxBytes: 65536, // 64 KB
  maxCharacters: 50000,
  maxItems: 100,
  maxDepth: 6,
};

export interface QuarantineEvaluationResult {
  allowed: boolean;
  trustClass: TrustClass;
  taintFlags: string[];
  refusalCode?: string;
  refusalReason?: string;
  details?: Record<string, unknown>;
}
