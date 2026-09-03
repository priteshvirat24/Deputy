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
import { DeputyCinematicExperience } from './components/cinematic/DeputyCinematicExperience.js';
import { ToastProvider, useToast } from './context/ToastContext.js';

// Pages
import { DashboardView } from './pages/DashboardView.js';
import { OperationsConsoleView } from './pages/OperationsConsoleView.js';
import { DemonstrationsView } from './pages/DemonstrationsView.js';
import { SynthesisStudioView } from './pages/SynthesisStudioView.js';
import { ToolsView } from './pages/ToolsView.js';
import { AgentEyeView } from './pages/AgentEyeView.js';
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

  // Global Command Palette & Cinematic Film state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCinematicOpen, setIsCinematicOpen] = useState(false);

  // Active recording session
  const [recording, setRecording] = useState<ActiveRecordingState | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Tools
      const toolsRes = await fetch('/api/tools');
      if (toolsRes.ok) {
        const data = await toolsRes.json();
        setTools(data.data || []);
      }

      // 2. Fetch Demonstrations
      const demosRes = await fetch('/api/demonstrations');
      if (demosRes.ok) {
        const data = await demosRes.json();
        setDemonstrations(data.data || []);
      }

      // 3. Fetch Audit Events
      const auditRes = await fetch('/api/audit');
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditEvents(data.data || []);
      }

      // 4. Fetch Authorizations
      const authRes = await fetch('/api/authorizations');
      if (authRes.ok) {
        const data = await authRes.json();
        setAuthorizations(data.data || []);
      }
    } catch (err) {
      console.warn('Backend connection notice', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Global ⌘K and ⌘J Keyboard Shortcut Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsCinematicOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Recording controls
  const handleStartRecording = async (taskDescription: string) => {
    try {
      const res = await fetch('/api/demonstrations/recording/start', {
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
    } catch (err) {
      console.error('Failed to start recording', err);
      showToast('error', 'Recording Failed', String(err));
    }
  };

  const handlePauseRecording = async () => {
    if (!recording) return;
    try {
      const res = await fetch(`/api/demonstrations/${recording.demonstrationId}/recording/pause`, {
        method: 'POST',
      });
      if (res.ok) {
        setRecording(prev => (prev ? { ...prev, status: 'PAUSED' } : null));
        showToast('amber', 'Recording Paused', 'Semantic trace capture paused.');
      }
    } catch (err) {
      console.error('Failed to pause recording', err);
    }
  };

  const handleResumeRecording = async () => {
    if (!recording) return;
    try {
      const res = await fetch(`/api/demonstrations/${recording.demonstrationId}/recording/resume`, {
        method: 'POST',
      });
      if (res.ok) {
        setRecording(prev => (prev ? { ...prev, status: 'RECORDING' } : null));
        showToast('auth', 'Recording Resumed', 'Semantic trace capture active.');
      }
    } catch (err) {
      console.error('Failed to resume recording', err);
    }
  };

  const handleCompleteRecording = async () => {
    if (!recording) return;
    try {
      const res = await fetch(
        `/api/demonstrations/${recording.demonstrationId}/recording/complete`,
        {
          method: 'POST',
        },
      );
      if (res.ok) {
        showToast(
          'success',
          'Demonstration Recorded',
          `Successfully saved demonstration with ${recording.actionCount} action steps.`,
        );
        setRecording(null);
        await fetchData();
        setActiveTab('demonstrations');
      }
    } catch (err) {
      console.error('Failed to complete recording', err);
      showToast('error', 'Save Failed', String(err));
    }
  };

  const handleDiscardRecording = async () => {
    if (!recording) return;
    try {
      const res = await fetch(
        `/api/demonstrations/${recording.demonstrationId}/recording/discard`,
        {
          method: 'POST',
        },
      );
      if (res.ok) {
        showToast('amber', 'Recording Discarded', 'Demonstration trace discarded.');
        setRecording(null);
      }
    } catch (err) {
      console.error('Failed to discard recording', err);
    }
  };

  const handleActionObserved = (actionType: string, summary: string) => {
    if (!recording || recording.status === 'PAUSED') return;
    const item: RecordedActionItem = {
      actionType,
      summary,
      sequenceNumber: recording.actionCount + 1,
      timestamp: new Date().toISOString(),
    };
    setRecording(prev => {
      if (!prev) return null;
      const trace = prev.actionTrace ? [...prev.actionTrace, item] : [item];
      return {
        ...prev,
        actionCount: prev.actionCount + 1,
        actionTrace: trace,
        lastAction: { actionType, summary },
      };
    });
  };

  const pendingAuthCount = authorizations.filter(a => a.status === 'PENDING').length;
  const activeToolCount = tools.filter(t => t.status === 'ACTIVE').length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCinematic={() => setIsCinematicOpen(true)}
        pendingAuthCount={pendingAuthCount}
        activeToolCount={activeToolCount}
      />

      {/* Main Layout Area */}
      <div className="main-content">
        {/* Top Technical Status & Command Bar */}
        <TopBar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenCinematic={() => setIsCinematicOpen(true)}
          recording={recording}
        />

        {/* Live Precision Recording Instrument Bar */}
        <RecordingBar
          recording={recording}
          onStart={handleStartRecording}
          onPause={handlePauseRecording}
          onResume={handleResumeRecording}
          onComplete={handleCompleteRecording}
          onDiscard={handleDiscardRecording}
        />

        {/* View Surface Content Router */}
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
              onOpenCinematic={() => setIsCinematicOpen(true)}
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

          {activeTab === 'agent' && <AgentEyeView tools={tools} />}

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
        onOpenCinematic={() => setIsCinematicOpen(true)}
        tools={tools}
        demonstrations={demonstrations}
        auditEvents={auditEvents}
        authorizations={authorizations}
      />

      {/* 3D Cinematic Judge Experience Modal (Three.js WebGL Film) */}
      <DeputyCinematicExperience
        isOpen={isCinematicOpen}
        onClose={() => setIsCinematicOpen(false)}
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
