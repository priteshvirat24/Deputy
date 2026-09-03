import React, { useEffect, useMemo, useState } from 'react';
import { LearnedTool } from '@deputy/domain';
import { WebMCPCapabilities, WebMCPToolDefinition } from '@deputy/webmcp';
import { AlertTriangle, Bot, Cpu, ShieldAlert } from 'lucide-react';
import {
  detectWebMCPSupport,
  getAgentEyeSnapshot,
  resolveModelContext,
  subscribeAgentEye,
  syncClientTools,
} from '../lib/agentEye.js';

interface AgentEyeViewProps {
  tools: LearnedTool[];
}

const codeBlock: React.CSSProperties = {
  background: '#0b1120',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '0.75rem',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: '#cbd5e1',
  overflowX: 'auto',
  whiteSpace: 'pre',
  margin: 0,
};

/**
 * The Agent's-Eye View: exactly what an agent sees through WebMCP. Tools are
 * registered into the resolved host by the client adapter, so this list comes
 * from real registrations (proving A1/A2), and the last proposal / structured
 * refusal are shown as typed JSON, not prose.
 */
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

  return (
    <div className="main-content">
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', gap: 10 }}>
            <Bot size={24} /> Agent&rsquo;s-Eye View
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Exactly what an agent discovers through WebMCP: the resolved host, the live tool
            registry with schemas and annotations, and the last proposal and structured refusal as
            typed JSON.
          </div>
        </div>
      </div>

      {/* Resolved host */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3
          style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', gap: 8, marginBottom: 12 }}
        >
          <Cpu size={18} /> Resolved WebMCP Host
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <HostBadge
            label="Location"
            value={resolved.location}
            tone={
              resolved.location === 'document.modelContext'
                ? 'ok'
                : resolved.host
                  ? 'warn'
                  : 'muted'
            }
          />
          <HostBadge
            label="Provider"
            value={caps?.provider ?? '—'}
            tone={caps?.available ? 'ok' : 'muted'}
          />
          <HostBadge
            label="Signal retirement"
            value={caps?.supportsSignalRetirement ? 'supported' : 'n/a'}
            tone={caps?.supportsSignalRetirement ? 'ok' : 'muted'}
          />
          {resolved.deprecatedAlias && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#fcd34d',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: 6,
              }}
            >
              <AlertTriangle size={13} /> deprecated navigator alias
            </span>
          )}
        </div>
        {!caps?.available && (
          <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {resolved.reason}
            <div style={{ marginTop: 4 }}>
              This browser exposes no WebMCP host, so tools are held in the fallback adapter. Open
              in a Chrome with <code>chrome://flags/#enable-webmcp-testing</code> to see them land
              in <code>document.modelContext</code>.
            </div>
          </div>
        )}
      </div>

      {/* Tool registry */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>
          Registered Tools ({definitions.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {definitions.map(def => (
            <div
              key={def.name}
              style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontWeight: 700, color: '#fff' }}>
                  {def.name}
                </span>
                <span className="badge" style={{ fontSize: '0.68rem' }}>
                  v{def.annotations?.version}
                </span>
                {def.annotations?.destructiveHint && (
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      color: '#f87171',
                      fontSize: '0.68rem',
                    }}
                  >
                    destructiveHint: true
                  </span>
                )}
                <span
                  className="badge"
                  style={{
                    background: 'rgba(148,163,184,0.12)',
                    color: '#94a3b8',
                    fontSize: '0.68rem',
                  }}
                >
                  readOnlyHint: false
                </span>
                <span
                  className="badge"
                  style={{
                    background: 'rgba(148,163,184,0.12)',
                    color: '#94a3b8',
                    fontSize: '0.68rem',
                  }}
                >
                  idempotentHint: (declined)
                </span>
                {def.annotations?.requiresHumanAuthorization && (
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(56,189,248,0.12)',
                      color: '#38bdf8',
                      fontSize: '0.68rem',
                    }}
                  >
                    <ShieldAlert size={11} /> requires passkey
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '6px 0' }}>
                {def.description}
              </div>
              <details>
                <summary style={{ cursor: 'pointer', fontSize: '0.76rem', color: '#38bdf8' }}>
                  inputSchema + annotations (what the agent reads)
                </summary>
                <pre style={{ ...codeBlock, marginTop: 8 }}>
                  {JSON.stringify(
                    { inputSchema: def.inputSchema, annotations: def.annotations },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </div>
          ))}
          {definitions.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No active tools registered yet. Synthesize a tool to see it appear here instantly.
            </div>
          )}
        </div>
      </div>

      {/* Last proposal / refusal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 10 }}>Last Proposal</h3>
          <pre style={codeBlock}>
            {snapshot.lastProposal
              ? JSON.stringify(snapshot.lastProposal, null, 2)
              : '// No proposal yet. Propose a tool from Learned Tools or call one here.'}
          </pre>
        </div>
        <div className="card">
          <h3
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              marginBottom: 10,
              display: 'flex',
              gap: 8,
              color: '#f87171',
            }}
          >
            <ShieldAlert size={16} /> Last Structured Refusal
          </h3>
          <pre style={codeBlock}>
            {snapshot.lastRefusal
              ? JSON.stringify(snapshot.lastRefusal, null, 2)
              : '// No refusal yet. Propose an irreversible tool (e.g. refund_customer).'}
          </pre>
        </div>
      </div>
    </div>
  );
};

const HostBadge: React.FC<{ label: string; value: string; tone: 'ok' | 'warn' | 'muted' }> = ({
  label,
  value,
  tone,
}) => {
  const color = tone === 'ok' ? '#34d399' : tone === 'warn' ? '#fcd34d' : '#94a3b8';
  return (
    <span
      style={{
        display: 'inline-flex',
        gap: 6,
        alignItems: 'baseline',
        background: 'rgba(148,163,184,0.08)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: '0.75rem',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span className="mono" style={{ color, fontWeight: 600 }}>
        {value}
      </span>
    </span>
  );
};
