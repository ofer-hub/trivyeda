# 🧠 טריווידע

**הטריוויה שממציאה את עצמה**

אפליקציית טריוויה מרובת משתתפים בעברית, בסגנון Kahoot.
פותחה עבור: משפחות, חברים, קהילות, כיתות, ארגונים, ערבי חברה ואירועים.

---

## הרצה מקומית

```bash
npm install
npm run dev
```

פתח דפדפן בכתובת שמופיעה בטרמינל (בדרך כלל http://localhost:5173).

```bash
npm run build    # בניית גרסת ייצור
npm run lint     # בדיקת lint
```

---

## מה האפליקציה עושה (MVP)

1. **יוצר משחק** בוחר נושא ומגדיר: מספר שאלות, זמן, קושי, קהל יעד, קידום ידני/אוטומטי.
2. **הנושא נבדק** (כרגע mock) — אושר / מצריך עידון / נדחה.
3. **שאלות נוצרות** אוטומטית (כרגע שאלות דמו).
4. **חדר המתנה** — משתתפים נכנסים עם כינוי ואווטאר.
5. **מהלך המשחק**: שאלה → טיימר → חשיפת תשובה → דירוג → שאלה הבאה.
6. **סיום** עם פודיום, ניקוד סופי, ואפשרות לשחק שוב.

### מנגנון ניקוד
```
תשובה נכונה מהירה  = עד 1000 נקודות
תשובה נכונה איטית  = לפחות 500 נקודות
תשובה שגויה / לא ענה = 0 נקודות
```

---

## מה עדיין Mock

| רכיב | מצב עכשיו | מה יהיה בעתיד |
|------|-----------|---------------|
| ייצור שאלות | שאלות דמו מקומיות (120 שאלות ב-8 נושאים) | Gemini AI — Free Tier בלבד |
| בדיקת נושא | כללים מקומיים פשוטים | AI |
| חדר משחק | Local state, משתמש יחיד | Firebase Realtime DB |
| משתתפים | דמו מקומי | משתמשים אמיתיים עם Firebase |
| הזדהות מנהל | ללא — mock | Firebase Auth (Google) |

---

## מה לא מחובר עדיין

- **Firebase** — לא מוגדר, לא מחובר
- **Gemini AI** — לא מחובר
- **oferapps.co.il** — לא מחובר לאתר הבית
- **דשבורד מרכזי** — לא מחובר

---

## מבנה הפרויקט

```
src/
├── types/game.ts              # טיפוסי TypeScript — מבנה Firebase-ready
├── data/
│   ├── demoQuestions.ts       # 120 שאלות דמו ב-8 נושאים
│   ├── topics.ts              # נושאים מומלצים
│   └── avatars.ts             # רשימת אווטארים
├── services/
│   ├── questionGenerator.ts   # ממשק — mock עכשיו, Gemini בעתיד
│   ├── topicChecker.ts        # בדיקת נושא — mock עכשיו, AI בעתיד
│   ├── scoring.ts             # מנגנון ניקוד
│   └── encouragements.ts      # משפטי עידוד/עקיצה
├── hooks/
│   ├── useGame.ts             # State machine מלא
│   └── useTimer.ts            # טיימר
├── components/
│   ├── Logo, Timer, AnswerButton, Podium
└── screens/
    ├── HomeScreen              # דף בית
    ├── CreateGameScreen        # יצירת משחק
    ├── JoinScreen              # הצטרפות
    ├── WaitingRoomScreen       # חדר המתנה
    ├── QuestionScreen          # שאלה פעילה
    ├── RevealScreen            # חשיפת תשובה
    ├── LeaderboardScreen       # דירוג ביניים
    └── GameOverScreen          # סיום משחק
```

---

## State Machine

```
setup → waiting → question → reveal → leaderboard → question → ...→ finished
```

---

## ⚠️ כללי אפס עלויות — חובה לשמור

- **אין Firebase Blaze** — רק Firebase Spark (חינם)
- **אין Cloud Functions**
- **אין Billing**
- **Gemini — Free Tier בלבד** — אם המכסה נגמרת, מציגים הודעה ולא ממשיכים
- **אין API keys בקוד** — רק ב-.env.local שלא מועלה ל-Git

---

## השלבים הבאים המומלצים

1. **Firebase Auth** — כניסת מנהל משחק (Google Sign-In)
2. **Firebase Realtime DB** — חדר משחק אמיתי מרובה מכשירים
3. **Gemini Free Tier** — ייצור שאלות AI
4. **PWA** — manifest + service worker + offline support
5. **"חידון מהסיפור שלכם"** — חידון מתוך טקסט שהמשתמש מדביק

---

## טכנולוגיות

- React 19 + TypeScript
- Vite 8
- CSS נקי (ללא ספריות UI)

---

*טריווידע — פרויקט של OferApps. לא מחובר עדיין ל-oferapps.co.il.*
