# 🎓 Adaptive StudyAI — Intelligent Study Planner & Progress Tracker

> **Code-A-Thon 3.0 Project** — An AI-powered adaptive academic study planner built with FastAPI + React/Vite + SQLite.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Study Coach** | Gemini Flash-powered chat assistant with intent recognition |
| 📅 **Smart Scheduling** | Auto-generate personalized weekly study plans |
| 🔄 **Adaptive Rescheduler** | Automatically moves missed tasks to the next available slot |
| 📊 **Progress Analytics** | Real-time subject mastery, weak-subject detection |
| 🎯 **Priority Engine** | Multi-factor scoring (exam proximity, difficulty, deadlines) |
| 📄 **Notes & RAG** | Upload PDF/text notes; AI answers from your own materials |
| ⏱️ **Pomodoro Timer** | Built-in focus timer with streak tracking |
| 🔔 **Notifications** | In-app alerts for rescheduling, exams, and deadlines |
| 🔐 **JWT Auth** | Secure token-based authentication (demo mode included) |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- TailwindCSS
- Recharts (analytics graphs)
- Lucide Icons

**Backend**
- Python 3.11+
- FastAPI
- SQLAlchemy + SQLite
- Google Gemini 2.5 Flash (`google-genai` SDK)
- PyPDF2 (RAG note extraction)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Jothsna-kulal/coeathon.git
cd coeathon
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

# Copy and configure environment
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Start the Backend

```bash
python -m uvicorn app.main:app --reload --port 8000
```

API available at: `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

App available at: `http://localhost:5173`

---

## 🔑 Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in:

```env
DATABASE_URL=sqlite:///./study_planner.db
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key-here   # From https://aistudio.google.com/
UPLOAD_DIR=../uploads
```

> ⚠️ **Never commit your `.env` file** — it is already in `.gitignore`

---

## 🗂️ Project Structure

```
coeathon/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT authentication
│   │   ├── assistant.py     # AI chat engine (Gemini + intent)
│   │   ├── scheduler.py     # Adaptive study scheduler
│   │   ├── analytics.py     # Progress & streak calculations
│   │   ├── rag.py           # RAG pipeline for notes
│   │   └── seed_data.py     # Demo data seeder
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # All page components
│   │   ├── components/      # Shared UI components
│   │   └── api/client.js    # API client
│   └── vite.config.js
├── uploads/                 # Uploaded note files
└── README.md
```

---

## 🎯 Demo Login

In demo mode, **any email + any password** works:

```
Email:    test@gmail.com
Password: 123456
```

New accounts are created automatically on first login.

---

## 📸 Screenshots

> Dashboard, AI Assistant, Analytics, Calendar, and more — all connected to real database data.

---

## 👩‍💻 Author

**Jothsna Kulal** — Code-A-Thon 3.0 Participant  
📧 jothsnakulal09@gmail.com

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
