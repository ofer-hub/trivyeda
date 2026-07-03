import { useGame } from './hooks/useGame';
import { useFirebaseGame } from './hooks/useFirebaseGame';
import { useFirestoreGame } from './hooks/useFirestoreGame';
import { GameContent } from './GameContent';

const GAME_MODE = (import.meta.env.VITE_GAME_MODE as string) ?? 'mock';
const GAME_BACKEND = (import.meta.env.VITE_GAME_BACKEND as string) ?? 'realtime';

// Three separate components so hooks are never called conditionally
function MockGameRoot() {
  const hook = useGame();
  return <GameContent {...hook} />;
}

function FirebaseGameRoot() {
  const hook = useFirebaseGame();
  return <GameContent {...hook} />;
}

function FirestoreGameRoot() {
  const hook = useFirestoreGame();
  return <GameContent {...hook} />;
}

export default function App() {
  if (GAME_MODE !== 'firebase') return <MockGameRoot />;
  if (GAME_BACKEND === 'firestore') return <FirestoreGameRoot />;
  return <FirebaseGameRoot />;
}
