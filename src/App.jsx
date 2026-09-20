import { useState, useRef, useEffect } from "react";

const C = {
  green: "#00c853", darkGreen: "#1b5e20", medGreen: "#2e7d32",
  lightGreen: "#f1f8e9", bg: "#f0f4f0", white: "#ffffff",
  gray: "#9e9e9e", dark: "#212121",
};

const categoryColors = {
  "Wet Waste": "#43a047", "E-Waste": "#e53935", "Recyclable Waste": "#1e88e5",
  "Dry Waste": "#fb8c00", "Hazardous Waste": "#8e24aa",
  "Medical Waste": "#d81b60", "Non-Recyclable Waste": "#6d4c41",
};

const tips = [
  "Recycling one can saves energy to power a TV for 3 hours! 📺",
  "A plastic bottle takes 450 years to decompose. ♻️",
  "Food waste in landfills creates methane! 🌿",
  "E-waste contains gold and silver — recycle it! 🔋",
  "One tonne of paper recycled saves 17 trees! 🌳",
];

const ADMIN_USER = "beluga";
const ADMIN_PASS = "beluga";

const RANKS = [
  { name: "🌱 Seedling",      min: 0 },
  { name: "🌿 Sprout",        min: 50 },
  { name: "🍃 Sapling",       min: 150 },
  { name: "🌲 Forest Guard",  min: 300 },
  { name: "♻️ Recycler",      min: 500 },
  { name: "🌍 Eco Warrior",   min: 750 },
  { name: "🔬 Eco Scientist", min: 1000 },
  { name: "🏆 Eco Champion",  min: 1500 },
  { name: "🌟 Eco Legend",    min: 2500 },
  { name: "👑 Eco God",       min: 5000 },
];

const getLevel = (pts) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (pts >= RANKS[i].min) return RANKS[i].name;
  }
  return RANKS[0].name;
};

const RANK_MAP = {
  seedling: "🌱 Seedling", sprout: "🌿 Sprout", sapling: "🍃 Sapling",
  "forest guard": "🌲 Forest Guard", forestguard: "🌲 Forest Guard",
  recycler: "♻️ Recycler",
  "eco warrior": "🌍 Eco Warrior", ecowarrior: "🌍 Eco Warrior",
  "eco scientist": "🔬 Eco Scientist", ecoscientist: "🔬 Eco Scientist",
  "eco champion": "🏆 Eco Champion", ecochampion: "🏆 Eco Champion",
  "eco legend": "🌟 Eco Legend", ecolegend: "🌟 Eco Legend",
  "eco god": "👑 Eco God", ecogod: "👑 Eco God",
};


export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("eco_user"));
  const [username, setUsername] = useState(localStorage.getItem("eco_user") || "");
  const [loginInput, setLoginInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [loginStep, setLoginStep] = useState("username");
  const [loginError, setLoginError] = useState("");
  const [admins, setAdmins] = useState(["beluga", "devansh"]);
  const isAdmin = admins.includes(username);
  const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;

  const [tab, setTab] = useState("home");
  const DEFAULT_TABS = ["home","scan","history","leaderboard","chat","dms","feedback","support"];
  const [tabOrder, setTabOrder] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem("eco_tab_order")); return Array.isArray(s) && s.length === 8 ? s : null; } catch { return null; }
  });
  const [waste, setWaste] = useState("");
  const [result, setResult] = useState(null);
  const [recyclerResult, setRecyclerResult] = useState(null);
  const [recyclerLoading, setRecyclerLoading] = useState(false);
  const [scanMode, setScanMode] = useState(null);
  const [points, setPoints] = useState(() => Number(localStorage.getItem(`eco_points_${localStorage.getItem("eco_user")}`) || 0));
  const [streak] = useState(3);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem(`eco_history_${localStorage.getItem("eco_user")}`) || "[]"));
  const [preview, setPreview] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const fileRef = useRef();

  const [spectatorTarget, setSpectatorTarget] = useState(null);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [banned, setBanned] = useState([]);
  const [roles, setRoles] = useState(() => JSON.parse(localStorage.getItem("eco_roles") || "{}"));
  const [rankOverrides, setRankOverrides] = useState(() => JSON.parse(localStorage.getItem("eco_rank_overrides") || "{}"));
  const chatEndRef = useRef();

  const currentUser = localStorage.getItem("eco_user") || "";
  const [dms, setDms] = useState(() => JSON.parse(localStorage.getItem(`eco_dm_${currentUser}`) || "[]"));
  const [dmRead, setDmRead] = useState(() => Number(localStorage.getItem(`eco_dm_read_${currentUser}`) || 0));

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("General");
  const [allFeedbacks, setAllFeedbacks] = useState(() => JSON.parse(localStorage.getItem("eco_feedbacks") || "[]"));
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [openFaq, setOpenFaq] = useState(null);
  const [serverScores, setServerScores] = useState({});

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (!loggedIn) return;
    const fetchChat = async () => { try { const r = await fetch(`${API}/api/chat`); setMessages(await r.json()); } catch {} };
    fetchChat();
    const i = setInterval(fetchChat, 2500);
    return () => clearInterval(i);
  }, [loggedIn]);
  useEffect(() => {
    if (!loggedIn) return;
    fetch(`${API}/api/admins`).then((r) => r.json()).then(setAdmins).catch(() => {});
    const i = setInterval(() => fetch(`${API}/api/admins`).then((r) => r.json()).then(setAdmins).catch(() => {}), 5000);
    return () => clearInterval(i);
  }, [loggedIn]);
  useEffect(() => {
    if (!loggedIn) return;
    fetch(`${API}/api/banned`).then((r) => r.json()).then(setBanned).catch(() => {});
    const i = setInterval(() => fetch(`${API}/api/banned`).then((r) => r.json()).then(setBanned).catch(() => {}), 5000);
    return () => clearInterval(i);
  }, [loggedIn]);
  useEffect(() => {
    if (!loggedIn) return;
    const fetchScores = async () => { try { const r = await fetch(`${API}/api/scores`); setServerScores(await r.json()); } catch {} };
    fetchScores();
    const i = setInterval(fetchScores, 10000);
    return () => clearInterval(i);
  }, [loggedIn]);
  useEffect(() => {
    if (!loggedIn || !username) return;
    fetch(`${API}/api/scores`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: username, points, scanned: history.length }) }).catch(() => {});
  }, [points, history.length, loggedIn]);
  useEffect(() => { localStorage.setItem("eco_roles", JSON.stringify(roles)); }, [roles]);
  useEffect(() => { localStorage.setItem("eco_rank_overrides", JSON.stringify(rankOverrides)); }, [rankOverrides]);
  useEffect(() => { localStorage.setItem("eco_feedbacks", JSON.stringify(allFeedbacks)); }, [allFeedbacks]);
  useEffect(() => {
    if (username) {
      localStorage.setItem(`eco_history_${username}`, JSON.stringify(history));
      localStorage.setItem(`eco_points_${username}`, points);
    }
  }, [history, points]);
  useEffect(() => {
    if (username) {
      localStorage.setItem(`eco_dm_${username}`, JSON.stringify(dms));
      localStorage.setItem(`eco_dm_read_${username}`, dmRead);
    }
  }, [dms, dmRead]);

  const isFakeUser = (name) => (JSON.parse(localStorage.getItem("eco_fake_users") || "[]")).includes(name);
  const getPasswords = () => JSON.parse(localStorage.getItem("eco_passwords") || "{}");

  const doLogin = (name) => {
    localStorage.setItem("eco_user", name);
    registerUser(name);
    setUsername(name);
    setHistory(JSON.parse(localStorage.getItem(`eco_history_${name}`) || "[]"));
    setPoints(Number(localStorage.getItem(`eco_points_${name}`) || 0));
    setDms(JSON.parse(localStorage.getItem(`eco_dm_${name}`) || "[]"));
    setDmRead(Number(localStorage.getItem(`eco_dm_read_${name}`) || 0));
    setLoggedIn(true);
  };

  const registerUser = (name) => {
    const users = JSON.parse(localStorage.getItem("eco_all_users") || "[]");
    if (!users.includes(name)) localStorage.setItem("eco_all_users", JSON.stringify([...users, name]));
  };

  const handleLoginStep1 = () => {
    const name = loginInput.trim();
    if (!name) return setLoginError("Please enter a username!");
    if (name === ADMIN_USER) { setLoginStep("adminpass"); setLoginError(""); return; }
    if (isFakeUser(name)) { setLoginError("❌ This username is reserved."); return; }
    const passwords = getPasswords();
    setLoginStep(passwords[name] ? "password" : "setpassword");
    setLoginError("");
  };

  const handleLoginPassword = () => {
    const name = loginInput.trim();
    if (passInput === getPasswords()[name]) doLogin(name);
    else setLoginError("❌ Wrong password!");
  };

  const handleSetPassword = () => {
    if (passInput.length < 3) return setLoginError("Password must be at least 3 characters!");
    const name = loginInput.trim();
    const passwords = getPasswords();
    passwords[name] = passInput;
    localStorage.setItem("eco_passwords", JSON.stringify(passwords));
    doLogin(name);
  };

  const handleAdminLogin = () => {
    if (passInput === ADMIN_PASS) doLogin(ADMIN_USER);
    else setLoginError("❌ Wrong admin password!");
  };

  const logout = () => {
    localStorage.removeItem("eco_user");
    setLoggedIn(false); setUsername(""); setLoginInput(""); setPassInput("");
    setLoginStep("username"); setLoginError(""); setSpectatorTarget(null);
  };

  const goBack = () => { setLoginStep("username"); setPassInput(""); setLoginError(""); };

  const enterSpectator = (name) => {
    setSpectatorTarget({
      name,
      pts: Number(localStorage.getItem(`eco_points_${name}`) || 0),
      history: JSON.parse(localStorage.getItem(`eco_history_${name}`) || "[]"),
      role: JSON.parse(localStorage.getItem("eco_roles") || "{}")[name] || null,
      rankOverride: JSON.parse(localStorage.getItem("eco_rank_overrides") || "{}")[name] || null,
    });
  };

  const refreshSpectator = (name) => { if (spectatorTarget?.name === name) enterSpectator(name); };

  const postMsg = (msg) => fetch(`${API}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(msg) });
  const sysPost = (text) => postMsg({ id: Date.now(), user: "System", text, system: true, time: new Date().toLocaleTimeString() });

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    if (banned.includes(username)) { setChatInput(""); return alert("You are banned from chat!"); }

    if (text.startsWith("/") && isAdmin) {
      const parts = text.split(" ");
      const cmd = parts[0].toLowerCase();
      if (cmd === "/ban" && parts[1]) {
        await fetch(`${API}/api/banned/${parts[1]}`, { method: "POST" });
        setBanned((p) => [...new Set([...p, parts[1]])]);
        await sysPost(`🔨 ${parts[1]} has been banned.`);
      } else if (cmd === "/unban" && parts[1]) {
        await fetch(`${API}/api/banned/${parts[1]}`, { method: "DELETE" });
        setBanned((p) => p.filter((u) => u !== parts[1]));
        await sysPost(`✅ ${parts[1]} has been unbanned.`);
      } else if (cmd === "/role" && parts[1] && parts[2]) {
        const role = parts.slice(2).join(" ");
        setRoles((p) => ({ ...p, [parts[1]]: role }));
        await sysPost(`🎭 ${parts[1]} given role: ${role}`);
      } else if (cmd === "/rank" && parts[1] && parts[2]) {
        const rankInput = parts.slice(2).join(" ").toLowerCase();
        const rank = RANK_MAP[rankInput] || parts.slice(2).join(" ");
        setRankOverrides((p) => ({ ...p, [parts[1]]: rank }));
        await sysPost(`⭐ ${parts[1]}'s rank set to: ${rank}`);
      } else if (cmd === "/kick" && parts[1]) {
        await fetch(`${API}/api/chat/user/${parts[1]}`, { method: "DELETE" });
        await sysPost(`👢 ${parts[1]} has been kicked.`);
      } else if (cmd === "/clear") {
        await fetch(`${API}/api/chat`, { method: "DELETE" });
        setMessages([]); setChatInput(""); return;
      } else if (cmd === "/announce") {
        await sysPost(`📢 ANNOUNCEMENT: ${parts.slice(1).join(" ")}`);
      } else if (cmd === "/spectate" && parts[1]) {
        const target = parts[1];
        const allUsers = JSON.parse(localStorage.getItem("eco_all_users") || "[]");
        if (!allUsers.includes(target)) await sysPost(`❌ User "${target}" not found.`);
        else { enterSpectator(target); await sysPost(`👁️ Now spectating ${target}.`); }
      } else if (cmd === "/setpoints" && parts[1] && parts[2]) {
        const target = parts[1]; const amt = Number(parts[2]);
        if (isNaN(amt)) { await sysPost("❌ Invalid amount."); }
        else {
          localStorage.setItem(`eco_points_${target}`, amt);
          if (target === username) setPoints(amt);
          refreshSpectator(target);
          await sysPost(`⭐ ${target}'s points set to ${amt}.`);
        }
      } else if (cmd === "/setscanned" && parts[1] && parts[2]) {
        const target = parts[1]; const amt = Number(parts[2]);
        if (isNaN(amt)) { await sysPost("❌ Invalid amount."); }
        else {
          const hist = JSON.parse(localStorage.getItem(`eco_history_${target}`) || "[]");
          const newHist = amt > hist.length
            ? [...hist, ...Array.from({ length: amt - hist.length }, (_, i) => ({ ...WASTE_POOL[i % WASTE_POOL.length], time: "12:00 PM" }))]
            : hist.slice(0, amt);
          localStorage.setItem(`eco_history_${target}`, JSON.stringify(newHist));
          if (target === username) setHistory(newHist);
          refreshSpectator(target);
          await sysPost(`📦 ${target}'s scanned count set to ${amt}.`);
        }
      } else if (cmd === "/dm" && parts[1] && parts[2]) {
        const target = parts[1]; const msg = parts.slice(2).join(" ");
        const existing = JSON.parse(localStorage.getItem(`eco_dm_${target}`) || "[]");
        const dm = { id: Date.now(), from: "Admin 👑", text: msg, time: new Date().toLocaleTimeString() };
        localStorage.setItem(`eco_dm_${target}`, JSON.stringify([...existing, dm]));
        if (target === username) setDms((p) => [...p, dm]);
        await sysPost(`📬 Private message sent to ${target}.`);
      } else if (cmd === "/makeadmin" && parts[1]) {
        await fetch(`${API}/api/admins/${parts[1]}`, { method: "POST" });
        setAdmins((p) => [...new Set([...p, parts[1]])]);
        await sysPost(`👑 ${parts[1]} has been promoted to Admin!`);
      } else if (cmd === "/removeadmin" && parts[1]) {
        if (parts[1] === "beluga") await sysPost("❌ Cannot remove the main admin.");
        else {
          await fetch(`${API}/api/admins/${parts[1]}`, { method: "DELETE" });
          setAdmins((p) => p.filter((a) => a !== parts[1]));
          await sysPost(`🚫 ${parts[1]}'s admin has been removed.`);
        }
      } else if (cmd === "/movetab" && parts[1] && parts[2]) {
        const tabId = parts[1].toLowerCase();
        const pos = parseInt(parts[2]) - 1;
        const validIds = ["home","scan","history","leaderboard","chat","dms","feedback","support"];
        if (!validIds.includes(tabId)) { await sysPost(`❌ Unknown tab "${tabId}". Valid: ${validIds.join(", ")}`); }
        else if (isNaN(pos) || pos < 0 || pos > 7) { await sysPost("❌ Position must be 1–8."); }
        else {
          const current = tabOrder ? [...tabOrder] : [...DEFAULT_TABS];
          const from = current.indexOf(tabId);
          current.splice(from, 1);
          current.splice(pos, 0, tabId);
          setTabOrder(current);
          localStorage.setItem("eco_tab_order", JSON.stringify(current));
          await sysPost(`🔀 Moved "${tabId}" to position ${pos + 1}. Order: ${current.join(", ")}`);
        }
      } else if (cmd === "/resettabs") {
        setTabOrder(null);
        localStorage.removeItem("eco_tab_order");
        await sysPost("🔄 Tab order reset to default.");
      } else if (cmd === "/help") {
        await sysPost(`Commands: /ban /unban /role [u] [r] /rank [u] [r] /kick /clear /announce /spectate [u] /setpoints [u] [n] /setscanned [u] [n] /dm [u] [msg] /makeadmin [u] /removeadmin [u] /movetab [tab] [1-8] /resettabs`);
      } else {
        await sysPost(`❌ Unknown command: ${cmd}`);
      }
      setChatInput(""); return;
    }

    if (text.startsWith("/") && !isAdmin) {
      await sysPost("❌ Only admins can use commands.");
      setChatInput(""); return;
    }

    const msg = {
      id: Date.now(), user: username, text,
      role: roles[username] || null,
      level: rankOverrides[username] || levelName,
      isAdmin: admins.includes(username),
      time: new Date().toLocaleTimeString(),
    };
    const res = await postMsg(msg);
    if (res.status === 403) { alert("🔨 You are banned from chat!"); setChatInput(""); return; }
    setMessages((p) => [...p, msg]);
    setChatInput("");
  };

  const rotateTip = () => setTipIndex((i) => (i + 1) % tips.length);

  const enableNotifications = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifEnabled(true);
      new Notification("EcoSchool AI 🌱", { body: "Daily reminders enabled! ♻️" });
    }
  };

  const handleResult = (data, itemName) => {
    setResult(data);
    setPoints((p) => p + data.points);
    setHistory((p) => [{ item: itemName || data.item || "Unknown", ...data, time: new Date().toLocaleTimeString() }, ...p.slice(0, 19)]);
  };

  const analyzeWaste = async () => {
    if (!waste.trim()) return;
    setLoading(true); setResult(null); setRecyclerResult(null); setPreview(null); setScanMode("waste");
    try {
      const res = await fetch(`${API}/api/classify-waste`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: waste }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      handleResult(data, waste); setWaste("");
    } catch { setResult({ category: "Error", emoji: "❓", tip: "Could not classify", points: 0 }); }
    finally { setLoading(false); }
  };

  const findRecyclers = async () => {
    if (!waste.trim()) return;
    setRecyclerLoading(true); setRecyclerResult(null); setResult(null); setPreview(null); setScanMode("recyclers");
    try {
      const res = await fetch(`${API}/api/find-recyclers`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: waste }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecyclerResult(data); setWaste("");
    } catch { setRecyclerResult({ error: true }); }
    finally { setRecyclerLoading(false); }
  };

  const analyzeImage = (file) => {
    setLoading(true); setResult(null); setRecyclerResult(null); setScanMode("waste");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result; setPreview(base64);
      try {
        const res = await fetch(`${API}/api/classify-image`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        handleResult(data, data.item);
      } catch { setResult({ category: "Error", emoji: "❓", tip: "Could not classify image", points: 0 }); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const levelName = rankOverrides[username] || getLevel(points);

  const getLeaderboard = () => {
    const overrides = JSON.parse(localStorage.getItem("eco_rank_overrides") || "{}");
    const rolesData = JSON.parse(localStorage.getItem("eco_roles") || "{}");
    return Object.entries(serverScores)
      .map(([name, data]) => ({
        name,
        pts: data.points || 0,
        scanned: data.scanned || 0,
        isAdmin: admins.includes(name),
        isFake: false,
        role: rolesData[name] || null,
        level: overrides[name] || getLevel(data.points || 0),
      }))
      .sort((a, b) => b.pts - a.pts);
  };

  const submitFeedback = async () => {
    if (!feedbackRating) return alert("Please select a star rating!");
    const entry = {
      id: Date.now(), user: username, rating: feedbackRating,
      category: feedbackCategory, text: feedbackText.trim(),
      time: new Date().toLocaleDateString(),
    };
    setAllFeedbacks((p) => [entry, ...p]);
    try {
      await fetch(`${API}/api/send-feedback`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entry, to: "darshpoddar2015@gmail.com" }),
      });
    } catch {}
    setFeedbackRating(0); setFeedbackText(""); setFeedbackCategory("General");
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 3000);
  };

  const unreadDms = dms.length - dmRead;

  const inputStyle = {
    width: "100%", padding: "13px 14px", fontSize: 15,
    borderRadius: 12, border: "1.5px solid #e0e0e0",
    outline: "none", boxSizing: "border-box", marginBottom: 12,
  };
  const btnStyle = (bg) => ({
    width: "100%", padding: 14, background: bg, color: "white",
    border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer",
  });

  if (!loggedIn) return (
    <div style={{ background: `linear-gradient(135deg, ${C.darkGreen}, ${C.green})`, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 24, padding: 32, width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🌱</div>
          <h2 style={{ margin: 0, color: C.darkGreen, fontSize: 26, fontWeight: 800 }}>EcoSchool AI</h2>
          <p style={{ color: C.gray, fontSize: 14, margin: "6px 0 0" }}>learn. grow. thrive.</p>
        </div>

        {loginStep === "username" && <>
          <p style={{ fontWeight: 700, color: C.dark, marginBottom: 8 }}>Enter your username</p>
          <input value={loginInput} onChange={(e) => setLoginInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoginStep1()}
            placeholder="e.g. Arjun, Priya..." style={inputStyle} />
          {loginError && <p style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{loginError}</p>}
          <button onClick={handleLoginStep1} style={btnStyle(`linear-gradient(135deg, ${C.darkGreen}, ${C.green})`)}>Continue →</button>
        </>}

        {loginStep === "adminpass" && <>
          <div style={{ background: "#fff3e0", borderRadius: 12, padding: 12, marginBottom: 16, textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#e65100" }}>👑 Admin Login</p>
          </div>
          <input value={passInput} onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            type="password" placeholder="Admin password" style={inputStyle} />
          {loginError && <p style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{loginError}</p>}
          <button onClick={handleAdminLogin} style={btnStyle("#e65100")}>Login as Admin 👑</button>
          <button onClick={goBack} style={{ width: "100%", padding: 10, background: "none", border: "none", color: C.gray, cursor: "pointer", marginTop: 8 }}>← Back</button>
        </>}

        {loginStep === "password" && <>
          <div style={{ background: C.lightGreen, borderRadius: 12, padding: 12, marginBottom: 16, textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 700, color: C.darkGreen }}>Welcome back, {loginInput.trim()}! 👋</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.gray }}>Enter your password</p>
          </div>
          <input value={passInput} onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoginPassword()}
            type="password" placeholder="Your password" style={inputStyle} />
          {loginError && <p style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{loginError}</p>}
          <button onClick={handleLoginPassword} style={btnStyle(`linear-gradient(135deg, ${C.darkGreen}, ${C.green})`)}>Login 🚀</button>
          <button onClick={goBack} style={{ width: "100%", padding: 10, background: "none", border: "none", color: C.gray, cursor: "pointer", marginTop: 8 }}>← Back</button>
        </>}

        {loginStep === "setpassword" && <>
          <div style={{ background: "#e3f2fd", borderRadius: 12, padding: 12, marginBottom: 16, textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#1565c0" }}>🎉 New account: {loginInput.trim()}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.gray }}>Create a password to protect your progress</p>
          </div>
          <input value={passInput} onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
            type="password" placeholder="Create a password (min 3 chars)" style={inputStyle} />
          {loginError && <p style={{ color: "red", fontSize: 13, marginBottom: 8 }}>{loginError}</p>}
          <button onClick={handleSetPassword} style={btnStyle(`linear-gradient(135deg, ${C.darkGreen}, ${C.green})`)}>Create Account 🌱</button>
          <button onClick={goBack} style={{ width: "100%", padding: 10, background: "none", border: "none", color: C.gray, cursor: "pointer", marginTop: 8 }}>← Back</button>
        </>}
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100dvh", width: "100%", fontFamily: "'Segoe UI', sans-serif", paddingBottom: 80 }}>

      {/* SPECTATOR MODAL */}
      {spectatorTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, color: C.darkGreen }}>👁️ Spectating: {spectatorTarget.name}</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.gray }}>Read-only view</p>
              </div>
              <button onClick={() => setSpectatorTarget(null)} style={{ background: "#ffebee", border: "none", borderRadius: 10, padding: "6px 14px", color: "#c62828", fontWeight: 700, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${C.darkGreen}, ${C.green})`, borderRadius: 14, padding: 16, color: "white", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Level</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{spectatorTarget.rankOverride || getLevel(spectatorTarget.pts)}</div>
                  {spectatorTarget.role && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>🎭 {spectatorTarget.role}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Points</div>
                  <div style={{ fontWeight: 800, fontSize: 24 }}>⭐ {spectatorTarget.pts}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>📦 {spectatorTarget.history.length} scanned</div>
                </div>
              </div>
            </div>
            <div style={{ background: "#fff3e0", borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12, color: "#e65100" }}>
              <strong>Admin quick commands:</strong><br />
              /setpoints {spectatorTarget.name} [n] · /setscanned {spectatorTarget.name} [n] · /dm {spectatorTarget.name} [msg]
            </div>
            <p style={{ fontWeight: 700, color: C.dark, margin: "0 0 8px", fontSize: 13 }}>Recent Items</p>
            {spectatorTarget.history.length === 0
              ? <p style={{ color: C.gray, fontSize: 13 }}>No items scanned yet.</p>
              : spectatorTarget.history.slice(0, 10).map((h, i) => (
                <div key={i} style={{ background: C.lightGreen, borderRadius: 10, padding: "8px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: C.dark, textTransform: "capitalize" }}>{h.emoji} {h.item}</span>
                  <span style={{ fontSize: 12, color: C.darkGreen, fontWeight: 700 }}>+{h.points}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${C.darkGreen}, ${C.green})`, padding: "16px 16px 24px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>Welcome back, <strong>{username}</strong> {isAdmin ? "👑" : "👋"}</p>
            <h2 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800 }}>EcoSchool AI</h2>
          </div>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 20, padding: "6px 12px", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Logout</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>{levelName}</div>
          {isAdmin && <div style={{ background: "#e65100", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>👑 Admin</div>}
          {roles[username] && <div style={{ background: "#6a1b9a", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>🎭 {roles[username]}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[{ label: "Points", value: `⭐ ${points}` }, { label: "Streak", value: `${streak}d 🔥` }, { label: "Scanned", value: `♻️ ${history.length}` }].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{s.value}</div>
              <div style={{ fontSize: 10, opacity: 0.85 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 12px" }}>

        {/* HOME */}
        {tab === "home" && (
          <div>
            <h3 style={{ color: C.dark, marginTop: 0, marginBottom: 10, fontSize: 15 }}>Quick Actions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: "♻️", label: "Scan Item",       color: "#e8f5e9", border: "#a5d6a7", action: () => setTab("scan") },
                { icon: "📊", label: "My History",       color: "#e3f2fd", border: "#90caf9", action: () => setTab("history") },
                { icon: "🏆", label: "Leaderboard",      color: "#fff8e1", border: "#ffe082", action: () => setTab("leaderboard") },
                { icon: "💬", label: "Community Chat",   color: "#fce4ec", border: "#f48fb1", action: () => setTab("chat") },
                { icon: "⭐", label: "Give Feedback",    color: "#fff3e0", border: "#ffcc80", action: () => setTab("feedback") },
                { icon: "❓", label: "Help & Support",   color: "#ede7f6", border: "#ce93d8", action: () => setTab("support") },
              ].map((item) => (
                <div key={item.label} onClick={item.action}
                  style={{ background: item.color, borderRadius: 14, padding: "16px 10px", textAlign: "center", cursor: "pointer", border: `1.5px solid ${item.border}` }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, color: C.dark, fontSize: 13 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div onClick={rotateTip} style={{ background: C.medGreen, borderRadius: 14, padding: 14, marginTop: 12, cursor: "pointer" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 3 }}>💡 Eco Tip — tap for next</div>
              <p style={{ margin: 0, color: "white", fontSize: 14, lineHeight: 1.5 }}>{tips[tipIndex]}</p>
            </div>
            <div style={{ background: notifEnabled ? C.lightGreen : C.white, borderRadius: 14, padding: 12, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${notifEnabled ? "#a5d6a7" : "#e0e0e0"}` }}>
              <div>
                <div style={{ fontWeight: 700, color: C.darkGreen, fontSize: 14 }}>🔔 Daily Reminders</div>
                <div style={{ fontSize: 12, color: C.gray }}>{notifEnabled ? "✅ You're all set!" : "Get reminded to recycle daily"}</div>
              </div>
              <button onClick={enableNotifications} disabled={notifEnabled}
                style={{ padding: "7px 12px", background: notifEnabled ? "#ccc" : C.darkGreen, color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: notifEnabled ? "default" : "pointer", fontSize: 12 }}>
                {notifEnabled ? "ON ✅" : "Enable"}
              </button>
            </div>
            <h3 style={{ color: C.dark, marginTop: 16, marginBottom: 8, fontSize: 15 }}>🏅 All Ranks</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {RANKS.map((r) => (
                <div key={r.name} style={{ background: C.white, borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", border: levelName === r.name ? `1.5px solid ${C.green}` : "1.5px solid transparent" }}>
                  <span style={{ fontSize: 12, fontWeight: levelName === r.name ? 800 : 600, color: levelName === r.name ? C.darkGreen : C.dark }}>{r.name}</span>
                  <span style={{ fontSize: 10, color: C.gray }}>{r.min}+</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCAN */}
        {tab === "scan" && (
          <div>
            <h3 style={{ color: C.dark, marginTop: 0, marginBottom: 4 }}>♻️ Scan Item</h3>
            <p style={{ color: C.gray, fontSize: 13, marginTop: 0, marginBottom: 12 }}>Classify waste <strong>or</strong> find companies that recycle it</p>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, background: "#f3e5f5", border: "2px dashed #ce93d8", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#6a1b9a", marginBottom: 12 }}>
              🖼️ Upload Photo
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files[0] && analyzeImage(e.target.files[0])} />
            </label>
            {preview && <div style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden" }}><img src={preview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} /></div>}

            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0", color: C.gray, fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />or type item name<div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
            </div>

            <div style={{ background: C.white, borderRadius: 14, padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <input value={waste} onChange={(e) => setWaste(e.target.value)} onKeyDown={(e) => e.key === "Enter" && analyzeWaste()}
                placeholder="e.g. tyre, phone, marigold, plastic bottle..."
                style={{ width: "100%", padding: 12, fontSize: 14, borderRadius: 10, border: "1.5px solid #e0e0e0", outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={analyzeWaste} disabled={loading || recyclerLoading}
                  style={{ flex: 1, padding: 12, background: loading && scanMode === "waste" ? "#bbb" : `linear-gradient(135deg, ${C.darkGreen}, ${C.green})`, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {loading && scanMode === "waste" ? "⏳ Thinking..." : "🗑️ Classify Waste"}
                </button>
                <button onClick={findRecyclers} disabled={loading || recyclerLoading}
                  style={{ flex: 1, padding: 12, background: recyclerLoading ? "#bbb" : "linear-gradient(135deg, #1565c0, #1e88e5)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {recyclerLoading ? "⏳ Searching..." : "🏭 Find Companies"}
                </button>
              </div>
            </div>

            {result && result.category !== "Error" && scanMode === "waste" && (
              <div style={{ background: categoryColors[result.category] || C.green, borderRadius: 16, padding: 20, marginTop: 14, color: "white", boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
                <div style={{ fontSize: 52, textAlign: "center", marginBottom: 6 }}>{result.emoji}</div>
                <h2 style={{ margin: "0 0 4px", textAlign: "center", fontSize: 22 }}>{result.category}</h2>
                {result.item && <p style={{ textAlign: "center", margin: "0 0 8px", opacity: 0.9, fontSize: 13 }}>Identified: <strong>{result.item}</strong></p>}
                <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "5px 16px", textAlign: "center", marginBottom: 10, fontWeight: 700 }}>+{result.points} points! 🎉</div>
                <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 10, padding: 10 }}>
                  <p style={{ margin: 0, fontSize: 13 }}>💡 {result.tip}</p>
                </div>
              </div>
            )}
            {result && result.category === "Error" && (
              <div style={{ background: "#ffebee", borderRadius: 14, padding: 14, marginTop: 12, textAlign: "center" }}>
                <p style={{ color: "#c62828", margin: 0, fontWeight: 600 }}>❓ Could not classify. Try again!</p>
              </div>
            )}

            {recyclerResult && !recyclerResult.error && (
              <div style={{ background: "#e3f2fd", borderRadius: 16, padding: 16, marginTop: 14 }}>
                <h3 style={{ margin: "0 0 10px", color: "#1565c0", fontSize: 16 }}>
                  🏭 Who recycles <span style={{ textTransform: "capitalize" }}>{recyclerResult.item}</span>?
                </h3>
                {recyclerResult.usages?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 12, color: "#555", fontWeight: 600 }}>♻️ Can be turned into:</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {recyclerResult.usages.map((u, i) => (
                        <span key={i} style={{ background: "#bbdefb", color: "#1565c0", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{u}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {recyclerResult.companies?.map((c, i) => (
                    <div key={i} style={{ background: "white", borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontWeight: 700, color: "#1565c0", fontSize: 14 }}>🏢 {c.name}</div>
                      <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{c.type}</div>
                      {c.note && <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>📌 {c.note}</div>}
                    </div>
                  ))}
                </div>
                {recyclerResult.tip && (
                  <div style={{ background: "#fff3e0", borderRadius: 10, padding: 10, marginTop: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#e65100" }}>💡 {recyclerResult.tip}</p>
                  </div>
                )}
              </div>
            )}
            {recyclerResult?.error && (
              <div style={{ background: "#ffebee", borderRadius: 14, padding: 14, marginTop: 12, textAlign: "center" }}>
                <p style={{ color: "#c62828", margin: 0, fontWeight: 600 }}>❓ Could not find companies. Try again!</p>
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ color: C.dark, margin: 0 }}>📊 My History</h3>
              {history.length > 0 && <span style={{ fontSize: 12, color: C.gray }}>{history.length} items</span>}
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: C.gray }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>📭</div>
                <p style={{ fontWeight: 600 }}>Nothing scanned yet!</p>
                <button onClick={() => setTab("scan")} style={{ marginTop: 12, padding: "10px 20px", background: C.darkGreen, color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>♻️ Start Scanning</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ background: C.white, borderRadius: 12, padding: "11px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${categoryColors[h.category]}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{h.emoji}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: C.dark, textTransform: "capitalize" }}>{h.item}</div>
                        <div style={{ fontSize: 11, color: C.gray }}>{h.category} · {h.time}</div>
                      </div>
                    </div>
                    <div style={{ background: C.lightGreen, color: C.darkGreen, fontWeight: 800, borderRadius: 20, padding: "3px 10px", fontSize: 12 }}>+{h.points}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 220px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ color: C.dark, margin: 0 }}>💬 Community Chat</h3>
              {isAdmin && <div style={{ fontSize: 11, background: "#e65100", color: "white", borderRadius: 10, padding: "3px 8px", fontWeight: 700 }}>👑 Admin Mode</div>}
            </div>
            {isAdmin && (
              <div style={{ background: "#fff3e0", borderRadius: 10, padding: 8, marginBottom: 10, fontSize: 10, color: "#e65100", lineHeight: 1.6 }}>
                /ban /unban /role /rank /kick /clear /announce /spectate [u] /setpoints [u] [n] /setscanned [u] [n] /dm [u] [msg]
              </div>
            )}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: 30, color: C.gray }}>
                  <div style={{ fontSize: 40 }}>💬</div>
                  <p>No messages yet. Say hello!</p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.system ? "center" : m.user === username ? "flex-end" : "flex-start" }}>
                  {m.system ? (
                    <div style={{ background: "#f5f5f5", borderRadius: 10, padding: "6px 12px", fontSize: 12, color: C.gray, maxWidth: "90%", textAlign: "center" }}>{m.text}</div>
                  ) : (
                    <div style={{ maxWidth: "75%" }}>
                      <div style={{ fontSize: 11, color: C.gray, marginBottom: 3, display: "flex", flexWrap: "wrap", gap: 4, justifyContent: m.user === username ? "flex-end" : "flex-start", alignItems: "center" }}>
                        {m.isAdmin && <span style={{ background: "#e65100", color: "white", borderRadius: 6, padding: "1px 5px", fontWeight: 700, fontSize: 10 }}>👑</span>}
                        <span style={{ fontWeight: 700, color: C.dark }}>{m.user}</span>
                        {m.level && <span style={{ background: "#e8f5e9", color: C.darkGreen, borderRadius: 6, padding: "1px 5px", fontWeight: 600, fontSize: 10 }}>{m.level}</span>}
                        {m.role && <span style={{ background: "#ede7f6", color: "#6a1b9a", borderRadius: 6, padding: "1px 5px", fontWeight: 600, fontSize: 10 }}>🎭 {m.role}</span>}
                        <span>{m.time}</span>
                      </div>
                      <div style={{ background: m.user === username ? C.darkGreen : C.white, color: m.user === username ? "white" : C.dark, borderRadius: m.user === username ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 14px", fontSize: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                        {m.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={isAdmin ? "Type message or /command..." : "Type a message..."}
                style={{ flex: 1, padding: "12px 14px", fontSize: 14, borderRadius: 12, border: "1.5px solid #e0e0e0", outline: "none" }} />
              <button onClick={sendMessage} style={{ padding: "0 16px", background: C.darkGreen, color: "white", border: "none", borderRadius: 12, fontSize: 20, cursor: "pointer" }}>➤</button>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {tab === "leaderboard" && (() => {
          const board = getLeaderboard();
          const medals = ["🥇", "🥈", "🥉"];
          const myRank = board.findIndex((u) => u.name === username) + 1;
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ color: C.dark, margin: 0 }}>🏆 Leaderboard</h3>
                <span style={{ fontSize: 12, color: C.gray }}>{board.length} players</span>
              </div>
              {myRank > 0 && (
                <div style={{ background: `linear-gradient(135deg, ${C.darkGreen}, ${C.green})`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: 12, opacity: 0.85 }}>Your rank</div><div style={{ fontWeight: 800, fontSize: 22 }}>#{myRank}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, opacity: 0.85 }}>Your points</div><div style={{ fontWeight: 800, fontSize: 22 }}>⭐ {points}</div></div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {board.map((u, i) => {
                  const isMe = u.name === username;
                  const isTop3 = i < 3;
                  const canSpectate = isAdmin && !u.isFake && !u.isAdmin;
                  return (
                    <div key={u.name} onClick={() => canSpectate && enterSpectator(u.name)}
                      style={{ background: isMe ? "#e8f5e9" : C.white, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, border: isMe ? `2px solid ${C.green}` : "2px solid transparent", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: canSpectate ? "pointer" : "default" }}>
                      <div style={{ width: 36, textAlign: "center", fontSize: isTop3 ? 24 : 16, fontWeight: 800, color: isTop3 ? undefined : C.gray }}>
                        {isTop3 ? medals[i] : `#${i + 1}`}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{u.name}{isMe && " (You)"}</span>
                          {u.isAdmin && <span style={{ fontSize: 10, background: "#e65100", color: "white", borderRadius: 6, padding: "1px 6px", fontWeight: 700 }}>👑 Admin</span>}

                          {u.role && <span style={{ fontSize: 10, background: "#6a1b9a", color: "white", borderRadius: 6, padding: "1px 6px", fontWeight: 700 }}>{u.role}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{u.scanned} items · {u.level}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: C.darkGreen }}>⭐ {u.pts}</div>
                        {canSpectate && <div style={{ fontSize: 10, color: C.gray }}>👁️ view</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* DMs */}
        {tab === "dms" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ color: C.dark, margin: 0 }}>📬 Messages from Admin</h3>
              <span style={{ fontSize: 12, color: C.gray }}>{dms.length} messages</span>
            </div>
            {dms.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: C.gray }}>
                <div style={{ fontSize: 52 }}>📭</div>
                <p style={{ fontWeight: 600 }}>No messages yet.</p>
                <p style={{ fontSize: 13 }}>Private messages from Admin will appear here.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...dms].reverse().map((dm) => (
                  <div key={dm.id} style={{ background: C.white, borderRadius: 14, padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1.5px solid ${C.lightGreen}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ background: "#e65100", color: "white", fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "2px 8px" }}>👑 {dm.from}</span>
                      <span style={{ fontSize: 11, color: C.gray }}>{dm.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: C.dark, lineHeight: 1.5 }}>{dm.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK */}
        {tab === "feedback" && (
          <div>
            <h3 style={{ color: C.dark, marginTop: 0, marginBottom: 4 }}>⭐ Feedback</h3>
            <p style={{ color: C.gray, fontSize: 13, marginTop: 0, marginBottom: 14 }}>Help us improve EcoSchool AI!</p>
            {feedbackSubmitted && (
              <div style={{ background: "#e8f5e9", border: "1.5px solid #a5d6a7", borderRadius: 12, padding: 14, marginBottom: 14, textAlign: "center" }}>
                <div style={{ fontSize: 28 }}>🎉</div>
                <p style={{ margin: "6px 0 0", fontWeight: 700, color: C.darkGreen }}>Thank you! Feedback sent.</p>
              </div>
            )}
            <div style={{ background: C.white, borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: 16 }}>
              <p style={{ fontWeight: 700, color: C.dark, margin: "0 0 10px", fontSize: 14 }}>Rate your experience</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} onClick={() => setFeedbackRating(star)}
                    onMouseEnter={() => setFeedbackHover(star)} onMouseLeave={() => setFeedbackHover(0)}
                    style={{ fontSize: 36, cursor: "pointer", transition: "transform 0.1s", transform: (feedbackHover || feedbackRating) >= star ? "scale(1.2)" : "scale(1)", filter: (feedbackHover || feedbackRating) >= star ? "none" : "grayscale(1)" }}>⭐</span>
                ))}
              </div>
              {feedbackRating > 0 && (
                <p style={{ textAlign: "center", fontSize: 13, color: C.darkGreen, fontWeight: 600, margin: "0 0 12px" }}>
                  {["", "Poor 😞", "Fair 😐", "Good 🙂", "Great 😄", "Excellent 🤩"][feedbackRating]}
                </p>
              )}
              <p style={{ fontWeight: 700, color: C.dark, margin: "0 0 8px", fontSize: 13 }}>Category</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                {["General", "Scanning", "Leaderboard", "Chat", "Performance", "Bug Report"].map((cat) => (
                  <button key={cat} onClick={() => setFeedbackCategory(cat)}
                    style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid", borderColor: feedbackCategory === cat ? C.darkGreen : "#e0e0e0", background: feedbackCategory === cat ? C.darkGreen : C.white, color: feedbackCategory === cat ? "white" : C.gray, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {cat}
                  </button>
                ))}
              </div>
              <p style={{ fontWeight: 700, color: C.dark, margin: "0 0 8px", fontSize: 13 }}>Comments (optional)</p>
              <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what you think..." rows={3}
                style={{ width: "100%", padding: 12, fontSize: 14, borderRadius: 10, border: "1.5px solid #e0e0e0", outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", marginBottom: 12 }} />
              <button onClick={submitFeedback}
                style={{ width: "100%", padding: 13, background: `linear-gradient(135deg, ${C.darkGreen}, ${C.green})`, color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Submit Feedback ⭐
              </button>
            </div>
            {(isAdmin ? allFeedbacks : allFeedbacks.filter((f) => f.user === username)).length > 0 && (
              <div>
                <h4 style={{ color: C.dark, margin: "0 0 10px", fontSize: 14 }}>
                  {isAdmin ? `📋 All Feedback (${allFeedbacks.length})` : "📋 Your Past Feedback"}
                </h4>
                {(isAdmin ? allFeedbacks : allFeedbacks.filter((f) => f.user === username)).map((f) => (
                  <div key={f.id} style={{ background: C.white, borderRadius: 12, padding: 12, marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: C.dark }}>{f.user}</span>
                        <span style={{ fontSize: 10, background: C.lightGreen, color: C.darkGreen, borderRadius: 8, padding: "1px 7px", fontWeight: 600 }}>{f.category}</span>
                      </div>
                      <span style={{ fontSize: 11, color: C.gray }}>{f.time}</span>
                    </div>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{"⭐".repeat(f.rating)}</div>
                    {f.text && <p style={{ margin: 0, fontSize: 13, color: C.gray, lineHeight: 1.4 }}>{f.text}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HELP */}
        {tab === "support" && (() => {
          const faqs = [
            { q: "How do I earn points?", a: "Scan items in the Scan tab. Hazardous/Medical = 25 pts, E-Waste = 20 pts, Wet Waste = 15 pts, Recyclable = 10 pts, Dry Waste = 8 pts." },
            { q: "How do 10 ranks work?", a: "Seedling (0) → Sprout (50) → Sapling (150) → Forest Guard (300) → Recycler (500) → Eco Warrior (750) → Eco Scientist (1000) → Eco Champion (1500) → Eco Legend (2500) → Eco God (5000)." },
            { q: "What is my password for?", a: "Your password protects your account. You set it on first sign-up." },
            { q: "What are bot accounts?", a: "The leaderboard has 🤖 Bot accounts to fill it up. They are not real players." },
            { q: "How does Find Companies work?", a: "Type any item (tyre, phone, flowers...) then tap 🏭 Find Companies to see who recycles it in India." },
            { q: "How does the AI scan work?", a: "Type item name or upload a photo. AI classifies it and awards points." },
            { q: "What are DMs?", a: "Admin can send you private messages. Check the 📬 DMs tab." },
            { q: "How does Community Chat work?", a: "Chat with all users. Admins can use /ban, /announce, /spectate, /dm and more." },
          ];
          return (
            <div>
              <h3 style={{ color: C.dark, marginTop: 0, marginBottom: 4 }}>❓ Help & Support</h3>
              <p style={{ color: C.gray, fontSize: 13, marginTop: 0, marginBottom: 14 }}>Everything you need to know</p>
              <div style={{ background: `linear-gradient(135deg, ${C.darkGreen}, ${C.green})`, borderRadius: 16, padding: 16, marginBottom: 16, color: "white" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 15 }}>🚀 Quick Start</p>
                {["Enter username → set password → you're in!", "Scan → type item or upload photo → AI classifies it", "Or tap 🏭 Find Companies to find recyclers near you", "Earn points → level through 10 ranks!"].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                    <p style={{ margin: 0, fontSize: 13 }}>{s}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontWeight: 700, color: C.dark, fontSize: 14, margin: "0 0 10px" }}>💬 FAQ</p>
              {faqs.map((faq, i) => (
                <div key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ background: C.white, borderRadius: 12, padding: 14, marginBottom: 8, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", border: openFaq === i ? `1.5px solid ${C.green}` : "1.5px solid transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.dark, flex: 1, paddingRight: 8 }}>{faq.q}</span>
                    <span style={{ fontSize: 14, color: C.green }}>{openFaq === i ? "▲" : "▼"}</span>
                  </div>
                  {openFaq === i && <p style={{ margin: "10px 0 0", fontSize: 13, color: C.gray, lineHeight: 1.6 }}>{faq.a}</p>}
                </div>
              ))}
              <div style={{ background: "#e3f2fd", borderRadius: 14, padding: 14, marginTop: 6, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📧</div>
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#1565c0", fontSize: 14 }}>Still need help?</p>
                <p style={{ margin: 0, fontSize: 13, color: "#1976d2" }}>Contact the admin in Community Chat!</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", background: C.white, borderTop: "1px solid #e8e8e8", boxShadow: "0 -4px 16px rgba(0,0,0,0.08)", overflowX: "auto" }}>
        <div style={{ display: "flex", padding: "8px 0 10px", minWidth: "max-content", width: "100%" }}>
          {(tabOrder || DEFAULT_TABS).map((id) => ({
              home:        { id: "home",        icon: "🏠", label: "Home" },
              scan:        { id: "scan",        icon: "♻️", label: "Scan" },
              history:     { id: "history",     icon: "📊", label: "History" },
              leaderboard: { id: "leaderboard", icon: "🏆", label: "Ranks" },
              chat:        { id: "chat",        icon: "💬", label: "Chat" },
              dms:         { id: "dms",         icon: "📬", label: "DMs", badge: unreadDms > 0 ? unreadDms : null },
              feedback:    { id: "feedback",    icon: "⭐", label: "Feedback" },
              support:     { id: "support",     icon: "❓", label: "Help" },
            }[id])).map((t) => (
            <button key={t.id}
              onClick={() => { setTab(t.id); if (t.id === "dms") setDmRead(dms.length); }}
              style={{ flex: "0 0 12.5%", minWidth: 56, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 0", position: "relative" }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              {t.badge && (
                <div style={{ position: "absolute", top: 0, right: "18%", background: "#e53935", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.badge}</div>
              )}
              <span style={{ fontSize: 9, color: tab === t.id ? C.green : C.gray, fontWeight: tab === t.id ? 800 : 400 }}>{t.label}</span>
              {tab === t.id && <div style={{ width: 18, height: 3, borderRadius: 2, background: C.green }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
