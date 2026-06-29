import { useState, useEffect, useRef } from 'react';
import { useGame } from './hooks/useGame';
import type { GameSettings } from './types/game';

import { HomeScreen } from './screens/HomeScreen';
import { CreateGameScreen } from './screens/CreateGameScreen';
import { JoinScreen } from './screens/JoinScreen';
import { WaitingRoomScreen } from './screens/WaitingRoomScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { RevealScreen } from './screens/RevealScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { GameOverScreen } from './screens/GameOverScreen';

type AppScreen = 'home' | 'create' | 'join' | 'waiting' | 'playing';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [selectedTopic, setSelectedTopic] = useState('');
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    game,
    isLoading,
    error,
    currentUserId,
    createGame,
    addParticipant,
    startGame,
    submitAnswer,
    simulateBotAnswers,
    revealAnswer,
    showLeaderboard,
    nextQuestion,
    finishGame,
    resetGame,
    getLeaderboard,
  } = useGame();

  const isHost = game?.hostUserId === currentUserId;
  const isAutoAdvance = game?.settings.questionAdvanceMode === 'auto';

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  const gameId = game?.id;
  const gameStatus = game?.status;
  const gameQuestionIndex = game?.currentQuestionIndex;
  const gameQuestionCount = game?.questions.length ?? 0;

  // מעבר אוטומטי מ-reveal לדירוג
  useEffect(() => {
    if (!game || gameStatus !== 'reveal' || !isAutoAdvance || !isHost) return;
    autoAdvanceTimerRef.current = setTimeout(() => {
      showLeaderboard();
    }, 4000);
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [gameId, gameStatus, gameQuestionIndex, isAutoAdvance, isHost, showLeaderboard, game]);

  // מעבר אוטומטי מדירוג לשאלה הבאה
  useEffect(() => {
    if (!game || gameStatus !== 'leaderboard' || !isAutoAdvance || !isHost) return;
    const isLast = (gameQuestionIndex ?? 0) >= gameQuestionCount - 1;
    if (isLast) return;
    autoAdvanceTimerRef.current = setTimeout(() => {
      nextQuestion();
    }, 5000);
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [gameId, gameStatus, gameQuestionIndex, gameQuestionCount, isAutoAdvance, isHost, nextQuestion, game]);

  async function handleCreateGame(topic: string, settings: Partial<GameSettings>) {
    try {
      await createGame(topic, settings);
      setScreen('waiting');
    } catch {
      // error is displayed via useGame().error
    }
  }

  function handleJoin(nickname: string, avatar: string) {
    addParticipant(nickname, avatar);
    setScreen('waiting');
  }

  function handleStartGame() {
    startGame();
    setScreen('playing');
  }

  function handleAnswer(answerIndex: number, questionStartTime: number) {
    submitAnswer(currentUserId, answerIndex, questionStartTime);
  }

  function handleTimeUp(questionStartTime: number) {
    simulateBotAnswers(questionStartTime);
    setTimeout(() => revealAnswer(), 300);
  }

  function handleRevealNext() {
    showLeaderboard();
  }

  function handleLeaderboardNext() {
    if (!game) return;
    const isLast = game.currentQuestionIndex >= game.questions.length - 1;
    if (isLast) {
      finishGame();
    } else {
      nextQuestion();
    }
  }

  async function handlePlayAgain() {
    if (!game) return;
    const topic = game.topic;
    const settings = { ...game.settings };
    resetGame(); // game → null → מציג מסך טעינה
    await handleCreateGame(topic, settings); // יוצר משחק חדש → עובר ל-waiting
  }

  function handleNewGame() {
    resetGame();
    setSelectedTopic('');
    setScreen('create');
  }

  function handleHome() {
    resetGame();
    setSelectedTopic('');
    setScreen('home');
  }

  // --- Rendering ---

  if (screen === 'home') {
    return (
      <HomeScreen
        onCreateGame={() => setScreen('create')}
        onJoinGame={() => setScreen('join')}
        onSelectTopic={(topic) => {
          setSelectedTopic(topic);
          setScreen('create');
        }}
      />
    );
  }

  if (screen === 'create') {
    return (
      <CreateGameScreen
        initialTopic={selectedTopic}
        onCreateGame={handleCreateGame}
        onBack={() => { setScreen('home'); setSelectedTopic(''); }}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (screen === 'join') {
    return (
      <JoinScreen
        onJoin={handleJoin}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (!game) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', direction: 'rtl', fontFamily: 'inherit' }}>
        <div style={{ textAlign: 'center' }}>
          {error && <p style={{ color: '#dc2626', fontWeight: 700 }}>{error}</p>}
          <p style={{ color: '#64748b' }}>טוען...</p>
        </div>
      </div>
    );
  }

  if (screen === 'waiting' || game.status === 'waiting') {
    return (
      <WaitingRoomScreen
        game={game}
        currentUserId={currentUserId}
        onStartGame={handleStartGame}
        onAddDemoParticipant={addParticipant}
      />
    );
  }

  if (game.status === 'question') {
    return (
      <QuestionScreen
        game={game}
        currentUserId={currentUserId}
        onAnswer={handleAnswer}
        onTimeUp={handleTimeUp}
      />
    );
  }

  if (game.status === 'reveal') {
    const isLast = game.currentQuestionIndex >= game.questions.length - 1;
    return (
      <RevealScreen
        game={game}
        currentUserId={currentUserId}
        onNext={handleRevealNext}
        isLastQuestion={isLast}
        isHost={isHost}
        autoAdvance={isAutoAdvance && isHost}
      />
    );
  }

  if (game.status === 'leaderboard') {
    const isLast = game.currentQuestionIndex >= game.questions.length - 1;
    return (
      <LeaderboardScreen
        entries={getLeaderboard()}
        onNext={handleLeaderboardNext}
        isLastQuestion={isLast}
        isHost={isHost}
        autoAdvance={isAutoAdvance && isHost && !isLast}
        currentQuestionIndex={game.currentQuestionIndex}
        totalQuestions={game.questions.length}
      />
    );
  }

  if (game.status === 'finished') {
    return (
      <GameOverScreen
        entries={getLeaderboard()}
        topic={game.topic}
        onPlayAgain={handlePlayAgain}
        onNewGame={handleNewGame}
        onHome={handleHome}
      />
    );
  }

  return null;
}
