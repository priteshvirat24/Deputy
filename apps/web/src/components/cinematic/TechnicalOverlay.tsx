import React from 'react';
import { SceneDefinition } from './CinematicTimeline.js';
import { Shield, Key, Lock, Cpu, AlertTriangle, CheckCircle2, Code2 } from 'lucide-react';

interface TechnicalOverlayProps {
  scene: SceneDefinition;
  sceneProgress: number;
}

export const TechnicalOverlay: React.FC<TechnicalOverlayProps> = ({ scene, sceneProgress }) => {
  const isVisible = sceneProgress > 0.12 && sceneProgress < 0.96;

  return (
    <div
      className="cinematic-technical-overlay"
      style={{
        position: 'absolute',
        top: '14%',
        right: '6%',
        width: '340px',
        maxWidth: '85vw',
        zIndex: 10,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(16px)',
        transition:
          'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none',
      }}
    >
      {/* SCENE: DEMONSTRATE - Semantic Actions Ingested */}
      {scene.id === 'DEMONSTRATE' && (
        <div className="cinematic-panel">
          <div className="cinematic-panel-header">
            <Cpu size={14} style={{ color: '#0891b2' }} />
            <span>SEMANTIC_ACTION_TRACE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="cinematic-trace-item active">
              <span className="mono" style={{ color: '#0891b2', fontWeight: 700 }}>
                01
              </span>
              <span>customer.create</span>
              <span className="cinematic-badge">CAPTURED</span>
            </div>
            <div className="cinematic-trace-item active">
              <span className="mono" style={{ color: '#0891b2', fontWeight: 700 }}>
                02
              </span>
              <span>invoice.create</span>
              <span className="cinematic-badge">CAPTURED</span>
            </div>
            <div className="cinematic-trace-item">
              <span className="mono" style={{ color: '#71717a' }}>
                03
              </span>
              <span>followup.schedule</span>
              <span className="cinematic-badge" style={{ color: '#71717a' }}>
                PENDING
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SCENE: SYNTHESIZE - Inferred Parameters */}
      {scene.id === 'SYNTHESIZE' && (
        <div className="cinematic-panel">
          <div className="cinematic-panel-header">
            <Shield size={14} style={{ color: '#7c3aed' }} />
            <span>VARIATIONAL_PARAMETER_INFERENCE</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#52525b', marginBottom: 8 }}>
            Capability:{' '}
            <span className="mono" style={{ color: '#09090b', fontWeight: 700 }}>
              create_customer_with_invoice
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="cinematic-param-row">
              <span className="mono" style={{ color: '#18181b' }}>
                customerName
              </span>
              <span className="cinematic-type">string (inferred)</span>
            </div>
            <div className="cinematic-param-row">
              <span className="mono" style={{ color: '#18181b' }}>
                customerEmail
              </span>
              <span className="cinematic-type">string [email]</span>
            </div>
            <div className="cinematic-param-row">
              <span className="mono" style={{ color: '#18181b' }}>
                invoiceAmount
              </span>
              <span className="cinematic-type">number (INR)</span>
            </div>
          </div>
        </div>
      )}

      {/* SCENE: SCHEMA - Strict JSON Schema */}
      {scene.id === 'SCHEMA' && (
        <div className="cinematic-panel" style={{ borderColor: '#bae6fd' }}>
          <div className="cinematic-panel-header" style={{ color: '#0284c7' }}>
            <Code2 size={14} />
            <span>DECLARATIVE_JSON_SCHEMA</span>
          </div>
          <pre
            className="mono"
            style={{
              fontSize: '0.72rem',
              color: '#0369a1',
              margin: 0,
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              padding: '8px 10px',
              borderRadius: 6,
              lineHeight: 1.4,
            }}
          >
            {`{
  "type": "object",
  "required": ["customerName", "amount"],
  "additionalProperties": false
}`}
          </pre>
        </div>
      )}

      {/* SCENE: AUTHORIZE - Passkey UV Card */}
      {scene.id === 'AUTHORIZE' && (
        <div className="cinematic-panel" style={{ borderColor: '#ddd6fe' }}>
          <div className="cinematic-panel-header" style={{ color: '#6d28d9' }}>
            <Key size={14} />
            <span>WEBAUTHN_UV_CHALLENGE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#52525b' }}>Risk Level:</span>
              <span style={{ color: '#c2410c', fontWeight: 700 }}>HIGH (MONETARY)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#52525b' }}>User Verification:</span>
              <span style={{ color: '#047857', fontWeight: 700 }}>HARDWARE ENFORCED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#52525b' }}>Canonical Digest:</span>
              <span
                className="mono"
                style={{ color: '#6d28d9', fontSize: '0.7rem', fontWeight: 600 }}
              >
                7f2a9c...08b4
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SCENE: EXECUTE - WebMCP Routing */}
      {scene.id === 'EXECUTE' && (
        <div className="cinematic-panel" style={{ borderColor: '#a7f3d0' }}>
          <div className="cinematic-panel-header" style={{ color: '#059669' }}>
            <CheckCircle2 size={14} />
            <span>WEBMCP_EXECUTION_PIPELINE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="cinematic-pipeline-step">
              <span className="cinematic-step-num">01</span>
              <span>WebMCP Gateway</span>
              <span className="cinematic-status-ok">PASS</span>
            </div>
            <div className="cinematic-pipeline-step">
              <span className="cinematic-step-num">02</span>
              <span>Token Consumption</span>
              <span className="cinematic-status-ok">ATOMIC</span>
            </div>
            <div className="cinematic-pipeline-step">
              <span className="cinematic-step-num">03</span>
              <span>ActionRegistry Execution</span>
              <span className="cinematic-status-ok">VERIFIED</span>
            </div>
          </div>
        </div>
      )}

      {/* SCENE: TAMPER_REJECTION - Tamper Rejection */}
      {scene.id === 'TAMPER_REJECTION' && (
        <div className="cinematic-panel" style={{ borderColor: '#fecaca', background: '#fff5f5' }}>
          <div className="cinematic-panel-header" style={{ color: '#dc2626' }}>
            <AlertTriangle size={14} />
            <span>ARGUMENT_DIGEST_MISMATCH</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#52525b' }}>Authorized:</span>
              <span className="mono" style={{ color: '#059669', fontWeight: 600 }}>
                invoiceAmount: ₹2,500
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#52525b' }}>Attempted:</span>
              <span className="mono" style={{ color: '#dc2626', fontWeight: 700 }}>
                invoiceAmount: ₹5,000
              </span>
            </div>
            <div
              style={{
                padding: '6px 8px',
                background: '#fee2e2',
                borderRadius: 4,
                color: '#991b1b',
                fontSize: '0.72rem',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              EXECUTION_BLOCKED (FAIL-CLOSED)
            </div>
          </div>
        </div>
      )}

      {/* SCENE: ARCHITECTURE - Connected Security Layers */}
      {scene.id === 'ARCHITECTURE' && (
        <div className="cinematic-panel">
          <div className="cinematic-panel-header">
            <Lock size={14} style={{ color: '#0284c7' }} />
            <span>SYNCHRONIZED_SECURITY_LAYERS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#52525b' }}>Runtime:</span>
              <span className="mono" style={{ color: '#0891b2', fontWeight: 600 }}>
                WebMCP Protocol
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#52525b' }}>Authority:</span>
              <span className="mono" style={{ color: '#7c3aed', fontWeight: 600 }}>
                FIDO2 WebAuthn UV
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#52525b' }}>Audit:</span>
              <span className="mono" style={{ color: '#059669', fontWeight: 600 }}>
                SHA-256 Hash Chain
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
