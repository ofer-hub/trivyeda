import { useState, useRef } from 'react';
import { Logo } from '../components/Logo';
import { processAvatarImage } from '../utils/imageUtils';
import './JoinScreen.css';

interface JoinScreenProps {
  onJoin: (nickname: string, avatar: string, code: string, avatarDataUrl?: string) => void | Promise<void>;
  onBack: () => void;
  joinCode?: string;
  initialNickname?: string;
  initialAvatarDataUrl?: string;
  error?: string | null;
  isLoading?: boolean;
}

export function JoinScreen({
  onJoin,
  onBack,
  joinCode = '',
  initialNickname = '',
  initialAvatarDataUrl,
  error,
  isLoading = false,
}: JoinScreenProps) {
  const [code, setCode] = useState(joinCode);
  const [nickname, setNickname] = useState(initialNickname);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(initialAvatarDataUrl ?? null);
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

          {/* Game code */}
          <div className="form-group">
            <label className="form-label">קוד משחק</label>
            <input
              className="form-input form-input--code"
              type="text"
              dir={code ? 'ltr' : 'rtl'}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="הזן קוד 6 ספרות"
              maxLength={6}
              inputMode="numeric"
              required
            />
          </div>

          {/* Identity — same layout as HomeScreen */}
          <div className="join-identity">
            <p className="join-identity__label">מה שמך?</p>
            <input
              className="join-identity__input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="איך קוראים לך?"
              maxLength={20}
              required
              autoFocus
            />
            <button
              type="button"
              className="join-avatar-pick"
              onClick={() => fileInputRef.current?.click()}
              title="העלה תמונת פרופיל"
            >
              {avatarDataUrl
                ? <img src={avatarDataUrl} className="join-avatar-pick__img" alt="תמונה" />
                : <span className="join-avatar-pick__icon">📷</span>
              }
            </button>
            {avatarDataUrl && (
              <button type="button" className="join-avatar-remove" onClick={() => setAvatarDataUrl(null)}>
                ✕ הסר תמונה
              </button>
            )}
            {photoError && <p className="photo-error">{photoError}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {error && (
            <p className="join-error">⚠️ {error}</p>
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
