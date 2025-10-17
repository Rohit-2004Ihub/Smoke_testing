import React, { useState, useEffect } from "react";
import axiosClient from "../api/api";
import ReportCard from "../components/ReportCard";
import axios from "axios";

const BACKEND_AUTH = "http://localhost:8080";

export default function Dashboard({ token }){
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch repos
  useEffect(()=> {
    if(!token) return;
    axios.get(`${BACKEND_AUTH}/auth/repos`, { params: { session_token: token } })
      .then(res => setRepos(res.data))
      .catch(err => console.error(err));
    fetchReports();
    const id = setInterval(fetchReports, 15000);
    return ()=> clearInterval(id);
  }, [token]);

  const fetchBranches = async (fullName) => {
    const [owner, repo]= fullName.split("/");
    try{
      const res = await axios.get(`${BACKEND_AUTH}/auth/branches`, { params: { access_token: token, owner, repo }});
      setBranches(res.data);
    }catch(e){ console.error(e) }
  }

  async function runSmoke(){
    if(!selectedRepo || !selectedBranch) { alert("Select repo and branch"); return; }
    setLoading(true);
    try{
      const payload = { repo_url: `https://github.com/${selectedRepo}.git`, branch: selectedBranch };
      const res = await axiosClient.post("/smoke/run", payload);
      alert("Smoke run completed");
      fetchReports();
    }catch(e){
      alert("Smoke run failed: " + (e?.response?.data?.detail || e.message));
    }finally{ setLoading(false); }
  }

  async function fetchReports(){
    try{
      const res = await axiosClient.get("/reports");
      setReports(res.data);
    }catch(e){ console.error(e); }
  }

  return (
    <div className="container">
      <h1>Smoke Testing Dashboard</h1>

      <div style={{display:"flex", gap:10, marginTop:20}}>
        <select onChange={(e)=>{ setSelectedRepo(e.target.value); fetchBranches(e.target.value); }}>
          <option value="">Select repository</option>
          {repos.map(r => <option key={r.id} value={r.full_name}>{r.full_name}</option>)}
        </select>

        <select onChange={(e)=> setSelectedBranch(e.target.value)}>
          <option value="">Select branch</option>
          {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
        </select>

        <button onClick={runSmoke} disabled={loading}>{loading ? "Running..." : "Run Smoke Test"}</button>
      </div>

      <hr style={{margin:"20px 0"}} />

      <h2>Recent Reports</h2>
      {reports.length===0 ? <p>No reports yet</p> : reports.map((r, i) => <ReportCard key={i} report={r} />)}
    </div>
  );
}
