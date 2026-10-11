import { motion } from 'framer-motion';
import { useAppStore } from '../hooks/useAppStore';
import { Clock, BookOpen, HelpCircle, Play, Layers, Activity, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import type { SimulationRecord } from '../types/pda';

export function DashboardPage() {
  const { progress, setPage } = useAppStore();

  const quizPct = progress.quizQuestionsAnswered > 0
    ? Math.round((progress.quizScore / progress.quizQuestionsAnswered) * 100)
    : 0;

  const topicsTotal = 13;
  const topicsCompleted = Object.values(progress.learningProgress).filter(Boolean).length;

  const stats = [
    { label: 'Simulations Executed', value: progress.simulationsPerformed, icon: <Play size={20} />, color: 'var(--color-accent-light)' },
    { label: 'Strings Tested', value: progress.stringsTested, icon: <Layers size={20} />, color: 'var(--color-accent-secondary)' },
    { label: 'Quiz Score Record', value: `${progress.quizScore}/${progress.quizQuestionsAnswered}`, icon: <HelpCircle size={20} />, color: 'var(--color-success)' },
    { label: 'Theory Topics Read', value: `${topicsCompleted}/${topicsTotal}`, icon: <BookOpen size={20} />, color: 'var(--color-warning)' },
  ];

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '1.75rem 1.25rem', overflowY: 'auto', height: '100%' }}>
      {/* Glossy Header Card */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(21, 29, 46, 0.95) 0%, rgba(13, 18, 32, 0.9) 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Activity size={18} color="var(--color-accent-light)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Laboratory Overview
          </span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
          Learning Progress & Metrics
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', maxWidth: '640px' }}>
          Track simulation activity, verification batches, and mastery across formal automata concepts.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-panel-interactive"
            style={{ padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color,
                boxShadow: 'var(--gloss-highlight-subtle)',
              }}>
                {stat.icon}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Activity
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Bars Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} color="var(--color-accent-light)" />
          <span>Mastery Benchmarks</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.45rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Theory Curriculum Completion</span>
              <span style={{ color: 'var(--color-accent-light)', fontWeight: 700 }}>
                {topicsCompleted} of {topicsTotal} topics ({Math.round((topicsCompleted / topicsTotal) * 100)}%)
              </span>
            </div>
            <div className="progress-bar" style={{ height: '6px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(topicsCompleted / topicsTotal) * 100}%`,
                  background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-secondary))',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.45rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Knowledge Quiz Accuracy</span>
              <span style={{
                color: quizPct >= 70 ? 'var(--color-success)' : quizPct >= 50 ? 'var(--color-warning)' : 'var(--color-text-muted)',
                fontWeight: 700,
              }}>
                {quizPct}% correct
              </span>
            </div>
            <div className="progress-bar" style={{ height: '6px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${quizPct}%`,
                  background: quizPct >= 70 ? 'var(--color-success)' : quizPct >= 50 ? 'var(--color-warning)' : 'var(--color-error)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Simulations Panel */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div className="panel-header" style={{ padding: '0.85rem 1.25rem' }}>
          <Clock size={15} color="var(--color-accent-light)" />
          <span>Recent Execution Trace History</span>
        </div>

        {progress.recentSimulations.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.88rem' }}>
            No simulations logged yet.{' '}
            <button className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', color: 'var(--color-accent-light)' }} onClick={() => setPage('simulator')}>
              Launch Simulator →
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="trace-table">
              <thead>
                <tr>
                  <th>Automaton Model</th>
                  <th>Input String (w)</th>
                  <th>Simulation Result</th>
                  <th>Total Steps</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {progress.recentSimulations.slice(0, 10).map((rec: SimulationRecord) => {
                  const isAccepted = rec.result === 'accepted';
                  return (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{rec.pdaName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {rec.inputString === '' ? 'ε (empty)' : `"${rec.inputString}"`}
                      </td>
                      <td>
                        {isAccepted ? (
                          <span className="badge badge-success">
                            <CheckCircle2 size={11} style={{ marginRight: '0.25rem' }} />
                            ACCEPTED
                          </span>
                        ) : (
                          <span className="badge badge-error">REJECTED</span>
                        )}
                      </td>
                      <td>{rec.stepCount} steps</td>
                      <td style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>
                        {new Date(rec.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Interactive Simulator', icon: <Play size={15} />, page: 'simulator' as const },
          { label: 'Knowledge Quiz', icon: <HelpCircle size={15} />, page: 'quiz' as const },
          { label: 'Formal Theory', icon: <BookOpen size={15} />, page: 'theory' as const },
          { label: 'Batch Playground', icon: <Layers size={15} />, page: 'playground' as const },
        ].map((item) => (
          <button
            key={item.label}
            className="btn btn-secondary"
            onClick={() => setPage(item.page)}
            style={{ padding: '0.75rem 1rem', justifyContent: 'flex-start' }}
          >
            {item.icon}
            <span>{item.label}</span>
            <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
