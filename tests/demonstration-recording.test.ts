import { describe, expect, it } from 'vitest';
import { RecordingStateMachine } from '@deputy/synthesis';
import { SemanticAction } from '@deputy/domain';

function createMockAction(id: string, actionType = 'customer.create'): SemanticAction {
  return {
    actionId: id,
    actionType,
    actionVersion: 1,
    arguments: { name: 'Test User', email: 'test@example.com' },
    actor: { id: 'usr_1', type: 'HUMAN', role: 'operator' },
    timestamp: new Date(),
    sessionId: 'sess_1',
    demonstrationId: 'demo_1',
    sideEffects: ['Writes profile'],
    reversibility: 'COMPENSATABLE',
    provenance: {
      source: 'test',
      origin: 'test',
      trustClass: 'FIRST_PARTY',
      retrievedAt: new Date(),
      contentId: `cid_${id}`,
    },
    correlationId: 'corr_1',
  };
}

describe('Demonstration Recording State Machine & Ingestion', () => {
  // Test 1: Start recording
  it('Test 1: Initializes session in RECORDING state', () => {
    const machine = new RecordingStateMachine({
      sessionId: 'sess_1',
      demonstrationId: 'demo_1',
      actorId: 'usr_1',
      state: 'RECORDING',
      startedAt: new Date(),
      actionCount: 0,
      lastSequenceNumber: 0,
      metadata: {},
    });

    expect(machine.getSession().state).toBe('RECORDING');
    expect(machine.getSession().actionCount).toBe(0);
  });

  // Test 2: Capture semantic action
  it('Test 2: Captures valid semantic action with monotonic sequence number', () => {
    const machine = new RecordingStateMachine({
      sessionId: 'sess_1',
      demonstrationId: 'demo_1',
      actorId: 'usr_1',
      state: 'RECORDING',
      startedAt: new Date(),
      actionCount: 0,
      lastSequenceNumber: 0,
      metadata: {},
    });

    const action = createMockAction('act_001');
    const { session, action: recorded } = machine.ingestAction({ action, sequenceNumber: 1 });

    expect(session.actionCount).toBe(1);
    expect(session.lastSequenceNumber).toBe(1);
    expect(recorded.actionId).toBe('act_001');
  });

  // Test 3: Pause recording
  it('Test 3: Successfully pauses active recording session', () => {
    const machine = new RecordingStateMachine({
      sessionId: 'sess_1',
      demonstrationId: 'demo_1',
      actorId: 'usr_1',
      state: 'RECORDING',
      startedAt: new Date(),
      actionCount: 0,
      lastSequenceNumber: 0,
      metadata: {},
    });

    const paused = machine.transition('PAUSED');
    expect(paused.state).toBe('PAUSED');
    expect(paused.pausedAt).toBeDefined();
  });

  // Test 4: Resume recording
  it('Test 4: Successfully resumes paused recording session', () => {
    const machine = new RecordingStateMachine({
      sessionId: 'sess_1',
      demonstrationId: 'demo_1',
      actorId: 'usr_1',
      state: 'RECORDING',
      startedAt: new Date(),
      actionCount: 0,
      lastSequenceNumber: 0,
      metadata: {},
    });

    machine.transition('PAUSED');
    const resumed = machine.transition('RECORDING');
    expect(resumed.state).toBe('RECORDING');
    expect(resumed.pausedAt).toBeUndefined();
  });

  // Test 5: Complete recording
  it('Test 5: Successfully completes recording session', () => {
    const machine = new RecordingStateMachine({
      sessionId: 'sess_1',
      demonstrationId: 'demo_1',
      actorId: 'usr_1',
      state: 'RECORDING',
      startedAt: new Date(),
      actionCount: 2,
      lastSequenceNumber: 2,
      metadata: {},
    });

    machine.transition('COMPLETING');
    const completed = machine.transition('COMPLETED');
    expect(completed.state).toBe('COMPLETED');
    expect(completed.completedAt).toBeDefined();
  });

  // Test 6: Discard recording
  it('Test 6: Successfully discards recording session', () => {
    const machine = new RecordingStateMachine({
      sessionId: 'sess_1',
      demonstrationId: 'demo_1',
      actorId: 'usr_1',
      state: 'RECORDING',
      startedAt: new Date(),
      actionCount: 1,
      lastSequenceNumber: 1,
      metadata: {},
    });

    const discarded = machine.transition('DISCARDED');
    expect(discarded.state).toBe('DISCARDED');
    expect(discarded.completedAt).toBeDefined();
  });

  // Test 7: Reject invalid state transitions
  it('Test 7: Rejects invalid recording state transitions', () => {
    const machine = new RecordingStateMachine({
      sessionId: 'sess_1',
      demonstrationId: 'demo_1',
      actorId: 'usr_1',
      state: 'RECORDING',
      startedAt: new Date(),
      actionCount: 0,
      lastSequenceNumber: 0,
      metadata: {},
    });

    machine.transition('COMPLETING');
    machine.transition('COMPLETED');

    // Forbidden transition from COMPLETED -> RECORDING
    expect(() => machine.transition('RECORDING')).toThrow(/Invalid recording state transition/);
  });

  // Test 8: Reject duplicate action IDs
  it('Test 8: Rejects ingestion of duplicate action IDs within session', () => {
    const machine = new RecordingStateMachine({
      sessionId: 'sess_1',
      demonstrationId: 'demo_1',
      actorId: 'usr_1',
      state: 'RECORDING',
      startedAt: new Date(),
      actionCount: 0,
      lastSequenceNumber: 0,
      metadata: {},
    });

    const action = createMockAction('act_dup_1');
    machine.ingestAction({ action, sequenceNumber: 1 });

    expect(() => machine.ingestAction({ action, sequenceNumber: 2 })).toThrow(
      /Duplicate action rejected/,
    );
  });

  // Test 9: Reject out-of-order sequence numbers
  it('Test 9: Rejects out-of-order sequence numbers', () => {
    const machine = new RecordingStateMachine({
      sessionId: 'sess_1',
      demonstrationId: 'demo_1',
      actorId: 'usr_1',
      state: 'RECORDING',
      startedAt: new Date(),
      actionCount: 0,
      lastSequenceNumber: 0,
      metadata: {},
    });

    const action = createMockAction('act_seq_1');
    expect(() => machine.ingestAction({ action, sequenceNumber: 5 })).toThrow(
      /Out-of-order action rejected: expected sequence number 1, received 5/,
    );
  });
});
