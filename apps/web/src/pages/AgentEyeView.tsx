import React, { useEffect, useMemo, useState } from 'react';
import { LearnedTool } from '@deputy/domain';
import { WebMCPCapabilities, WebMCPToolDefinition } from '@deputy/webmcp';
import {
  detectWebMCPSupport,
  getAgentEyeSnapshot,
  resolveModelContext,
  subscribeAgentEye,
  syncClientTools,
} from '../lib/agentEye.js';
import { Badge } from '../components/ui/Badge.js';
import { Surface } from '../components/ui/Surface.js';

interface AgentEyeViewProps {
  tools: LearnedTool[];
}

export const AgentEyeView: React.FC<AgentEyeViewProps> = ({ tools }) => {
  const [caps, setCaps] = useState<WebMCPCapabilities | null>(null);
  const [definitions, setDefinitions] = useState<WebMCPToolDefinition[]>([]);
  const [, forceRender] = useState(0);

  useEffect(() => subscribeAgentEye(() => forceRender(n => n + 1)), []);

  useEffect(() => {
    setCaps(detectWebMCPSupport());
    setDefinitions(syncClientTools(tools));
  }, [tools]);

  const resolved = useMemo(() => resolveModelContext(), [caps]);
  const snapshot = getAgentEyeSnapshot();

  const isDenied = Boolean(
    snapshot.lastResponse &&
    typeof snapshot.lastResponse === 'object' &&
    'decision' in snapshot.lastResponse &&
    snapshot.lastResponse.decision === 'DENY',
  );

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
            AI AGENT RUNTIME
          </span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            WEBMCP DISCOVERY & OBSERVATION
          </span>
        </div>
        <h1 className="page-title">Agent&rsquo;s-Eye View</h1>
        <p className="page-description">
          Exactly what an AI agent discovers through WebMCP: the resolved host object
          (`modelContext`), the live tool registry with schemas and annotations, and the latest
          proposal and structured refusal.
        </p>
      </div>

      {/* Resolved WebMCP Host Status */}
      <Surface
        level={2}
        headerTitle="Resolved WebMCP Host Context"
        headerMeta={resolved.location}
        style={{ marginBottom: 20 }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              background: 'var(--surface-1)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Location:{' '}
            </span>
            <span
              className="mono"
              style={{ fontSize: '0.78rem', color: 'var(--semantic-webmcp)', fontWeight: 600 }}
            >
              {resolved.location}
            </span>
          </div>

          <div
            style={{
              background: 'var(--surface-1)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Provider:{' '}
            </span>
            <span
              className="mono"
              style={{ fontSize: '0.78rem', color: 'var(--semantic-emerald)', fontWeight: 600 }}
            >
              {caps?.provider ?? 'EMULATED'}
            </span>
          </div>

          <div
            style={{
              background: 'var(--surface-1)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Signal Retirement:{' '}
            </span>
            <span
              className="mono"
              style={{
                fontSize: '0.78rem',
                color: caps?.supportsSignalRetirement
                  ? 'var(--semantic-emerald)'
                  : 'var(--text-muted)',
              }}
            >
              {caps?.supportsSignalRetirement ? 'SUPPORTED' : 'FALLBACK'}
            </span>
          </div>
        </div>

        {!caps?.available && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            This browser does not expose native WebMCP, so tools are held in the backward-compatible
            fallback adapter.
          </div>
        )}
      </Surface>

      {/* 2-Column: Live Tool Registry (Left) & Last Proposal / Refusal Stream (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Registered Tools */}
        <Surface
          level={2}
          headerTitle="Discovered Tool Descriptors"
          headerMeta={`${definitions.length} TOOLS`}
        >
          {definitions.length === 0 ? (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
              }}
            >
              No tools registered in WebMCP runtime.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {definitions.map(def => (
                <div
                  key={def.name}
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
                      marginBottom: 6,
                    }}
                  >
                    <span
                      className="mono"
                      style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    >
                      {def.name}
                    </span>
                    <Badge variant="webmcp">v{def.annotations?.version || 1}</Badge>
                  </div>

                  <div
                    style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}
                  >
                    {def.description}
                  </div>

                  <pre
                    className="mono"
                    style={{
                      background: 'var(--surface-0)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      padding: 10,
                      fontSize: '0.72rem',
                      color: '#cbd5e1',
                      maxHeight: 140,
                      overflowY: 'auto',
                    }}
                  >
                    {JSON.stringify(def.inputSchema, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Surface>

        {/* Right: Last Agent Proposal & Structured Refusal Response */}
        <Surface
          level={2}
          headerTitle="Latest Proposal & Structured Gateway Response"
          headerMeta="LIVE TELEMETRY"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Last Proposal Dispatched to Gateway
              </div>
              <pre
                className="mono"
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: 12,
                  fontSize: '0.74rem',
                  color: 'var(--semantic-audit)',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {snapshot.lastProposal
                  ? JSON.stringify(snapshot.lastProposal, null, 2)
                  : 'No proposals dispatched in current session.'}
              </pre>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Structured Response / Policy Decision
              </div>
              <pre
                className="mono"
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: 12,
                  fontSize: '0.74rem',
                  color: isDenied ? 'var(--semantic-danger)' : '#cbd5e1',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {snapshot.lastResponse
                  ? JSON.stringify(snapshot.lastResponse, null, 2)
                  : 'Awaiting gateway response.'}
              </pre>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
};
