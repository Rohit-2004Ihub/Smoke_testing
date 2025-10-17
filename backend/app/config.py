import os
from dotenv import load_dotenv
load_dotenv()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
CALLBACK_URL = os.getenv("CALLBACK_URL")
JWT_SECRET = os.getenv("JWT_SECRET")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # your Gemini API key or Google API key depending on client used
