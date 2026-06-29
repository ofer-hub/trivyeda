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

האפליקציה תומכת בשני מצבים דרך משתנה סביבה:

| `VITE_GAME_MODE` | תיאור |
|-----------------|--------|
| `mock` (ברירת מחדל) | כל הנתונים מקומיים. ללא Firebase. מתאים לפיתוח מקומי. |
| `firebase` | Firebase Realtime Database + Anonymous Auth. מרובת מכשירים בזמן אמת. |

---

## הגדרת Firebase (מצב `firebase`)

> **Firebase Spark (חינם) בלבד** — אין Blaze, אין Cloud Functions, אין Billing, אין Storage.

### שלב 1 — יצירת פרויקט Firebase

1. כנס ל-[Firebase Console](https://console.firebase.google.com/)
2. צור פרויקט חדש (אין צורך ב-Google Analytics)
3. הפעל **Authentication → Sign-in providers → Anonymous → Enable**
4. הפעל **Realtime Database** — בחר אזור, התחל ב-"Test mode"

### שלב 2 — קבלת פרטי הפרויקט

Firebase Console → Project settings → Your apps → Add web app → העתק את `firebaseConfig`.

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

Firebase Console → Realtime Database → Rules → הדבק את תוכן `database.rules.json` ופרסם.

---

## בדיקה עם שני טאבים

בדיקת סנכרון בסיסי (מנהל + משתתף אחד):

1. פתח שני טאבים בדפדפן על `http://localhost:5173` (עם `VITE_GAME_MODE=firebase`)
2. **טאב 1** — לחץ "צור משחק", בחר נושא, גדר הגדרות → "צור משחק"
3. **טאב 2** — לחץ "הצטרף למשחק", הזן את הקוד מטאב 1, בחר שם ואווטאר → "הצטרף"
4. **טאב 1** — ודא שהמשתתף מופיע בחדר ההמתנה באופן מיידי (ללא רענון)
5. **טאב 1** — לחץ "התחל משחק"
6. **שני הטאבים** — עוברים לשאלה ראשונה בזמן אמת
7. **טאב 2** — בחר תשובה
8. **טאב 1** — לחץ "חשוף תשובה" ← הניקוד מחושב
9. **שני הטאבים** — רואים מסך חשיפה עם ניקוד מעודכן
10. **טאב 1** — המשך לשאלות הבאות עד לסיום

בדיקת שני משתתפים (מנהל + 2 משתתפים):

1. פתח **שלושה טאבים**
2. טאב 1 — מנהל (יוצר משחק)
3. טאב 2 — משתתף א׳ (מצטרף עם הקוד)
4. טאב 3 — משתתף ב׳ (מצטרף עם אותו קוד)
5. ודא שאמצעי שלושת המשתתפים מופיעים בחדר ההמתנה
6. בצע משחק מלא — ודא שכל משתתף מקבל ניקוד נפרד ושדירוג נכון

### ריענון עמוד (Session Recovery)

בזמן שהמשחק פעיל:
- **מנהל** מרענן → מחזור לחדר ההמתנה / מסך הפעיל (ללא צורך להצטרף שוב)
- **משתתף** מרענן → מחזור למסך הפעיל (session שמור ב-sessionStorage)
- **אם sessionStorage נמחק** (חלון פרטי / רענון קשה) → חזרה למסך הבית בצורה נקייה

---

## מה האפליקציה עושה (MVP)

1. **יוצר משחק** בוחר נושא ומגדיר: מספר שאלות, זמן, קושי, קהל יעד, קידום ידני/אוטומטי.
2. **הנושא נבדק** (כרגע mock) — אושר / מצריך עידון / נדחה.
3. **שאלות נוצרות** אוטומטית (כרגע שאלות דמו).
4. **חדר המתנה** — משתתפים נכנסים עם קוד 6 ספרות, כינוי ואווטאר.
5. **מהלך המשחק**: שאלה → טיימר → חשיפת תשובה → דירוג → שאלה הבאה.
6. **סיום** עם פודיום, ניקוד סופי, ואפשרות לשחק שוב.

### מנגנון ניקוד
```
תשובה נכונה מהירה  = עד 1000 נקודות
תשובה נכונה איטית  = לפחות 500 נקודות
תשובה שגויה / לא ענה = 0 נקודות
```

---

## מה עדיין Mock / לא מחובר

| רכיב | מצב |
|------|-----|
| ייצור שאלות | שאלות דמו (120 שאלות ב-8 נושאים). Gemini עתידי — **לא מחובר** |
| בדיקת נושא | כללים מקומיים. AI עתידי — **לא מחובר** |
| חדר משחק | Firebase Realtime DB ✅ |
| הזדהות | Firebase Anonymous Auth ✅ |
| Deploy | **לא בוצע** — מצב פיתוח מקומי בלבד |
| oferapps.co.il | **לא מחובר** |
| דשבורד מרכזי | **לא מחובר** |
| Gemini AI | **לא מחובר** |
| שירותים בתשלום | **אין** — Firebase Spark חינם בלבד |

---

## ⚠️ מגבלות אבטחה לפני Production

הנושאים הבאים ידועים ומסומנים ב-TODO בקוד. יש לטפל בהם לפני שחרור ציבורי:

### 1. correctIndex גלוי ללקוחות
`answersPrivate` (הכולל את `correctIndex`) נטען לכל הלקוחות בזמן השאלה.  
**סיכון**: משתתף יכול לפתוח את כלי המפתח ולראות את התשובה הנכונה.  
**פתרון לפני Production**: להעביר `answersPrivate` רק כשסטטוס = `reveal`, דרך Cloud Functions (אסור ב-MVP) או fetch דו-שלבי.

### 2. נקודות מחושבות בצד ה-Host
הניקוד מחושב ב-JS של ה-Host ונכתב ל-Firebase.  
**סיכון**: Host זדוני יכול לשנות ניקוד ידנית (לא רלוונטי בשימוש משפחתי/פרטי).  
**פתרון לפני Production**: Cloud Functions לחישוב ניקוד (אסור ב-MVP).

### 3. `gameCodes` ללא בדיקת גיל / תוקף
כל קוד משחק שמור לצמיתות ב-DB.  
**פתרון לפני Production**: מחיקת קודים ישנים (TTL) דרך Scheduled Functions.

### 4. Participant יכול לדרוס את כל הנתונים האישיים שלו
הכלל `$participantId === auth.uid` מאפשר למשתתף לדרוס את כל נתוניו (nickname, avatar וכו׳).  
כרגע מוגבל ל-`isHost: false` בלבד.  
**פתרון לפני Production**: הגביל כתיבה ל-`lastAnswer` בלבד.

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
    ├── HomeScreen, CreateGameScreen, JoinScreen
    ├── WaitingRoomScreen, QuestionScreen
    ├── RevealScreen, LeaderboardScreen, GameOverScreen
```

---

## Firebase Data Structure

```
games/{gameId}
  id, hostUserId, topic, status, settings
  currentQuestionIndex, questionStartedAt, code
  createdAt, startedAt, finishedAt
  questionsPublic/{i}       ← id + question + answers (ללא correctIndex)
  answersPrivate/{i}        ← correctIndex + explanation
  participants/{uid}        ← nickname, avatar, score, lastAnswer, isHost
  analyticsPerQuestion/{i}  ← totalParticipants, totalAnswered, totalCorrect, ...

gameCodes/{code}            ← { gameId }
```

---

## State Machine

```
waiting → question → reveal → leaderboard → question → ... → finished
```

---

## ⚠️ כללי אפס עלויות — חובה לשמור

- **אין Firebase Blaze** — רק Firebase Spark (חינם)
- **אין Cloud Functions**
- **אין Firebase Storage**
- **אין Billing**
- **Gemini — לא מחובר עדיין**
- **אין API keys בקוד** — רק ב-.env.local שלא מועלה ל-Git
- **אין Deploy** — פיתוח מקומי בלבד בשלב הנוכחי

---

## השלבים הבאים המומלצים

1. **Gemini Free Tier** — ייצור שאלות AI
2. **PWA** — manifest + service worker + offline support
3. **Google Sign-In** — כניסת מנהל מזוהה (לשמירת היסטוריה)
4. **"חידון מהסיפור שלכם"** — חידון מתוך טקסט שהמשתמש מדביק

---

## טכנולוגיות

- React 19 + TypeScript + Vite 8
- Firebase Realtime Database + Firebase Auth (Anonymous)
- CSS נקי (ללא ספריות UI)
- oxlint

---

*טריווידע — פרויקט של OferApps. לא מחובר עדיין ל-oferapps.co.il.*
