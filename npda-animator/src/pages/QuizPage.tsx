import { useState } from 'react';
import { motion } from 'framer-motion';
import { QUIZ_QUESTIONS } from '../lib/examples/quizData';
import { updateQuizScore } from '../lib/storage/storage';
import { useAppStore } from '../hooks/useAppStore';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { QuizQuestion, QuizOption } from '../types/pda';

export function QuizPage() {
  const { refreshProgress } = useAppStore();
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const question = QUIZ_QUESTIONS[currentQ];
  const isCorrect = submitted && selectedOption === question.correctOptionId;

  function handleSubmit() {
    if (!selectedOption) return;
    const correct = selectedOption === question.correctOptionId;
    setSubmitted(true);
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => ({ ...a, [question.id]: selectedOption }));
  }

  function handleNext() {
    if (currentQ + 1 >= QUIZ_QUESTIONS.length) {
      setFinished(true);
      updateQuizScore(score, QUIZ_QUESTIONS.length);
      refreshProgress();
    } else {
      setCurrentQ((q) => q + 1);
      setSelectedOption(null);
      setSubmitted(false);
    }
  }

  function handleRestart() {
    setCurrentQ(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScore(0);
    setAnswers({});
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📚'}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Quiz Complete!
          </h2>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: pct >= 70 ? 'var(--color-success)' : 'var(--color-warning)', marginBottom: '0.5rem' }}>
            {score} / {QUIZ_QUESTIONS.length}
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            {pct}% correct
          </div>
          <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            {QUIZ_QUESTIONS.map((q: QuizQuestion, i: number) => {
              const ans = answers[q.id];
              const correct = ans === q.correctOptionId;
              return (
                <div key={q.id} style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 0', borderBottom: i < QUIZ_QUESTIONS.length - 1 ? '1px solid var(--color-border)' : undefined }}>
                  {correct ? <CheckCircle2 size={16} color="var(--color-success)" /> : <XCircle size={16} color="var(--color-error)" />}
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{q.question.slice(0, 60)}…</span>
                </div>
              );
            })}
          </div>
          <button className="btn btn-primary" onClick={handleRestart} style={{ width: '100%' }}>
            <RotateCcw size={16} /> Restart Quiz
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
      {/* Progress */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Question {currentQ + 1} of {QUIZ_QUESTIONS.length}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-accent-light)', fontWeight: 600 }}>
            Score: {score}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${((currentQ) / QUIZ_QUESTIONS.length) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span className="badge badge-accent">{question.topic}</span>
          <span style={{ marginLeft: '0.5rem' }} className="badge badge-muted">{question.type.replace('-', ' ')}</span>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          {question.question}
        </h3>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {question.options.map((opt: QuizOption) => {
            const isSelected = selectedOption === opt.id;
            const isCorrectOpt = submitted && opt.id === question.correctOptionId;
            const isWrongOpt = submitted && isSelected && !isCorrectOpt;

            let border = 'var(--color-border)';
            let bg = 'var(--color-surface)';
            let color = 'var(--color-text)';

            if (isCorrectOpt && submitted) { border = 'var(--color-success)'; bg = 'rgba(16,185,129,0.12)'; color = 'var(--color-success)'; }
            else if (isWrongOpt) { border = 'var(--color-error)'; bg = 'rgba(239,68,68,0.12)'; color = 'var(--color-error)'; }
            else if (isSelected) { border = 'var(--color-accent)'; bg = 'rgba(99,102,241,0.12)'; }

            return (
              <button
                key={opt.id}
                onClick={() => !submitted && setSelectedOption(opt.id)}
                disabled={submitted}
                style={{
                  padding: '0.75rem 1rem',
                  border: `2px solid ${border}`,
                  borderRadius: 'var(--radius-md)',
                  background: bg,
                  color,
                  textAlign: 'left',
                  cursor: submitted ? 'default' : 'pointer',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {submitted && isCorrectOpt && <CheckCircle2 size={16} />}
                {submitted && isWrongOpt && <XCircle size={16} />}
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontWeight: 700, color: isCorrect ? 'var(--color-success)' : 'var(--color-error)', marginBottom: '0.4rem' }}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
              {question.explanation}
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!submitted ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!selectedOption}
              style={{ flex: 1 }}
            >
              Submit Answer
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1 }}>
              {currentQ + 1 < QUIZ_QUESTIONS.length ? 'Next Question →' : 'See Results'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleRestart}>
            <RotateCcw size={14} /> Restart
          </button>
        </div>
      </motion.div>
    </div>
  );
}
