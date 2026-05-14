import React, { useEffect } from "react";
import api from "../utils/intercept.js";          // <-- use the instance with interceptors
import { useAuth } from "../context/auth.context";

function GetMe() {
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user) return;

    api.get("/auth/me")                  // <-- no manual header needed
      .then((res) => {
        console.log(res.data.data);
        setUser(res.data.data);
      })
      .catch((error) => {
        // window.location.href = "/login";
        console.error("Failed to fetch user data:", error);
      });
  }, [user]);

  if (!user) return <p>Loading...</p>;

  const logout = () => {
    api.post("/auth/logout")             // <-- use api here too
      .then(() => {
        setUser(null);
        window.location.href = "/login";
      });
  };

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default GetMe;