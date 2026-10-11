import type { ReactNode } from 'react';
import {
  Play, BookOpen, FlaskConical, Layers, PenTool,
  BarChart3, HelpCircle, Home, Sun, Moon, ChevronRight, GitBranch
} from 'lucide-react';
import { useAppStore, type AppPage } from '../../hooks/useAppStore';

interface NavItem {
  id: AppPage;
  label: string;
  icon: ReactNode;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',       label: 'Home',       icon: <Home size={16} />,         description: 'Landing page' },
  { id: 'simulator',  label: 'Simulator',  icon: <Play size={16} />,         description: 'Interactive PDA simulation' },
  { id: 'builder',    label: 'Builder',    icon: <PenTool size={16} />,      description: 'Design your own automaton' },
  { id: 'examples',   label: 'Examples',   icon: <FlaskConical size={16} />, description: 'Built-in example automata' },
  { id: 'playground', label: 'Playground', icon: <Layers size={16} />,       description: 'Test multiple strings' },
  { id: 'theory',     label: 'Theory',     icon: <BookOpen size={16} />,     description: 'Learn PDA concepts' },
  { id: 'quiz',       label: 'Quiz',       icon: <HelpCircle size={16} />,   description: 'Test your knowledge' },
  { id: 'dashboard',  label: 'Dashboard',  icon: <BarChart3 size={16} />,    description: 'Your progress' },
];

export function Sidebar() {
  const { currentPage, theme, setPage, toggleTheme, progress } = useAppStore();

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GitBranch size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>N-PDA Animator</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>PDA Simulator</div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ padding: '0.5rem', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
            style={{ width: '100%', marginBottom: '0.125rem' }}
            onClick={() => setPage(item.id)}
            aria-current={currentPage === item.id ? 'page' : undefined}
            title={item.description}
          >
            {item.icon}
            <span>{item.label}</span>
            {currentPage === item.id && (
              <ChevronRight size={12} style={{ marginLeft: 'auto' }} />
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Simulations: <strong>{progress.simulationsPerformed}</strong>
          </span>
          <button
            className="btn btn-ghost"
            style={{ padding: '0.25rem' }}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        {progress.quizQuestionsAnswered > 0 && (
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.round((progress.quizScore / progress.quizQuestionsAnswered) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </nav>
  );
}

export function MobileNav() {
  const { currentPage, setPage } = useAppStore();
  const mobileItems = NAV_ITEMS.slice(0, 5); // Show first 5 in mobile bottom bar

  return (
    <nav
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        zIndex: 100,
        padding: '0.25rem 0',
      }}
      aria-label="Mobile navigation"
    >
      {mobileItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setPage(item.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '0.4rem 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: currentPage === item.id ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
            fontSize: '0.6rem',
            fontWeight: 500,
            transition: 'color 0.15s ease',
          }}
          aria-current={currentPage === item.id ? 'page' : undefined}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}
