export const config = { runtime: 'edge' };

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'קלה',
  medium: 'בינונית',
  hard: 'קשה',
  mixed: 'מעורבת (שילוב של קלות, בינוניות וקשות)',
};

const AUDIENCE_LABELS: Record<string, string> = {
  children: 'ילדים (גיל 7–12)',
  teens: 'בני נוער (גיל 12–18)',
  adults: 'מבוגרים',
  family: 'משפחה (מגוון גילאים)',
};

const SYSTEM_PROMPT = `אתה מומחה טריוויה שמכין שאלות לחידון קבוצתי בסגנון Kahoot בעברית.

החידון מיועד לנושאים מגוונים לחלוטין — כולל נושאים איזוטריים, נישתיים, תרבותיים, היסטוריים, טכניים, מוזרים ולא מיינסטרימיים.

כללים מחייבים:
• קבל כל נושא ברצינות, גם אם הוא יוצא דופן, נישתי או לא מוכר.
• אם הנושא צר מדי — שאל על מושגים מרכזיים, היסטוריה, דמויות, מקומות, חפצים, אירועים או הקשר תרבותי/טכני סמוך.
• אל תמציא עובדות. אם אינך בטוח בעובדה — אל תשתמש בה. הרחב לנושא קרוב ואמין, או החזר פחות שאלות.
• לכל שאלה תשובה נכונה אחת ברורה בלבד.
• המסיחים (תשובות שגויות) חייבים להיות שגויים בוודאות — לא רק פחות נכונים מהתשובה הנכונה.
• הימנע משאלות על מידע שמשתנה לאורך זמן (שיאים עדכניים, בעלי תפקידים נוכחיים וכו׳).
• עברית טבעית וברורה. שאלות ותשובות קצרות ככל האפשר.

פורמט תגובה — JSON בלבד, ללא Markdown, ללא הסברים, ללא טקסט לפני ואחרי ה-JSON.`;

function buildUserPrompt(topic: string, count: number, difficulty: string, audience: string): string {
  return `צור בדיוק ${count} שאלות טריוויה על הנושא: "${topic}"
רמת קושי: ${DIFFICULTY_LABELS[difficulty] ?? difficulty}
קהל יעד: ${AUDIENCE_LABELS[audience] ?? audience}

החזר את הפורמט הזה בדיוק:
{
  "questions": [
    {
      "question": "טקסט השאלה",
      "answers": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
      "correctIndex": 0,
      "explanation": "הסבר קצר מדוע זו התשובה הנכונה"
    }
  ],
  "suggestedTopic": "אם הנושא רחב מדי להשאיר ריק, אם הנושא צר מדי — כתוב כאן נושא רחב יותר שיאפשר יותר שאלות. לדוגמה: אם הנושא הוא 'מלפפונים חמוצים' הצע 'חמוצים ושיטות כבישה בעולם'."
}`;
}

interface RawQuestion {
  question: string;
  answers: string[];
  correctIndex: number;
  explanation: string;
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isValidQuestion(q: unknown): q is RawQuestion {
  if (!q || typeof q !== 'object') return false;
  const obj = q as Record<string, unknown>;
  if (typeof obj.question !== 'string' || obj.question.trim().length === 0 || obj.question.length > 300) return false;
  if (!Array.isArray(obj.answers) || obj.answers.length !== 4) return false;
  if (!(obj.answers as unknown[]).every((a) => typeof a === 'string' && (a as string).trim().length > 0 && (a as string).length <= 200)) return false;
  const ci = obj.correctIndex;
  if (typeof ci !== 'number' || !Number.isInteger(ci) || ci < 0 || ci > 3) return false;
  if (new Set((obj.answers as string[]).map(norm)).size !== 4) return false;
  if (typeof obj.explanation !== 'string') return false;
  return true;
}

function deduplicateQuestions(questions: RawQuestion[]): RawQuestion[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    const key = norm(q.question);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[generate-questions] GROQ_API_KEY not configured');
    return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  const body = await req.json() as { topic: string; count: number; difficulty: string; audience: string };
  const { topic, difficulty, audience } = body;
  const count = Math.min(Math.max(1, Number(body.count)), 15);

  if (!topic || !count) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  console.log('[generate-questions] called | topic:', topic, '| count:', count, '| hasApiKey: true');

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(topic, count, difficulty, audience) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  console.log('[generate-questions] Groq status:', groqRes.status);

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    console.error('[generate-questions] Groq error:', groqRes.status, errText.slice(0, 200));
    return Response.json({ error: 'Groq API error' }, { status: 502 });
  }

  const data = await groqRes.json() as { choices: { message: { content: string } }[] };
  const text = data?.choices?.[0]?.message?.content ?? '';

  if (!text) {
    console.error('[generate-questions] Empty response from Groq');
    return Response.json({ error: 'Empty response' }, { status: 502 });
  }

  let questions: RawQuestion[];
  let suggestedTopic: string | undefined;

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const rawArray = Array.isArray(parsed)
      ? parsed
      : ((parsed.questions ?? []) as unknown[]);
    const valid = rawArray.filter(isValidQuestion);
    questions = deduplicateQuestions(valid);
    if (typeof parsed.suggestedTopic === 'string' && parsed.suggestedTopic.trim()) {
      suggestedTopic = parsed.suggestedTopic.trim();
    }
  } catch {
    console.error('[generate-questions] JSON parse error');
    return Response.json({ error: 'Invalid JSON from Groq' }, { status: 502 });
  }

  console.log('[generate-questions] returning', questions.length, 'valid questions of', count, 'requested');

  const result: Record<string, unknown> = { questions };
  if (questions.length < count && suggestedTopic) {
    result.suggestedTopic = suggestedTopic;
  }
  return Response.json(result);
}
