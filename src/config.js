// ── CONFIGURATION ─────────────────────────────────────────────────────────────
export const SUPABASE_URL = "https://kkmgvmdjdijbovmhzwul.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbWd2bWRqZGlqYm92bWh6d3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTczMjgsImV4cCI6MjA5NTU5MzMyOH0.smBFtagcKfd-8VRxv5CugcCpSRF8k-i1LgT7IjHUfEo";
export const SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2vnKG-iTlRsMx9ecZZWBH8wjJ0TEXx2vFZlFs7-7-RV5rryKvmG5UObYa-GfxuQ/pub?gid=872247566&single=true&output=csv"; 
// ─────────────────────────────────────────────────────────────────────────────

export function sbHeaders(token) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token || SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function sbFetch(path, options = {}, token) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...sbHeaders(token), ...options.headers },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status}: ${t}`);
  }
  return res.status === 204 ? null : res.json();
}

export const inputStyle = {
  background: "#0e0e0e",
  border: "1px solid #1e1e1e",
  borderRadius: 6,
  color: "#ccc",
  padding: "7px 10px",
  fontSize: 11,
  fontFamily: "'DM Mono',monospace",
  outline: "none",
};
