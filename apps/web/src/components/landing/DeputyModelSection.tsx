import React from 'react';
import { motion } from 'framer-motion';
import { Video, FileText, Sparkles, Key, ShieldCheck } from 'lucide-react';

export const DeputyModelSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      badge: 'Capture',
      title: 'Human Demonstration',
      desc: 'Operator performs real business actions in the enterprise console.',
      color: '#0891b2',
      icon: <Video size={16} />,
    },
    {
      step: '02',
      badge: 'Provenance',
      title: 'Evidence Library',
      desc: 'Immutable semantic traces with origin tracking and taint isolation.',
      color: '#3b82f6',
      icon: <FileText size={16} />,
    },
    {
      step: '03',
      badge: 'Synthesis',
      title: 'Deterministic Synthesis',
      desc: 'Variational parameter inference without arbitrary script generation.',
      color: '#7c3aed',
      icon: <Sparkles size={16} />,
    },
    {
      step: '04',
      badge: 'Governance',
      title: 'Human Authorization',
      desc: 'FIDO2 passkey User Verification bound to SHA-256 canonical digest.',
      color: '#818cf8',
      icon: <Key size={16} />,
    },
    {
      step: '05',
      badge: 'Runtime',
      title: 'Controlled Execution',
      desc: 'Single-use execution strictly via registered ActionRegistry targets.',
      color: '#059669',
      icon: <ShieldCheck size={16} />,
    },
  ];

  return (
    <section id="model" className="landing-model-section">
      <div className="landing-container">
        {/* Core Statement Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="landing-model-quote-card"
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#c084fc',
              marginBottom: 12,
              fontWeight: 700,
            }}
          >
            ARCHITECTURE PRINCIPLE
          </div>
          <blockquote className="landing-model-quote">
            &ldquo;DEPUTY does not ask the model to be trusted.
            <br />
            DEPUTY constrains what the model is allowed to do.&rdquo;
          </blockquote>
          <p className="landing-model-quote-sub">
            The capability surface is strictly declarative. No <code>eval()</code>, no runtime shell
            generation, no dynamic script injection, and no ambient authority.
          </p>
        </motion.div>

        {/* 5-Step Process Pipeline */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span className="landing-section-label">THE 5-STAGE SYNTHESIS PIPELINE</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#09090b' }}>
              From Raw Actions to Verifiable Capabilities
            </h3>
          </div>

          <div className="landing-flow-horizontal">
            {steps.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="landing-flow-step"
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span className="landing-flow-badge" style={{ color: item.color }}>
                    {item.step} / {item.badge}
                  </span>
                  <div style={{ color: item.color }}>{item.icon}</div>
                </div>

                <div className="landing-flow-title">{item.title}</div>
                <div className="landing-flow-desc">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
