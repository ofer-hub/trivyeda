import { useState, useRef } from 'react';
import { processAvatarImage } from '../utils/imageUtils';
import './HomeScreen.css';

interface HomeScreenProps {
  onCreateGame: (nickname: string, avatarDataUrl?: string) => void;
  onJoinGame: (nickname: string, avatarDataUrl?: string) => void;
  onAdmin: () => void;
}

export function HomeScreen({ onCreateGame, onJoinGame, onAdmin }: HomeScreenProps) {
  const [nickname, setNickname] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await processAvatarImage(file);
    if (result) setAvatarDataUrl(result);
    e.target.value = '';
  }

  return (
    <div className="home-screen">
      <header className="home-header">
        <div className="home-logo">
          <img src="/albert.jpg" alt="אלברט איינשטיין" className="home-logo__einstein" />
          <h1 className="home-logo__title">טריווידע</h1>
          <p className="home-logo__slogan">הטריוויה שממציאה את עצמה</p>
        </div>
      </header>

      <main className="home-main">
        <div className="home-actions">
          <button
            className="home-btn home-btn--create"
            onClick={() => onCreateGame(nickname.trim(), avatarDataUrl ?? undefined)}
          >
            🎮 צור משחק חדש
          </button>
          <button
            className="home-btn home-btn--join"
            onClick={() => onJoinGame(nickname.trim(), avatarDataUrl ?? undefined)}
          >
            🙋 הצטרף למשחק
          </button>
        </div>

        <div className="home-identity">
          <p className="home-identity__label">מה שמך?</p>
          <div className="home-identity__row">
            <input
              className="home-identity__input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="השם שלך (אופציונלי)"
              maxLength={20}
            />
            <button
              type="button"
              className="home-avatar-pick"
              onClick={() => fileInputRef.current?.click()}
              title="העלה תמונת פרופיל"
            >
              {avatarDataUrl
                ? <img src={avatarDataUrl} className="home-avatar-pick__img" alt="תמונה" />
                : <span className="home-avatar-pick__icon">📷</span>
              }
            </button>
          </div>
          {avatarDataUrl && (
            <button type="button" className="home-avatar-remove" onClick={() => setAvatarDataUrl(null)}>
              ✕ הסר תמונה
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </main>

      <footer className="home-footer">
        <p>טריווידע — פרויקט OferApps</p>
        <button className="home-admin-btn" onClick={onAdmin}>⚙ ניהול</button>
      </footer>
    </div>
  );
}
