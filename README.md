# Smoke Testing Product (Gemini-powered)

## Prerequisites
- Python 3.10+
- Node.js 18+
- Git
- Gemini API key (or LangChain google-genai config)
- GitHub OAuth App credentials (client id & secret)
- (Optional) Docker for production

## Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r app/requirements.txt

Create `.env` at backend root:
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
CALLBACK_URL=http://localhost:8080/auth/callback
JWT_SECRET=some_secret
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:5173

Run backend:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

## Frontend setup
cd frontend
npm install
# ensure @vitejs/plugin-react installed
npm run dev

Open http://localhost:5173

## Workflow
1. Click "Login with GitHub" -> authorize -> redirected back to frontend with session_token
2. Select repository, branch
3. Click "Run Smoke Test" -> backend clones repo, checks latest commit, analyzes changed files with Gemini, returns report
4. View report in dashboard
