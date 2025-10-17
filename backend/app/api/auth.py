from fastapi import APIRouter
from fastapi.responses import RedirectResponse, JSONResponse
import requests, os
from jose import jwt, JWTError

router = APIRouter(prefix="/auth", tags=["Auth"])

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "Iv23li3e1jFaBYgJrUqw")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "3f8932fa1ca6924cce01f92c19578cd8c0378c8c")  # Must be set
CALLBACK_URL = os.getenv("CALLBACK_URL", "http://localhost:8080/auth/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8501")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecret")


@router.get("/login")
def login():
    """Redirect user to GitHub OAuth"""
    url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={GITHUB_CLIENT_ID}&scope=repo,user&redirect_uri={CALLBACK_URL}"
    )
    return RedirectResponse(url)


@router.get("/callback")
def callback(code: str = None):
    """Exchange GitHub code for access token and redirect with session_token"""
    if not code:
        return JSONResponse({"error": "Missing 'code' parameter"}, status_code=400)

    # Exchange code for access token
    token_res = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": CALLBACK_URL
        },
    )

    token_json = token_res.json()
    print("GitHub token response:", token_json)  # Debugging

    access_token = token_json.get("access_token")
    if not access_token:
        return JSONResponse({"error": "Failed to get access token", "details": token_json}, status_code=400)

    # Fetch user info
    user_res = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"token {access_token}"}
    )
    user_data = user_res.json()

    # Create JWT session token
    session_token = jwt.encode(
        {"login": user_data["login"], "token": access_token},
        JWT_SECRET,
        algorithm="HS256"
    )

    # Redirect to React frontend with session_token
    redirect_url = f"{FRONTEND_URL}/?session_token={session_token}"
    return RedirectResponse(redirect_url)


@router.get("/repos")
def list_repos(session_token: str):
    try:
        decoded = jwt.decode(session_token, JWT_SECRET, algorithms=["HS256"])
        token = decoded["token"]
        headers = {"Authorization": f"token {token}"}
        repos = requests.get("https://api.github.com/user/repos", headers=headers)
        return repos.json()
    except JWTError:
        return {"error": "Invalid session"}


@router.get("/branches")
def list_branches(session_token: str, owner: str, repo: str):
    try:
        decoded = jwt.decode(session_token, JWT_SECRET, algorithms=["HS256"])
        token = decoded["token"]
        headers = {"Authorization": f"token {token}"}
        url = f"https://api.github.com/repos/{owner}/{repo}/branches"
        response = requests.get(url, headers=headers)
        print("Branches API status:", response.status_code)
        print("Branches API response:", response.json())
        return response.json()
    except JWTError:
        return {"error": "Invalid session"}


