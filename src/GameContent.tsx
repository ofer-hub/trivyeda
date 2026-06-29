import { useState, useEffect, useRef } from 'react';
import type { Game, GameSettings, GameStatus, LeaderboardEntry } from './types/game';

import { HomeScreen } from './screens/HomeScreen';
import { CreateGameScreen } from './screens/CreateGameScreen';
import { JoinScreen } from './screens/JoinScreen';
import { WaitingRoomScreen } from './screens/WaitingRoomScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { RevealScreen } from './screens/RevealScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { GameOverScreen } from './screens/GameOverScreen';

type AppScreen = 'home' | 'create' | 'join' | 'waiting' | 'playing';

export interface GameHookProps {
  game: Game | null;
  isLoading: boolean;
  error: string | null;
  currentUserId: string;
  createGame: (topic: string, settings?: Partial<GameSettings>) => Promise<Game>;
  addParticipant: (nickname: string, avatar: string) => string | Promise<string>;
  joinByCode: (code: string, nickname: string, avatar: string) => Promise<void>;
  startGame: () => void | Promise<void>;
  submitAnswer: (
    participantId: string,
    answerIndex: number,
    questionStartTime: number
  ) => void | Promise<void>;
  simulateBotAnswers: (questionStartTime: number) => void | Promise<void>;
  revealAnswer: () => void | Promise<void>;
  showLeaderboard: () => void | Promise<void>;
  nextQuestion: () => void | Promise<void>;
  finishGame: () => void | Promise<void>;
  resetGame: () => void;
  getLeaderboard: () => LeaderboardEntry[];
  setStatus: (status: GameStatus) => void | Promise<void>;
}

export function GameContent({
  game,
  isLoading,
  error,
  currentUserId,
  createGame,
  addParticipant,
  joinByCode,
  startGame,
  submitAnswer,
  simulateBotAnswers,
  revealAnswer,
  showLeaderboard,
  nextQuestion,
  finishGame,
  resetGame,
  getLeaderboard,
}: GameHookProps) {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [selectedTopic, setSelectedTopic] = useState('');
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHost = game?.hostUserId === currentUserId;
  const isAutoAdvance = game?.settings.questionAdvanceMode === 'auto';

  const gameId = game?.id;
  const gameStatus = game?.status;
  const gameQuestionIndex = game?.currentQuestionIndex;
  const gameQuestionCount = game?.questions.length ?? 0;

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // Participant: auto-transition from waiting room once host starts the game
  useEffect(() => {
    if (screen === 'waiting' && gameStatus === 'question') {
      setScreen('playing');
    }
  }, [screen, gameStatus]);

  // Auto-advance: reveal → leaderboard
  useEffect(() => {
    if (!game || gameStatus !== 'reveal' || !isAutoAdvance || !isHost) return;
    autoAdvanceTimerRef.current = setTimeout(() => {
      void showLeaderboard();
    }, 4000);
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [gameId, gameStatus, gameQuestionIndex, isAutoAdvance, isHost, showLeaderboard, game]);

  // Auto-advance: leaderboard → next question
  useEffect(() => {
    if (!game || gameStatus !== 'leaderboard' || !isAutoAdvance || !isHost) return;
    const isLast = (gameQuestionIndex ?? 0) >= gameQuestionCount - 1;
    if (isLast) return;
    autoAdvanceTimerRef.current = setTimeout(() => {
      void nextQuestion();
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
      // error shown via hook's error state
    }
  }

  async function handleJoin(nickname: string, avatar: string, code: string) {
    try {
      await joinByCode(code, nickname, avatar);
      setScreen('waiting');
    } catch {
      // error shown via hook's error state
    }
  }

  async function handleStartGame() {
    await Promise.resolve(startGame());
    setScreen('playing');
  }

  function handleAnswer(answerIndex: number, questionStartTime: number) {
    void submitAnswer(currentUserId, answerIndex, questionStartTime);
  }

  function handleTimeUp(questionStartTime: number) {
    void Promise.resolve(simulateBotAnswers(questionStartTime)).then(() => {
      setTimeout(() => void revealAnswer(), 300);
    });
  }

  function handleRevealNext() {
    void showLeaderboard();
  }

  function handleLeaderboardNext() {
    if (!game) return;
    const isLast = game.currentQuestionIndex >= game.questions.length - 1;
    if (isLast) {
      void finishGame();
    } else {
      void nextQuestion();
    }
  }

  async function handlePlayAgain() {
    if (!game) return;
    const topic = game.topic;
    const settings = { ...game.settings };
    resetGame();
    await handleCreateGame(topic, settings);
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
        onBack={() => {
          setScreen('home');
          setSelectedTopic('');
        }}
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
        error={error}
        isLoading={isLoading}
      />
    );
  }

  if (!game) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          direction: 'rtl',
          fontFamily: 'inherit',
        }}
      >
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
        onStartGame={() => void handleStartGame()}
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
