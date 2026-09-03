import { DEFAULT_RESPONSE_BUDGET, ResponseBudget } from '@deputy/domain';

export interface BudgetInspectionResult {
  withinBudget: boolean;
  refusalCode?:
    'RESPONSE_QUARANTINED' | 'MAX_BYTE_SIZE_EXCEEDED' | 'MAX_DEPTH_EXCEEDED' | 'MAX_ITEMS_EXCEEDED';
  refusalReason?: string;
  stats: {
    bytes: number;
    characters: number;
    items: number;
    depth: number;
  };
}

export class ResponseBudgetEnforcer {
  private budget: ResponseBudget;

  constructor(budget: Partial<ResponseBudget & { maxByteSize?: number }> = {}) {
    const maxBytes = budget.maxBytes ?? budget.maxByteSize ?? DEFAULT_RESPONSE_BUDGET.maxBytes;
    this.budget = { ...DEFAULT_RESPONSE_BUDGET, ...budget, maxBytes };
  }

  /**
   * Evaluate content against strict response budgets.
   * Oversized content must fail closed rather than silently truncate
   * in a way that could alter security meaning.
   */
  public evaluate(content: unknown): BudgetInspectionResult {
    let serialized: string;
    try {
      serialized = typeof content === 'string' ? content : JSON.stringify(content) || '';
    } catch {
      serialized = String(content);
    }

    const bytes = Buffer.byteLength(serialized, 'utf8');
    const characters = serialized.length;
    const items = this.countItems(content);
    const depth = this.calculateDepth(content);

    const stats = { bytes, characters, items, depth };

    if (bytes > this.budget.maxBytes) {
      return {
        withinBudget: false,
        refusalCode: 'RESPONSE_QUARANTINED',
        refusalReason: `Response byte size (${bytes}B) exceeds maximum allowed budget (${this.budget.maxBytes}B).`,
        stats,
      };
    }

    if (characters > this.budget.maxCharacters) {
      return {
        withinBudget: false,
        refusalCode: 'RESPONSE_QUARANTINED',
        refusalReason: `Response character length (${characters}) exceeds maximum allowed budget (${this.budget.maxCharacters}).`,
        stats,
      };
    }

    if (items > this.budget.maxItems) {
      return {
        withinBudget: false,
        refusalCode: 'RESPONSE_QUARANTINED',
        refusalReason: `Response item count (${items}) exceeds maximum allowed budget (${this.budget.maxItems}).`,
        stats,
      };
    }

    if (depth > this.budget.maxDepth) {
      return {
        withinBudget: false,
        refusalCode: 'RESPONSE_QUARANTINED',
        refusalReason: `Response nesting depth (${depth}) exceeds maximum allowed depth (${this.budget.maxDepth}).`,
        stats,
      };
    }

    return { withinBudget: true, stats };
  }

  private countItems(val: unknown): number {
    if (val === null || typeof val !== 'object') return 1;
    if (Array.isArray(val)) {
      return val.reduce((acc, curr) => acc + this.countItems(curr), val.length);
    }
    const entries = Object.entries(val);
    return entries.reduce((acc, [, v]) => acc + this.countItems(v), entries.length);
  }

  private calculateDepth(val: unknown, current = 0): number {
    if (val === null || typeof val !== 'object') return current;
    if (Array.isArray(val)) {
      if (val.length === 0) return current + 1;
      return Math.max(...val.map(item => this.calculateDepth(item, current + 1)));
    }
    const values = Object.values(val);
    if (values.length === 0) return current + 1;
    return Math.max(...values.map(v => this.calculateDepth(v, current + 1)));
  }
}
