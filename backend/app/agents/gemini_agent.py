import os, json, textwrap
from app.config import GEMINI_API_KEY
from google import generativeai as genai
import re

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

def invoke_llm(prompt: str) -> str:
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text

def build_prompt_for_files(changed_files_content: dict, commit_id: str, branch: str):
    header = f"Analyze changed files from commit {commit_id} on branch {branch}.\n"
    instructions = textwrap.dedent("""
    You are a code smoke testing agent.

    Check critical files, syntax, missing functions, UI, and error handling.
    Output **only JSON**:
    {
      "critical_files_present": true/false,
      "syntax_errors": [{"file":"path","error":"msg"}],
      "missing_functions": [{"file":"path","missing":["func1"]}],
      "ui_issues": [{"file":"path","issue":"msg"}],
      "error_handling_issues": [{"file":"path","issue":"msg"}],
      "build_ready_for_regression": true/false
    }
    """)
    prompt = header + instructions + "\n\n=== FILES ===\n"
    for path, content in changed_files_content.items():
        prompt += f"\n--- {path} ---\n{content[:30000]}\n"  # limit 30k chars per file
    return prompt

def analyze_changed_files(changed_files_content: dict, commit_id: str, branch: str):
    """
    changed_files_content: dict of filepath -> file content
    """
    prompt = build_prompt_for_files(changed_files_content, commit_id, branch)
    llm_response = invoke_llm(prompt)

    # Extract JSON safely
    parsed = None
    try:
        match = re.search(r"\{.*\}", llm_response, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
    except Exception:
        parsed = None

    # Fallback if parsing fails
    if not parsed:
        parsed = {
            "critical_files_present": False,
            "syntax_errors": [{"file": "N/A", "error": "Failed to parse LLM output"}],
            "missing_functions": [],
            "ui_issues": [],
            "error_handling_issues": [],
            "build_ready_for_regression": False
        }

    return parsed
