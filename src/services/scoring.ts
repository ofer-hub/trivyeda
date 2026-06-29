// מנגנון ניקוד טריווידע
// תשובה נכונה: 500 + (remainingTime / totalTime) * 500
// תשובה שגויה / אי מענה: 0 נקודות

export function calculateScore(
  isCorrect: boolean,
  remainingTimeMs: number,
  totalTimeMs: number
): number {
  if (!isCorrect) return 0;

  const ratio = Math.max(0, Math.min(1, remainingTimeMs / totalTimeMs));
  const score = 500 + ratio * 500;
  return Math.round(score);
}
