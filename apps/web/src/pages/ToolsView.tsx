import React, { useState, useMemo } from 'react';
import { LearnedTool } from '@deputy/domain';
import { Wrench, Play, Eye, RefreshCw, Plus, Search } from 'lucide-react';
import { Badge } from '../components/ui/Badge.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Surface } from '../components/ui/Surface.js';
import { CapabilityDrawer } from '../components/CapabilityDrawer.js';
import { PasskeyAuthModal } from '../components/PasskeyAuthModal.js';
import { recordProposal, recordResponse } from '../lib/agentEye.js';
import { useToast } from '../context/ToastContext.js';

interface ToolsViewProps {
  tools: LearnedTool[];
  onRefresh: () => void;
  onNavigateToSynthesis?: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({
  tools,
  onRefresh,
  onNavigateToSynthesis,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Selected tool for Drawer inspection
  const [selectedTool, setSelectedTool] = useState<LearnedTool | null>(null);

  // Test proposal invocation states
  const [runningTest, setRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [pendingAuthRequirement, setPendingAuthRequirement] = useState<{
    tool: LearnedTool;
    args: Record<string, unknown>;
    requestId: string;
  } | null>(null);

  // Filtered tools list
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      if (statusFilter !== 'ALL' && tool.status !== statusFilter) return false;
      if (riskFilter !== 'ALL' && tool.riskLevel !== riskFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = tool.name.toLowerCase().includes(q);
        const matchId = tool.toolId.toLowerCase().includes(q);
        const matchDesc = tool.description.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDesc) return false;
      }
      return true;
    });
  }, [tools, statusFilter, riskFilter, searchQuery]);

  // Test Tool Proposal Invocation
  const testProposal = async (tool: LearnedTool, authorizationId?: string) => {
    setRunningTest(true);
    setTestResult(null);
    try {
      const defaultArgs: Record<string, unknown> = {};
      if (tool.name.includes('invoice') || tool.name.includes('customer')) {
        defaultArgs['customerName'] = 'Charlie Brown';
        defaultArgs['customerEmail'] = 'charlie@example.com';
        defaultArgs['invoiceAmount'] = 4200;
        defaultArgs['customerId'] = 'cust_charlie_brown';
        defaultArgs['amount'] = 4200;
        defaultArgs['currency'] = 'INR';
      } else if (tool.toolId === 'tool_refund_customer' || tool.name.includes('refund')) {
        defaultArgs['customerId'] = 'cust_charlie_brown';
        defaultArgs['amount'] = 3500;
        defaultArgs['reason'] = 'Damaged item return';
      } else {
        defaultArgs['customerId'] = 'cust_charlie_brown';
        defaultArgs['email'] = 'charlie@example.com';
        defaultArgs['name'] = 'Charlie Brown';
      }

      const requestId = `req_ui_${Date.now()}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authorizationId) {
        headers['x-deputy-authorization-id'] = authorizationId;
      }

      const proposalPayload = {
        proposalId: `prop_ui_${Date.now()}`,
        toolId: tool.toolId,
        toolVersion: tool.version,
        arguments: defaultArgs,
        requestId,
        proposedBy: { agentId: 'lead_autonomous_agent', origin: window.location.origin },
        timestamp: new Date().toISOString(),
      };

      recordProposal(proposalPayload);

      const res = await fetch('/api/tool-proposals', {
        method: 'POST',
        headers,
        body: JSON.stringify(proposalPayload),
      });

      const data = await res.json();
      recordResponse(data);
      setTestResult(JSON.stringify(data, null, 2));

      if (data.decision === 'REQUIRE_HUMAN_AUTHORIZATION' && !authorizationId) {
        showToast('auth', 'Policy Requirement', `Human authorization required for ${tool.name}.`);
        setPendingAuthRequirement({
          tool,
          args: defaultArgs,
          requestId,
        });
      } else if (data.decision === 'ALLOW') {
        showToast('success', 'Execution Succeeded', `Tool ${tool.name} executed successfully.`);
      } else if (data.decision === 'DENY') {
        showToast('error', 'Execution Denied', data.reason);
      }

      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult(`Error: ${msg}`);
      showToast('error', 'Proposal Failed', msg);
    } finally {
      setRunningTest(false);
    }
  };

  const handlePasskeyAuthorized = async (authId: string) => {
    if (!pendingAuthRequirement) return;
    const current = pendingAuthRequirement;
    setPendingAuthRequirement(null);
    await testProposal(current.tool, authId);
  };

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
                color: 'var(--semantic-webmcp)',
                fontWeight: 700,
              }}
            >
              CAPABILITY REGISTRY
            </span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              WEBMCP RUNTIME
            </span>
          </div>
          <h1 className="page-title">Capabilities & WebMCP Tools</h1>
          <p className="page-description">
            The authoritative inventory of learned capabilities registered into browser Model
            Context (`navigator.modelContext`). Executable exclusively through deterministic
            ActionRegistry bindings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            style={{ gap: 5 }}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          {onNavigateToSynthesis && (
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={onNavigateToSynthesis}
              style={{ gap: 5 }}
            >
              <Plus size={13} />
              <span>Synthesize New Capability</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 32, fontSize: '0.82rem' }}
            placeholder="Search capabilities by name, ID, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status & Risk Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Status filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--surface-2)',
              padding: '2px 4px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                paddingLeft: 6,
              }}
            >
              STATUS:
            </span>
            {['ALL', 'ACTIVE', 'DISABLED', 'RETIRED'].map(st => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.72rem', border: 'none' }}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Risk filter */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.76rem' }}
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>
        </div>
      </div>

      {/* Capabilities Inventory Table */}
      <Surface
        level={2}
        noPadding
        headerTitle="Capability Inventory"
        headerMeta={`${filteredTools.length} REGISTERED`}
      >
        {filteredTools.length === 0 ? (
          <div style={{ padding: 36 }}>
            <EmptyState
              icon={<Wrench size={22} />}
              title="No Capabilities Found"
              description={
                tools.length === 0
                  ? 'No tools are currently registered. Synthesize a capability in the Synthesis Studio.'
                  : 'No capabilities matched the active search and filter criteria.'
              }
            />
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Capability Name & ID</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Risk Tier</th>
                  <th>Reversibility</th>
                  <th>Execution Binding</th>
                  <th>Traces</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.map(tool => {
                  const isSelected = selectedTool?.toolId === tool.toolId;
                  const bindingLabel =
                    tool.executionBinding.type === 'COMPOSITE_ACTION'
                      ? tool.executionBinding.actions.map(a => a.actionId).join(' → ')
                      : tool.executionBinding.actionId;

                  return (
                    <tr
                      key={tool.toolId}
                      className={`clickable ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedTool(tool)}
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
                        <Badge variant={`risk-${tool.riskLevel.toLowerCase()}` as any}>
                          {tool.riskLevel}
                        </Badge>
                      </td>

                      <td>
                        <Badge variant={tool.reversibility.toLowerCase() as any}>
                          {tool.reversibility}
                        </Badge>
                      </td>

                      <td>
                        <span
                          className="mono"
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--semantic-auth)',
                            maxWidth: 240,
                            display: 'inline-block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={bindingLabel}
                        >
                          {bindingLabel}
                        </span>
                      </td>

                      <td>
                        <Badge variant="draft">{tool.demonstrationCount} trace(s)</Badge>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', gap: 4 }}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedTool(tool);
                            }}
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>

                          {tool.status === 'ACTIVE' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', gap: 4 }}
                              disabled={runningTest}
                              onClick={e => {
                                e.stopPropagation();
                                testProposal(tool);
                              }}
                            >
                              <Play size={12} />
                              <span>Test</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      {/* Test Execution Output Console */}
      {testResult && (
        <Surface
          level={2}
          headerTitle="WebMCP Invocation Response"
          headerMeta="GATEWAY EXECUTION RESULT"
          headerAction={
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setTestResult(null)}
            >
              Clear Console
            </button>
          }
          style={{ marginTop: 20 }}
        >
          <pre
            className="mono"
            style={{
              background: 'var(--surface-0)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 14,
              fontSize: '0.76rem',
              color: '#cbd5e1',
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {testResult}
          </pre>
        </Surface>
      )}

      {/* Slide-over Capability Detail Drawer */}
      <CapabilityDrawer
        tool={selectedTool}
        isOpen={!!selectedTool}
        onClose={() => setSelectedTool(null)}
        onRefresh={onRefresh}
        onTestInvocation={testProposal}
      />

      {/* Passkey Authorization Ceremony Modal */}
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
