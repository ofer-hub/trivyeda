import { useEffect, useState } from 'react';
import { AnswerButton } from '../components/AnswerButton';
import { getEncouragement } from '../services/encouragements';
import type { Game } from '../types/game';
import './RevealScreen.css';

interface RevealScreenProps {
  game: Game;
  currentUserId: string;
  onNext: () => void;
  isLastQuestion: boolean;
  isHost: boolean;
  autoAdvance: boolean;
  onStopGame: () => void;
}

export function RevealScreen({
  game,
  currentUserId,
  onNext,
  isLastQuestion,
  isHost,
  autoAdvance,
  onStopGame,
}: RevealScreenProps) {
  const question = game.questions[game.currentQuestionIndex];
  const myParticipant = game.participants[currentUserId];
  const myAnswer = myParticipant?.lastAnswer;

  // מחושב פעם אחת עם mount — הנתונים יציבים בשלב החשיפה
  const [encouragement] = useState<string>(() => {
    if (isHost || !myParticipant) return '';
    let result: 'correct' | 'wrong' | 'no_answer';
    if (!myAnswer || myAnswer.answerIndex === null) result = 'no_answer';
    else if (myAnswer.isCorrect) result = 'correct';
    else result = 'wrong';
    return getEncouragement(result, myParticipant.nickname);
  });
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!autoAdvance) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          onNext();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoAdvance, onNext]);

  function getButtonState(index: number) {
    if (index === question.correctIndex) return 'correct';
    if (myAnswer?.answerIndex === index) return 'wrong';
    return 'dimmed';
  }

  const nonHostParticipants = Object.values(game.participants).filter((p) => !p.isHost);
  const correctCount = nonHostParticipants.filter((p) => p.lastAnswer?.isCorrect).length;
  const totalNonHost = nonHostParticipants.length;

  return (
    <div className="reveal-screen">
      <div className="reveal-topbar">
        <span className="reveal-question-num">
          שאלה {game.currentQuestionIndex + 1}/{game.questions.length}
        </span>
        {autoAdvance && countdown > 0 && (
          <span className="reveal-countdown">📊 דירוג בעוד {countdown}...</span>
        )}
      </div>

      <div className="reveal-body">
        <div className="reveal-question-card">
          <p className="reveal-question-text">{question.question}</p>
        </div>

        <div className="answers-grid">
          {question.answers.map((answer, index) => (
            <AnswerButton
              key={index}
              index={index}
              text={answer}
              state={getButtonState(index)}
              disabled
              onClick={() => {}}
            />
          ))}
        </div>

        <div className="reveal-explanation">
          <span className="reveal-explanation__icon">💡</span>
          <p className="reveal-explanation__text">{question.explanation}</p>
        </div>

        <div className="reveal-stats">
          <div className="stat-card stat-card--correct">
            <span className="stat-card__num">{correctCount}</span>
            <span className="stat-card__label">ענו נכון</span>
          </div>
          <div className="stat-card stat-card--total">
            <span className="stat-card__num">{totalNonHost - correctCount}</span>
            <span className="stat-card__label">טעו</span>
          </div>
        </div>

        {encouragement && !isHost && (
          <div className="encouragement-msg">
            {myAnswer === null || myAnswer.answerIndex === null
              ? <span className="encourage-icon">😴</span>
              : myAnswer.isCorrect
                ? <span className="encourage-icon">🎉</span>
                : <span className="encourage-icon">😅</span>
            }
            <p>{encouragement}</p>
            {myAnswer?.pointsEarned !== undefined && myAnswer.pointsEarned > 0 && (
              <span className="points-earned">+{myAnswer.pointsEarned} נקודות</span>
            )}
          </div>
        )}

        {isHost && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
            <button className="btn btn--ghost btn--sm" onClick={onNext}>
              {isLastQuestion ? '🏆 עבור לדירוג סופי' : '⏭ דלג לדירוג'}
            </button>
            <button className="btn btn--danger btn--sm" onClick={onStopGame}>
              ✕ עצור משחק
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
