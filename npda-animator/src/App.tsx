import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './hooks/useAppStore';
import { Sidebar, MobileNav } from './components/layout/Navigation';
import { HomePage } from './pages/HomePage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ExamplesPage } from './pages/ExamplesPage';
import { TheoryPage } from './pages/TheoryPage';
import { QuizPage } from './pages/QuizPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { DashboardPage } from './pages/DashboardPage';
import { BuilderPage } from './pages/BuilderPage';

function PageContent() {
  const { currentPage } = useAppStore();

  const pageMap: Record<string, React.ReactNode> = {
    home: <HomePage />,
    simulator: <SimulatorPage />,
    builder: <BuilderPage />,
    examples: <ExamplesPage />,
    playground: <PlaygroundPage />,
    theory: <TheoryPage />,
    quiz: <QuizPage />,
    dashboard: <DashboardPage />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {pageMap[currentPage] ?? <HomePage />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const { theme } = useAppStore();

  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      {/* Sidebar — hidden on mobile */}
      <div className="hide-mobile" style={{ display: 'flex' }}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <main
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        id="main-content"
        tabIndex={-1}
      >
        <PageContent />
      </main>

      {/* Mobile bottom nav */}
      <div className="show-mobile">
        <MobileNav />
      </div>
    </div>
  );
}
