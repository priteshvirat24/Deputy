import React from 'react';
import { Shield } from 'lucide-react';

interface LandingFooterProps {
  onEnterApp: () => void;
  onEnterJudgeMode: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onEnterApp, onEnterJudgeMode }) => {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="landing-logo-mark">
              <Shield size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#09090b' }}>DEPUTY</div>
              <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Fail-Closed Dynamic Capability System for WebMCP
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              className="landing-nav-link"
              onClick={onEnterJudgeMode}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem' }}
            >
              ✦ Judge Mode (38s)
            </button>

            <button
              type="button"
              className="landing-nav-link"
              onClick={onEnterApp}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem' }}
            >
              Launch Console →
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
