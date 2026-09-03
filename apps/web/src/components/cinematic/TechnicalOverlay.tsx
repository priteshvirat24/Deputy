import React from 'react';
import { SceneDefinition } from './CinematicTimeline.js';
import { Shield, Key, Lock, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TechnicalOverlayProps {
  scene: SceneDefinition;
  sceneProgress: number;
}

export const TechnicalOverlay: React.FC<TechnicalOverlayProps> = ({ scene, sceneProgress }) => {
  const isVisible = sceneProgress > 0.15 && sceneProgress < 0.95;

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
      {/* SCENE 02: LEARN - Semantic Actions Captured */}
      {scene.id === 'LEARN' && (
        <div className="cinematic-panel">
          <div className="cinematic-panel-header">
            <Cpu size={14} style={{ color: '#06b6d4' }} />
            <span>SEMANTIC_ACTION_TRACE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="cinematic-trace-item active">
              <span className="mono" style={{ color: '#38bdf8' }}>
                01
              </span>
              <span>customer.create</span>
              <span className="cinematic-badge">CAPTURED</span>
            </div>
            <div className="cinematic-trace-item active">
              <span className="mono" style={{ color: '#38bdf8' }}>
                02
              </span>
              <span>invoice.create</span>
              <span className="cinematic-badge">CAPTURED</span>
            </div>
            <div className="cinematic-trace-item">
              <span className="mono" style={{ color: '#64748b' }}>
                03
              </span>
              <span>followup.schedule</span>
              <span className="cinematic-badge" style={{ color: '#94a3b8' }}>
                PENDING
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 03: SYNTHESIZE - Inferred Parameters & Schema */}
      {scene.id === 'SYNTHESIZE' && (
        <div className="cinematic-panel">
          <div className="cinematic-panel-header">
            <Shield size={14} style={{ color: '#c084fc' }} />
            <span>COMPOSITE_CAPABILITY_SCHEMA</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: 8 }}>
            Target:{' '}
            <span className="mono" style={{ color: '#ffffff', fontWeight: 600 }}>
              create_customer_with_invoice
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="cinematic-param-row">
              <span className="mono">customerName</span>
              <span className="cinematic-type">string (inferred)</span>
            </div>
            <div className="cinematic-param-row">
              <span className="mono">customerEmail</span>
              <span className="cinematic-type">string [email]</span>
            </div>
            <div className="cinematic-param-row">
              <span className="mono">invoiceAmount</span>
              <span className="cinematic-type">number (INR)</span>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 04: AUTHORIZE - Passkey UV Card */}
      {scene.id === 'AUTHORIZE' && (
        <div className="cinematic-panel" style={{ borderColor: 'rgba(129, 140, 248, 0.4)' }}>
          <div className="cinematic-panel-header" style={{ color: '#818cf8' }}>
            <Key size={14} />
            <span>WEBAUTHN_UV_CHALLENGE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Risk Level:</span>
              <span style={{ color: '#fdba74', fontWeight: 700 }}>HIGH (MONETARY)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>User Verification:</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>HARDWARE ENFORCED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Canonical Digest:</span>
              <span className="mono" style={{ color: '#818cf8', fontSize: '0.7rem' }}>
                7f2a9c...08b4
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 05: EXECUTE - WebMCP Routing */}
      {scene.id === 'EXECUTE' && (
        <div className="cinematic-panel" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <div className="cinematic-panel-header" style={{ color: '#10b981' }}>
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
              <span>Authorization Consumption</span>
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

      {/* SCENE 06: REJECT - Tamper Rejection */}
      {scene.id === 'REJECT' && (
        <div
          className="cinematic-panel"
          style={{ borderColor: 'rgba(244, 63, 94, 0.5)', background: 'rgba(244, 63, 94, 0.08)' }}
        >
          <div className="cinematic-panel-header" style={{ color: '#f43f5e' }}>
            <AlertTriangle size={14} />
            <span>ARGUMENT_DIGEST_MISMATCH</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Authorized:</span>
              <span className="mono" style={{ color: '#34d399' }}>
                amount: 2500 (Digest A)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#94a3b8' }}>Attempted:</span>
              <span className="mono" style={{ color: '#f87171', fontWeight: 700 }}>
                amount: 5000 (Digest B)
              </span>
            </div>
            <div
              style={{
                padding: '6px 8px',
                background: 'rgba(244, 63, 94, 0.15)',
                borderRadius: 4,
                color: '#fecdd3',
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

      {/* SCENE 07: AUDIT - Hash Chain Evidence */}
      {scene.id === 'AUDIT' && (
        <div className="cinematic-panel">
          <div className="cinematic-panel-header">
            <Lock size={14} style={{ color: '#38bdf8' }} />
            <span>GENESIS_CHAIN_INTEGRITY</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Chain Standard:</span>
              <span className="mono" style={{ color: '#ffffff' }}>
                SHA-256 Merkle Link
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Append Only:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>STRICT ENFORCED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Genesis Block:</span>
              <span className="mono" style={{ color: '#38bdf8' }}>
                0x0000000000000000
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
