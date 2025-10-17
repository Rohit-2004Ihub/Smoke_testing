import React from "react";
const BACKEND = "http://localhost:8080";

export default function LoginPage({ setToken }){
  const manualPaste = () => {
    const t = prompt("Paste session_token (from OAuth callback redirect):");
    if(t){
      localStorage.setItem("session_token", t);
      setToken(t);
    }
  }
  return (
    <div className="container">
      <h1>Smoke Testing Agent</h1>
      <p>Login with GitHub to select repo & run code-level smoke checks.</p>
      <a href={`${BACKEND}/auth/login`}><button>Login with GitHub</button></a>
      <button onClick={manualPaste} style={{marginLeft:10}}>Paste session token</button>
    </div>
  );
}
