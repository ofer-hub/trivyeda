import { useEffect, useState } from 'react';
import { Podium } from '../components/Podium';
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

  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="leaderboard-screen">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">
          {isLastQuestion ? '🏆 דירוג סופי' : `📊 דירוג לאחר שאלה ${currentQuestionIndex + 1}/${totalQuestions}`}
        </h2>
        {autoAdvance && !isLastQuestion && (
          <span className="leaderboard-countdown">
            ממשיכים בעוד {countdown}...
          </span>
        )}
      </div>

      <div className="leaderboard-body">
        {topThree.length > 0 && <Podium entries={topThree} />}

        {rest.length > 0 && (
          <div className="leaderboard-list">
            {rest.map((entry) => (
              <div key={entry.participantId} className="leaderboard-row">
                <span className="lb-rank">{entry.rank}</span>
                <PlayerAvatar avatar={entry.avatar} avatarDataUrl={entry.avatarDataUrl} nickname={entry.nickname} size="sm" />
                <span className="lb-name">{entry.nickname}</span>
                <span className="lb-score">{entry.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {isHost && (
          <button className="btn btn--primary btn--xl leaderboard-btn" onClick={onNext}>
            {isLastQuestion ? '🎊 סיים משחק' : '⏭ שאלה הבאה'}
          </button>
        )}
      </div>
    </div>
  );
}
