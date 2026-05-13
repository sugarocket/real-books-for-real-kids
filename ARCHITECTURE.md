# 📐 Real Books for Real Kids — Technical Architecture

> High-level flow & code logic — **no code changed**

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / User                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (main.py)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ /api/books   │  │ /api/books/  │  │ /api/books/generate  │   │
│  │   (list)     │  │   {id}       │  │   (POST)             │   │
│  └──────────────┘  └──────────────┘  └──────────┬───────────┘   │
│  ┌──────────────┐  ┌──────────────┐             │               │
│  │ /api/tts     │  │ /api/image   │             │               │
│  │ (proxy TTS)  │  │ (proxy img)  │             │               │
│  └──────────────┘  └──────────────┘             │               │
│                                                 ▼               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Grok APIs: /v1/chat/completions (story)                  │   │
│  │             /v1/images/generations (cover + pages)        │   │
│  │             /v1/tts (voice narration)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  StaticFiles: / → frontend/dist (built React SPA)         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               Frontend (Vite + React + TypeScript)              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────────────────────┐│
│  │  Home   │ │ Browse  │ │ Create  │ │  My Books / Community  ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └────────────┬───────────┘│
│       │           │           │                   │            │
│       └───────────┴───────────┴───────────────────┘            │
│                          App.tsx (single-page)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Book Modal: 3D page-flip viewer + TTS + PDF export      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 Project File Tree

```
.
├── backend/
│   └── main.py              # FastAPI app: endpoints + SAMPLE_BOOKS + Grok proxy
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main React component (all UI + state)
│   │   ├── App.css / index.css
│   │   └── assets/          # Logo, hero images
│   ├── package.json
│   ├── vite.config.ts
│   └── dist/                # Built static files (served by backend)
├── README.md
├── WELCOME.md
└── ARCHITECTURE.md          # ← this file
```

---

## 🔄 Book Generation Flow

```
User clicks "Generate Magic"
           │
           ▼
┌─────────────────────┐
│  React: formData    │  (keywords, topic, ageGroup, pageCount, style, diversityMode)
└──────────┬──────────┘
           │ POST /api/books/generate
           ▼
┌─────────────────────┐
│  FastAPI endpoint   │
│  generate_book()    │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌─────────────────────┐
│ Grok    │  │  Grok               │
│ Chat    │  │  Image Gen          │
│ (story) │  │  (cover + pages)    │
└────┬────┘  └──────────┬──────────┘
     │                  │
     └────────┬─────────┘
              ▼
     ┌─────────────────────┐
     │  Return Book JSON   │  {id, title, cover, pages[], ...}
     └──────────┬──────────┘
                │
                ▼
     React: setSelectedBook(newBook)
            → Opens Book Modal
```

---

## 📖 Book Reader (Modal) Flow

```
selectedBook set → Modal opens
         │
         ▼
┌──────────────────────────────────────────┐
│  3D Canvas (perspective: 2000px)         │
│  ┌────────────────────────────────────┐  │
│  │  Current Page Image + Overlay Text │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ◀ Prev  │  Page 2/5  │  Next ▶          │
│                                          │
│  💾 Save   🔄 Regenerate   🔊 Listen     │
│  📥 Download PDF   ✕ Close               │
└──────────────────────────────────────────┘
         │
         ├─ click Next/Prev → rotateY flip animation (650ms)
         ├─ click Listen → POST /api/tts → Audio playback
         ├─ click Regenerate → POST /api/books/generate (same formData)
         └─ click Download → jsPDF + image proxy → .pdf
```

---

## 🔌 Backend API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET | `/api/books` | List all SAMPLE_BOOKS |
| GET | `/api/books/{id}` | Get one book by id |
| POST | `/api/books/generate` | **Generate new book** (Grok story + images) |
| POST | `/api/tts` | Proxy Grok Voice TTS → audio bytes |
| GET | `/api/image?url=...` | Proxy image (bypass CORS) |
| GET | `/` | Serves React SPA (`frontend/dist`) |

---

## 🧠 Key State (React App.tsx)

| State | Purpose |
|-------|---------|
| `activeSection` | Which tab: home / browse / create / mybooks / community |
| `formData` | User inputs for generation (keywords, topic, age, etc.) |
| `sampleBooks` | Preloaded from `/api/books` |
| `savedBooks` | User-saved books (localStorage) |
| `selectedBook` | Book open in modal |
| `isGenerating` | Loading overlay while Grok works |
| `currentPageIndex` | Page in book reader |
| `currentAudio` | TTS playback state |

---

## 🎨 UI Sections (App.tsx)

```
App
 ├── Nav (logo + tabs: Browse | Create | My Books | Community)
 ├── Home (welcome + create form + showcase 4 books)
 ├── Browse (all books + filters/search)
 ├── Create (full form for new book)
 ├── My Books (savedBooks grid + delete)
 ├── Community (Coming Soon mockup)
 └── Modal (book reader: 3D flip + TTS + PDF + Regenerate)
```

---



> **Note:** All images, stories, and TTS come from Grok APIs (xAI). The app is web-based, no native install needed.
