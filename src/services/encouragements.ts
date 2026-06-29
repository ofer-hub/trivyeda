// משפטי עידוד/עקיצה עדינה — לאחר גילוי תשובה
// כללים: שפה נקייה, בלי השפלה, בלי פגיעה — עקיצות עדינות בלבד

const correctMessages = [
  (name: string) => `יפה מאוד, ${name}! המוח על טורבו.`,
  (name: string) => `${name} בא חד היום.`,
  (_name: string) => `תשובה מדויקת. יש פה מישהו שלמד משהו בחיים.`,
  (name: string) => `${name} עושה את זה בקלות. מרשים.`,
  (name: string) => `נכון לחלוטין! ${name} יודע את העסק.`,
  (name: string) => `${name}, אם היית מחפש עבודה — קיבלת אותה.`,
  (name: string) => `מעולה ${name}! גם ממהרת, גם מדויקת.`,
  () => `תשובה נכונה! מישהו לא ישן בשיעורים.`,
];

const wrongMessages = [
  (name: string) => `${name}, זה היה קרוב. בערך כמו קריית שמונה לאילת.`,
  (name: string) => `לא נורא ${name}, גם ויקיפדיה טועה לפעמים. אולי.`,
  (name: string) => `${name}, הלב היה במקום הנכון. התשובה קצת פחות.`,
  (name: string) => `${name}, היית קרוב. מאוד לא קרוב, אבל קרוב.`,
  (name: string) => `${name}, ניסיון טוב! הפעם הבאה בטוח יוצא.`,
  () => `טעות קטנה. אנחנו לא סופרים, רק לומדים.`,
  (name: string) => `${name}, הגרסה שלך גם הגיונית. פשוט לא נכונה.`,
];

const noAnswerMessages = [
  (name: string) => `${name}, כבר התעוררת הבוקר? לא נראה לי...`,
  (name: string) => `${name} שומר כוחות לשאלה הבאה.`,
  (name: string) => `${name}, השאלה חיכתה. אתה פחות.`,
  (name: string) => `${name} בחר שיתוק ניתוחי. אסטרטגיה מעניינת.`,
  (name: string) => `${name}... טוב, בפעם הבאה.`,
  () => `מישהו החליט שדמיון עדיף על ידע. בסדר.`,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getEncouragement(
  result: 'correct' | 'wrong' | 'no_answer',
  name: string
): string {
  switch (result) {
    case 'correct':
      return pickRandom(correctMessages)(name);
    case 'wrong':
      return pickRandom(wrongMessages)(name);
    case 'no_answer':
      return pickRandom(noAnswerMessages)(name);
  }
}
