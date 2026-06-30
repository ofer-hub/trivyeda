import { useState, useRef } from 'react';
import { Logo } from '../components/Logo';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { processAvatarImage } from '../utils/imageUtils';
import './JoinScreen.css';

interface JoinScreenProps {
  onJoin: (nickname: string, avatar: string, code: string, avatarDataUrl?: string) => void | Promise<void>;
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
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    const result = await processAvatarImage(file);
    if (result) {
      setAvatarDataUrl(result);
    } else {
      setPhotoError('התמונה גדולה מדי. אנא בחר תמונה קטנה יותר.');
    }
    e.target.value = '';
  }

  function handleRemovePhoto() {
    setAvatarDataUrl(null);
    setPhotoError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !code.trim() || isLoading) return;
    void onJoin(nickname.trim(), '', code.trim(), avatarDataUrl ?? undefined);
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
            <label className="form-label">
              תמונת פרופיל
              <span className="form-label-optional"> (אופציונלי)</span>
            </label>

            {avatarDataUrl ? (
              <div className="photo-preview">
                <img src={avatarDataUrl} alt="תמונת פרופיל" className="photo-preview__img" />
                <button type="button" className="photo-preview__remove" onClick={handleRemovePhoto}>
                  ✕ הסר תמונה
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="photo-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 צלם / העלה תמונה
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {photoError && <p className="photo-error">{photoError}</p>}
            <p className="photo-privacy">
              התמונה משמשת רק במהלך המשחק ואינה נשמרת לאחר סיום המשחק.
            </p>
          </div>

          <div className="join-preview">
            <PlayerAvatar
              nickname={nickname || '?'}
              avatarDataUrl={avatarDataUrl ?? undefined}
              size="md"
            />
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
