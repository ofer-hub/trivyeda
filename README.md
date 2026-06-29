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

## מצבי הפעלה

האפליקציה תומכת בשני מצבים — נשלטים דרך משתנה סביבה:

| משתנה | ערך | תיאור |
|-------|-----|--------|
| `VITE_GAME_MODE` | `mock` | כל הנתונים מקומיים, ללא Firebase (ברירת מחדל) |
| `VITE_GAME_MODE` | `firebase` | Firebase Realtime Database + Auth אנונימי |

---

## הגדרת Firebase (מצב `firebase`)

> **Firebase Spark (חינם) בלבד** — אין Blaze, אין Cloud Functions, אין Billing, אין Storage.

### שלב 1 — יצירת פרויקט Firebase

1. כנס ל-[Firebase Console](https://console.firebase.google.com/)
2. צור פרויקט חדש (אין צורך ב-Google Analytics)
3. הפעל **Authentication → Anonymous** (Sign-in providers → Anonymous → Enable)
4. הפעל **Realtime Database** (בחר אזור, התחל ב-test mode)

### שלב 2 — קבלת פרטי הפרויקט

בדף Firebase Console → Project settings → Your apps → Add web app → העתק את `firebaseConfig`.

### שלב 3 — קובץ סביבה

צור קובץ `.env.local` (לא מועלה ל-Git) ומלא:

```env
VITE_GAME_MODE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

### שלב 4 — כללי אבטחה (Realtime Database Rules)

עדכן את חוקי ה-Database מתוך Firebase Console → Realtime Database → Rules.
הכנס את תוכן קובץ `database.rules.json` מהפרויקט.

> **הערה:** כללי הנוכחיים מתאימים ל-MVP בלבד. לפני ייצור — הגבל קריאת `answersPrivate` לסטטוס reveal בלבד.

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
| חדר משחק | Firebase Realtime DB ✅ | — |
| משתתפים | Firebase Anonymous Auth ✅ | — |
| הזדהות מנהל | Firebase Anonymous Auth ✅ | Google Sign-In (עתידי) |

---

## מה לא מחובר עדיין

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
│   ├── firebase/
│   │   ├── config.ts          # אתחול Firebase מ-env vars
│   │   └── authService.ts     # כניסה אנונימית
│   ├── questionGenerator.ts   # ממשק — mock עכשיו, Gemini בעתיד
│   ├── topicChecker.ts        # בדיקת נושא — mock עכשיו, AI בעתיד
│   ├── scoring.ts             # מנגנון ניקוד
│   └── encouragements.ts      # משפטי עידוד
├── hooks/
│   ├── useGame.ts             # State machine מקומי (mock mode)
│   ├── useFirebaseGame.ts     # State machine מבוסס Firebase
│   └── useTimer.ts            # טיימר
├── components/
│   ├── Logo, Timer, AnswerButton, Podium
├── GameContent.tsx            # לוגיקת המסכים (shared)
├── App.tsx                    # dispatcher: mock / firebase
└── screens/
    ├── HomeScreen              # דף בית
    ├── CreateGameScreen        # יצירת משחק
    ├── JoinScreen              # הצטרפות בקוד
    ├── WaitingRoomScreen       # חדר המתנה
    ├── QuestionScreen          # שאלה פעילה
    ├── RevealScreen            # חשיפת תשובה
    ├── LeaderboardScreen       # דירוג ביניים
    └── GameOverScreen          # סיום משחק
```

---

## State Machine

```
waiting → question → reveal → leaderboard → question → ...→ finished
```

---

## Firebase Data Structure

```
games/{gameId}
  id, hostUserId, topic, status, settings,
  currentQuestionIndex, questionStartedAt, code, ...
  questionsPublic/{i}   ← id + question + answers (ללא תשובה נכונה)
  answersPrivate/{i}    ← correctIndex + explanation (מוסתר ממשתתפים)
  participants/{uid}    ← nickname, avatar, score, lastAnswer

gameCodes/{code}        ← { gameId }  (לחיפוש משחק לפי קוד)
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

1. **Gemini Free Tier** — ייצור שאלות AI
2. **PWA** — manifest + service worker + offline support
3. **Google Sign-In** — כניסת מנהל מזוהה (לשמירת היסטוריה)
4. **"חידון מהסיפור שלכם"** — חידון מתוך טקסט שהמשתמש מדביק

---

## טכנולוגיות

- React 19 + TypeScript
- Vite 8
- Firebase Realtime Database + Firebase Auth (Anonymous)
- CSS נקי (ללא ספריות UI)

---

*טריווידע — פרויקט של OferApps. לא מחובר עדיין ל-oferapps.co.il.*
