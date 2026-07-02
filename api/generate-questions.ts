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
{
  "questions": [
    {
      "question": "טקסט השאלה",
      "answers": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
      "correctIndex": 0,
      "explanation": "הסבר קצר מדוע זו התשובה הנכונה"
    }
  ]
}`;
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
      messages: [{ role: 'user', content: buildPrompt(topic, count, difficulty, audience) }],
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

  let questions: unknown;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown> | unknown[];
    // Groq json_object mode returns an object — extract .questions array; fall back if model returns array directly
    questions = Array.isArray(parsed)
      ? parsed
      : ((parsed as Record<string, unknown>).questions ?? []);
  } catch {
    console.error('[generate-questions] JSON parse error from Groq response');
    return Response.json({ error: 'Invalid JSON from Groq' }, { status: 502 });
  }

  return Response.json(questions);
}
