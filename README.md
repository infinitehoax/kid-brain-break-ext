# 🧠 KidBrainBreak — Chrome Extension

> *Fun, interactive educational brain breaks injected right into your kid's active webpage — every 30 minutes!*

---

## ✨ What It Does

KidBrainBreak silently watches the clock. Every 30 minutes (configurable), it freezes whatever your kid is watching or doing and slides in a beautiful, full-screen quiz overlay right on top of the page. They answer a question, get XP, and get back to their day — smarter.

No new tab. No switching apps. Just a surprise pop-up demanding brain activity.

---

## 🎯 Epic Features At a Glance

| Feature | Details |
|---|---|
| ⏰ Smart Timer | `chrome.alarms` — fires every 30 mins (survives browser restarts) |
| 🎡 Spinning Wheel | Canvas-based friction wheel on the first break of the day |
| 🌈 Cool UI | Injected via Shadow DOM — cosmic toy aesthetic, full isolation |
| 🔇 Auto-Mute | Pauses all `<video>` and `<audio>` on every audible tab instantly |
| 📡 Remote JSON | Fetches questions from your GitHub — zero extension updates needed |
| 💾 Smart Cache | 6-hour cache — won't hammer GitHub on every break |
| 🔥 Streak Tracker | Daily streak counter with XP and time-bonus rewards |
| 13 Question Types | See the full list below |
| 3 Categories | IPA Transcription, YouTube Learner, Academic Quiz |

---

## 📚 The 3 Categories

### 🔤 1 — IPA Transcriber
Practice the International Phonetic Alphabet with a fully custom on-screen IPA keyboard built into the popup. Consonants, vowels, diphthongs, stress marks — all accessible with one tap. Great for language learners.

### ▶️ 2 — YouTube Learner
An educational YouTube video is embedded right inside the popup. The kid watches it, then answers a contextual question. Supports every question type.

### 📚 3 — Academic Quiz
Curriculum-aligned questions covering science, geography, history, maths, English grammar, and logic. 15+ questions included as a starter pack.

---

## 🎡 The Spinning Wheel

The **very first** break of each day triggers the wheel. It uses the HTML5 Canvas API with real physics:
- An initial random velocity is applied
- A friction multiplier (0.985) decelerates the wheel naturally
- The final resting angle is used to determine the outcome

**Outcomes:**
- 🙋 **You Pick!** → The kid selects their category from 3 animated cards
- 🎲 **System Picks** → A random category is chosen automatically

The selected category is saved for the rest of the day. All subsequent breaks use it automatically.

---

## 🕹️ 13 Question Types

All types are driven by JSON — no code changes needed to add new questions.

| # | Type Key | Description | Interaction |
|---|---|---|---|
| 1 | `multiple_choice` | 4-option MCQ | Tap a card |
| 2 | `true_false` | Classic True/False | Tap True or False |
| 3 | `fill_in_the_blank` | One or more missing words | Type into inline inputs |
| 4 | `connect_terms` | Match left column to right | Click left then right item |
| 5 | `organize_tags` | Drag word tags into labelled buckets | Drag & drop |
| 6 | `word_scramble` | Click tiles to unscramble a word | Tap tiles to build answer |
| 7 | `odd_one_out` | Find the item that doesn't belong | Tap the odd one |
| 8 | `categorize_items` | Sort items into groups | Drag & drop |
| 9 | `sequence_order` | Arrange items in the right order | Drag to reorder |
| 10 | `spell_it_out` | Click individual letters to build a word | Tap a letter pool |
| 11 | `short_answer` | Open text with fuzzy matching | Type anything |
| 12 | `ipa_transcription` | Build IPA text using on-screen keyboard | IPA keyboard |
| 13 | `youtube_question` | Any type + embedded YouTube video | Depends on question type |

> **Note:** `youtube_question` isn't a standalone type — any question can embed a video by including a `videoId` field.

---

## 🗂️ JSON Format Reference

Your `questions.json` (hosted on GitHub or bundled locally) follows this structure:

```json
{
  "version": "2.1.0",
  "questions": {
    "ipa": [ ...questions... ],
    "youtube": [ ...questions... ],
    "academic": [ ...questions... ]
  }
}
```

### Common Fields (all types)

```json
{
  "id": "unique-id-01",
  "type": "question_type_key",
  "prompt": "The question text shown to the user.",
  "hint": "Optional hint shown when they click 💡",
  "explanation": "Shown after answering — teaches the why.",
  "videoId": "YouTube video ID (optional — any type can have one)"
}
```

### Per-type Fields

**`multiple_choice`**
```json
{ "options": ["A","B","C","D"], "answer": "B" }
```

**`true_false`**
```json
{ "answer": true }
```

**`fill_in_the_blank`**
```json
{
  "prompt": "The capital of France is ___.",
  "blanks": ["Paris"]
}
```
Use `___` in the prompt for each blank. Provide a `blanks` array in matching order.

**`connect_terms`**
```json
{
  "pairs": [
    { "left": "Newton",   "right": "Gravity" },
    { "left": "Einstein", "right": "Relativity" }
  ]
}
```

**`organize_tags`**
```json
{
  "buckets": ["Noun", "Verb", "Adjective"],
  "items": [
    { "text": "Run",       "bucket": "Verb" },
    { "text": "Mountain",  "bucket": "Noun" }
  ]
}
```

**`word_scramble`**
```json
{
  "scrambled": ["P","A","R","I","S"],
  "answer": "PARIS"
}
```

**`odd_one_out`**
```json
{ "options": ["Bat","Dolphin","Shark","Whale"], "answer": "Shark" }
```

**`categorize_items`**
```json
{
  "categories": ["Mammal","Reptile"],
  "items": [
    { "text": "Crocodile", "category": "Reptile" },
    { "text": "Dolphin",   "category": "Mammal" }
  ]
}
```

**`sequence_order`**
```json
{
  "correctOrder": ["Step 1", "Step 2", "Step 3", "Step 4"]
}
```

**`spell_it_out`**
```json
{ "answer": "PHOTOSYNTHESIS", "hint": "How plants make food!" }
```

**`short_answer`**
```json
{ "answers": ["carbon dioxide","co2","CO2"] }
```
Any of the values in `answers` (case-insensitive) will be accepted. Fuzzy matching is also applied.

**`ipa_transcription`**
```json
{ "answers": ["tʃiːz"] }
```
Exact IPA string match (built with the on-screen keyboard).

---

## 🏗️ Architecture

```
kid-brain-break-ext/
│
├── public/                    Static assets (manifest, fallback JSON, icons)
│   ├── manifest.json
│   ├── questions.json         Bundled fallback questions
│   ├── settings-popup.html    Toolbar icon popup UI
│   └── settings.js
│
└── src/
    ├── background/
    │   ├── background.js      Service Worker: alarms, messaging, orchestration
    │   ├── github-fetcher.js  Remote JSON fetch with 6-hr cache + fallback chain
    │   ├── media-muter.js     Pauses <video>/<audio> on audible tabs
    │   └── state-manager.js   Daily state: streak, category, count
    │
    ├── content/
    │   └── content.js         Listens for alarm trigger; builds Shadow DOM; injects UI
    │
    └── injected-ui/
        ├── popup.html         UI template loaded at runtime
        ├── popup.css          All styles (isolated in Shadow DOM)
        ├── popup.js           Main UI controller / state machine
        │
        ├── components/
        │   ├── CanvasWheel.js      HTML5 Canvas spinning wheel with physics
        │   ├── IpaKeyboard.js      Full IPA on-screen keyboard
        │   └── Confetti.js         Canvas confetti burst on correct answers
        │
        ├── components/question-types/
        │   └── QuestionTypes.js    All 13 question type components
        │
        └── core/
            ├── renderer.js         Factory — picks the right component from JSON type
            └── validator.js        XP calculation and result messages
```

### Data Flow

```
chrome.alarms fires
    → background.js wakes up
    → media-muter.js pauses all video/audio
    → background.js sends message to active tab
    → content.js receives message
    → Shadow DOM is created and isolated
    → popup.html + popup.css injected
    → popup.js boots, fetches questions (cache or GitHub)
    → isFirstToday? → Wheel screen → Category selection
    → Question rendered by renderer.js factory
    → User answers → validate() → Result screen + Confetti
    → Done → Shadow DOM removed, page restored
```

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Chrome 114+ (for MV3 support)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/kid-brain-break-ext.git
cd kid-brain-break-ext
npm install
```

### 2. Configure Your GitHub URL
Open `src/background/github-fetcher.js` and replace:
```javascript
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/questions.json';
```
with your actual GitHub Raw URL. Get it by:
1. Uploading `questions.json` to a public GitHub repo
2. Clicking the file → clicking **Raw**
3. Copying the URL from the browser address bar

### 3. Build
```bash
npm run build       # Production build → dist/
npm run dev         # Development watch mode
```

### 4. Load Into Chrome
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Done! The extension is live.

### 5. Test It
Click the 🧠 icon in your toolbar and press **"Test Break Now"** to trigger a break immediately without waiting 30 minutes.

---

## 🎨 Customising the Questions

You have two options:

**Option A — GitHub (recommended):**
1. Edit your `questions.json` in your GitHub repo
2. Push the changes
3. Wait up to 6 hours for the cache to refresh on the kid's machine (or clear cache via Chrome DevTools → Application → Storage)

**Option B — Local only:**
Edit `public/questions.json` and rebuild with `npm run build`, then reload the extension in `chrome://extensions`.

---

## ⚙️ Settings Panel

Click the 🧠 toolbar icon to access:
- **Today's stats** — breaks completed and current streak
- **Break interval** — change from 30 minutes to any value (5–120 mins)
- **Test button** — triggers a break immediately on the active tab

---

## 🔐 Permissions Explained

| Permission | Why It's Needed |
|---|---|
| `alarms` | Fires the 30-minute interval reliably |
| `storage` | Saves daily state, streak, and question cache |
| `tabs` | Queries audible tabs for muting |
| `scripting` | Injects the media-pause script into audible tabs |
| `activeTab` | Targets the currently active tab for injection |
| `<all_urls>` | Required to inject content script on any website |

---

## 🚀 Roadmap Ideas

- [ ] Parent dashboard with weekly/monthly stats
- [ ] Difficulty levels (easy / medium / hard questions)
- [ ] More IPA words and voice playback
- [ ] Achievement badges
- [ ] Custom sound effects on correct/wrong answers
- [ ] Multi-child profiles

---

## 🧑‍💻 Contributing

Pull requests welcome! To add a new question type:
1. Add the component class to `src/injected-ui/components/question-types/QuestionTypes.js`
2. Export it and register it in `src/injected-ui/core/renderer.js`
3. Document the JSON schema in this README
4. Add example questions to `public/questions.json`

---

## 📝 License

MIT — use freely, modify, share. Just keep the kids learning! 🧠❤️

---

*Built with love for curious kids everywhere. KidBrainBreak v2.1.0*
