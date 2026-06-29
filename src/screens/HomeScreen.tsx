import { Logo } from '../components/Logo';
import { TOPIC_CATEGORIES } from '../data/topics';
import './HomeScreen.css';

interface HomeScreenProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
  onSelectTopic: (topic: string) => void;
}

export function HomeScreen({ onCreateGame, onJoinGame, onSelectTopic }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <header className="home-header">
        <Logo size="lg" showSlogan />
      </header>

      <main className="home-main">
        <p className="home-tagline">בחרו נושא. הזמינו חברים. התחילו לשחק.</p>

        <div className="home-actions">
          <button className="btn btn--primary btn--xl" onClick={onCreateGame}>
            🎮 צור משחק חדש
          </button>
          <button className="btn btn--secondary btn--xl" onClick={onJoinGame}>
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
        <p>טריווידע — הטריוויה שממציאה את עצמה 🧠</p>
      </footer>
    </div>
  );
}
