import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Key, ShieldCheck } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  return (
    <section id="problem" className="landing-problem-section">
      <div className="landing-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="landing-problem-header"
        >
          <span className="landing-section-label">THE CORE INVARIANT</span>
          <h2 className="landing-problem-title">Demonstration is not authorization.</h2>
          <p className="landing-problem-sub">
            A workflow learned from examples should not automatically become permission to execute
            it. Autonomous agents must propose; deterministic security boundaries must decide.
          </p>
        </motion.div>

        {/* 3 Pillars Grid */}
        <div className="landing-pillars-grid">
          {/* Pillar 1: LEARN */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="landing-pillar-card"
          >
            <div className="landing-pillar-num">01 / CAPTURE</div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(6, 182, 212, 0.1)',
                color: '#0891b2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Terminal size={18} />
            </div>
            <h3 className="landing-pillar-heading">LEARN</h3>
            <p className="landing-pillar-desc">
              DEPUTY records semantic application calls, not fragile DOM clicks or screen pixels.
              Multi-step tasks are captured with verified provenance and typed parameters.
            </p>
          </motion.div>

          {/* Pillar 2: VERIFY */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="landing-pillar-card"
          >
            <div className="landing-pillar-num">02 / GOVERN</div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(124, 58, 237, 0.1)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Key size={18} />
            </div>
            <h3 className="landing-pillar-heading">VERIFY</h3>
            <p className="landing-pillar-desc">
              High-risk actions require explicit human authorization via FIDO2 WebAuthn hardware
              User Verification. Signatures bind strictly to the canonical SHA-256 parameter digest.
            </p>
          </motion.div>

          {/* Pillar 3: EXECUTE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="landing-pillar-card"
          >
            <div className="landing-pillar-num">03 / ENFORCE</div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <h3 className="landing-pillar-heading">EXECUTE</h3>
            <p className="landing-pillar-desc">
              Executions route solely to registered native application handlers. If any parameter is
              tampered with, execution is deterministically rejected fail-closed and sealed in an
              immutable audit log.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
