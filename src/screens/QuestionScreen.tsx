import { useEffect, useRef } from 'react';
import { Timer } from '../components/Timer';
import { AnswerButton } from '../components/AnswerButton';
import { useTimer } from '../hooks/useTimer';
import type { Game } from '../types/game';
import './QuestionScreen.css';

interface QuestionScreenProps {
  game: Game;
  currentUserId: string;
  onAnswer: (answerIndex: number, questionStartTime: number) => void;
  onTimeUp: (questionStartTime: number) => void;
  isHost: boolean;
  onStopGame: () => void;
}

export function QuestionScreen({ game, currentUserId, onAnswer, onTimeUp, isHost, onStopGame }: QuestionScreenProps) {
  const question = game.questions[game.currentQuestionIndex];
  const participant = game.participants[currentUserId];
  const hasAnswered = !!participant?.lastAnswer;
  const questionStartRef = useRef<number>(Date.now());

  const { timeLeft } = useTimer({
    duration: game.settings.timePerQuestion,
    onComplete: () => onTimeUp(questionStartRef.current),
    autoStart: true,
  });

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [game.currentQuestionIndex]);

  const allParticipants = Object.values(game.participants);
  const totalParticipants = allParticipants.length;
  const totalAnswered = allParticipants.filter((p) => p.lastAnswer !== null).length;
  const unansweredParticipants = allParticipants.filter((p) => p.lastAnswer === null);

  function getButtonState(index: number) {
    if (!hasAnswered) return 'idle';
    const myAnswer = participant?.lastAnswer?.answerIndex;
    if (myAnswer === index) return 'selected';
    return 'idle';
  }

  return (
    <div className="question-screen">
      <div className="question-topbar">
        <div className="question-progress">
          <span>שאלה {game.currentQuestionIndex + 1} מתוך {game.questions.length}</span>
          <div className="question-progress__bar">
            <div
              className="question-progress__fill"
              style={{ width: `${((game.currentQuestionIndex + 1) / game.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <Timer
          timeLeft={timeLeft}
          totalTime={game.settings.timePerQuestion}
          size="md"
        />

        <div className="answered-count">
          <span>{totalAnswered}/{totalParticipants}</span>
          <span className="answered-count__label">ענו</span>
        </div>
      </div>

      <div className="question-body">
        <div className="question-card">
          <p className="question-text">{question.question}</p>
        </div>

        <div className="answers-grid">
          {question.answers.map((answer, index) => (
            <AnswerButton
              key={index}
              index={index}
              text={answer}
              state={getButtonState(index)}
              disabled={hasAnswered}
              onClick={() => {
                if (!hasAnswered) {
                  onAnswer(index, questionStartRef.current);
                }
              }}
            />
          ))}
        </div>

        {unansweredParticipants.length > 0 && (
          <div className="unanswered-panel">
            <span className="unanswered-panel__label">עדיין לא ענו:</span>
            <div className="unanswered-panel__chips">
              {unansweredParticipants.map((p) => (
                <span key={p.id} className="unanswered-chip">{p.nickname}</span>
              ))}
            </div>
          </div>
        )}

        {hasAnswered && unansweredParticipants.length > 0 && (
          <div className="answered-feedback">
            <span>✅ תשובתך נרשמה! מחכים לשאר המשתתפים...</span>
          </div>
        )}

        {isHost && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <button className="btn btn--danger btn--sm" onClick={onStopGame}>
              ✕ עצור משחק
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
