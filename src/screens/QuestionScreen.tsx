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
}

export function QuestionScreen({ game, currentUserId, onAnswer, onTimeUp }: QuestionScreenProps) {
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

  const totalParticipants = Object.values(game.participants).filter((p) => !p.isHost).length;
  const totalAnswered = Object.values(game.participants).filter(
    (p) => !p.isHost && p.lastAnswer !== null
  ).length;

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

        {hasAnswered && (
          <div className="answered-feedback">
            <span>✅ תשובתך נרשמה! מחכים לשאר המשתתפים...</span>
          </div>
        )}
      </div>
    </div>
  );
}
