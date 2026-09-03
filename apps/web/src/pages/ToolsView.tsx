import React, { useState } from 'react';
import { LearnedTool } from '@deputy/domain';
import { Play, Eye, Wrench, RefreshCw } from 'lucide-react';
import { PasskeyAuthModal } from '../components/PasskeyAuthModal.js';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Surface } from '../components/ui/Surface.js';

interface ToolsViewProps {
  tools: LearnedTool[];
  onRefresh: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ tools, onRefresh }) => {
  const [selectedTool, setSelectedTool] = useState<LearnedTool | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [runningTest, setRunningTest] = useState(false);
  const [pendingAuthRequirement, setPendingAuthRequirement] = useState<{
    tool: LearnedTool;
    args: Record<string, unknown>;
    requestId: string;
  } | null>(null);

  const testProposal = async (tool: LearnedTool, authorizationId?: string) => {
    setRunningTest(true);
    try {
      const defaultArgs: Record<string, unknown> = {};
      if (tool.name.includes('invoice') || tool.name.includes('customer')) {
        defaultArgs['customerName'] = 'Charlie Brown';
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
    } finally {
      setRunningTest(false);
    }
  };

  const handlePasskeyAuthorized = async (authId: string) => {
    if (!pendingAuthRequirement) return;
    await testProposal(pendingAuthRequirement.tool, authId);
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
                color: 'var(--semantic-webmcp)',
                fontWeight: 700,
              }}
            >
              WEBMCP CAPABILITIES
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              DYNAMIC RUNTIME
            </span>
          </div>
          <h1 className="page-title">Learned WebMCP Tools</h1>
          <p className="page-description">
            Synthesized capabilities registered in browser Model Context
            (`window.navigator.modelContext`). Executable exclusively through deterministic backend
            action bindings.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRefresh}
          style={{ gap: '6px' }}
        >
          <RefreshCw size={13} />
          <span>Refresh Capabilities</span>
        </button>
      </div>

      {/* Capabilities Surface */}
      <Surface
        level={2}
        headerTitle="Active Capabilities Directory"
        headerMeta={`${tools.length} REGISTERED`}
        noPadding
        style={{ marginBottom: '24px' }}
      >
        {tools.length === 0 ? (
          <div style={{ padding: '24px' }}>
            <EmptyState
              icon={<Wrench size={20} />}
              title="No Synthesized Tools"
              description="No tools are currently registered. Record demonstrations and approve synthesis candidates in Synthesis Studio."
            />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tool Name & ID</th>
                <th>Version</th>
                <th>Status</th>
                <th>Reversibility</th>
                <th>Risk Tier</th>
                <th>Execution Target</th>
                <th>Test Invocation</th>
              </tr>
            </thead>
            <tbody>
              {tools.map(tool => {
                const isSelected = selectedTool?.toolId === tool.toolId;
                return (
                  <tr
                    key={tool.toolId}
                    style={isSelected ? { background: 'var(--surface-3)' } : {}}
                  >
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          fontSize: '0.86rem',
                        }}
                      >
                        {tool.name}
                      </div>
                      <div
                        className="mono"
                        style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
                      >
                        {tool.toolId}
                      </div>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '0.78rem' }}>
                        v{tool.version}
                      </span>
                    </td>
                    <td>
                      <Badge variant={tool.status.toLowerCase() as any}>{tool.status}</Badge>
                    </td>
                    <td>
                      <Badge variant={tool.reversibility.toLowerCase() as any}>
                        {tool.reversibility}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={`risk-${tool.riskLevel.toLowerCase()}` as any}>
                        {tool.riskLevel}
                      </Badge>
                    </td>
                    <td>
                      <span
                        className="mono"
                        style={{ fontSize: '0.76rem', color: 'var(--semantic-webmcp)' }}
                      >
                        {tool.executionBinding.type === 'COMPOSITE_ACTION'
                          ? tool.executionBinding.actions.map(a => a.actionId).join(' → ')
                          : tool.executionBinding.actionId}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                          onClick={() => setSelectedTool(isSelected ? null : tool)}
                        >
                          <Eye size={12} />
                          <span>{isSelected ? 'Close' : 'Inspect'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                          disabled={runningTest}
                          onClick={() => testProposal(tool)}
                        >
                          <Play size={12} />
                          <span>Test</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Surface>

      {/* Selected Tool Details Inspector */}
      {selectedTool && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <Surface level={2} headerTitle="Strict JSON Schema" headerMeta={selectedTool.toolId}>
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
              Input Argument Contract (additionalProperties: false)
            </div>
            <pre
              className="mono"
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '0.75rem',
                color: '#cbd5e1',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {JSON.stringify(selectedTool.inputSchema, null, 2)}
            </pre>
          </Surface>

          <Surface level={2} headerTitle="Execution Binding & Provenance">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  Action Sequence Chain
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}
                >
                  {selectedTool.executionBinding.type === 'COMPOSITE_ACTION' ? (
                    selectedTool.executionBinding.actions.map(a => (
                      <div
                        key={a.stepOrder}
                        style={{
                          background: 'var(--surface-1)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          className="mono"
                          style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}
                        >
                          {a.stepOrder + 1}. {a.actionId} (v{a.actionVersion})
                        </span>
                        <Badge variant="draft">STEP {a.stepOrder + 1}</Badge>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 10px',
                      }}
                    >
                      <span
                        className="mono"
                        style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}
                      >
                        {selectedTool.executionBinding.actionId} (v
                        {selectedTool.executionBinding.actionVersion})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  Provenance Demonstrations
                </div>
                <div
                  className="mono"
                  style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}
                >
                  {selectedTool.sourceDemonstrations.join(', ')}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  Authorized Origins
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--semantic-emerald)',
                    marginTop: '4px',
                  }}
                >
                  {window.location.origin} (WHATWG Exact Match)
                </div>
              </div>
            </div>
          </Surface>
        </div>
      )}

      {/* Test Execution Output Console */}
      {testResult && (
        <Surface
          level={2}
          headerTitle="WebMCP Invocation Response"
          headerMeta="POLICY & EXECUTION RESULT"
        >
          <pre
            className="mono"
            style={{
              background: 'var(--surface-0)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              fontSize: '0.76rem',
              color: '#cbd5e1',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {testResult}
          </pre>
        </Surface>
      )}

      {/* Passkey Ceremony Modal */}
      {pendingAuthRequirement && (
        <PasskeyAuthModal
          toolId={pendingAuthRequirement.tool.toolId}
          toolName={pendingAuthRequirement.tool.name}
          toolVersion={pendingAuthRequirement.tool.version}
          riskLevel={pendingAuthRequirement.tool.riskLevel}
          reversibility={pendingAuthRequirement.tool.reversibility}
          arguments={pendingAuthRequirement.args}
          requestId={pendingAuthRequirement.requestId}
          onAuthorized={handlePasskeyAuthorized}
          onCancel={() => setPendingAuthRequirement(null)}
        />
      )}
    </div>
  );
};
