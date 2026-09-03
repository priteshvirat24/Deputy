import React from 'react';
import { Shield, Film, ArrowRight } from 'lucide-react';

interface LandingNavbarProps {
  onEnterJudgeMode: () => void;
  onEnterApp: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onEnterJudgeMode, onEnterApp }) => {
  return (
    <nav className="landing-navbar">
      <div className="landing-container" style={{ width: '100%' }}>
        <div className="landing-nav-inner">
          {/* Logo */}
          <div className="landing-logo" onClick={onEnterApp}>
            <div className="landing-logo-mark">
              <Shield size={16} />
            </div>
            <span className="landing-logo-text">DEPUTY</span>
          </div>

          {/* Nav Links */}
          <div className="landing-nav-links">
            <a href="#problem" className="landing-nav-link">
              Problem
            </a>
            <a href="#model" className="landing-nav-link">
              Security Model
            </a>
            <a href="#capability-core" className="landing-nav-link">
              Capability Core
            </a>
          </div>

          {/* CTAs */}
          <div className="landing-nav-actions">
            <button
              type="button"
              className="landing-btn-judge"
              onClick={onEnterJudgeMode}
              title="Launch 38-Second Cinematic Judge Mode (⌘J)"
            >
              <Film size={14} style={{ color: '#c084fc' }} />
              <span>Judge Mode (38s)</span>
            </button>

            <button
              type="button"
              className="landing-btn-app"
              onClick={onEnterApp}
              title="Open Operator Platform"
            >
              <span>Explore Platform</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
