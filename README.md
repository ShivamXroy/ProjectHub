# 🎓 SPRS — Student Project Review System

> React + Node.js + MongoDB | Full Stack Web App

---

## 📁 Project Structure

```
student-project-review/
├── backend/           → Node.js + Express API
│   ├── models/        → MongoDB schemas
│   ├── routes/        → API routes
│   ├── middleware/    → Auth middleware
│   ├── uploads/       → Uploaded files (auto-created)
│   └── server.js      → Main entry point
│
└── frontend/          → React App
    ├── src/
    │   ├── pages/     → All pages (Login, Register, Dashboard, etc.)
    │   ├── components/→ Sidebar
    │   ├── context/   → Auth context
    │   └── api.js     → Axios config
    └── public/
```

---

## ⚡ LOCAL SETUP (Run on Localhost)

### Step 1 — Prerequisites
Make sure you have installed:
- Node.js v16+ → https://nodejs.org
- MongoDB Atlas account (free) → https://mongodb.com/atlas

### Step 2 — MongoDB Setup
1. Go to https://mongodb.com/atlas → Create free account
2. Create a new cluster (free tier M0)
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like: mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/)

### Step 3 — Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Now open `.env` and fill in:
```
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/sprs?retryWrites=true&w=majority
JWT_SECRET=mysuper_secret_key_make_it_long_123456
NODE_ENV=development
```

Run backend:
```bash
npm run dev
```
✅ You should see: "MongoDB Connected" and "Server running on port 5000"

### Step 4 — Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
cp .env.example .env
```

`.env` should have:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Run frontend:
```bash
npm start
```
✅ Opens at http://localhost:3000

---

## 🔑 Demo Accounts (Create these first via Register page)

Register two accounts:
1. **Student** → role: Student, use any email
2. **Professor** → role: Professor, use any email

Or seed quick demo accounts by registering manually on the app.

---

## 🚀 DEPLOYMENT

### Backend → Render (Free)

1. Go to https://render.com → Sign up with GitHub
2. New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add Environment Variables:
   - `MONGO_URI` → your MongoDB Atlas URI
   - `JWT_SECRET` → your secret key
   - `NODE_ENV` → production
6. Deploy! Copy your Render URL (e.g. https://sprs-api.onrender.com)

### Frontend → Netlify (Free)

1. Go to https://netlify.com → Sign up with GitHub
2. "Add new site" → "Import an existing project"
3. Connect GitHub repo
4. Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
5. Add Environment Variable:
   - `REACT_APP_API_URL` → https://sprs-api.onrender.com/api
6. Deploy!
7. Also update backend's `server.js` CORS origin with your Netlify URL

---

## ✨ Features

### Student
- Register/Login
- Submit project with title, description, tech stack, GitHub link, live demo, document upload
- View all my projects with status
- View detailed project with all reviews
- Delete pending projects

### Professor
- Register/Login
- View all student submissions with filters & search
- Assign self to a project for review
- Write detailed review with rating (1-10), verdict (Approved / Revision Needed / Rejected), feedback
- Dashboard with stats

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Styling | Pure CSS with CSS Variables (Dark Theme) |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| File Upload | Multer |
| Deploy (FE) | Netlify |
| Deploy (BE) | Render |

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | ❌ |
| POST | /api/auth/login | Login | ❌ |
| GET | /api/auth/me | Get current user | ✅ |
| POST | /api/projects | Submit project | Student |
| GET | /api/projects | Get projects | ✅ |
| GET | /api/projects/:id | Get single project | ✅ |
| PUT | /api/projects/:id | Update project | Student |
| DELETE | /api/projects/:id | Delete project | Student |
| PUT | /api/projects/:id/assign | Assign to professor | Professor |
| POST | /api/reviews/:projectId | Submit review | Professor |
| GET | /api/reviews/:projectId | Get project reviews | ✅ |
| GET | /api/users/professors | Get all professors | ✅ |

---

Built with ❤️ 
