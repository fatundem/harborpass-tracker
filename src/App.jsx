import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_KEY, SHEETS_CSV_URL, sbFetch, inputStyle } from "./config";
import OGPipelinePage from "./OGPipelinePage";

// ── Sample prospect data ──────────────────────────────────────────────────────
// (shown on Prospects page when SHEETS_CSV_URL is empty)
const SAMPLE_PROSPECTS = [
  {name:"Flutterwave",    region:"Africa",      country:"Nigeria",      series:"Series D",  raise_usd:474000000, fit_score:91,corridor:"NG → US / EU / UK",  in_network:"No", hp_selected:"No",website:"flutterwave.com",  notes:"Largest African fintech."},
  {name:"Moniepoint",     region:"Africa",      country:"Nigeria",      series:"Series C",  raise_usd:110000000, fit_score:82,corridor:"NG → US / EU",       in_network:"No", hp_selected:"No",website:"moniepoint.com",   notes:"Fastest-growing Nigerian bank."},
  {name:"Paga",           region:"Africa",      country:"Nigeria",      series:"Series B",  raise_usd:35000000,  fit_score:75,corridor:"NG → US / EU",       in_network:"Yes",hp_selected:"Yes",website:"mypaga.com",     notes:"Phase 0 partner."},
  {name:"Afriex",         region:"Africa",      country:"Nigeria",      series:"Series A",  raise_usd:10000000,  fit_score:65,corridor:"NG → US / CN",       in_network:"Yes",hp_selected:"Yes",website:"afriex.co",      notes:"Phase 0 partner."},
  {name:"Chipper Cash",   region:"Africa",      country:"Ghana",        series:"Series C",  raise_usd:302000000, fit_score:79,corridor:"Africa → US / EU",   in_network:"No", hp_selected:"No",website:"chippercash.com", notes:"Pan-African corridors."},
  {name:"Tabby",          region:"Middle East", country:"UAE",          series:"Series D",  raise_usd:700000000, fit_score:86,corridor:"UAE → US / EU",      in_network:"No", hp_selected:"No",website:"tabby.ai",        notes:"BNPL leader UAE/KSA."},
  {name:"Tamara",         region:"Middle East", country:"Saudi Arabia", series:"Series C",  raise_usd:340000000, fit_score:80,corridor:"KSA → US / EU",      in_network:"No", hp_selected:"No",website:"tamara.co",       notes:"BNPL market leader KSA."},
  {name:"Stitch",         region:"Middle East", country:"Saudi Arabia", series:"Series A",  raise_usd:25000000,  fit_score:65,corridor:"KSA → US / EU",      in_network:"Yes",hp_selected:"Yes",website:"stitch.money",   notes:"Phase 1 pipeline."},
  {name:"GCash (Mynt)",   region:"Asia",        country:"Philippines",  series:"Series D+", raise_usd:391000000, fit_score:93,corridor:"PH → US / MENA",     in_network:"Yes",hp_selected:"Yes",website:"gcash.com",      notes:"Phase 0 partner."},
  {name:"Nium",           region:"Asia",        country:"Singapore",    series:"Series E",  raise_usd:200000000, fit_score:91,corridor:"Asia → US / EU / UK", in_network:"No", hp_selected:"No",website:"nium.com",        notes:"Perfect corridor alignment."},
  {name:"Xendit",         region:"Asia",        country:"Indonesia",    series:"Series C",  raise_usd:300000000, fit_score:87,corridor:"ID → US / EU / SG",  in_network:"No", hp_selected:"No",website:"xendit.co",       notes:"SEA payment infrastructure."},
  {name:"TaptapSend",     region:"Asia",        country:"Nigeria",      series:"Series B",  raise_usd:65000000,  fit_score:76,corridor:"NG → US / EU / Asia",in_network:"Yes",hp_selected:"Yes",website:"taptapsend.com", notes:"Phase 1 pipeline."},
];

// ── Fintech pipeline stages ───────────────────────────────────────────────────
const STAGES = [
  { id:"sourced",     label:"Sourced",          desc:"Initial contact made" },
  { id:"qualified",   label:"Qualified",         desc:"Fit confirmed, DM identified" },
  { id:"commercial",  label:"Commercial Review", desc:"Pricing discussion active" },
  { id:"diligence",   label:"Diligence",         desc:"KYB/KYC underway" },
  { id:"integration", label:"Integration",       desc:"Tech integration in progress" },
  { id:"live",        label:"Live",              desc:"Transacting — rev share active" },
];
const STAGE_IDX = Object.fromEntries(STAGES.map((s,i) => [s.id, i]));
const COLORS = {
  sourced:     { accent:"#4a4a6a", text:"#a0a0c0" },
  qualified:   { accent:"#1a5276", text:"#7fb3d3" },
  commercial:  { accent:"#1a6b3a", text:"#6dbf8a" },
  diligence:   { accent:"#7a4a00", text:"#e8a820" },
  integration: { accent:"#5a1a8a", text:"#c080f0" },
  live:        { accent:"#1a7a1a", text:"#4ae04a" },
};
const SCORE_COLOR = s => s>=80?"#4ae04a":s>=60?"#7fb3d3":s>=40?"#e8a820":s>=20?"#e87820":"#e84a4a";

// ── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const result=[]; let cur=""; let inQ=false;
  for(let i=0;i<line.length;i++){
    if(line[i]==='"'){inQ=!inQ;}
    else if(line[i]===','&&!inQ){result.push(cur.trim());cur="";}
    else{cur+=line[i];}
  }
  result.push(cur.trim());
  return result;
}
function normalizeHeader(h) {
  return h.split('\n')[0].toLowerCase().replace(/[^a-z0-9\s_]/g,'').trim().replace(/\s+/g,'_');
}
const HEADER_REMAP = {
  'in_hp_network':'in_network','fit_score_max_100':'fit_score',
  'corridor_score_max_25':'corridor_score','volume_score_max_20':'volume_score',
  'series_score_max_20':'series_score','regulatory_score_max_15':'regulatory_score',
  'market_score_max_10':'market_score','leadership_score_max_10':'leadership_score',
};
function parseCSV(text) {
  const lines=text.trim().split('\n').filter(l=>l.trim());
  const headers=parseCSVLine(lines[0]).map(h=>{const n=normalizeHeader(h);return HEADER_REMAP[n]||n;});
  return lines.slice(1).filter(l=>l.trim()).map(line=>{
    const vals=parseCSVLine(line);
    return Object.fromEntries(headers.map((h,i)=>[h,(vals[i]||'').trim()]));
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method:"POST", headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Login failed");
  return data;
}
async function signOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method:"POST", headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${token}` } });
}

// ── LoginScreen ───────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  async function handleLogin() {
    if (!email||!password) return; setLoading(true); setError(null);
    try { const d=await signIn(email,password); onLogin(d.access_token,d.user); }
    catch(e) { setError(e.message); } finally { setLoading(false); }
  }
  return (
    <div style={{minHeight:"100vh",background:"#080808",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{width:360}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:56,height:56,margin:"0 auto 16px",background:"linear-gradient(135deg,#1a5276,#4ae04a22)",borderRadius:14,border:"1px solid #1a5276",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>⚓</div>
          <div style={{fontSize:22,fontWeight:700,color:"#f0f0f0"}}>HarborPass</div>
          <div style={{fontSize:11,color:"#444",fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em",marginTop:4}}>DEAL TRACKER  ·  FINTECH + O&G</div>
        </div>
        <div style={{background:"#0e0e0e",border:"1px solid #1e1e1e",borderRadius:12,padding:32}}>
          <div style={{fontSize:15,fontWeight:600,color:"#f0f0f0",marginBottom:24}}>Sign in</div>
          {[["email","email","you@harborpass.io",email,setEmail],["password","password","••••••••",password,setPassword]].map(([id,type,ph,val,set])=>(
            <div key={id} style={{marginBottom:16}}>
              <div style={{fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:"0.06em"}}>{id.toUpperCase()}</div>
              <input type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{width:"100%",...inputStyle,padding:"10px 12px",fontSize:14,fontFamily:"'DM Sans',sans-serif",color:"#f0f0f0"}}/>
            </div>
          ))}
          {error&&<div style={{background:"#1a0808",border:"1px solid #5a1a1a",borderRadius:6,padding:"10px 12px",marginBottom:16,fontSize:12,color:"#f55",fontFamily:"'DM Mono',monospace"}}>{error}</div>}
          <button onClick={handleLogin} disabled={loading||!email||!password} style={{width:"100%",background:loading?"#0d2f47":"#1a5276",border:"none",borderRadius:6,color:"#7fb3d3",padding:"11px 0",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer"}}>{loading?"Signing in...":"Sign in"}</button>
        </div>
      </div>
    </div>
  );
}

// ── AddPartnerModal ───────────────────────────────────────────────────────────
function AddPartnerModal({ token, onClose, onAdded }) {
  const empty={name:"",market:"",corridor:"",use_case:"",phase:"0",stage:"sourced",notes:""};
  const [form,setForm]=useState(empty);const [loading,setLoading]=useState(false);const [error,setError]=useState(null);
  function set(k,v){setForm(f=>({...f,[k]:v}));}
  async function handleAdd(){
    if(!form.name.trim()){setError("Partner name is required");return;}
    setLoading(true);setError(null);
    try{await sbFetch("/rest/v1/partners",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({...form,revenue_active:form.stage==="live",last_update:new Date().toISOString().split("T")[0]})},token);onAdded();onClose();}
    catch(e){setError(e.message);}finally{setLoading(false);}
  }
  const iStyle={...inputStyle,width:"100%",color:"#f0f0f0",padding:"9px 12px",fontFamily:"'DM Sans',sans-serif"};
  const lStyle={fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace",letterSpacing:"0.07em",display:"block",marginBottom:5};
  return(
    <div style={{position:"fixed",inset:0,background:"#000000bb",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:"#0e0e0e",border:"1px solid #1e1e1e",borderRadius:12,padding:32,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{fontSize:16,fontWeight:700,color:"#f0f0f0"}}>Add fintech partner</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><label style={lStyle}>PARTNER NAME *</label><input style={iStyle} placeholder="e.g. GCash" value={form.name} onChange={e=>set("name",e.target.value)}/></div>
          <div><label style={lStyle}>MARKET</label><input style={iStyle} placeholder="e.g. Philippines" value={form.market} onChange={e=>set("market",e.target.value)}/></div>
        </div>
        <div style={{marginBottom:12}}><label style={lStyle}>CORRIDOR</label><input style={iStyle} placeholder="e.g. PH → US / MENA" value={form.corridor} onChange={e=>set("corridor",e.target.value)}/></div>
        <div style={{marginBottom:12}}><label style={lStyle}>USE CASE</label><input style={iStyle} placeholder="e.g. Cross-border disbursements" value={form.use_case} onChange={e=>set("use_case",e.target.value)}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><label style={lStyle}>PHASE</label><select style={{...iStyle,cursor:"pointer"}} value={form.phase} onChange={e=>set("phase",e.target.value)}><option value="0">Phase 0</option><option value="1">Phase 1</option></select></div>
          <div><label style={lStyle}>INITIAL STAGE</label><select style={{...iStyle,cursor:"pointer"}} value={form.stage} onChange={e=>set("stage",e.target.value)}>{STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
        </div>
        <div style={{marginBottom:24}}><label style={lStyle}>NOTES</label><textarea style={{...iStyle,resize:"vertical",minHeight:72}} value={form.notes} onChange={e=>set("notes",e.target.value)}/></div>
        {error&&<div style={{background:"#1a0808",border:"1px solid #5a1a1a",borderRadius:6,padding:"10px 12px",marginBottom:16,fontSize:12,color:"#f55",fontFamily:"'DM Mono',monospace"}}>{error}</div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,background:"transparent",border:"1px solid #1e1e1e",borderRadius:6,color:"#555",padding:"10px 0",fontSize:13,cursor:"pointer"}}>Cancel</button>
          <button onClick={handleAdd} disabled={loading} style={{flex:2,background:loading?"#0d2f47":"#1a5276",border:"none",borderRadius:6,color:"#7fb3d3",padding:"10px 0",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer"}}>{loading?"Adding...":"Add partner"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Fintech pipeline components ───────────────────────────────────────────────
function StageChip({stage}){const s=STAGES.find(x=>x.id===stage);const c=COLORS[stage]||COLORS.sourced;return<span style={{background:c.accent+"33",color:c.text,border:`1px solid ${c.accent}`,borderRadius:4,fontSize:11,fontWeight:700,padding:"2px 8px",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{s?.label??stage}</span>;}
function ProgressBar({stage}){const idx=STAGE_IDX[stage]??0;const pct=Math.round((idx/(STAGES.length-1))*100);const c=COLORS[stage]||COLORS.sourced;return(<div style={{marginTop:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace"}}>PIPELINE PROGRESS</span><span style={{fontSize:10,color:c.text,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{pct}%</span></div><div style={{height:4,background:"#1a1a1a",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${c.accent},${c.text})`,borderRadius:2,transition:"width 0.5s ease"}}/></div></div>);}
function PartnerCard({partner,onClick,selected}){const c=COLORS[partner.stage]||COLORS.sourced;return(<div onClick={()=>onClick(partner)} style={{background:selected?"#141414":"#0e0e0e",border:selected?`1px solid ${c.accent}`:"1px solid #1e1e1e",borderRadius:8,padding:"16px 18px",cursor:"pointer",transition:"all 0.15s ease",position:"relative",overflow:"hidden"}}>{partner.revenue_active&&<div style={{position:"absolute",top:0,right:0,background:"#4ae04a22",borderBottom:"1px solid #4ae04a44",borderLeft:"1px solid #4ae04a44",borderRadius:"0 8px 0 6px",padding:"2px 8px",fontSize:9,color:"#4ae04a",fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em"}}>● LIVE</div>}<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><div><div style={{fontSize:16,fontWeight:600,color:"#f0f0f0",marginBottom:2}}>{partner.name}</div><div style={{fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace"}}>{partner.market}</div></div><span style={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,fontSize:10,color:"#555",padding:"2px 7px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>PH {partner.phase}</span></div><StageChip stage={partner.stage}/><ProgressBar stage={partner.stage}/><div style={{marginTop:10,fontSize:11,color:"#333",fontFamily:"'DM Mono',monospace"}}>Updated {partner.last_update}</div></div>);}
function DetailPanel({partner,onClose}){if(!partner)return null;const c=COLORS[partner.stage]||COLORS.sourced;const idx=STAGE_IDX[partner.stage]??0;return(<div style={{background:"#0a0a0a",border:`1px solid ${c.accent}55`,borderRadius:10,padding:28,position:"sticky",top:80,boxShadow:`0 0 40px ${c.accent}22`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}><div><div style={{fontSize:24,fontWeight:700,color:"#f0f0f0"}}>{partner.name}</div><div style={{fontSize:12,color:"#555",marginTop:2,fontFamily:"'DM Mono',monospace"}}>{partner.market}  ·  {partner.corridor}</div></div><button onClick={onClose} style={{background:"none",border:"none",color:"#444",cursor:"pointer",fontSize:20,padding:0}}>✕</button></div><div style={{marginBottom:20}}><StageChip stage={partner.stage}/><div style={{marginTop:12,fontSize:12,color:"#888",lineHeight:1.6}}>{partner.notes}</div></div><div style={{marginBottom:24}}><div style={{fontSize:10,color:"#444",fontFamily:"'DM Mono',monospace",marginBottom:12,letterSpacing:"0.08em"}}>PIPELINE STAGES</div>{STAGES.map((s,i)=>{const done=i<idx,active=i===idx;return(<div key={s.id} style={{display:"flex",alignItems:"center",marginBottom:8}}><div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,border:active?`2px solid ${c.text}`:done?"2px solid #2a4a2a":"2px solid #1e1e1e",background:active?c.accent+"55":done?"#1a3a1a":"#111",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:done?"#4ae04a":active?c.text:"#333",fontWeight:700,marginRight:10}}>{done?"✓":i+1}</div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:active?700:400,color:active?c.text:done?"#4a4a4a":"#333"}}>{s.label}</div>{active&&<div style={{fontSize:10,color:"#555",marginTop:1}}>{s.desc}</div>}</div></div>);})}</div><div style={{borderTop:"1px solid #1a1a1a",paddingTop:16}}>{[["USE CASE",partner.use_case],["CORRIDOR",partner.corridor],["PHASE",`Phase ${partner.phase}`],["REVENUE SHARE",partner.revenue_active?"Active — 27.5% of net Veem economics":"Not yet triggered"],["LAST UPDATE",partner.last_update]].map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:10,color:"#444",fontFamily:"'DM Mono',monospace",letterSpacing:"0.07em"}}>{k}</span><span style={{fontSize:11,color:k==="REVENUE SHARE"&&partner.revenue_active?"#4ae04a":"#888",fontFamily:"'DM Mono',monospace",textAlign:"right",maxWidth:"60%"}}>{v}</span></div>))}</div></div>);}

// ── PipelinePage ──────────────────────────────────────────────────────────────
function PipelinePage({ token }) {
  const [partners,setPartners]=useState([]);const [selected,setSelected]=useState(null);
  const [filter,setFilter]=useState("all");const [stageFilter,setStageFilter]=useState("all");
  const [search,setSearch]=useState("");const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);const [showAdd,setShowAdd]=useState(false);
  async function load(){setLoading(true);setError(null);try{const d=await sbFetch("/rest/v1/partners?select=*&order=id",{},token);if(!Array.isArray(d))throw new Error(JSON.stringify(d));setPartners(d);}catch(e){setError(e.message);}finally{setLoading(false);};}
  useEffect(()=>{load();},[]);
  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:400}}><div style={{textAlign:"center"}}><div style={{fontSize:28,marginBottom:12}}>⚡</div><div style={{color:"#444",fontFamily:"'DM Mono',monospace",fontSize:11}}>LOADING...</div></div></div>;
  if(error)return<div style={{padding:40}}><div style={{color:"#f55",fontFamily:"'DM Mono',monospace",fontSize:12,marginBottom:12}}>Error: {error}</div><button onClick={load} style={{background:"#1a5276",border:"none",borderRadius:6,color:"#7fb3d3",padding:"8px 20px",cursor:"pointer",fontSize:12}}>Retry</button></div>;
  const filtered=partners.filter(p=>{if(filter!=="all"&&p.phase!==filter)return false;if(stageFilter!=="all"&&p.stage!==stageFilter)return false;if(search&&!p.name.toLowerCase().includes(search.toLowerCase())&&!p.market?.toLowerCase().includes(search.toLowerCase()))return false;return true;});
  return(
    <div style={{padding:"24px 32px"}}>
      {showAdd&&<AddPartnerModal token={token} onClose={()=>setShowAdd(false)} onAdded={load}/>}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search partner or market…" style={{...inputStyle,width:200}}/>
        {[["all","All Phases"],["0","Phase 0"],["1","Phase 1"]].map(([v,l])=>(<button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?"#1a5276":"#0e0e0e",border:`1px solid ${filter===v?"#1a5276":"#1e1e1e"}`,color:filter===v?"#7fb3d3":"#555",borderRadius:6,padding:"6px 12px",fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer",fontWeight:filter===v?700:400}}>{l}</button>))}
        <div style={{borderLeft:"1px solid #1e1e1e",paddingLeft:10,display:"flex",gap:6,flexWrap:"wrap"}}>{[["all","All"],...STAGES.map(s=>[s.id,s.label])].map(([v,l])=>(<button key={v} onClick={()=>setStageFilter(v)} style={{background:stageFilter===v?(v==="all"?"#222":(COLORS[v]?.accent??"#333")+"44"):"transparent",border:`1px solid ${stageFilter===v?(v==="all"?"#333":COLORS[v]?.accent??"#333"):"transparent"}`,color:stageFilter===v?(v==="all"?"#ccc":COLORS[v]?.text??"#ccc"):"#444",borderRadius:4,padding:"4px 8px",fontSize:10,fontFamily:"'DM Mono',monospace",cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>))}</div>
        <button onClick={()=>setShowAdd(true)} style={{marginLeft:"auto",background:"#1a5276",border:"none",borderRadius:6,color:"#7fb3d3",padding:"7px 14px",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:15}}>+</span> Add partner</button>
      </div>
      <div style={{display:"flex",gap:2,marginBottom:20,borderRadius:8,overflow:"hidden",height:5}}>{STAGES.map(s=>{const cnt=partners.filter(p=>p.stage===s.id).length;return<div key={s.id} title={`${s.label}: ${cnt}`} style={{flex:cnt/(partners.length||1)*100,background:COLORS[s.id].accent,minWidth:cnt>0?2:0}}/>;})}</div>
      <div style={{display:"flex",gap:20}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
            {filtered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",color:"#333",padding:60,fontFamily:"'DM Mono',monospace",fontSize:12}}>{partners.length===0?"No partners yet — add your first one":"No partners match filters"}</div>}
            {filtered.map(p=><PartnerCard key={p.id} partner={p} onClick={q=>setSelected(q.id===selected?.id?null:q)} selected={selected?.id===p.id}/>)}
          </div>
          <div style={{marginTop:28,padding:"12px 16px",background:"#0a0a0a",border:"1px dashed #1e1e1e",borderRadius:8,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:16}}>✉️</div>
            <div style={{fontSize:11,color:"#333"}}>Send <span style={{color:"#1a5276",fontFamily:"'DM Mono',monospace"}}>Subject: HP Update: [Partner] &gt; [Stage]</span> from Gmail to update stages automatically</div>
          </div>
        </div>
        {selected&&<div style={{width:320,flexShrink:0}}><DetailPanel partner={selected} onClose={()=>setSelected(null)}/></div>}
      </div>
    </div>
  );
}

// ── ProspectsPage ─────────────────────────────────────────────────────────────
function ScoreBar({score}){const color=SCORE_COLOR(score);return(<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:4,background:"#1a1a1a",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${score}%`,background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:2}}/></div><span style={{fontSize:12,fontWeight:700,color,fontFamily:"'DM Mono',monospace",minWidth:28,textAlign:"right"}}>{score}</span></div>);}

function ProspectsPage() {
  const [prospects,setProspects]=useState([]);const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);const [usingSample,setUsingSample]=useState(false);
  const [regionTab,setRegionTab]=useState("All");const [countryFilter,setCountryFilter]=useState("All");
  const [seriesFilter,setSeriesFilter]=useState("All");const [networkFilter,setNetworkFilter]=useState("All");
  const [selectedFilter,setSelectedFilter]=useState("All");const [search,setSearch]=useState("");
  const [sortBy,setSortBy]=useState("fit_score");const [expanded,setExpanded]=useState(null);

  useEffect(()=>{
    async function load(){
      if(!SHEETS_CSV_URL){setProspects(SAMPLE_PROSPECTS);setUsingSample(true);setLoading(false);return;}
      try{const res=await fetch(SHEETS_CSV_URL);if(!res.ok)throw new Error(`HTTP ${res.status}`);const text=await res.text();const rows=parseCSV(text).map(r=>({...r,fit_score:parseFloat(r.fit_score)||0,raise_usd:parseFloat(String(r.raise_usd).replace(/[$,]/g,''))||0}));setProspects(rows);}
      catch(e){setError(e.message);}finally{setLoading(false);}
    }
    load();
  },[]);

  const REGIONS=["All","Africa","Middle East","Asia","Other"];
  const countries=["All",...[...new Set(prospects.map(p=>p.country))].sort()];
  const seriesOpts=["All",...[...new Set(prospects.map(p=>p.series))].sort()];
  const filtered=prospects.filter(p=>{
    if(regionTab!=="All"&&p.region!==regionTab)return false;
    if(countryFilter!=="All"&&p.country!==countryFilter)return false;
    if(seriesFilter!=="All"&&p.series!==seriesFilter)return false;
    if(networkFilter!=="All"&&p.in_network!==networkFilter)return false;
    if(selectedFilter!=="All"&&p.hp_selected!==selectedFilter)return false;
    if(search&&!p.name.toLowerCase().includes(search.toLowerCase())&&!p.country?.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  }).sort((a,b)=>sortBy==="fit_score"?b.fit_score-a.fit_score:sortBy==="raise_usd"?b.raise_usd-a.raise_usd:a.name.localeCompare(b.name)).slice(0,50);
  const fmtRaise=v=>{if(!v)return"—";if(v>=1e9)return`$${(v/1e9).toFixed(1)}B`;if(v>=1e6)return`$${(v/1e6).toFixed(0)}M`;return`$${v.toLocaleString()}`;};
  const thStyle=(col)=>({padding:"10px 12px",fontSize:10,color:sortBy===col?"#7fb3d3":"#444",fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em",textAlign:"left",borderBottom:"1px solid #1e1e1e",cursor:"pointer",whiteSpace:"nowrap",background:"#080808",userSelect:"none"});

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:400}}><div style={{textAlign:"center"}}><div style={{fontSize:28,marginBottom:12}}>🌍</div><div style={{color:"#444",fontFamily:"'DM Mono',monospace",fontSize:11}}>LOADING...</div></div></div>;
  if(error)return<div style={{padding:40,color:"#f55",fontFamily:"'DM Mono',monospace",fontSize:12}}>Failed to load: {error}</div>;

  return(
    <div style={{padding:"24px 32px"}}>
      {usingSample&&<div style={{background:"#1a2a1a",border:"1px solid #2a4a2a",borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:11,color:"#6dbf8a"}}><span style={{fontWeight:700}}>Sample data</span> — paste your Google Sheet CSV URL into SHEETS_CSV_URL in config.js to load live data.</div>}
      <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid #1e1e1e"}}>{REGIONS.map(r=>(<button key={r} onClick={()=>{setRegionTab(r);setCountryFilter("All");}} style={{background:"none",border:"none",borderBottom:regionTab===r?"2px solid #1a5276":"2px solid transparent",color:regionTab===r?"#7fb3d3":"#444",padding:"8px 16px",fontSize:12,fontFamily:"'DM Mono',monospace",cursor:"pointer",fontWeight:regionTab===r?700:400,marginBottom:-1}}>{r}</button>))}<div style={{marginLeft:"auto",fontSize:11,color:"#333",fontFamily:"'DM Mono',monospace",display:"flex",alignItems:"center"}}>TOP 50 BY FIT SCORE</div></div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company or country…" style={{...inputStyle,width:200}}/>
        {[["Country",countryFilter,setCountryFilter,countries],["Series",seriesFilter,setSeriesFilter,seriesOpts]].map(([label,val,setter,opts])=>(<select key={label} value={val} onChange={e=>setter(e.target.value)} style={{...inputStyle,cursor:"pointer"}}>{opts.map(o=><option key={o} value={o}>{o==="All"?(label==="Country"?"All Countries":label==="Series"?"All Series":`All ${label}s`):o}</option>)}</select>))}
        <select value={networkFilter} onChange={e=>setNetworkFilter(e.target.value)} style={{...inputStyle,cursor:"pointer"}}><option value="All">All Network</option><option value="Yes">In HP Network</option><option value="No">Not in Network</option></select>
        <select value={selectedFilter} onChange={e=>setSelectedFilter(e.target.value)} style={{...inputStyle,cursor:"pointer"}}><option value="All">All Selected</option><option value="Yes">HP Selected</option><option value="No">Not Selected</option></select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...inputStyle,cursor:"pointer",marginLeft:"auto"}}><option value="fit_score">Sort: Fit Score</option><option value="raise_usd">Sort: Raise Amount</option><option value="name">Sort: Name A–Z</option></select>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:20}}>
        {[["SHOWING",`${filtered.length} of ${prospects.filter(p=>regionTab==="All"||p.region===regionTab).length}`,"#888"],["HP SELECTED",filtered.filter(p=>p.hp_selected==="Yes").length,"#e8a820"],["IN NETWORK",filtered.filter(p=>p.in_network==="Yes").length,"#7fb3d3"],["AVG FIT SCORE",filtered.length?Math.round(filtered.reduce((s,p)=>s+p.fit_score,0)/filtered.length):0,SCORE_COLOR(filtered.length?Math.round(filtered.reduce((s,p)=>s+p.fit_score,0)/filtered.length):0)]].map(([label,val,color])=>(<div key={label} style={{background:"#0e0e0e",border:"1px solid #1e1e1e",borderRadius:8,padding:"10px 16px"}}><div style={{fontSize:18,fontWeight:700,color,fontFamily:"'DM Mono',monospace"}}>{val}</div><div style={{fontSize:9,color:"#333",letterSpacing:"0.08em",marginTop:2}}>{label}</div></div>))}
      </div>
      <div style={{background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:10,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>
            <th style={{...thStyle(),width:36,textAlign:"center"}}>#</th>
            <th style={thStyle("name")} onClick={()=>setSortBy("name")}>COMPANY {sortBy==="name"?"↑":""}</th>
            <th style={thStyle()}>COUNTRY</th><th style={thStyle()}>SERIES</th>
            <th style={thStyle("raise_usd")} onClick={()=>setSortBy("raise_usd")}>RAISED {sortBy==="raise_usd"?"↓":""}</th>
            <th style={{...thStyle("fit_score"),width:160}} onClick={()=>setSortBy("fit_score")}>FIT SCORE {sortBy==="fit_score"?"↓":""}</th>
            <th style={thStyle()}>CORRIDOR</th>
            <th style={{...thStyle(),textAlign:"center"}}>NETWORK</th>
            <th style={{...thStyle(),textAlign:"center"}}>SELECTED</th>
          </tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={9} style={{padding:48,textAlign:"center",color:"#333",fontFamily:"'DM Mono',monospace",fontSize:12}}>No prospects match filters</td></tr>}
            {filtered.map((p,i)=>(
              <>
                <tr key={p.name} onClick={()=>setExpanded(expanded===p.name?null:p.name)} style={{borderBottom:"1px solid #141414",cursor:"pointer",background:expanded===p.name?"#141414":i%2===0?"#0a0a0a":"#0d0d0d"}}>
                  <td style={{padding:"10px 12px",fontSize:12,color:"#333",fontFamily:"'DM Mono',monospace",textAlign:"center",fontWeight:700}}>{i+1}</td>
                  <td style={{padding:"10px 12px"}}><div style={{fontSize:13,fontWeight:600,color:"#f0f0f0"}}>{p.name}</div>{p.website&&<div style={{fontSize:10,color:"#333",fontFamily:"'DM Mono',monospace",marginTop:2}}>{p.website}</div>}</td>
                  <td style={{padding:"10px 12px",fontSize:12,color:"#777",fontFamily:"'DM Mono',monospace"}}>{p.country}</td>
                  <td style={{padding:"10px 12px"}}><span style={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:4,fontSize:10,color:"#666",padding:"2px 7px",fontFamily:"'DM Mono',monospace"}}>{p.series||"—"}</span></td>
                  <td style={{padding:"10px 12px",fontSize:12,color:"#888",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{fmtRaise(p.raise_usd)}</td>
                  <td style={{padding:"10px 16px 10px 12px",minWidth:140}}><ScoreBar score={p.fit_score}/></td>
                  <td style={{padding:"10px 12px",fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{p.corridor||"—"}</td>
                  <td style={{padding:"10px 12px",textAlign:"center"}}><span style={{fontSize:14,color:p.in_network==="Yes"?"#7fb3d3":"#222"}}>{p.in_network==="Yes"?"✓":"—"}</span></td>
                  <td style={{padding:"10px 12px",textAlign:"center"}}><span style={{fontSize:14,color:p.hp_selected==="Yes"?"#e8a820":"#222"}}>{p.hp_selected==="Yes"?"★":"—"}</span></td>
                </tr>
                {expanded===p.name&&<tr key={p.name+"_x"} style={{borderBottom:"1px solid #1e1e1e",background:"#111"}}><td colSpan={9} style={{padding:"12px 16px 16px 44px"}}><div style={{fontSize:12,color:"#666",lineHeight:1.7,maxWidth:700}}>{p.notes||"No notes."}</div></td></tr>}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [page, setPage]       = useState("pipeline");

  function handleLogin(token, user) { setSession({ token, user }); }
  async function handleSignOut() { await signOut(session.token); setSession(null); }

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ minHeight:"100vh", background:"#080808", color:"#f0f0f0", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0a0a0a;}::-webkit-scrollbar-thumb{background:#222;border-radius:2px;}
        select option{background:#0e0e0e;color:#ccc;}
      `}</style>

      {/* Header */}
      <div style={{ background:"#0a0a0a", borderBottom:"1px solid #141414", padding:"0 32px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:30, height:30, background:"linear-gradient(135deg,#1a5276,#4ae04a22)", borderRadius:8, border:"1px solid #1a5276", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>⚓</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#f0f0f0" }}>HarborPass</div>
              <div style={{ fontSize:9, color:"#333", fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em" }}>DEAL TRACKER  ·  FINTECH + O&G</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:2, background:"#111", borderRadius:8, padding:3, border:"1px solid #1a1a1a" }}>
            {[["pipeline","Pipeline","⚡"],["prospects","Prospects","🌍"],["og","O&G","🛢️"]].map(([id, label, icon]) => (
              <button key={id} onClick={() => setPage(id)} style={{
                background: page===id ? (id==="og" ? "#3a2000" : "#1a5276") : "transparent",
                border: "none", borderRadius:6,
                color: page===id ? (id==="og" ? "#c8901a" : "#7fb3d3") : "#444",
                padding:"6px 16px", fontSize:12, fontWeight:page===id?700:400,
                cursor:"pointer", fontFamily:"'DM Mono',monospace", letterSpacing:"0.04em",
                transition:"all 0.15s", display:"flex", alignItems:"center", gap:6
              }}><span>{icon}</span>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:20, alignItems:"center" }}>
          <div style={{ fontSize:10, color:"#333", fontFamily:"'DM Mono',monospace" }}>{session.user?.email}</div>
          <button onClick={handleSignOut} style={{ background:"transparent", border:"1px solid #1e1e1e", borderRadius:6, color:"#444", padding:"6px 12px", fontSize:10, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>Sign out</button>
        </div>
      </div>

      {page === "pipeline"  && <PipelinePage token={session.token} />}
      {page === "prospects" && <ProspectsPage />}
      {page === "og"        && <OGPipelinePage token={session.token} />}
    </div>
  );
}
