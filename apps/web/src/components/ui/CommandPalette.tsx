import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  LayoutDashboard,
  Terminal,
  Video,
  Sparkles,
  Wrench,
  ShieldCheck,
  ScrollText,
  Key,
  ShieldAlert,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { LearnedTool, Demonstration, AuditEvent, Authorization } from '@deputy/domain';
import { ActiveTab } from '../Sidebar.js';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  tools?: LearnedTool[];
  demonstrations?: Demonstration[];
  auditEvents?: AuditEvent[];
  authorizations?: Authorization[];
  onInspectTool?: (tool: LearnedTool) => void;
  onInspectDemonstration?: (demo: Demonstration) => void;
}

interface CommandItem {
  id: string;
  category: 'PAGES' | 'TOOLS' | 'DEMONSTRATIONS' | 'AUTHORIZATIONS' | 'AUDIT';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  tools = [],
  demonstrations = [],
  authorizations = [],
  onInspectTool,
  onInspectDemonstration,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global keydown listener for ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build items list
  const allItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      // Pages
      {
        id: 'page_dashboard',
        category: 'PAGES',
        title: 'Command Center',
        subtitle: 'Observe system posture & metrics',
        icon: <LayoutDashboard size={15} />,
        action: () => {
          onSelectTab('dashboard');
          onClose();
        },
      },
      {
        id: 'page_operations',
        category: 'PAGES',
        title: 'Operations Console',
        subtitle: 'Execute enterprise domain actions',
        icon: <Terminal size={15} />,
        action: () => {
          onSelectTab('operations');
          onClose();
        },
      },
      {
        id: 'page_demonstrations',
        category: 'PAGES',
        title: 'Demonstrations & Evidence Library',
        subtitle: 'Inspect recorded semantic traces',
        icon: <Video size={15} />,
        action: () => {
          onSelectTab('demonstrations');
          onClose();
        },
      },
      {
        id: 'page_synthesis',
        category: 'PAGES',
        title: 'Synthesis Studio',
        subtitle: 'Learn capabilities from evidence traces',
        icon: <Sparkles size={15} />,
        action: () => {
          onSelectTab('synthesis');
          onClose();
        },
      },
      {
        id: 'page_tools',
        category: 'PAGES',
        title: 'Capabilities & WebMCP Tools',
        subtitle: 'Inventory of active capabilities',
        icon: <Wrench size={15} />,
        action: () => {
          onSelectTab('tools');
          onClose();
        },
      },
      {
        id: 'page_authorizations',
        category: 'PAGES',
        title: 'Authorization Center',
        subtitle: 'Pending human approvals & passkey gate',
        icon: <Key size={15} />,
        action: () => {
          onSelectTab('authorizations');
          onClose();
        },
      },
      {
        id: 'page_quarantine',
        category: 'PAGES',
        title: 'Quarantine Surface',
        subtitle: 'Untrusted content boundaries & budgets',
        icon: <ShieldAlert size={15} />,
        action: () => {
          onSelectTab('quarantine');
          onClose();
        },
      },
      {
        id: 'page_audit',
        category: 'PAGES',
        title: 'Cryptographic Audit Trail',
        subtitle: 'Forensic append-only SHA-256 event stream',
        icon: <ScrollText size={15} />,
        action: () => {
          onSelectTab('audit');
          onClose();
        },
      },
      {
        id: 'page_security',
        category: 'PAGES',
        title: 'Security Posture & Invariants',
        subtitle: '18 Invariants, passkeys & digest bench',
        icon: <ShieldCheck size={15} />,
        action: () => {
          onSelectTab('security');
          onClose();
        },
      },
      {
        id: 'page_settings',
        category: 'PAGES',
        title: 'Settings & Runtime Config',
        subtitle: 'Environment & limits configuration',
        icon: <Settings size={15} />,
        action: () => {
          onSelectTab('settings');
          onClose();
        },
      },
    ];

    // Tools
    for (const tool of tools) {
      items.push({
        id: `tool_${tool.toolId}`,
        category: 'TOOLS',
        title: tool.name,
        subtitle: `${tool.toolId} · v${tool.version} · ${tool.riskLevel}`,
        icon: <Wrench size={15} style={{ color: 'var(--semantic-webmcp)' }} />,
        action: () => {
          onSelectTab('tools');
          if (onInspectTool) onInspectTool(tool);
          onClose();
        },
      });
    }

    // Demonstrations
    for (const demo of demonstrations) {
      items.push({
        id: `demo_${demo.demonstrationId}`,
        category: 'DEMONSTRATIONS',
        title: demo.taskDescription || demo.demonstrationId,
        subtitle: `${demo.demonstrationId} · ${demo.actions.length} action(s) · ${demo.status}`,
        icon: <Video size={15} style={{ color: 'var(--semantic-auth)' }} />,
        action: () => {
          onSelectTab('demonstrations');
          if (onInspectDemonstration) onInspectDemonstration(demo);
          onClose();
        },
      });
    }

    // Authorizations
    for (const auth of authorizations) {
      items.push({
        id: `auth_${auth.authorizationId}`,
        category: 'AUTHORIZATIONS',
        title: `Auth: ${auth.toolId}`,
        subtitle: `Req: ${auth.requestId.slice(0, 16)}... · Status: ${auth.status}`,
        icon: <Key size={15} style={{ color: 'var(--semantic-amber)' }} />,
        action: () => {
          onSelectTab('authorizations');
          onClose();
        },
      });
    }

    return items;
  }, [
    tools,
    demonstrations,
    authorizations,
    onSelectTab,
    onInspectTool,
    onInspectDemonstration,
    onClose,
  ]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  // Keyboard navigation within palette
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length),
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        current.action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="command-palette-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="command-palette-modal">
        <div className="command-palette-search">
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Type a command, tool, demonstration, or search..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            autoFocus
          />
          <span className="command-palette-kbd">ESC</span>
        </div>

        <div className="command-palette-list">
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
              }}
            >
              No matching commands or resources found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={item.id}
                  className={`command-palette-item ${isSelected ? 'active' : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="command-palette-kbd">{item.category}</span>
                    <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
