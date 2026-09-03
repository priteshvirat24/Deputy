import React, { useEffect, useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Check,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Demonstration, SynthesisCandidateResult } from '@deputy/domain';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Surface } from '../components/ui/Surface.js';
import { JsonSchemaViewer } from '../components/ui/JsonSchemaViewer.js';
import { useToast } from '../context/ToastContext.js';

interface SynthesisStudioProps {
  onToolApproved: () => void;
}

type SynthesisStage = 1 | 2 | 3 | 4 | 5;

export const SynthesisStudioView: React.FC<SynthesisStudioProps> = ({ onToolApproved }) => {
  const { showToast } = useToast();
  const [demonstrations, setDemonstrations] = useState<Demonstration[]>([]);
  const [selectedDemoIds, setSelectedDemoIds] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<SynthesisStage>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alignment and Synthesis Results
  const [synthesisResult, setSynthesisResult] = useState<SynthesisCandidateResult | null>(null);

  // Human Review & Metadata Edit state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [approving, setApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  useEffect(() => {
    fetchDemonstrations();
  }, []);

  const fetchDemonstrations = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/demonstrations?status=COMPLETED');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setDemonstrations(json.data);
        // Default select first two demonstrations if available
        if (json.data.length >= 2) {
          setSelectedDemoIds([json.data[0].demonstrationId, json.data[1].demonstrationId]);
        } else if (json.data.length === 1) {
          setSelectedDemoIds([json.data[0].demonstrationId]);
        }
      }
    } catch {
      // ignore
    }
  };

  const toggleSelectDemo = (id: string) => {
    if (selectedDemoIds.includes(id)) {
      setSelectedDemoIds(selectedDemoIds.filter(d => d !== id));
    } else {
      setSelectedDemoIds([...selectedDemoIds, id]);
    }
  };

  // Selected demonstrations objects
  const selectedDemos = useMemo(() => {
    return demonstrations.filter(d => selectedDemoIds.includes(d.demonstrationId));
  }, [demonstrations, selectedDemoIds]);

  // Run Synthesis
  const runSynthesis = async () => {
    if (selectedDemoIds.length < 2) {
      showToast(
        'error',
        'Demonstration Requirement',
        'Please select at least 2 completed demonstrations to infer variational parameters.',
      );
      return;
    }

    setLoading(true);
    setError(null);
    setApprovalSuccess(false);

    try {
      const res = await fetch('http://localhost:4000/api/synthesis/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demonstrationIds: selectedDemoIds }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Synthesis failed');
      }

      setSynthesisResult(json.data);
      setEditName(json.data.candidateTool.name);
      setEditDescription(json.data.candidateTool.description);
      setCurrentStage(2);
      showToast(
        'success',
        'Synthesis Complete',
        `Inferred ${json.data.report.inferredParameters.length} variational parameters with strict schema contract.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToast('error', 'Synthesis Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // Human Approval Ceremony
  const approveCandidate = async () => {
    if (!synthesisResult) return;
    setApproving(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:4000/api/synthesis/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: synthesisResult.candidateTool.toolId,
          name: editName.trim(),
          description: editDescription.trim(),
          inputSchema: synthesisResult.candidateTool.inputSchema,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Approval failed');
      }

      setApprovalSuccess(true);
      showToast(
        'success',
        'Capability Approved & Registered',
        `Tool "${editName}" is now active in browser WebMCP runtime.`,
      );
      onToolApproved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showToast('error', 'Approval Failed', msg);
    } finally {
      setApproving(false);
    }
  };

  const steps = [
    {
      num: 1,
      label: '01 EVIDENCE',
      active: currentStage === 1,
      completed: currentStage > 1 || !!synthesisResult,
    },
    { num: 2, label: '02 ALIGNMENT', active: currentStage === 2, completed: currentStage > 2 },
    { num: 3, label: '03 PARAMETERS', active: currentStage === 3, completed: currentStage > 3 },
    { num: 4, label: '04 CAPABILITY', active: currentStage === 4, completed: currentStage > 4 },
    { num: 5, label: '05 APPROVAL', active: currentStage === 5, completed: approvalSuccess },
  ];

  return (
    <div className="page-body">
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--semantic-auth)',
                fontWeight: 700,
              }}
            >
              LEARNING PIPELINE
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              DETERMINISTIC SYNTHESIS ENGINE
            </span>
          </div>
          <h1 className="page-title">Tool Synthesis Studio</h1>
          <p className="page-description">
            Transform empirical demonstration traces into typed, authorized WebMCP tools via
            deterministic sequence alignment, variational inference, and strict schema contracts.
          </p>
        </div>

        {synthesisResult && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSynthesisResult(null);
                setCurrentStage(1);
                setApprovalSuccess(false);
              }}
            >
              Reset Pipeline
            </button>
          </div>
        )}
      </div>

      {/* 5-Stage Visible Stepper */}
      <div className="synthesis-stepper">
        {steps.map(s => {
          const isClickable = (s.completed || s.active) && !!synthesisResult;
          return (
            <div
              key={s.num}
              className={`synthesis-step-node ${s.active ? 'active' : ''} ${s.completed ? 'completed' : ''}`}
              onClick={() => {
                if (isClickable) setCurrentStage(s.num as SynthesisStage);
              }}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              <div className="synthesis-step-badge">
                {s.completed && !s.active ? <Check size={14} /> : `0${s.num}`}
              </div>
              <span className="synthesis-step-label">{s.label}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <Surface
          level={2}
          style={{
            borderColor: 'rgba(244, 63, 94, 0.4)',
            background: 'rgba(244, 63, 94, 0.06)',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--semantic-danger)',
              fontSize: '0.84rem',
            }}
          >
            <AlertTriangle size={16} />
            <span style={{ fontWeight: 600 }}>Synthesis Failed: {error}</span>
          </div>
        </Surface>
      )}

      {/* STAGE 1: EVIDENCE */}
      {currentStage === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Surface
            level={2}
            headerTitle="1. Select Demonstrations for Alignment"
            headerMeta={`MINIMUM 2 REQUIRED · ${selectedDemoIds.length} SELECTED`}
            headerAction={
              <button
                type="button"
                className="btn btn-accent"
                disabled={selectedDemoIds.length < 2 || loading}
                onClick={runSynthesis}
                style={{ gap: 8 }}
              >
                <Sparkles size={14} />
                <span>
                  {loading
                    ? 'Aligning & Synthesizing...'
                    : `Synthesize Tool from ${selectedDemoIds.length} Demonstrations`}
                </span>
              </button>
            }
          >
            {demonstrations.length === 0 ? (
              <EmptyState
                icon={<Sparkles size={22} />}
                title="No Completed Demonstrations Found"
                description="Use the Operations Console with recording active to capture at least 2 task demonstrations (e.g. Alice and Bob customer setups)."
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 12,
                }}
              >
                {demonstrations.map(demo => {
                  const isSelected = selectedDemoIds.includes(demo.demonstrationId);
                  return (
                    <div
                      key={demo.demonstrationId}
                      onClick={() => toggleSelectDemo(demo.demonstrationId)}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isSelected ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface-1)',
                        cursor: 'pointer',
                        transition:
                          'border-color var(--motion-fast), background var(--motion-fast)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <span
                          className="mono"
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: isSelected ? '#a5b4fc' : 'var(--text-primary)',
                          }}
                        >
                          {demo.demonstrationId}
                        </span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ accentColor: 'var(--border-focus)', cursor: 'pointer' }}
                        />
                      </div>

                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                          marginBottom: 8,
                        }}
                      >
                        {demo.taskDescription || 'Enterprise task execution'}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          fontSize: '0.72rem',
                          alignItems: 'center',
                        }}
                      >
                        <Badge variant="active">{demo.actions.length} action(s)</Badge>
                        <span className="mono" style={{ color: 'var(--text-muted)' }}>
                          Actor: {demo.actorId}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Surface>

          {/* Side-by-Side Action Alignment Inspection */}
          {selectedDemos.length >= 2 && (
            <Surface
              level={2}
              headerTitle="Side-by-Side Demonstration Trace Alignment"
              headerMeta="COMPARISON PREVIEW"
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${selectedDemos.length}, 1fr)`,
                  gap: 16,
                }}
              >
                {selectedDemos.map((demo, colIdx) => (
                  <div
                    key={demo.demonstrationId}
                    style={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                        borderBottom: '1px solid var(--border-subtle)',
                        paddingBottom: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Demonstration 0{colIdx + 1}: {demo.actorId}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
                        >
                          {demo.demonstrationId}
                        </div>
                      </div>
                      <Badge variant="draft">{demo.actions.length} steps</Badge>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {demo.actions.map((act, stepIdx) => (
                        <div
                          key={stepIdx}
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-xs)',
                            padding: 10,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 6,
                            }}
                          >
                            <span
                              className="mono"
                              style={{
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                color: 'var(--semantic-auth)',
                              }}
                            >
                              0{stepIdx + 1}. {act.actionType}
                            </span>
                            <Badge variant="draft">v{act.actionVersion}</Badge>
                          </div>
                          <pre
                            className="mono"
                            style={{
                              background: 'var(--surface-0)',
                              padding: '6px 8px',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '0.72rem',
                              color: '#cbd5e1',
                              margin: 0,
                            }}
                          >
                            {JSON.stringify(act.arguments, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          )}
        </div>
      )}

      {/* STAGE 2: ALIGNMENT */}
      {currentStage === 2 && synthesisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Surface
            level={2}
            headerTitle="2. Deterministic Action Sequence Alignment"
            headerMeta={`CONFIDENCE: ${Math.round(synthesisResult.report.confidenceScore * 100)}%`}
            headerAction={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentStage(3)}
                style={{ gap: 6 }}
              >
                <span>Proceed to Parameters</span>
                <ChevronRight size={14} />
              </button>
            }
          >
            {/* Reasoning Block */}
            <div
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Deterministic Alignment Reasoning (No LLM Guesswork)
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {synthesisResult.report.reasoning.map((r, idx) => (
                  <li key={idx}>
                    <span style={{ color: 'var(--text-primary)' }}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Matched Actions & Variational Mapping Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  fontSize: '0.76rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                Action Step Alignment Breakdown
              </div>

              {synthesisResult.candidateTool.executionBinding.type === 'COMPOSITE_ACTION' ? (
                synthesisResult.candidateTool.executionBinding.actions.map((step, idx) => (
                  <div
                    key={step.stepOrder}
                    style={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className="mono"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--semantic-auth)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          0{idx + 1}
                        </span>
                        <span
                          className="mono"
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          MATCHED: {step.actionId}
                        </span>
                        <Badge variant="draft">v{step.actionVersion}</Badge>
                      </div>
                      <Badge variant="active">DETERMINISTIC MATCH</Badge>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Underlying registered handler mapped to{' '}
                      <code>ActionRegistry.{step.actionId}</code>.
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="mono"
                      style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}
                    >
                      MATCHED: {synthesisResult.candidateTool.executionBinding.actionId}
                    </span>
                    <Badge variant="active">DIRECT BINDING</Badge>
                  </div>
                </div>
              )}
            </div>
          </Surface>
        </div>
      )}

      {/* STAGE 3: PARAMETERS */}
      {currentStage === 3 && synthesisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Surface
            level={2}
            headerTitle="3. Parameter Variational Inference"
            headerMeta={`${synthesisResult.report.inferredParameters.length} INFERRED`}
            headerAction={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentStage(4)}
                style={{ gap: 6 }}
              >
                <span>Proceed to Capability Preview</span>
                <ChevronRight size={14} />
              </button>
            }
          >
            {/* Inferred Parameters Table */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                }}
              >
                Inferred Variational Parameters
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Parameter Name</th>
                      <th>Inferred Type</th>
                      <th>Source Action & Argument</th>
                      <th>Observed Values Across Traces</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthesisResult.report.inferredParameters.map(param => (
                      <tr key={param.parameterName}>
                        <td>
                          <span
                            className="mono"
                            style={{ color: 'var(--semantic-auth)', fontWeight: 600 }}
                          >
                            {param.parameterName}
                          </span>
                        </td>
                        <td>
                          <Badge variant="draft">{param.inferredType}</Badge>
                        </td>
                        <td>
                          <span
                            className="mono"
                            style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}
                          >
                            {param.sourceAction}.{param.sourceArgumentPath}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {param.observedValues.map((v, i) => (
                              <span
                                key={i}
                                className="badge badge-active mono"
                                style={{ fontSize: '0.72rem' }}
                              >
                                {String(v)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--semantic-emerald)',
                              fontWeight: 600,
                            }}
                          >
                            {Math.round(param.confidence * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stable Constants vs Volatiles Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Stable Constants */}
              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--semantic-webmcp)',
                      fontWeight: 700,
                    }}
                  >
                    Stable Constants (Invariant)
                  </span>
                  <Badge variant="webmcp">UNIFORM</Badge>
                </div>
                <div
                  style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 8 }}
                >
                  This value was consistent across all demonstration traces and is retained as a
                  constant execution default.
                </div>

                {Object.entries(synthesisResult.report.stableConstants).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Object.entries(synthesisResult.report.stableConstants).map(([k, v]) => (
                      <div
                        key={k}
                        className="mono"
                        style={{
                          fontSize: '0.78rem',
                          background: 'var(--surface-0)',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-xs)',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>{k} = </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    No constant fields detected.
                  </span>
                )}
              </div>

              {/* Ignored Volatile Metadata */}
              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                    }}
                  >
                    Ignored Volatile Metadata
                  </span>
                  <Badge variant="draft">FILTERED</Badge>
                </div>
                <div
                  style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 8 }}
                >
                  Excluded from reusable capability parameters to prevent overfitting to ephemeral
                  runtime session tokens.
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {synthesisResult.report.ignoredVolatileFields.length > 0 ? (
                    synthesisResult.report.ignoredVolatileFields.map(f => (
                      <span
                        key={f}
                        className="badge badge-draft mono"
                        style={{ fontSize: '0.74rem' }}
                      >
                        {f}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      None filtered.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Surface>
        </div>
      )}

      {/* STAGE 4: CAPABILITY */}
      {currentStage === 4 && synthesisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Surface
            level={2}
            headerTitle="4. Capability Contract & Action Graph Preview"
            headerMeta={synthesisResult.candidateTool.toolId}
            headerAction={
              <button
                type="button"
                className="btn btn-accent btn-sm"
                onClick={() => setCurrentStage(5)}
                style={{ gap: 6 }}
              >
                <span>Proceed to Human Approval</span>
                <ChevronRight size={14} />
              </button>
            }
          >
            {/* Capability Spec Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: 'var(--surface-1)',
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Capability
                </div>
                <div
                  className="mono"
                  style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}
                >
                  {synthesisResult.candidateTool.name}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--surface-1)',
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Risk Tier
                </div>
                <Badge
                  variant={`risk-${synthesisResult.candidateTool.riskLevel.toLowerCase()}` as any}
                >
                  {synthesisResult.candidateTool.riskLevel}
                </Badge>
              </div>

              <div
                style={{
                  background: 'var(--surface-1)',
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Reversibility
                </div>
                <Badge variant={synthesisResult.candidateTool.reversibility.toLowerCase() as any}>
                  {synthesisResult.candidateTool.reversibility}
                </Badge>
              </div>

              <div
                style={{
                  background: 'var(--surface-1)',
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Authorization
                </div>
                <span
                  style={{ fontSize: '0.78rem', color: 'var(--semantic-auth)', fontWeight: 600 }}
                >
                  {synthesisResult.candidateTool.approvalPolicy.requiresHumanAuthorization
                    ? 'HUMAN REQUIRED'
                    : 'AUTONOMOUS'}
                </span>
              </div>
            </div>

            {/* Action Graph & Dataflow Visualizer */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Exact Action Sequence Graph & Parameter Dataflow
              </div>
              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  overflowX: 'auto',
                }}
              >
                <div
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border-auth)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--semantic-auth)',
                  }}
                >
                  Tool: {synthesisResult.candidateTool.name}
                </div>

                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />

                {synthesisResult.candidateTool.executionBinding.type === 'COMPOSITE_ACTION' ? (
                  synthesisResult.candidateTool.executionBinding.actions.map((act, i) => (
                    <React.Fragment key={act.stepOrder}>
                      <div
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border-default)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <span
                          className="mono"
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {i + 1}. {act.actionId}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          ActionRegistry Handler
                        </span>
                      </div>
                      {i <
                        (synthesisResult.candidateTool.executionBinding as any).actions.length -
                          1 && <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />}
                    </React.Fragment>
                  ))
                ) : (
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-default)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span
                      className="mono"
                      style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      {synthesisResult.candidateTool.executionBinding.actionId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Generated JSON Schema Contract */}
            <div>
              <JsonSchemaViewer
                schema={synthesisResult.candidateTool.inputSchema}
                title="Generated Strict JSON Schema (Contract)"
                maxHeight={240}
              />
            </div>
          </Surface>
        </div>
      )}

      {/* STAGE 5: APPROVAL */}
      {currentStage === 5 && synthesisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Surface
            level={2}
            headerTitle="5. Human Authority Review & WebMCP Activation"
            headerMeta={approvalSuccess ? 'ACTIVATED IN RUNTIME' : 'CONSEQUENTIAL DECISION'}
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}
            >
              <div>
                <label className="form-label">Capability Name in WebMCP</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={approvalSuccess || approving}
                  required
                />
              </div>

              <div>
                <label className="form-label">Semantic Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  disabled={approvalSuccess || approving}
                  required
                />
              </div>
            </div>

            <div
              style={{
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid var(--border-auth)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                marginBottom: 20,
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--semantic-auth)', marginBottom: 4 }}>
                What will be created:
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <li>
                  A new learned tool <code>{editName}</code> registered in the repository.
                </li>
                <li>
                  Dynamic capability registered into browser WebMCP runtime
                  (`window.navigator.modelContext`).
                </li>
                <li>
                  Single-use cryptographic execution policy requiring human authority for high-risk
                  executions.
                </li>
                <li>
                  Immutable provenance linked to source demonstrations:{' '}
                  {synthesisResult.candidateTool.sourceDemonstrations.join(', ')}.
                </li>
              </ul>
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}
            >
              {!approvalSuccess ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStage(4)}
                    disabled={approving}
                  >
                    Back to Preview
                  </button>
                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={approveCandidate}
                    disabled={approving || !editName.trim()}
                    style={{ gap: 8, padding: '8px 18px' }}
                  >
                    <ShieldCheck size={16} />
                    <span>
                      {approving ? 'Activating in WebMCP...' : 'Approve & Activate in WebMCP'}
                    </span>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--semantic-emerald)',
                      fontWeight: 600,
                      fontSize: '0.84rem',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Capability Registered in WebMCP!</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setSynthesisResult(null);
                      setCurrentStage(1);
                      setApprovalSuccess(false);
                    }}
                  >
                    Synthesize Another Capability
                  </button>
                </div>
              )}
            </div>
          </Surface>
        </div>
      )}
    </div>
  );
};
