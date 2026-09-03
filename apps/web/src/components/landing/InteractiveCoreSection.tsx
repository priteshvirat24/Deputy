import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CapabilityCore3D, CoreLayer } from './CapabilityCore3D.js';
import { Wrench, Video, Lock, ArrowRight } from 'lucide-react';

interface InteractiveCoreSectionProps {
  toolCount: number;
  demonstrationCount: number;
  auditCount: number;
  onEnterApp: () => void;
}

export const InteractiveCoreSection: React.FC<InteractiveCoreSectionProps> = ({
  toolCount,
  demonstrationCount,
  auditCount,
  onEnterApp,
}) => {
  const [activeLayer, setActiveLayer] = useState<CoreLayer>('ALL');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <section id="capability-core" className="landing-3d-section">
      <div className="landing-container">
        <div className="landing-3d-split">
          {/* Left Column: 40% Text & Live Metrics */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="landing-section-label">THE 3D CAPABILITY CORE</span>
            <h2
              style={{
                fontSize: 'clamp(2.0rem, 3.4vw, 2.8rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: '#09090b',
                marginBottom: 16,
              }}
            >
              From human demonstration to controlled capability.
            </h2>
            <p
              style={{
                fontSize: '1.05rem',
                color: '#52525b',
                lineHeight: 1.6,
                marginBottom: 28,
              }}
            >
              DEPUTY observes semantic actions, identifies stable constants and variational
              parameters, generates a strict JSON Schema contract (
              <code>additionalProperties: false</code>), and binds execution solely to registered
              native application handlers.
            </p>

            {/* Real Telemetry Counter Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
              <div
                style={{
                  background: '#f4f4f5',
                  border: '1px solid #e4e4e7',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#09090b',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Video size={13} style={{ color: '#0891b2' }} />
                <span>{demonstrationCount} DEMONSTRATIONS</span>
              </div>

              <div
                style={{
                  background: '#f4f4f5',
                  border: '1px solid #e4e4e7',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#09090b',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Wrench size={13} style={{ color: '#7c3aed' }} />
                <span>{toolCount} ACTIVE CAPABILITIES</span>
              </div>

              <div
                style={{
                  background: '#f4f4f5',
                  border: '1px solid #e4e4e7',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#09090b',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Lock size={13} style={{ color: '#059669' }} />
                <span>{auditCount} AUDIT EVENTS</span>
              </div>
            </div>

            <button
              type="button"
              className="landing-btn-app"
              onClick={onEnterApp}
              style={{ padding: '10px 20px', fontWeight: 600 }}
            >
              <span>Explore Capability Registry</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>

          {/* Right Column: 60% Interactive 3D Canvas Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="landing-3d-canvas-box"
          >
            {/* Top Canvas Tag */}
            <div className="landing-3d-canvas-overlay">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#059669',
                  boxShadow: '0 0 6px #059669',
                }}
              />
              <span>THREE.JS WEBGL · MOVE MOUSE TO ROTATE</span>
            </div>

            {/* Three.js Canvas */}
            <CapabilityCore3D
              activeLayer={activeLayer}
              onHoverNode={name => setHoveredNode(name)}
            />

            {/* Floating Hover Node Callout */}
            {hoveredNode && (
              <div
                className="floating-annotation"
                style={{
                  top: '45%',
                  right: '24px',
                  borderColor: 'rgba(124, 58, 237, 0.5)',
                  background: 'rgba(15, 23, 42, 0.95)',
                }}
              >
                <span className="mono" style={{ color: '#c084fc', fontWeight: 700 }}>
                  {hoveredNode}
                </span>
                <span style={{ color: '#94a3b8' }}>· Semantic Action</span>
              </div>
            )}

            {/* Layer Control Buttons */}
            <div className="landing-3d-layer-buttons">
              <button
                type="button"
                className={`landing-3d-layer-btn ${activeLayer === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveLayer('ALL')}
              >
                All Layers
              </button>
              <button
                type="button"
                className={`landing-3d-layer-btn ${activeLayer === 'EVIDENCE' ? 'active' : ''}`}
                onClick={() => setActiveLayer('EVIDENCE')}
              >
                01 Evidence
              </button>
              <button
                type="button"
                className={`landing-3d-layer-btn ${activeLayer === 'SCHEMA' ? 'active' : ''}`}
                onClick={() => setActiveLayer('SCHEMA')}
              >
                02 Schema
              </button>
              <button
                type="button"
                className={`landing-3d-layer-btn ${activeLayer === 'AUTHORIZATION' ? 'active' : ''}`}
                onClick={() => setActiveLayer('AUTHORIZATION')}
              >
                03 Authorization
              </button>
              <button
                type="button"
                className={`landing-3d-layer-btn ${activeLayer === 'EXECUTION' ? 'active' : ''}`}
                onClick={() => setActiveLayer('EXECUTION')}
              >
                04 Execution
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
