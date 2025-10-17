def format_report(analysis: dict, commit_id: str, branch: str):
    report = {
        "status": "completed",
        "summary": analysis,
        "commit_id": commit_id,
        "branch": branch
    }
    return report
