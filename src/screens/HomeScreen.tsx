import { TOPIC_CATEGORIES } from '../data/topics';
import './HomeScreen.css';

interface HomeScreenProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
  onSelectTopic: (topic: string) => void;
  onAdmin: () => void;
}

export function HomeScreen({ onCreateGame, onJoinGame, onSelectTopic, onAdmin }: HomeScreenProps) {
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
        <p className="home-tagline">בחרו נושא. הזמינו חברים. התחילו לשחק.</p>

        <div className="home-actions">
          <button className="home-btn home-btn--create" onClick={onCreateGame}>
            🎮 צור משחק חדש
          </button>
          <button className="home-btn home-btn--join" onClick={onJoinGame}>
            🙋 הצטרף למשחק
          </button>
        </div>

        <section className="home-topics">
          <h2 className="home-topics__title">נושאים פופולריים</h2>
          <div className="home-topics__grid">
            {TOPIC_CATEGORIES.map((topic) => (
              <button
                key={topic.id}
                className="topic-card"
                style={{ '--topic-color': topic.color } as React.CSSProperties}
                onClick={() => onSelectTopic(topic.label)}
              >
                <span className="topic-card__emoji">{topic.emoji}</span>
                <span className="topic-card__label">{topic.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>טריווידע — פרויקט OferApps</p>
        <button className="home-admin-btn" onClick={onAdmin}>⚙ ניהול</button>
      </footer>
    </div>
  );
}
