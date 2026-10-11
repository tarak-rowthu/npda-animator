import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Play, BookOpen, FlaskConical, Layers, PenTool,
  BarChart3, HelpCircle, Home, Sun, Moon, ChevronRight,
  GitBranch, Activity, ShieldCheck
} from 'lucide-react';
import { useAppStore, type AppPage } from '../../hooks/useAppStore';

interface NavItem {
  id: AppPage;
  label: string;
  icon: ReactNode;
  description: string;
  category: 'core' | 'learn';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',       label: 'Home',       icon: <Home size={16} strokeWidth={2.2} />,         description: 'Academic overview & quick tour', category: 'core' },
  { id: 'simulator',  label: 'Simulator',  icon: <Play size={16} strokeWidth={2.2} />,         description: 'Interactive deterministic PDA execution', category: 'core' },
  { id: 'builder',    label: 'Automaton Builder', icon: <PenTool size={16} strokeWidth={2.2} />, description: 'Formal state & transition editor', category: 'core' },
  { id: 'examples',   label: 'PDA Examples', icon: <FlaskConical size={16} strokeWidth={2.2} />, description: 'Canonical context-free languages', category: 'core' },
  { id: 'playground', label: 'Test Playground', icon: <Layers size={16} strokeWidth={2.2} />,    description: 'Multi-string batch verification', category: 'core' },
  { id: 'theory',     label: 'PDA Theory', icon: <BookOpen size={16} strokeWidth={2.2} />,     description: 'Mathematical definitions & theorems', category: 'learn' },
  { id: 'quiz',       label: 'Knowledge Quiz', icon: <HelpCircle size={16} strokeWidth={2.2} />, description: 'Self-assessment & conceptual tests', category: 'learn' },
  { id: 'dashboard',  label: 'Lab Dashboard', icon: <BarChart3 size={16} strokeWidth={2.2} />,   description: 'Simulation history & mastery metrics', category: 'learn' },
];

export function Sidebar() {
  const { currentPage, theme, setPage, toggleTheme, progress, sim } = useAppStore();

  const coreItems = NAV_ITEMS.filter((i) => i.category === 'core');
  const learnItems = NAV_ITEMS.filter((i) => i.category === 'learn');

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Brand & Logo Container */}
      <div style={{
        padding: '1.15rem 1.15rem 1rem',
        borderBottom: '1px solid var(--color-border)',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            background: 'linear-gradient(135deg, #8B8DFF 0%, #55C7F5 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(139, 141, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            flexShrink: 0,
          }}>
            <GitBranch size={20} color="#080B14" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: '0.92rem',
              color: 'var(--color-text)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <span>N-PDA</span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--color-accent)',
                background: 'rgba(139, 141, 255, 0.15)',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                border: '1px solid rgba(139, 141, 255, 0.25)',
              }}>LAB</span>
            </div>
            <div style={{
              fontSize: '0.68rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.01em',
              marginTop: '0.1rem',
            }}>
              Automaton Animator
            </div>
          </div>
        </div>
      </div>

      {/* Nav Links Container */}
      <div style={{ padding: '0.75rem 0.65rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Core Simulation Section */}
        <div>
          <div style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: 'var(--color-text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            padding: '0 0.5rem 0.35rem',
          }}>
            Simulation & Tools
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {coreItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-link ${active ? 'active' : ''}`}
                  onClick={() => setPage(item.id)}
                  aria-current={active ? 'page' : undefined}
                  title={item.description}
                  style={{ width: '100%', position: 'relative' }}
                >
                  <span style={{ color: active ? 'var(--color-accent-light)' : 'inherit', display: 'flex' }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: active ? 600 : 500 }}>
                    {item.label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="nav-chevron"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      style={{ display: 'flex', color: 'var(--color-accent-light)' }}
                    >
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Learning & Mastery Section */}
        <div>
          <div style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            color: 'var(--color-text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            padding: '0 0.5rem 0.35rem',
          }}>
            Theory & Mastery
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {learnItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-link ${active ? 'active' : ''}`}
                  onClick={() => setPage(item.id)}
                  aria-current={active ? 'page' : undefined}
                  title={item.description}
                  style={{ width: '100%', position: 'relative' }}
                >
                  <span style={{ color: active ? 'var(--color-accent-light)' : 'inherit', display: 'flex' }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: active ? 600 : 500 }}>
                    {item.label}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="nav-chevron"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      style={{ display: 'flex', color: 'var(--color-accent-light)' }}
                    >
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Model Quick-Pill */}
      <div style={{ padding: '0 0.75rem 0.5rem' }}>
        <div style={{
          padding: '0.55rem 0.75rem',
          background: 'rgba(21, 29, 46, 0.6)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--gloss-highlight-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Current Model
            </span>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 6px var(--color-success)' }} />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sim.pda.name}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div style={{
        padding: '0.85rem 0.95rem',
        borderTop: '1px solid var(--color-border)',
        background: 'rgba(8, 11, 20, 0.4)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={13} color="var(--color-accent)" />
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Runs: <strong style={{ color: 'var(--color-text)' }}>{progress.simulationsPerformed}</strong>
            </span>
          </div>
          <button
            className="btn btn-ghost"
            style={{ padding: '0.3rem', borderRadius: '6px' }}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={15} color="var(--color-warning)" /> : <Moon size={15} color="var(--color-accent)" />}
          </button>
        </div>

        {progress.quizQuestionsAnswered > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-dim)', marginBottom: '0.2rem' }}>
              <span>Quiz Mastery</span>
              <span>{Math.round((progress.quizScore / progress.quizQuestionsAnswered) * 100)}%</span>
            </div>
            <div className="progress-bar" style={{ height: '3px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.round((progress.quizScore / progress.quizQuestionsAnswered) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--color-accent), var(--color-success))',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export function TopBar() {
  const { currentPage, sim, setPage } = useAppStore();

  const titleMap: Record<AppPage, { title: string; subtitle: string }> = {
    home:       { title: 'Deterministic PDA Animator', subtitle: 'Pushdown Automaton Simulation and Language Recognition Laboratory' },
    simulator:  { title: 'Interactive Simulation Workspace', subtitle: 'Step-by-step state, tape read head, and LIFO stack execution' },
    builder:    { title: 'Automaton Design Suite', subtitle: 'Interactive state editor, deterministic transition rules, and validation' },
    examples:   { title: 'Automata Gallery', subtitle: 'Pre-configured formal PDAs for classical context-free languages' },
    playground: { title: 'Batch Verification Playground', subtitle: 'Evaluate test string suites against current PDA simultaneously' },
    theory:     { title: 'Formal Theory & Definitions', subtitle: 'Mathematical foundations, 7-tuple specifications, and transition semantics' },
    quiz:       { title: 'Conceptual Self-Assessment', subtitle: 'Test your understanding of pushdown automata and language recognition' },
    dashboard:  { title: 'Lab Performance Dashboard', subtitle: 'Usage statistics, mastery benchmarks, and simulation logs' },
  };

  const meta = titleMap[currentPage] ?? titleMap.home;

  return (
    <header style={{
      padding: '0.75rem 1.25rem',
      borderBottom: '1px solid var(--color-border)',
      background: 'rgba(13, 18, 32, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: 'var(--gloss-highlight-subtle), 0 4px 20px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'nowrap',
      zIndex: 30,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h1 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--color-text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.02em',
          }}>
            {meta.title}
          </h1>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--color-accent-light)',
            background: 'var(--color-accent-dim)',
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            border: '1px solid rgba(139, 141, 255, 0.25)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}>
            <ShieldCheck size={11} /> DPDA
          </span>
        </div>
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginTop: '0.1rem',
        }}>
          {meta.subtitle}
        </p>
      </div>

      {/* Quick contextual actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {currentPage !== 'simulator' && (
          <button
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => setPage('simulator')}
          >
            <Play size={13} />
            <span>Launch Simulator</span>
          </button>
        )}
        {currentPage !== 'theory' && (
          <button
            className="btn btn-secondary hide-xs"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => setPage('theory')}
          >
            <BookOpen size={13} />
            <span>Theory</span>
          </button>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.65rem',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-info)' }} />
          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--color-text)' }}>
            {sim.pda.name}
          </span>
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const { currentPage, setPage } = useAppStore();
  const mobileItems = NAV_ITEMS.slice(0, 5);

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(13, 18, 32, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        display: 'flex',
        zIndex: 100,
        padding: '0.35rem 0.25rem calc(0.35rem + env(safe-area-inset-bottom))',
      }}
      aria-label="Mobile navigation"
    >
      {mobileItems.map((item) => {
        const active = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0.35rem 0',
              background: active ? 'rgba(139, 141, 255, 0.12)' : 'transparent',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
              fontSize: '0.62rem',
              fontWeight: active ? 700 : 500,
              transition: 'all 0.15s ease',
            }}
            aria-current={active ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
