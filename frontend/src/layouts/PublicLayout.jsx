import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth.context";

export default function PublicLayout() {
  const { user } = useAuth();
  
  return (
    <>
      <nav className="nav-bar">
        <Link to="/" className="nav-brand">
          <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "20px" }}>
            <div style={{ width: "4px", height: "12px", background: "var(--primary-color)", borderRadius: "2px" }}></div>
            <div style={{ width: "4px", height: "18px", background: "var(--primary-color)", borderRadius: "2px" }}></div>
            <div style={{ width: "4px", height: "8px", background: "var(--primary-color)", borderRadius: "2px" }}></div>
          </div>
          pollish
        </Link>
        <div className="nav-links">
          {user ? (
            <Link to="/dashboard">
              <button>Go to Dashboard</button>
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ fontWeight: 500, marginRight: "1rem" }}>Login</Link>
              <Link to="/register"><button>Get Started</button></Link>
            </>
          )}
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
