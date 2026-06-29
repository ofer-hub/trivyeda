// טריווידע — טיפוסי TypeScript
// מבנה זה מותאם לחיבור עתידי ל-Firebase
// כרגע הכל רץ בזיכרון מקומי (local state)

export type GameStatus =
  | 'setup'
  | 'waiting'
  | 'question'
  | 'reveal'
  | 'leaderboard'
  | 'finished';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type Audience = 'children' | 'teens' | 'adults' | 'family';
export type QuestionAdvanceMode = 'manual' | 'auto';
export type TopicCheckResult = 'approved' | 'needs_refinement' | 'rejected';
export type SourceMode = 'generalTopic' | 'privateData';

export interface GameSettings {
  questionCount: 5 | 10 | 15;
  difficulty: Difficulty;
  timePerQuestion: 10 | 15 | 20;
  audience: Audience;
  questionAdvanceMode: QuestionAdvanceMode;
}

// נתוני שאלה ציבוריים — בלי התשובה הנכונה (לשמירה עתידית ב-Firebase)
export interface QuestionPublic {
  id: string;
  question: string;
  answers: string[];
}

// נתוני תשובה פרטיים — נשמרים בנתיב נפרד ב-Firebase כדי לא לחשוף למשתתפים
export interface AnswerPrivate {
  questionId: string;
  correctIndex: number;
  explanation: string;
}

// שאלה מלאה — לשימוש פנימי במשחק (mock בלבד, לא נחשפת לטובת Firebase)
export interface QuestionFull extends QuestionPublic {
  correctIndex: number;
  explanation: string;
}

export interface ParticipantAnswer {
  answerIndex: number | null; // null = לא ענה
  answeredAt: number | null;  // timestamp
  isCorrect: boolean;
  pointsEarned: number;
}

export interface Participant {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  joinedAt: number;
  isReady: boolean;
  lastAnswer: ParticipantAnswer | null;
  isHost: boolean;
}

// מבנה המשחק הראשי — מתאים לעתיד ב-Firebase: games/{gameId}
export interface Game {
  id: string;
  hostUserId: string;
  topic: string;
  originalTopic: string;
  suggestedTopic: string | null;
  sourceMode: SourceMode;
  status: GameStatus;
  settings: GameSettings;
  currentQuestionIndex: number;
  questions: QuestionFull[];
  participants: Record<string, Participant>;
  joinCode: string;
  joinLink: string;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
}

// אנליטיקה — games/{gameId}/analytics
export interface GameAnalytics {
  totalParticipants: number;
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  totalNoAnswer: number;
}

// בדיקת נושא
export interface TopicCheck {
  result: TopicCheckResult;
  originalTopic: string;
  suggestedTopic?: string;
  message?: string;
  recommendedCount?: 5 | 10 | 15;
}

// דירוג
export interface LeaderboardEntry {
  participantId: string;
  nickname: string;
  avatar: string;
  score: number;
  rank: number;
  previousRank?: number;
}
