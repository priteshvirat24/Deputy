import React, { useEffect, useState } from 'react';
import { detectWebMCPSupport } from '@deputy/webmcp';
import { LearnedTool } from '@deputy/domain';
import { Cpu, ShieldCheck, ArrowRight, Layers } from 'lucide-react';
import { Badge } from '../components/ui/Badge.js';
import { Surface } from '../components/ui/Surface.js';
import { JsonSchemaViewer } from '../components/ui/JsonSchemaViewer.js';

interface WebMcpViewProps {
  tools: LearnedTool[];
}

export const WebMcpView: React.FC<WebMcpViewProps> = ({ tools }) => {
  const [supportInfo, setSupportInfo] = useState<{ available: boolean; mode: string }>({
    available: false,
    mode: 'EMULATED',
  });
  const [selectedTool, setSelectedTool] = useState<LearnedTool | null>(
    tools.length > 0 ? (tools[0] ?? null) : null,
  );

  useEffect(() => {
    const caps = detectWebMCPSupport();
    setSupportInfo({
      available: caps.available,
      mode: caps.available ? 'NATIVE' : 'EMULATED',
    });
  }, []);

  const activeTools = tools.filter(t => t.status === 'ACTIVE');

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
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
            RUNTIME GATEWAY
          </span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            MODEL CONTEXT PROTOCOL
          </span>
        </div>
        <h1 className="page-title">WebMCP Capability Surface</h1>
        <p className="page-description">
          Active tools exposed to AI browser agents via `window.navigator.modelContext`. All
          invocations route through DEPUTY's deterministic policy gateway.
        </p>
      </div>

      {/* Runtime Architecture Diagnostic Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">WebMCP Provider</span>
            <Cpu size={16} style={{ color: 'var(--semantic-webmcp)' }} />
          </div>
          <div
            className="stat-value"
            style={{ color: 'var(--semantic-webmcp)', fontSize: '1.4rem' }}
          >
            {supportInfo.mode}
          </div>
          <div className="stat-hint">
            {supportInfo.available
              ? 'Native window.navigator.modelContext active'
              : 'Adapter operating in backward-compatible fallback'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Registered Tools</span>
            <Layers size={16} style={{ color: 'var(--semantic-emerald)' }} />
          </div>
          <div
            className="stat-value"
            style={{ color: 'var(--semantic-emerald)', fontSize: '1.4rem' }}
          >
            {activeTools.length} ACTIVE
          </div>
          <div className="stat-hint">Exposed to AI client agents</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Security Gateway Mode</span>
            <ShieldCheck size={16} style={{ color: 'var(--semantic-auth)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--semantic-auth)', fontSize: '1.4rem' }}>
            FAIL-CLOSED
          </div>
          <div className="stat-hint">Invariant 3: Registration != Authorization</div>
        </div>
      </div>

      {/* Gateway Routing Pipeline Visualizer */}
      <Surface
        level={2}
        headerTitle="Trusted Execution Flow Architecture"
        headerMeta="END-TO-END GATEWAY PIPELINE"
        style={{ marginBottom: 24 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-1)',
            padding: 16,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            gap: 12,
          }}
        >
          <div style={{ textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--semantic-webmcp)' }}>
              1. AI Agent
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              modelContext.callTool()
            </div>
          </div>

          <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

          <div style={{ textAlign: 'center', minWidth: 140 }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
              2. DEPUTY Gateway
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              POST /api/tool-proposals
            </div>
          </div>

          <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

          <div style={{ textAlign: 'center', minWidth: 140 }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--semantic-amber)' }}>
              3. Policy & Gate
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Digest Check & FIDO2 UV
            </div>
          </div>

          <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

          <div style={{ textAlign: 'center', minWidth: 140 }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--semantic-emerald)' }}>
              4. ActionRegistry
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Native Handler Only
            </div>
          </div>

          <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

          <div style={{ textAlign: 'center', minWidth: 130 }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--semantic-audit)' }}>
              5. SHA-256 Audit
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Append-Only Ledger
            </div>
          </div>
        </div>
      </Surface>

      {/* 2-Column: Active Tools List (Left) & Descriptor Inspector (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
        <Surface
          level={2}
          headerTitle="Active WebMCP Tool Descriptors"
          headerMeta={`${activeTools.length} REGISTERED`}
        >
          {activeTools.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
              No active tools registered in WebMCP runtime.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeTools.map(tool => {
                const isSelected = selectedTool?.toolId === tool.toolId;
                return (
                  <div
                    key={tool.toolId}
                    onClick={() => setSelectedTool(tool)}
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'var(--surface-1)',
                      border: `1px solid ${isSelected ? 'var(--semantic-webmcp)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'border-color var(--motion-fast)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontSize: '0.86rem',
                        }}
                      >
                        {tool.name}
                      </span>
                      <Badge variant="webmcp">v{tool.version}</Badge>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {tool.description}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Surface>

        {/* Right: Selected Tool Descriptor & Schema Inspector */}
        {selectedTool && (
          <Surface level={2} headerTitle="WebMCP Tool Descriptor" headerMeta={selectedTool.name}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  fontSize: '0.78rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Name: </span>
                  <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {selectedTool.name}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Execution State: </span>
                  <span style={{ color: 'var(--semantic-emerald)', fontWeight: 600 }}>
                    AVAILABLE
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>AbortSignal: </span>
                  <span className="mono">Supported</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Target Binding: </span>
                  <span className="mono" style={{ color: 'var(--semantic-auth)' }}>
                    {selectedTool.executionBinding.type}
                  </span>
                </div>
              </div>

              <div>
                <JsonSchemaViewer
                  schema={selectedTool.inputSchema}
                  title="Input Schema for AI Model"
                  maxHeight={240}
                />
              </div>
            </div>
          </Surface>
        )}
      </div>
    </div>
  );
};
