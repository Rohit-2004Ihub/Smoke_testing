from pydantic import BaseModel
from typing import List, Optional

class RepoSelect(BaseModel):
    repo_url: str
    branch: str
    commit_id: Optional[str] = None

class SmokeReport(BaseModel):
    commit_id: str
    branch: str
    critical_files_present: bool
    syntax_errors: List[dict]
    missing_functions: List[dict]
    ui_issues: List[dict]
    error_handling_issues: List[dict]
    build_ready_for_regression: bool
