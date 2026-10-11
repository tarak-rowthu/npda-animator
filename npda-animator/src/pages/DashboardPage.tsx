import { motion } from 'framer-motion';
import { useAppStore } from '../hooks/useAppStore';
import { Clock, BookOpen, HelpCircle, Play, Layers } from 'lucide-react';
import type { SimulationRecord } from '../types/pda';

export function DashboardPage() {
  const { progress, setPage } = useAppStore();

  const quizPct = progress.quizQuestionsAnswered > 0
    ? Math.round((progress.quizScore / progress.quizQuestionsAnswered) * 100)
    : 0;

  const topicsTotal = 13;
  const topicsCompleted = Object.values(progress.learningProgress).filter(Boolean).length;

  const stats = [
    { label: 'Simulations Run', value: progress.simulationsPerformed, icon: <Play size={20} />, color: 'var(--color-accent-light)' },
    { label: 'Strings Tested', value: progress.stringsTested, icon: <Layers size={20} />, color: 'var(--color-info)' },
    { label: 'Quiz Score', value: `${progress.quizScore}/${progress.quizQuestionsAnswered}`, icon: <HelpCircle size={20} />, color: 'var(--color-success)' },
    { label: 'Topics Read', value: `${topicsCompleted}/${topicsTotal}`, icon: <BookOpen size={20} />, color: 'var(--color-warning)' },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Your learning progress and usage statistics. Stored locally in your browser.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card"
            style={{ padding: '1rem', textAlign: 'center' }}
          >
            <div style={{ color: stat.color, marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress bars */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Learning Progress</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
              <span>Theory Topics</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{topicsCompleted}/{topicsTotal}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${(topicsCompleted / topicsTotal) * 100}%` }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
              <span>Quiz Performance</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{quizPct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{
                width: `${quizPct}%`,
                background: quizPct >= 80 ? 'var(--color-success)' : quizPct >= 60 ? 'var(--color-warning)' : 'var(--color-error)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent simulations */}
      <div className="card" style={{ padding: 0, marginBottom: '1.25rem' }}>
        <div className="panel-header">
          <Clock size={14} />
          <span>Recent Simulations</span>
        </div>
        {progress.recentSimulations.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            No simulations yet. <button className="btn btn-ghost" style={{ padding: '0.1rem 0.4rem', fontSize: '0.85rem' }} onClick={() => setPage('simulator')}>Open Simulator →</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="trace-table">
              <thead>
                <tr>
                  <th>Automaton</th>
                  <th>Input</th>
                  <th>Result</th>
                  <th>Steps</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {progress.recentSimulations.slice(0, 10).map((rec: SimulationRecord) => (
                  <tr key={rec.id}>
                    <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.pdaName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rec.inputString === '' ? 'ε' : rec.inputString}
                    </td>
                    <td style={{ color: rec.result === 'accepted' ? 'var(--color-success)' : rec.result === 'rejected' ? 'var(--color-error)' : 'var(--color-warning)', fontWeight: 600 }}>
                      {rec.result.toUpperCase()}
                    </td>
                    <td>{rec.stepCount}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      {new Date(rec.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
        {[
          { label: 'Open Simulator', icon: <Play size={15} />, page: 'simulator' as const },
          { label: 'Take Quiz', icon: <HelpCircle size={15} />, page: 'quiz' as const },
          { label: 'Browse Theory', icon: <BookOpen size={15} />, page: 'theory' as const },
          { label: 'Test Strings', icon: <Layers size={15} />, page: 'playground' as const },
        ].map((item) => (
          <button key={item.label} className="btn btn-secondary" onClick={() => setPage(item.page)}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
