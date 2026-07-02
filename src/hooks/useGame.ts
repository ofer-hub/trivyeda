import { useState, useCallback, useRef } from 'react';
import type {
  Game,
  GameSettings,
  GameStatus,
  Participant,
  ParticipantAnswer,
  LeaderboardEntry,
} from '../types/game';
import { activeQuestionGenerator } from '../services/questionGenerator';
import { calculateScore } from '../services/scoring';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function generateJoinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const DEFAULT_SETTINGS: GameSettings = {
  questionCount: 10,
  difficulty: 'mixed',
  timePerQuestion: 15,
  audience: 'family',
  questionAdvanceMode: 'manual',
};

export function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId] = useState(() => generateId());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // יצירת משחק חדש
  const createGame = useCallback(
    async (topic: string, settings: Partial<GameSettings> = {}, hostNickname?: string, hostAvatarDataUrl?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
        const { questions, suggestedTopic } = await activeQuestionGenerator.generate({
          topic,
          count: mergedSettings.questionCount,
          difficulty: mergedSettings.difficulty,
          audience: mergedSettings.audience,
        });

        const gameId = generateId();
        const joinCode = generateJoinCode();

        const hostParticipant: Participant = {
          id: currentUserId,
          nickname: hostNickname || 'מנהל המשחק',
          avatar: hostAvatarDataUrl ? '' : '👑',
          avatarDataUrl: hostAvatarDataUrl,
          score: 0,
          joinedAt: Date.now(),
          isReady: true,
          lastAnswer: null,
          isHost: true,
        };

        const newGame: Game = {
          id: gameId,
          hostUserId: currentUserId,
          topic,
          originalTopic: topic,
          suggestedTopic: (questions.length < mergedSettings.questionCount ? (suggestedTopic ?? null) : null),
          sourceMode: 'generalTopic',
          status: 'waiting',
          settings: mergedSettings,
          currentQuestionIndex: 0,
          questions,
          participants: { [currentUserId]: hostParticipant },
          joinCode,
          joinLink: `${window.location.origin}?join=${joinCode}`,
          createdAt: Date.now(),
          startedAt: null,
          finishedAt: null,
        };

        setGame(newGame);
        return newGame;
      } catch (err) {
        setError('שגיאה ביצירת המשחק. אנא נסה שנית.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUserId]
  );

  // הוספת משתתף (demo)
  const addParticipant = useCallback((nickname: string, avatar: string, avatarDataUrl?: string) => {
    const participantId = generateId();
    const participant: Participant = {
      id: participantId,
      nickname,
      avatar,
      score: 0,
      joinedAt: Date.now(),
      isReady: true,
      lastAnswer: null,
      isHost: false,
    };
    if (avatarDataUrl) participant.avatarDataUrl = avatarDataUrl;

    setGame((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: { ...prev.participants, [participantId]: participant },
      };
    });

    return participantId;
  }, []);

  const setStatus = useCallback((status: GameStatus) => {
    setGame((prev) => {
      if (!prev) return prev;
      return { ...prev, status };
    });
  }, []);

  // התחלת המשחק
  const startGame = useCallback(() => {
    setGame((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'question',
        currentQuestionIndex: 0,
        startedAt: Date.now(),
      };
    });
  }, []);

  // רישום תשובה של משתתף
  const submitAnswer = useCallback(
    (participantId: string, answerIndex: number, questionStartTime: number) => {
      setGame((prev) => {
        if (!prev || prev.status !== 'question') return prev;

        const question = prev.questions[prev.currentQuestionIndex];
        const now = Date.now();
        const elapsed = now - questionStartTime;
        const totalTimeMs = prev.settings.timePerQuestion * 1000;
        const remaining = Math.max(0, totalTimeMs - elapsed);
        const isCorrect = answerIndex === question.correctIndex;
        const points = calculateScore(isCorrect, remaining, totalTimeMs);

        const answer: ParticipantAnswer = {
          answerIndex,
          answeredAt: now,
          isCorrect,
          pointsEarned: points,
        };

        const updatedParticipant: Participant = {
          ...prev.participants[participantId],
          lastAnswer: answer,
          score: prev.participants[participantId].score + points,
        };

        return {
          ...prev,
          participants: {
            ...prev.participants,
            [participantId]: updatedParticipant,
          },
        };
      });
    },
    []
  );

  // סימולציית תשובות של משתתפים דמו
  const simulateBotAnswers = useCallback(
    (questionStartTime: number) => {
      setGame((prev) => {
        if (!prev) return prev;

        const question = prev.questions[prev.currentQuestionIndex];
        const totalTimeMs = prev.settings.timePerQuestion * 1000;
        const updatedParticipants = { ...prev.participants };

        Object.values(prev.participants).forEach((p) => {
          if (p.isHost || p.lastAnswer) return;

          // סימולציה: 70% סיכוי לתשובה נכונה, 20% שגויה, 10% לא עונה
          const rand = Math.random();
          let answerIndex: number | null;
          let isCorrect: boolean;

          if (rand < 0.1) {
            answerIndex = null;
            isCorrect = false;
          } else if (rand < 0.3) {
            // תשובה שגויה אקראית
            const wrongOptions = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
            answerIndex = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            isCorrect = false;
          } else {
            answerIndex = question.correctIndex;
            isCorrect = true;
          }

          const responseTime = Math.random() * totalTimeMs * 0.85;
          const remaining = Math.max(0, totalTimeMs - responseTime);
          const points = calculateScore(isCorrect, remaining, totalTimeMs);

          updatedParticipants[p.id] = {
            ...p,
            lastAnswer: {
              answerIndex,
              answeredAt: questionStartTime + responseTime,
              isCorrect,
              pointsEarned: points,
            },
            score: p.score + points,
          };
        });

        return { ...prev, participants: updatedParticipants };
      });
    },
    []
  );

  // מעבר למסך חשיפה
  const revealAnswer = useCallback(() => {
    clearTimer();
    setStatus('reveal');
  }, [setStatus, clearTimer]);

  // מעבר לדירוג
  const showLeaderboard = useCallback(() => {
    setStatus('leaderboard');
  }, [setStatus]);

  // שאלה הבאה
  const nextQuestion = useCallback(() => {
    setGame((prev) => {
      if (!prev) return prev;
      const nextIndex = prev.currentQuestionIndex + 1;

      if (nextIndex >= prev.questions.length) {
        return { ...prev, status: 'finished', finishedAt: Date.now() };
      }

      // איפוס תשובות משתתפים לשאלה הבאה
      const resetParticipants: Record<string, Participant> = {};
      Object.entries(prev.participants).forEach(([id, p]) => {
        resetParticipants[id] = { ...p, lastAnswer: null };
      });

      return {
        ...prev,
        status: 'question',
        currentQuestionIndex: nextIndex,
        participants: resetParticipants,
      };
    });
  }, []);

  // סיום משחק
  const finishGame = useCallback(() => {
    clearTimer();
    setGame((prev) => {
      if (!prev) return prev;
      return { ...prev, status: 'finished', finishedAt: Date.now() };
    });
  }, [clearTimer]);

  // איפוס
  const resetGame = useCallback(() => {
    clearTimer();
    setGame(null);
    setError(null);
  }, [clearTimer]);

  // קבלת דירוג — מנהל המשחק לא מופיע בלוח הדירוג
  const getLeaderboard = useCallback((): LeaderboardEntry[] => {
    if (!game) return [];
    return Object.values(game.participants)
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        participantId: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        avatarDataUrl: p.avatarDataUrl,
        score: p.score,
        rank: index + 1,
      }));
  }, [game]);

  // joinByCode — mock mode: ignores the code, just adds local participant
  const joinByCode = useCallback(
    async (_code: string, nickname: string, avatar: string, avatarDataUrl?: string): Promise<void> => {
      addParticipant(nickname, avatar, avatarDataUrl);
    },
    [addParticipant]
  );

  return {
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
    setStatus,
  };
}
