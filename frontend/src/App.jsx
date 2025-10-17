import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Github,
  GitBranch,
  Folder,
  LogOut,
  Play,
  CheckCircle2,
  Loader2,
  Search,
  Code2,
  Activity,
  AlertCircle
} from "lucide-react";

const API_BASE = "http://localhost:8080"; // FastAPI backend

function App() {
  const [sessionToken, setSessionToken] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  // Get session token from localStorage or URL
  useEffect(() => {
    const storedToken = localStorage.getItem("session_token");
    if (storedToken) {
      setSessionToken(storedToken);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const token = params.get("session_token");
    if (token) {
      setSessionToken(token);
      localStorage.setItem("session_token", token);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // Fetch Repos
  useEffect(() => {
    if (sessionToken) {
      setLoading(true);
      setError("");
      axios
        .get(`${API_BASE}/auth/repos`, { params: { session_token: sessionToken } })
        .then((res) => {
          setRepos(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to fetch repositories");
          setLoading(false);
        });
    }
  }, [sessionToken]);

  // Fetch Branches
  useEffect(() => {
    if (selectedRepo && sessionToken) {
      setLoading(true);
      setError("");
      const [owner, repo] = selectedRepo.split("/");
      axios
        .get(`${API_BASE}/auth/branches`, { params: { session_token: sessionToken, owner, repo } })
        .then((res) => {
          setBranches(res.data.map((b) => b.name));
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to fetch branches");
          setLoading(false);
        });
    }
  }, [selectedRepo, sessionToken]);

  // Logout
  const handleLogout = () => {
    setSessionToken(null);
    setRepos([]);
    setSelectedRepo("");
    setBranches([]);
    setSelectedBranch("");
    localStorage.removeItem("session_token");
  };

  // Run Smoke Test
  const handleRunTests = async () => {
    try {
      setIsRunning(true);
      setError("");
      const repoUrl = selectedRepo.startsWith("http") ? selectedRepo : `https://github.com/${selectedRepo}`;
      const res = await axios.post(`${API_BASE}/smoke/run`, {
        repo_url: repoUrl,
        branch: selectedBranch,
        commit_id: null
      });
      console.log("Smoke Test Report:", res.data);
      setReport(res.data || {});
    } catch (err) {
      console.error(err);
      setError("Failed to run smoke tests");
    } finally {
      setIsRunning(false);
    }
  };

  // Filter repos
  const filteredRepos = repos.filter((r) =>
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Empty Report Component
  const EmptyReport = () => (
    <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700 text-slate-400">
      <p>No smoke test report yet. Run a test to see the detailed report here.</p>
    </div>
  );

  // Login Screen
  if (!sessionToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-12 border border-white/20 text-center max-w-md">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl inline-block mb-6">
            <Code2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Welcome Back</h2>
          <p className="text-slate-300 mb-8">Sign in with GitHub to access your testing dashboard</p>
          <a href={`${API_BASE}/auth/login`}>
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 mx-auto">
              <Github className="w-5 h-5" />
              <span>Login with GitHub</span>
            </button>
          </a>
        </div>
      </div>
    );
  }

  // Dashboard
  const summary = report?.summary || report || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Code2 className="w-6 h-6 text-purple-400" />
            <span>Smoke Testing Agent</span>
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-slate-800/50 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all duration-200 border border-slate-700"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-8">
        {/* Left: Repo + Branch Selection + Run Button */}
        <div className="space-y-6">
          {/* Repo Selection */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <Folder className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold">Select Repository</h2>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              onChange={(e) => { setSelectedRepo(e.target.value); setSelectedBranch(""); }}
              value={selectedRepo}
              className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white"
            >
              <option value="">-- Select a Repository --</option>
              {filteredRepos.map((r) => (
                <option key={r.full_name} value={r.full_name}>{r.full_name}</option>
              ))}
            </select>
            {selectedRepo && (
              <div className="mt-4 text-green-400 text-sm flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Repository selected: {selectedRepo}</span>
              </div>
            )}
          </div>

          {/* Branch Selection */}
          {branches.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-6">
                <GitBranch className="w-5 h-5 text-pink-400" />
                <h2 className="text-xl font-semibold">Select Branch</h2>
              </div>
              <select
                onChange={(e) => setSelectedBranch(e.target.value)}
                value={selectedBranch}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-3 text-white"
              >
                <option value="">-- Select a Branch --</option>
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {selectedBranch && (
                <div className="mt-4 text-green-400 text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Branch selected: {selectedBranch}</span>
                </div>
              )}
            </div>
          )}

          {/* Run Smoke Test Button */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">Smoke Test Status</h2>
            </div>
            <button
              onClick={handleRunTests}
              disabled={isRunning || !selectedRepo || !selectedBranch}
              className={`w-full ${
                isRunning
                  ? "bg-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105"
              } text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center space-x-3`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Running Smoke Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Run Smoke Tests</span>
                </>
              )}
            </button>
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Smoke Test Report */}
        <div className="space-y-6">
          {report ? (
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-700 max-h-screen overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Smoke Test Report</h3>
              <p><strong>Commit:</strong> {report.commit_id || "N/A"}</p>
              <p><strong>Branch:</strong> {report.branch || selectedBranch}</p>
              <p><strong>Overall Status:</strong> {report.status || "Completed"}</p>

              <div className="mt-4 space-y-3 text-slate-200">
                <div>
                  <h4 className="font-semibold">Critical Files Present:</h4>
                  <p>{summary.critical_files_present ? "✅ Yes" : "❌ No"}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Build Ready for Regression:</h4>
                  <p>{summary.build_ready_for_regression ? "✅ Yes" : "❌ No"}</p>
                </div>

                {["syntax_errors","missing_functions","ui_issues","error_handling_issues"].map((section) => (
                  <details key={section} className="mb-2">
                    <summary className="cursor-pointer font-semibold">
                      {section.replace("_", " ").toUpperCase()}
                    </summary>
                    <div className="ml-4 mt-1">
                      {summary[section] && summary[section].length > 0 ? (
                        <ul className="list-disc ml-5">
                          {summary[section].map((item, idx) => (
                            <li key={idx}>
                              {item.file && <strong>{item.file}:</strong>}{" "}
                              {item.error || item.missing?.join(", ") || item.issue}
                            </li>
                          ))}
                        </ul>
                      ) : <p>None</p>}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ) : <EmptyReport />}
        </div>
      </div>
    </div>
  );
}

export default App;
