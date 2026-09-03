import React, { useEffect, useState, useCallback } from 'react';
import { AuditEvent, Authorization, Demonstration, LearnedTool } from '@deputy/domain';
import {
  ActiveRecordingState,
  RecordingBar,
  RecordedActionItem,
} from './components/RecordingBar.js';
import { ActiveTab, Sidebar } from './components/Sidebar.js';
import { TopBar } from './components/TopBar.js';
import { CommandPalette } from './components/ui/CommandPalette.js';
import { ToastProvider, useToast } from './context/ToastContext.js';

// Pages
import { DashboardView } from './pages/DashboardView.js';
import { OperationsConsoleView } from './pages/OperationsConsoleView.js';
import { DemonstrationsView } from './pages/DemonstrationsView.js';
import { SynthesisStudioView } from './pages/SynthesisStudioView.js';
import { ToolsView } from './pages/ToolsView.js';
import { WebMcpView } from './pages/WebMcpView.js';
import { AuthorizationCenterView } from './pages/AuthorizationCenterView.js';
import { QuarantineView } from './pages/QuarantineView.js';
import { AuditView } from './pages/AuditView.js';
import { SecurityView } from './pages/SecurityView.js';
import { SettingsView } from './pages/SettingsView.js';

const AppInner: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [tools, setTools] = useState<LearnedTool[]>([]);
  const [demonstrations, setDemonstrations] = useState<Demonstration[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Active recording session
  const [recording, setRecording] = useState<ActiveRecordingState | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Tools
      const toolsRes = await fetch('http://localhost:4000/api/tools');
      if (toolsRes.ok) {
        const data = await toolsRes.json();
        setTools(data.data || []);
      }

      // 2. Fetch Demonstrations
      const demosRes = await fetch('http://localhost:4000/api/demonstrations');
      if (demosRes.ok) {
        const data = await demosRes.json();
        setDemonstrations(data.data || []);
      }

      // 3. Fetch Audit Events
      const auditRes = await fetch('http://localhost:4000/api/audit');
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditEvents(data.data || []);
      }

      // 4. Fetch Authorizations
      const authRes = await fetch('http://localhost:4000/api/authorizations');
      if (authRes.ok) {
        const data = await authRes.json();
        setAuthorizations(data.data || []);
      }
    } catch (err) {
      console.warn('Backend connection notice', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Global ⌘K Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Recording controls
  const handleStartRecording = async (taskDescription: string) => {
    try {
      const res = await fetch('http://localhost:4000/api/demonstrations/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskDescription }),
      });
      const json = await res.json();
      if (res.ok) {
        setRecording({
          demonstrationId: json.data.demonstration.demonstrationId,
          sessionId: json.data.session.sessionId,
          taskDescription,
          status: 'RECORDING',
          startedAt: Date.now(),
          actionCount: 0,
          actionTrace: [],
        });
        setActiveTab('operations');
        showToast(
          'auth',
          'Demonstration Started',
          `Live recording session initialized for "${taskDescription}".`,
        );
      }
    } catch {
      showToast('error', 'Recording Error', 'Failed to start demonstration session.');
    }
  };

  const handlePauseRecording = async () => {
    if (!recording) return;
    try {
      await fetch(
        `http://localhost:4000/api/demonstrations/${recording.demonstrationId}/recording/pause`,
        { method: 'POST' },
      );
      setRecording(prev => (prev ? { ...prev, status: 'PAUSED' } : null));
      showToast('amber', 'Recording Paused', 'Action observation paused.');
    } catch {
      showToast('error', 'Error', 'Failed to pause recording.');
    }
  };

  const handleResumeRecording = async () => {
    if (!recording) return;
    try {
      await fetch(
        `http://localhost:4000/api/demonstrations/${recording.demonstrationId}/recording/resume`,
        { method: 'POST' },
      );
      setRecording(prev => (prev ? { ...prev, status: 'RECORDING' } : null));
      showToast('auth', 'Recording Resumed', 'Live capture active.');
    } catch {
      showToast('error', 'Error', 'Failed to resume recording.');
    }
  };

  const handleCompleteRecording = async () => {
    if (!recording) return;
    try {
      await fetch(
        `http://localhost:4000/api/demonstrations/${recording.demonstrationId}/recording/complete`,
        { method: 'POST' },
      );
      showToast(
        'success',
        'Demonstration Completed',
        `Recorded trace with ${recording.actionCount} action(s).`,
      );
      setRecording(null);
      await fetchData();
      setActiveTab('synthesis');
    } catch {
      showToast('error', 'Error', 'Failed to complete recording.');
    }
  };

  const handleDiscardRecording = async () => {
    if (!recording) return;
    try {
      await fetch(
        `http://localhost:4000/api/demonstrations/${recording.demonstrationId}/recording/discard`,
        { method: 'POST' },
      );
      showToast('amber', 'Demonstration Discarded', 'In-flight recording session cleared.');
      setRecording(null);
      await fetchData();
    } catch {
      showToast('error', 'Error', 'Failed to discard recording.');
    }
  };

  const handleActionObserved = (actionType: string, summary: string) => {
    if (!recording) return;
    const newTraceItem: RecordedActionItem = {
      actionType,
      summary,
      sequenceNumber: recording.actionCount + 1,
      timestamp: new Date().toISOString(),
    };

    setRecording(prev =>
      prev
        ? {
            ...prev,
            actionCount: prev.actionCount + 1,
            actionTrace: [...(prev.actionTrace || []), newTraceItem],
            lastAction: { actionType, summary },
          }
        : null,
    );
  };

  const pendingAuths = authorizations.filter(a => a.status === 'PENDING');

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingAuthCount={pendingAuths.length}
        activeToolCount={tools.filter(t => t.status === 'ACTIVE').length}
      />

      {/* Main Content Workspace */}
      <div className="main-content">
        <TopBar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} recording={recording} />

        {loading && (
          <div
            style={{
              height: 2,
              background: 'linear-gradient(90deg, transparent, var(--semantic-auth), transparent)',
              animation: 'skeleton-shimmer 1.5s infinite',
            }}
          />
        )}

        {/* Global Precision Recording Capture Instrument */}
        <RecordingBar
          recording={recording}
          onStart={handleStartRecording}
          onPause={handlePauseRecording}
          onResume={handleResumeRecording}
          onComplete={handleCompleteRecording}
          onDiscard={handleDiscardRecording}
        />

        {/* View Routing */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <DashboardView
              toolCount={tools.length}
              demonstrationCount={demonstrations.length}
              auditCount={auditEvents.length}
              tools={tools}
              auditEvents={auditEvents}
              onRefresh={fetchData}
              onNavigateTab={tab => setActiveTab(tab as ActiveTab)}
            />
          )}

          {activeTab === 'operations' && (
            <OperationsConsoleView recording={recording} onActionObserved={handleActionObserved} />
          )}

          {activeTab === 'demonstrations' && (
            <DemonstrationsView
              demonstrations={demonstrations}
              onNavigateToSynthesis={() => {
                setActiveTab('synthesis');
              }}
            />
          )}

          {activeTab === 'synthesis' && (
            <SynthesisStudioView
              onToolApproved={async () => {
                await fetchData();
                setActiveTab('tools');
              }}
            />
          )}

          {activeTab === 'tools' && (
            <ToolsView
              tools={tools}
              onRefresh={fetchData}
              onNavigateToSynthesis={() => setActiveTab('synthesis')}
            />
          )}

          {activeTab === 'webmcp' && <WebMcpView tools={tools} />}

          {activeTab === 'authorizations' && (
            <AuthorizationCenterView authorizations={authorizations} onRefresh={fetchData} />
          )}

          {activeTab === 'quarantine' && <QuarantineView />}

          {activeTab === 'audit' && <AuditView auditEvents={auditEvents} onRefresh={fetchData} />}

          {activeTab === 'security' && <SecurityView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global ⌘K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={tab => setActiveTab(tab)}
        tools={tools}
        demonstrations={demonstrations}
        auditEvents={auditEvents}
        authorizations={authorizations}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
};
