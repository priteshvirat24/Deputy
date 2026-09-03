import { AlignedActionStep, AlignedDemonstrations, Demonstration } from '@deputy/domain';

export class AlignmentEngine {
  /**
   * Deterministically align 2 or more demonstrations of the same task.
   * Compares action types, sequences, and arguments without an LLM.
   */
  public align(demonstrations: Demonstration[]): AlignedDemonstrations {
    // Invariant: At least 2 demonstrations required for alignment
    if (!demonstrations || demonstrations.length < 2) {
      throw new Error(
        'INSUFFICIENT_EVIDENCE: Multi-demonstration alignment requires at least 2 completed demonstrations.',
      );
    }

    // Check if there is at least one common action across demonstrations
    const demoActionSets = demonstrations.map(d => new Set(d.actions.map(a => a.actionType)));
    const hasCommonAction = demonstrations[0]!.actions.some(a =>
      demoActionSets.every(set => set.has(a.actionType)),
    );

    if (!hasCommonAction) {
      throw new Error(
        'Incompatible action sequences: Demonstrations share no common semantic action types.',
      );
    }

    const demonstrationIds = demonstrations.map(d => d.demonstrationId);
    const divergences: string[] = [];

    // Find the demonstration with the longest action sequence as baseline
    const sortedDemos = [...demonstrations].sort((a, b) => b.actions.length - a.actions.length);
    const baseline = sortedDemos[0]!;

    // Check if sequences are compatible
    for (let i = 1; i < sortedDemos.length; i++) {
      const other = sortedDemos[i]!;
      const diff = Math.abs(baseline.actions.length - other.actions.length);
      if (diff > 1 && baseline.actions.length > 2) {
        divergences.push(
          `Sequence length divergence: Demo '${baseline.demonstrationId}' has ${baseline.actions.length} actions, while Demo '${other.demonstrationId}' has ${other.actions.length}.`,
        );
      }
    }

    const alignedSteps: AlignedActionStep[] = [];
    let penaltyPoints = 0;

    // Align step by step using the baseline sequence
    for (let stepIndex = 0; stepIndex < baseline.actions.length; stepIndex++) {
      const baseAction = baseline.actions[stepIndex]!;
      const actionType = baseAction.actionType;
      const actionVersion = baseAction.actionVersion;

      // Find matching action in each demonstration at this relative position
      const stepActions: { demoId: string; args: Record<string, unknown> }[] = [];
      const optionalInDemos: string[] = [];

      for (const demo of demonstrations) {
        // Try exact index first
        const candidateAction = demo.actions[stepIndex];
        if (candidateAction && candidateAction.actionType === actionType) {
          stepActions.push({ demoId: demo.demonstrationId, args: candidateAction.arguments });
        } else {
          // Search if action exists elsewhere (optional action)
          const found = demo.actions.find(a => a.actionType === actionType);
          if (found) {
            stepActions.push({ demoId: demo.demonstrationId, args: found.arguments });
          } else {
            optionalInDemos.push(demo.demonstrationId);
            penaltyPoints += 15;
            divergences.push(
              `Optional action detected: Action '${actionType}' is present in some demonstrations but missing in '${demo.demonstrationId}'.`,
            );
          }
        }
      }

      // If action is absent in all demos, fail
      if (stepActions.length === 0) {
        throw new Error(
          `Incompatible action sequences: Action '${actionType}' at step ${stepIndex} cannot be aligned across demonstrations.`,
        );
      }

      // Collect all argument keys across observed actions for this step
      const allArgKeys = new Set<string>();
      for (const sa of stepActions) {
        Object.keys(sa.args).forEach(k => allArgKeys.add(k));
      }

      const stableArguments: Record<string, unknown> = {};
      const variableArguments: Record<string, unknown[]> = {};

      for (const key of allArgKeys) {
        const observedVals = stepActions.map(sa => sa.args[key]);
        const firstVal = observedVals[0];

        // Check if all values are deeply equal
        const isStable = observedVals.every(v => JSON.stringify(v) === JSON.stringify(firstVal));

        if (isStable && firstVal !== undefined) {
          stableArguments[key] = firstVal;
        } else {
          variableArguments[key] = observedVals;
        }
      }

      alignedSteps.push({
        stepOrder: stepIndex,
        actionType,
        actionVersion,
        stableArguments,
        variableArguments,
        optionalInDemonstrations: optionalInDemos.length > 0 ? optionalInDemos : undefined,
      });
    }

    const alignmentScore = Math.max(0.2, (100 - penaltyPoints) / 100);

    return {
      demonstrationIds,
      alignedSteps,
      alignmentScore,
      divergences,
    };
  }
}
