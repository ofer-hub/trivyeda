import { Podium } from '../components/Podium';
import { Logo } from '../components/Logo';
import type { LeaderboardEntry } from '../types/game';
import './GameOverScreen.css';

interface GameOverScreenProps {
  entries: LeaderboardEntry[];
  topic: string;
  onPlayAgain: () => void;
  onNewGame: () => void;
  onHome: () => void;
}

export function GameOverScreen({ entries, topic, onPlayAgain, onNewGame, onHome }: GameOverScreenProps) {
  const winner = entries[0];
  const rest = entries.slice(3);

  return (
    <div className="gameover-screen">
      <div className="gameover-confetti" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="confetti-piece" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      <header className="gameover-header">
        <Logo size="sm" />
      </header>

      <main className="gameover-main">
        {winner && (
          <div className="winner-banner">
            <div className="winner-banner__crown">👑</div>
            <div className="winner-banner__text">
              <span className="winner-banner__label">יש לנו מנצח!</span>
              <span className="winner-banner__avatar">{winner.avatar}</span>
              <span className="winner-banner__name">{winner.nickname}</span>
              <span className="winner-banner__score">{winner.score.toLocaleString()} נקודות</span>
            </div>
          </div>
        )}

        <div className="gameover-podium-wrapper">
          <Podium entries={entries.slice(0, 3)} />
        </div>

        {rest.length > 0 && (
          <div className="gameover-rest">
            {rest.map((entry) => (
              <div key={entry.participantId} className="gameover-row">
                <span className="go-rank">{entry.rank}</span>
                <span className="go-avatar">{entry.avatar}</span>
                <span className="go-name">{entry.nickname}</span>
                <span className="go-score">{entry.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="gameover-actions">
          <button className="btn btn--primary btn--xl" onClick={onPlayAgain}>
            🔁 שחקו שוב באותו נושא ({topic})
          </button>
          <button className="btn btn--secondary" onClick={onNewGame}>
            🎮 צרו משחק חדש
          </button>
          <button className="btn btn--ghost" onClick={onHome}>
            🏠 חזרה לדף הבית
          </button>
        </div>
      </main>
    </div>
  );
}
