import requests
from typing import Dict

def get_latest_commit_sha(owner: str, repo: str, branch: str) -> str:
    """Get latest commit SHA from GitHub API."""
    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{branch}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    return data["sha"]

def get_changed_files_from_commit(owner: str, repo: str, commit_sha: str) -> Dict[str, str]:
    """
    Get changed files and their content from a commit.
    Returns dict: filename -> content
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{commit_sha}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()

    files = data.get("files", [])
    changed_files = {}
    for f in files:
        filename = f["filename"]
        raw_url = f["raw_url"]
        file_content = requests.get(raw_url).text
        changed_files[filename] = file_content
    return changed_files
