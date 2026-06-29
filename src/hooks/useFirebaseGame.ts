import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, set, get, update, onValue } from 'firebase/database';
import { db } from '../services/firebase/config';
import { ensureSignedIn, onAuthChange } from '../services/firebase/authService';
import { activeQuestionGenerator } from '../services/questionGenerator';
import { calculateScore } from '../services/scoring';
import type {
  Game,
  GameSettings,
  GameStatus,
  Participant,
  QuestionFull,
  LeaderboardEntry,
} from '../types/game';

// ---- helpers ----

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQuestions(questionsPublic: any, answersPrivate: any): QuestionFull[] {
  if (!questionsPublic) return [];
  return Object.entries(questionsPublic as Record<string, unknown>)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(([index, pub]: [string, any]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const priv = answersPrivate?.[index] as any;
      return {
        id: pub.id as string,
        question: pub.question as string,
        answers: pub.answers as string[],
        correctIndex: (priv?.correctIndex ?? 0) as number,
        explanation: (priv?.explanation ?? '') as string,
      };
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildParticipants(fbParticipants: any): Record<string, Participant> {
  const result: Record<string, Participant> = {};
  if (!fbParticipants) return result;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(fbParticipants as Record<string, any>).forEach(([id, data]: [string, any]) => {
    result[id] = {
      id,
      nickname: data.nickname as string,
      avatar: data.avatar as string,
      score: (data.score as number) ?? 0,
      joinedAt: data.joinedAt as number,
      isReady: (data.isReady as boolean) ?? true,
      isHost: (data.isHost as boolean) ?? false,
      lastAnswer: data.lastAnswer ?? null,
    };
  });
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLocalGame(data: any, questions: QuestionFull[]): Game {
  return {
    id: data.id as string,
    hostUserId: data.hostUserId as string,
    topic: data.topic as string,
    originalTopic: data.originalTopic as string,
    suggestedTopic: (data.suggestedTopic as string | null) ?? null,
    sourceMode: data.sourceMode ?? 'generalTopic',
    status: data.status as GameStatus,
    settings: data.settings as GameSettings,
    currentQuestionIndex: (data.currentQuestionIndex as number) ?? 0,
    questions,
    participants: buildParticipants(data.participants),
    joinCode: data.code as string,
    joinLink: `${window.location.origin}?join=${data.code as string}`,
    createdAt: data.createdAt as number,
    startedAt: (data.startedAt as number | null) ?? null,
    finishedAt: (data.finishedAt as number | null) ?? null,
  };
}

// ---- hook ----

export function useFirebaseGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(() => generateId());
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  const listenerUnsubRef = useRef<(() => void) | null>(null);
  const questionsRef = useRef<QuestionFull[]>([]);
  const questionStartedAtRef = useRef<number>(0);
  const currentGameIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentGameIdRef.current = currentGameId;
  }, [currentGameId]);

  // Auth listener — keep currentUserId in sync
  useEffect(() => {
    return onAuthChange((uid) => {
      if (uid) setCurrentUserId(uid);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerUnsubRef.current) listenerUnsubRef.current();
    };
  }, []);

  function attachListener(gameId: string) {
    if (listenerUnsubRef.current) listenerUnsubRef.current();
    listenerUnsubRef.current = onValue(ref(db, `games/${gameId}`), (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      if (typeof data.questionStartedAt === 'number') {
        questionStartedAtRef.current = data.questionStartedAt;
      }

      const questions = buildQuestions(data.questionsPublic, data.answersPrivate);
      questionsRef.current = questions;
      setGame(buildLocalGame(data, questions));
      setIsLoading(false);
    });
  }

  // ---- createGame (host flow) ----
  const createGame = useCallback(
    async (topic: string, settings: Partial<GameSettings> = {}): Promise<Game> => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await ensureSignedIn();
        const uid = user.uid;
        setCurrentUserId(uid);

        const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
        const questions = await activeQuestionGenerator.generate({
          topic,
          count: mergedSettings.questionCount,
          difficulty: mergedSettings.difficulty,
          audience: mergedSettings.audience,
        });

        const gameId = generateId();
        const joinCode = generateJoinCode();

        const questionsPublic: Record<string, unknown> = {};
        const answersPrivate: Record<string, unknown> = {};

        questions.forEach((q, i) => {
          questionsPublic[i] = { id: q.id, question: q.question, answers: q.answers };
          answersPrivate[i] = {
            questionId: q.id,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          };
        });

        const hostParticipant: Participant = {
          id: uid,
          nickname: 'מנהל המשחק',
          avatar: '👑',
          score: 0,
          joinedAt: Date.now(),
          isReady: true,
          lastAnswer: null,
          isHost: true,
        };

        const gameData = {
          id: gameId,
          hostUserId: uid,
          topic,
          originalTopic: topic,
          suggestedTopic: null,
          sourceMode: 'generalTopic',
          status: 'waiting',
          settings: mergedSettings,
          currentQuestionIndex: 0,
          questionStartedAt: null,
          code: joinCode,
          createdAt: Date.now(),
          startedAt: null,
          finishedAt: null,
          questionsPublic,
          answersPrivate,
          participants: { [uid]: hostParticipant },
        };

        await update(ref(db), {
          [`games/${gameId}`]: gameData,
          [`gameCodes/${joinCode}`]: { gameId },
        });

        questionsRef.current = questions;
        setCurrentGameId(gameId);
        attachListener(gameId);

        const localGame: Game = {
          id: gameId,
          hostUserId: uid,
          topic,
          originalTopic: topic,
          suggestedTopic: null,
          sourceMode: 'generalTopic',
          status: 'waiting',
          settings: mergedSettings,
          currentQuestionIndex: 0,
          questions,
          participants: { [uid]: hostParticipant },
          joinCode,
          joinLink: `${window.location.origin}?join=${joinCode}`,
          createdAt: Date.now(),
          startedAt: null,
          finishedAt: null,
        };

        return localGame;
      } catch (err) {
        setError('שגיאה ביצירת המשחק. אנא נסה שנית.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ---- joinByCode (participant flow) ----
  const joinByCode = useCallback(
    async (code: string, nickname: string, avatar: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const codeSnap = await get(ref(db, `gameCodes/${code}`));
        if (!codeSnap.exists()) {
          throw new Error('קוד המשחק לא נמצא. בדוק שהקוד נכון ונסה שוב.');
        }
        const { gameId } = codeSnap.val() as { gameId: string };

        const user = await ensureSignedIn();
        const uid = user.uid;
        setCurrentUserId(uid);

        const participant: Participant = {
          id: uid,
          nickname,
          avatar,
          score: 0,
          joinedAt: Date.now(),
          isReady: true,
          lastAnswer: null,
          isHost: false,
        };

        await set(ref(db, `games/${gameId}/participants/${uid}`), participant);

        setCurrentGameId(gameId);
        attachListener(gameId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'שגיאה בהצטרפות למשחק';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ---- addParticipant (demo button in WaitingRoom) ----
  const addParticipant = useCallback(
    async (nickname: string, avatar: string): Promise<string> => {
      const gid = currentGameIdRef.current;
      if (!gid) return '';
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
      await set(ref(db, `games/${gid}/participants/${participantId}`), participant);
      return participantId;
    },
    []
  );

  // ---- startGame ----
  const startGame = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid) return;
    await update(ref(db), {
      [`games/${gid}/status`]: 'question',
      [`games/${gid}/currentQuestionIndex`]: 0,
      [`games/${gid}/questionStartedAt`]: Date.now(),
      [`games/${gid}/startedAt`]: Date.now(),
    });
  }, []);

  // ---- submitAnswer (participant writes their own answer) ----
  const submitAnswer = useCallback(
    async (participantId: string, answerIndex: number, _questionStartTime: number) => {
      const gid = currentGameIdRef.current;
      if (!gid) return;
      await set(ref(db, `games/${gid}/participants/${participantId}/lastAnswer`), {
        answerIndex,
        answeredAt: Date.now(),
        isCorrect: false, // calculated by host on reveal
        pointsEarned: 0,
      });
    },
    []
  );

  // ---- simulateBotAnswers (host writes fake answers for unanswered demo participants) ----
  const simulateBotAnswers = useCallback(
    async (questionStartTime: number) => {
      const gid = currentGameIdRef.current;
      if (!gid || !game) return;

      const question = questionsRef.current[game.currentQuestionIndex];
      if (!question) return;

      const totalTimeMs = game.settings.timePerQuestion * 1000;
      const updates: Record<string, unknown> = {};

      Object.values(game.participants).forEach((p) => {
        if (p.isHost || p.lastAnswer) return;

        const rand = Math.random();
        let answerIndex: number | null;

        if (rand < 0.1) {
          answerIndex = null;
        } else if (rand < 0.3) {
          const wrong = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
          answerIndex = wrong[Math.floor(Math.random() * wrong.length)];
        } else {
          answerIndex = question.correctIndex;
        }

        const responseTime = Math.random() * totalTimeMs * 0.85;
        updates[`games/${gid}/participants/${p.id}/lastAnswer`] = {
          answerIndex,
          answeredAt: answerIndex !== null ? questionStartTime + responseTime : null,
          isCorrect: false,
          pointsEarned: 0,
        };
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    },
    [game]
  );

  // ---- revealAnswer (host scores all participants, changes status) ----
  const revealAnswer = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid || !game) return;

    const question = questionsRef.current[game.currentQuestionIndex];
    if (!question) return;

    const questionStartedAt = questionStartedAtRef.current;
    const totalTimeMs = game.settings.timePerQuestion * 1000;
    const updates: Record<string, unknown> = {};

    Object.values(game.participants).forEach((p) => {
      if (p.isHost) return;
      const ans = p.lastAnswer;

      if (!ans || ans.answerIndex === null) {
        updates[`games/${gid}/participants/${p.id}/lastAnswer`] = {
          answerIndex: null,
          answeredAt: null,
          isCorrect: false,
          pointsEarned: 0,
        };
      } else {
        const isCorrect = ans.answerIndex === question.correctIndex;
        const elapsed = (ans.answeredAt ?? Date.now()) - questionStartedAt;
        const remaining = Math.max(0, totalTimeMs - elapsed);
        const points = calculateScore(isCorrect, remaining, totalTimeMs);

        updates[`games/${gid}/participants/${p.id}/lastAnswer`] = {
          answerIndex: ans.answerIndex,
          answeredAt: ans.answeredAt,
          isCorrect,
          pointsEarned: points,
        };
        updates[`games/${gid}/participants/${p.id}/score`] = (p.score ?? 0) + points;
      }
    });

    updates[`games/${gid}/status`] = 'reveal';
    await update(ref(db), updates);
  }, [game]);

  // ---- showLeaderboard ----
  const showLeaderboard = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid) return;
    await update(ref(db), { [`games/${gid}/status`]: 'leaderboard' });
  }, []);

  // ---- nextQuestion ----
  const nextQuestion = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid || !game) return;

    const nextIndex = game.currentQuestionIndex + 1;

    if (nextIndex >= questionsRef.current.length) {
      await update(ref(db), {
        [`games/${gid}/status`]: 'finished',
        [`games/${gid}/finishedAt`]: Date.now(),
      });
      return;
    }

    const updates: Record<string, unknown> = {
      [`games/${gid}/currentQuestionIndex`]: nextIndex,
      [`games/${gid}/status`]: 'question',
      [`games/${gid}/questionStartedAt`]: Date.now(),
    };

    Object.keys(game.participants).forEach((pid) => {
      updates[`games/${gid}/participants/${pid}/lastAnswer`] = null;
    });

    await update(ref(db), updates);
  }, [game]);

  // ---- finishGame ----
  const finishGame = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid) return;
    await update(ref(db), {
      [`games/${gid}/status`]: 'finished',
      [`games/${gid}/finishedAt`]: Date.now(),
    });
  }, []);

  // ---- resetGame ----
  const resetGame = useCallback(() => {
    if (listenerUnsubRef.current) {
      listenerUnsubRef.current();
      listenerUnsubRef.current = null;
    }
    questionsRef.current = [];
    questionStartedAtRef.current = 0;
    currentGameIdRef.current = null;
    setCurrentGameId(null);
    setGame(null);
    setError(null);
  }, []);

  // ---- setStatus (utility) ----
  const setStatus = useCallback(async (status: GameStatus) => {
    const gid = currentGameIdRef.current;
    if (!gid) return;
    await update(ref(db), { [`games/${gid}/status`]: status });
  }, []);

  // ---- getLeaderboard ----
  const getLeaderboard = useCallback((): LeaderboardEntry[] => {
    if (!game) return [];
    return Object.values(game.participants)
      .filter((p) => !p.isHost)
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        participantId: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        score: p.score,
        rank: index + 1,
      }));
  }, [game]);

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
