import {
  isValidRecordingTransition,
  RecordingSession,
  RecordingSessionState,
  SemanticAction,
} from '@deputy/domain';

export interface IngestActionParams {
  action: SemanticAction;
  sequenceNumber: number;
}

export class RecordingStateMachine {
  private session: RecordingSession;
  private observedActionIds = new Set<string>();

  constructor(session: RecordingSession) {
    this.session = { ...session };
  }

  public getSession(): RecordingSession {
    return { ...this.session };
  }

  /**
   * Transition session to a target state. Throws if transition is forbidden.
   */
  public transition(targetState: RecordingSessionState): RecordingSession {
    if (!isValidRecordingTransition(this.session.state, targetState)) {
      throw new Error(
        `Invalid recording state transition from '${this.session.state}' to '${targetState}'.`,
      );
    }

    this.session.state = targetState;

    if (targetState === 'PAUSED') {
      this.session.pausedAt = new Date();
    } else if (targetState === 'RECORDING' && this.session.pausedAt) {
      this.session.pausedAt = undefined;
    } else if (targetState === 'COMPLETED' || targetState === 'DISCARDED') {
      this.session.completedAt = new Date();
    }

    return { ...this.session };
  }

  /**
   * Ingest a semantic action with idempotent sequence tracking.
   */
  public ingestAction(params: IngestActionParams): {
    session: RecordingSession;
    action: SemanticAction;
  } {
    if (this.session.state !== 'RECORDING') {
      throw new Error(
        `Cannot ingest actions into recording session in '${this.session.state}' state. Session must be RECORDING.`,
      );
    }

    const { action, sequenceNumber } = params;

    // 1. Check for duplicate actionId
    if (this.observedActionIds.has(action.actionId)) {
      throw new Error(
        `Duplicate action rejected: actionId '${action.actionId}' has already been recorded in this session.`,
      );
    }

    // 2. Check monotonic sequence order
    const expectedSequence = this.session.lastSequenceNumber + 1;
    if (sequenceNumber !== expectedSequence) {
      throw new Error(
        `Out-of-order action rejected: expected sequence number ${expectedSequence}, received ${sequenceNumber}.`,
      );
    }

    // 3. Record action
    this.observedActionIds.add(action.actionId);
    this.session.lastSequenceNumber = sequenceNumber;
    this.session.actionCount += 1;

    return {
      session: { ...this.session },
      action: { ...action },
    };
  }
}
