import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  ScrollText,
  Video,
  Sparkles,
  Wrench,
  ShieldCheck,
  Settings,
  Shield,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'operations'
  | 'audit'
  | 'demonstrations'
  | 'synthesis'
  | 'tools'
  | 'security'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isRecording?: boolean;
}

interface NavItemConfig {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  indicator?: boolean;
}

interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, isRecording }) => {
  const navGroups: NavGroupConfig[] = [
    {
      title: 'COMMAND',
      items: [
        {
          id: 'dashboard',
          label: 'Command Center',
          icon: <LayoutDashboard size={16} className="nav-icon" />,
        },
        {
          id: 'operations',
          label: 'Operations Console',
          icon: <Terminal size={16} className="nav-icon" />,
          indicator: isRecording,
        },
        {
          id: 'audit',
          label: 'Audit Trail',
          icon: <ScrollText size={16} className="nav-icon" />,
        },
      ],
    },
    {
      title: 'LEARN',
      items: [
        {
          id: 'demonstrations',
          label: 'Demonstrations',
          icon: <Video size={16} className="nav-icon" />,
        },
        {
          id: 'synthesis',
          label: 'Synthesis Studio',
          icon: <Sparkles size={16} className="nav-icon" />,
        },
      ],
    },
    {
      title: 'CAPABILITIES',
      items: [
        {
          id: 'tools',
          label: 'WebMCP Tools',
          icon: <Wrench size={16} className="nav-icon" />,
        },
      ],
    },
    {
      title: 'SECURITY',
      items: [
        {
          id: 'security',
          label: 'Security Posture',
          icon: <ShieldCheck size={16} className="nav-icon" />,
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings size={16} className="nav-icon" />,
        },
      ],
    },
  ];

  return (
    <aside className="sidebar" aria-label="System Navigation">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
            <Shield size={17} />
          </div>
          <div>
            <h1 className="brand-name">DEPUTY</h1>
            <div className="brand-tagline">WebMCP Security Authority</div>
          </div>
        </div>
      </div>

      <nav className="nav-groups">
        {navGroups.map(group => (
          <div key={group.title} className="nav-group">
            <div className="nav-group-label">{group.title}</div>
            <ul className="nav-items">
              {group.items.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <li
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-current={isActive ? 'page' : undefined}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectTab(item.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectTab(item.id);
                      }
                    }}
                  >
                    {item.icon}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.indicator && (
                      <span
                        title="Recording active"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--semantic-recording)',
                          boxShadow: '0 0 6px var(--semantic-recording)',
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>DEPUTY v0.4.0</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--semantic-emerald)',
              fontSize: '0.7rem',
            }}
          >
            <span className="status-dot active" />
            READY
          </span>
        </div>
        <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
          Deterministic WebMCP Gate
        </div>
      </div>
    </aside>
  );
};
