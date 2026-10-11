# N-PDA Animator

**An Interactive Deterministic Pushdown Automaton Simulation & Language Recognition Educational Tool**

---

## 📖 Overview

**N-PDA Animator** is a modern, responsive web application for exploring **Deterministic Pushdown Automata (DPDA)**. Built for computer science students, educators, and theoretical computer science enthusiasts, it bridges formal language theory with interactive, visual computation.

---

## ✨ Features

- **Interactive PDA Simulator**:
  - Live animated SVG state diagram with zoom, pan, and active-transition glow.
  - Animated stack visualization using Framer Motion (showing push/pop dynamics and stack top indicator).
  - Animated input tape highlighting consumed, active, and remaining symbols.
  - Complete execution trace table showing formal mathematical configurations $\delta(q, a, X) = (p, \gamma)$ with bidirectional step navigation.
  - Step forward, step backward, run-to-completion, speed controls (Slow, Normal, Fast, Very Fast), and pause/resume.
  - Dual explanations: Beginner-friendly intuitive descriptions and technical mathematical definitions.
- **Built-in Automaton Library**:
  - **Balanced Parentheses**: $\{ w \in \{(,)\}^* \mid w \text{ is balanced} \}$ with bottom marker $B$.
  - **$a^n b^n$ Language**: $\{ a^n b^n \mid n \ge 0 \}$ demonstrating counting and memory with stack matching.
  - **Marked Palindromes**: $\{ w c w^R \mid w \in \{a,b\}^* \}$ showcasing DPDA-recognizable palindromes with center marker $c$.
- **Automaton Builder & Validator**:
  - Create custom states, transitions, alphabets, and start/accepting states.
  - Built-in **DPDA Determinism Validator**: detects nondeterministic conflicts ($\delta(q, a, X)$ duplicates and $\epsilon$-transition conflicts).
  - Save custom automata to browser LocalStorage and immediately load them into the simulator.
- **Playground / Batch Tester**:
  - Test batches of input strings simultaneously.
  - Instant classification (Accepted vs Rejected, step count, termination status).
  - One-click export to CSV and direct load into the interactive simulator.
- **Interactive Theory Hub**:
  - 13 structured chapters covering Formal Definition, Instantaneous Descriptions (IDs), DCFLs vs CFLs, Pumping Lemma for CFLs, and Equivalence theorems.
  - Real-time reading progress tracking stored locally.
- **Interactive Knowledge Quiz**:
  - 12 comprehensive multiple-choice and conceptual questions.
  - Immediate feedback with score tracking, percentiles, and answer reviews.
- **Student Dashboard**:
  - Analytics on total simulations performed, test strings processed, quiz scores, and topic completion percentages.
  - Recent simulation history with timestamps and step counts.
- **Premium Design & Accessibility**:
  - Sleek modern dark mode and light mode with curated color palette and glassmorphism.
  - Responsive across smartphones (360px+), tablets (768px+), and wide desktop monitors (1440px+).

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design System with CSS variables
- **State Management**: Zustand 5
- **Animations**: Framer Motion 14
- **Icons**: Lucide React
- **Testing**: Vitest 4

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` (comes with Node.js)

### Installation

```bash
cd npda-animator
npm install
```

### Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Run Unit Tests

```bash
npm test
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
npda-animator/
├── src/
│   ├── components/
│   │   ├── automaton/          # SVG interactive automaton state diagram
│   │   ├── execution-trace/    # Step-by-step trace table & formal delta notation
│   │   ├── input-tape/         # Animated input tape read head
│   │   ├── layout/             # Sidebar navigation & mobile navigation bar
│   │   └── stack/              # Framer Motion animated push/pop stack
│   ├── hooks/
│   │   └── useAppStore.ts      # Global Zustand application state
│   ├── lib/
│   │   ├── automaton-validator/# DPDA determinism and soundness validator
│   │   ├── examples/           # Built-in automata & quiz question repository
│   │   ├── simulation-engine/  # Core PDA simulation engine (PDASimulator)
│   │   └── storage/            # LocalStorage persistence layer
│   ├── pages/
│   │   ├── BuilderPage.tsx     # Custom automaton designer
│   │   ├── DashboardPage.tsx   # Student progress & analytics
│   │   ├── ExamplesPage.tsx    # Interactive catalog of automata
│   │   ├── HomePage.tsx         # Landing page with animated hero demo
│   │   ├── PlaygroundPage.tsx  # Batch string test suite with CSV export
│   │   ├── QuizPage.tsx        # Self-assessment quiz
│   │   ├── SimulatorPage.tsx   # Three-panel interactive simulator
│   │   └── TheoryPage.tsx      # Theoretical foundations & accordion guide
│   ├── tests/
│   │   └── pdaEngine.test.ts   # Vitest unit test suite (12 tests)
│   ├── types/
│   │   └── pda.ts              # Formal TypeScript type definitions
│   ├── App.tsx                 # Root component with routing transitions
│   ├── index.css               # Design system & CSS custom properties
│   └── main.tsx                # Application entry point
├── index.html                  # HTML entry point with responsive CSS
├── package.json                # Project dependencies and scripts
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite configuration with React & Tailwind plugins
```

---

## 🧪 Simulation Engine Specifications

- **Deterministic Transition Resolution**: Enforces at most one applicable transition for any $(q, a, X)$ or $(q, \epsilon, X)$.
- **Configuration Representation**: $(q, w, \gamma)$ where $q \in Q$ is current state, $w \in \Sigma^*$ is unconsumed tape input, and $\gamma \in \Gamma^*$ is stack contents with rightmost element representing the stack top.
- **Acceptance Criteria**: Supports both **Final State Acceptance** ($L(M)$) and **Empty Stack Acceptance** ($N(M)$).
- **Infinite Epsilon Loop Guard**: Detects cyclical $\epsilon$-transitions without progress to prevent browser freezing.
