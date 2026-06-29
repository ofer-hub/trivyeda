import { useState } from 'react';
import { Logo } from '../components/Logo';
import { AVATARS } from '../data/avatars';
import './JoinScreen.css';

interface JoinScreenProps {
  onJoin: (nickname: string, avatar: string, code: string) => void | Promise<void>;
  onBack: () => void;
  joinCode?: string;
  error?: string | null;
  isLoading?: boolean;
}

export function JoinScreen({
  onJoin,
  onBack,
  joinCode = '',
  error,
  isLoading = false,
}: JoinScreenProps) {
  const [code, setCode] = useState(joinCode);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].emoji);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !code.trim() || isLoading) return;
    void onJoin(nickname.trim(), selectedAvatar, code.trim());
  }

  return (
    <div className="join-screen">
      <header className="join-header">
        <button className="btn-back" onClick={onBack}>&#x2190;</button>
        <Logo size="sm" />
      </header>

      <main className="join-main">
        <h1 className="join-title">הצטרפות למשחק</h1>

        <form className="join-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">קוד משחק</label>
            <input
              className="form-input form-input--code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="הזן קוד 6 ספרות"
              maxLength={6}
              inputMode="numeric"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">הכינוי שלך</label>
            <input
              className="form-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="איך קוראים לך?"
              maxLength={20}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">בחר אווטאר</label>
            <div className="avatar-grid">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  className={`avatar-btn ${selectedAvatar === av.emoji ? 'avatar-btn--selected' : ''}`}
                  onClick={() => setSelectedAvatar(av.emoji)}
                  title={av.label}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="join-preview">
            <span className="join-preview__avatar">{selectedAvatar}</span>
            <span className="join-preview__name">{nickname || 'שמך כאן'}</span>
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--xl"
            disabled={!nickname.trim() || code.length < 6 || isLoading}
          >
            {isLoading ? '⏳ מצטרף...' : '🙋 הצטרף למשחק'}
          </button>
        </form>
      </main>
    </div>
  );
}
