import { useState, useEffect } from "react";

const STAGES = [
  { id: "sourced",    label: "Sourced",           desc: "Initial contact made" },
  { id: "qualified",  label: "Qualified",          desc: "Fit confirmed, DM identified" },
  { id: "commercial", label: "Commercial Review",  desc: "Pricing discussion active" },
  { id: "diligence",  label: "Diligence",          desc: "KYB/KYC underway" },
  { id: "integration",label: "Integration",        desc: "Tech integration in progress" },
  { id: "live",       label: "Live",               desc: "Transacting — rev share active" },
];

const SUPABASE_URL = 'https://kkmgvmdjdijbovmhzwul.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbWd2bWRqZGlqYm92bWh6d3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTczMjgsImV4cCI6MjA5NTU5MzMyOH0.smBFtagcKfd-8VRxv5CugcCpSRF8k-i1LgT7IjHUfEo';
 
const [partners, setPartners] = useState([]);
 
useEffect(() => {
 fetch(`${SUPABASE_URL}/rest/v1/partners?select=*&order=id`, {
   headers: {
     apikey: SUPABASE_KEY,
     Authorization: `Bearer ${SUPABASE_KEY}`
   }
 })
 .then(res => res.json())
 .then(data => setPartners(data));
}, []);

const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s.id, i]));

const COLORS = {
  sourced:    { bg:"#1a1a2e", accent:"#4a4a6a", text:"#a0a0c0" },
  qualified:  { bg:"#0d2137", accent:"#1a5276", text:"#7fb3d3" },
  commercial: { bg:"#0a2a1a", accent:"#1a6b3a", text:"#6dbf8a" },
  diligence:  { bg:"#2a1a00", accent:"#7a4a00", text:"#e8a820" },
  integration:{ bg:"#1a0a2a", accent:"#5a1a8a", text:"#c080f0" },
  live:       { bg:"#0a1f0a", accent:"#1a7a1a", text:"#4ae04a" },
};

function StageChip({ stage }) {
  const s = STAGES.find(x => x.id === stage);
  const c = COLORS[stage];
  return (
    <span style={{
      background: c.accent + "33", color: c.text,
      border: `1px solid ${c.accent}`, borderRadius: 4,
      fontSize: 11, fontWeight: 700, padding: "2px 8px",
      letterSpacing: "0.06em", textTransform: "uppercase",
      fontFamily: "'DM Mono', monospace"
    }}>{s?.label}</span>
  );
}

function ProgressBar({ stage }) {
  const idx = STAGE_IDX[stage];
  const pct = Math.round((idx / (STAGES.length - 1)) * 100);
  const c = COLORS[stage];
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
  const c = COLORS[partner.stage];
  return (
    <div
      onClick={() => onClick(partner)}
      style={{
        background: selected ? "#141414" : "#0e0e0e",
        border: selected ? `1px solid ${c.accent}` : "1px solid #1e1e1e",
        borderRadius: 8, padding: "16px 18px", cursor: "pointer",
        transition: "all 0.15s ease",
        boxShadow: selected ? `0 0 0 1px ${c.accent}33` : "none",
        position: "relative", overflow: "hidden"
      }}
    >
      {partner.revenueActive && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: "#4ae04a22", borderBottom: "1px solid #4ae04a44",
          borderLeft: "1px solid #4ae04a44",
          borderRadius: "0 8px 0 6px",
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
        Updated {partner.lastUpdate}
      </div>
    </div>
  );
}

function DetailPanel({ partner, onClose }) {
  if (!partner) return null;
  const c = COLORS[partner.stage];
  const idx = STAGE_IDX[partner.stage];
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
          ["USE CASE", partner.useCase],
          ["CORRIDOR", partner.corridor],
          ["PHASE", `Phase ${partner.phase}`],
          ["REVENUE SHARE", partner.revenueActive ? "Active — 27.5% of net Veem economics" : "Not yet triggered"],
          ["LAST UPDATE", partner.lastUpdate],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#444", fontFamily: "'DM Mono',monospace", letterSpacing: "0.07em" }}>{k}</span>
            <span style={{ fontSize: 11, color: k === "REVENUE SHARE" && partner.revenueActive ? "#4ae04a" : "#888", fontFamily: "'DM Mono',monospace", textAlign: "right", maxWidth: "60%" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = partners.filter(p => {
    if (filter !== "all" && p.phase !== filter) return false;
    if (stageFilter !== "all" && p.stage !== stageFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.market.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const liveCount = partners.filter(p => p.stage === "live").length;
  const activeRevShare = partners.filter(p => p.revenueActive).length;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#0a0a0a", borderBottom: "1px solid #141414",
        padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#1a5276,#4ae04a22)", borderRadius: 8, border: "1px solid #1a5276", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚓</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>HarborPass</div>
            <div style={{ fontSize: 10, color: "#444", fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em" }}>PARTNER TRACKER  ×  VEEM</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[["PARTNERS", partners.length, "#888"], ["LIVE", liveCount, "#4ae04a"], ["REV SHARE ACTIVE", activeRevShare, "#e8a820"]].map(([label, val, color]) => (
            <div key={label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'DM Mono',monospace" }}>{val}</div>
              <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.08em" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, maxWidth: 1400, margin: "0 auto", padding: "32px 32px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search partner or market…"
              style={{
                background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 6,
                color: "#ccc", padding: "7px 12px", fontSize: 12, fontFamily: "'DM Mono',monospace",
                outline: "none", width: 220
              }}
            />
            {[["all", "All Phases"], ["0", "Phase 0"], ["1", "Phase 1"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                background: filter === v ? "#1a5276" : "#0e0e0e",
                border: `1px solid ${filter === v ? "#1a5276" : "#1e1e1e"}`,
                color: filter === v ? "#7fb3d3" : "#555",
                borderRadius: 6, padding: "6px 14px", fontSize: 11,
                fontFamily: "'DM Mono',monospace", cursor: "pointer",
                letterSpacing: "0.05em", fontWeight: filter === v ? 700 : 400
              }}>{l}</button>
            ))}
            <div style={{ borderLeft: "1px solid #1e1e1e", paddingLeft: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["all", "All Stages"], ...STAGES.map(s => [s.id, s.label])].map(([v, l]) => (
                <button key={v} onClick={() => setStageFilter(v)} style={{
                  background: stageFilter === v ? (v === "all" ? "#222" : COLORS[v]?.accent + "44") : "transparent",
                  border: `1px solid ${stageFilter === v ? (v === "all" ? "#333" : COLORS[v]?.accent) : "transparent"}`,
                  color: stageFilter === v ? (v === "all" ? "#ccc" : COLORS[v]?.text) : "#444",
                  borderRadius: 4, padding: "4px 10px", fontSize: 10,
                  fontFamily: "'DM Mono',monospace", cursor: "pointer",
                  letterSpacing: "0.04em", whiteSpace: "nowrap"
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Stage bar */}
          <div style={{ display: "flex", gap: 2, marginBottom: 24, borderRadius: 8, overflow: "hidden", height: 6 }}>
            {STAGES.map(s => {
              const count = partners.filter(p => p.stage === s.id).length;
              return <div key={s.id} style={{ flex: count / partners.length * 100, background: COLORS[s.id].accent, minWidth: count > 0 ? 2 : 0 }} title={`${s.label}: ${count}`} />;
            })}
          </div>

          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#333", padding: 60, fontFamily: "'DM Mono',monospace", fontSize: 12 }}>No partners match filters</div>
            )}
            {filtered.map(p => (
              <PartnerCard key={p.id} partner={p} onClick={q => setSelected(q.id === selected?.id ? null : q)} selected={selected?.id === p.id} />
            ))}
          </div>

          {/* Email hint */}
          <div style={{ marginTop: 32, padding: "14px 18px", background: "#0a0a0a", border: "1px dashed #1e1e1e", borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 18 }}>✉️</div>
            <div>
              <div style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono',monospace" }}>EMAIL UPDATES COMING SOON</div>
              <div style={{ fontSize: 11, color: "#333", marginTop: 2 }}>Forward stage-update emails to <span style={{ color: "#1a5276", fontFamily: "'DM Mono',monospace" }}>updates@harborpass.io</span> → dashboard updates automatically</div>
            </div>
          </div>
        </div>

        {selected && (
          <div style={{ width: 340, flexShrink: 0, marginLeft: 20 }}>
            <DetailPanel partner={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
