import React, { useState } from 'react';
import { LearnedTool } from '@deputy/domain';
import { Play, Eye, ShieldCheck, Key } from 'lucide-react';
import { PasskeyAuthModal } from '../components/PasskeyAuthModal.js';

interface ToolsViewProps {
  tools: LearnedTool[];
  onRefresh: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ tools, onRefresh }) => {
  const [selectedTool, setSelectedTool] = useState<LearnedTool | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [pendingAuthRequirement, setPendingAuthRequirement] = useState<{
    tool: LearnedTool;
    args: Record<string, unknown>;
    requestId: string;
  } | null>(null);

  const testProposal = async (tool: LearnedTool, authorizationId?: string) => {
    try {
      const defaultArgs: Record<string, unknown> = {};
      if (tool.name.includes('invoice') || tool.name.includes('customer')) {
        defaultArgs['customerName'] = 'Charlie';
        defaultArgs['customerEmail'] = 'charlie@example.com';
        defaultArgs['invoiceAmount'] = 4200;
      } else if (tool.toolId === 'tool_refund_customer') {
        defaultArgs['customerId'] = 'cust_demo_888';
        defaultArgs['amount'] = 3500;
        defaultArgs['reason'] = 'Damaged packaging';
      } else {
        defaultArgs['customerId'] = 'cust_demo_888';
        defaultArgs['email'] = 'customer@example.com';
      }

      const requestId = `req_ui_${Date.now()}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authorizationId) {
        headers['x-deputy-authorization-id'] = authorizationId;
      }

      const res = await fetch('http://localhost:4000/api/tool-proposals', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          proposalId: `prop_ui_${Date.now()}`,
          toolId: tool.toolId,
          toolVersion: tool.version,
          arguments: defaultArgs,
          requestId,
          proposedBy: { agentId: 'lead_autonomous_agent', origin: window.location.origin },
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));

      // If policy demands human authorization, prompt passkey ceremony
      if (data.decision === 'REQUIRE_HUMAN_AUTHORIZATION' && !authorizationId) {
        setPendingAuthRequirement({
          tool,
          args: defaultArgs,
          requestId,
        });
      } else {
        setPendingAuthRequirement(null);
      }

      onRefresh();
    } catch (err: unknown) {
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="main-content">
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Learned WebMCP Tools</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Dynamically synthesized capabilities exposed to the WebMCP browser host. Bound strictly
            to trusted application actions.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Capabilities Surface</h3>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Tools currently registered in the browser Model Context API
              (`navigator.modelContext`).
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onRefresh}>
            Refresh
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Tool Name & ID</th>
              <th>Version</th>
              <th>Status</th>
              <th>Reversibility</th>
              <th>Risk Level</th>
              <th>Execution Binding (Zero Code)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tools.map(tool => (
              <tr key={tool.toolId}>
                <td>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{tool.name}</div>
                  <div className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {tool.toolId}
                  </div>
                </td>
                <td className="mono">v{tool.version}</td>
                <td>
                  <span className={`badge badge-${tool.status.toLowerCase()}`}>{tool.status}</span>
                </td>
                <td>
                  <span className={`badge badge-${tool.reversibility.toLowerCase()}`}>
                    {tool.reversibility}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-risk-${tool.riskLevel.toLowerCase()}`}>
                    {tool.riskLevel}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    >
                      {tool.executionBinding.type === 'APPLICATION_ACTION'
                        ? 'TRUSTED APPLICATION ACTION'
                        : 'TRUSTED COMPOSITE ACTION'}
                    </span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {tool.executionBinding.type === 'APPLICATION_ACTION'
                        ? `${tool.executionBinding.actionId} (v${tool.executionBinding.actionVersion})`
                        : `${tool.executionBinding.actions.length} steps: ${tool.executionBinding.actions.map(a => a.actionId).join(' → ')}`}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', gap: '4px' }}
                      onClick={() => setSelectedTool(tool)}
                    >
                      <Eye size={12} /> Inspect
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', gap: '4px' }}
                      onClick={() => testProposal(tool)}
                    >
                      <Play size={12} /> Propose
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {testResult && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                Proposal Policy Evaluation Result
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {pendingAuthRequirement && (
                <button
                  className="btn btn-primary"
                  onClick={() => {}}
                  style={{ gap: '6px', fontSize: '0.78rem' }}
                >
                  <Key size={14} /> Open Passkey Ceremony
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setTestResult(null)}>
                Dismiss
              </button>
            </div>
          </div>
          <pre
            className="mono"
            style={{
              background: '#090d16',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {testResult}
          </pre>
        </div>
      )}

      {selectedTool && (
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
                Tool Inspector: {selectedTool.name}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Strict JSON Schema and ActionRegistry binding provenance.
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => setSelectedTool(null)}>
              Close
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
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
                  background: '#090d16',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(selectedTool.inputSchema, null, 2)}
              </pre>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  color: '#64748b',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Execution Binding (Trusted Handlers)
              </div>
              <pre
                className="mono"
                style={{
                  background: '#090d16',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(selectedTool.executionBinding, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Passkey Authorization Ceremony Modal */}
      {pendingAuthRequirement && (
        <PasskeyAuthModal
          toolId={pendingAuthRequirement.tool.toolId}
          toolName={pendingAuthRequirement.tool.name}
          toolVersion={pendingAuthRequirement.tool.version}
          riskLevel={pendingAuthRequirement.tool.riskLevel}
          reversibility={pendingAuthRequirement.tool.reversibility}
          arguments={pendingAuthRequirement.args}
          requestId={pendingAuthRequirement.requestId}
          onAuthorized={async authId => {
            // Re-execute with valid single-use authorization
            await testProposal(pendingAuthRequirement.tool, authId);
            setPendingAuthRequirement(null);
          }}
          onCancel={() => setPendingAuthRequirement(null)}
        />
      )}
    </div>
  );
};
