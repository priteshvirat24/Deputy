import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  Video,
  Sparkles,
  Wrench,
  Cpu,
  Bot,
  Key,
  ShieldAlert,
  ScrollText,
  ShieldCheck,
  Settings,
  Shield,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'operations'
  | 'demonstrations'
  | 'synthesis'
  | 'tools'
  | 'webmcp'
  | 'agent'
  | 'authorizations'
  | 'quarantine'
  | 'audit'
  | 'security'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingAuthCount?: number;
  activeToolCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingAuthCount = 0,
  activeToolCount = 0,
}) => {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
            <Shield size={18} />
          </div>
          <div>
            <div className="brand-name">DEPUTY</div>
            <div className="brand-tagline">Security Architecture</div>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <ul className="nav-groups">
        {/* Monitoring & Operations */}
        <li>
          <div className="nav-group-label">OPERATIONS</div>
          <ul className="nav-items">
            <li
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => onSelectTab('dashboard')}
            >
              <LayoutDashboard size={15} className="nav-icon" />
              <span>Command Center</span>
            </li>
            <li
              className={`nav-item ${activeTab === 'operations' ? 'active' : ''}`}
              onClick={() => onSelectTab('operations')}
            >
              <Terminal size={15} className="nav-icon" />
              <span>Operations Console</span>
            </li>
          </ul>
        </li>

        {/* Learning Pipeline */}
        <li>
          <div className="nav-group-label">LEARNING PIPELINE</div>
          <ul className="nav-items">
            <li
              className={`nav-item ${activeTab === 'demonstrations' ? 'active' : ''}`}
              onClick={() => onSelectTab('demonstrations')}
            >
              <Video size={15} className="nav-icon" />
              <span>Demonstrations</span>
            </li>
            <li
              className={`nav-item ${activeTab === 'synthesis' ? 'active' : ''}`}
              onClick={() => onSelectTab('synthesis')}
            >
              <Sparkles size={15} className="nav-icon" />
              <span>Synthesis Studio</span>
            </li>
          </ul>
        </li>

        {/* Capabilities & Runtime */}
        <li>
          <div className="nav-group-label">CAPABILITIES</div>
          <ul className="nav-items">
            <li
              className={`nav-item ${activeTab === 'tools' ? 'active' : ''}`}
              onClick={() => onSelectTab('tools')}
            >
              <Wrench size={15} className="nav-icon" />
              <span style={{ flex: 1 }}>Tools Registry</span>
              {activeToolCount > 0 && (
                <span
                  className="mono"
                  style={{
                    fontSize: '0.68rem',
                    background: 'var(--surface-3)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {activeToolCount}
                </span>
              )}
            </li>
            <li
              className={`nav-item ${activeTab === 'webmcp' ? 'active' : ''}`}
              onClick={() => onSelectTab('webmcp')}
            >
              <Cpu size={15} className="nav-icon" />
              <span>WebMCP Runtime</span>
            </li>
            <li
              className={`nav-item ${activeTab === 'agent' ? 'active' : ''}`}
              onClick={() => onSelectTab('agent')}
            >
              <Bot size={15} className="nav-icon" />
              <span>Agent&rsquo;s-Eye View</span>
            </li>
          </ul>
        </li>

        {/* Governance & Security Enclave */}
        <li>
          <div className="nav-group-label">SECURITY & AUDIT</div>
          <ul className="nav-items">
            <li
              className={`nav-item ${activeTab === 'authorizations' ? 'active' : ''}`}
              onClick={() => onSelectTab('authorizations')}
            >
              <Key size={15} className="nav-icon" />
              <span style={{ flex: 1 }}>Authorizations</span>
              {pendingAuthCount > 0 && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: 'var(--semantic-amber)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  {pendingAuthCount}
                </span>
              )}
            </li>
            <li
              className={`nav-item ${activeTab === 'quarantine' ? 'active' : ''}`}
              onClick={() => onSelectTab('quarantine')}
            >
              <ShieldAlert size={15} className="nav-icon" />
              <span>Quarantine</span>
            </li>
            <li
              className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => onSelectTab('audit')}
            >
              <ScrollText size={15} className="nav-icon" />
              <span>Audit Trail</span>
            </li>
            <li
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => onSelectTab('security')}
            >
              <ShieldCheck size={15} className="nav-icon" />
              <span>Security Posture</span>
            </li>
          </ul>
        </li>

        {/* System Settings */}
        <li>
          <div className="nav-group-label">SYSTEM</div>
          <ul className="nav-items">
            <li
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => onSelectTab('settings')}
            >
              <Settings size={15} className="nav-icon" />
              <span>Settings</span>
            </li>
          </ul>
        </li>
      </ul>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span className="status-dot active" />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>DEPUTY v1.0.0</span>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          Fail-Closed Runtime Active
        </div>
      </div>
    </aside>
  );
};
