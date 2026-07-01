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

function buildPrompt(topic: string, count: number, difficulty: string, audience: string): string {
  return `אתה יוצר שאלות טריוויה בעברית לחידון קבוצתי בסגנון Kahoot.

צור בדיוק ${count} שאלות על הנושא: "${topic}"
רמת קושי: ${DIFFICULTY_LABELS[difficulty] ?? difficulty}
קהל יעד: ${AUDIENCE_LABELS[audience] ?? audience}

דרישות:
- כל שאלה חייבת להיות עובדתית ומדויקת
- כל שאלה כוללת בדיוק 4 תשובות אפשריות
- התשובות השגויות (הסחות דעת) צריכות להיות סבירות אך לא נכונות
- ההסבר יהיה קצר (משפט אחד עד שניים)
- אל תחזור על שאלות דומות
- הכל בעברית בלבד

החזר JSON תקין בלבד, ללא כל טקסט נוסף, במבנה הזה:
[
  {
    "question": "טקסט השאלה",
    "answers": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
    "correctIndex": 0,
    "explanation": "הסבר קצר מדוע זו התשובה הנכונה"
  }
]`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const body = await req.json() as { topic: string; count: number; difficulty: string; audience: string };
  const { topic, difficulty, audience } = body;
  const count = Math.min(Math.max(1, Number(body.count)), 15);

  if (!topic || !count) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const prompt = buildPrompt(topic, count, difficulty, audience);

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    }
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error('[generate-questions] Gemini error:', geminiRes.status, errText.slice(0, 300));
    return Response.json({ error: 'Gemini API error' }, { status: 502 });
  }

  const data = await geminiRes.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';

  let questions: unknown;
  try {
    questions = JSON.parse(text);
  } catch {
    return Response.json({ error: 'Invalid JSON from Gemini' }, { status: 502 });
  }

  return Response.json(questions);
}
