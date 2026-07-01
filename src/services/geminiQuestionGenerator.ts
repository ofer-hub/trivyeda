import type { QuestionGenerator, QuestionGeneratorOptions } from './questionGenerator';
import type { QuestionFull } from '../types/game';
import { getDemoQuestions } from '../data/demoQuestions';

export const geminiQuestionGenerator: QuestionGenerator = {
  async generate({ topic, count, difficulty, audience }: QuestionGeneratorOptions): Promise<QuestionFull[]> {
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count, difficulty, audience }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const raw = await res.json() as Array<Omit<QuestionFull, 'id'>>;
      return raw.map((q, i) => ({ ...q, id: `gemini-${Date.now()}-${i}` }));
    } catch {
      // fallback לשאלות demo אם Gemini נכשל
      return getDemoQuestions(topic, count);
    }
  },
};
