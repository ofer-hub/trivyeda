// שכבת שירות לייצור שאלות
// כרגע: mock בלבד
// בעתיד: להחליף ל-geminiQuestionGenerator
// חשוב: אין שירות בתשלום, אין API key, אין חיוב

import type { QuestionFull, Difficulty, Audience } from '../types/game';
import { getDemoQuestions } from '../data/demoQuestions';

export interface QuestionGeneratorOptions {
  topic: string;
  count: number;
  difficulty: Difficulty;
  audience: Audience;
}

export interface QuestionGenerator {
  generate(options: QuestionGeneratorOptions): Promise<QuestionFull[]>;
}

// מימוש Mock — לשימוש כרגע
export const mockQuestionGenerator: QuestionGenerator = {
  async generate({ topic, count }: QuestionGeneratorOptions): Promise<QuestionFull[]> {
    // סימולציה של השהייה קצרה (כמו קריאת API)
    await new Promise((resolve) => setTimeout(resolve, 800));
    return getDemoQuestions(topic, count);
  },
};

// ייצוא ה-generator הפעיל
// כאשר יהיה Gemini — רק לשנות את השורה הזאת
export const activeQuestionGenerator: QuestionGenerator = mockQuestionGenerator;
