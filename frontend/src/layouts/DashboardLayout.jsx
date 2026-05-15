import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth.context";
import api from "../utils/intercept";

export default function DashboardLayout() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: "My Polls", path: "/dashboard", icon: "📊" },
    { name: "Explore", path: "/explore", icon: "🔍" },
    { name: "Results", path: "/results", icon: "📈" },
    { name: "Bookmarks", path: "/bookmarks", icon: "🔖" },
    { name: "Settings", path: "/settings", icon: "⚙️" },
  ];

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <Link to="/" className="nav-brand" style={{ padding: "0 1rem", marginBottom: "2rem", marginTop: "0.5rem" }}>
          <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "20px" }}>
            <div style={{ width: "4px", height: "12px", background: "var(--primary-color)", borderRadius: "2px" }}></div>
            <div style={{ width: "4px", height: "18px", background: "var(--primary-color)", borderRadius: "2px" }}></div>
            <div style={{ width: "4px", height: "8px", background: "var(--primary-color)", borderRadius: "2px" }}></div>
          </div>
          pollish
        </Link>
        
        <button onClick={() => navigate("/polls/create")} style={{ width: "100%", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: "300" }}>+</span> New Poll
        </button>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            // Very simple active check
            const isActive = location.pathname === item.path || (item.path === "/dashboard" && location.pathname.startsWith("/polls"));
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span style={{ width: "20px", display: "inline-block", textAlign: "center" }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--surface-border)" }}>
          <button 
            className="sidebar-link" 
            onClick={handleLogout} 
            style={{ width: "100%", background: "transparent", border: "none", color: "var(--text-secondary)", textAlign: "left", padding: "0.75rem 1rem", boxShadow: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
          >
            <span style={{ width: "20px", display: "inline-block", textAlign: "center" }}>🚪</span> Logout
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
