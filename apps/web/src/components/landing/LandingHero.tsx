import React from 'react';
import { motion } from 'framer-motion';
import { Film, ArrowRight } from 'lucide-react';

interface LandingHeroProps {
  onEnterJudgeMode: () => void;
  onEnterApp: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnterJudgeMode, onEnterApp }) => {
  return (
    <section className="landing-hero-section">
      <div className="landing-container">
        {/* 1. Small Product Identifier Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="landing-pill-tag"
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#059669',
              boxShadow: '0 0 6px rgba(5, 150, 105, 0.6)',
            }}
          />
          <span>FAIL-CLOSED CAPABILITY GOVERNANCE</span>
        </motion.div>

        {/* 2. Large Hook-Driven Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="landing-hero-title"
        >
          AI can learn the workflow.
          <br />
          <span style={{ color: '#7c3aed' }}>DEPUTY</span> makes sure it cannot escape the rules.
        </motion.h1>

        {/* 3. Supporting Statement */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="landing-hero-subtitle"
        >
          Demonstrate a task once. DEPUTY turns verified demonstrations into executable capabilities
          without generating arbitrary code.
        </motion.p>

        {/* 4. Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="landing-hero-ctas"
        >
          <button
            type="button"
            className="landing-btn-judge"
            onClick={onEnterJudgeMode}
            style={{ padding: '12px 24px', fontSize: '0.92rem' }}
          >
            <Film size={16} style={{ color: '#c084fc' }} />
            <span>Enter Judge Mode (38s)</span>
          </button>

          <button
            type="button"
            className="landing-btn-app"
            onClick={onEnterApp}
            style={{ padding: '12px 24px', fontSize: '0.92rem' }}
          >
            <span>Explore DEPUTY</span>
            <ArrowRight size={15} />
          </button>
        </motion.div>

        {/* 5. Technical Pipeline Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <div className="landing-pipeline-strip">
            <span className="landing-pipeline-step">01 DEMONSTRATION</span>
            <span>→</span>
            <span className="landing-pipeline-step violet">02 SYNTHESIS</span>
            <span>→</span>
            <span className="landing-pipeline-step">03 SCHEMA</span>
            <span>→</span>
            <span className="landing-pipeline-step violet">04 AUTHORIZATION</span>
            <span>→</span>
            <span className="landing-pipeline-step cyan">05 WEBMCP</span>
            <span>→</span>
            <span className="landing-pipeline-step emerald">06 EXECUTION</span>
            <span>→</span>
            <span className="landing-pipeline-step">07 SHA-256 AUDIT</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
