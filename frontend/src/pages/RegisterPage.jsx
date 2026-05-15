import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/intercept.js";
import { useState } from "react";

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      setError("");
      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem 2rem", minHeight: "80vh", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: "white", borderRadius: "16px", padding: "2.5rem", border: "1px solid var(--surface-border)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Create your account</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Join Pollish and start creating polls in seconds.</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#ef4444", padding: "0.75rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.875rem", border: "1px solid #fca5a5" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-group" style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>👤</span>
            <input
              type="text"
              placeholder="Full name"
              {...register("name", { required: "Name is required" })}
              style={{ paddingLeft: "2.5rem" }}
            />
            {errors.name && <div className="text-error">{errors.name.message}</div>}
          </div>

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
              {...register("password", { 
                required: "Password is required",
                minLength: { value: 6, message: "Minimum 6 characters" }
              })}
              style={{ paddingLeft: "2.5rem" }}
            />
            {errors.password && <div className="text-error">{errors.password.message}</div>}
          </div>

          <div className="input-group" style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>🔒</span>
            <input
              type="password"
              placeholder="Confirm password"
              {...register("confirmPassword", { 
                required: "Confirm your password",
                validate: value => value === password || "Passwords do not match"
              })}
              style={{ paddingLeft: "2.5rem" }}
            />
            {errors.confirmPassword && <div className="text-error">{errors.confirmPassword.message}</div>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ width: "100%", padding: "0.875rem", fontSize: "1rem", marginTop: "1rem" }}
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--surface-border)" }}></div>
          <span style={{ padding: "0 1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--surface-border)" }}></div>
        </div>

        <button className="secondary-btn" style={{ width: "100%", padding: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "1rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          Sign up with Google
        </button>

        <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          By signing up, you agree to our <Link to="#">Terms</Link> and <Link to="#">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
