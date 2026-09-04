import React, { useEffect, useState } from 'react';
import { detectWebMCPSupport, WebMCPCapabilities } from '@deputy/webmcp';
import { ShieldCheck, Cpu } from 'lucide-react';

export const WebMcpBanner: React.FC = () => {
  const [capabilities, setCapabilities] = useState<WebMCPCapabilities>({
    available: false,
    provider: 'NONE',
    location: 'none',
    deprecatedAlias: false,
    supportsSignalRetirement: false,
  });

  useEffect(() => {
    const caps = detectWebMCPSupport();
    setCapabilities(caps);
  }, []);

  return (
    <header className="webmcp-banner">
      <div className="webmcp-status">
        <div className={`status-dot ${capabilities.available ? 'active' : 'fallback'}`} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>WebMCP Engine:</span>
        <span style={{ color: capabilities.available ? '#34d399' : '#fcd34d' }}>
          {capabilities.available
            ? `Native Browser Active — ${capabilities.location}`
            : 'Fallback & Compatibility Mode Active'}
        </span>
        {capabilities.deprecatedAlias && (
          <span
            title="Resolved via the deprecated navigator.modelContext alias. document.modelContext is canonical."
            style={{
              color: '#0f172a',
              background: '#fcd34d',
              fontWeight: 600,
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '4px',
            }}
          >
            deprecated alias
          </span>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          ({capabilities.reason || `Provider: ${capabilities.provider}`})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
          }}
        >
          <Cpu size={14} />
          <span>
            Security Gate: <strong style={{ color: '#38bdf8' }}>FAIL-CLOSED</strong>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
          }}
        >
          <ShieldCheck size={14} color="#10b981" />
          <span>
            Execution Boundary: <strong style={{ color: '#10b981' }}>TRUSTED ONLY</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
