import { useEffect, useState, useCallback } from 'react';
import { ref, get, update, increment } from 'firebase/database';
import { db } from '../services/firebase/config';
import { ensureSignedIn } from '../services/firebase/authService';
import './AdminScreen.css';

// ← שנה כאן את הסיסמא
const ADMIN_PIN = '9919';

function topicToKey(topic: string): string {
  return topic.trim().replace(/[.#$[\]/]/g, '-').replace(/\s+/g, '_').slice(0, 100);
}

interface GameStat {
  id: string;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number;
  topic: string;
  participantCount: number;
  questionCount: number;
}

interface TopicStat {
  topic: string;
  count: number;
  lastUsedAt: number;
}

type Period = 'today' | 'week' | 'month' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'היום',
  week: 'השבוע',
  month: 'החודש',
  all: 'סה"כ',
};

function periodCutoff(period: Period): number {
  if (period === 'all') return 0;
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (period === 'week') {
    const d = now.getDay();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - d).getTime();
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('he-IL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

interface AdminScreenProps {
  onBack: () => void;
}

export function AdminScreen({ onBack }: AdminScreenProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [games, setGames] = useState<GameStat[]>([]);
  const [topics, setTopics] = useState<TopicStat[]>([]);
  const [period, setPeriod] = useState<Period>('all');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await ensureSignedIn();
      const [gSnap, tSnap] = await Promise.all([
        get(ref(db, 'gameStats')),
        get(ref(db, 'topicStats')),
      ]);

      const gData = gSnap.val() as Record<string, Omit<GameStat, 'id'>> | null;
      setGames(
        gData
          ? Object.entries(gData)
              .map(([id, v]) => ({ ...v, id }))
              .sort((a, b) => b.createdAt - a.createdAt)
          : []
      );

      const tData = tSnap.val() as Record<string, TopicStat> | null;

      // One-time backfill: if topicStats is empty, scan existing games/ and populate it
      if (!tData) {
        const gamesSnap = await get(ref(db, 'games'));
        const gamesRaw = gamesSnap.val() as Record<string, { topic?: string }> | null;
        if (gamesRaw) {
          const counts: Record<string, { topic: string; count: number }> = {};
          Object.values(gamesRaw).forEach((g) => {
            if (!g.topic) return;
            const key = topicToKey(g.topic);
            if (!counts[key]) counts[key] = { topic: g.topic.trim(), count: 0 };
            counts[key].count++;
          });
          const bfUpdates: Record<string, unknown> = {};
          const now = Date.now();
          Object.entries(counts).forEach(([key, { topic, count }]) => {
            bfUpdates[`topicStats/${key}/topic`] = topic;
            bfUpdates[`topicStats/${key}/count`] = count;
            bfUpdates[`topicStats/${key}/lastUsedAt`] = now;
          });
          if (Object.keys(bfUpdates).length > 0) {
            await update(ref(db), bfUpdates);
            setTopics(Object.values(counts).sort((a, b) => b.count - a.count) as TopicStat[]);
          } else {
            setTopics([]);
          }
        } else {
          setTopics([]);
        }
      } else {
        setTopics(Object.values(tData).sort((a, b) => b.count - a.count));
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unlocked) void loadData();
  }, [unlocked, loadData]);


  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  }

  // ── PIN screen ──
  if (!unlocked) {
    return (
      <div className="admin-screen">
        <header className="admin-header">
          <button className="btn-back" onClick={onBack}>&#x2190;</button>
          <span className="admin-header__title">📊 ממשק ניהול</span>
        </header>
        <main className="admin-main admin-main--centered">
          <form className="admin-pin-form" onSubmit={handlePinSubmit}>
            <div className="admin-pin-icon">🔒</div>
            <h2 className="admin-pin-title">הכנס סיסמא</h2>
            <input
              className={`admin-pin-input ${pinError ? 'admin-pin-input--error' : ''}`}
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              placeholder="••••"
              autoFocus
              maxLength={20}
            />
            {pinError && <p className="admin-pin-error">סיסמא שגויה</p>}
            <button type="submit" className="btn btn--primary" disabled={!pin}>
              כניסה
            </button>
          </form>
        </main>
      </div>
    );
  }

  // ── Dashboard ──
  const cutoff = periodCutoff(period);
  const filtered = period === 'all' ? games : games.filter((g) => g.createdAt >= cutoff);
  const totalGames = filtered.length;
  const totalParticipants = filtered.reduce((s, g) => s + (g.participantCount ?? 0), 0);
  const avgParticipants = totalGames > 0 ? (totalParticipants / totalGames).toFixed(1) : '–';
  const maxTopicCount = topics[0]?.count ?? 1;

  return (
    <div className="admin-screen">
      <header className="admin-header">
        <button className="btn-back" onClick={onBack}>&#x2190;</button>
        <span className="admin-header__title">📊 ממשק ניהול</span>
        <button className="admin-refresh" onClick={() => void loadData()} title="רענן">↻</button>
      </header>

      <main className="admin-main">
        {loading ? (
          <div className="admin-loading">
            <span className="admin-loading__spinner" />
            טוען נתונים...
          </div>
        ) : loadError ? (
          <div className="admin-error">
            <p>⚠️ {loadError}</p>
            <p className="admin-error__hint">
              ודא שכללי Firebase מאפשרים קריאה מ-<code>gameStats</code> ו-<code>topicStats</code> למשתמשים מאומתים.
            </p>
            <button className="btn btn--ghost btn--sm" onClick={() => void loadData()}>נסה שוב</button>
          </div>
        ) : (
          <>
            <div className="admin-tabs">
              {(['today', 'week', 'month', 'all'] as Period[]).map((p) => (
                <button
                  key={p}
                  className={`admin-tab ${period === p ? 'admin-tab--active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            <div className="admin-stats">
              <div className="admin-stat">
                <span className="admin-stat__num">{totalGames}</span>
                <span className="admin-stat__label">משחקים</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__num">{totalParticipants}</span>
                <span className="admin-stat__label">משתתפים</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__num">{avgParticipants}</span>
                <span className="admin-stat__label">ממוצע/משחק</span>
              </div>
            </div>

            <section className="admin-section">
              <h2 className="admin-section__title">נושאים פופולריים</h2>
              {topics.length === 0 ? (
                <p className="admin-empty">אין נתונים עדיין</p>
              ) : (
                <ol className="admin-topics">
                  {topics.map((t, i) => (
                    <li key={t.topic} className="admin-topic">
                      <span className="admin-topic__rank">{i + 1}</span>
                      <div className="admin-topic__body">
                        <div className="admin-topic__top">
                          <span className="admin-topic__name">{t.topic}</span>
                          <span className="admin-topic__count">{t.count}</span>
                        </div>
                        <div className="admin-topic__bar-bg">
                          <div
                            className="admin-topic__bar-fill"
                            style={{ width: `${Math.round((t.count / maxTopicCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="admin-section">
              <h2 className="admin-section__title">
                משחקים אחרונים
                {period !== 'all' && <span className="admin-section__sub"> — {PERIOD_LABELS[period]}</span>}
              </h2>
              {filtered.length === 0 ? (
                <p className="admin-empty">אין משחקים בתקופה זו</p>
              ) : (
                <div className="admin-games">
                  {filtered.slice(0, 30).map((g) => (
                    <div key={g.id} className="admin-game">
                      <div className="admin-game__topic">{g.topic}</div>
                      <div className="admin-game__meta">
                        <span>👥 {g.participantCount}</span>
                        <span>❓ {g.questionCount}</span>
                        <span className="admin-game__date">{formatDate(g.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
