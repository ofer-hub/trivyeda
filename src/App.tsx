import { useGame } from './hooks/useGame';
import { useFirebaseGame } from './hooks/useFirebaseGame';
import { GameContent } from './GameContent';

const GAME_MODE = (import.meta.env.VITE_GAME_MODE as string) ?? 'mock';

// Two separate components so hooks are never called conditionally
function MockGameRoot() {
  const hook = useGame();
  return <GameContent {...hook} />;
}

function FirebaseGameRoot() {
  const hook = useFirebaseGame();
  return <GameContent {...hook} />;
}

export default function App() {
  return GAME_MODE === 'firebase' ? <FirebaseGameRoot /> : <MockGameRoot />;
}
