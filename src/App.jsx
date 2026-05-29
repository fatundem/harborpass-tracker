import { useState, useEffect } from "react";

// ── CONFIGURATION ─────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://kkmgvmdjdijbovmhzwul.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbWd2bWRqZGlqYm92bWh6d3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTczMjgsImV4cCI6MjA5NTU5MzMyOH0.smBFtagcKfd-8VRxv5CugcCpSRF8k-i1LgT7IjHUfEo";
// ─────────────────────────────────────────────────────────────────────────────

const STAGES = [
  { id: "sourced",     label: "Sourced",          desc: "Initial contact made" },
  { id: "qualified",   label: "Qualified",         desc: "Fit confirmed, DM identified" },
  { id: "commercial",  label: "Commercial Review", desc: "Pricing discussion active" },
  { id: "diligence",   label: "Diligence",         desc: "KYB/KYC underway" },
  { id: "integration", label: "Integration",       desc: "Tech integration in progress" },
  { id: "live",        label: "Live",              desc: "Transacting — rev share active" },
];

const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s.id, i]));

const COLORS = {
  sourced:     { accent: "#4a4a6a", text: "#a0a0c0" },
  qualified:   { accent: "#1a5276", text: "#7fb3d3" },
  commercial:  { accent: "#1a6b3a", text: "#6dbf8a" },
  diligence:   { accent: "#7a4a00", text: "#e8a820" },
  integration: { accent: "#5a1a8a", text: "#c080f0" },
  live:        { accent: "#1a7a1a", text: "#4ae04a" },
};

// ── Supabase helpers ──────────────────────────────────────────────────────────
function sbHeaders(token) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token || SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function sbFetch(path, options = {}, token) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...sbHeaders(token), ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Login failed");
  return data;
}

async function signOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: sbHeaders(token),
  });
}

// ── Components ────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const data = await signIn(email, password);
      onLogin(data.access_token, data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#080808",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500;700&display=swap');* { box-sizing:border-box; margin:0; padding:0; }`}</style>
      <div style={{ width: 360 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, margin: "0 auto 16px",
            background: "linear-gradient(135deg,#1a5276,#4ae04a22)",
            borderRadius: 14, border: "1px solid #1a5276",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26
          }}>⚓</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0" }}>HarborPass</div>
          <div style={{ fontSize: 11, color: "#444", fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em", marginTop: 4 }}>PARTNER TRACKER  ×  VEEM</div>
        </div>

        {/* Card */}
        <div style={{ background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 12, padding: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0", marginBottom: 24 }}>Sign in to your account</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono',monospace", marginBottom: 6, letterSpacing: "0.06em" }}>EMAIL</div>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="you@harborpass.io"
              style={{
                width: "100%", background: "#080808", border: "1px solid #1e1e1e",
                borderRadius: 6, color: "#f0f0f0", padding: "10px 12px",
                fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif"
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono',monospace", marginBottom: 6, letterSpacing: "0.06em" }}>PASSWORD</div>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              style={{
                width: "100%", background: "#080808", border: "1px solid #1e1e1e",
                borderRadius: 6, color: "#f0f0f0", padding: "10px 12px",
                fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif"
              }}
            />
          </div>

          {error && (
            <div style={{ background: "#1a0808", border: "1px solid #5a1a1a", borderRadius: 6, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#f55", fontFamily: "'DM Mono',monospace" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            style={{
              width: "100%", background: loading ? "#0d2f47" : "#1a5276",
              border: "none", borderRadius: 6, color: "#7fb3d3",
              padding: "11px 0", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s", letterSpacing: "0.02em"
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div style={{ marginTop: 16, fontSize: 11, color: "#333", textAlign: "center", lineHeight: 1.6 }}>
            No account yet? Create one in<br />
            <span style={{ color: "#1a5276", fontFamily: "'DM Mono',monospace" }}>Supabase → Authentication → Users → Invite</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddPartnerModal({ token, onClose, onAdded }) {
  const empty = { name:"", market:"", corridor:"", use_case:"", phase:"0", stage:"sourced", notes:"" };
  const [form, setForm]       = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleAdd() {
    if (!form.name.trim()) { setError("Partner name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      await sbFetch("/rest/v1/partners", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          ...form,
          revenue_active: form.stage === "live",
          last_update: new Date().toISOString().split("T")[0],
        }),
      }, token);
      onAdded();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", background: "#080808", border: "1px solid #1e1e1e",
    borderRadius: 6, color: "#f0f0f0", padding: "9px 12px",
    fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif"
  };
  const labelStyle = {
    fontSize: 10, color: "#555", fontFamily: "'DM Mono',monospace",
    letterSpacing: "0.07em", display: "block", marginBottom: 5
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000bb",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 20
    }}>
      <div style={{
        background: "#0e0e0e", border: "1px solid #1e1e1e",
        borderRadius: 12, padding: 32, width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>Add new partner</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>PARTNER NAME *</label>
            <input style={inputStyle} placeholder="e.g. GCash" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>MARKET</label>
            <input style={inputStyle} placeholder="e.g. Philippines" value={form.market} onChange={e => set("market", e.target.value)} />
          </div>
        </div>

        {/* Row 2 */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>CORRIDOR</label>
          <input style={inputStyle} placeholder="e.g. PH → US / MENA" value={form.corridor} onChange={e => set("corridor", e.target.value)} />
        </div>

        {/* Row 3 */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>USE CASE</label>
          <input style={inputStyle} placeholder="e.g. Cross-border disbursements" value={form.use_case} onChange={e => set("use_case", e.target.value)} />
        </div>

        {/* Row 4 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>PHASE</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.phase} onChange={e => set("phase", e.target.value)}>
              <option value="0">Phase 0</option>
              <option value="1">Phase 1</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>INITIAL STAGE</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.stage} onChange={e => set("stage", e.target.value)}>
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Row 5 */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>NOTES</label>
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
            placeholder="Initial context, key contacts, next steps..."
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
          />
        </div>

        {error && (
          <div style={{ background: "#1a0808", border: "1px solid #5a1a1a", borderRadius: 6, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#f55", fontFamily: "'DM Mono',monospace" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, background: "transparent", border: "1px solid #1e1e1e",
            borderRadius: 6, color: "#555", padding: "10px 0",
            fontSize: 13, cursor: "pointer"
          }}>Cancel</button>
          <button onClick={handleAdd} disabled={loading} style={{
            flex: 2, background: loading ? "#0d2f47" : "#1a5276",
            border: "none", borderRadius: 6, color: "#7fb3d3",
            padding: "10px 0", fontSize: 13, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer"
          }}>{loading ? "Adding..." : "Add partner"}</button>
        </div>
      </div>
    </div>
  );
}

function StageChip({ stage }) {
  const s = STAGES.find(x => x.id === stage);
  const c = COLORS[stage] || COLORS.sourced;
  return (
    <span style={{
      background: c.accent + "33", color: c.text,
      border: `1px solid ${c.accent}`, borderRadius: 4,
      fontSize: 11, fontWeight: 700, padding: "2px 8px",
      letterSpacing: "0.06em", textTransform: "uppercase",
      fontFamily: "'DM Mono', monospace"
    }}>{s?.label ?? stage}</span>
  );
}

function ProgressBar({ stage }) {
  const idx = STAGE_IDX[stage] ?? 0;
  const pct = Math.round((idx / (STAGES.length - 1)) * 100);
  const c = COLORS[stage] || COLORS.sourced;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono',monospace" }}>PIPELINE PROGRESS</span>
        <span style={{ fontSize: 10, color: c.text, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${c.accent}, ${c.text})`,
          borderRadius: 2, transition: "width 0.5s ease"
        }} />
      </div>
    </div>
  );
}

function PartnerCard({ partner, onClick, selected }) {
  const c = COLORS[partner.stage] || COLORS.sourced;
  return (
    <div onClick={() => onClick(partner)} style={{
      background: selected ? "#141414" : "#0e0e0e",
      border: selected ? `1px solid ${c.accent}` : "1px solid #1e1e1e",
      borderRadius: 8, padding: "16px 18px", cursor: "pointer",
      transition: "all 0.15s ease",
      boxShadow: selected ? `0 0 0 1px ${c.accent}33` : "none",
      position: "relative", overflow: "hidden"
    }}>
      {partner.revenue_active && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: "#4ae04a22", borderBottom: "1px solid #4ae04a44",
          borderLeft: "1px solid #4ae04a44", borderRadius: "0 8px 0 6px",
          padding: "2px 8px", fontSize: 9, color: "#4ae04a",
          fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em"
        }}>● LIVE</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f0", marginBottom: 2 }}>{partner.name}</div>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono',monospace" }}>{partner.market}</div>
        </div>
        <span style={{
          background: "#1a1a1a", border: "1px solid #2a2a2a",
          borderRadius: 4, fontSize: 10, color: "#555",
          padding: "2px 7px", fontFamily: "'DM Mono',monospace", fontWeight: 700
        }}>PH {partner.phase}</span>
      </div>
      <StageChip stage={partner.stage} />
      <ProgressBar stage={partner.stage} />
      <div style={{ marginTop: 10, fontSize: 11, color: "#333", fontFamily: "'DM Mono',monospace" }}>
        Updated {partner.last_update}
      </div>
    </div>
  );
}

function DetailPanel({ partner, onClose }) {
  if (!partner) return null;
  const c = COLORS[partner.stage] || COLORS.sourced;
  const idx = STAGE_IDX[partner.stage] ?? 0;
  return (
    <div style={{
      background: "#0a0a0a", border: `1px solid ${c.accent}55`,
      borderRadius: 10, padding: 28, position: "sticky", top: 80,
      boxShadow: `0 0 40px ${c.accent}22`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#f0f0f0" }}>{partner.name}</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 2, fontFamily: "'DM Mono',monospace" }}>{partner.market}  ·  {partner.corridor}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 20, padding: 0 }}>✕</button>
      </div>
      <div style={{ marginBottom: 20 }}>
        <StageChip stage={partner.stage} />
        <div style={{ marginTop: 12, fontSize: 12, color: "#888", lineHeight: 1.6 }}>{partner.notes}</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#444", fontFamily: "'DM Mono',monospace", marginBottom: 12, letterSpacing: "0.08em" }}>PIPELINE STAGES</div>
        {STAGES.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                border: active ? `2px solid ${c.text}` : done ? "2px solid #2a4a2a" : "2px solid #1e1e1e",
                background: active ? c.accent + "55" : done ? "#1a3a1a" : "#111",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: done ? "#4ae04a" : active ? c.text : "#333",
                fontWeight: 700, marginRight: 10
              }}>{done ? "✓" : i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? c.text : done ? "#4a4a4a" : "#333" }}>{s.label}</div>
                {active && <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{s.desc}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
        {[
          ["USE CASE",      partner.use_case],
          ["CORRIDOR",      partner.corridor],
          ["PHASE",         `Phase ${partner.phase}`],
          ["REVENUE SHARE", partner.revenue_active ? "Active — 27.5% of net Veem economics" : "Not yet triggered"],
          ["LAST UPDATE",   partner.last_update],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#444", fontFamily: "'DM Mono',monospace", letterSpacing: "0.07em" }}>{k}</span>
            <span style={{ fontSize: 11, color: k === "REVENUE SHARE" && partner.revenue_active ? "#4ae04a" : "#888", fontFamily: "'DM Mono',monospace", textAlign: "right", maxWidth: "60%" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]         = useState(null); // { token, user }
  const [partners, setPartners]       = useState([]);
  const [selected, setSelected]       = useState(null);
  const [filter, setFilter]           = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [showAdd, setShowAdd]         = useState(false);

  async function loadPartners(token) {
    setLoading(true);
    setError(null);
    try {
      const data = await sbFetch("/rest/v1/partners?select=*&order=id", {}, token);
      if (!Array.isArray(data)) throw new Error(JSON.stringify(data));
      setPartners(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(token, user) {
    setSession({ token, user });
    loadPartners(token);
  }

  async function handleSignOut() {
    await signOut(session.token);
    setSession(null);
    setPartners([]);
    setSelected(null);
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!session) return <LoginScreen onLogin={handleLogin} />;

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚓</div>
        <div style={{ color: "#444", fontFamily: "'DM Mono',monospace", fontSize: 12, letterSpacing: "0.1em" }}>LOADING PARTNERS...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ maxWidth: 500 }}>
        <div style={{ color: "#f55", fontFamily: "'DM Mono',monospace", fontSize: 13, marginBottom: 12 }}>Error loading partners</div>
        <div style={{ color: "#555", fontFamily: "'DM Mono',monospace", fontSize: 11, background: "#0e0e0e", padding: 16, borderRadius: 8, border: "1px solid #1e1e1e" }}>{error}</div>
        <button onClick={() => loadPartners(session.token)} style={{ marginTop: 16, background: "#1a5276", border: "none", borderRadius: 6, color: "#7fb3d3", padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>Retry</button>
      </div>
    </div>
  );

  const filtered = partners.filter(p => {
    if (filter !== "all" && p.phase !== filter) return false;
    if (stageFilter !== "all" && p.stage !== stageFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.market.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const liveCount      = partners.filter(p => p.stage === "live").length;
  const activeRevShare = partners.filter(p => p.revenue_active).length;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
      `}</style>

      {/* Add partner modal */}
      {showAdd && (
        <AddPartnerModal
          token={session.token}
          onClose={() => setShowAdd(false)}
          onAdded={() => loadPartners(session.token)}
        />
      )}

      {/* Header */}
      <div style={{
        background: "#0a0a0a", borderBottom: "1px solid #141414",
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg,#1a5276,#4ae04a22)",
            borderRadius: 8, border: "1px solid #1a5276",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
          }}>⚓</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>HarborPass</div>
            <div style={{ fontSize: 10, color: "#444", fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em" }}>PARTNER TRACKER  ×  VEEM</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[
            ["PARTNERS",         partners.length, "#888"],
            ["LIVE",             liveCount,       "#4ae04a"],
            ["REV SHARE ACTIVE", activeRevShare,  "#e8a820"],
          ].map(([label, val, color]) => (
            <div key={label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'DM Mono',monospace" }}>{val}</div>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.08em" }}>{label}</div>
            </div>
          ))}

          {/* Add partner button */}
          <button onClick={() => setShowAdd(true)} style={{
            background: "#1a5276", border: "none", borderRadius: 6,
            color: "#7fb3d3", padding: "8px 16px", fontSize: 12,
            fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em",
            display: "flex", alignItems: "center", gap: 6
          }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add partner
          </button>

          {/* Sign out */}
          <button onClick={handleSignOut} style={{
            background: "transparent", border: "1px solid #1e1e1e",
            borderRadius: 6, color: "#444", padding: "7px 12px",
            fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace"
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto", padding: "32px 32px" }}>

        {/* Main panel */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search partner or market…"
              style={{
                background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 6,
                color: "#ccc", padding: "7px 12px", fontSize: 12,
                fontFamily: "'DM Mono',monospace", outline: "none", width: 220
              }}
            />
            {[["all", "All Phases"], ["0", "Phase 0"], ["1", "Phase 1"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                background: filter === v ? "#1a5276" : "#0e0e0e",
                border: `1px solid ${filter === v ? "#1a5276" : "#1e1e1e"}`,
                color: filter === v ? "#7fb3d3" : "#555",
                borderRadius: 6, padding: "6px 14px", fontSize: 11,
                fontFamily: "'DM Mono',monospace", cursor: "pointer",
                fontWeight: filter === v ? 700 : 400
              }}>{l}</button>
            ))}
            <div style={{ borderLeft: "1px solid #1e1e1e", paddingLeft: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["all", "All Stages"], ...STAGES.map(s => [s.id, s.label])].map(([v, l]) => (
                <button key={v} onClick={() => setStageFilter(v)} style={{
                  background: stageFilter === v ? (v === "all" ? "#222" : (COLORS[v]?.accent ?? "#333") + "44") : "transparent",
                  border: `1px solid ${stageFilter === v ? (v === "all" ? "#333" : COLORS[v]?.accent ?? "#333") : "transparent"}`,
                  color: stageFilter === v ? (v === "all" ? "#ccc" : COLORS[v]?.text ?? "#ccc") : "#444",
                  borderRadius: 4, padding: "4px 10px", fontSize: 10,
                  fontFamily: "'DM Mono',monospace", cursor: "pointer", whiteSpace: "nowrap"
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Stage bar */}
          <div style={{ display: "flex", gap: 2, marginBottom: 24, borderRadius: 8, overflow: "hidden", height: 6 }}>
            {STAGES.map(s => {
              const count = partners.filter(p => p.stage === s.id).length;
              return <div key={s.id} title={`${s.label}: ${count}`} style={{ flex: count / (partners.length || 1) * 100, background: COLORS[s.id].accent, minWidth: count > 0 ? 2 : 0 }} />;
            })}
          </div>

          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#333", padding: 60, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>
                {partners.length === 0 ? "No partners yet — add your first one above" : "No partners match filters"}
              </div>
            )}
            {filtered.map(p => (
              <PartnerCard key={p.id} partner={p}
                onClick={q => setSelected(q.id === selected?.id ? null : q)}
                selected={selected?.id === p.id}
              />
            ))}
          </div>

          {/* Email hint */}
          <div style={{ marginTop: 32, padding: "14px 18px", background: "#0a0a0a", border: "1px dashed #1e1e1e", borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 18 }}>✉️</div>
            <div>
              <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono',monospace" }}>EMAIL UPDATES ACTIVE</div>
              <div style={{ fontSize: 11, color: "#333", marginTop: 2 }}>
                Send <span style={{ color: "#1a5276", fontFamily: "'DM Mono',monospace" }}>Subject: HP Update: [Partner] &gt; [Stage]</span> from Gmail to trigger an update
              </div>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 340, flexShrink: 0, marginLeft: 20 }}>
            <DetailPanel partner={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
