import type { QuestionFull, Difficulty, Audience } from '../types/game';
import { getDemoQuestions } from '../data/demoQuestions';
import { geminiQuestionGenerator } from './geminiQuestionGenerator';

export interface QuestionGeneratorOptions {
  topic: string;
  count: number;
  difficulty: Difficulty;
  audience: Audience;
}

export interface GenerateResult {
  questions: QuestionFull[];
  suggestedTopic?: string;
}

export interface QuestionGenerator {
  generate(options: QuestionGeneratorOptions): Promise<GenerateResult>;
}

export const mockQuestionGenerator: QuestionGenerator = {
  async generate({ topic, count }: QuestionGeneratorOptions): Promise<GenerateResult> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { questions: getDemoQuestions(topic, count) };
  },
};

export const activeQuestionGenerator: QuestionGenerator = geminiQuestionGenerator;
