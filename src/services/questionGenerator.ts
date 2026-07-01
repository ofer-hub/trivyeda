import type { QuestionFull, Difficulty, Audience } from '../types/game';
import { getDemoQuestions } from '../data/demoQuestions';
import { geminiQuestionGenerator } from './geminiQuestionGenerator';

export interface QuestionGeneratorOptions {
  topic: string;
  count: number;
  difficulty: Difficulty;
  audience: Audience;
}

export interface QuestionGenerator {
  generate(options: QuestionGeneratorOptions): Promise<QuestionFull[]>;
}

export const mockQuestionGenerator: QuestionGenerator = {
  async generate({ topic, count }: QuestionGeneratorOptions): Promise<QuestionFull[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return getDemoQuestions(topic, count);
  },
};

export const activeQuestionGenerator: QuestionGenerator = geminiQuestionGenerator;
