import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  onSnapshot,
  increment,
  type FirestoreError,
} from 'firebase/firestore';
import { fsdb } from '../services/firebase/config';
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
  ParticipantAnswer,
} from '../types/game';

const SS_GAME_ID = 'tvd_fs_gameId';
const SS_USER_ID = 'tvd_fs_userId';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function generateJoinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function topicToKey(topic: string): string {
  return topic.trim().replace(/[.#$[\]/]/g, '-').replace(/\s+/g, '_').slice(0, 100);
}

const DEFAULT_SETTINGS: GameSettings = {
  questionCount: 10,
  difficulty: 'mixed',
  timePerQuestion: 15,
  audience: 'family',
  questionAdvanceMode: 'manual',
};

function formatError(err: unknown): string {
  const fsErr = err as FirestoreError | null;
  if (fsErr && 'code' in fsErr && fsErr.code === 'resource-exhausted') {
    return 'יש עומס זמני, נסו שוב בעוד כמה דקות 🙏';
  }
  if (err instanceof Error) {
    if (err.message.toLowerCase().includes('resource-exhausted')) {
      return 'יש עומס זמני, נסו שוב בעוד כמה דקות 🙏';
    }
    return err.message;
  }
  return 'שגיאה לא צפויה. נסה שוב.';
}

interface GameDocData {
  hostUserId: string;
  topic: string;
  originalTopic: string;
  suggestedTopic: string | null;
  sourceMode: string;
  status: GameStatus;
  currentQuestionIndex: number;
  joinCode: string;
  settings: GameSettings;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  questionStartedAt: number | null;
}

interface ParticipantDocData {
  nickname: string;
  avatar: string;
  avatarDataUrl?: string;
  joinedAt: number;
  isHost: boolean;
  score: number;
  lastAnswer: ParticipantAnswer | null;
}

function buildParticipant(id: string, data: ParticipantDocData): Participant {
  return {
    id,
    nickname: data.nickname,
    avatar: data.avatar,
    avatarDataUrl: data.avatarDataUrl,
    score: data.score ?? 0,
    joinedAt: data.joinedAt,
    isReady: true,
    lastAnswer: data.lastAnswer ?? null,
    isHost: data.isHost ?? false,
  };
}

export function useFirestoreGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(() => generateId());

  const listenerUnsubRef = useRef<(() => void) | null>(null);
  const questionsRef = useRef<QuestionFull[]>([]);
  const questionStartedAtRef = useRef<number>(0);
  const gameDocDataRef = useRef<(GameDocData & { id: string }) | null>(null);
  const participantsMapRef = useRef<Record<string, Participant>>({});
  const currentGameIdRef = useRef<string | null>(null);
  const joinCodeRef = useRef<string | null>(null);
  // Prevents participants listener from calling setGame while game doc listener
  // is mid-flight fetching answersPrivate (avoid flash with correctIndex=-1)
  const fetchingAnswersRef = useRef(false);

  function rebuildAndSetGame() {
    const docData = gameDocDataRef.current;
    if (!docData) return;
    setGame({
      id: docData.id,
      hostUserId: docData.hostUserId,
      topic: docData.topic,
      originalTopic: docData.originalTopic,
      suggestedTopic: docData.suggestedTopic,
      sourceMode: docData.sourceMode as 'generalTopic' | 'privateData',
      status: docData.status,
      settings: docData.settings,
      currentQuestionIndex: docData.currentQuestionIndex,
      questions: [...questionsRef.current],
      participants: { ...participantsMapRef.current },
      joinCode: docData.joinCode,
      joinLink: `${window.location.origin}?join=${docData.joinCode}`,
      createdAt: docData.createdAt,
      startedAt: docData.startedAt,
      finishedAt: docData.finishedAt,
    });
  }

  function attachListeners(gameId: string) {
    if (listenerUnsubRef.current) listenerUnsubRef.current();

    const gameRef = doc(fsdb, 'games', gameId);
    const participantsColRef = collection(fsdb, 'games', gameId, 'participants');

    const gameUnsub = onSnapshot(gameRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as GameDocData;
      gameDocDataRef.current = { ...data, id: gameId };

      if (typeof data.questionStartedAt === 'number') {
        questionStartedAtRef.current = data.questionStartedAt;
      }

      // For participants: load correctIndex from answersPrivate when reveal becomes active
      const status = data.status;
      const qIndex = data.currentQuestionIndex;
      if (['reveal', 'leaderboard', 'finished'].includes(status)) {
        const q = questionsRef.current[qIndex];
        if (q && q.correctIndex < 0) {
          fetchingAnswersRef.current = true;
          try {
            const privSnap = await getDoc(
              doc(fsdb, 'games', gameId, 'answersPrivate', String(qIndex))
            );
            if (privSnap.exists()) {
              const priv = privSnap.data() as { correctIndex: number; explanation: string };
              questionsRef.current[qIndex] = {
                ...questionsRef.current[qIndex],
                correctIndex: priv.correctIndex,
                explanation: priv.explanation,
              };
            }
          } catch {
            // non-fatal: RevealScreen may not highlight correct answer
          } finally {
            fetchingAnswersRef.current = false;
          }
        }
      }

      rebuildAndSetGame();
    });

    const participantsUnsub = onSnapshot(participantsColRef, (snap) => {
      const participants: Record<string, Participant> = {};
      snap.docs.forEach((d) => {
        participants[d.id] = buildParticipant(d.id, d.data() as ParticipantDocData);
      });
      participantsMapRef.current = participants;
      // Skip setGame if game doc listener is mid-flight fetching answers
      if (!fetchingAnswersRef.current) {
        rebuildAndSetGame();
      }
    });

    listenerUnsubRef.current = () => {
      gameUnsub();
      participantsUnsub();
    };
  }

  useEffect(() => {
    return () => {
      if (listenerUnsubRef.current) listenerUnsubRef.current();
    };
  }, []);

  // Auth state + page-refresh session recovery
  useEffect(() => {
    return onAuthChange((uid) => {
      if (!uid) return;
      setCurrentUserId(uid);

      if (!currentGameIdRef.current) {
        const storedGameId = sessionStorage.getItem(SS_GAME_ID);
        const storedUserId = sessionStorage.getItem(SS_USER_ID);
        if (storedGameId && storedUserId === uid) {
          void (async () => {
            try {
              const qSnaps = await getDocs(
                collection(fsdb, 'games', storedGameId, 'questionsPublic')
              );
              questionsRef.current = qSnaps.docs
                .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                .map((d) => {
                  const q = d.data() as { id: string; question: string; answers: string[] };
                  return { ...q, correctIndex: -1, explanation: '' };
                });
              currentGameIdRef.current = storedGameId;
              attachListeners(storedGameId);
            } catch {
              sessionStorage.removeItem(SS_GAME_ID);
              sessionStorage.removeItem(SS_USER_ID);
            }
          })();
        }
      }
    });
  }, []);

  // ── createGame ───────────────────────────────────────────────────────────────
  const createGame = useCallback(
    async (
      topic: string,
      settings: Partial<GameSettings> = {},
      hostNickname?: string,
      hostAvatarDataUrl?: string
    ): Promise<Game> => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await ensureSignedIn();
        const uid = user.uid;
        setCurrentUserId(uid);

        const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
        const { questions, suggestedTopic } = await activeQuestionGenerator.generate({
          topic,
          count: mergedSettings.questionCount,
          difficulty: mergedSettings.difficulty,
          audience: mergedSettings.audience,
        });
        const resolvedSuggestedTopic =
          questions.length < mergedSettings.questionCount ? (suggestedTopic ?? null) : null;

        const gameId = generateId();
        const joinCode = generateJoinCode();

        const gameDocData: GameDocData = {
          hostUserId: uid,
          topic,
          originalTopic: topic,
          suggestedTopic: resolvedSuggestedTopic,
          sourceMode: 'generalTopic',
          status: 'waiting',
          currentQuestionIndex: 0,
          joinCode,
          settings: mergedSettings,
          createdAt: Date.now(),
          startedAt: null,
          finishedAt: null,
          questionStartedAt: null,
        };

        const batch = writeBatch(fsdb);

        batch.set(doc(fsdb, 'games', gameId), gameDocData);

        questions.forEach((q, i) => {
          batch.set(doc(fsdb, 'games', gameId, 'questionsPublic', String(i)), {
            id: q.id,
            question: q.question,
            answers: q.answers,
          });
          batch.set(doc(fsdb, 'games', gameId, 'answersPrivate', String(i)), {
            correctIndex: q.correctIndex,
            explanation: q.explanation ?? '',
          });
        });

        const hostParticipantData: ParticipantDocData = {
          nickname: hostNickname || 'מנהל המשחק',
          avatar: hostAvatarDataUrl ? '' : '👑',
          ...(hostAvatarDataUrl ? { avatarDataUrl: hostAvatarDataUrl } : {}),
          score: 0,
          joinedAt: Date.now(),
          isHost: true,
          lastAnswer: null,
        };
        batch.set(doc(fsdb, 'games', gameId, 'participants', uid), hostParticipantData);

        batch.set(doc(fsdb, 'gameCodes', joinCode), { gameId, createdAt: Date.now() });

        const topicKey = topicToKey(topic);
        batch.set(
          doc(fsdb, 'topicStats', topicKey),
          { topic: topic.trim(), lastUsedAt: Date.now(), count: increment(1) },
          { merge: true }
        );

        await batch.commit();

        // Host has full questions with correctIndex in memory
        questionsRef.current = questions.map((q) => ({ ...q }));
        currentGameIdRef.current = gameId;
        joinCodeRef.current = joinCode;
        sessionStorage.setItem(SS_GAME_ID, gameId);
        sessionStorage.setItem(SS_USER_ID, uid);

        const hostParticipant: Participant = {
          id: uid,
          nickname: hostNickname || 'מנהל המשחק',
          avatar: hostAvatarDataUrl ? '' : '👑',
          avatarDataUrl: hostAvatarDataUrl,
          score: 0,
          joinedAt: Date.now(),
          isReady: true,
          lastAnswer: null,
          isHost: true,
        };

        const localGame: Game = {
          id: gameId,
          hostUserId: uid,
          topic,
          originalTopic: topic,
          suggestedTopic: resolvedSuggestedTopic,
          sourceMode: 'generalTopic',
          status: 'waiting',
          settings: mergedSettings,
          currentQuestionIndex: 0,
          questions,
          participants: { [uid]: hostParticipant },
          joinCode,
          joinLink: `${window.location.origin}?join=${joinCode}`,
          createdAt: gameDocData.createdAt,
          startedAt: null,
          finishedAt: null,
        };

        // Set state immediately so WaitingRoom renders without flash
        gameDocDataRef.current = { ...gameDocData, id: gameId };
        participantsMapRef.current = { [uid]: hostParticipant };
        setGame(localGame);

        attachListeners(gameId);
        return localGame;
      } catch (err) {
        setError(formatError(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── joinByCode ───────────────────────────────────────────────────────────────
  const joinByCode = useCallback(
    async (code: string, nickname: string, avatar: string, avatarDataUrl?: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await ensureSignedIn();
        const uid = user.uid;
        setCurrentUserId(uid);

        const codeSnap = await getDoc(doc(fsdb, 'gameCodes', code));
        if (!codeSnap.exists()) {
          throw new Error('קוד המשחק לא נמצא. בדוק שהקוד נכון ונסה שוב.');
        }
        const { gameId } = codeSnap.data() as { gameId: string };

        const gameSnap = await getDoc(doc(fsdb, 'games', gameId));
        if (!gameSnap.exists()) {
          throw new Error('המשחק לא נמצא. ייתכן שהסתיים.');
        }
        const gameData = gameSnap.data() as GameDocData;
        if (gameData.status !== 'waiting') {
          throw new Error('המשחק כבר התחיל. לא ניתן להצטרף כעת.');
        }

        // Load questions (no correctIndex for participants)
        const qSnaps = await getDocs(collection(fsdb, 'games', gameId, 'questionsPublic'));
        questionsRef.current = qSnaps.docs
          .sort((a, b) => parseInt(a.id) - parseInt(b.id))
          .map((d) => {
            const q = d.data() as { id: string; question: string; answers: string[] };
            return { ...q, correctIndex: -1, explanation: '' };
          });

        const participantData: ParticipantDocData = {
          nickname,
          avatar,
          ...(avatarDataUrl ? { avatarDataUrl } : {}),
          score: 0,
          joinedAt: Date.now(),
          isHost: false,
          lastAnswer: null,
        };
        await setDoc(doc(fsdb, 'games', gameId, 'participants', uid), participantData);

        currentGameIdRef.current = gameId;
        joinCodeRef.current = gameData.joinCode;
        sessionStorage.setItem(SS_GAME_ID, gameId);
        sessionStorage.setItem(SS_USER_ID, uid);

        // Set initial state immediately
        gameDocDataRef.current = { ...gameData, id: gameId };
        participantsMapRef.current = {
          [uid]: buildParticipant(uid, participantData),
        };

        attachListeners(gameId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : formatError(err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── addParticipant (demo bot — host only) ────────────────────────────────────
  const addParticipant = useCallback(async (nickname: string, avatar: string): Promise<string> => {
    const gid = currentGameIdRef.current;
    if (!gid) return '';
    const participantId = generateId();
    await setDoc(doc(fsdb, 'games', gid, 'participants', participantId), {
      nickname,
      avatar,
      score: 0,
      joinedAt: Date.now(),
      isHost: false,
      lastAnswer: null,
    } as ParticipantDocData);
    return participantId;
  }, []);

  // ── startGame ────────────────────────────────────────────────────────────────
  const startGame = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid) return;
    await updateDoc(doc(fsdb, 'games', gid), {
      status: 'question',
      currentQuestionIndex: 0,
      questionStartedAt: Date.now(),
      startedAt: Date.now(),
    });
  }, []);

  // ── submitAnswer (participant writes own answer) ──────────────────────────────
  const submitAnswer = useCallback(
    async (participantId: string, answerIndex: number, _questionStartTime: number) => {
      const gid = currentGameIdRef.current;
      if (!gid) return;
      await updateDoc(doc(fsdb, 'games', gid, 'participants', participantId), {
        lastAnswer: {
          answerIndex,
          answeredAt: Date.now(),
          isCorrect: false,
          pointsEarned: 0,
        },
      });
    },
    []
  );

  // ── simulateBotAnswers (host only) ───────────────────────────────────────────
  const simulateBotAnswers = useCallback(
    async (questionStartTime: number) => {
      const gid = currentGameIdRef.current;
      if (!gid || !game) return;

      const question = questionsRef.current[game.currentQuestionIndex];
      if (!question) return;

      const totalTimeMs = game.settings.timePerQuestion * 1000;
      const batch = writeBatch(fsdb);
      let hasUpdates = false;

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
        batch.update(doc(fsdb, 'games', gid, 'participants', p.id), {
          lastAnswer: {
            answerIndex,
            answeredAt: answerIndex !== null ? questionStartTime + responseTime : null,
            isCorrect: false,
            pointsEarned: 0,
          },
        });
        hasUpdates = true;
      });

      if (hasUpdates) await batch.commit();
    },
    [game]
  );

  // ── revealAnswer (host scores all participants, updates status) ───────────────
  const revealAnswer = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid || !game) return;

    const qIndex = game.currentQuestionIndex;
    const question = questionsRef.current[qIndex];
    if (!question) return;

    const questionStartedAt = questionStartedAtRef.current;
    const totalTimeMs = game.settings.timePerQuestion * 1000;
    const batch = writeBatch(fsdb);

    Object.values(game.participants)
      .filter((p) => !p.isHost)
      .forEach((p) => {
        const ans = p.lastAnswer;
        const updates: Record<string, unknown> = {};

        if (!ans || ans.answerIndex === null) {
          updates.lastAnswer = { answerIndex: null, answeredAt: null, isCorrect: false, pointsEarned: 0 };
        } else {
          const isCorrect = ans.answerIndex === question.correctIndex;
          const elapsed = (ans.answeredAt ?? Date.now()) - questionStartedAt;
          const remaining = Math.max(0, totalTimeMs - elapsed);
          const points = calculateScore(isCorrect, remaining, totalTimeMs);
          updates.lastAnswer = {
            answerIndex: ans.answerIndex,
            answeredAt: ans.answeredAt,
            isCorrect,
            pointsEarned: points,
          };
          if (isCorrect) updates.score = (p.score ?? 0) + points;
        }

        batch.update(doc(fsdb, 'games', gid, 'participants', p.id), updates);
      });

    batch.update(doc(fsdb, 'games', gid), { status: 'reveal' });
    await batch.commit();
  }, [game]);

  // ── showLeaderboard ──────────────────────────────────────────────────────────
  const showLeaderboard = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid) return;
    await updateDoc(doc(fsdb, 'games', gid), { status: 'leaderboard' });
  }, []);

  // ── nextQuestion ─────────────────────────────────────────────────────────────
  const nextQuestion = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid || !game) return;

    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex >= questionsRef.current.length) {
      await updateDoc(doc(fsdb, 'games', gid), { status: 'finished', finishedAt: Date.now() });
      return;
    }

    const batch = writeBatch(fsdb);
    Object.keys(game.participants).forEach((pid) => {
      batch.update(doc(fsdb, 'games', gid, 'participants', pid), { lastAnswer: null });
    });
    batch.update(doc(fsdb, 'games', gid), {
      currentQuestionIndex: nextIndex,
      status: 'question',
      questionStartedAt: Date.now(),
    });
    await batch.commit();
  }, [game]);

  // ── finishGame ───────────────────────────────────────────────────────────────
  const finishGame = useCallback(async () => {
    const gid = currentGameIdRef.current;
    if (!gid) return;
    await updateDoc(doc(fsdb, 'games', gid), { status: 'finished', finishedAt: Date.now() });
  }, []);

  // ── resetGame ────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    if (listenerUnsubRef.current) {
      listenerUnsubRef.current();
      listenerUnsubRef.current = null;
    }

    const gid = currentGameIdRef.current;
    const jc = joinCodeRef.current;
    const currentGame = game;

    if (gid && currentGame) {
      // Write analytics summary (fire-and-forget)
      void setDoc(doc(fsdb, 'gameStats', gid), {
        createdAt: currentGame.createdAt,
        startedAt: currentGame.startedAt,
        finishedAt: currentGame.finishedAt ?? Date.now(),
        topic: currentGame.topic,
        participantCount: Object.values(currentGame.participants).length,
        questionCount: currentGame.settings.questionCount,
      });

      // Delete all game data in one batch
      void (async () => {
        try {
          const batch = writeBatch(fsdb);
          const qCount = currentGame.settings.questionCount;
          const participantIds = Object.keys(currentGame.participants);

          batch.delete(doc(fsdb, 'games', gid));
          if (jc) batch.delete(doc(fsdb, 'gameCodes', jc));

          for (let i = 0; i < qCount; i++) {
            batch.delete(doc(fsdb, 'games', gid, 'questionsPublic', String(i)));
            batch.delete(doc(fsdb, 'games', gid, 'answersPrivate', String(i)));
          }
          participantIds.forEach((uid) => {
            batch.delete(doc(fsdb, 'games', gid, 'participants', uid));
          });

          await batch.commit();
        } catch {
          // Non-fatal: orphaned game data is harmless
        }
      })();
    }

    questionsRef.current = [];
    questionStartedAtRef.current = 0;
    gameDocDataRef.current = null;
    participantsMapRef.current = {};
    currentGameIdRef.current = null;
    joinCodeRef.current = null;
    sessionStorage.removeItem(SS_GAME_ID);
    sessionStorage.removeItem(SS_USER_ID);
    setGame(null);
    setError(null);
  }, [game]);

  // ── setStatus ────────────────────────────────────────────────────────────────
  const setStatus = useCallback(async (status: GameStatus) => {
    const gid = currentGameIdRef.current;
    if (!gid) return;
    await updateDoc(doc(fsdb, 'games', gid), { status });
  }, []);

  // ── getLeaderboard ───────────────────────────────────────────────────────────
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
