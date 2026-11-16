# Alzikrayat — MERN Edition

**Student:** Saja Abdalhameed — IT, Semester 7

A full-stack photo sharing app built with React (Vite), Express, Node.js and MongoDB (Mongoose).
Members can register, upload photos, browse a gallery (grid/list), view photo details, comment, and delete their own photos.

**Project 4 — Selected track: F (AI Integration).**

## Project structure

```
alzikrayat/
├── server/        Express REST API
│   ├── models/        User.js, Photo.js, Comment.js (Mongoose schemas)
│   ├── routes/        authRoutes.js, photoRoutes.js, commentRoutes.js
│   ├── controllers/   authController.js, photoController.js, commentController.js
│   ├── middleware/    validation.js (Joi), errorHandler.js, requireUser.js, upload.js (Multer)
│   ├── uploads/       stored image files
│   ├── .env           secrets (never committed; template: .env.example)
│   └── server.js      Express app entry point
└── client/        React + Vite frontend
    ├── src/components/  Navbar, Footer, PhotoCard, Status
    ├── src/pages/       Home, Gallery, PhotoDetail, AddPhoto, LoginRegister
    ├── src/App.jsx      route configuration (React Router)
    └── vite.config.js   dev proxy to the Express API
```

## Requirements
- Node.js 18+
- A MongoDB database (local instance or MongoDB Atlas)
- An internet connection (Bootstrap is loaded from a CDN in `client/index.html`)

## Setup and run locally

### 1. Server
```bash
cd server
cp .env.example .env      # then edit .env and fill in the values below (Windows: copy .env.example .env)
npm install
npm run dev               # runs on http://localhost:5000
```

### 2. Client (in a second terminal)
```bash
cd client
npm install
npm run dev               # runs on http://localhost:5173
```

Open http://localhost:5173. Vite proxies `/api` and `/uploads` to the Express server on port 5000.

## Environment variables (`server/.env`, never committed)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string. Local example: `mongodb://127.0.0.1:27017/alzikrayat`. Atlas example: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/alzikrayat` |
| `PORT` | API port (default `5000`) |
| `JWT_SECRET` | Secret key used to sign login tokens (use a long random string) |
| `OPENAI_API_KEY` | OpenAI key for the AI feature (optional: if empty, the app runs in demo mode with a local fallback) |
| `OPENAI_MODEL` | OpenAI model name (default `gpt-4o-mini`) |

`.env` is listed in `.gitignore`. A template is provided in `server/.env.example`.

## REST API

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | no | Validate with Joi, hash password with bcrypt, create user |
| POST | `/api/auth/login` | no | Compare bcrypt hash, return `{ token, user }` |
| GET | `/api/photos` (`?limit=`) | no | List photos, newest first |
| GET | `/api/photos/:id` | no | Photo details plus its comments |
| POST | `/api/photos` (multipart, field `photoFile`) | yes | Upload a photo (JPG/PNG/GIF, max 5 MB) |
| DELETE | `/api/photos/:id` | yes | Delete a photo — owner only (checked on the server) |
| POST | `/api/photos/:id/comments` | yes | Add a comment |
| POST | `/api/photos/:id/summarize` | yes | AI summary of the photo's comments (Track F) |
| GET | `/api/stats` | no | Member and photo counts for the home page |

Status codes used: `200`, `201`, `400` (bad upload), `401` (not logged in / wrong credentials), `403` (not the owner), `404`, `409` (email already registered), `422` (validation error), `429` (AI rate limit), `500`.

## Security notes
- Passwords are hashed with bcrypt and are never stored or returned in plain text.
- Input is validated on the server with Joi.
- Secrets live in `.env`, which is excluded from Git.
- Photo deletion verifies ownership on the server before removing the record and the file.

## Project 4 — Track F: AI Integration

**Rationale:** the gallery's comment threads can grow long, so summarizing them is a meaningful, low-risk use of AI that fits the existing comment system without changing the data model.

**Feature:** on a photo's detail page, a logged-in user clicks **Summarize Comments** and the React UI shows a one-sentence summary of the discussion.

**How it works**
1. The React client calls `POST /api/photos/:id/summarize` (JWT required).
2. The Express server loads the photo's comments (max 50, text limited to 3000 characters) and calls the OpenAI Chat Completions API. The API key stays on the server in `.env`; the browser never sees it.
3. The server returns `{ summary, source }`.

**Error handling and graceful degradation**
- `429` from OpenAI: the user sees "The AI service is busy (rate limit reached)...".
- Any other API failure or timeout (10 s): the server falls back to a simple local summary, and the UI marks it as "demo mode".
- No `OPENAI_API_KEY` set: the app works in demo mode with the same local fallback.

**Setup for the AI feature**
1. Create an API key on the OpenAI platform.
2. Put it in `server/.env` as `OPENAI_API_KEY=...` (never commit it).
3. Restart the server. Without a key the feature still works in demo mode.

**Run the full stack:** start the server (`cd server && npm run dev`) and the client (`cd client && npm run dev`) as described above, then open http://localhost:5173.