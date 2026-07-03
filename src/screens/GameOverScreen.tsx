import { useEffect, useState } from 'react';
import { PlayerAvatar } from '../components/PlayerAvatar';
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

const RANK_LABELS: Record<number, string> = {
  4: 'מקום רביעי',  5: 'מקום חמישי',  6: 'מקום שישי',
  7: 'מקום שביעי',  8: 'מקום שמיני',  9: 'מקום תשיעי',
  10: 'מקום עשירי',
};

export function GameOverScreen({ entries, topic, onPlayAgain, onNewGame, onHome }: GameOverScreenProps) {
  // stage: 0=nothing, 1=3rd, 2=2nd, 3=1st+confetti, 4=buttons
  const [stage, setStage] = useState(0);

  const first  = entries[0];
  const second = entries[1];
  const third  = entries[2];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const has3 = !!third;
    const has2 = !!second;
    const has1 = !!first;

    if (has3) {
      timers.push(setTimeout(() => setStage(1), 500));
      timers.push(setTimeout(() => setStage(2), 3000));
      timers.push(setTimeout(() => setStage(3), 5500));
      timers.push(setTimeout(() => setStage(4), 8000));
    } else if (has2) {
      timers.push(setTimeout(() => setStage(2), 500));
      timers.push(setTimeout(() => setStage(3), 3000));
      timers.push(setTimeout(() => setStage(4), 5500));
    } else if (has1) {
      timers.push(setTimeout(() => setStage(3), 500));
      timers.push(setTimeout(() => setStage(4), 3500));
    }

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="go-screen">
      {stage >= 3 && (
        <div className="go-confetti" aria-hidden="true">
          {Array.from({ length: 32 }).map((_, i) => (
            <span key={i} className="go-confetti__piece" style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
      )}

      <header className="go-header">
        <Logo size="sm" />
      </header>

      <main className="go-main">
        <h1 className="go-title">סיום משחק</h1>
        <p className="go-topic">נושא: {topic}</p>

        {/* Podium — DOM order: 2nd (left) | 1st (center) | 3rd (right)
            Always 3 slots for symmetry; missing slots are transparent placeholders */}
        <div className="go-podium">
          {/* 2nd place — left */}
          {second && stage >= 2 ? (
            <div className="go-place go-place--2">
              <div className="go-place__upper">
                <div className="go-place__medal">🥈</div>
                <PlayerAvatar avatarDataUrl={second.avatarDataUrl} nickname={second.nickname} size="md" />
                <h3 className="go-place__name">{second.nickname}</h3>
                <span className="go-place__score">{second.score.toLocaleString()}</span>
              </div>
              <div className="go-place__pedestal go-place__pedestal--2">2</div>
            </div>
          ) : (
            <div className="go-place go-place--2">
              <div className="go-place__upper go-place__upper--empty" />
              <div className="go-place__pedestal go-place__pedestal--2">2</div>
            </div>
          )}

          {/* 1st place — center */}
          {first && stage >= 3 && (
            <div className="go-place go-place--1">
              <div className="go-place__upper">
                <div className="go-place__crown">👑</div>
                <PlayerAvatar avatarDataUrl={first.avatarDataUrl} nickname={first.nickname} size="lg" />
                <h2 className="go-place__name go-place__name--big">{first.nickname}</h2>
                <p className="go-place__headline">אלוף טריווידע!</p>
                <span className="go-place__score go-place__score--big">{first.score.toLocaleString()}</span>
              </div>
              <div className="go-place__pedestal go-place__pedestal--1">1</div>
            </div>
          )}

          {/* 3rd place — right */}
          {third && stage >= 1 ? (
            <div className="go-place go-place--3">
              <div className="go-place__upper">
                <div className="go-place__medal">🥉</div>
                <PlayerAvatar avatarDataUrl={third.avatarDataUrl} nickname={third.nickname} size="sm" />
                <h3 className="go-place__name go-place__name--sm">{third.nickname}</h3>
                <span className="go-place__score go-place__score--sm">{third.score.toLocaleString()}</span>
              </div>
              <div className="go-place__pedestal go-place__pedestal--3">3</div>
            </div>
          ) : (
            <div className="go-place go-place--3">
              <div className="go-place__upper go-place__upper--empty" />
              <div className="go-place__pedestal go-place__pedestal--3">3</div>
            </div>
          )}
        </div>

        {/* 4th place and below */}
        {stage >= 4 && entries.length > 3 && (
          <div className="go-rest">
            {entries.slice(3).map((entry) => (
              <div key={entry.participantId} className="go-rest__row">
                <span className="go-rest__rank">{RANK_LABELS[entry.rank] ?? `מקום ${entry.rank}`}</span>
                <PlayerAvatar avatarDataUrl={entry.avatarDataUrl} nickname={entry.nickname} size="sm" />
                <span className="go-rest__name">{entry.nickname}</span>
                <span className="go-rest__score">{entry.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {stage >= 4 && (
          <div className="go-actions">
            <button className="go-btn go-btn--primary" onClick={onPlayAgain}>
              🔁 שחקו שוב באותו נושא
            </button>
            <button className="go-btn go-btn--secondary" onClick={onNewGame}>
              🎮 צרו משחק חדש
            </button>
            <button className="go-btn go-btn--ghost" onClick={onHome}>
              🏠 חזרה לדף הבית
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
