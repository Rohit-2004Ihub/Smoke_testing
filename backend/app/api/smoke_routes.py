from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
from app.agents.gemini_agent import analyze_changed_files
from app.agents.result_agent import format_report

router = APIRouter(prefix="/smoke", tags=["Smoke Testing"])

# In-memory report store
REPORTS = []

class RepoSelect(BaseModel):
    repo_url: str
    branch: str
    commit_id: str | None = None

@router.post("/run")
def run_smoke(req: RepoSelect):
    """
    Run smoke test **without cloning the repo**:
    - Fetch commit info from GitHub API
    - Retrieve changed files
    - Send to Gemini AI
    - Return structured report
    """
    try:
        # Extract owner and repo from URL
        parts = req.repo_url.rstrip("/").split("/")
        owner, repo = parts[-2], parts[-1]

        # 1️⃣ Get commit ID if not provided
        if not req.commit_id:
            commits_api = f"https://api.github.com/repos/{owner}/{repo}/commits/{req.branch}"
            resp = requests.get(commits_api)
            if resp.status_code != 200:
                return {
                    "commit_id": "N/A",
                    "branch": req.branch,
                    "status": "failed",
                    "summary": {
                        "critical_files_present": False,
                        "build_ready_for_regression": False,
                        "syntax_errors": [{"file": "N/A", "error": "Failed to fetch latest commit"}],
                        "missing_functions": [],
                        "ui_issues": [],
                        "error_handling_issues": []
                    }
                }
            req.commit_id = resp.json().get("sha", "N/A")

        # 2️⃣ Fetch changed files for commit
        commit_api = f"https://api.github.com/repos/{owner}/{repo}/commits/{req.commit_id}"
        resp = requests.get(commit_api)
        if resp.status_code != 200:
            return {
                "commit_id": req.commit_id,
                "branch": req.branch,
                "status": "failed",
                "summary": {
                    "critical_files_present": False,
                    "build_ready_for_regression": False,
                    "syntax_errors": [{"file": "N/A", "error": "Failed to fetch commit details"}],
                    "missing_functions": [],
                    "ui_issues": [],
                    "error_handling_issues": []
                }
            }
        commit_data = resp.json()
        files = commit_data.get("files", [])
        if not files:
            return {
                "commit_id": req.commit_id,
                "branch": req.branch,
                "status": "completed",
                "summary": {
                    "critical_files_present": False,
                    "build_ready_for_regression": False,
                    "syntax_errors": [],
                    "missing_functions": [],
                    "ui_issues": [],
                    "error_handling_issues": []
                }
            }

        # 3️⃣ Get file content from GitHub
        changed_files_content = {}
        for f in files:
            raw_url = f.get("raw_url")
            try:
                file_resp = requests.get(raw_url)
                changed_files_content[f["filename"]] = file_resp.text[:50000] if file_resp.status_code == 200 else ""
            except Exception:
                changed_files_content[f["filename"]] = ""

        # 4️⃣ Analyze with Gemini AI safely
        try:
            analysis = analyze_changed_files( 
                changed_files_content=changed_files_content,
                commit_id=req.commit_id,
                branch=req.branch
            )
        except Exception as e:
            analysis = {
                "critical_files_present": False,
                "syntax_errors": [{"file": "N/A", "error": f"Gemini analysis failed: {str(e)}"}],
                "missing_functions": [],
                "ui_issues": [],
                "error_handling_issues": [],
                "build_ready_for_regression": False
            }

        # 5️⃣ Format and return report
        report = format_report(analysis, req.commit_id, req.branch)
        REPORTS.insert(0, report)
        return report

    except Exception as e:
        return {
            "commit_id": getattr(req, "commit_id", "N/A"),
            "branch": getattr(req, "branch", "N/A"),
            "status": "failed",
            "summary": {
                "critical_files_present": False,
                "build_ready_for_regression": False,
                "syntax_errors": [{"file": "N/A", "error": f"Unexpected error: {str(e)}"}],
                "missing_functions": [],
                "ui_issues": [],
                "error_handling_issues": []
            }
        }
