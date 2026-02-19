import { useState, useEffect, useRef } from “react”;
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from “recharts”;

const APP_PASSWORD = “TimeMomb”;

function LoginScreen({ onLogin }) {
const [input, setInput] = useState(””);
const [error, setError] = useState(false);

function handleSubmit() {
if (input === APP_PASSWORD) {
localStorage.setItem(“tt_auth”, “1”);
onLogin();
} else {
setError(true);
setInput(””);
setTimeout(() => setError(false), 2000);
}
}

return (
<div style={{minHeight:“100vh”,background:”#0A0A0A”,display:“flex”,alignItems:“center”,justifyContent:“center”,fontFamily:”‘DM Mono’,‘Courier New’,monospace”}}>
<div style={{width:320,padding:“40px 32px”,background:”#0D0D0D”,border:“1px solid #1E1E1E”,borderRadius:12,display:“flex”,flexDirection:“column”,alignItems:“center”,gap:20}}>
<div style={{fontFamily:”‘Barlow Condensed’,‘Arial Narrow’,sans-serif”,fontWeight:800,fontSize:28,color:”#E8E4DF”,letterSpacing:”.01em”}}>
TEMPS<span style={{color:”#E86C3A”}}>·</span>TRAVAIL
</div>
<div style={{fontSize:10,color:”#333”,letterSpacing:”.18em”}}>ACCÈS PROTÉGÉ</div>
<input
type=“password”
value={input}
onChange={e=>setInput(e.target.value)}
onKeyDown={e=>e.key===“Enter”&&handleSubmit()}
placeholder=“Mot de passe”
autoFocus
style={{width:“100%”,background:”#161616”,border:`1px solid ${error?"#E85050":"#2A2A2A"}`,color:”#E8E4DF”,fontFamily:“inherit”,fontSize:13,padding:“10px 14px”,borderRadius:5,outline:“none”,textAlign:“center”,transition:“border .2s”}}
/>
{error && <div style={{fontSize:11,color:”#E85050”,letterSpacing:”.08em”}}>Mot de passe incorrect</div>}
<button onClick={handleSubmit} style={{width:“100%”,padding:“10px”,background:”#E86C3A”,color:”#000”,border:“none”,borderRadius:5,fontFamily:”‘Barlow Condensed’,‘Arial Narrow’,sans-serif”,fontWeight:700,fontSize:14,textTransform:“uppercase”,letterSpacing:”.06em”,cursor:“pointer”}}>
Entrer
</button>
</div>
</div>
);
}

const DEFAULT_TJM = 500;
const COLORS = [”#E86C3A”,”#3A8FE8”,”#4CAF7D”,”#9B59B6”,”#E8C13A”,”#E83A6C”,”#1ABCFE”,”#FF6B6B”];
const WORK_HOURS_PER_DAY = 7;

function parseTimeRange(str) {
const s = str.trim();
const dur = s.match(/^(\d+)h(\d+)?(?:min)?$|^(\d+):(\d+)$|^(\d+)(?:min|m)$/i);
if (dur) {
if (dur[5] !== undefined) return parseInt(dur[5]);
if (dur[3] !== undefined) return parseInt(dur[3]) * 60 + (parseInt(dur[4]) || 0);
return parseInt(dur[1]) * 60 + (parseInt(dur[2]) || 0);
}
const t = s.replace(/[hH]/, “:”).replace(/:$/, “”);
const parts = t.split(”:”);
if (parts.length === 2) { const h = parseInt(parts[0]), m = parseInt(parts[1]); if (!isNaN(h) && !isNaN(m)) return h * 60 + m; }
if (parts.length === 1) { const h = parseInt(parts[0]); if (!isNaN(h)) return h * 60; }
return null;
}

function parseDuration(str) {
const s = str.trim();
const m1 = s.match(/^(\d+)h(\d+)?(?:min)?$/i);
if (m1) return parseInt(m1[1]) * 60 + (parseInt(m1[2]) || 0);
const m2 = s.match(/^(\d+):(\d+)$/);
if (m2) return parseInt(m2[1]) * 60 + parseInt(m2[2]);
const m3 = s.match(/^(\d+)(?:min|m)$/i);
if (m3) return parseInt(m3[1]);
const m4 = s.match(/^(\d+)$/);
if (m4) return parseInt(m4[1]);
return null;
}

function fmtMins(mins) {
const h = Math.floor(mins / 60), m = mins % 60;
if (h === 0) return `${m}min`;
if (m === 0) return `${h}h`;
return `${h}h${String(m).padStart(2,"0")}`;
}

function fmtSecs(secs) {
const h = Math.floor(secs / 3600), m = Math.floor((secs%3600)/60), s = secs%60;
return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function todayStr() { return new Date().toISOString().split(“T”)[0]; }

function fmtDate(str) {
return new Date(str+“T12:00:00”).toLocaleDateString(“fr-FR”,{weekday:“short”,day:“numeric”,month:“short”});
}

function toEuros(mins, tjm) {
return ((mins / 60) * (tjm / WORK_HOURS_PER_DAY)).toFixed(2);
}

function toDays(mins) {
return (mins / 60 / WORK_HOURS_PER_DAY).toFixed(2);
}

const initialState = () => {
try {
const s = localStorage.getItem(“timetracker_v3”);
if (s) return JSON.parse(s);
} catch {}
return { clients: {}, projects: {} };
};

function getCalendarDays(year, month) {
const first = new Date(year, month, 1);
const last = new Date(year, month+1, 0);
const days = [];
const startDow = (first.getDay() + 6) % 7;
for (let i = 0; i < startDow; i++) days.push(null);
for (let d = 1; d <= last.getDate(); d++) days.push(d);
return days;
}

function calColor(mins) {
if (!mins || mins === 0) return “#111”;
if (mins < 120) return “#1a4a2a”;
if (mins < 240) return “#4a3a10”;
if (mins < 480) return “#4a1a10”;
return “#2a1040”;
}
function calDotColor(mins) {
if (!mins || mins === 0) return “transparent”;
if (mins < 120) return “#4CAF7D”;
if (mins < 240) return “#E8C13A”;
if (mins < 480) return “#E86C3A”;
return “#9B59B6”;
}

export default function App() {
const [authed, setAuthed] = useState(() => localStorage.getItem(“tt_auth”) === “1”);
if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
return <AppInner />;
}

function AppInner() {
const [data, setData] = useState(initialState);
const [view, setView] = useState(“track”);
const [expandedClient, setExpandedClient] = useState(null);
const [selectedProject, setSelectedProject] = useState(null);
const [newClientName, setNewClientName] = useState(””);
const [newClientTJM, setNewClientTJM] = useState(””);
const [showNewClient, setShowNewClient] = useState(false);
const [newProjectName, setNewProjectName] = useState(””);
const [newProjectClient, setNewProjectClient] = useState(””);
const [showNewProject, setShowNewProject] = useState(false);
const [manualMode, setManualMode] = useState(“range”);
const [startInput, setStartInput] = useState(””);
const [endInput, setEndInput] = useState(””);
const [durInput, setDurInput] = useState(””);
const [manualProject, setManualProject] = useState(””);
const [note, setNote] = useState(””);
const [manualDate, setManualDate] = useState(todayStr());
const [isRunning, setIsRunning] = useState(false);
const [timerStart, setTimerStart] = useState(null);
const [elapsed, setElapsed] = useState(0);
const [timerProject, setTimerProject] = useState(null);
const [timerNote, setTimerNote] = useState(””);
const intervalRef = useRef(null);
const [error, setError] = useState(””);
const [success, setSuccess] = useState(””);
const [summaryProject, setSummaryProject] = useState(null);
const [calMonth, setCalMonth] = useState(() => { const d=new Date(); return {y:d.getFullYear(),m:d.getMonth()}; });
const [calFilter, setCalFilter] = useState(“all”);

useEffect(() => {
try { localStorage.setItem(“timetracker_v3”, JSON.stringify(data)); } catch {}
}, [data]);

useEffect(() => {
if (isRunning) {
intervalRef.current = setInterval(() => setElapsed(Math.floor((Date.now()-timerStart)/1000)), 1000);
} else clearInterval(intervalRef.current);
return () => clearInterval(intervalRef.current);
}, [isRunning, timerStart]);

const clientNames = Object.keys(data.clients);
const projectNames = Object.keys(data.projects);
const unattachedProjects = projectNames.filter(p => !data.projects[p].client);

function getClientTJM(n) { return data.clients[n]?.tjm || DEFAULT_TJM; }
function getProjectTJM(n) { const p = data.projects[n]; if (!p) return DEFAULT_TJM; return getClientTJM(p.client); }

const timerAccent = timerProject ? COLORS[projectNames.indexOf(timerProject) % COLORS.length] : “#E86C3A”;

function flashSuccess(msg) { setSuccess(msg); setTimeout(()=>setSuccess(””),3500); }
function flashError(msg) { setError(msg); setTimeout(()=>setError(””),3500); }

function exportData() {
const json = JSON.stringify(data, null, 2);
const blob = new Blob([json], {type:“application/json”});
const url = URL.createObjectURL(blob);
const a = document.createElement(“a”);
a.href = url; a.download = `temps-travail-${todayStr()}.json`;
a.click(); URL.revokeObjectURL(url);
}

function importData(e) {
const file = e.target.files[0]; if (!file) return;
const reader = new FileReader();
reader.onload = ev => {
try {
const parsed = JSON.parse(ev.target.result);
if (parsed.projects && parsed.clients !== undefined) {
if (window.confirm(“Remplacer toutes les données actuelles par celles du fichier importé ?”)) {
setData(parsed); flashSuccess(“✓ Données importées !”);
}
} else { flashError(“Fichier invalide.”); }
} catch { flashError(“Erreur lecture fichier.”); }
};
reader.readAsText(file); e.target.value = “”;
}

function createClient() {
const name = newClientName.trim(); if (!name) return;
if (data.clients[name]) { flashError(“Client déjà existant.”); return; }
const tjm = parseInt(newClientTJM) || DEFAULT_TJM;
setData(d => ({…d, clients: {…d.clients, [name]: {tjm}}}));
setNewClientName(””); setNewClientTJM(””); setShowNewClient(false);
}

function deleteClient(name) {
if (!window.confirm(`Supprimer le client "${name}" et tous ses projets ?`)) return;
const projs = projectNames.filter(p => data.projects[p].client === name);
setData(d => { const c={…d.clients}; delete c[name]; const p={…d.projects}; projs.forEach(pr=>delete p[pr]); return {…d,clients:c,projects:p}; });
if (projs.includes(selectedProject)) setSelectedProject(null);
if (projs.includes(timerProject)) { setTimerProject(null); setIsRunning(false); }
}

function updateClientTJM(name, val) {
const tjm = parseInt(val); if (isNaN(tjm) || tjm <= 0) return;
setData(d => ({…d, clients: {…d.clients, [name]: {…d.clients[name], tjm}}}));
}

function createProject() {
const name = newProjectName.trim(); if (!name) return;
if (data.projects[name]) { flashError(“Projet déjà existant.”); return; }
const client = newProjectClient || null;
setData(d => ({…d, projects: {…d.projects, [name]: {client, sessions:[], createdAt:todayStr()}}}));
setSelectedProject(name); setTimerProject(name);
setNewProjectName(””); setShowNewProject(false);
}

function deleteProject(name) {
if (!window.confirm(`Supprimer le projet "${name}" ?`)) return;
setData(d => { const p={…d.projects}; delete p[name]; return {…d,projects:p}; });
if (selectedProject === name) setSelectedProject(null);
if (timerProject === name) { setTimerProject(null); setIsRunning(false); }
}

function toggleTimer() {
if (isRunning) {
setIsRunning(false);
const durationMins = Math.round(elapsed/60);
if (durationMins < 1) { flashError(“Session trop courte (< 1 min).”); return; }
const st=new Date(timerStart), en=new Date(timerStart+elapsed*1000);
const fmt = d => `${d.getHours()}h${String(d.getMinutes()).padStart(2,"0")}`;
const session = {date:st.toISOString().split(“T”)[0],start:fmt(st),end:fmt(en),duration:durationMins,note:timerNote};
setData(d => ({…d, projects:{…d.projects,[timerProject]:{…d.projects[timerProject],sessions:[…d.projects[timerProject].sessions,session]}}}));
flashSuccess(`✓ ${fmtMins(durationMins)} sur "${timerProject}" · ${toEuros(durationMins,getProjectTJM(timerProject))}€HT`);
setElapsed(0); setTimerNote(””);
} else {
if (!timerProject) { flashError(“Sélectionne un projet.”); return; }
setTimerStart(Date.now()); setElapsed(0); setIsRunning(true);
}
}

function addManualSession() {
const proj = manualProject || selectedProject;
if (!proj) { flashError(“Sélectionne un projet.”); return; }
let duration = 0;
if (manualMode === “duration”) {
const d = parseDuration(durInput);
if (!d || d <= 0) { flashError(“Durée invalide. Ex: 1h30, 45min, 2h”); return; }
duration = d;
} else {
const s = parseTimeRange(startInput), e = parseTimeRange(endInput);
if (s === null) { flashError(“Heure de début invalide (ex: 9h30)”); return; }
if (e === null) { flashError(“Heure de fin invalide (ex: 12h00)”); return; }
if (e <= s) { flashError(“La fin doit être après le début.”); return; }
duration = e - s;
}
const session = {date:manualDate||todayStr(),start:manualMode===“range”?startInput:””,end:manualMode===“range”?endInput:””,duration,note};
setData(d => ({…d,projects:{…d.projects,[proj]:{…d.projects[proj],sessions:[…d.projects[proj].sessions,session]}}}));
setStartInput(””); setEndInput(””); setDurInput(””); setNote(””);
flashSuccess(`✓ ${fmtMins(duration)} ajoutées · ${toEuros(duration,getProjectTJM(proj))}€HT`);
}

function deleteSession(proj, idx) {
setData(d => { const sessions=d.projects[proj].sessions.filter((_,i)=>i!==idx); return {…d,projects:{…d.projects,[proj]:{…d.projects[proj],sessions}}}; });
}

function getProjectSummary(name) {
const sessions = data.projects[name]?.sessions || []; if (!sessions.length) return null;
const byDay = {};
sessions.forEach(s => { if(!byDay[s.date]) byDay[s.date]={total:0,count:0}; byDay[s.date].total+=s.duration; byDay[s.date].count++; });
const days = Object.keys(byDay).sort();
const totalMins = sessions.reduce((a,s)=>a+s.duration,0);
const avgPerDay = Math.round(totalMins/days.length);
const chartData = days.map(d => ({name:fmtDate(d),minutes:byDay[d].total}));
return {days,byDay,totalMins,avgPerDay,chartData,totalSessions:sessions.length};
}

function getCalendarData() {
const byDay = {};
for (const [,proj] of Object.entries(data.projects)) {
if (calFilter !== “all” && proj.client !== calFilter) continue;
proj.sessions.forEach(s => { if(!byDay[s.date]) byDay[s.date]=0; byDay[s.date]+=s.duration; });
}
return byDay;
}

function getClientTotals(clientName) {
const projs = projectNames.filter(p => data.projects[p].client === clientName);
let total = 0;
const details = projs.map(p => { const mins=data.projects[p].sessions.reduce((a,s)=>a+s.duration,0); total+=mins; return {name:p,mins}; });
return {total,details};
}

const calDays = getCalendarDays(calMonth.y, calMonth.m);
const calData = getCalendarData();
const calMonthName = new Date(calMonth.y,calMonth.m,1).toLocaleDateString(“fr-FR”,{month:“long”,year:“numeric”});
const dropSt = {appearance:“none”,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7'%3E%3Cpath d='M0 0l5 7 5-7z' fill='%23555'/%3E%3C/svg%3E")`,backgroundRepeat:“no-repeat”,backgroundPosition:“right 12px center”};

return (
<div style={{minHeight:“100vh”,background:”#0A0A0A”,color:”#E8E4DF”,fontFamily:”‘DM Mono’,‘Courier New’,monospace”,fontSize:13}}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Barlow+Condensed:wght@600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} input,select{background:#161616;border:1px solid #2A2A2A;color:#E8E4DF;font-family:'DM Mono',monospace;font-size:12px;padding:7px 10px;border-radius:3px;outline:none;transition:border .15s} input:focus,select:focus{border-color:#E86C3A} input::placeholder{color:#444} select option{background:#161616;color:#E8E4DF} button{cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;border:none;transition:all .15s;letter-spacing:.04em} .btn-p{background:#E86C3A;color:#000;padding:7px 16px;border-radius:3px;font-size:12px;text-transform:uppercase} .btn-p:hover{background:#FF8050} .btn-g{background:transparent;color:#777;padding:5px 12px;border-radius:3px;font-size:11px;border:1px solid #2A2A2A;text-transform:uppercase} .btn-g:hover{border-color:#555;color:#E8E4DF} .btn-d{background:transparent;color:#8a3030;padding:2px 7px;border-radius:2px;font-size:10px;border:1px solid #2A1010} .btn-d:hover{background:#1a0808;color:#E84040} .srow{display:grid;grid-template-columns:80px 52px 52px 58px 70px 1fr 30px;gap:5px;align-items:center;padding:8px 10px;border-bottom:1px solid #151515;font-size:11px} .srow:hover{background:#111} ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#252525} .client-hdr{padding:6px 8px;display:flex;align-items:center;gap:6px;cursor:pointer;border-radius:3px;transition:background .1s;user-select:none} .client-hdr:hover{background:#161616} .proj-row{padding:5px 8px 5px 22px;display:flex;align-items:center;gap:6px;cursor:pointer;border-radius:3px;transition:background .1s} .proj-row:hover{background:#141414} .proj-row.on{background:#161616;border-left:2px solid #E86C3A44} @keyframes pulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.16);opacity:.18}} @keyframes blink{0%,100%{opacity:1}50%{opacity:.5}} .tab-btn{padding:5px 14px;border-radius:3px;font-size:11px;border:1px solid #222;background:transparent;color:#666;text-transform:uppercase;letter-spacing:.06em} .tab-btn:hover{color:#E8E4DF;border-color:#444} .tab-btn.on{background:#E86C3A;color:#000;border-color:#E86C3A} .mode-btn{padding:4px 12px;border-radius:2px;font-size:10px;border:1px solid #222;background:transparent;color:#555;text-transform:uppercase;letter-spacing:.06em} .mode-btn:hover{color:#E8E4DF} .mode-btn.on{background:#252525;color:#E8E4DF;border-color:#444} .cal-cell{width:100%;aspect-ratio:1;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;cursor:default;transition:all .1s} .cal-cell:hover{filter:brightness(1.3)} input[type="date"]{color-scheme:dark}`}</style>

```
  {/* HEADER */}
  <div style={{borderBottom:"1px solid #181818",padding:"11px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:20}}>TEMPS<span style={{color:"#E86C3A"}}>·</span>TRAVAIL</div>
      <div style={{fontSize:9,color:"#3A3A3A",letterSpacing:".14em"}}>TJM BASE {DEFAULT_TJM}€HT · {(DEFAULT_TJM/WORK_HOURS_PER_DAY).toFixed(1)}€/H</div>
    </div>
    <div style={{display:"flex",gap:7,alignItems:"center"}}>
      <button className="tab-btn" onClick={exportData} style={{fontSize:10,padding:"4px 10px",color:"#4CAF7D",borderColor:"#4CAF7D33"}}>↓ Export</button>
      <label className="tab-btn" style={{fontSize:10,padding:"4px 10px",color:"#3A8FE8",borderColor:"#3A8FE833",cursor:"pointer"}}>
        ↑ Import<input type="file" accept=".json" onChange={importData} style={{display:"none"}}/>
      </label>
      <div style={{width:1,height:16,background:"#2A2A2A"}}/>
      <button className={`tab-btn ${view==="track"?"on":""}`} onClick={()=>setView("track")}>Saisie</button>
      <button className={`tab-btn ${view==="summary"?"on":""}`} onClick={()=>setView("summary")}>Récap</button>
    </div>
  </div>

  <div style={{display:"flex",height:"calc(100vh - 53px)"}}>

    {/* SIDEBAR */}
    <div style={{width:230,borderRight:"1px solid #181818",display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{padding:"12px 10px 4px",fontSize:9,color:"#3A3A3A",letterSpacing:".18em"}}>CLIENTS & PROJETS</div>

      {clientNames.map(cname => {
        const {total} = getClientTotals(cname);
        const tjm = getClientTJM(cname);
        const isOpen = expandedClient === cname;
        const clientProjs = projectNames.filter(p => data.projects[p].client === cname);
        return (
          <div key={cname}>
            <div className="client-hdr" onClick={()=>setExpandedClient(isOpen?null:cname)}>
              <span style={{color:"#555",fontSize:9}}>{isOpen?"▼":"▶"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cname}</div>
                <div style={{fontSize:9,color:"#444"}}>{fmtMins(total)} · {toDays(total)}j · {toEuros(total,tjm)}€</div>
              </div>
              <span style={{fontSize:9,color:"#555"}}>{tjm}€</span>
            </div>
            {isOpen && (
              <div>
                <div style={{padding:"4px 10px 6px 22px",display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:9,color:"#444"}}>TJM</span>
                  <input type="number" defaultValue={tjm} onBlur={e=>updateClientTJM(cname,e.target.value)} style={{width:60,padding:"3px 6px",fontSize:11}}/>
                  <span style={{fontSize:9,color:"#333"}}>€HT</span>
                  <button className="btn-d" onClick={()=>deleteClient(cname)} style={{marginLeft:"auto"}}>✕</button>
                </div>
                {clientProjs.map(pname => {
                  const ptotal = data.projects[pname].sessions.reduce((a,s)=>a+s.duration,0);
                  const pci = projectNames.indexOf(pname) % COLORS.length;
                  return (
                    <div key={pname} className={`proj-row ${selectedProject===pname?"on":""}`} onClick={()=>{setSelectedProject(pname);if(!isRunning)setTimerProject(pname);}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:COLORS[pci],flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pname}</div>
                        {ptotal>0&&<div style={{fontSize:9,color:"#444"}}>{fmtMins(ptotal)} · {toDays(ptotal)}j · {toEuros(ptotal,tjm)}€</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {unattachedProjects.length > 0 && (
        <div>
          <div style={{padding:"8px 10px 2px",fontSize:9,color:"#2A2A2A",letterSpacing:".14em"}}>SANS CLIENT</div>
          {unattachedProjects.map(pname => {
            const ptotal = data.projects[pname].sessions.reduce((a,s)=>a+s.duration,0);
            const pci = projectNames.indexOf(pname) % COLORS.length;
            return (
              <div key={pname} className={`proj-row ${selectedProject===pname?"on":""}`} onClick={()=>{setSelectedProject(pname);if(!isRunning)setTimerProject(pname);}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:COLORS[pci],flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pname}</div>
                  {ptotal>0&&<div style={{fontSize:9,color:"#444"}}>{fmtMins(ptotal)} · {toDays(ptotal)}j · {toEuros(ptotal,DEFAULT_TJM)}€</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{marginTop:"auto",borderTop:"1px solid #181818",padding:"10px"}}>
        {!showNewClient && !showNewProject && (
          <div style={{display:"flex",gap:6}}>
            <button className="btn-g" style={{flex:1}} onClick={()=>{setShowNewClient(true);setShowNewProject(false);}}>+ Client</button>
            <button className="btn-g" style={{flex:1}} onClick={()=>{setShowNewProject(true);setShowNewClient(false);}}>+ Projet</button>
          </div>
        )}
        {showNewClient && (
          <div>
            <div style={{fontSize:9,color:"#444",letterSpacing:".14em",marginBottom:5}}>NOUVEAU CLIENT</div>
            <input value={newClientName} onChange={e=>setNewClientName(e.target.value)} placeholder="Nom client" style={{width:"100%",marginBottom:5}} onKeyDown={e=>e.key==="Enter"&&createClient()}/>
            <div style={{display:"flex",gap:5,marginBottom:6}}>
              <input type="number" value={newClientTJM} onChange={e=>setNewClientTJM(e.target.value)} placeholder={`TJM (${DEFAULT_TJM})`} style={{flex:1}}/>
              <span style={{fontSize:9,color:"#444",alignSelf:"center"}}>€</span>
            </div>
            <div style={{display:"flex",gap:5}}>
              <button className="btn-p" style={{flex:1}} onClick={createClient}>Créer</button>
              <button className="btn-g" onClick={()=>setShowNewClient(false)}>Annuler</button>
            </div>
          </div>
        )}
        {showNewProject && (
          <div>
            <div style={{fontSize:9,color:"#444",letterSpacing:".14em",marginBottom:5}}>NOUVEAU PROJET</div>
            <input value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} placeholder="Nom projet" style={{width:"100%",marginBottom:5}} onKeyDown={e=>e.key==="Enter"&&createProject()}/>
            <select value={newProjectClient} onChange={e=>setNewProjectClient(e.target.value)} style={{...dropSt,width:"100%",marginBottom:6,paddingRight:28}}>
              <option value="">— Sans client —</option>
              {clientNames.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{display:"flex",gap:5}}>
              <button className="btn-p" style={{flex:1}} onClick={createProject}>Créer</button>
              <button className="btn-g" onClick={()=>setShowNewProject(false)}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* MAIN */}
    <div style={{flex:1,overflowY:"auto"}}>

      {view === "track" && (
        <div style={{padding:"18px 22px",maxWidth:640}}>

          {/* TIMER CARD */}
          <div style={{background:"#0D0D0D",border:`1px solid ${isRunning?timerAccent+"44":"#1E1E1E"}`,borderRadius:10,padding:"18px 20px",marginBottom:18,display:"flex",flexDirection:"column",alignItems:"center",gap:14,position:"relative",overflow:"hidden",transition:"border-color .4s"}}>
            {isRunning&&<div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 40%,${timerAccent}0A 0%,transparent 65%)`,pointerEvents:"none"}}/>}

            <div style={{width:"100%",maxWidth:300}}>
              <div style={{fontSize:8,color:"#3A3A3A",letterSpacing:".18em",marginBottom:5,textAlign:"center"}}>PROJET</div>
              <select value={timerProject||""} onChange={e=>{if(!isRunning){setTimerProject(e.target.value);setSelectedProject(e.target.value);}}} disabled={isRunning}
                style={{...dropSt,width:"100%",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,padding:"8px 28px 8px 12px",border:`1px solid ${timerProject?timerAccent+"55":"#2A2A2A"}`,borderRadius:5,cursor:isRunning?"not-allowed":"pointer",opacity:isRunning?.65:1}}>
                <option value="" disabled>— Sélectionner un projet —</option>
                {clientNames.map(c=>(<optgroup key={c} label={c}>{projectNames.filter(p=>data.projects[p].client===c).map(p=><option key={p} value={p}>{p}</option>)}</optgroup>))}
                {unattachedProjects.length>0&&<optgroup label="Sans client">{unattachedProjects.map(p=><option key={p} value={p}>{p}</option>)}</optgroup>}
              </select>
              {projectNames.length===0&&<div style={{textAlign:"center",fontSize:10,color:"#444",marginTop:4}}>← Crée d'abord un projet</div>}
            </div>

            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:42,color:isRunning?timerAccent:"#252525",letterSpacing:".06em",lineHeight:1,transition:"color .4s",textShadow:isRunning?`0 0 30px ${timerAccent}35`:"none"}}>
                {fmtSecs(elapsed)}
              </div>
              <div style={{marginTop:5,fontSize:15,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,color:isRunning?"#4CAF7D":"#222",transition:"color .4s",animation:isRunning?"blink 2s ease-in-out infinite":"none"}}>
                {isRunning?`+ ${((elapsed/3600)*(getProjectTJM(timerProject)/WORK_HOURS_PER_DAY)).toFixed(2)} €HT`:"0.00 €HT"}
              </div>
            </div>

            <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {isRunning&&<>
                <div style={{position:"absolute",width:100,height:100,borderRadius:"50%",border:`1.5px solid ${timerAccent}`,animation:"pulse 2s ease-in-out infinite",pointerEvents:"none"}}/>
                <div style={{position:"absolute",width:116,height:116,borderRadius:"50%",border:`1px solid ${timerAccent}44`,animation:"pulse 2s ease-in-out infinite .6s",pointerEvents:"none"}}/>
              </>}
              <button onClick={toggleTimer} disabled={!timerProject&&!isRunning}
                style={{width:80,height:80,borderRadius:"50%",background:isRunning?`radial-gradient(circle at 40% 35%,#2A1010,#150808)`:timerProject?`radial-gradient(circle at 40% 35%,${timerAccent}EE,${timerAccent}99)`:`radial-gradient(circle at 40% 35%,#1A1A1A,#111)`,border:`2.5px solid ${isRunning?"#E85050":timerProject?timerAccent:"#222"}`,color:isRunning?"#E85050":timerProject?"#000":"#333",fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,boxShadow:isRunning?`0 0 30px ${timerAccent}30,0 8px 20px rgba(0,0,0,.6)`:timerProject?`0 0 18px ${timerAccent}22,0 6px 16px rgba(0,0,0,.5)`:`0 3px 10px rgba(0,0,0,.4)`,cursor:timerProject||isRunning?"pointer":"not-allowed",transform:isRunning?"scale(1.05)":"scale(1)",transition:"all .3s cubic-bezier(.34,1.56,.64,1)"}}
                onMouseEnter={e=>{if(timerProject||isRunning)e.currentTarget.style.transform="scale(1.09)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform=isRunning?"scale(1.05)":"scale(1)";}}>
                {isRunning?"⏹":"▶"}
              </button>
            </div>

            <div style={{fontSize:9,color:"#333",letterSpacing:".14em"}}>{isRunning?"CLIQUER POUR ARRÊTER & SAUVEGARDER":timerProject?"CLIQUER POUR DÉMARRER":"SÉLECTIONNE UN PROJET"}</div>
            {isRunning&&<input value={timerNote} onChange={e=>setTimerNote(e.target.value)} placeholder="Note (optionnel)…" style={{width:"100%",maxWidth:300,textAlign:"center",fontSize:11}}/>}
            {error&&<div style={{background:"#1A0808",border:"1px solid #3A1010",borderRadius:3,padding:"7px 12px",fontSize:11,color:"#FF7070",width:"100%",maxWidth:360,textAlign:"center"}}>{error}</div>}
            {success&&<div style={{background:"#081A08",border:"1px solid #103A10",borderRadius:3,padding:"7px 12px",fontSize:11,color:"#70D070",width:"100%",maxWidth:360,textAlign:"center"}}>{success}</div>}
          </div>

          {/* MANUAL ENTRY */}
          <div>
            <div style={{fontSize:8,color:"#2E2E2E",letterSpacing:".18em",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:1,background:"#181818"}}/>SAISIE MANUELLE<div style={{flex:1,height:1,background:"#181818"}}/>
            </div>
            <div style={{background:"#0D0D0D",border:"1px solid #181818",borderRadius:7,padding:"14px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div>
                  <label style={{fontSize:8,color:"#444",letterSpacing:".14em",display:"block",marginBottom:4}}>PROJET</label>
                  <select value={manualProject||selectedProject||""} onChange={e=>{setManualProject(e.target.value);setSelectedProject(e.target.value);}} style={{...dropSt,width:"100%",paddingRight:28}}>
                    <option value="" disabled>— Projet —</option>
                    {clientNames.map(c=>(<optgroup key={c} label={c}>{projectNames.filter(p=>data.projects[p].client===c).map(p=><option key={p} value={p}>{p}</option>)}</optgroup>))}
                    {unattachedProjects.length>0&&<optgroup label="Sans client">{unattachedProjects.map(p=><option key={p} value={p}>{p}</option>)}</optgroup>}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:8,color:"#444",letterSpacing:".14em",display:"block",marginBottom:4}}>DATE</label>
                  <input type="date" value={manualDate} onChange={e=>setManualDate(e.target.value)} style={{width:"100%"}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:5,marginBottom:8}}>
                <button className={`mode-btn ${manualMode==="range"?"on":""}`} onClick={()=>setManualMode("range")}>Créneau horaire</button>
                <button className={`mode-btn ${manualMode==="duration"?"on":""}`} onClick={()=>setManualMode("duration")}>Durée directe</button>
              </div>
              {manualMode==="range"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><label style={{fontSize:8,color:"#444",letterSpacing:".14em",display:"block",marginBottom:4}}>DÉBUT</label><input value={startInput} onChange={e=>setStartInput(e.target.value)} placeholder="9h30" style={{width:"100%"}}/></div>
                  <div><label style={{fontSize:8,color:"#444",letterSpacing:".14em",display:"block",marginBottom:4}}>FIN</label><input value={endInput} onChange={e=>setEndInput(e.target.value)} placeholder="12h00" style={{width:"100%"}}/></div>
                </div>
              )}
              {manualMode==="duration"&&(
                <div style={{marginBottom:8}}>
                  <label style={{fontSize:8,color:"#444",letterSpacing:".14em",display:"block",marginBottom:4}}>DURÉE</label>
                  <input value={durInput} onChange={e=>setDurInput(e.target.value)} placeholder="ex: 1h30 ou 45min ou 2h" style={{width:"100%"}}/>
                </div>
              )}
              <div style={{marginBottom:10}}>
                <label style={{fontSize:8,color:"#444",letterSpacing:".14em",display:"block",marginBottom:4}}>NOTE</label>
                <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Ce que j'ai fait…" style={{width:"100%"}}/>
              </div>
              <button className="btn-p" onClick={addManualSession} style={{width:"100%",padding:"9px"}}>Ajouter</button>
            </div>
          </div>

          {selectedProject && data.projects[selectedProject]?.sessions.length > 0 && (
            <div style={{marginTop:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:8,color:"#3A3A3A",letterSpacing:".14em"}}>SESSIONS — <span style={{color:COLORS[projectNames.indexOf(selectedProject)%COLORS.length]}}>{selectedProject}</span></div>
                <button className="btn-d" onClick={()=>deleteProject(selectedProject)}>Supprimer projet</button>
              </div>
              <div style={{background:"#070707",borderRadius:5,border:"1px solid #141414",overflow:"hidden"}}>
                <div className="srow" style={{borderBottom:"1px solid #181818"}}>
                  {["Date","Début","Fin","Durée","Valeur","Note",""].map((h,i)=>(<div key={i} style={{fontSize:8,color:"#3A3A3A",letterSpacing:".1em"}}>{h}</div>))}
                </div>
                {[...data.projects[selectedProject].sessions].reverse().map((s,ri)=>{
                  const idx=data.projects[selectedProject].sessions.length-1-ri;
                  const tjm=getProjectTJM(selectedProject);
                  return (
                    <div key={idx} className="srow">
                      <span style={{color:"#555",fontSize:10}}>{fmtDate(s.date)}</span>
                      <span style={{color:"#888"}}>{s.start||"—"}</span>
                      <span style={{color:"#888"}}>{s.end||"—"}</span>
                      <span style={{color:"#E8C13A",fontWeight:500}}>{fmtMins(s.duration)}</span>
                      <span style={{color:"#4CAF7D",fontSize:10}}>{toEuros(s.duration,tjm)}€</span>
                      <span style={{color:"#444",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.note||"—"}</span>
                      <button className="btn-d" style={{padding:"1px 5px",fontSize:9}} onClick={()=>deleteSession(selectedProject,idx)}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "summary" && (
        <div style={{padding:"18px 22px"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:800,marginBottom:16}}>RÉCAPITULATIF</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>

            <div>
              <div style={{fontSize:8,color:"#333",letterSpacing:".18em",marginBottom:8}}>PROJET</div>
              <select value={summaryProject||""} onChange={e=>setSummaryProject(e.target.value)}
                style={{...dropSt,width:"100%",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,padding:"8px 28px 8px 12px",marginBottom:14}}>
                <option value="">— Choisir un projet —</option>
                {clientNames.map(c=>(<optgroup key={c} label={c}>{projectNames.filter(p=>data.projects[p].client===c).map(p=><option key={p} value={p}>{p}</option>)}</optgroup>))}
                {unattachedProjects.length>0&&<optgroup label="Sans client">{unattachedProjects.map(p=><option key={p} value={p}>{p}</option>)}</optgroup>}
              </select>

              {summaryProject && (() => {
                const sp = getProjectSummary(summaryProject); if (!sp) return <div style={{color:"#444",fontSize:11}}>Aucune session.</div>;
                const accent=COLORS[projectNames.indexOf(summaryProject)%COLORS.length];
                const tjm=getProjectTJM(summaryProject);
                const {totalMins,avgPerDay,totalSessions,chartData,days,byDay}=sp;
                const maxDM=Math.max(...Object.values(byDay).map(v=>v.total));
                return (
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                      {[{l:"TOTAL",v:fmtMins(totalMins),c:accent},{l:"JOURS FACT.",v:`${toDays(totalMins)}j`,c:accent},{l:"VALEUR HT",v:`${toEuros(totalMins,tjm)}€`,c:"#4CAF7D"},{l:"SESSIONS",v:totalSessions,c:accent},{l:"MOY/JOUR",v:fmtMins(avgPerDay),c:accent},{l:"TJM",v:`${tjm}€`,c:"#888"}].map(({l,v,c})=>(
                        <div key={l} style={{background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:4,padding:"10px"}}>
                          <div style={{fontSize:8,color:"#3A3A3A",letterSpacing:".16em",marginBottom:5}}>{l}</div>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:800,color:c}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:4,padding:"12px 10px 8px",marginBottom:12}}>
                      <div style={{fontSize:8,color:"#333",letterSpacing:".16em",marginBottom:10}}>TEMPS PAR JOUR</div>
                      <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={chartData} barSize={18}>
                          <XAxis dataKey="name" tick={{fill:"#3A3A3A",fontSize:9}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:"#3A3A3A",fontSize:9}} axisLine={false} tickLine={false}/>
                          <Tooltip content={({active,payload})=>active&&payload?.length?(<div style={{background:"#131313",border:"1px solid #222",borderRadius:3,padding:"8px 12px",fontSize:10}}><div style={{color:"#555",marginBottom:3}}>{payload[0]?.payload?.name}</div><div style={{color:accent}}>{fmtMins(payload[0].value)}</div><div style={{color:"#4CAF7D"}}>{toEuros(payload[0].value,tjm)}€HT</div></div>):null}/>
                          <Bar dataKey="minutes" radius={[2,2,0,0]}>{chartData.map((_,i)=><Cell key={i} fill={accent} opacity={.55+.45*(i/Math.max(chartData.length-1,1))}/>)}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{background:"#070707",border:"1px solid #141414",borderRadius:4,overflow:"hidden"}}>
                      <div style={{padding:"7px 10px",borderBottom:"1px solid #141414",display:"grid",gridTemplateColumns:"1fr 70px 70px 50px",gap:5}}>
                        {["Jour","Durée","Valeur","Sessions"].map(h=><div key={h} style={{fontSize:8,color:"#333",letterSpacing:".1em"}}>{h}</div>)}
                      </div>
                      {days.sort((a,b)=>b.localeCompare(a)).map(day=>(
                        <div key={day} style={{padding:"9px 10px",borderBottom:"1px solid #0E0E0E",display:"grid",gridTemplateColumns:"1fr 70px 70px 50px",gap:5,alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:11}}>{fmtDate(day)}</div>
                            <div style={{height:2,background:"#181818",borderRadius:1,marginTop:3}}><div style={{height:"100%",width:`${(byDay[day].total/maxDM)*100}%`,background:accent,borderRadius:1}}/></div>
                          </div>
                          <div style={{color:accent,fontSize:11}}>{fmtMins(byDay[day].total)}</div>
                          <div style={{color:"#4CAF7D",fontSize:11}}>{toEuros(byDay[day].total,tjm)}€</div>
                          <div style={{color:"#3A3A3A",fontSize:10}}>{byDay[day].count}×</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {clientNames.length > 0 && (
                <div style={{marginTop:18}}>
                  <div style={{fontSize:8,color:"#333",letterSpacing:".18em",marginBottom:10}}>TOTAUX PAR CLIENT</div>
                  {clientNames.map(cname=>{
                    const {total,details}=getClientTotals(cname); const tjm=getClientTJM(cname);
                    return (
                      <div key={cname} style={{background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:4,padding:"10px",marginBottom:8}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,marginBottom:4}}>{cname}</div>
                        <div style={{display:"flex",gap:12,marginBottom:6,flexWrap:"wrap"}}>
                          <span style={{color:"#E8C13A",fontSize:11}}>{fmtMins(total)}</span>
                          <span style={{color:"#888",fontSize:11}}>{toDays(total)}j</span>
                          <span style={{color:"#4CAF7D",fontSize:11}}>{toEuros(total,tjm)}€HT</span>
                        </div>
                        {details.map(({name,mins})=>mins>0&&(<div key={name} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",borderTop:"1px solid #161616",fontSize:10}}><span style={{color:"#555"}}>{name}</span><span style={{color:"#444"}}>{fmtMins(mins)} · {toEuros(mins,tjm)}€</span></div>))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CALENDAR */}
            <div>
              <div style={{fontSize:8,color:"#333",letterSpacing:".18em",marginBottom:8}}>CALENDRIER</div>
              <select value={calFilter} onChange={e=>setCalFilter(e.target.value)} style={{...dropSt,width:"100%",marginBottom:10,paddingRight:28,fontSize:11}}>
                <option value="all">Tous les projets</option>
                {clientNames.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <button className="btn-g" style={{padding:"3px 10px"}} onClick={()=>setCalMonth(cm=>{let m=cm.m-1,y=cm.y;if(m<0){m=11;y--;}return{y,m};})}>‹</button>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,textTransform:"uppercase"}}>{calMonthName}</div>
                <button className="btn-g" style={{padding:"3px 10px"}} onClick={()=>setCalMonth(cm=>{let m=cm.m+1,y=cm.y;if(m>11){m=0;y++;}return{y,m};})}>›</button>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                {[["Aucune","#111","transparent"],["< 2h","#1a4a2a","#4CAF7D"],["2–4h","#4a3a10","#E8C13A"],["4–8h","#4a1a10","#E86C3A"],["8h+","#2a1040","#9B59B6"]].map(([l,bg,dot])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:3}}>
                    <div style={{width:10,height:10,borderRadius:2,background:bg,border:`1px solid ${dot==="transparent"?"#222":dot+"44"}`}}/>
                    <span style={{fontSize:9,color:"#444"}}>{l}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
                {["Lu","Ma","Me","Je","Ve","Sa","Di"].map(d=>(<div key={d} style={{textAlign:"center",fontSize:8,color:"#333",padding:"2px 0"}}>{d}</div>))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                {calDays.map((d,i)=>{
                  if(!d) return <div key={`e${i}`}/>;
                  const dateStr=`${calMonth.y}-${String(calMonth.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  const mins=calData[dateStr]||0;
                  const isToday=dateStr===todayStr();
                  return (
                    <div key={d} className="cal-cell" style={{background:calColor(mins),border:`1px solid ${isToday?"#E86C3A55":calDotColor(mins)==="transparent"?"#181818":calDotColor(mins)+"22"}`}}>
                      <span style={{fontSize:9,color:mins>0?"#E8E4DF88":"#333",fontWeight:isToday?700:400}}>{d}</span>
                      {mins>0&&<span style={{fontSize:8,color:calDotColor(mins),marginTop:1}}>{fmtMins(mins)}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  </div>
</div>
```

);
}
