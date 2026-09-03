import React, { useEffect, useState } from 'react';
import { AuditEvent, Demonstration, LearnedTool } from '@deputy/domain';
import { ActiveRecordingState, RecordingBar } from './components/RecordingBar.js';
import { ActiveTab, Sidebar } from './components/Sidebar.js';
import { WebMcpBanner } from './components/WebMcpBanner.js';
import { AuditView } from './pages/AuditView.js';
import { DashboardView } from './pages/DashboardView.js';
import { DemonstrationsView } from './pages/DemonstrationsView.js';
import { OperationsConsoleView } from './pages/OperationsConsoleView.js';
import { SecurityView } from './pages/SecurityView.js';
import { SettingsView } from './pages/SettingsView.js';
import { SynthesisStudioView } from './pages/SynthesisStudioView.js';
import { ToolsView } from './pages/ToolsView.js';
import { AgentEyeView } from './pages/AgentEyeView.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [tools, setTools] = useState<LearnedTool[]>([]);
  const [demonstrations, setDemonstrations] = useState<Demonstration[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Active recording session
  const [recording, setRecording] = useState<ActiveRecordingState | null>(null);

  const fetchData = async () => {
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
    } catch (err) {
      console.warn('Backend connection notice: Falling back to local offline preview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        });
        setActiveTab('operations');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const handlePauseRecording = async () => {
    if (!recording) return;
    try {
      await fetch(
        `/api/demonstrations/${recording.demonstrationId}/recording/pause`,
        {
          method: 'POST',
        },
      );
      setRecording(prev => (prev ? { ...prev, status: 'PAUSED' } : null));
    } catch (err) {
      console.error('Failed to pause recording', err);
    }
  };

  const handleResumeRecording = async () => {
    if (!recording) return;
    try {
      await fetch(
        `/api/demonstrations/${recording.demonstrationId}/recording/resume`,
        {
          method: 'POST',
        },
      );
      setRecording(prev => (prev ? { ...prev, status: 'RECORDING' } : null));
    } catch (err) {
      console.error('Failed to resume recording', err);
    }
  };

  const handleCompleteRecording = async () => {
    if (!recording) return;
    try {
      await fetch(
        `/api/demonstrations/${recording.demonstrationId}/recording/complete`,
        {
          method: 'POST',
        },
      );
      setRecording(null);
      await fetchData();
      setActiveTab('synthesis');
    } catch (err) {
      console.error('Failed to complete recording', err);
    }
  };

  const handleDiscardRecording = async () => {
    if (!recording) return;
    try {
      await fetch(
        `/api/demonstrations/${recording.demonstrationId}/recording/discard`,
        {
          method: 'POST',
        },
      );
      setRecording(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to discard recording', err);
    }
  };

  const handleActionObserved = (actionType: string, summary: string) => {
    if (!recording) return;
    setRecording(prev =>
      prev
        ? {
            ...prev,
            actionCount: prev.actionCount + 1,
            lastAction: { actionType, summary },
          }
        : null,
    );
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} isRecording={!!recording} />

      <main
        className="main-layout"
        style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}
      >
        <RecordingBar
          recording={recording}
          onStart={handleStartRecording}
          onPause={handlePauseRecording}
          onResume={handleResumeRecording}
          onComplete={handleCompleteRecording}
          onDiscard={handleDiscardRecording}
        />

        <div style={{ padding: '24px 36px', flex: 1 }}>
          <WebMcpBanner />
          {loading && (
            <div style={{ padding: '8px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Synchronizing WebMCP state...
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              toolCount={tools.length}
              demonstrationCount={demonstrations.length}
              auditCount={auditEvents.length}
            />
          )}

          {activeTab === 'operations' && (
            <OperationsConsoleView recording={recording} onActionObserved={handleActionObserved} />
          )}

          {activeTab === 'synthesis' && (
            <SynthesisStudioView
              onToolApproved={async () => {
                await fetchData();
                setActiveTab('tools');
              }}
            />
          )}

          {activeTab === 'tools' && <ToolsView tools={tools} onRefresh={fetchData} />}

          {activeTab === 'agent' && <AgentEyeView tools={tools} />}

          {activeTab === 'demonstrations' && <DemonstrationsView demonstrations={demonstrations} />}

          {activeTab === 'audit' && <AuditView events={auditEvents} onRefresh={fetchData} />}

          {activeTab === 'security' && <SecurityView />}

          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
};
