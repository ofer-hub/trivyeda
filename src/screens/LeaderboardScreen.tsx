import { useEffect, useState } from 'react';
import { PlayerAvatar } from '../components/PlayerAvatar';
import type { LeaderboardEntry } from '../types/game';
import './LeaderboardScreen.css';

interface LeaderboardScreenProps {
  entries: LeaderboardEntry[];
  onNext: () => void;
  isLastQuestion: boolean;
  isHost: boolean;
  autoAdvance: boolean;
  currentQuestionIndex: number;
  totalQuestions: number;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardScreen({
  entries,
  onNext,
  isLastQuestion,
  isHost,
  autoAdvance,
  currentQuestionIndex,
  totalQuestions,
}: LeaderboardScreenProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!autoAdvance) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); onNext(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoAdvance, onNext]);

  return (
    <div className="lb-screen">
      <header className="lb-header">
        <h2 className="lb-title">
          {isLastQuestion
            ? '🏆 דירוג סופי'
            : `📊 דירוג — שאלה ${currentQuestionIndex + 1} מתוך ${totalQuestions}`}
        </h2>
        {autoAdvance && !isLastQuestion && (
          <span className="lb-countdown">שאלה הבאה בעוד {countdown}...</span>
        )}
      </header>

      <div className="lb-body">
        <div className="lb-list">
          {entries.map((entry, i) => (
            <div
              key={entry.participantId}
              className={`lb-row ${i < 3 ? `lb-row--${['gold', 'silver', 'bronze'][i]}` : ''}`}
              style={{ animationDelay: `${Math.min(i * 55, 440)}ms` }}
            >
              <span className="lb-row__rank">
                {i < 3 ? RANK_MEDALS[i] : `#${entry.rank}`}
              </span>
              <PlayerAvatar
                avatarDataUrl={entry.avatarDataUrl}
                nickname={entry.nickname}
                size="sm"
              />
              <span className="lb-row__name">{entry.nickname}</span>
              <span className="lb-row__score">{entry.score.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button className="btn lb-btn" onClick={onNext}>
            {isLastQuestion ? '🎊 לטקס הסיום' : '⏭ שאלה הבאה'}
          </button>
        )}
      </div>
    </div>
  );
}
