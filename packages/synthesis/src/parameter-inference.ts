import {
  AlignedDemonstrations,
  IActionRegistry,
  ParameterCandidate,
  ParameterCategory,
} from '@deputy/domain';

const VOLATILE_FIELD_NAMES = new Set([
  'requestid',
  'reqid',
  'timestamp',
  'time',
  'correlationid',
  'corrid',
  'nonce',
  'token',
  'sessiontoken',
  'sessionid',
  'createdat',
  'updatedat',
  'idempotencykey',
  '_id',
]);

export class ParameterInferenceEngine {
  /**
   * Infer tool parameter candidates from aligned demonstration steps.
   * Leverages ActionRegistry schemas as authoritative source.
   */
  public infer(
    aligned: AlignedDemonstrations,
    actionRegistry?: IActionRegistry,
  ): ParameterCandidate[] {
    const candidates: ParameterCandidate[] = [];
    const usedParamNames = new Set<string>();

    for (const step of aligned.alignedSteps) {
      const registeredAction = actionRegistry?.get(step.actionType, step.actionVersion);
      const inputSchema = registeredAction?.inputSchema as
        | {
            properties?: Record<
              string,
              {
                type?: string;
                minimum?: number;
                enum?: unknown[];
                properties?: { enum?: unknown[] };
              }
            >;
          }
        | undefined;
      const actionSchemaProps = inputSchema?.properties || {};

      // Process variable arguments (these vary across demonstrations)
      for (const [argKey, observedValues] of Object.entries(step.variableArguments)) {
        const lowerKey = argKey.toLowerCase();

        // Check if volatile metadata
        if (VOLATILE_FIELD_NAMES.has(lowerKey)) {
          continue; // Filter volatile metadata, do not parameterize
        }

        // Categorize parameter
        const category: ParameterCategory =
          lowerKey.endsWith('id') && !lowerKey.includes('customer') && !lowerKey.includes('user')
            ? 'IDENTIFIER'
            : 'USER_INPUT';

        // Infer type: prefer registered action schema if available, else derive from observed values
        const schemaDef = actionSchemaProps[argKey];
        const inferredType = this.resolveType(observedValues, schemaDef);

        // Generate deterministic, clean parameter name
        const paramName = this.formatParameterName(
          step.actionType,
          argKey,
          aligned.alignedSteps.length > 1,
          usedParamNames,
        );
        usedParamNames.add(paramName);

        // Check if enum applies
        const enumValues =
          schemaDef?.enum ||
          (Array.isArray(schemaDef?.properties?.enum) ? schemaDef.properties.enum : undefined);

        // Calculate confidence
        const hasSchemaSupport = !!schemaDef;
        const confidence = hasSchemaSupport ? 0.98 : 0.85;

        candidates.push({
          parameterName: paramName,
          sourceAction: step.actionType,
          sourceArgumentPath: argKey,
          observedValues,
          inferredType,
          category,
          confidence,
          reason: hasSchemaSupport
            ? `Varies across demonstrations (${observedValues.join(' vs ')}). Type verified by '${step.actionType}' action schema.`
            : `Varies across demonstrations (${observedValues.join(' vs ')}). Type inferred from empirical values.`,
          isOptional: !!step.optionalInDemonstrations,
          enumValues,
        });
      }
    }

    return candidates;
  }

  /**
   * Determine parameter type safely.
   */
  private resolveType(
    values: unknown[],
    schemaDef?: { type?: string; minimum?: number },
  ): ParameterCandidate['inferredType'] {
    if (schemaDef?.type) {
      if (schemaDef.type === 'integer') return 'integer';
      if (schemaDef.type === 'number') return 'number';
      if (schemaDef.type === 'boolean') return 'boolean';
      if (schemaDef.type === 'array') return 'array';
      if (schemaDef.type === 'object') return 'object';
      return 'string';
    }

    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    if (nonNullValues.length === 0) return 'string';

    const allNumbers = nonNullValues.every(v => typeof v === 'number');
    if (allNumbers) {
      const allInts = nonNullValues.every(v => Number.isInteger(v));
      return allInts ? 'integer' : 'number';
    }

    const allBooleans = nonNullValues.every(v => typeof v === 'boolean');
    if (allBooleans) return 'boolean';

    const allArrays = nonNullValues.every(v => Array.isArray(v));
    if (allArrays) return 'array';

    const allObjects = nonNullValues.every(v => typeof v === 'object');
    if (allObjects) return 'object';

    return 'string';
  }

  /**
   * Format human-readable parameter names deterministically (e.g. customerName, invoiceAmount).
   */
  private formatParameterName(
    actionType: string,
    argKey: string,
    isMultiAction: boolean,
    existingNames: Set<string>,
  ): string {
    // If single action, simple camelCase key (e.g. name, email, amount) is usually fine,
    // but if it's generic (e.g. 'name'), combine with action entity noun (e.g. customerName)
    let candidate = argKey;

    const actionNoun = actionType.split('.')[0] || actionType.split('_')[0] || '';
    if (actionNoun && !argKey.toLowerCase().startsWith(actionNoun.toLowerCase())) {
      if (
        ['name', 'id', 'email', 'amount', 'date', 'type'].includes(argKey.toLowerCase()) ||
        isMultiAction
      ) {
        candidate = `${actionNoun}${argKey.charAt(0).toUpperCase()}${argKey.slice(1)}`;
      }
    }

    // Ensure uniqueness
    if (existingNames.has(candidate)) {
      candidate = `${actionNoun}_${argKey}`;
    }

    return candidate;
  }
}
