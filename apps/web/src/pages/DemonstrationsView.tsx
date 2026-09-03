import React from 'react';
import { Demonstration } from '@deputy/domain';
import { Sparkles } from 'lucide-react';

interface DemonstrationsViewProps {
  demonstrations: Demonstration[];
}

export const DemonstrationsView: React.FC<DemonstrationsViewProps> = ({ demonstrations }) => {
  return (
    <div className="page-body">
      <div className="page-header">
        <h2 className="page-title">Demonstrations & Semantic Traces</h2>
        <p className="page-description">
          Empirical evidence recorded from human application tasks. DEPUTY extracts high-level
          semantic commands rather than raw DOM cursor clicks.
        </p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <h3 className="panel-title">Invariant 1: No DOM Macros</h3>
          </div>
        </div>
        <div style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          DEPUTY observes structured semantic calls (e.g. <code>refund.create</code> with validated
          arguments) rather than fragile pixel coordinates or DOM click selectors. Tools bind
          directly to trusted backend actions.
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Recorded Task Traces</h3>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Demonstration ID</th>
              <th>Status</th>
              <th>Actor</th>
              <th>Actions Observed</th>
              <th>Environment</th>
              <th>Started At</th>
            </tr>
          </thead>
          <tbody>
            {demonstrations.map(demo => (
              <tr key={demo.demonstrationId}>
                <td>
                  <div className="mono" style={{ fontWeight: 600, color: '#fff' }}>
                    {demo.demonstrationId}
                  </div>
                  <div className="mono" style={{ color: 'var(--text-muted)' }}>
                    {demo.sessionId}
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${demo.status.toLowerCase()}`}>{demo.status}</span>
                </td>
                <td>{demo.actorId}</td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {demo.actions.length} action(s)
                  </span>
                </td>
                <td>{demo.applicationContext.environment}</td>
                <td>{new Date(demo.startedAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {demonstrations.length > 0 && demonstrations[0]?.actions && (
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Trace Sample: {demonstrations[0].demonstrationId}</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <pre className="code-block">{JSON.stringify(demonstrations[0].actions, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
