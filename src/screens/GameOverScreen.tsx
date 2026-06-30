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

const PLACE_MESSAGES: Record<number, { headline: string; tagline: string }> = {
  3: { headline: 'מקום שלישי', tagline: 'כל הכבוד! ביצוע מרשים!' },
  2: { headline: 'מקום שני', tagline: 'מדהים! כמעט הגעת לפסגה!' },
  1: { headline: 'אלוף טריווידע!', tagline: 'כובש ראשי התשובות!' },
};

export function GameOverScreen({ entries, topic, onPlayAgain, onNewGame, onHome }: GameOverScreenProps) {
  // stage: 0=nothing, 1=3rd, 2=2nd, 3=1st, 4=buttons
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
      timers.push(setTimeout(() => setStage(2), has2 ? 3000 : 4000));
      timers.push(setTimeout(() => setStage(3), has1 ? 5500 : 5500));
      timers.push(setTimeout(() => setStage(4), 8000));
    } else if (has2) {
      timers.push(setTimeout(() => setStage(2), 500));
      timers.push(setTimeout(() => setStage(3), has1 ? 3000 : 3000));
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
      {/* Confetti — shown when first place is revealed */}
      {stage >= 3 && (
        <div className="go-confetti" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
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

        <div className="go-places">
          {/* 3rd place */}
          {third && stage >= 1 && (
            <div className="go-place go-place--3">
              <div className="go-place__medal">🥉</div>
              <PlayerAvatar
                avatarDataUrl={third.avatarDataUrl}
                nickname={third.nickname}
                size="lg"
              />
              <h3 className="go-place__name">{third.nickname}</h3>
              <p className="go-place__headline">{PLACE_MESSAGES[3].headline}</p>
              <p className="go-place__tagline">{PLACE_MESSAGES[3].tagline}</p>
              <span className="go-place__score">{third.score.toLocaleString()} נקודות</span>
            </div>
          )}

          {/* 2nd place */}
          {second && stage >= 2 && (
            <div className="go-place go-place--2">
              <div className="go-place__medal">🥈</div>
              <PlayerAvatar
                avatarDataUrl={second.avatarDataUrl}
                nickname={second.nickname}
                size="lg"
              />
              <h3 className="go-place__name">{second.nickname}</h3>
              <p className="go-place__headline">{PLACE_MESSAGES[2].headline}</p>
              <p className="go-place__tagline">{PLACE_MESSAGES[2].tagline}</p>
              <span className="go-place__score">{second.score.toLocaleString()} נקודות</span>
            </div>
          )}

          {/* 1st place */}
          {first && stage >= 3 && (
            <div className="go-place go-place--1">
              <div className="go-place__crown">👑</div>
              <PlayerAvatar
                avatarDataUrl={first.avatarDataUrl}
                nickname={first.nickname}
                size="xl"
              />
              <h2 className="go-place__name go-place__name--big">{first.nickname}</h2>
              <p className="go-place__headline go-place__headline--big">{PLACE_MESSAGES[1].headline}</p>
              <p className="go-place__tagline">{PLACE_MESSAGES[1].tagline}</p>
              <span className="go-place__score go-place__score--big">{first.score.toLocaleString()} נקודות</span>
            </div>
          )}
        </div>

        {/* All others (4th place and below) — shown alongside buttons */}
        {stage >= 4 && entries.length > 3 && (
          <div className="go-rest">
            <p className="go-rest__label">שאר המשתתפים</p>
            {entries.slice(3).map((entry) => (
              <div key={entry.participantId} className="go-rest__row">
                <span className="go-rest__rank">#{entry.rank}</span>
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
