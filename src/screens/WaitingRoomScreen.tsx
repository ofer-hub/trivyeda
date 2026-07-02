import { useState } from 'react';
import { Logo } from '../components/Logo';
import { PlayerAvatar } from '../components/PlayerAvatar';
import type { Game, Participant } from '../types/game';
import './WaitingRoomScreen.css';

interface WaitingRoomScreenProps {
  game: Game;
  currentUserId: string;
  onStartGame: () => void;
  onAddDemoParticipant: (nickname: string, avatar: string) => void;
  onStopGame: () => void;
  onBroaderTopic: (topic: string) => void;
}

const DEMO_NAMES = ['שרה', 'ינון', 'תמר', 'איתי', 'נועה', 'אסף', 'ליאור', 'רוני', 'דני', 'אביב'];

export function WaitingRoomScreen({
  game,
  currentUserId,
  onStartGame,
  onAddDemoParticipant,
  onStopGame,
  onBroaderTopic,
}: WaitingRoomScreenProps) {
  const [copied, setCopied] = useState(false);
  const isHost = game.hostUserId === currentUserId;
  const participants = Object.values(game.participants);
  const nonHostParticipants = participants.filter((p) => !p.isHost);

  function handleCopyCode() {
    navigator.clipboard.writeText(game.joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleAddDemo() {
    const usedNames = participants.map((p) => p.nickname);
    const available = DEMO_NAMES.filter((n) => !usedNames.includes(n));
    const name = available[Math.floor(Math.random() * available.length)] || `שחקן${participants.length + 1}`;
    onAddDemoParticipant(name, '');
  }

  return (
    <div className="waiting-screen">
      <header className="waiting-header">
        <Logo size="sm" />
        <div className="waiting-topic">
          <span className="waiting-topic__label">נושא:</span>
          <span className="waiting-topic__value">{game.topic}</span>
        </div>
      </header>

      <main className="waiting-main">
        <div className="join-info">
          <div className="join-code-box">
            <p className="join-code-label">קוד כניסה למשחק</p>
            <p className="join-code">{game.joinCode}</p>
            <button className="btn btn--secondary btn--sm" onClick={handleCopyCode}>
              {copied ? '✓ הועתק!' : '📋 העתק קוד'}
            </button>
          </div>
        </div>

        {isHost && game.suggestedTopic && (
          <div className="suggested-topic-banner">
            <p className="suggested-topic-banner__text">
              💡 נמצאו רק <strong>{Object.keys(game.participants).length > 0 ? game.questions.length : '?'}</strong> שאלות על &ldquo;{game.topic}&rdquo;.
              נסה נושא רחב יותר:
            </p>
            <div className="suggested-topic-banner__suggestion">
              <span className="suggested-topic-banner__name">{game.suggestedTopic}</span>
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => onBroaderTopic(game.suggestedTopic!)}
              >
                נסה נושא זה
              </button>
            </div>
          </div>
        )}

        <div className="participants-section">
          <div className="participants-header">
            <h2 className="participants-title">
              משתתפים ({participants.length})
            </h2>
            {isHost && participants.length < 12 && (
              <button className="btn btn--ghost btn--sm" onClick={handleAddDemo}>
                + הוסף דמו
              </button>
            )}
          </div>

          <div className="participants-grid">
            {participants.map((p: Participant) => (
              <div key={p.id} className={`participant-card ${p.isHost ? 'participant-card--host' : ''}`}>
                <PlayerAvatar avatar={p.avatar} avatarDataUrl={p.avatarDataUrl} nickname={p.nickname} size="md" />
                <span className="participant-card__name">{p.nickname}</span>
                {p.isHost && <span className="participant-card__badge">מנהל</span>}
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="host-actions">
            <div className="game-info-chips">
              <span className="chip">{game.settings.questionCount} שאלות</span>
              <span className="chip">{game.settings.timePerQuestion} שניות</span>
              <span className="chip">
                {game.settings.questionAdvanceMode === 'manual' ? 'קידום ידני' : 'קידום אוטומטי'}
              </span>
            </div>
            <button
              className="btn btn--primary btn--xl"
              onClick={onStartGame}
              disabled={game.questions.length === 0}
            >
              🚀 התחל משחק
            </button>
            {nonHostParticipants.length === 0 && game.questions.length > 0 && (
              <p className="waiting-hint">משחק יחיד — רק אתה. אפשר להוסיף שחקנים דמו.</p>
            )}
            {game.questions.length === 0 && !game.suggestedTopic && (
              <p className="waiting-hint">לא נמצאו שאלות לנושא זה. נסה נושא אחר.</p>
            )}
            <button className="btn btn--danger btn--sm" onClick={onStopGame}>
              ✕ בטל משחק
            </button>
          </div>
        ) : (
          <div className="participant-waiting">
            <div className="waiting-spinner" />
            <p>מחכים שמנהל המשחק יתחיל...</p>
          </div>
        )}
      </main>
    </div>
  );
}
