import { useState } from 'react';
import { motion } from 'framer-motion';
import { QUIZ_QUESTIONS } from '../lib/examples/quizData';
import { updateQuizScore } from '../lib/storage/storage';
import { useAppStore } from '../hooks/useAppStore';
import { CheckCircle2, XCircle, RotateCcw, HelpCircle, Award } from 'lucide-react';
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '1.5rem', overflowY: 'auto' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="glass-panel"
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-2xl)',
            background: 'linear-gradient(135deg, rgba(21, 29, 46, 0.95) 0%, rgba(13, 18, 32, 0.95) 100%)',
          }}
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: pct >= 70 ? 'rgba(53, 214, 160, 0.15)' : 'rgba(245, 188, 98, 0.15)',
            border: `2px solid ${pct >= 70 ? 'var(--color-success)' : 'var(--color-warning)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: pct >= 70 ? '0 0 24px rgba(53, 214, 160, 0.3)' : '0 0 24px rgba(245, 188, 98, 0.3)',
          }}>
            <Award size={32} color={pct >= 70 ? 'var(--color-success)' : 'var(--color-warning)'} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Assessment Complete!
          </h2>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: pct >= 70 ? 'var(--color-success)' : 'var(--color-warning)',
            letterSpacing: '-0.03em',
            margin: '0.5rem 0',
          }}>
            {score} / {QUIZ_QUESTIONS.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Overall Accuracy: <strong style={{ color: '#FFFFFF' }}>{pct}%</strong>
          </div>

          {/* Breakdown summary */}
          <div style={{
            background: 'rgba(13, 18, 32, 0.6)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-subtle)',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            maxHeight: '220px',
            overflowY: 'auto',
          }}>
            {QUIZ_QUESTIONS.map((q: QuizQuestion, i: number) => {
              const ans = answers[q.id];
              const isQCorrect = ans === q.correctOptionId;
              return (
                <div key={q.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.45rem 0',
                  borderBottom: i < QUIZ_QUESTIONS.length - 1 ? '1px solid var(--color-border-subtle)' : undefined,
                }}>
                  {isQCorrect ? (
                    <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={16} color="var(--color-error)" style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Q{i + 1}: {q.question}
                  </span>
                </div>
              );
            })}
          </div>

          <button className="btn btn-primary" onClick={handleRestart} style={{ width: '100%', padding: '0.75rem' }}>
            <RotateCcw size={16} />
            <span>Retake Knowledge Quiz</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.75rem 1.25rem', height: '100%', overflowY: 'auto' }}>
      {/* Progress & Score Bar */}
      <div className="glass-panel" style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <HelpCircle size={15} color="var(--color-accent-light)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Question {currentQ + 1} of {QUIZ_QUESTIONS.length}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-accent-light)', fontWeight: 800 }}>
            Current Score: {score}
          </span>
        </div>
        <div className="progress-bar" style={{ height: '5px' }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${((currentQ) / QUIZ_QUESTIONS.length) * 100}%`,
              background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-secondary))',
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQ}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="glass-panel"
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(21, 29, 46, 0.95) 0%, rgba(13, 18, 32, 0.9) 100%)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <span className="badge badge-accent">{question.topic}</span>
          <span className="badge badge-muted">{question.type.replace('-', ' ')}</span>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1.5rem', lineHeight: 1.5, letterSpacing: '-0.015em' }}>
          {question.question}
        </h3>

        {/* Option Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
          {question.options.map((opt: QuizOption) => {
            const isSelected = selectedOption === opt.id;
            const isCorrectOpt = submitted && opt.id === question.correctOptionId;
            const isWrongOpt = submitted && isSelected && !isCorrectOpt;

            let border = 'var(--color-border)';
            let bg = 'rgba(13, 18, 32, 0.6)';
            let color = 'var(--color-text)';

            if (isCorrectOpt && submitted) {
              border = 'rgba(53, 214, 160, 0.6)';
              bg = 'rgba(53, 214, 160, 0.15)';
              color = 'var(--color-success)';
            } else if (isWrongOpt) {
              border = 'rgba(255, 100, 124, 0.6)';
              bg = 'rgba(255, 100, 124, 0.15)';
              color = 'var(--color-error)';
            } else if (isSelected) {
              border = 'var(--color-accent)';
              bg = 'rgba(139, 141, 255, 0.18)';
              color = '#FFFFFF';
            }

            return (
              <button
                key={opt.id}
                onClick={() => !submitted && setSelectedOption(opt.id)}
                disabled={submitted}
                style={{
                  padding: '0.9rem 1.15rem',
                  border: `1px solid ${border}`,
                  borderRadius: 'var(--radius-lg)',
                  background: bg,
                  color,
                  textAlign: 'left',
                  cursor: submitted ? 'default' : 'pointer',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: isSelected ? '0 0 16px rgba(139, 141, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)' : 'var(--gloss-highlight-subtle)',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {submitted && isCorrectOpt && <CheckCircle2 size={14} color="var(--color-success)" />}
                  {submitted && isWrongOpt && <XCircle size={14} color="var(--color-error)" />}
                  {!submitted && isSelected && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)' }} />
                  )}
                </div>
                <span style={{ fontWeight: isSelected ? 600 : 500 }}>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation Card */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: isCorrect ? 'rgba(53, 214, 160, 0.1)' : 'rgba(255, 100, 124, 0.1)',
              border: `1px solid ${isCorrect ? 'rgba(53, 214, 160, 0.35)' : 'rgba(255, 100, 124, 0.35)'}`,
              marginBottom: '1.5rem',
              boxShadow: 'var(--gloss-highlight-subtle)',
            }}
          >
            <div style={{
              fontWeight: 800,
              color: isCorrect ? 'var(--color-success)' : 'var(--color-error)',
              marginBottom: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.92rem',
            }}>
              {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{isCorrect ? 'Correct Analysis!' : 'Incorrect Analysis'}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
              {question.explanation}
            </div>
          </motion.div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!submitted ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!selectedOption}
              style={{ flex: 1, padding: '0.7rem' }}
            >
              <span>Confirm & Check Answer</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1, padding: '0.7rem' }}>
              <span>{currentQ + 1 < QUIZ_QUESTIONS.length ? 'Next Question →' : 'View Results'}</span>
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleRestart} style={{ padding: '0.7rem 1.15rem' }}>
            <RotateCcw size={14} />
            <span>Restart</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
