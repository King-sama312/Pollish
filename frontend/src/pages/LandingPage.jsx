import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
      {/* Hero Section */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4rem 0", minHeight: "80vh", flexWrap: "wrap", gap: "4rem" }}>
        <div style={{ flex: "1 1 500px", maxWidth: "600px" }}>
          <div className="badge" style={{ marginBottom: "1.5rem", padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
            <span style={{ marginRight: "0.5rem" }}>🔥</span> Make every opinion count
          </div>
          <h1 style={{ fontSize: "5rem", lineHeight: 1.1, marginBottom: "1.5rem" }}>Simple polls.<br/>Real opinions.</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.25rem", marginBottom: "2rem", lineHeight: 1.6 }}>
            Pollish makes it easy to create polls, share them anywhere and see what people think—instantly.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link to="/register"><button style={{ padding: "0.875rem 1.5rem", fontSize: "1.1rem" }}>Get Started</button></Link>
            <button className="secondary-btn" style={{ padding: "0.875rem 1.5rem", fontSize: "1.1rem" }}>Explore Polls</button>
          </div>
        </div>
        
        <div style={{ flex: "1 1 400px", display: "flex", justifyContent: "center", position: "relative" }}>
          {/* Minimalist Phone Mockup */}
          <div style={{ 
            width: "320px", 
            height: "640px", 
            border: "8px solid black", 
            borderRadius: "40px",
            padding: "2rem 1.5rem",
            background: "white",
            position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
            zIndex: 10
          }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
               <div style={{ fontWeight: 800, display: "flex", gap: "4px", alignItems: "flex-end", height: "20px" }}>
                 <div style={{ width: "4px", height: "12px", background: "black", borderRadius: "2px" }}></div>
                 <div style={{ width: "4px", height: "18px", background: "black", borderRadius: "2px" }}></div>
                 <div style={{ width: "4px", height: "8px", background: "black", borderRadius: "2px" }}></div>
                 <span style={{ marginLeft: "0.25rem", lineHeight: "20px" }}>pollish</span>
               </div>
               <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>≡</div>
             </div>
             
             <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", lineHeight: 1.3 }}>What's your<br/>favorite season?</h3>
             
             <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ border: "1px solid #e5e7eb", padding: "1rem", borderRadius: "8px", color: "#6b7280" }}>Spring</div>
                <div style={{ background: "black", color: "white", padding: "1rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Summer <span style={{ background: "white", color: "black", borderRadius: "50%", width: "20px", height: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "bold" }}>✓</span>
                </div>
                <div style={{ border: "1px solid #e5e7eb", padding: "1rem", borderRadius: "8px", color: "#6b7280" }}>Autumn</div>
                <div style={{ border: "1px solid #e5e7eb", padding: "1rem", borderRadius: "8px", color: "#6b7280" }}>Winter</div>
             </div>
             
             <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "2rem", textAlign: "center" }}>345 votes • 2d left</p>
          </div>
          
          {/* Decorative elements behind phone */}
          <div style={{ position: "absolute", bottom: "10%", left: "-10%", width: "120px", height: "120px", background: "white", borderRadius: "50%", border: "2px solid black", zIndex: 1, display: "flex" }}>
             <div style={{ width: "50%", height: "100%", background: "black", borderRadius: "120px 0 0 120px" }}></div>
             <div style={{ position: "absolute", top: "50%", right: "-10px", width: "50%", height: "50%", background: "black", borderRadius: "0 0 120px 0", transformOrigin: "top left", transform: "rotate(-30deg)" }}></div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section style={{ padding: "5rem 0", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
        <p style={{ fontWeight: 600, marginBottom: "3rem", color: "var(--text-secondary)" }}>Trusted by people and teams everywhere</p>
        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "2rem" }}>
          <div style={{ flex: "1 1 200px" }}><div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💡</div><p style={{ fontWeight: 700, fontSize: "1.1rem" }}>Easy to Use</p></div>
          <div style={{ flex: "1 1 200px" }}><div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📊</div><p style={{ fontWeight: 700, fontSize: "1.1rem" }}>Live Results</p></div>
          <div style={{ flex: "1 1 200px" }}><div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔗</div><p style={{ fontWeight: 700, fontSize: "1.1rem" }}>Share Anywhere</p></div>
          <div style={{ flex: "1 1 200px" }}><div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✨</div><p style={{ fontWeight: 700, fontSize: "1.1rem" }}>100% Free to Start</p></div>
        </div>
      </section>

      {/* Dark Feature Section */}
      <section style={{ background: "black", color: "white", padding: "6rem 4rem", borderRadius: "24px", textAlign: "center", marginBottom: "6rem" }}>
        <p style={{ fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "1.5rem", fontWeight: 600 }}>Features</p>
        <h2 style={{ fontSize: "3.5rem", marginBottom: "5rem", color: "white", maxWidth: "800px", margin: "0 auto 5rem auto", lineHeight: 1.2 }}>Everything you need<br/>to run better polls</h2>
        
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "3rem", marginBottom: "5rem", textAlign: "left" }}>
          <div style={{ flex: "1 1 250px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>✏️</div>
            <h3 style={{ color: "white", marginBottom: "1rem", fontSize: "1.5rem" }}>Create in Seconds</h3>
            <p style={{ color: "#9ca3af", lineHeight: 1.6, fontSize: "1.1rem" }}>Build a poll in no time with our clean and simple interface.</p>
          </div>
          <div style={{ flex: "1 1 250px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>🚀</div>
            <h3 style={{ color: "white", marginBottom: "1rem", fontSize: "1.5rem" }}>Share Anywhere</h3>
            <p style={{ color: "#9ca3af", lineHeight: 1.6, fontSize: "1.1rem" }}>Share your poll via link, QR code, or directly to social media.</p>
          </div>
          <div style={{ flex: "1 1 250px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>📈</div>
            <h3 style={{ color: "white", marginBottom: "1rem", fontSize: "1.5rem" }}>Live Results</h3>
            <p style={{ color: "#9ca3af", lineHeight: 1.6, fontSize: "1.1rem" }}>Watch votes roll in and your results update in real-time.</p>
          </div>
        </div>
        <button style={{ background: "white", color: "black", padding: "1rem 2.5rem", fontSize: "1.1rem", borderRadius: "8px", fontWeight: 600 }}>Explore Features</button>
      </section>

      {/* Footer CTA */}
      <section style={{ background: "black", color: "white", padding: "4rem 5rem", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4rem", flexWrap: "wrap", gap: "2rem" }}>
        <div style={{ flex: "1 1 400px" }}>
          <h2 style={{ color: "white", marginBottom: "1rem", fontSize: "2.5rem" }}>Ready to create your first poll?</h2>
          <p style={{ color: "#9ca3af", fontSize: "1.2rem" }}>Join thousands of users who trust Pollish for simple, powerful polling.</p>
        </div>
        <div>
          <Link to="/register">
            <button style={{ background: "white", color: "black", padding: "1rem 2.5rem", fontSize: "1.1rem", fontWeight: 600 }}>Get Started Free</button>
          </Link>
        </div>
      </section>
    </div>
  );
}
