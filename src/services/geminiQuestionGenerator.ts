import type { QuestionGenerator, QuestionGeneratorOptions, GenerateResult } from './questionGenerator';
import type { QuestionFull } from '../types/game';
import { getDemoQuestions } from '../data/demoQuestions';

export const geminiQuestionGenerator: QuestionGenerator = {
  async generate({ topic, count, difficulty, audience }: QuestionGeneratorOptions): Promise<GenerateResult> {
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count, difficulty, audience }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json() as { questions: Array<Omit<QuestionFull, 'id'>> | null; suggestedTopic?: string };
      const rawQuestions = Array.isArray(data?.questions) ? data.questions : [];

      if (rawQuestions.length === 0) {
        if (data?.suggestedTopic) {
          return { questions: [], suggestedTopic: data.suggestedTopic };
        }
        return { questions: getDemoQuestions(topic, count) };
      }

      const questions = rawQuestions.map((q, i) => ({ ...q, id: `ai-${Date.now()}-${i}` }));
      return { questions, suggestedTopic: data?.suggestedTopic };
    } catch {
      return { questions: getDemoQuestions(topic, count) };
    }
  },
};
