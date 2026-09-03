import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  Video,
  Sparkles,
  Wrench,
  ScrollText,
  ShieldCheck,
  Settings,
  Lock,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'operations'
  | 'demonstrations'
  | 'synthesis'
  | 'tools'
  | 'audit'
  | 'security'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isRecording?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, isRecording }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
            <Lock size={20} />
          </div>
          <div>
            <h1 className="brand-name">DEPUTY</h1>
            <div className="brand-tagline">WebMCP Authority</div>
          </div>
        </div>
      </div>

      <ul className="nav-links">
        <li
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </li>
        <li
          className={`nav-item ${activeTab === 'operations' ? 'active' : ''}`}
          onClick={() => onSelectTab('operations')}
        >
          <Terminal size={18} />
          <span>Operations Console</span>
          {isRecording && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ef4444',
                marginLeft: 'auto',
                boxShadow: '0 0 8px #ef4444',
              }}
            />
          )}
        </li>
        <li
          className={`nav-item ${activeTab === 'demonstrations' ? 'active' : ''}`}
          onClick={() => onSelectTab('demonstrations')}
        >
          <Video size={18} />
          <span>Demonstrations</span>
        </li>
        <li
          className={`nav-item ${activeTab === 'synthesis' ? 'active' : ''}`}
          onClick={() => onSelectTab('synthesis')}
        >
          <Sparkles size={18} />
          <span>Synthesis Studio</span>
        </li>
        <li
          className={`nav-item ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => onSelectTab('tools')}
        >
          <Wrench size={18} />
          <span>Learned Tools</span>
        </li>
        <li
          className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => onSelectTab('audit')}
        >
          <ScrollText size={18} />
          <span>Audit Log</span>
        </li>
        <li
          className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => onSelectTab('security')}
        >
          <ShieldCheck size={18} />
          <span>Security & Invariants</span>
        </li>
        <li
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div>DEPUTY Synthesis v0.2.0</div>
        <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
          Autonomous Tool Synthesis Engine
        </div>
      </div>
    </aside>
  );
};
