import { useState, useRef } from "react";

const C = {
  green: "#00c853",
  darkGreen: "#1b5e20",
  medGreen: "#2e7d32",
  lightGreen: "#f1f8e9",
  bg: "#f0f4f0",
  white: "#ffffff",
  gray: "#9e9e9e",
  dark: "#212121",
};

const categoryColors = {
  "Wet Waste": "#43a047",
  "E-Waste": "#e53935",
  "Recyclable Waste": "#1e88e5",
  "Dry Waste": "#fb8c00",
  "Hazardous Waste": "#8e24aa",
  "Medical Waste": "#d81b60",
  "Non-Recyclable Waste": "#6d4c41",
};

const tips = [
  "Recycling one can saves energy to power a TV for 3 hours! 📺",
  "A plastic bottle takes 450 years to decompose. ♻️",
  "Food waste in landfills creates methane — a greenhouse gas! 🌿",
  "E-waste contains gold, silver and copper — recycle it! 🔋",
  "One tonne of paper recycled saves 17 trees! 🌳",
];

export default function App() {
  const [tab, setTab] = useState("home");
  const [waste, setWaste] = useState("");
  const [result, setResult] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak] = useState(3);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [preview, setPreview] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const fileRef = useRef();

  const rotateTip = () => setTipIndex((i) => (i + 1) % tips.length);

  const enableNotifications = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifEnabled(true);
      new Notification("EcoSchool AI 🌱", {
        body: "Daily reminders enabled! Let's recycle today ♻️",
        icon: "/image-1779773774443.webp",
      });
      setInterval(() => {
        new Notification("EcoSchool AI 🌱", {
          body: "Don't forget to classify your waste today! 🌍",
          icon: "/image-1779773774443.webp",
        });
      }, 24 * 60 * 60 * 1000);
    } else {
      alert("Please allow notifications in your browser settings!");
    }
  };

  const handleResult = (data, itemName) => {
    setResult(data);
    setPoints((prev) => prev + data.points);
    setHistory((prev) => [
      { item: itemName || data.item || "Unknown", ...data, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 19),
    ]);
  };

  const analyzeWaste = async () => {
    if (!waste.trim()) return;
    setLoading(true);
    setResult(null);
    setPreview(null);
    try {
      const res = await fetch("/api/classify-waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: waste }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      handleResult(data, waste);
      setWaste("");
    } catch {
      setResult({ category: "Error", emoji: "❓", tip: "Could not classify", points: 0 });
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = (file) => {
    setLoading(true);
    setResult(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      try {
        const res = await fetch("/api/classify-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        handleResult(data, data.item);
      } catch {
        setResult({ category: "Error", emoji: "❓", tip: "Could not classify image", points: 0 });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const levelName =
    points < 100 ? "🌱 Seedling" :
    points < 300 ? "🌿 Sprout" :
    points < 600 ? "🌳 Tree" : "🌍 Eco Hero";

  return (
    <div style={{ background: C.bg, minHeight: "100dvh", width: "100%", fontFamily: "'Segoe UI', sans-serif", paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${C.darkGreen}, ${C.green})`, padding: "20px 20px 28px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>Welcome back 👋</p>
            <h2 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800 }}>EcoSchool AI</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 50, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌱</div>
        </div>

        <div style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 14px", fontSize: 13, marginTop: 10, fontWeight: 600 }}>
          {levelName}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {[
            { label: "Points", value: `⭐ ${points}` },
            { label: "Streak", value: `${streak}d 🔥` },
            { label: "Scanned", value: `♻️ ${history.length}` },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{s.value}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 14px" }}>

        {/* HOME */}
        {tab === "home" && (
          <div className="fade-in">
            <h3 style={{ color: C.dark, marginTop: 0, marginBottom: 12, fontSize: 16 }}>Quick Actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: "♻️", label: "Scan Waste", color: "#e8f5e9", border: "#a5d6a7", action: () => setTab("scan") },
                { icon: "📊", label: "My History", color: "#e3f2fd", border: "#90caf9", action: () => setTab("history") },
                { icon: "👥", label: "Leaderboard", color: "#fce4ec", border: "#f48fb1", action: () => setTab("social") },
                { icon: "📰", label: "Eco News", color: "#fff8e1", border: "#ffe082", action: () => setTab("news") },
              ].map((item) => (
                <div key={item.label} onClick={item.action}
                  style={{ background: item.color, borderRadius: 16, padding: "18px 12px", textAlign: "center", cursor: "pointer", border: `1.5px solid ${item.border}` }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, color: C.dark, fontSize: 13 }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div onClick={rotateTip} style={{ background: C.medGreen, borderRadius: 16, padding: 16, marginTop: 14, cursor: "pointer" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>💡 Eco Tip — tap for next</div>
              <p style={{ margin: 0, color: "white", fontSize: 14, lineHeight: 1.5 }}>{tips[tipIndex]}</p>
            </div>

            <div style={{ background: notifEnabled ? C.lightGreen : C.white, borderRadius: 16, padding: 14, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${notifEnabled ? "#a5d6a7" : "#e0e0e0"}` }}>
              <div>
                <div style={{ fontWeight: 700, color: C.darkGreen, fontSize: 14 }}>🔔 Daily Reminders</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{notifEnabled ? "✅ You're all set!" : "Get reminded to recycle daily"}</div>
              </div>
              <button onClick={enableNotifications} disabled={notifEnabled}
                style={{ padding: "8px 14px", background: notifEnabled ? "#ccc" : C.darkGreen, color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: notifEnabled ? "default" : "pointer", fontSize: 12 }}>
                {notifEnabled ? "ON ✅" : "Enable"}
              </button>
            </div>

            <h3 style={{ color: C.dark, marginTop: 18, marginBottom: 10, fontSize: 16 }}>Waste Categories</h3>
            {[
              { emoji: "🌿", name: "Wet Waste", desc: "Food scraps, peels, garden waste", pts: "15 pts" },
              { emoji: "🔋", name: "E-Waste", desc: "Phones, batteries, electronics", pts: "20 pts" },
              { emoji: "♻️", name: "Recyclable Waste", desc: "Paper, plastic, glass, metal", pts: "10 pts" },
              { emoji: "📦", name: "Dry Waste", desc: "Cardboard, newspaper, packaging", pts: "8 pts" },
              { emoji: "⚠️", name: "Hazardous Waste", desc: "Chemicals, paints, pesticides", pts: "25 pts" },
              { emoji: "🏥", name: "Medical Waste", desc: "Syringes, medicines, bandages", pts: "25 pts" },
            ].map((c) => (
              <div key={c.name} style={{ background: C.white, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <span style={{ fontSize: 26 }}>{c.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: C.gray }}>{c.desc}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.medGreen }}>{c.pts}</div>
              </div>
            ))}
          </div>
        )}

        {/* SCAN */}
        {tab === "scan" && (
          <div className="fade-in">
            <h3 style={{ color: C.dark, marginTop: 0, marginBottom: 14 }}>♻️ Classify Waste</h3>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, background: "#f3e5f5", border: "2px dashed #ce93d8", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", color: "#6a1b9a", marginBottom: 14 }}>
              🖼️ Upload Photo of Waste
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files[0] && analyzeImage(e.target.files[0])} />
            </label>

            {preview && (
              <div style={{ marginBottom: 14, borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
                <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0", color: C.gray, fontSize: 13 }}>
              <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
              or type item name
              <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
            </div>

            <div style={{ background: C.white, borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <input
                value={waste}
                onChange={(e) => setWaste(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyzeWaste()}
                placeholder="e.g. banana peel, old phone, newspaper..."
                style={{ width: "100%", padding: "13px 14px", fontSize: 15, borderRadius: 12, border: "1.5px solid #e0e0e0", outline: "none", boxSizing: "border-box", marginBottom: 10 }}
              />
              <button onClick={analyzeWaste} disabled={loading}
                style={{ width: "100%", padding: 14, background: loading ? "#bbb" : `linear-gradient(135deg, ${C.darkGreen}, ${C.green})`, color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "⏳ AI is thinking..." : "🔍 Classify Item"}
              </button>
            </div>

            {result && result.category !== "Error" && (
              <div className="pop" style={{ background: categoryColors[result.category] || C.green, borderRadius: 18, padding: 22, marginTop: 16, color: "white", boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
                <div style={{ fontSize: 56, textAlign: "center", marginBottom: 8 }}>{result.emoji}</div>
                <h2 style={{ margin: "0 0 6px", textAlign: "center", fontSize: 24 }}>{result.category}</h2>
                {result.item && <p style={{ textAlign: "center", margin: "0 0 10px", opacity: 0.9, fontSize: 14, textTransform: "capitalize" }}>Identified: <strong>{result.item}</strong></p>}
                <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "6px 20px", textAlign: "center", marginBottom: 12, fontWeight: 700, fontSize: 16 }}>
                  +{result.points} points! 🎉
                </div>
                <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>💡 {result.tip}</p>
                </div>
              </div>
            )}

            {result && result.category === "Error" && (
              <div style={{ background: "#ffebee", borderRadius: 16, padding: 16, marginTop: 14, textAlign: "center", border: "1px solid #ffcdd2" }}>
                <p style={{ color: "#c62828", margin: 0, fontWeight: 600 }}>❓ Could not classify. Please try again!</p>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ color: C.dark, margin: 0 }}>📊 My History</h3>
              {history.length > 0 && <span style={{ fontSize: 12, color: C.gray }}>{history.length} items</span>}
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: C.gray }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>📭</div>
                <p style={{ fontWeight: 600, fontSize: 16 }}>Nothing scanned yet!</p>
                <p style={{ fontSize: 14 }}>Go to Scan tab and classify your first item.</p>
                <button onClick={() => setTab("scan")} style={{ marginTop: 16, padding: "10px 24px", background: C.darkGreen, color: "white", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                  ♻️ Start Scanning
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ background: C.white, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${categoryColors[h.category]}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{h.emoji}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, textTransform: "capitalize" }}>{h.item}</div>
                        <div style={{ fontSize: 12, color: C.gray }}>{h.category}</div>
                        {h.time && <div style={{ fontSize: 11, color: "#bbb" }}>{h.time}</div>}
                      </div>
                    </div>
                    <div style={{ background: C.lightGreen, color: C.darkGreen, fontWeight: 800, borderRadius: 20, padding: "4px 12px", fontSize: 13 }}>+{h.points}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SOCIAL */}
        {tab === "social" && (
          <div className="fade-in">
            <h3 style={{ color: C.dark, marginTop: 0, marginBottom: 4 }}>👥 Leaderboard</h3>
            <p style={{ color: C.gray, fontSize: 13, marginBottom: 14 }}>Top eco warriors this week</p>
            {[
              { name: "Arjun S.", points: 520, emoji: "🥇", badge: "Eco Hero" },
              { name: "Priya M.", points: 480, emoji: "🥈", badge: "Tree" },
              { name: "You", points: points, emoji: "🥉", highlight: true, badge: levelName },
              { name: "Riya K.", points: 310, emoji: "4️⃣", badge: "Sprout" },
              { name: "Dev P.", points: 280, emoji: "5️⃣", badge: "Seedling" },
            ].map((u) => (
              <div key={u.name} style={{ background: u.highlight ? C.lightGreen : C.white, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: u.highlight ? `2px solid ${C.green}` : "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 26 }}>{u.emoji}</span>
                  <div>
                    <div style={{ fontWeight: u.highlight ? 800 : 600, color: C.dark, fontSize: 15 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: C.gray }}>{u.badge}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: C.darkGreen, fontSize: 16 }}>⭐ {u.points}</div>
              </div>
            ))}
            <div style={{ background: "#fff8e1", borderRadius: 14, padding: 14, marginTop: 6, border: "1px solid #ffe082", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#f57f17" }}>🏆 Scan more waste to climb the leaderboard!</p>
            </div>
          </div>
        )}

        {/* NEWS */}
        {tab === "news" && (
          <div className="fade-in">
            <h3 style={{ color: C.dark, marginTop: 0, marginBottom: 14 }}>📰 Eco News</h3>
            {[
              { title: "India bans single-use plastics in major cities", time: "2h ago", emoji: "🇮🇳", tag: "Policy" },
              { title: "New recycling plant opens, processes 500 tons/day", time: "5h ago", emoji: "🏭", tag: "Industry" },
              { title: "Schools across Mumbai go plastic-free this month", time: "1d ago", emoji: "🏫", tag: "Education" },
              { title: "E-waste collection drives see record participation", time: "2d ago", emoji: "🔋", tag: "E-Waste" },
              { title: "Composting program reduces city waste by 30%", time: "3d ago", emoji: "🌿", tag: "Composting" },
              { title: "Students build solar-powered recycling machine", time: "4d ago", emoji: "☀️", tag: "Innovation" },
            ].map((n, i) => (
              <div key={i} style={{ background: C.white, borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: C.lightGreen, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{n.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 700, color: C.dark, fontSize: 14, lineHeight: 1.4 }}>{n.title}</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, background: C.lightGreen, color: C.darkGreen, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{n.tag}</span>
                      <span style={{ fontSize: 11, color: C.gray }}>{n.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", background: C.white, borderTop: "1px solid #e8e8e8", display: "flex", padding: "8px 0 12px", boxShadow: "0 -4px 16px rgba(0,0,0,0.08)" }}>
        {[
          { id: "home", icon: "🏠", label: "Home" },
          { id: "scan", icon: "♻️", label: "Scan" },
          { id: "history", icon: "📊", label: "History" },
          { id: "social", icon: "👥", label: "Social" },
          { id: "news", icon: "📰", label: "News" },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0" }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{ fontSize: 10, color: tab === t.id ? C.green : C.gray, fontWeight: tab === t.id ? 800 : 400 }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 20, height: 3, borderRadius: 2, background: C.green }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
