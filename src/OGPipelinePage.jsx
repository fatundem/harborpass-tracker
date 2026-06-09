import { useState, useEffect } from "react";
import { sbFetch, inputStyle } from "./config";

// ── O&G Stages (10-day activation) ───────────────────────────────────────────
const OG_STAGES = [
  { id:"identified",   label:"Identified",   desc:"Target identified, owner assigned" },
  { id:"introduction", label:"Introduction", desc:"Introduction secured" },
  { id:"discovery",    label:"Discovery",    desc:"Discovery call run, 3 pain questions asked" },
  { id:"qualified",    label:"Qualified",    desc:"Opportunity qualified, shortlisted" },
  { id:"structured",   label:"Structured",   desc:"Transaction matched to partner, structured" },
  { id:"active",       label:"Active",       desc:"First transaction activated" },
];
const OG_STAGE_IDX = Object.fromEntries(OG_STAGES.map((s,i) => [s.id, i]));

const OG_COLORS = {
  identified:   { accent:"#5a4010", text:"#c8901a" },
  introduction: { accent:"#4a6010", text:"#a0c020" },
  discovery:    { accent:"#104848", text:"#20b8b8" },
  qualified:    { accent:"#102050", text:"#4090e8" },
  structured:   { accent:"#381060", text:"#9060d8" },
  active:       { accent:"#104010", text:"#40c840" },
};

const OG_SEGMENTS = [
  "Marginal Field Operator","Indigenous Producer","Midstream & Gas",
  "Downstream","Marine & Offshore","Oilfield Services","Large Producer",
];

const PROB_COLOR = p => p >= 70 ? "#4ae04a" : p >= 50 ? "#e8a820" : "#e84a4a";

// ── Sample data (from Energy Desk Excel) ──────────────────────────────────────
const OG_SAMPLE = [
  { id:1,  name:"Midwestern",         segment:"Marginal Field Operator", relationship_owner:"Bunmi / Olu", intro_source:"Existing Network",  pain_hypothesis:"FX, Working Capital",       first_transaction:"PO Finance / FX",         probability:80, next_action:"Secure meeting",    stage:"introduction", last_update:"2025-01-10", notes:"High-priority. Existing network. FX and working capital pain clearly diagnosed." },
  { id:2,  name:"SunTrust Atlantic",   segment:"Marginal Field Operator", relationship_owner:"Bunmi / Olu", intro_source:"Existing Network",  pain_hypothesis:"Vendor Payments",           first_transaction:"Vendor Payment Solution", probability:75, next_action:"Secure meeting",    stage:"introduction", last_update:"2025-01-10", notes:"Strong relationship. Vendor payment pain well understood." },
  { id:3,  name:"Marine Platforms",    segment:"Marine & Offshore",       relationship_owner:"TBD",         intro_source:"Industry Intro",    pain_hypothesis:"Contract Finance",          first_transaction:"Equipment Finance",       probability:80, next_action:"Book discovery",    stage:"identified",   last_update:"2025-01-10", notes:"Industry intro available. Equipment finance for offshore vessels." },
  { id:4,  name:"Craigwal Petroshore", segment:"Oilfield Services",       relationship_owner:"TBD",         intro_source:"Industry Intro",    pain_hypothesis:"Supplier Payments",         first_transaction:"Contract Finance",        probability:75, next_action:"Book discovery",    stage:"identified",   last_update:"2025-01-10", notes:"Oilfield services. Supplier payment pain typical of the segment." },
  { id:5,  name:"Aradel",              segment:"Indigenous Producer",     relationship_owner:"TBD",         intro_source:"Warm Intro Needed", pain_hypothesis:"Treasury Complexity",       first_transaction:"Treasury / FX",           probability:70, next_action:"Identify sponsor",  stage:"identified",   last_update:"2025-01-10", notes:"Strong target. Need warm intro path to CFO." },
  { id:6,  name:"Heirs Energies",      segment:"Indigenous Producer",     relationship_owner:"TBD",         intro_source:"Warm Intro Needed", pain_hypothesis:"Contractor Payments",       first_transaction:"Vendor Payment Rails",    probability:70, next_action:"Identify sponsor",  stage:"identified",   last_update:"2025-01-10", notes:"Tony Elumelu group. Contractor payment volume significant." },
  { id:7,  name:"Axxela",              segment:"Midstream & Gas",         relationship_owner:"TBD",         intro_source:"Warm Intro Needed", pain_hypothesis:"Collections & Treasury",    first_transaction:"Treasury Platform",       probability:75, next_action:"Book discovery",    stage:"identified",   last_update:"2025-01-10", notes:"Gas distribution. Treasury complexity across multiple collection points." },
  { id:8,  name:"Greenville LNG",      segment:"Midstream & Gas",         relationship_owner:"TBD",         intro_source:"Warm Intro Needed", pain_hypothesis:"Fleet Payments",            first_transaction:"Payment Automation",      probability:70, next_action:"Book discovery",    stage:"identified",   last_update:"2025-01-10", notes:"LNG distribution. Fleet payment automation opportunity." },
  { id:9,  name:"Rainoil",             segment:"Downstream",              relationship_owner:"TBD",         intro_source:"Warm Intro Needed", pain_hypothesis:"Dealer Collections",        first_transaction:"Collections Platform",    probability:75, next_action:"Book discovery",    stage:"identified",   last_update:"2025-01-10", notes:"Large downstream marketer. Dealer collections pain well documented in sector." },
  { id:10, name:"Matrix Energy",       segment:"Downstream",              relationship_owner:"TBD",         intro_source:"Warm Intro Needed", pain_hypothesis:"Product Settlement",        first_transaction:"Treasury / Settlement",   probability:70, next_action:"Book discovery",    stage:"identified",   last_update:"2025-01-10", notes:"Downstream petroleum. Product settlement and treasury gaps." },
  { id:11, name:"Seplat",              segment:"Large Producer",          relationship_owner:"Strategic",   intro_source:"Long-cycle",        pain_hypothesis:"Supplier Finance",          first_transaction:"Treasury",                probability:30, next_action:"Relationship build",stage:"identified",   last_update:"2025-01-10", notes:"NYSE/LSE listed. Strategic relationship play. Long-cycle — 12–18 months." },
  { id:12, name:"Renaissance",         segment:"Large Producer",          relationship_owner:"Strategic",   intro_source:"Long-cycle",        pain_hypothesis:"Vendor Payments",           first_transaction:"FX",                      probability:25, next_action:"Relationship build",stage:"identified",   last_update:"2025-01-10", notes:"Acquired Shell Nigeria assets. Large vendor payment flows." },
  { id:13, name:"Oando",               segment:"Large Producer",          relationship_owner:"Strategic",   intro_source:"Long-cycle",        pain_hypothesis:"Treasury",                  first_transaction:"FX",                      probability:25, next_action:"Relationship build",stage:"identified",   last_update:"2025-01-10", notes:"Nigerian indigenous major. Treasury FX gap known." },
  { id:14, name:"FIRST E&P",           segment:"Large Producer",          relationship_owner:"Strategic",   intro_source:"Long-cycle",        pain_hypothesis:"Marine Contractor Finance", first_transaction:"Vendor Finance",          probability:25, next_action:"Relationship build",stage:"identified",   last_update:"2025-01-10", notes:"Deep water operator. Marine contractor finance opportunity." },
  { id:15, name:"NLNG",                segment:"Large Producer",          relationship_owner:"Strategic",   intro_source:"Long-cycle",        pain_hypothesis:"Contractor Payments",       first_transaction:"Treasury",                probability:20, next_action:"Relationship build",stage:"identified",   last_update:"2025-01-10", notes:"Nigeria LNG. JV structure. Long-cycle institutional engagement required." },
];

// ── Components ────────────────────────────────────────────────────────────────
function OGStageChip({ stage }) {
  const s = OG_STAGES.find(x => x.id === stage);
  const c = OG_COLORS[stage] || OG_COLORS.identified;
  return (
    <span style={{ background:c.accent+"44", color:c.text, border:`1px solid ${c.accent}`, borderRadius:4, fontSize:11, fontWeight:700, padding:"2px 8px", letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>
      {s?.label ?? stage}
    </span>
  );
}

function OGCard({ company, onClick, selected }) {
  const c = OG_COLORS[company.stage] || OG_COLORS.identified;
  const pc = PROB_COLOR(company.probability);
  return (
    <div onClick={() => onClick(company)} style={{ background:selected?"#141410":"#0e0e0a", border:selected?`1px solid ${c.accent}`:"1px solid #1e1e14", borderRadius:8, padding:"16px 18px", cursor:"pointer", transition:"all 0.15s ease", position:"relative", overflow:"hidden" }}>
      {company.probability >= 70 && (
        <div style={{ position:"absolute", top:0, right:0, background:pc+"22", borderBottom:`1px solid ${pc}44`, borderLeft:`1px solid ${pc}44`, borderRadius:"0 8px 0 6px", padding:"2px 8px", fontSize:9, color:pc, fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>
          {company.probability}% PROB
        </div>
      )}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:16, fontWeight:600, color:"#f0f0f0", marginBottom:3 }}>{company.name}</div>
        <div style={{ fontSize:10, color:"#5a4a20", fontFamily:"'DM Mono',monospace", letterSpacing:"0.05em" }}>{company.segment}</div>
      </div>
      <OGStageChip stage={company.stage} />
      <div style={{ marginTop:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:10, color:"#555", fontFamily:"'DM Mono',monospace" }}>PROBABILITY</span>
          <span style={{ fontSize:10, color:pc, fontFamily:"'DM Mono',monospace", fontWeight:700 }}>{company.probability}%</span>
        </div>
        <div style={{ height:4, background:"#1a1a14", borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${company.probability}%`, background:`linear-gradient(90deg,${c.accent},${pc})`, borderRadius:2, transition:"width 0.5s ease" }} />
        </div>
      </div>
      <div style={{ marginTop:10, fontSize:11, color:"#3a3020", fontFamily:"'DM Mono',monospace" }}>
        ↳ {company.next_action}
      </div>
    </div>
  );
}

function OGDetailPanel({ company, onClose }) {
  if (!company) return null;
  const c = OG_COLORS[company.stage] || OG_COLORS.identified;
  const idx = OG_STAGE_IDX[company.stage] ?? 0;
  return (
    <div style={{ background:"#0a0a06", border:`1px solid ${c.accent}55`, borderRadius:10, padding:28, position:"sticky", top:80, boxShadow:`0 0 40px ${c.accent}22` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:"#f0f0f0" }}>{company.name}</div>
          <div style={{ fontSize:11, color:"#5a4a20", marginTop:3, fontFamily:"'DM Mono',monospace" }}>{company.segment}</div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:20, padding:0 }}>✕</button>
      </div>
      <div style={{ marginBottom:16 }}><OGStageChip stage={company.stage} /></div>
      {company.notes && (
        <div style={{ fontSize:12, color:"#888", lineHeight:1.6, marginBottom:20, background:"#111108", borderRadius:6, padding:"10px 12px", border:"1px solid #1e1e10" }}>
          {company.notes}
        </div>
      )}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, color:"#4a3a10", fontFamily:"'DM Mono',monospace", marginBottom:10, letterSpacing:"0.08em" }}>ACTIVATION STAGES</div>
        {OG_STAGES.map((s, i) => {
          const done = i < idx, active = i === idx;
          return (
            <div key={s.id} style={{ display:"flex", alignItems:"center", marginBottom:7 }}>
              <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, border:active?`2px solid ${c.text}`:done?"2px solid #3a4a1a":"2px solid #1e1e10", background:active?c.accent+"55":done?"#1a2a0a":"#111108", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:done?"#80c040":active?c.text:"#333", fontWeight:700, marginRight:10 }}>
                {done ? "✓" : i + 1}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:active?700:400, color:active?c.text:done?"#4a4a3a":"#333" }}>{s.label}</div>
                {active && <div style={{ fontSize:10, color:"#555", marginTop:1 }}>{s.desc}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop:"1px solid #1a1a10", paddingTop:16 }}>
        {[
          ["PAIN HYPOTHESIS",    company.pain_hypothesis],
          ["FIRST TRANSACTION",  company.first_transaction],
          ["PROBABILITY",        `${company.probability}%`],
          ["RELATIONSHIP OWNER", company.relationship_owner],
          ["INTRO SOURCE",       company.intro_source],
          ["NEXT ACTION",        company.next_action],
          ["LAST UPDATE",        company.last_update],
        ].filter(([,v]) => v).map(([k, v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, gap:8 }}>
            <span style={{ fontSize:10, color:"#4a3a10", fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em", flexShrink:0 }}>{k}</span>
            <span style={{ fontSize:11, color:k==="PROBABILITY"?PROB_COLOR(company.probability):"#888", fontFamily:"'DM Mono',monospace", textAlign:"right" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddOGModal({ token, onClose, onAdded }) {
  const empty = { name:"", segment:"Marginal Field Operator", relationship_owner:"", intro_source:"", pain_hypothesis:"", first_transaction:"", probability:50, next_action:"", stage:"identified", notes:"" };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleAdd() {
    if (!form.name.trim()) { setError("Company name is required"); return; }
    setLoading(true); setError(null);
    try {
      await sbFetch("/rest/v1/og_pipeline", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ ...form, probability: parseInt(form.probability) || 0, last_update: new Date().toISOString().split("T")[0] }),
      }, token);
      onAdded(); onClose();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const iStyle = { ...inputStyle, width:"100%", color:"#f0f0f0", padding:"9px 12px", fontFamily:"'DM Sans',sans-serif" };
  const lStyle = { fontSize:10, color:"#555", fontFamily:"'DM Mono',monospace", letterSpacing:"0.07em", display:"block", marginBottom:5 };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000bb", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <div style={{ background:"#0e0e0e", border:"1px solid #2a1a00", borderRadius:12, padding:32, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#f0f0f0" }}>Add O&G company</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:20 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div><label style={lStyle}>COMPANY NAME *</label><input style={iStyle} placeholder="e.g. Aradel" value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div><label style={lStyle}>SEGMENT</label>
            <select style={{ ...iStyle, cursor:"pointer" }} value={form.segment} onChange={e => set("segment", e.target.value)}>
              {OG_SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div><label style={lStyle}>RELATIONSHIP OWNER</label><input style={iStyle} placeholder="e.g. Bunmi / Olu" value={form.relationship_owner} onChange={e => set("relationship_owner", e.target.value)} /></div>
          <div><label style={lStyle}>INTRO SOURCE</label><input style={iStyle} placeholder="e.g. Existing Network" value={form.intro_source} onChange={e => set("intro_source", e.target.value)} /></div>
        </div>
        <div style={{ marginBottom:12 }}><label style={lStyle}>PAIN HYPOTHESIS</label><input style={iStyle} placeholder="e.g. FX, Working Capital" value={form.pain_hypothesis} onChange={e => set("pain_hypothesis", e.target.value)} /></div>
        <div style={{ marginBottom:12 }}><label style={lStyle}>FIRST TRANSACTION</label><input style={iStyle} placeholder="e.g. PO Finance / FX" value={form.first_transaction} onChange={e => set("first_transaction", e.target.value)} /></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div><label style={lStyle}>PROBABILITY (%)</label><input style={iStyle} type="number" min="0" max="100" value={form.probability} onChange={e => set("probability", e.target.value)} /></div>
          <div><label style={lStyle}>STAGE</label>
            <select style={{ ...iStyle, cursor:"pointer" }} value={form.stage} onChange={e => set("stage", e.target.value)}>
              {OG_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:12 }}><label style={lStyle}>NEXT ACTION</label><input style={iStyle} placeholder="e.g. Secure meeting" value={form.next_action} onChange={e => set("next_action", e.target.value)} /></div>
        <div style={{ marginBottom:24 }}><label style={lStyle}>NOTES</label><textarea style={{ ...iStyle, resize:"vertical", minHeight:64 }} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
        {error && <div style={{ background:"#1a0808", border:"1px solid #5a1a1a", borderRadius:6, padding:"10px 12px", marginBottom:16, fontSize:12, color:"#f55", fontFamily:"'DM Mono',monospace" }}>{error}</div>}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:"transparent", border:"1px solid #1e1e1e", borderRadius:6, color:"#555", padding:"10px 0", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={handleAdd} disabled={loading} style={{ flex:2, background:loading?"#2a1a00":"#5a3a00", border:"none", borderRadius:6, color:"#c8901a", padding:"10px 0", fontSize:13, fontWeight:600, cursor:loading?"not-allowed":"pointer" }}>
            {loading ? "Adding..." : "Add company"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── OGPipelinePage ────────────────────────────────────────────────────────────
export default function OGPipelinePage({ token }) {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [segmentFilter, setSegmentFilter] = useState("All");
  const [stageFilter, setStageFilter]     = useState("All");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [usingSample, setUsingSample] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await sbFetch("/rest/v1/og_pipeline?select=*&order=probability.desc", {}, token);
      if (Array.isArray(d) && d.length > 0) { setCompanies(d); }
      else { setCompanies(OG_SAMPLE); setUsingSample(true); }
    } catch(e) { setCompanies(OG_SAMPLE); setUsingSample(true); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = companies
    .filter(c => {
      if (segmentFilter !== "All" && c.segment !== segmentFilter) return false;
      if (stageFilter !== "All" && c.stage !== stageFilter) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.segment?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.probability - a.probability);

  const immediate = companies.filter(c => c.probability >= 70).length;
  const active    = companies.filter(c => c.stage === "active").length;
  const avgProb   = companies.length ? Math.round(companies.reduce((s, c) => s + c.probability, 0) / companies.length) : 0;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:400 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:28, marginBottom:12 }}>🛢️</div>
        <div style={{ color:"#5a4010", fontFamily:"'DM Mono',monospace", fontSize:11 }}>LOADING O&G PIPELINE...</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"24px 32px" }}>
      {showAdd && <AddOGModal token={token} onClose={() => setShowAdd(false)} onAdded={load} />}

      {usingSample && (
        <div style={{ background:"#1a1400", border:"1px solid #3a2a00", borderRadius:8, padding:"12px 16px", marginBottom:20, fontSize:11, color:"#c8901a" }}>
          <span style={{ fontWeight:700 }}>Sample data from Energy Desk</span> — To persist changes, create the <span style={{ fontFamily:"'DM Mono',monospace" }}>og_pipeline</span> table in Supabase:
          <div style={{ marginTop:8, fontFamily:"'DM Mono',monospace", fontSize:10, color:"#7a5a10", background:"#111008", padding:"8px 10px", borderRadius:4, lineHeight:1.8 }}>
            CREATE TABLE og_pipeline (id SERIAL PRIMARY KEY, name TEXT, segment TEXT, relationship_owner TEXT, intro_source TEXT, pain_hypothesis TEXT, first_transaction TEXT, probability INT DEFAULT 50, next_action TEXT, stage TEXT DEFAULT 'identified', notes TEXT, last_update TEXT);
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        {[
          ["COMPANIES",      companies.length,  "#c8901a"],
          ["70%+ PROBABILITY", immediate,        "#4ae04a"],
          ["ACTIVE DEALS",   active,             "#9060d8"],
          ["AVG PROBABILITY", `${avgProb}%`,     PROB_COLOR(avgProb)],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background:"#0e0e0a", border:"1px solid #1e1e10", borderRadius:8, padding:"10px 16px" }}>
            <div style={{ fontSize:18, fontWeight:700, color, fontFamily:"'DM Mono',monospace" }}>{val}</div>
            <div style={{ fontSize:9, color:"#3a2a00", letterSpacing:"0.08em", marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or segment…" style={{ ...inputStyle, width:200 }} />
        <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
          <option value="All">All Segments</option>
          {OG_SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ borderLeft:"1px solid #2a1a00", paddingLeft:10, display:"flex", gap:6, flexWrap:"wrap" }}>
          {[["All","All"], ...OG_STAGES.map(s => [s.id, s.label])].map(([v, l]) => (
            <button key={v} onClick={() => setStageFilter(v)} style={{
              background: stageFilter===v ? (v==="All" ? "#2a1a00" : (OG_COLORS[v]?.accent ?? "#3a2a00")+"55") : "transparent",
              border: `1px solid ${stageFilter===v ? (v==="All" ? "#3a2a00" : OG_COLORS[v]?.accent ?? "#3a2a00") : "transparent"}`,
              color: stageFilter===v ? (v==="All" ? "#c8901a" : OG_COLORS[v]?.text ?? "#c8901a") : "#3a2a00",
              borderRadius:4, padding:"4px 8px", fontSize:10, fontFamily:"'DM Mono',monospace", cursor:"pointer", whiteSpace:"nowrap"
            }}>{l}</button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} style={{ marginLeft:"auto", background:"#5a3a00", border:"none", borderRadius:6, color:"#c8901a", padding:"7px 14px", fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:15 }}>+</span> Add company
        </button>
      </div>

      {/* Stage bar */}
      <div style={{ display:"flex", gap:2, marginBottom:20, borderRadius:8, overflow:"hidden", height:5 }}>
        {OG_STAGES.map(s => {
          const cnt = companies.filter(c => c.stage === s.id).length;
          return <div key={s.id} title={`${s.label}: ${cnt}`} style={{ flex:cnt/(companies.length||1)*100, background:OG_COLORS[s.id].accent, minWidth:cnt>0?2:0 }} />;
        })}
      </div>

      {/* Cards + detail */}
      <div style={{ display:"flex", gap:20 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
            {filtered.length === 0 && (
              <div style={{ gridColumn:"1/-1", textAlign:"center", color:"#3a2a00", padding:60, fontFamily:"'DM Mono',monospace", fontSize:12 }}>
                No companies match filters
              </div>
            )}
            {filtered.map(c => (
              <OGCard key={c.id} company={c}
                onClick={q => setSelected(q.id === selected?.id ? null : q)}
                selected={selected?.id === c.id}
              />
            ))}
          </div>
        </div>
        {selected && (
          <div style={{ width:320, flexShrink:0 }}>
            <OGDetailPanel company={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
