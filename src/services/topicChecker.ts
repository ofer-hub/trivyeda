// בדיקת נושא — כרגע mock בלבד
// בעתיד: AI יבדוק אם הנושא מתאים

import type { TopicCheck } from '../types/game';

interface TopicRule {
  keywords: string[];
  result: 'approved' | 'needs_refinement' | 'rejected';
  suggestedTopic?: string;
  recommendedCount?: 5 | 10 | 15;
  message?: string;
}

const REJECTED_PATTERNS = [
  'גזענות', 'אלימות', 'פורנו', 'נשק', 'טרור', 'הרג', 'ג\'יהאד',
  'כישוף', 'כת', 'שטן', 'שנאה',
];

const REFINEMENT_RULES: TopicRule[] = [
  {
    keywords: ['מלפפון', 'חמוץ', 'כבישה', 'חמוצים'],
    result: 'needs_refinement',
    suggestedTopic: 'חמוצים, כבישה ומאכלים משומרים',
    recommendedCount: 5,
  },
  {
    keywords: ['חתול שלי', 'כלב שלי', 'בעל החיים שלי'],
    result: 'needs_refinement',
    suggestedTopic: 'בעלי חיים מחמד',
    recommendedCount: 5,
  },
  {
    keywords: ['מה אכלתי', 'ארוחת בוקר'],
    result: 'needs_refinement',
    suggestedTopic: 'אוכל בריא וארוחות',
    recommendedCount: 5,
  },
];

const APPROVED_KEYWORDS = [
  'ישראל', 'תנ"ך', 'תנ״ך', 'היסטוריה', 'גאוגרפיה', 'מדע',
  'ספורט', 'מוסיקה', 'שירים', 'חגים', 'מסורת', 'פרשה', 'תורה',
  'מתמטיקה', 'מדעים', 'ביולוגיה', 'פיזיקה', 'כימיה', 'גוף',
  'בריאות', 'אמנות', 'ספרות', 'קולנוע', 'טלוויזיה', 'מחשבים',
  'טכנולוגיה', 'כלכלה', 'פוליטיקה', 'גאולוגיה', 'אסטרונומיה',
  'ידע כללי', 'שאלות כלליות', 'מלחמות', 'ארץ ישראל', 'ציונות',
  'יהדות', 'אנטומיה', 'כדורגל', 'כדורסל', 'שחייה', 'אולימפיאדה',
];

export function checkTopic(topic: string): TopicCheck {
  const lowerTopic = topic.trim().toLowerCase();

  if (!topic.trim()) {
    return {
      result: 'rejected',
      originalTopic: topic,
      message: 'אנא הזן נושא למשחק.',
    };
  }

  // בדיקת תוכן פוגעני
  for (const pattern of REJECTED_PATTERNS) {
    if (lowerTopic.includes(pattern.toLowerCase())) {
      return {
        result: 'rejected',
        originalTopic: topic,
        message: 'לא ניתן ליצור חידון בנושא זה. אנא בחר נושא אחר.',
      };
    }
  }

  // בדיקה אם צריך עידון
  for (const rule of REFINEMENT_RULES) {
    if (rule.keywords.some((kw) => lowerTopic.includes(kw.toLowerCase()))) {
      return {
        result: 'needs_refinement',
        originalTopic: topic,
        suggestedTopic: rule.suggestedTopic,
        recommendedCount: rule.recommendedCount,
        message: `נושא מקורי 😊 אפשר ליצור עליו חידון קצר, או להרחיב לנושא: ${rule.suggestedTopic}`,
      };
    }
  }

  // בדיקה אם מאושר
  for (const kw of APPROVED_KEYWORDS) {
    if (lowerTopic.includes(kw.toLowerCase())) {
      return {
        result: 'approved',
        originalTopic: topic,
      };
    }
  }

  // נושא לא מוכר — מאשרים עם הודעה (כי AI ידע לטפל בזה בעתיד)
  return {
    result: 'approved',
    originalTopic: topic,
  };
}
