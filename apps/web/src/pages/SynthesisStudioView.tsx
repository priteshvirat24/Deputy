import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { Demonstration, SynthesisCandidateResult } from '@deputy/domain';

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
    <div className="main-content">
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Tool Synthesis Studio</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Transform human demonstration evidence into typed, authorized WebMCP tools.
          </div>
        </div>
      </div>

      {/* Step 1: Demonstration Selection */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              1. Select Demonstrations for Alignment
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Minimum 2 demonstrations required. DEPUTY compares traces to detect variable
              parameters vs stable constants.
            </p>
          </div>
          <button
            className="btn btn-primary"
            disabled={selectedDemoIds.length < 2 || loading}
            onClick={runSynthesis}
            style={{ gap: '8px' }}
          >
            <Sparkles size={16} />
            {loading
              ? 'Synthesizing...'
              : `Synthesize Tool from ${selectedDemoIds.length} Demonstrations`}
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
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
                      color: isSelected ? '#38bdf8' : '#e2e8f0',
                    }}
                  >
                    {demo.demonstrationId}
                  </span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '8px' }}>
                  {demo.taskDescription || 'Demonstration task'}
                </div>
                <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
                  <span className="badge badge-active">{demo.actions.length} action(s)</span>
                  <span className="badge badge-secondary">
                    {new Date(demo.startedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          className="card"
          style={{
            borderColor: '#ef4444',
            background: 'rgba(239, 68, 68, 0.05)',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <AlertTriangle size={16} />
            <span style={{ fontWeight: 600 }}>Synthesis Failed: {error}</span>
          </div>
        </div>
      )}

      {/* Step 2: Synthesis Results & Diff */}
      {synthesisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Report Stats */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  2. Synthesis Report & Alignment
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Deterministic trace alignment and empirical variance analysis.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span
                  className={`badge badge-risk-${synthesisResult.candidateTool.riskLevel.toLowerCase()}`}
                >
                  Risk: {synthesisResult.candidateTool.riskLevel}
                </span>
                <span
                  className={`badge badge-${synthesisResult.candidateTool.reversibility.toLowerCase()}`}
                >
                  {synthesisResult.candidateTool.reversibility}
                </span>
                <span
                  className="badge"
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontWeight: 700,
                  }}
                >
                  Confidence: {synthesisResult.report.confidence} (
                  {Math.round(synthesisResult.report.confidenceScore * 100)}%)
                </span>
              </div>
            </div>

            {/* Reasoning Bullet Points */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  color: '#64748b',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Synthesis Reasoning
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                {synthesisResult.report.reasoning.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Inferred Parameters Table */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#f8fafc' }}>
                Inferred Dynamic Tool Parameters ({synthesisResult.report.inferredParameters.length}
                )
              </h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parameter Name</th>
                    <th>Type</th>
                    <th>Source Action & Argument</th>
                    <th>Observed Values</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {synthesisResult.report.inferredParameters.map(param => (
                    <tr key={param.parameterName}>
                      <td>
                        <span className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                          {param.parameterName}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{param.inferredType}</span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
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
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                          {Math.round(param.confidence * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stable Constants & Ignored Volatiles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    color: '#38bdf8',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  Stable Constant Arguments (Not Parameterized)
                </div>
                {Object.entries(synthesisResult.report.stableConstants).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {Object.entries(synthesisResult.report.stableConstants).map(([k, v]) => (
                      <div key={k} className="mono" style={{ fontSize: '0.78rem' }}>
                        <span style={{ color: '#94a3b8' }}>{k} = </span>
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    No constants detected
                  </span>
                )}
              </div>

              <div
                style={{
                  background: 'rgba(100, 116, 139, 0.05)',
                  border: '1px solid rgba(100, 116, 139, 0.15)',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  Ignored Volatile Tokens (Filtered Out)
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {synthesisResult.report.ignoredVolatileFields.map(f => (
                    <span
                      key={f}
                      className="badge badge-secondary mono"
                      style={{ fontSize: '0.72rem' }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Human Review and Approval */}
          <div
            className="card"
            style={{ borderColor: approvalSuccess ? '#10b981' : 'var(--card-border)' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  3. Human Authority Review & Approval
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Review metadata and activate capability in WebMCP. Security binding to
                  ActionRegistry cannot be bypassed.
                </div>
              </div>

              {approvalSuccess && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#10b981',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={18} />
                  Tool Approved & Registered with WebMCP!
                </div>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '16px',
              }}
            >
              <div className="form-group">
                <label className="form-label">Tool Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={approvalSuccess}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  disabled={approvalSuccess}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  color: '#64748b',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Generated JSON Schema (additionalProperties: false)
              </div>
              <pre
                className="mono"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                }}
              >
                {JSON.stringify(synthesisResult.candidateTool.inputSchema, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {!approvalSuccess ? (
                <button
                  className="btn btn-primary"
                  onClick={approveCandidate}
                  disabled={approving || !editName.trim()}
                  style={{ gap: '8px' }}
                >
                  <ShieldCheck size={16} />
                  {approving ? 'Activating in WebMCP...' : 'Approve & Activate in WebMCP'}
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => window.location.reload()}
                  style={{ gap: '8px' }}
                >
                  <Check size={16} /> Synthesize Another Tool
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
