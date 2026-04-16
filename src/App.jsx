import { useState, useEffect } from "react";

// ============================================================
//  شركة غرغور التجارية — نظام إدارة الموارد البشرية
//  Gharghor Trading Company — HR Management System
//  v1.0 | Built with React + Vite | Data: localStorage
// ============================================================

const LEAVE_TYPES = [
  { id: "annual",      ar: "إجازة سنوية",          en: "Annual Paid Vacation",       icon: "🌴", affectsBalance: true  },
  { id: "unpaid",      ar: "إجازة بدون راتب",       en: "Personal Unpaid Vacation",   icon: "📋", affectsBalance: false },
  { id: "medical",     ar: "إجازة مرضية",           en: "Medical Vacation",           icon: "🏥", affectsBalance: false },
  { id: "medical50",   ar: "إجازة مرضية 50%",       en: "Medical 50% Vacation",       icon: "💊", affectsBalance: false },
  { id: "bereavement", ar: "إجازة حزن (وفاة)",       en: "Bereavement Vacation",       icon: "🕊️", affectsBalance: false },
  { id: "maternity",   ar: "إجازة أمومة",            en: "Maternity Vacation",         icon: "👶", affectsBalance: false },
  { id: "attendDayOff",ar: "بدل يوم",               en: "Attend a Day Off",           icon: "📆", affectsBalance: false },
];

const DEP_TYPES = [
  { id: "sick", ar: "مغادرة مرضية", en: "Sick Leave", icon: "🤒" },
  { id: "day",  ar: "مغادرة ساعية", en: "Day Leave",  icon: "🕐" },
];

const DAYS     = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const AR_DAYS  = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const EN_DAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_MAP  = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const INIT_EMP = [
  { id:"EMP001", nameAr:"أحمد محمد الشرفا",     nameEn:"Ahmed Mohammad Al-Sharfa",  department:"المحاسبة",       departmentEn:"Accounting",      position:"محاسب أول",              positionEn:"Senior Accountant", salary:2500, startDate:"2019-03-15", phone:"0599123456", email:"ahmed@gharghor.com",   nationalId:"900123456", address:"نابلس - المنطقة الشرقية", weeklyOff:["friday","saturday"], jobDescription:"إدارة الحسابات والمعاملات المالية للشركة، إعداد التقارير المالية الشهرية والسنوية، مراجعة الفواتير والمدفوعات.",   status:"active", gender:"male",   annualLeaveBalance:12.5 },
  { id:"EMP002", nameAr:"رنا خالد حمدان",        nameEn:"Rana Khaled Hamdan",        department:"الموارد البشرية", departmentEn:"Human Resources", position:"أخصائية موارد بشرية",   positionEn:"HR Specialist",     salary:2200, startDate:"2021-06-01", phone:"0598765432", email:"rana@gharghor.com",    nationalId:"910234567", address:"نابلس - رفيديا",           weeklyOff:["friday","saturday"], jobDescription:"إدارة ملفات الموظفين، متابعة الحضور والإجازات، التوظيف والاستقطاب، إعداد التقارير الشهرية.",                    status:"active", gender:"female", annualLeaveBalance:8.75  },
  { id:"EMP003", nameAr:"محمود سامي عبد الهادي", nameEn:"Mahmoud Sami Abdul-Hadi",  department:"المبيعات",        departmentEn:"Sales",           position:"مدير مبيعات",            positionEn:"Sales Manager",     salary:3500, startDate:"2016-01-10", phone:"0597654321", email:"mahmoud@gharghor.com", nationalId:"860345678", address:"نابلس - بلاطة",            weeklyOff:["friday","saturday"], jobDescription:"إدارة فريق المبيعات، تطوير استراتيجيات البيع، متابعة تحقيق الأهداف البيعية الشهرية والسنوية.",               status:"active", gender:"male",   annualLeaveBalance:21.0  },
];

// ── utils ──────────────────────────────────────────────────────────
function svcYrs(d)      { return (Date.now() - new Date(d)) / (365.25 * 86400000); }
function accrual(d)     { return svcYrs(d) >= 5 ? 1.75 : 1.17; }
function newId(p)       { return p + Date.now().toString().slice(-6) + Math.floor(Math.random()*99); }
function fmtDate(s, lang) {
  if (!s) return "-";
  try { return new Date(s).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US"); } catch { return s; }
}
function workDays(start, end, offs = [], hols = []) {
  let c = 0;
  const oNums = (offs || []).map(d => DAY_MAP[d]);
  let cur = new Date(start); const ed = new Date(end);
  while (cur <= ed) {
    const ds = cur.toISOString().slice(0,10);
    if (!oNums.includes(cur.getDay()) && !hols.includes(ds)) c++;
    cur.setDate(cur.getDate() + 1);
  }
  return c;
}
function hrsDiff(t1, t2) {
  if (!t1 || !t2) return 0;
  const [h1,m1] = t1.split(":").map(Number), [h2,m2] = t2.split(":").map(Number);
  return Math.max(0, ((h2*60+m2)-(h1*60+m1))/60);
}
function dlCSV(hdrs, rows, name) {
  const c = [hdrs.join(","), ...rows.map(r => r.map(x => JSON.stringify(x ?? "")).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent("\uFEFF" + c);
  a.download = name + ".csv";
  a.click();
}

// ── localStorage storage ───────────────────────────────────────────
const PREFIX = "gharghor_hr_";
function lsGet(key)      { try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : null; } catch { return null; } }
function lsSet(key, val) { try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch {} }

// ── design tokens ──────────────────────────────────────────────────
const NAV  = "#0f1b35";
const GOLD = "#c9a227";

const st = {
  card: { background:"#fff", borderRadius:12, boxShadow:"0 2px 12px rgba(0,0,0,0.07)", padding:20 },
  th:   { padding:"11px 12px", fontWeight:600, fontSize:12, textAlign:"inherit", whiteSpace:"nowrap" },
  td:   { padding:"9px 12px", fontSize:12, verticalAlign:"middle" },
  inp:  { width:"100%", padding:"8px 12px", borderRadius:8, border:"1.5px solid #e0e0e0", fontFamily:"inherit", fontSize:13, outline:"none", boxSizing:"border-box", background:"#fff" },
  lbl:  { display:"block", fontSize:12, fontWeight:600, color:"#555", marginBottom:5 },
};

// ── UI atoms ───────────────────────────────────────────────────────
function Card({ children, style }) { return <div style={{ ...st.card, ...style }}>{children}</div>; }

function Btn({ children, onClick, v="primary", sz="md", style, disabled, title }) {
  const vs = {
    primary:  { background:`linear-gradient(135deg,${NAV},#1a3a6e)`,       color:"#fff" },
    secondary:{ background:"#f0f4f8",                                        color:"#444" },
    success:  { background:"linear-gradient(135deg,#059669,#10b981)",        color:"#fff" },
    danger:   { background:"linear-gradient(135deg,#dc2626,#ef4444)",        color:"#fff" },
    gold:     { background:`linear-gradient(135deg,${GOLD},#e8b84b)`,        color:"#fff" },
    outline:  { background:"transparent", border:`1.5px solid ${NAV}`,       color:NAV   },
    warn:     { background:"linear-gradient(135deg,#d97706,#f59e0b)",        color:"#fff" },
  };
  const ss = { sm:{padding:"4px 10px",fontSize:11}, md:{padding:"8px 16px",fontSize:13}, lg:{padding:"11px 24px",fontSize:14} };
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ border:"none", borderRadius:8, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", fontWeight:600, opacity:disabled?0.5:1, transition:"opacity .15s", ...vs[v], ...ss[sz], ...style }}>
      {children}
    </button>
  );
}

function Modal({ open, close, title, children, width=600 }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target===e.currentTarget && close()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:width, maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", background:`linear-gradient(135deg,${NAV},#1a3a6e)`, color:"#fff", borderRadius:"16px 16px 0 0", flexShrink:0 }}>
          <strong style={{ fontSize:15 }}>{title}</strong>
          <button onClick={close} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:6, color:"#fff", cursor:"pointer", padding:"3px 9px", fontSize:16, fontFamily:"inherit" }}>✕</button>
        </div>
        <div style={{ overflowY:"auto", padding:20, flex:1 }}>{children}</div>
      </div>
    </div>
  );
}

function FF({ label, children }) { return <div style={{ marginBottom:14 }}><label style={st.lbl}>{label}</label>{children}</div>; }
function Inp({ value, onChange, type="text", placeholder="", style, min, max, step }) { return <input type={type} value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} max={max} step={step} style={{ ...st.inp, ...style }} />; }
function Sel({ value, onChange, children, style }) { return <select value={value??""} onChange={e=>onChange(e.target.value)} style={{ ...st.inp, ...style }}>{children}</select>; }
function Txt({ value, onChange, rows=3, placeholder }) { return <textarea value={value??""} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder} style={{ ...st.inp, resize:"vertical" }} />; }

function Badge({ children, color="blue" }) {
  const C = { blue:{bg:"#dbeafe",t:"#1d4ed8"}, green:{bg:"#dcfce7",t:"#166534"}, yellow:{bg:"#fef9c3",t:"#854d0e"}, red:{bg:"#fee2e2",t:"#991b1b"}, gray:{bg:"#f3f4f6",t:"#374151"}, gold:{bg:"#fef3c7",t:"#92400e"} };
  const c = C[color]||C.blue;
  return <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:700, background:c.bg, color:c.t, whiteSpace:"nowrap" }}>{children}</span>;
}

function THead({ cols }) { return <thead><tr style={{ background:NAV, color:"#fff" }}>{cols.map((c,i)=><th key={i} style={st.th}>{c}</th>)}</tr></thead>; }
function TRow({ cells, i=0, actions }) {
  return <tr style={{ borderBottom:"1px solid #f0f0f0", background:i%2?"#fafafa":"#fff" }}>
    {cells.map((c,j)=><td key={j} style={st.td}>{c}</td>)}
    {actions && <td style={st.td}><div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>{actions}</div></td>}
  </tr>;
}
function Empty({ msg, cols }) { return <tr><td colSpan={cols} style={{ textAlign:"center", padding:32, color:"#aaa", fontSize:13 }}>{msg}</td></tr>; }
function Grid({ cols=2, children, gap=14 }) { return <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap }}>{children}</div>; }
function STitle({ title, action }) { return <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}><h2 style={{ margin:0, fontSize:16, fontWeight:700, color:NAV }}>{title}</h2>{action}</div>; }
function Divider() { return <div style={{ borderTop:"1px solid #e5e7eb", margin:"14px 0" }} />; }

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ lang, employees, leaves, departures }) {
  const a = lang==="ar";
  const now = new Date(); const tm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const stats = [
    { l:a?"إجمالي الموظفين":"Total Employees",    v:employees.length,                                         icon:"👥", c:"#1a3a6e" },
    { l:a?"موظفون نشطون":"Active Employees",       v:employees.filter(e=>e.status==="active").length,          icon:"✅", c:"#059669" },
    { l:a?"إجازات معلقة":"Pending Leaves",         v:leaves.filter(l=>l.status==="pending").length,            icon:"⏳", c:"#d97706" },
    { l:a?"مغادرات هذا الشهر":"Departures / Month",v:departures.filter(d=>d.date?.startsWith(tm)).length,     icon:"🚪", c:"#dc2626" },
  ];
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
        {stats.map((s,i)=>(
          <Card key={i}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div><div style={{ fontSize:32, fontWeight:800, color:s.c, lineHeight:1 }}>{s.v}</div><div style={{ fontSize:12, color:"#666", marginTop:6 }}>{s.l}</div></div>
              <span style={{ fontSize:28 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:16 }}>
        <Card>
          <h3 style={{ margin:"0 0 14px", fontSize:14, color:NAV }}>{a?"آخر طلبات الإجازات":"Recent Leave Requests"}</h3>
          {leaves.length===0
            ? <p style={{ color:"#bbb", textAlign:"center", padding:20, fontSize:13 }}>{a?"لا توجد طلبات بعد":"No requests yet"}</p>
            : [...leaves].reverse().slice(0,7).map((l,i)=>{
                const emp=employees.find(e=>e.id===l.employeeId);
                const lt=LEAVE_TYPES.find(x=>x.id===l.type);
                return <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f5f5f5" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#222" }}>{emp?(a?emp.nameAr:emp.nameEn):"-"}</div>
                    <div style={{ fontSize:11, color:"#888" }}>{lt?(a?lt.ar:lt.en):l.type} · {l.days||0} {a?"يوم":"d"}</div>
                  </div>
                  <Badge color={l.status==="approved"?"green":l.status==="rejected"?"red":"yellow"}>{a?(l.status==="approved"?"معتمد":l.status==="rejected"?"مرفوض":"معلق"):l.status}</Badge>
                </div>;
              })}
        </Card>
        <Card>
          <h3 style={{ margin:"0 0 14px", fontSize:14, color:NAV }}>{a?"أرصدة الإجازة السنوية":"Annual Leave Balances"}</h3>
          {employees.slice(0,8).map((e,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f5f5f5" }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#333" }}>{a?e.nameAr:e.nameEn}</span>
              <span style={{ background:"#fef3c7", color:"#92400e", padding:"2px 10px", borderRadius:12, fontSize:12, fontWeight:700 }}>{(e.annualLeaveBalance||0).toFixed(2)} {a?"يوم":"d"}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── EMPLOYEE FORM ─────────────────────────────────────────────────
function EmpForm({ form, setForm, lang, onSave, onCancel }) {
  const a = lang==="ar";
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const tog = d => { const o=form.weeklyOff||[]; setForm(f=>({...f,weeklyOff:o.includes(d)?o.filter(x=>x!==d):[...o,d]})); };
  return (
    <div>
      <Grid cols={2}>
        <FF label={a?"الاسم بالعربي *":"Name (Arabic) *"}><Inp value={form.nameAr} onChange={v=>set("nameAr",v)} /></FF>
        <FF label={a?"الاسم بالإنجليزي":"Name (English)"}><Inp value={form.nameEn} onChange={v=>set("nameEn",v)} /></FF>
        <FF label={a?"رقم الهوية":"National ID"}><Inp value={form.nationalId} onChange={v=>set("nationalId",v)} /></FF>
        <FF label={a?"الجنس":"Gender"}>
          <Sel value={form.gender} onChange={v=>set("gender",v)}>
            <option value="male">{a?"ذكر":"Male"}</option>
            <option value="female">{a?"أنثى":"Female"}</option>
          </Sel>
        </FF>
        <FF label={a?"القسم (عربي)":"Department (Ar)"}><Inp value={form.department}   onChange={v=>set("department",v)} /></FF>
        <FF label={a?"القسم (إنجليزي)":"Department (En)"}><Inp value={form.departmentEn} onChange={v=>set("departmentEn",v)} /></FF>
        <FF label={a?"المسمى الوظيفي (عربي)":"Position (Ar)"}><Inp value={form.position}   onChange={v=>set("position",v)} /></FF>
        <FF label={a?"المسمى الوظيفي (إنجليزي)":"Position (En)"}><Inp value={form.positionEn} onChange={v=>set("positionEn",v)} /></FF>
        <FF label={a?"الراتب الأساسي (₪)":"Base Salary (₪)"}><Inp type="number" value={form.salary}              onChange={v=>set("salary",v)} /></FF>
        <FF label={a?"تاريخ التعيين *":"Hire Date *"}><Inp type="date"   value={form.startDate}           onChange={v=>set("startDate",v)} /></FF>
        <FF label={a?"الهاتف":"Phone"}><Inp value={form.phone}  onChange={v=>set("phone",v)} /></FF>
        <FF label={a?"البريد الإلكتروني":"Email"}><Inp value={form.email}  onChange={v=>set("email",v)} /></FF>
        <FF label={a?"العنوان":"Address"}><Inp value={form.address} onChange={v=>set("address",v)} /></FF>
        <FF label={a?"رصيد الإجازة السنوية":"Annual Leave Balance"}><Inp type="number" step="0.01" value={form.annualLeaveBalance} onChange={v=>set("annualLeaveBalance",v)} /></FF>
        <FF label={a?"الحالة":"Status"}>
          <Sel value={form.status} onChange={v=>set("status",v)}>
            <option value="active">{a?"نشط":"Active"}</option>
            <option value="inactive">{a?"غير نشط":"Inactive"}</option>
          </Sel>
        </FF>
      </Grid>
      <FF label={a?"أيام العطلة الأسبوعية":"Weekly Off Days"}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {DAYS.map((d,i)=>(
            <button key={d} onClick={()=>tog(d)}
              style={{ padding:"6px 14px", borderRadius:20, border:"1.5px solid", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"inherit",
                background:(form.weeklyOff||[]).includes(d)?NAV:"#fff",
                borderColor:(form.weeklyOff||[]).includes(d)?NAV:"#e0e0e0",
                color:(form.weeklyOff||[]).includes(d)?"#fff":"#555" }}>
              {a?AR_DAYS[i]:EN_DAYS[i]}
            </button>
          ))}
        </div>
      </FF>
      <FF label={a?"الوصف الوظيفي":"Job Description"}><Txt value={form.jobDescription} onChange={v=>set("jobDescription",v)} rows={3} /></FF>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:16 }}>
        <Btn v="secondary" onClick={onCancel}>{a?"إلغاء":"Cancel"}</Btn>
        <Btn v="gold" onClick={onSave}>{a?"حفظ":"Save"}</Btn>
      </div>
    </div>
  );
}

// ── EMPLOYEES VIEW ────────────────────────────────────────────────
function EmployeesView({ lang, employees, updateEmployees }) {
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(false);
  const [editId, setEditId] = useState(null);
  const [profId, setProfId] = useState(null);
  const [form, setForm]     = useState({});
  const a = lang==="ar";

  const ef = () => ({ id:newId("EMP"), nameAr:"", nameEn:"", department:"", departmentEn:"", position:"", positionEn:"", salary:"", startDate:"", phone:"", email:"", nationalId:"", address:"", weeklyOff:["friday","saturday"], jobDescription:"", status:"active", gender:"male", annualLeaveBalance:0 });
  const filtered = employees.filter(e => e.nameAr?.includes(search) || e.nameEn?.toLowerCase().includes(search.toLowerCase()) || e.id?.includes(search) || (e.department||"").includes(search));

  function save() {
    if (!form.nameAr || !form.startDate) return alert(a?"يرجى ملء الاسم العربي وتاريخ التعيين":"Please fill Arabic name and hire date");
    const f = { ...form, salary:parseFloat(form.salary)||0, annualLeaveBalance:parseFloat(form.annualLeaveBalance)||0 };
    updateEmployees(editId ? employees.map(e=>e.id===editId?f:e) : [...employees,f]);
    setModal(false);
  }
  function del(id) { if (!confirm(a?"هل أنت متأكد من حذف هذا الموظف؟":"Confirm delete employee?")) return; updateEmployees(employees.filter(e=>e.id!==id)); }

  const pe = profId ? employees.find(e=>e.id===profId) : null;

  if (pe) {
    const y = svcYrs(pe.startDate).toFixed(1); const ac = accrual(pe.startDate);
    return (
      <div>
        <Btn v="outline" onClick={()=>setProfId(null)} sz="sm" style={{ marginBottom:16 }}>← {a?"رجوع":"Back"}</Btn>
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Card>
              <div style={{ textAlign:"center" }}>
                <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${NAV},#1a3a6e)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:28 }}>
                  {pe.gender==="female"?"👩":"👨"}
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:NAV }}>{a?pe.nameAr:pe.nameEn}</div>
                <div style={{ fontSize:12, color:"#888", marginTop:4 }}>{a?pe.position:pe.positionEn}</div>
                <div style={{ marginTop:8 }}><Badge color={pe.status==="active"?"green":"red"}>{a?(pe.status==="active"?"نشط":"غير نشط"):(pe.status==="active"?"Active":"Inactive")}</Badge></div>
              </div>
              <Divider/>
              {[
                [a?"رقم الموظف":"ID",         pe.id],
                [a?"القسم":"Department",       a?pe.department:pe.departmentEn],
                [a?"التعيين":"Hired",          fmtDate(pe.startDate,lang)],
                [a?"سنوات الخدمة":"Service",  y+" "+(a?"سنة":"yr")],
                [a?"الراتب":"Salary",          pe.salary+" ₪"],
                [a?"الهاتف":"Phone",           pe.phone],
                [a?"البريد":"Email",           pe.email],
                [a?"رقم الهوية":"National ID", pe.nationalId],
              ].map(([l,v],i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #f8f8f8" }}>
                  <span style={{ fontSize:11, color:"#888" }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:"#333" }}>{v||"-"}</span>
                </div>
              ))}
            </Card>
            <Btn v="gold" onClick={()=>{setForm({...pe});setEditId(pe.id);setModal(true);}}>{a?"تعديل البيانات":"Edit Data"}</Btn>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
              {[
                { l:a?"رصيد الإجازة السنوية":"Annual Leave Balance", v:(pe.annualLeaveBalance||0).toFixed(2)+" "+(a?"يوم":"d"), c:"#1a3a6e" },
                { l:a?"ترصيد شهري":"Monthly Accrual",                v:ac+" "+(a?"يوم/شهر":"d/mo"),                            c:"#059669" },
                { l:a?"فئة الترصيد":"Accrual Category",              v:svcYrs(pe.startDate)>=5?(a?"فوق 5 سنوات":"+5 Yrs"):(a?"تحت 5 سنوات":"<5 Yrs"), c:"#d97706" },
              ].map((s,i)=>(
                <Card key={i}><div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.v}</div><div style={{ fontSize:11, color:"#888", marginTop:4 }}>{s.l}</div></Card>
              ))}
            </div>
            <Card>
              <h3 style={{ margin:"0 0 12px", fontSize:14, color:NAV }}>{a?"أيام العطلة الأسبوعية":"Weekly Off Days"}</h3>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {DAYS.map((d,i)=>(
                  <span key={d} style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600,
                    background:(pe.weeklyOff||[]).includes(d)?NAV:"#f0f0f0",
                    color:(pe.weeklyOff||[]).includes(d)?"#fff":"#666" }}>
                    {a?AR_DAYS[i]:EN_DAYS[i]}
                  </span>
                ))}
              </div>
            </Card>
            <Card>
              <h3 style={{ margin:"0 0 10px", fontSize:14, color:NAV }}>{a?"الوصف الوظيفي":"Job Description"}</h3>
              <p style={{ margin:0, fontSize:13, color:"#555", lineHeight:1.8 }}>{pe.jobDescription||(a?"لم يتم إضافة وصف وظيفي":"No job description added")}</p>
            </Card>
            <Card>
              <h3 style={{ margin:"0 0 8px", fontSize:14, color:NAV }}>{a?"العنوان":"Address"}</h3>
              <p style={{ margin:0, fontSize:13, color:"#555" }}>{pe.address||"-"}</p>
            </Card>
          </div>
        </div>
        <Modal open={modal} close={()=>setModal(false)} title={a?"تعديل بيانات الموظف":"Edit Employee"} width={720}>
          <EmpForm form={form} setForm={setForm} lang={lang} onSave={save} onCancel={()=>setModal(false)} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <STitle title={a?"قائمة الموظفين":"Employees"} action={
        <div style={{ display:"flex", gap:8 }}>
          <Inp value={search} onChange={setSearch} placeholder={a?"🔍 بحث...":"🔍 Search..."} style={{ width:220 }} />
          <Btn v="gold" onClick={()=>{setForm(ef());setEditId(null);setModal(true);}}>+ {a?"إضافة موظف":"Add Employee"}</Btn>
        </div>
      } />
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <THead cols={[a?"الرقم":"ID",a?"الاسم":"Name",a?"القسم":"Dept",a?"المسمى الوظيفي":"Position",a?"الراتب":"Salary",a?"التعيين":"Hired",a?"رصيد الإجازة":"Leave Bal.",a?"الحالة":"Status",a?"إجراءات":"Actions"]} />
          <tbody>
            {filtered.length===0
              ? <Empty msg={a?"لا توجد موظفين":"No employees found"} cols={9}/>
              : filtered.map((e,i)=>(
                  <TRow key={e.id} i={i}
                    cells={[
                      <span style={{ color:"#888", fontSize:11 }}>{e.id}</span>,
                      <span style={{ fontWeight:700, color:NAV }}>{a?e.nameAr:e.nameEn}</span>,
                      <span>{a?e.department:e.departmentEn}</span>,
                      <span style={{ fontSize:11 }}>{a?e.position:e.positionEn}</span>,
                      <span style={{ fontWeight:600 }}>{e.salary} ₪</span>,
                      fmtDate(e.startDate,lang),
                      <span style={{ background:"#fef3c7", color:"#92400e", padding:"2px 8px", borderRadius:12, fontSize:12, fontWeight:700 }}>{(e.annualLeaveBalance||0).toFixed(2)}</span>,
                      <Badge color={e.status==="active"?"green":"red"}>{a?(e.status==="active"?"نشط":"غير نشط"):(e.status==="active"?"Active":"Inactive")}</Badge>,
                    ]}
                    actions={[
                      <Btn key="v" sz="sm" onClick={()=>setProfId(e.id)}>{a?"عرض":"View"}</Btn>,
                      <Btn key="e" sz="sm" v="secondary" onClick={()=>{setForm({...e});setEditId(e.id);setModal(true);}}>✏️</Btn>,
                      <Btn key="d" sz="sm" v="danger" onClick={()=>del(e.id)}>🗑️</Btn>,
                    ]}
                  />
                ))
            }
          </tbody>
        </table>
      </Card>
      <Modal open={modal} close={()=>setModal(false)} title={editId?(a?"تعديل بيانات الموظف":"Edit Employee"):(a?"إضافة موظف جديد":"Add New Employee")} width={720}>
        <EmpForm form={form} setForm={setForm} lang={lang} onSave={save} onCancel={()=>setModal(false)} />
      </Modal>
    </div>
  );
}

// ── LEAVES VIEW ───────────────────────────────────────────────────
function LeavesView({ lang, employees, leaves, updateLeaves, updateEmployees, holidays, isMonthClosed }) {
  const [fl, setFl] = useState({ empId:"", type:"", status:"" });
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({});
  const a = lang==="ar";

  const getHols = emp => (holidays||[]).filter(h=>h.applyToAll||((h.specificEmployees||[]).includes(emp.id))).map(h=>h.date);
  const calcD   = f => { const emp=employees.find(e=>e.id===f.employeeId); if(!emp||!f.startDate||!f.endDate) return 0; return workDays(f.startDate,f.endDate,emp.weeklyOff,getHols(emp)); };
  const filtered = leaves.filter(l=>(!fl.empId||l.employeeId===fl.empId)&&(!fl.type||l.type===fl.type)&&(!fl.status||l.status===fl.status));

  function save() {
    if (!form.employeeId||!form.startDate||!form.endDate) return alert(a?"يرجى ملء جميع الحقول":"Please fill all fields");
    const days=calcD(form); if(days<=0) return alert(a?"لا توجد أيام عمل في هذه الفترة":"No working days in period");
    if(form.type==="annual") { const emp=employees.find(e=>e.id===form.employeeId); if((emp?.annualLeaveBalance||0)<days) return alert(a?`رصيد الإجازة السنوية غير كافٍ. المتوفر: ${(emp?.annualLeaveBalance||0).toFixed(2)} يوم`:`Insufficient balance. Available: ${(emp?.annualLeaveBalance||0).toFixed(2)} days`); }
    const [y,m]=form.startDate.slice(0,7).split("-").map(Number); if(isMonthClosed(m,y)) return alert(a?"الشهر مغلق":"Month is closed");
    updateLeaves([...leaves,{...form,id:newId("LV"),days,createdAt:new Date().toISOString()}]); setModal(false);
  }
  function approve(lv) {
    if(lv.status==="approved") return;
    updateLeaves(leaves.map(l=>l.id===lv.id?{...l,status:"approved"}:l));
    if(lv.type==="annual") updateEmployees(employees.map(e=>e.id===lv.employeeId?{...e,annualLeaveBalance:Math.max(0,(e.annualLeaveBalance||0)-lv.days)}:e));
  }
  function reject(lv) {
    if(lv.status==="approved"&&lv.type==="annual") updateEmployees(employees.map(e=>e.id===lv.employeeId?{...e,annualLeaveBalance:(e.annualLeaveBalance||0)+lv.days}:e));
    updateLeaves(leaves.map(l=>l.id===lv.id?{...l,status:"rejected"}:l));
  }
  function del(lv) {
    if(!confirm(a?"حذف هذا الطلب؟":"Delete request?")) return;
    if(lv.status==="approved"&&lv.type==="annual") updateEmployees(employees.map(e=>e.id===lv.employeeId?{...e,annualLeaveBalance:(e.annualLeaveBalance||0)+lv.days}:e));
    updateLeaves(leaves.filter(l=>l.id!==lv.id));
  }
  const days = calcD(form);
  return (
    <div>
      <STitle title={a?"إدارة الإجازات":"Leave Management"} action={<Btn v="gold" onClick={()=>{setForm({employeeId:"",type:"annual",startDate:"",endDate:"",notes:"",status:"pending",days:0});setModal(true);}}>+ {a?"إضافة إجازة":"Add Leave"}</Btn>} />
      <Card style={{ marginBottom:16, padding:14 }}>
        <Grid cols={3} gap={12}>
          <FF label={a?"الموظف":"Employee"}><Sel value={fl.empId} onChange={v=>setFl(f=>({...f,empId:v}))}><option value="">{a?"الكل":"All"}</option>{employees.map(e=><option key={e.id} value={e.id}>{a?e.nameAr:e.nameEn}</option>)}</Sel></FF>
          <FF label={a?"نوع الإجازة":"Leave Type"}><Sel value={fl.type} onChange={v=>setFl(f=>({...f,type:v}))}><option value="">{a?"الكل":"All"}</option>{LEAVE_TYPES.map(lt=><option key={lt.id} value={lt.id}>{a?lt.ar:lt.en}</option>)}</Sel></FF>
          <FF label={a?"الحالة":"Status"}><Sel value={fl.status} onChange={v=>setFl(f=>({...f,status:v}))}><option value="">{a?"الكل":"All"}</option><option value="pending">{a?"معلق":"Pending"}</option><option value="approved">{a?"معتمد":"Approved"}</option><option value="rejected">{a?"مرفوض":"Rejected"}</option></Sel></FF>
        </Grid>
      </Card>
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <THead cols={[a?"الموظف":"Employee",a?"نوع الإجازة":"Type",a?"من":"From",a?"إلى":"To",a?"الأيام":"Days",a?"الحالة":"Status",a?"إجراءات":"Actions"]} />
          <tbody>
            {filtered.length===0 ? <Empty msg={a?"لا توجد إجازات":"No leaves found"} cols={7}/> : filtered.map((l,i)=>{
              const emp=employees.find(e=>e.id===l.employeeId); const lt=LEAVE_TYPES.find(x=>x.id===l.type);
              return <TRow key={l.id} i={i}
                cells={[<span style={{ fontWeight:700, color:NAV }}>{emp?(a?emp.nameAr:emp.nameEn):l.employeeId}</span>,<span>{lt?.icon} {a?lt?.ar:lt?.en}</span>,fmtDate(l.startDate,lang),fmtDate(l.endDate,lang),<span style={{ fontWeight:700 }}>{l.days}</span>,<Badge color={l.status==="approved"?"green":l.status==="rejected"?"red":"yellow"}>{a?(l.status==="approved"?"معتمد":l.status==="rejected"?"مرفوض":"معلق"):l.status}</Badge>]}
                actions={[l.status==="pending"&&<Btn key="ap" sz="sm" v="success" onClick={()=>approve(l)}>{a?"اعتماد":"Approve"}</Btn>,l.status==="pending"&&<Btn key="rj" sz="sm" v="danger" onClick={()=>reject(l)}>{a?"رفض":"Reject"}</Btn>,l.status==="approved"&&<Btn key="rv" sz="sm" v="warn" onClick={()=>reject(l)}>{a?"إلغاء اعتماد":"Revoke"}</Btn>,<Btn key="dl" sz="sm" v="secondary" onClick={()=>del(l)}>🗑️</Btn>].filter(Boolean)}
              />;
            })}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} close={()=>setModal(false)} title={a?"إضافة طلب إجازة":"Add Leave Request"} width={520}>
        <FF label={a?"الموظف":"Employee"}><Sel value={form.employeeId||""} onChange={v=>setForm(f=>({...f,employeeId:v}))}><option value="">{a?"اختر موظف":"Select employee"}</option>{employees.filter(e=>e.status==="active").map(e=><option key={e.id} value={e.id}>{a?e.nameAr:e.nameEn}</option>)}</Sel></FF>
        {form.employeeId&&<div style={{ background:"#f0f7ff", borderRadius:8, padding:10, marginBottom:12, fontSize:12 }}>{a?"رصيد الإجازة السنوية:":"Annual leave balance:"} <strong style={{ color:"#1a3a6e" }}>{(employees.find(e=>e.id===form.employeeId)?.annualLeaveBalance||0).toFixed(2)} {a?"يوم":"days"}</strong></div>}
        <FF label={a?"نوع الإجازة":"Leave Type"}><Sel value={form.type||"annual"} onChange={v=>setForm(f=>({...f,type:v}))}>{LEAVE_TYPES.map(lt=><option key={lt.id} value={lt.id}>{lt.icon} {a?lt.ar:lt.en}</option>)}</Sel></FF>
        <Grid cols={2}><FF label={a?"من":"From"}><Inp type="date" value={form.startDate||""} onChange={v=>setForm(f=>{const n={...f,startDate:v};n.days=calcD(n);return n;})} /></FF><FF label={a?"إلى":"To"}><Inp type="date" value={form.endDate||""} min={form.startDate} onChange={v=>setForm(f=>{const n={...f,endDate:v};n.days=calcD(n);return n;})} /></FF></Grid>
        {form.startDate&&form.endDate&&form.employeeId&&<div style={{ background:"#f0fff4", borderRadius:8, padding:10, marginBottom:12, fontSize:13, fontWeight:600, color:"#166534" }}>{a?"أيام العمل المحسوبة:":"Calculated working days:"} {days} {a?"يوم":"days"}</div>}
        <FF label={a?"ملاحظات":"Notes"}><Txt value={form.notes||""} onChange={v=>setForm(f=>({...f,notes:v}))} rows={2} /></FF>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn v="secondary" onClick={()=>setModal(false)}>{a?"إلغاء":"Cancel"}</Btn><Btn v="gold" onClick={save}>{a?"حفظ":"Save"}</Btn></div>
      </Modal>
    </div>
  );
}

// ── DEPARTURES VIEW ───────────────────────────────────────────────
function DeparturesView({ lang, employees, departures, updateDepartures, isMonthClosed }) {
  const now = new Date(); const defMon = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const [fEmp, setFEmp] = useState(""); const [fMon, setFMon] = useState(defMon);
  const [modal, setModal] = useState(false); const [form, setForm] = useState({});
  const a = lang==="ar";
  const filtered = departures.filter(d=>(!fEmp||d.employeeId===fEmp)&&(!fMon||d.date?.startsWith(fMon)));
  const empHrs = id => departures.filter(d=>d.employeeId===id&&d.date?.startsWith(fMon)).reduce((s,d)=>s+(d.hours||0),0);
  const empSummary = employees.filter(e=>e.status==="active").map(emp=>{const used=empHrs(emp.id);return{emp,used:used.toFixed(2),rem:Math.max(0,6-used).toFixed(2),exc:Math.max(0,used-6).toFixed(2)};});

  function save() {
    if(!form.employeeId||!form.date||!form.departureTime||!form.returnTime) return alert(a?"يرجى ملء جميع الحقول":"Fill all fields");
    const hours=hrsDiff(form.departureTime,form.returnTime); if(hours<=0) return alert(a?"وقت العودة يجب أن يكون بعد وقت المغادرة":"Return must be after departure");
    const [y,m]=form.date.slice(0,7).split("-").map(Number); if(isMonthClosed(m,y)) return alert(a?"الشهر مغلق":"Month is closed");
    updateDepartures([...departures,{...form,id:newId("DEP"),hours,createdAt:new Date().toISOString()}]); setModal(false);
  }

  return (
    <div>
      <STitle title={a?"إدارة المغادرات":"Departure Management"} action={<Btn v="gold" onClick={()=>{setForm({employeeId:"",type:"day",date:"",departureTime:"",returnTime:"",notes:""});setModal(true);}}>+ {a?"إضافة مغادرة":"Add Departure"}</Btn>} />
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <h3 style={{ margin:0, fontSize:14, color:NAV }}>{a?"ملخص المغادرات الشهرية (6 ساعات مسموح لكل موظف)":"Monthly Summary (6 hours allowed per employee)"}</h3>
          <Inp type="month" value={fMon} onChange={setFMon} style={{ width:170 }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {empSummary.map(({emp,used,rem,exc},i)=>(
            <div key={i} style={{ border:"1.5px solid", borderColor:parseFloat(exc)>0?"#fca5a5":"#e5e7eb", borderRadius:10, padding:12, background:parseFloat(exc)>0?"#fff5f5":"#f9fafb" }}>
              <div style={{ fontSize:13, fontWeight:700, color:NAV, marginBottom:6 }}>{a?emp.nameAr:emp.nameEn}</div>
              <div style={{ fontSize:11, display:"flex", gap:6, flexWrap:"wrap" }}>
                <span style={{ background:"#fee2e2", color:"#991b1b", padding:"1px 7px", borderRadius:10 }}>{a?"مستخدم":"Used"}: {used}h</span>
                <span style={{ background:"#dcfce7", color:"#166534", padding:"1px 7px", borderRadius:10 }}>{a?"متبقي":"Left"}: {rem}h</span>
                {parseFloat(exc)>0&&<span style={{ background:"#fef3c7", color:"#92400e", padding:"1px 7px", borderRadius:10 }}>{a?"زائد":"Excess"}: {exc}h</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom:14, padding:12 }}><Grid cols={2} gap={12}><FF label={a?"فلتر الموظف":"Filter by Employee"}><Sel value={fEmp} onChange={setFEmp}><option value="">{a?"الكل":"All"}</option>{employees.map(e=><option key={e.id} value={e.id}>{a?e.nameAr:e.nameEn}</option>)}</Sel></FF></Grid></Card>
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <THead cols={[a?"الموظف":"Employee",a?"نوع المغادرة":"Type",a?"التاريخ":"Date",a?"وقت المغادرة":"Out",a?"وقت العودة":"In",a?"الساعات":"Hours",a?"ملاحظات":"Notes",a?"إجراءات":"Actions"]} />
          <tbody>
            {filtered.length===0 ? <Empty msg={a?"لا توجد مغادرات":"No departures"} cols={8}/> : filtered.map((d,i)=>{
              const emp=employees.find(e=>e.id===d.employeeId); const dt=DEP_TYPES.find(x=>x.id===d.type);
              return <TRow key={d.id} i={i}
                cells={[<span style={{ fontWeight:600 }}>{emp?(a?emp.nameAr:emp.nameEn):d.employeeId}</span>,<span>{dt?.icon} {a?dt?.ar:dt?.en}</span>,fmtDate(d.date,lang),d.departureTime,d.returnTime,<span style={{ fontWeight:700, color:"#dc2626" }}>{(d.hours||0).toFixed(2)}h</span>,<span style={{ color:"#888", fontSize:11 }}>{d.notes||"-"}</span>]}
                actions={[<Btn key="dl" sz="sm" v="danger" onClick={()=>{if(confirm(a?"حذف؟":"Delete?"))updateDepartures(departures.filter(x=>x.id!==d.id));}}>🗑️</Btn>]}
              />;
            })}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} close={()=>setModal(false)} title={a?"إضافة مغادرة":"Add Departure"} width={460}>
        <FF label={a?"الموظف":"Employee"}><Sel value={form.employeeId||""} onChange={v=>setForm(f=>({...f,employeeId:v}))}><option value="">{a?"اختر موظف":"Select employee"}</option>{employees.filter(e=>e.status==="active").map(e=><option key={e.id} value={e.id}>{a?e.nameAr:e.nameEn}</option>)}</Sel></FF>
        {form.employeeId&&<div style={{ background:"#fff0f0", borderRadius:8, padding:10, marginBottom:12, fontSize:12 }}>{a?"ساعات مغادرة هذا الشهر:":"This month departure hours:"} <strong style={{ color:"#dc2626" }}>{empHrs(form.employeeId).toFixed(2)}h</strong> / 6h {a?"مسموح":"allowed"}</div>}
        <FF label={a?"نوع المغادرة":"Departure Type"}><Sel value={form.type||"day"} onChange={v=>setForm(f=>({...f,type:v}))}>{DEP_TYPES.map(dt=><option key={dt.id} value={dt.id}>{dt.icon} {a?dt.ar:dt.en}</option>)}</Sel></FF>
        <FF label={a?"التاريخ":"Date"}><Inp type="date" value={form.date||""} onChange={v=>setForm(f=>({...f,date:v}))} /></FF>
        <Grid cols={2}><FF label={a?"وقت المغادرة":"Departure Time"}><Inp type="time" value={form.departureTime||""} onChange={v=>setForm(f=>({...f,departureTime:v}))} /></FF><FF label={a?"وقت العودة":"Return Time"}><Inp type="time" value={form.returnTime||""} onChange={v=>setForm(f=>({...f,returnTime:v}))} /></FF></Grid>
        {form.departureTime&&form.returnTime&&<div style={{ background:"#f0fff4", borderRadius:8, padding:10, marginBottom:12, fontSize:13, fontWeight:600, color:"#166534" }}>{a?"المدة:":"Duration:"} {hrsDiff(form.departureTime,form.returnTime).toFixed(2)} {a?"ساعة":"hours"}</div>}
        <FF label={a?"ملاحظات":"Notes"}><Txt value={form.notes||""} onChange={v=>setForm(f=>({...f,notes:v}))} rows={2} /></FF>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn v="secondary" onClick={()=>setModal(false)}>{a?"إلغاء":"Cancel"}</Btn><Btn v="gold" onClick={save}>{a?"حفظ":"Save"}</Btn></div>
      </Modal>
    </div>
  );
}

// ── PAYROLL VIEW ──────────────────────────────────────────────────
function PayrollView({ lang, employees, payroll, updatePayroll, leaves, departures, isMonthClosed }) {
  const now = new Date();
  const [selM, setSelM] = useState(now.getMonth()+1); const [selY, setSelY] = useState(now.getFullYear());
  const a = lang==="ar"; const mk = `${selY}-${String(selM).padStart(2,"0")}`;
  const existing = payroll.find(p=>p.month===selM&&p.year===selY);
  const closed = isMonthClosed(selM,selY);

  function gen() {
    const recs = employees.filter(e=>e.status==="active").map(emp=>{
      const base=parseFloat(emp.salary)||0, wdm=22, daily=base/wdm;
      const unpaidD  = leaves.filter(l=>l.employeeId===emp.id&&l.type==="unpaid"   &&l.status==="approved"&&l.startDate?.startsWith(mk)).reduce((s,l)=>s+(l.days||0),0);
      const m50D     = leaves.filter(l=>l.employeeId===emp.id&&l.type==="medical50"&&l.status==="approved"&&l.startDate?.startsWith(mk)).reduce((s,l)=>s+(l.days||0),0);
      const unpaidDed= Math.round(unpaidD*daily*100)/100;
      const m50Ded   = Math.round(m50D*daily*0.5*100)/100;
      const ss       = Math.round(base*0.07*100)/100;
      const totalDed = Math.round((unpaidDed+m50Ded+ss)*100)/100;
      return { employeeId:emp.id, baseSalary:base, unpaidDays:unpaidD, unpaidDed, m50Days:m50D, m50Ded, socialSecurity:ss, totalDed, netSalary:Math.round((base-totalDed)*100)/100, bonus:0 };
    });
    updatePayroll([...payroll.filter(p=>!(p.month===selM&&p.year===selY)),{month:selM,year:selY,records:recs,generatedAt:new Date().toISOString()}]);
  }

  const recs = existing?.records||[];
  function expPay() {
    const h=a?["الموظف","الراتب الأساسي","أيام بلا راتب","خصم بلا راتب","مرضي 50%","ضمان اجتماعي 7%","إجمالي الخصم","الراتب الصافي"]:["Employee","Base Salary","Unpaid Days","Unpaid Deduct","Med 50%","Soc.Sec 7%","Total Deduct","Net Salary"];
    dlCSV(h,recs.map(r=>{const emp=employees.find(e=>e.id===r.employeeId);return[a?emp?.nameAr:emp?.nameEn,r.baseSalary,r.unpaidDays,r.unpaidDed,r.m50Ded,r.socialSecurity,r.totalDed,r.netSalary];}),`payroll-${mk}`);
  }

  return (
    <div>
      <STitle title={a?"كشوف الرواتب":"Monthly Payroll"} action={
        <div style={{ display:"flex", gap:8 }}>
          <Sel value={selM} onChange={v=>setSelM(parseInt(v))} style={{ width:140 }}>{(a?MONTHS_AR:MONTHS_EN).map((m,i)=><option key={i} value={i+1}>{m}</option>)}</Sel>
          <Sel value={selY} onChange={v=>setSelY(parseInt(v))} style={{ width:100 }}>{[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</Sel>
          <Btn v="primary" onClick={gen}>{a?"توليد كشف الرواتب":"Generate Payroll"}</Btn>
          {recs.length>0&&<Btn v="success" onClick={expPay}>{a?"تصدير CSV":"Export CSV"}</Btn>}
        </div>
      } />
      {closed&&<div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:12, marginBottom:16, fontSize:13, color:"#991b1b" }}>🔒 {a?"هذا الشهر مغلق":"This month is closed"}</div>}
      {recs.length>0 ? <>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
          <Card><div style={{ fontSize:20, fontWeight:800, color:"#1a3a6e" }}>{recs.length}</div><div style={{ fontSize:11, color:"#888" }}>{a?"عدد الموظفين":"Employees"}</div></Card>
          <Card><div style={{ fontSize:20, fontWeight:800, color:"#059669" }}>{recs.reduce((s,r)=>s+r.netSalary,0).toLocaleString()} ₪</div><div style={{ fontSize:11, color:"#888" }}>{a?"إجمالي الرواتب الصافية":"Total Net Salaries"}</div></Card>
          <Card><div style={{ fontSize:20, fontWeight:800, color:"#d97706" }}>{recs.reduce((s,r)=>s+r.totalDed,0).toFixed(0)} ₪</div><div style={{ fontSize:11, color:"#888" }}>{a?"إجمالي الاستقطاعات":"Total Deductions"}</div></Card>
        </div>
        <Card style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <THead cols={[a?"الموظف":"Employee",a?"الراتب الأساسي":"Base",a?"خصم بلا راتب":"Unpaid",a?"مرضي 50%":"Med 50%",a?"ضمان اجتماعي":"Soc. Sec.",a?"إجمالي الخصم":"Total Deduct",a?"الراتب الصافي":"Net Salary"]} />
            <tbody>{recs.map((r,i)=>{const emp=employees.find(e=>e.id===r.employeeId);return <TRow key={i} i={i} cells={[<span style={{ fontWeight:700, color:NAV }}>{emp?(a?emp.nameAr:emp.nameEn):r.employeeId}</span>,r.baseSalary+" ₪",<span style={{ color:"#dc2626" }}>{r.unpaidDed>0?`-${r.unpaidDed} ₪`:"-"}</span>,<span style={{ color:"#dc2626" }}>{r.m50Ded>0?`-${r.m50Ded} ₪`:"-"}</span>,<span style={{ color:"#d97706" }}>-{r.socialSecurity} ₪</span>,<span style={{ color:"#dc2626", fontWeight:600 }}>-{r.totalDed} ₪</span>,<span style={{ fontWeight:800, color:"#059669", fontSize:14 }}>{r.netSalary} ₪</span>]} />;})}</tbody>
          </table>
        </Card>
      </> : <Card><div style={{ textAlign:"center", padding:48, color:"#aaa" }}><div style={{ fontSize:40, marginBottom:12 }}>💰</div><div style={{ fontSize:14 }}>{a?"اضغط 'توليد كشف الرواتب' لإنشاء كشف هذا الشهر":"Click 'Generate Payroll' to create this month's payroll"}</div></div></Card>}
    </div>
  );
}

// ── HOLIDAYS VIEW ─────────────────────────────────────────────────
function HolidaysView({ lang, holidays, updateHolidays, employees }) {
  const [modal, setModal] = useState(false); const [form, setForm] = useState({});
  const a = lang==="ar";
  function save() {
    if(!form.nameAr||!form.date) return alert(a?"يرجى ملء الاسم والتاريخ":"Fill name and date");
    updateHolidays([...holidays,{...form,id:newId("HOL")}]); setModal(false);
  }
  return (
    <div>
      <STitle title={a?"العطل الرسمية":"Official Holidays"} action={<Btn v="gold" onClick={()=>{setForm({nameAr:"",nameEn:"",date:"",applyToAll:true,specificEmployees:[]});setModal(true);}}>+ {a?"إضافة عطلة":"Add Holiday"}</Btn>} />
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <THead cols={[a?"العطلة (عربي)":"Holiday (Ar)",a?"العطلة (إنجليزي)":"Holiday (En)",a?"التاريخ":"Date",a?"يطبق على":"Applies To",a?"إجراءات":"Actions"]} />
          <tbody>
            {holidays.length===0 ? <Empty msg={a?"لا توجد عطل رسمية":"No official holidays"} cols={5}/> : holidays.map((h,i)=>(
              <TRow key={h.id} i={i}
                cells={[<span style={{ fontWeight:600 }}>📅 {h.nameAr}</span>,h.nameEn,fmtDate(h.date,lang),<Badge color={h.applyToAll?"green":"gold"}>{h.applyToAll?(a?"جميع الموظفين":"All Employees"):(a?`${(h.specificEmployees||[]).length} موظف`:`${(h.specificEmployees||[]).length} employees`)}</Badge>]}
                actions={[<Btn key="dl" sz="sm" v="danger" onClick={()=>{if(confirm(a?"حذف؟":"Delete?"))updateHolidays(holidays.filter(x=>x.id!==h.id));}}>🗑️</Btn>]}
              />
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={modal} close={()=>setModal(false)} title={a?"إضافة عطلة رسمية":"Add Official Holiday"} width={500}>
        <FF label={a?"اسم العطلة (عربي) *":"Holiday Name (Arabic) *"}><Inp value={form.nameAr||""} onChange={v=>setForm(f=>({...f,nameAr:v}))} /></FF>
        <FF label={a?"اسم العطلة (إنجليزي)":"Holiday Name (English)"}><Inp value={form.nameEn||""} onChange={v=>setForm(f=>({...f,nameEn:v}))} /></FF>
        <FF label={a?"التاريخ *":"Date *"}><Inp type="date" value={form.date||""} onChange={v=>setForm(f=>({...f,date:v}))} /></FF>
        <FF label={a?"يطبق على":"Applies To"}>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            {[{val:true,ar:"جميع الموظفين",en:"All Employees"},{val:false,ar:"موظفون محددون",en:"Specific Employees"}].map(opt=>(
              <button key={String(opt.val)} onClick={()=>setForm(f=>({...f,applyToAll:opt.val}))} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, background:form.applyToAll===opt.val?NAV:"#fff", borderColor:form.applyToAll===opt.val?NAV:"#e0e0e0", color:form.applyToAll===opt.val?"#fff":"#555" }}>
                {a?opt.ar:opt.en}
              </button>
            ))}
          </div>
          {!form.applyToAll&&<div style={{ border:"1px solid #e0e0e0", borderRadius:8, padding:10, maxHeight:160, overflowY:"auto" }}>
            {employees.map(e=><label key={e.id} style={{ display:"flex", gap:8, alignItems:"center", padding:"4px 0", cursor:"pointer", fontSize:13 }}><input type="checkbox" checked={(form.specificEmployees||[]).includes(e.id)} onChange={()=>setForm(f=>{const sp=f.specificEmployees||[];return{...f,specificEmployees:sp.includes(e.id)?sp.filter(x=>x!==e.id):[...sp,e.id]};})}/>{a?e.nameAr:e.nameEn}</label>)}
          </div>}
        </FF>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn v="secondary" onClick={()=>setModal(false)}>{a?"إلغاء":"Cancel"}</Btn><Btn v="gold" onClick={save}>{a?"حفظ":"Save"}</Btn></div>
      </Modal>
    </div>
  );
}

// ── MONTH CLOSE ───────────────────────────────────────────────────
function MonthCloseView({ lang, monthSettings, updateMonthSettings, employees, departures, updateEmployees }) {
  const now = new Date();
  const [selM, setSelM] = useState(now.getMonth()+1); const [selY, setSelY] = useState(now.getFullYear());
  const [cutoff, setCutoff] = useState(monthSettings.cutoffDay||25);
  const a = lang==="ar"; const mk = `${selY}-${String(selM).padStart(2,"0")}`;
  const isClosed = (monthSettings.closedMonths||[]).some(m=>m.month===selM&&m.year===selY);

  const empStats = employees.filter(e=>e.status==="active").map(emp=>{
    const used=departures.filter(d=>d.employeeId===emp.id&&d.date?.startsWith(mk)).reduce((s,d)=>s+(d.hours||0),0);
    const exc=Math.max(0,used-6); const dtd=exc/8;
    return{emp,used:used.toFixed(2),exc:exc.toFixed(2),dtd:dtd.toFixed(3),bal:(emp.annualLeaveBalance||0).toFixed(2)};
  });

  function saveCutoff() { updateMonthSettings({...monthSettings,cutoffDay:parseInt(cutoff)||25}); alert(a?"✅ تم حفظ يوم التسكير":"✅ Cutoff day saved"); }

  function closeMonth() {
    if(!confirm(a?`تسكير شهر ${MONTHS_AR[selM-1]} ${selY}؟\n• سيتم خصم ساعات المغادرة الزائدة من رصيد الإجازة السنوية\n• سيتم إضافة الترصيد الشهري لكل موظف`:`Close ${MONTHS_EN[selM-1]} ${selY}?\n• Excess departure hours will be deducted from annual leave\n• Monthly leave accrual will be added to each employee`)) return;
    let newEmps = employees.map(emp=>{
      const st=empStats.find(s=>s.emp.id===emp.id);
      if(!st||parseFloat(st.dtd)<=0) return emp;
      return{...emp,annualLeaveBalance:Math.max(0,Math.round(((emp.annualLeaveBalance||0)-parseFloat(st.dtd))*1000)/1000)};
    });
    newEmps = newEmps.map(emp=>{ if(emp.status!=="active") return emp; const acc=accrual(emp.startDate); return{...emp,annualLeaveBalance:Math.round(((emp.annualLeaveBalance||0)+acc)*1000)/1000}; });
    updateEmployees(newEmps);
    const cm=[...(monthSettings.closedMonths||[]).filter(m=>!(m.month===selM&&m.year===selY)),{month:selM,year:selY}];
    updateMonthSettings({...monthSettings,closedMonths:cm});
    alert(a?"✅ تم تسكير الشهر بنجاح وإضافة ترصيد الإجازات السنوية":"✅ Month closed & leave accruals added successfully");
  }
  function reopen() { if(!confirm(a?"إعادة فتح الشهر؟":"Reopen month?")) return; updateMonthSettings({...monthSettings,closedMonths:(monthSettings.closedMonths||[]).filter(m=>!(m.month===selM&&m.year===selY))}); }

  return (
    <div>
      <STitle title={a?"تسكير الشهر":"Month Closing"} />
      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16 }}>
        <div>
          <Card style={{ marginBottom:14 }}>
            <h3 style={{ margin:"0 0 14px", fontSize:14, color:NAV }}>{a?"إعدادات التسكير":"Closing Settings"}</h3>
            <FF label={a?"يوم التسكير (1-28)":"Cutoff Day (1-28)"}><Inp type="number" min="1" max="28" value={cutoff} onChange={setCutoff} /></FF>
            <Btn v="gold" onClick={saveCutoff} style={{ width:"100%", marginBottom:10 }}>{a?"حفظ يوم التسكير":"Save Cutoff Day"}</Btn>
            <div style={{ background:"#f0f7ff", borderRadius:8, padding:10, fontSize:12, color:"#1a3a6e" }}>{a?`يوم التسكير الحالي: ${monthSettings.cutoffDay||25}`:`Current cutoff day: ${monthSettings.cutoffDay||25}`}</div>
          </Card>
          <Card>
            <h3 style={{ margin:"0 0 14px", fontSize:14, color:NAV }}>{a?"تسكير / فتح الشهر":"Close / Open Month"}</h3>
            <Grid cols={2} gap={8}>
              <FF label={a?"الشهر":"Month"}><Sel value={selM} onChange={v=>setSelM(parseInt(v))}>{(a?MONTHS_AR:MONTHS_EN).map((m,i)=><option key={i} value={i+1}>{m}</option>)}</Sel></FF>
              <FF label={a?"السنة":"Year"}><Sel value={selY} onChange={v=>setSelY(parseInt(v))}>{[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</Sel></FF>
            </Grid>
            {isClosed ? <>
              <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:10, marginBottom:10, fontSize:13, color:"#991b1b", textAlign:"center" }}>🔒 {a?"الشهر مغلق":"Month is closed"}</div>
              <Btn v="warn" onClick={reopen} style={{ width:"100%" }}>{a?"إعادة فتح الشهر":"Reopen Month"}</Btn>
            </> : <Btn v="danger" onClick={closeMonth} style={{ width:"100%" }}>🔒 {a?"تسكير الشهر":"Close Month"}</Btn>}
            <div style={{ marginTop:12, fontSize:11, color:"#888", lineHeight:1.7 }}>
              {a?"عند التسكير:\n• خصم الزائد عن 6 ساعات مغادرة ÷ 8 = أيام\n• إضافة الترصيد الشهري لكل موظف":"On closing:\n• Excess >6h departure hours ÷ 8 = days deducted\n• Monthly accrual added per employee"}
            </div>
          </Card>
        </div>
        <Card>
          <h3 style={{ margin:"0 0 14px", fontSize:14, color:NAV }}>{a?`تفاصيل ${MONTHS_AR[selM-1]} ${selY}`:`Details for ${MONTHS_EN[selM-1]} ${selY}`}</h3>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <THead cols={[a?"الموظف":"Employee",a?"ساعات مستخدمة":"Used Hrs",a?"ساعات زائدة":"Excess Hrs",a?"أيام للخصم":"Days to Deduct",a?"رصيد الإجازة":"Leave Balance",a?"ترصيد شهري":"Monthly Accrual"]} />
            <tbody>{empStats.map((s,i)=>(
              <TRow key={i} i={i} cells={[
                <span style={{ fontWeight:600 }}>{a?s.emp.nameAr:s.emp.nameEn}</span>,
                s.used+"h",
                <span style={{ color:parseFloat(s.exc)>0?"#dc2626":"#059669", fontWeight:600 }}>{s.exc}h</span>,
                <span style={{ color:parseFloat(s.dtd)>0?"#dc2626":"#059669", fontWeight:600 }}>{parseFloat(s.dtd)>0?"-"+s.dtd:"-"}</span>,
                <span style={{ fontWeight:600, color:"#1a3a6e" }}>{s.bal} {a?"يوم":"d"}</span>,
                <span style={{ color:"#059669", fontWeight:600 }}>+{accrual(s.emp.startDate)} {a?"يوم":"d"}</span>,
              ]} />
            ))}</tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ── LETTERS VIEW ──────────────────────────────────────────────────
function LettersView({ lang, employees }) {
  const [empId, setEmpId] = useState(""); const [lType, setLType] = useState("salary");
  const a = lang==="ar"; const emp = employees.find(e=>e.id===empId);
  const today = new Date();
  const todayAr = today.toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"});
  const todayEn = today.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

  const ltypes = [
    {id:"salary", ar:"كتاب تحويل راتب (إثبات مهنة)", en:"Salary Transfer Letter (Profession Proof)", icon:"💰"},
    {id:"exp_ar", ar:"شهادة خبرة (عربي)",            en:"Experience Certificate (Arabic)",          icon:"📋"},
    {id:"exp_en", ar:"شهادة خبرة (إنجليزي)",          en:"Experience Certificate (English)",         icon:"📄"},
  ];

  function print() {
    if (!emp) return;
    const y = Math.floor(svcYrs(emp.startDate));
    const hdrAr = `<div style="text-align:center;border-bottom:3px solid #c9a227;padding-bottom:16px;margin-bottom:24px"><h1 style="color:#0f1b35;margin:0;font-size:26px">شركة غرغور التجارية</h1><p style="color:#888;margin:4px 0;font-size:13px">نابلس - فلسطين | info@gharghor.com</p></div>`;
    const hdrEn = `<div style="text-align:center;border-bottom:3px solid #c9a227;padding-bottom:16px;margin-bottom:24px"><h1 style="color:#0f1b35;margin:0;font-size:26px">Gharghor Trading Company</h1><p style="color:#888;margin:4px 0;font-size:13px">Nablus, Palestine | info@gharghor.com</p></div>`;
    const sig   = `<div style="margin-top:60px;display:flex;justify-content:space-between;text-align:center;font-size:13px"><div><div style="border-top:1.5px solid #333;width:180px;padding-top:8px">${a?"توقيع الموظف":"Employee Signature"}</div></div><div><div style="border-top:1.5px solid #333;width:180px;padding-top:8px">${a?"مدير الموارد البشرية":"HR Manager"}</div></div><div><div style="border-top:1.5px solid #333;width:180px;padding-top:8px">${a?"ختم الشركة":"Company Stamp"}</div></div></div>`;
    let body="";
    if (lType==="salary") {
      body=`<html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet"><style>body{font-family:'Amiri',serif;direction:rtl;padding:40px;max-width:720px;margin:0 auto;color:#333;line-height:1.9}@media print{body{padding:20px}}</style></head><body>${hdrAr}<div style="text-align:center;border:2px solid #c9a227;border-radius:8px;padding:10px;margin-bottom:24px;font-size:18px;font-weight:700;color:#c9a227">كتاب تحويل راتب — إثبات مهنة</div><p style="text-align:left;font-size:13px"><strong>التاريخ:</strong> ${todayAr}</p><p style="font-size:16px">تشهد شركة غرغور التجارية بأن <strong>${emp.nameAr}</strong> (رقم الهوية: ${emp.nationalId||"---"}) يعمل لدينا بوظيفة <strong>${emp.position}</strong>${emp.department?` في قسم ${emp.department}`:""} منذ تاريخ <strong>${fmtDate(emp.startDate,"ar")}</strong>، وراتبه الأساسي الشهري <strong>${emp.salary} شيكل إسرائيلي</strong>.</p><p style="font-size:16px">تُصدر هذه الشهادة بناءً على طلب الموظف لتقديمها إلى الجهات المختصة دون أي مسؤولية على الشركة.</p>${sig}</body></html>`;
    } else if (lType==="exp_ar") {
      body=`<html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet"><style>body{font-family:'Amiri',serif;direction:rtl;padding:40px;max-width:720px;margin:0 auto;color:#333;line-height:1.9}@media print{body{padding:20px}}</style></head><body>${hdrAr}<div style="text-align:center;border:2px solid #c9a227;border-radius:8px;padding:10px;margin-bottom:24px;font-size:18px;font-weight:700;color:#c9a227">شهادة خبرة</div><p style="text-align:left;font-size:13px"><strong>التاريخ:</strong> ${todayAr}</p><p style="font-size:16px">تشهد شركة غرغور التجارية بأن <strong>${emp.nameAr}</strong> (رقم الهوية: ${emp.nationalId||"---"}) قد عمل لدينا في وظيفة <strong>${emp.position}</strong>${emp.department?` في قسم ${emp.department}`:""} منذ تاريخ <strong>${fmtDate(emp.startDate,"ar")}</strong> وحتى تاريخه${y>0?`، أي ما يقارب <strong>${y} سنة</strong> من الخدمة`:""}.</p><p style="font-size:16px">وقد أثبت خلال فترة عمله كفاءة عالية وتعاملاً مهنياً وسلوكاً حميداً، ونشهد له بذلك. تُصدر هذه الشهادة بناءً على طلب الموظف لتقديمها إلى الجهات المختصة.</p>${sig}</body></html>`;
    } else {
      body=`<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;direction:ltr;padding:40px;max-width:720px;margin:0 auto;color:#333;line-height:1.9}@media print{body{padding:20px}}</style></head><body>${hdrEn}<div style="text-align:center;border:2px solid #c9a227;border-radius:8px;padding:10px;margin-bottom:24px;font-size:18px;font-weight:700;color:#c9a227">EXPERIENCE CERTIFICATE</div><p style="font-size:13px"><strong>Date:</strong> ${todayEn}</p><p style="font-size:16px">This is to certify that <strong>${emp.nameEn||emp.nameAr}</strong> (National ID: ${emp.nationalId||"---"}) has been employed with Gharghor Trading Company as <strong>${emp.positionEn||emp.position}</strong>${emp.departmentEn?` in the ${emp.departmentEn} Department`:""} since <strong>${fmtDate(emp.startDate,"en")}</strong>${y>0?`, amounting to approximately <strong>${y} year(s)</strong> of service`:""} to date.</p><p style="font-size:16px">During their tenure, they have demonstrated high professionalism, competence, and exemplary conduct. This certificate is issued upon the employee's request for official purposes.</p>${sig}</body></html>`;
    }
    const w = window.open("","_blank"); w.document.write(body); w.document.close(); setTimeout(()=>w.print(),600);
  }

  return (
    <div>
      <STitle title={a?"الكتب الإدارية":"Administrative Letters"} />
      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:16 }}>
        <Card>
          <h3 style={{ margin:"0 0 14px", fontSize:14, color:NAV }}>{a?"إعداد الكتاب":"Prepare Letter"}</h3>
          <FF label={a?"الموظف":"Employee"}><Sel value={empId} onChange={setEmpId}><option value="">{a?"اختر موظف":"Select employee"}</option>{employees.map(e=><option key={e.id} value={e.id}>{a?e.nameAr:e.nameEn}</option>)}</Sel></FF>
          {emp&&<div style={{ background:"#f0f7ff", borderRadius:8, padding:10, marginBottom:12, fontSize:12 }}><div style={{ fontWeight:700, color:NAV }}>{a?emp.nameAr:emp.nameEn}</div><div style={{ color:"#666", marginTop:2 }}>{a?emp.position:emp.positionEn} · {fmtDate(emp.startDate,lang)}</div></div>}
          <FF label={a?"نوع الكتاب":"Letter Type"}>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {ltypes.map(lt=>(
                <button key={lt.id} onClick={()=>setLType(lt.id)} style={{ padding:"10px 14px", borderRadius:10, border:"1.5px solid", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600, textAlign:a?"right":"left", background:lType===lt.id?NAV:"#fff", borderColor:lType===lt.id?NAV:"#e0e0e0", color:lType===lt.id?"#fff":"#444" }}>
                  {lt.icon} {a?lt.ar:lt.en}
                </button>
              ))}
            </div>
          </FF>
          <Btn v="gold" onClick={print} disabled={!empId} style={{ width:"100%" }}>🖨️ {a?"طباعة / تصدير":"Print / Export"}</Btn>
        </Card>
        <Card>
          <h3 style={{ margin:"0 0 14px", fontSize:14, color:NAV }}>{a?"معاينة الكتاب":"Letter Preview"}</h3>
          {emp ? (
            <div style={{ border:"1px solid #e0e0e0", borderRadius:10, padding:24, background:"#fafafa", minHeight:380, direction:lType==="exp_en"?"ltr":"rtl" }}>
              <div style={{ textAlign:"center", borderBottom:"2px solid #c9a227", paddingBottom:16, marginBottom:20 }}>
                <div style={{ fontSize:20, fontWeight:800, color:NAV }}>{lType==="exp_en"?"Gharghor Trading Company":"شركة غرغور التجارية"}</div>
                <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{lType==="exp_en"?"Nablus, Palestine":"نابلس - فلسطين"}</div>
              </div>
              <div style={{ textAlign:"center", border:"1.5px solid #c9a227", borderRadius:8, padding:10, marginBottom:20, color:GOLD, fontWeight:700, fontSize:15 }}>{ltypes.find(l=>l.id===lType)?.[a?"ar":"en"]}</div>
              <div style={{ fontSize:13, lineHeight:2, color:"#444" }}>
                {lType==="salary"&&(a?`تشهد شركة غرغور التجارية بأن ${emp.nameAr} يعمل بوظيفة ${emp.position} منذ ${fmtDate(emp.startDate,"ar")} براتب ${emp.salary} شيكل.`:`Gharghor Trading certifies that ${emp.nameEn||emp.nameAr} works as ${emp.positionEn||emp.position} since ${fmtDate(emp.startDate,"en")} with salary ${emp.salary} ILS.`)}
                {lType==="exp_ar"&&`تشهد شركة غرغور التجارية بأن ${emp.nameAr} عمل بوظيفة ${emp.position} منذ ${fmtDate(emp.startDate,"ar")}، وأثبت كفاءة عالية وسلوكاً حميداً.`}
                {lType==="exp_en"&&`This certifies that ${emp.nameEn||emp.nameAr} has been employed as ${emp.positionEn||emp.position} since ${fmtDate(emp.startDate,"en")}, demonstrating professionalism and exemplary conduct.`}
              </div>
              <div style={{ marginTop:32, display:"flex", justifyContent:"space-between", fontSize:11, color:"#bbb" }}>
                {[a?"توقيع الموظف":"Employee",a?"مدير الموارد البشرية":"HR Manager",a?"ختم الشركة":"Stamp"].map((l,i)=><div key={i} style={{ textAlign:"center" }}>{l}<div style={{ width:100, height:1, background:"#ddd", margin:"14px auto 0" }}></div></div>)}
              </div>
            </div>
          ) : <div style={{ textAlign:"center", padding:60, color:"#aaa" }}><div style={{ fontSize:48, marginBottom:12 }}>📄</div><div style={{ fontSize:14 }}>{a?"اختر موظفاً لمعاينة الكتاب":"Select an employee to preview the letter"}</div></div>}
        </Card>
      </div>
    </div>
  );
}

// ── REPORTS VIEW ──────────────────────────────────────────────────
function ReportsView({ lang, employees, leaves, departures, payroll }) {
  const [rt, setRt] = useState("leaves"); const [fEmp, setFEmp] = useState(""); const [fFrom, setFFrom] = useState(""); const [fTo, setFTo] = useState("");
  const a = lang==="ar";
  const fl = (arr, dateFn) => arr.filter(x=>(!fEmp||x.employeeId===fEmp)&&(!fFrom||dateFn(x)>=fFrom)&&(!fTo||dateFn(x)<=fTo));
  const fLeaves = fl(leaves,l=>l.startDate); const fDep = fl(departures,d=>d.date);

  function expL() { dlCSV(a?["رقم الطلب","الموظف","نوع الإجازة","من","إلى","الأيام","الحالة","ملاحظات"]:["ID","Employee","Type","From","To","Days","Status","Notes"],fLeaves.map(l=>{const emp=employees.find(e=>e.id===l.employeeId);const lt=LEAVE_TYPES.find(x=>x.id===l.type);return[l.id,a?emp?.nameAr:emp?.nameEn,a?lt?.ar:lt?.en,l.startDate,l.endDate,l.days,l.status,l.notes];}),a?"تقرير_الاجازات":"leave_report"); }
  function expD() { dlCSV(a?["رقم","الموظف","نوع","التاريخ","خروج","عودة","ساعات","ملاحظات"]:["ID","Employee","Type","Date","Out","In","Hours","Notes"],fDep.map(d=>{const emp=employees.find(e=>e.id===d.employeeId);const dt=DEP_TYPES.find(x=>x.id===d.type);return[d.id,a?emp?.nameAr:emp?.nameEn,a?dt?.ar:dt?.en,d.date,d.departureTime,d.returnTime,d.hours,d.notes];}),a?"تقرير_المغادرات":"departure_report"); }
  function expE() { dlCSV(a?["رقم الموظف","الاسم","القسم","المسمى الوظيفي","الراتب","التعيين","سنوات الخدمة","رصيد الإجازة","الهاتف","البريد","الحالة"]:["ID","Name","Department","Position","Salary","Hire Date","Years","Leave Bal.","Phone","Email","Status"],employees.map(e=>[e.id,a?e.nameAr:e.nameEn,a?e.department:e.departmentEn,a?e.position:e.positionEn,e.salary,e.startDate,svcYrs(e.startDate).toFixed(1),(e.annualLeaveBalance||0).toFixed(2),e.phone,e.email,e.status]),a?"تقرير_الموظفين":"employee_report"); }

  const rtypes=[{id:"leaves",ar:"تقرير الإجازات",en:"Leave Report",icon:"🌴"},{id:"departures",ar:"تقرير المغادرات",en:"Departure Report",icon:"🚪"},{id:"employees",ar:"تقرير الموظفين",en:"Employee Report",icon:"👥"}];
  return (
    <div>
      <STitle title={a?"التقارير":"Reports"} />
      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:16 }}>
        <div>
          <Card style={{ marginBottom:14 }}>
            <h3 style={{ margin:"0 0 12px", fontSize:14, color:NAV }}>{a?"نوع التقرير":"Report Type"}</h3>
            {rtypes.map(r=>(
              <button key={r.id} onClick={()=>setRt(r.id)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600, textAlign:a?"right":"left", marginBottom:6, display:"flex", alignItems:"center", gap:8, background:rt===r.id?NAV:"#fff", borderColor:rt===r.id?NAV:"#e0e0e0", color:rt===r.id?"#fff":"#444" }}>
                {r.icon} {a?r.ar:r.en}
              </button>
            ))}
          </Card>
          <Card>
            <h3 style={{ margin:"0 0 12px", fontSize:14, color:NAV }}>{a?"فلاتر":"Filters"}</h3>
            {rt!=="employees"&&<FF label={a?"الموظف":"Employee"}><Sel value={fEmp} onChange={setFEmp}><option value="">{a?"الكل":"All"}</option>{employees.map(e=><option key={e.id} value={e.id}>{a?e.nameAr:e.nameEn}</option>)}</Sel></FF>}
            {rt!=="employees"&&<><FF label={a?"من تاريخ":"From"}><Inp type="date" value={fFrom} onChange={setFFrom} /></FF><FF label={a?"إلى تاريخ":"To"}><Inp type="date" value={fTo} onChange={setFTo} /></FF></>}
            <Btn v="success" style={{ width:"100%" }} onClick={rt==="leaves"?expL:rt==="departures"?expD:expE}>📥 {a?"تصدير CSV":"Export CSV"}</Btn>
          </Card>
        </div>
        <Card style={{ padding:0, overflow:"hidden" }}>
          {rt==="leaves"&&<><div style={{ padding:"14px 16px", borderBottom:"1px solid #f0f0f0", fontWeight:700, color:NAV, fontSize:14 }}>🌴 {a?"تقرير الإجازات":"Leave Report"} ({fLeaves.length})</div><table style={{ width:"100%", borderCollapse:"collapse" }}><THead cols={[a?"الموظف":"Employee",a?"نوع الإجازة":"Type",a?"من":"From",a?"إلى":"To",a?"الأيام":"Days",a?"الحالة":"Status"]} /><tbody>{fLeaves.length===0?<Empty msg={a?"لا توجد بيانات":"No data"} cols={6}/>:fLeaves.map((l,i)=>{const emp=employees.find(e=>e.id===l.employeeId);const lt=LEAVE_TYPES.find(x=>x.id===l.type);return<TRow key={l.id} i={i} cells={[a?emp?.nameAr:emp?.nameEn,lt?.icon+" "+(a?lt?.ar:lt?.en),fmtDate(l.startDate,lang),fmtDate(l.endDate,lang),l.days,<Badge color={l.status==="approved"?"green":l.status==="rejected"?"red":"yellow"}>{a?(l.status==="approved"?"معتمد":l.status==="rejected"?"مرفوض":"معلق"):l.status}</Badge>]}/>;})}</tbody></table></>}
          {rt==="departures"&&<><div style={{ padding:"14px 16px", borderBottom:"1px solid #f0f0f0", fontWeight:700, color:NAV, fontSize:14 }}>🚪 {a?"تقرير المغادرات":"Departure Report"} ({fDep.length})</div><table style={{ width:"100%", borderCollapse:"collapse" }}><THead cols={[a?"الموظف":"Employee",a?"النوع":"Type",a?"التاريخ":"Date",a?"المدة":"Duration"]} /><tbody>{fDep.length===0?<Empty msg={a?"لا توجد بيانات":"No data"} cols={4}/>:fDep.map((d,i)=>{const emp=employees.find(e=>e.id===d.employeeId);const dt=DEP_TYPES.find(x=>x.id===d.type);return<TRow key={d.id} i={i} cells={[a?emp?.nameAr:emp?.nameEn,dt?.icon+" "+(a?dt?.ar:dt?.en),fmtDate(d.date,lang),<span style={{ fontWeight:700, color:"#dc2626" }}>{(d.hours||0).toFixed(2)}h</span>]}/>;})}</tbody></table></>}
          {rt==="employees"&&<><div style={{ padding:"14px 16px", borderBottom:"1px solid #f0f0f0", fontWeight:700, color:NAV, fontSize:14 }}>👥 {a?"تقرير الموظفين":"Employee Report"} ({employees.length})</div><table style={{ width:"100%", borderCollapse:"collapse" }}><THead cols={[a?"الموظف":"Employee",a?"القسم":"Dept",a?"الراتب":"Salary",a?"سنوات الخدمة":"Years",a?"رصيد الإجازة":"Balance",a?"الحالة":"Status"]} /><tbody>{employees.map((e,i)=><TRow key={e.id} i={i} cells={[<span style={{ fontWeight:600, color:NAV }}>{a?e.nameAr:e.nameEn}</span>,a?e.department:e.departmentEn,e.salary+" ₪",svcYrs(e.startDate).toFixed(1)+" "+(a?"سنة":"yr"),<span style={{ background:"#fef3c7", color:"#92400e", padding:"1px 8px", borderRadius:10, fontWeight:700 }}>{(e.annualLeaveBalance||0).toFixed(2)}</span>,<Badge color={e.status==="active"?"green":"red"}>{a?(e.status==="active"?"نشط":"غير نشط"):(e.status==="active"?"Active":"Inactive")}</Badge>]}/>)}</tbody></table></>}
        </Card>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function GharghorHR() {
  const [lang, setLang] = useState("ar");
  const [view, setView] = useState("dashboard");
  const [emp, setEmp]   = useState(() => lsGet("emp") || INIT_EMP);
  const [leaves, setLeaves]   = useState(() => lsGet("leaves") || []);
  const [dep, setDep]         = useState(() => lsGet("dep") || []);
  const [hols, setHols]       = useState(() => lsGet("hols") || []);
  const [ms, setMs]           = useState(() => lsGet("ms") || { cutoffDay:25, closedMonths:[] });
  const [pay, setPay]         = useState(() => lsGet("pay") || []);
  const [sideOpen, setSideOpen] = useState(true);
  const a = lang==="ar";

  const upd = (setter, key) => data => { setter(data); lsSet(key, data); };
  const updEmp    = upd(setEmp, "emp");
  const updLeaves = upd(setLeaves, "leaves");
  const updDep    = upd(setDep, "dep");
  const updHols   = upd(setHols, "hols");
  const updMs     = upd(setMs, "ms");
  const updPay    = upd(setPay, "pay");
  const isClosed  = (m,y) => (ms.closedMonths||[]).some(x=>x.month===m&&x.year===y);

  const nav = [
    {id:"dashboard",  icon:"🏠", ar:"لوحة التحكم",    en:"Dashboard"},
    {id:"employees",  icon:"👥", ar:"الموظفون",        en:"Employees"},
    {id:"leaves",     icon:"🌴", ar:"الإجازات",        en:"Leaves"},
    {id:"departures", icon:"🚪", ar:"المغادرات",       en:"Departures"},
    {id:"payroll",    icon:"💰", ar:"الرواتب",         en:"Payroll"},
    {id:"holidays",   icon:"📅", ar:"العطل الرسمية",   en:"Holidays"},
    {id:"monthClose", icon:"🔒", ar:"تسكير الشهر",    en:"Month Closing"},
    {id:"letters",    icon:"📄", ar:"الكتب الإدارية", en:"Admin Letters"},
    {id:"reports",    icon:"📊", ar:"التقارير",        en:"Reports"},
  ];

  return (
    <div dir={a?"rtl":"ltr"} style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:a?"'Cairo',sans-serif":"'Poppins',sans-serif", background:"#f0f4f8" }}>

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <div style={{ width:sideOpen?252:68, background:`linear-gradient(180deg,${NAV} 0%,#162040 100%)`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden", transition:"width .3s ease", boxShadow:"4px 0 16px rgba(0,0,0,0.18)" }}>
        <div style={{ padding:"18px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${GOLD},#e8b84b)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🏢</div>
            {sideOpen&&<div><div style={{ color:GOLD, fontWeight:800, fontSize:11.5, lineHeight:1.3 }}>{a?"شركة غرغور التجارية":"Gharghor Trading Co."}</div><div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginTop:1 }}>{a?"نظام الموارد البشرية":"HR Management System"}</div></div>}
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"8px 6px" }}>
          {nav.map(item=>{ const ac=view===item.id; return (
            <button key={item.id} onClick={()=>setView(item.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"9px 10px", borderRadius:9, border:"none", cursor:"pointer", marginBottom:2, fontFamily:"inherit", background:ac?"rgba(201,162,39,0.18)":"transparent", borderLeft:ac&&!a?"3px solid #c9a227":"3px solid transparent", borderRight:ac&&a?"3px solid #c9a227":"3px solid transparent", color:ac?GOLD:"rgba(255,255,255,0.62)", fontWeight:ac?700:400, fontSize:13, textAlign:a?"right":"left", transition:"all .2s" }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
              {sideOpen&&<span>{a?item.ar:item.en}</span>}
            </button>
          );})}
        </div>
        <div style={{ padding:"10px 6px", borderTop:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
          <button onClick={()=>setLang(l=>l==="ar"?"en":"ar")} style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid rgba(201,162,39,0.35)", background:"rgba(201,162,39,0.1)", color:GOLD, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, marginBottom:4 }}>
            {sideOpen?(a?"🌐 English":"🌐 عربي"):"🌐"}
          </button>
          <button onClick={()=>setSideOpen(o=>!o)} style={{ width:"100%", padding:"6px", borderRadius:8, border:"none", background:"transparent", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
            {sideOpen?(a?"◀ طي":"▶ Collapse"):(a?"▶":"◀")}
          </button>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ background:"#fff", height:58, padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", flexShrink:0 }}>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:NAV }}>{nav.find(n=>n.id===view)?.[a?"ar":"en"]}</h1>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <span style={{ fontSize:12, color:"#888" }}>{new Date().toLocaleDateString(a?"ar-EG":"en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</span>
            <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${NAV},#1a3a6e)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700 }}>HR</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:22 }}>
          {view==="dashboard"  && <Dashboard     lang={lang} employees={emp} leaves={leaves} departures={dep} />}
          {view==="employees"  && <EmployeesView lang={lang} employees={emp} updateEmployees={updEmp} />}
          {view==="leaves"     && <LeavesView    lang={lang} employees={emp} leaves={leaves} updateLeaves={updLeaves} updateEmployees={updEmp} holidays={hols} isMonthClosed={isClosed} />}
          {view==="departures" && <DeparturesView lang={lang} employees={emp} departures={dep} updateDepartures={updDep} isMonthClosed={isClosed} />}
          {view==="payroll"    && <PayrollView   lang={lang} employees={emp} payroll={pay} updatePayroll={updPay} leaves={leaves} departures={dep} isMonthClosed={isClosed} />}
          {view==="holidays"   && <HolidaysView  lang={lang} holidays={hols} updateHolidays={updHols} employees={emp} />}
          {view==="monthClose" && <MonthCloseView lang={lang} monthSettings={ms} updateMonthSettings={updMs} employees={emp} departures={dep} updateEmployees={updEmp} />}
          {view==="letters"    && <LettersView   lang={lang} employees={emp} />}
          {view==="reports"    && <ReportsView   lang={lang} employees={emp} leaves={leaves} departures={dep} payroll={pay} />}
        </div>
      </div>
    </div>
  );
}
