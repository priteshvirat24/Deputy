import { ParameterCandidate } from '@deputy/domain';

export class SchemaGenerator {
  /**
   * Generate a strict, valid JSON Schema from parameter candidates.
   * Enforces `additionalProperties: false` and strict required lists.
   */
  public generate(candidates: ParameterCandidate[]): Record<string, unknown> {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const param of candidates) {
      const propDef: Record<string, unknown> = {
        type: param.inferredType,
        description: `Inferred parameter from ${param.sourceAction}.${param.sourceArgumentPath}`,
      };

      // Apply specific formats or constraints
      if (param.parameterName.toLowerCase().includes('email')) {
        propDef['format'] = 'email';
      }

      if (param.inferredType === 'number' || param.inferredType === 'integer') {
        if (param.parameterName.toLowerCase().includes('amount')) {
          propDef['minimum'] = 0;
        }
      }

      if (param.enumValues && param.enumValues.length > 0) {
        propDef['enum'] = param.enumValues;
      }

      properties[param.parameterName] = propDef;

      if (!param.isOptional) {
        required.push(param.parameterName);
      }
    }

    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    };
  }
}
