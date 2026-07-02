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
      const aiQuestions = raw.map((q, i) => ({ ...q, id: `ai-${Date.now()}-${i}` }));

      if (aiQuestions.length >= count) return aiQuestions;

      // Partial fallback: fill missing slots with demo questions
      const missing = count - aiQuestions.length;
      const demo = getDemoQuestions(topic, missing).slice(0, missing);
      return [...aiQuestions, ...demo];
    } catch {
      return getDemoQuestions(topic, count);
    }
  },
};
