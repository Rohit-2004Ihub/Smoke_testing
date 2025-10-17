from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router       # auth routes
from app.api.smoke_routes import router as smoke_router
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Smoke Testing Agent API")

# --- CORS middleware to allow frontend access ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include routers ---
app.include_router(auth_router)
app.include_router(smoke_router)

# --- Root endpoint ---
@app.get("/")
def root():
    return {"status": "ok", "message": "Smoke Testing Agent API running"}


# --- Optional: run directly ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8080)), reload=True)
