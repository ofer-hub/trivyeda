import { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { checkTopic } from '../services/topicChecker';
import { TOPIC_CATEGORIES } from '../data/topics';
import type { GameSettings, TopicCheck, Difficulty, Audience, QuestionAdvanceMode } from '../types/game';
import './CreateGameScreen.css';

interface CreateGameScreenProps {
  initialTopic?: string;
  onCreateGame: (topic: string, settings: Partial<GameSettings>) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string | null;
}

const defaultSettings: Omit<GameSettings, 'questionCount'> & { questionCount: 5 | 10 | 15 } = {
  questionCount: 10,
  difficulty: 'mixed',
  timePerQuestion: 15,
  audience: 'family',
  questionAdvanceMode: 'manual',
};

export function CreateGameScreen({
  initialTopic = '',
  onCreateGame,
  onBack,
  isLoading,
  error,
}: CreateGameScreenProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [settings, setSettings] = useState(defaultSettings);
  const [topicCheck, setTopicCheck] = useState<TopicCheck | null>(null);
  const [showTopicWarning, setShowTopicWarning] = useState(false);
  const [showPopularTopics, setShowPopularTopics] = useState(false);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  function handleTopicChange(value: string) {
    setTopic(value);
    setTopicCheck(null);
    setShowTopicWarning(false);
  }

  function handleSelectPopularTopic(label: string) {
    setTopic(label);
    setTopicCheck(null);
    setShowTopicWarning(false);
    setShowPopularTopics(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) return;

    const check = checkTopic(trimmed);
    setTopicCheck(check);

    if (check.result === 'rejected') {
      setShowTopicWarning(true);
      return;
    }

    if (check.result === 'needs_refinement' && !showTopicWarning) {
      setShowTopicWarning(true);
      return;
    }

    onCreateGame(trimmed, settings);
  }

  function handleUseSuggestedTopic() {
    if (topicCheck?.suggestedTopic) {
      setTopic(topicCheck.suggestedTopic);
      const newCount = topicCheck.recommendedCount ?? settings.questionCount;
      setSettings((s) => ({ ...s, questionCount: newCount }));
      setTopicCheck(null);
      setShowTopicWarning(false);
    }
  }

  function handleContinueOriginal() {
    if (!topicCheck) return;
    onCreateGame(topic.trim(), settings);
  }

  function handleChangeTopic() {
    setTopicCheck(null);
    setShowTopicWarning(false);
    setTopic('');
  }

  const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: 'קל' },
    { value: 'medium', label: 'בינוני' },
    { value: 'hard', label: 'קשה' },
    { value: 'mixed', label: 'מעורב' },
  ];

  const audienceOptions: { value: Audience; label: string }[] = [
    { value: 'children', label: 'ילדים' },
    { value: 'teens', label: 'נוער' },
    { value: 'adults', label: 'מבוגרים' },
    { value: 'family', label: 'משפחתי' },
  ];

  return (
    <div className="create-screen">
      <header className="create-header">
        <button className="btn-back" onClick={onBack} aria-label="חזרה">
          &#x2190;
        </button>
        <Logo size="sm" />
      </header>

      <main className="create-main">
        <h1 className="create-title">יצירת משחק חדש</h1>

        {showTopicWarning && topicCheck ? (
          <div className={`topic-check topic-check--${topicCheck.result}`}>
            {topicCheck.result === 'rejected' ? (
              <>
                <p className="topic-check__msg">❌ {topicCheck.message}</p>
                <button className="btn btn--primary" onClick={handleChangeTopic}>
                  בחר נושא אחר
                </button>
              </>
            ) : (
              <>
                <p className="topic-check__msg">💡 {topicCheck.message}</p>
                <div className="topic-check__actions">
                  <button className="btn btn--primary" onClick={handleContinueOriginal}>
                    המשך עם "{topic}"
                  </button>
                  {topicCheck.suggestedTopic && (
                    <button className="btn btn--secondary" onClick={handleUseSuggestedTopic}>
                      השתמש ב-"{topicCheck.suggestedTopic}"
                    </button>
                  )}
                  <button className="btn btn--ghost" onClick={handleChangeTopic}>
                    שנה נושא
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <form className="create-form" onSubmit={handleSubmit}>

            {/* Topic — hero field */}
            <div className="form-group topic-group">
              <label className="form-label topic-label">
                נושא המשחק
              </label>
              <input
                className="form-input form-input--topic"
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder="זרוק נושא שעולה לך לראש..."
                required
                autoFocus
              />
              <button
                type="button"
                className={`popular-topics-btn ${showPopularTopics ? 'popular-topics-btn--open' : ''}`}
                onClick={() => setShowPopularTopics((v) => !v)}
              >
                🏷️ נושאים פופולריים {showPopularTopics ? '▲' : '▼'}
              </button>
              {showPopularTopics && (
                <div className="popular-topics-grid">
                  {TOPIC_CATEGORIES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="popular-topic-chip"
                      style={{ '--topic-color': t.color } as React.CSSProperties}
                      onClick={() => handleSelectPopularTopic(t.label)}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">מספר שאלות</label>
                <div className="btn-group">
                  {([5, 10, 15] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`btn-toggle ${settings.questionCount === n ? 'active' : ''}`}
                      onClick={() => setSettings((s) => ({ ...s, questionCount: n }))}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">זמן לשאלה (שניות)</label>
                <div className="btn-group">
                  {([10, 15, 20] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`btn-toggle ${settings.timePerQuestion === t ? 'active' : ''}`}
                      onClick={() => setSettings((s) => ({ ...s, timePerQuestion: t }))}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">רמת קושי</label>
              <div className="btn-group btn-group--wrap">
                {difficultyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn-toggle ${settings.difficulty === opt.value ? 'active' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, difficulty: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">קהל יעד</label>
              <div className="btn-group btn-group--wrap">
                {audienceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn-toggle ${settings.audience === opt.value ? 'active' : ''}`}
                    onClick={() => setSettings((s) => ({ ...s, audience: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">קידום שאלות</label>
              <div className="advance-mode">
                {(['manual', 'auto'] as QuestionAdvanceMode[]).map((mode) => (
                  <label key={mode} className="advance-option">
                    <input
                      type="radio"
                      name="advanceMode"
                      value={mode}
                      checked={settings.questionAdvanceMode === mode}
                      onChange={() =>
                        setSettings((s) => ({ ...s, questionAdvanceMode: mode }))
                      }
                    />
                    <div className="advance-option__content">
                      <span className="advance-option__title">
                        {mode === 'manual' ? '✋ ידני' : '⚡ אוטומטי'}
                      </span>
                      <span className="advance-option__desc">
                        {mode === 'manual'
                          ? 'מנהל המשחק מחליט מתי עוברים לשאלה הבאה.'
                          : 'המשחק מתקדם לבד אחרי כל שאלה.'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="create-error">⚠️ {error}</p>
            )}

            <button
              type="submit"
              className="btn btn--primary btn--xl"
              disabled={isLoading || !topic.trim()}
            >
              {isLoading ? '⏳ יוצר שאלות...' : '🎮 צור משחק'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
