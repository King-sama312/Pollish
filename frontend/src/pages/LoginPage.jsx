import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.context";
import api from "../utils/intercept.js";
import { useState } from "react";

function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setError("");
      const res = await api.post("/auth/login", data);
      const user = res.data.data.user;
      setUser(user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem 2rem", minHeight: "80vh", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: "white", borderRadius: "16px", padding: "2.5rem", border: "1px solid var(--surface-border)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Welcome back</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Login to your account and continue polling.</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#ef4444", padding: "0.75rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.875rem", border: "1px solid #fca5a5" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group" style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>✉️</span>
            <input
              type="email"
              placeholder="Email address"
              {...register("email", { required: "Email is required" })}
              style={{ paddingLeft: "2.5rem" }}
            />
            {errors.email && <div className="text-error">{errors.email.message}</div>}
          </div>

          <div className="input-group" style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>🔒</span>
            <input
              type="password"
              placeholder="Password"
              {...register("password", { required: "Password is required" })}
              style={{ paddingLeft: "2.5rem" }}
            />
            {errors.password && <div className="text-error">{errors.password.message}</div>}
          </div>

          <div style={{ textAlign: "right", marginBottom: "1.5rem" }}>
            <Link to="#" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ width: "100%", padding: "0.875rem", fontSize: "1rem" }}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>



        <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          By logging in, you agree to our <Link to="#">Terms</Link> and <Link to="#">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
