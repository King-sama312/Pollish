import React, { useEffect } from "react";
import api from "../utils/intercept.js";
import { useAuth } from "../context/auth.context";

function GetMe() {
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user) return;

    api.get("/auth/me")
      .then((res) => {
        setUser(res.data.data);
      })
      .catch((error) => {
        console.error("Failed to fetch user data:", error);
      });
  }, [user, setUser]);

  if (!user) return <div className="page-container text-center"><p className="text-slate-400">Loading...</p></div>;

  const logout = () => {
    api.post("/auth/logout")
      .then(() => {
        setUser(null);
        window.location.href = "/login";
      });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="glass-panel w-full max-w-md text-center !mt-0">
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
          <span className="text-3xl font-bold text-blue-400">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}</h1>
        <p className="text-slate-400 mb-8">{user.email}</p>
        
        <button 
          onClick={logout}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-red-400 font-semibold rounded-lg border border-red-500/20 transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default GetMe;