# 📝 Filipino Konseptong Papel Checker

AI-powered Filipino essay checker with rubric-based grading system for Konseptong Papel (Concept Papers).

## ✨ Features

- **Rubric-Based Grading** (20 points total)
  - 📝 Nilalaman (Content) - 5 pts
  - 🔗 Kaisahan (Unity/Coherence) - 5 pts
  - 📐 Kaayusan (Organization/Format) - 5 pts
  - 🎯 Kaangkupan (Appropriateness) - 5 pts

- **Real-time Corrections**
  - Spelling errors
  - Grammar issues
  - Style suggestions
  - Interactive accept/reject

- **Interactive Editor**
  - Hover preview on corrections
  - Detailed explanations
  - One-click fix application

## 🚀 Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create `.env` file

Create a `.env` file in the `backend` folder:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

Get your API key from: https://console.groq.com

### 3. Start the Server

```bash
cd backend
npm start
```

### 4. Open the Frontend

Open `frontend/index.html` in your browser

## 📁 Project Structure

```
AITEST/
├── backend/
│   ├── server.js           # Main server
│   ├── package.json
│   └── .env               # API keys (not tracked)
├── frontend/
│   └── index.html         # Main interface
└── README.md
```

## 🎯 Usage

1. **Load Sample** or paste your Konseptong Papel
2. Click **"Check & Grade"**
3. View rubric scores and corrections
4. **Hover** over corrections for quick preview
5. **Click** corrections to accept/reject
6. Copy final corrected text

## 🛠️ Technologies

- **Backend**: Node.js, Express
- **AI**: Groq API (Llama 3.3 70B-Versatile)
- **Frontend**: HTML, Tailwind CSS, Vanilla JS

## 📊 Grading Rubric

Each category is scored 1-5 points:

| Score | Description |
|-------|-------------|
| 5 | Excellent - Fully meets all criteria |
| 4 | Good - Minor improvements needed |
| 3 | Satisfactory - Some issues present |
| 2 | Poor - Many problems |
| 1 | Very Poor - Major deficiencies |

**Total Score**: X/20

## 🔧 API Endpoints

### `POST /check`
Check and grade an essay

**Request:**
```json
{
  "essay": "Your essay text here..."
}
```

**Response:**
```json
{
  "grade": "16/20",
  "rubric_scores": {
    "nilalaman": 4,
    "kaisahan": 5,
    "kaayusan": 3,
    "kaangkupan": 4
  },
  "corrections": [...],
  "feedback": "...",
  "strengths": [...],
  "improvements": [...]
}
```

### `GET /health`
Check server status
