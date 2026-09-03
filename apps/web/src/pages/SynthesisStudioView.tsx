import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { Demonstration, SynthesisCandidateResult } from '@deputy/domain';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Surface } from '../components/ui/Surface.js';

interface SynthesisStudioProps {
  onToolApproved: () => void;
}

export const SynthesisStudioView: React.FC<SynthesisStudioProps> = ({ onToolApproved }) => {
  const [demonstrations, setDemonstrations] = useState<Demonstration[]>([]);
  const [selectedDemoIds, setSelectedDemoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synthesis candidate result
  const [synthesisResult, setSynthesisResult] = useState<SynthesisCandidateResult | null>(null);

  // Review & Approval state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchDemonstrations();
  }, []);

  const fetchDemonstrations = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/demonstrations?status=COMPLETED');
      const json = await res.json();
      if (json.data) {
        setDemonstrations(json.data);
        // Default select first two if available
        if (json.data.length >= 2) {
          setSelectedDemoIds([json.data[0].demonstrationId, json.data[1].demonstrationId]);
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

  const runSynthesis = async () => {
    if (selectedDemoIds.length < 2) return;
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

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
          name: editName,
          description: editDescription,
          inputSchema: synthesisResult.candidateTool.inputSchema,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Approval failed');
      }

      setApprovalSuccess(true);
      onToolApproved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
              SYNTHESIS ENGINE
            </span>
          </div>
          <h1 className="page-title">Tool Synthesis Studio</h1>
          <p className="page-description">
            Transform human demonstration traces into typed, authorized WebMCP tools via
            deterministic alignment and parameter inference.
          </p>
        </div>
      </div>

      {/* Step 1: Demonstration Selection */}
      <Surface
        level={2}
        headerTitle="1. Select Demonstrations for Alignment"
        headerMeta={`MINIMUM 2 REQUIRED · ${selectedDemoIds.length} SELECTED`}
        headerAction={
          <button
            type="button"
            className="btn btn-primary"
            disabled={selectedDemoIds.length < 2 || loading}
            onClick={runSynthesis}
            style={{ gap: '8px' }}
          >
            <Sparkles size={14} />
            <span>
              {loading
                ? 'Synthesizing...'
                : `Synthesize Tool from ${selectedDemoIds.length} Traces`}
            </span>
          </button>
        }
        style={{ marginBottom: '24px' }}
      >
        {demonstrations.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={20} />}
            title="No Completed Demonstrations"
            description="Record at least 2 task demonstrations in the Operations Console to synthesize a WebMCP tool."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '12px',
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
                    transition: 'border-color var(--motion-fast), background var(--motion-fast)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.8rem',
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
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                    }}
                  >
                    {demo.taskDescription || 'Enterprise task execution'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.72rem' }}>
                    <Badge variant="active">{demo.actions.length} action(s)</Badge>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(demo.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Surface>

      {error && (
        <Surface
          level={2}
          style={{
            borderColor: 'rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.05)',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--semantic-danger)',
              fontSize: '0.84rem',
            }}
          >
            <AlertTriangle size={16} />
            <span style={{ fontWeight: 600 }}>Synthesis Failed: {error}</span>
          </div>
        </Surface>
      )}

      {/* Step 2 & 3: Results & Human Review */}
      {synthesisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Alignment Report Surface */}
          <Surface
            level={2}
            headerTitle="2. Deterministic Alignment & Parameter Inference"
            headerMeta={`CONFIDENCE: ${Math.round(synthesisResult.report.confidenceScore * 100)}%`}
            headerAction={
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge
                  variant={`risk-${synthesisResult.candidateTool.riskLevel.toLowerCase()}` as any}
                >
                  Risk: {synthesisResult.candidateTool.riskLevel}
                </Badge>
                <Badge variant={synthesisResult.candidateTool.reversibility.toLowerCase() as any}>
                  {synthesisResult.candidateTool.reversibility}
                </Badge>
              </div>
            }
          >
            {/* Reasoning Block */}
            <div
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Deterministic Alignment Reasoning
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '18px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {synthesisResult.report.reasoning.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: '3px' }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Inferred Parameters Table */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                Inferred Variational Parameters ({synthesisResult.report.inferredParameters.length})
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parameter Name</th>
                    <th>Type</th>
                    <th>Source Action & Path</th>
                    <th>Observed Values Across Traces</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {synthesisResult.report.inferredParameters.map(param => (
                    <tr key={param.parameterName}>
                      <td>
                        <span className="mono" style={{ color: '#818cf8', fontWeight: 600 }}>
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
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {param.observedValues.map((v, i) => (
                            <span
                              key={i}
                              className="badge badge-active"
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

            {/* Stable Constants & Volatiles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--semantic-webmcp)',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  Stable Constants (Invariant Across Traces)
                </div>
                {Object.entries(synthesisResult.report.stableConstants).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {Object.entries(synthesisResult.report.stableConstants).map(([k, v]) => (
                      <div key={k} className="mono" style={{ fontSize: '0.76rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k} = </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    No constants detected
                  </span>
                )}
              </div>

              <div
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  Filtered Volatile Tokens (Ignored)
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {synthesisResult.report.ignoredVolatileFields.length > 0 ? (
                    synthesisResult.report.ignoredVolatileFields.map(f => (
                      <span
                        key={f}
                        className="badge badge-draft mono"
                        style={{ fontSize: '0.72rem' }}
                      >
                        {f}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      None ignored
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Surface>

          {/* Step 3: Human Authority Review & Approval */}
          <Surface
            level={2}
            headerTitle="3. Human Authority Review & WebMCP Activation"
            headerMeta={approvalSuccess ? 'ACTIVATED IN RUNTIME' : 'READY FOR APPROVAL'}
            headerAction={
              approvalSuccess && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--semantic-emerald)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Tool Registered in WebMCP!</span>
                </div>
              )
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Tool Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={approvalSuccess}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  disabled={approvalSuccess}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                  }}
                />
              </div>
            </div>

            {/* Generated JSON Schema */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Strict JSON Schema (additionalProperties: false)
              </div>
              <pre
                className="mono"
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  fontSize: '0.74rem',
                  color: '#cbd5e1',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(synthesisResult.candidateTool.inputSchema, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {!approvalSuccess ? (
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={approveCandidate}
                  disabled={approving || !editName.trim()}
                  style={{ gap: '8px' }}
                >
                  <ShieldCheck size={14} />
                  <span>
                    {approving ? 'Activating in WebMCP...' : 'Approve & Activate in WebMCP'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSynthesisResult(null)}
                  style={{ gap: '6px' }}
                >
                  <Check size={14} />
                  <span>Synthesize Another Tool</span>
                </button>
              )}
            </div>
          </Surface>
        </div>
      )}
    </div>
  );
};
