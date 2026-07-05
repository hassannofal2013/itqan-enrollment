import { useState, useEffect } from "react";

const SHEETS_URL  = "https://script.google.com/macros/s/AKfycbwcnTVWK1tFFgb8XCp3veZCCPPBy6NFsTsPYvhlcs28nsb_1dkvWksQnD0GuPcsEcQrzA/exec";
const SCHOOL_EMAIL = "itqanschule@gmail.com";
const YEAR_FULL   = "2026/2027";
const BLUE  = "#2E5DA8";
const GOLD  = "#C8960A";
const GREEN = "#3A7D3A";
const CAPACITY = {
  "Vorschule 1": { "Samstag":{"09:00–12:45":16,"13:00–16:45":16}, "Sonntag":{"09:00–12:45":20,"13:00–16:45":24} },
  "Vorschule 2": { "Samstag":{"09:00–12:45":24,"13:00–16:45":24}, "Sonntag":{"09:00–12:45":16,"13:00–16:45":24} },
  "Vorschule 3": { "Samstag":{"09:00–12:45":23,"13:00–16:45":32}, "Sonntag":{"09:00–12:45":16,"13:00–16:45":24} },
  "Klasse 1":    { "Samstag":{"09:00–12:45":20,"13:00–16:45":20}, "Sonntag":{"09:00–12:45":23,"13:00–16:45":24} },
  "Klasse 2":    { "Samstag":{"09:00–12:45":16,"13:00–16:45":12}, "Sonntag":{"09:00–12:45":12,"13:00–16:45":24} },
  "Klasse 3":    { "Samstag":{"09:00–12:45":null,"13:00–16:45":12},"Sonntag":{"09:00–12:45":12,"13:00–16:45":24} },
  "Klasse 4":    { "Samstag":{"09:00–12:45":12,"13:00–16:45":null},"Sonntag":{"09:00–12:45":12,"13:00–16:45":24} },
  "Klasse 5":    { "Samstag":{"09:00–12:45":12,"13:00–16:45":12}, "Sonntag":{"09:00–12:45":12,"13:00–16:45":24} },
};
const getCapacity = (grade,day,sess) => CAPACITY[grade]?.[day]?.[sess] ?? null;

const GRADES = [
  { ar:"تحضيري 1", de:"Vorschule 1", code:"PRE1" },
  { ar:"تحضيري 2", de:"Vorschule 2", code:"PRE2" },
  { ar:"تحضيري 3", de:"Vorschule 3", code:"PRE3" },
  { ar:"الصف الأول",   de:"Klasse 1", code:"1" },
  { ar:"الصف الثاني",  de:"Klasse 2", code:"2" },
  { ar:"الصف الثالث",  de:"Klasse 3", code:"3" },
  { ar:"الصف الرابع",  de:"Klasse 4", code:"4" },
  { ar:"الصف الخامس",  de:"Klasse 5", code:"5" },
  { ar:"مطلوب اختبار تحديد مستوى", de:"Einstufungstest erforderlich", code:"TEST" },
];

const SCHOOLS = [
  { key:"Arabisch", ar:"مدرسة اللغة العربية", de:"Arabisch-Schule", icon:"📖", fee:350, color:BLUE },
  { key:"Koran",    ar:"مدرسة القرآن الكريم", de:"Koran-Schule",    icon:"🕌", fee:200, color:GREEN },
  { key:"Beide",    ar:"المدرستان معاً",       de:"Beide Schulen",   icon:"🎓", fee:550, color:"#7B2DA8" },
];

const DAYS     = ["Samstag / السبت", "Sonntag / الأحد"];
const SESSIONS = ["09:00–12:45", "13:00–16:45"];
const DAYS_KEY     = ["Samstag", "Sonntag"];

const STEPS = [
  ["بيانات ولي الأمر","Erziehungsberechtigte"],
  ["بيانات الأبناء","Kinder"],
  ["المراجعة والإرسال","Überprüfung"],
];

const LATIN_ONLY = /^[a-zA-ZäöüÄÖÜß\s\-'.]*$/;
const isLatin = v => LATIN_ONLY.test(v);
const emptyChild = () => ({
  name:"", nameErr:false, dob:"", grade:"", gradeCode:"", gradeAr:"",
  school:null, day:"", session:"",
  photo:null, photoPreview:null, photoBase64:null
});

// ─── Seat availability display ────────────────────────────────────────────────
function SeatPicker({ grade, availability, selectedDay, selectedSession, onSelect }) {
  if (!grade || grade === "Einstufungstest erforderlich") return null;

  return (
    <div style={{ marginTop:10 }}>
      <div style={{ fontSize:12, fontWeight:600, color:BLUE, direction:"rtl", marginBottom:8 }}>
        اختر يوم ووقت الدراسة / Unterrichtstag und -zeit wählen:
      </div>
      {DAYS_KEY.map((day, di) => (
        <div key={day} style={{ marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#1a3a1a", marginBottom:6 }}>{DAYS[di]}</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {SESSIONS.map(sess => {
              const cap = getCapacity(grade, day, sess);

              // غير متاح لهذا الصف/اليوم/الوقت
              if (cap === null) return (
                <div key={sess} style={{ padding:"10px 14px", borderRadius:10, minWidth:150,
                  border:"2px solid #e0e0e0", background:"#f5f5f5", opacity:0.5 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#999" }}>{sess}</div>
                  <div style={{ fontSize:11, marginTop:4, color:"#bbb" }}>— غير متاح / Nicht verfügbar</div>
                </div>
              );

              // بيانات من السيرفر أو تقدير محلي
              const slot      = availability?.[grade]?.[day]?.[sess];
              const used      = slot?.used ?? 0;
              const avail     = slot?.available ?? cap;
              const isFull    = slot ? slot.full : false;
              const isSelected = selectedDay === day && selectedSession === sess;

              return (
                <div key={sess} onClick={() => !isFull && onSelect(day, sess)}
                  style={{ padding:"10px 14px", borderRadius:10,
                    cursor: isFull ? "not-allowed" : "pointer", minWidth:150,
                    border:`2px solid ${isSelected?BLUE:isFull?"#e0c0c0":"#d0e8d8"}`,
                    background: isSelected?"#eaf0ff":isFull?"#fff0f0":"#f8fdf9",
                    opacity: isFull?0.7:1, transition:"all 0.15s" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:isSelected?BLUE:isFull?"#c0392b":"#1a3a1a" }}>
                    {sess}
                  </div>
                  <div style={{ fontSize:11, marginTop:4,
                    color: isFull?"#c0392b": avail<=3?"#e07000":"#3a7a3a" }}>
                    {isFull
                      ? "🚫 المقاعد ممتلئة / Ausgebucht"
                      : !availability
                        ? `${cap} مقعد / Plätze gesamt`
                        : avail<=3
                          ? `⚠ ${avail} متبقي / Plätze frei`
                          : `✅ ${avail} / ${cap} مقعد / Plätze`
                    }
                  </div>
                  {availability && (
                    <div style={{ marginTop:6, height:4, borderRadius:2, background:"#e0e0e0", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(100,(used/cap)*100)}%`,
                        background:isFull?"#c0392b":avail<=3?"#e07000":"#3a7a3a", transition:"width 0.3s" }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]         = useState(0);
  const [parent, setParent]     = useState({ name:"", nameErr:false, email:"", address:"", phone:"" });
  const [children, setChildren] = useState([emptyChild()]);
  const [errors, setErrors]     = useState({});
  const [status, setStatus]     = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [finalData, setFinalData] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loadingAvail, setLoadingAvail] = useState(false);

  // جلب المقاعد المتاحة عند فتح خطوة الأبناء
  useEffect(() => {
    if (step === 1 && !availability) {
      setLoadingAvail(true);
      fetch(SHEETS_URL)
        .then(r => r.json())
        .then(d => { if (d.availability) setAvailability(d.availability); })
        .catch(() => {})
        .finally(() => setLoadingAvail(false));
    }
  }, [step]);

  const up = (k,v) => setParent(p=>({...p,[k]:v}));
  const uc = (i,k,v) => setChildren(c=>c.map((ch,j)=>j===i?{...ch,[k]:v}:ch));

  const handleParentName = v => {
    const ok = isLatin(v);
    setParent(p=>({...p, name:ok?v:p.name, nameErr:!ok&&v.length>0}));
  };
  const handleChildName = (i,v) => {
    const ok = isLatin(v);
    uc(i,"name",ok?v:children[i].name);
    uc(i,"nameErr",!ok&&v.length>0);
  };
  const handlePhoto = (i,file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => { uc(i,"photoPreview",e.target.result); uc(i,"photoBase64",e.target.result.split(",")[1]); };
    r.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (step===0) {
      if (!parent.name.trim()||!isLatin(parent.name)) e.name=1;
      if (!/\S+@\S+\.\S+/.test(parent.email)) e.email=1;
      if (!parent.address.trim()) e.address=1;
      if (parent.phone.trim().length<9) e.phone=1;
    }
    if (step===1) children.forEach((ch,i)=>{
      if (!ch.name.trim()||!isLatin(ch.name)) e[`cn${i}`]=1;
      if (!ch.dob) e[`cd${i}`]=1;
      if (!ch.school) e[`cs${i}`]=1;
      const needsGrade = ch.school?.key==="Arabisch"||ch.school?.key==="Beide";
      if (needsGrade && !ch.grade) e[`cg${i}`]=1;
      const isTest = ch.grade==="Einstufungstest erforderlich";
      if (needsGrade && ch.grade && !isTest && (!ch.day||!ch.session)) e[`ct${i}`]=1;
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => { if(validate()) setStep(s=>s+1); };
  const prev = () => setStep(s=>s-1);

  const handleSubmit = async () => {
    if (!validate()) return;
    setStatus("sending");
    setStatusMsg("جاري الإرسال... / Wird gesendet...");
    const fd = { parent, children, photoConsent:true, submittedAt:new Date().toLocaleString("de-DE") };
    setFinalData(fd);
    try {
      const response = await fetch(SHEETS_URL, {
        method:"POST", mode:"cors",
        headers:{"Content-Type":"text/plain"},
        body: JSON.stringify({
          parent,
          children: children.map(ch=>({
            name:ch.name, dob:ch.dob, grade:ch.grade, gradeAr:ch.gradeAr,
            school:ch.school, ids:ch.ids||[],
            day:ch.day||"", session:ch.session||"",
            photoBase64:ch.photoBase64||null,
          })),
          photoConsent:true, submittedAt:fd.submittedAt,
        })
      });
      const result = await response.json();
      if (result.status==="ok" && result.children) {
        setFinalData(prev=>({...prev,
          children:prev.children.map((ch,i)=>({...ch,ids:result.children[i]?.ids||ch.ids||[]}))
        }));
      }
      if (result.status==="error") setStatusMsg("⚠ "+result.message);
      setStatus("success"); setStatusMsg("");
    } catch(err) {
      setStatus("success");
      setStatusMsg("تم الحفظ — يرجى التحقق من الاتصال / Verbindung prüfen");
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (status==="success" && finalData) return (
    <div style={S.page}>
      <div style={S.successCard}>
        <div style={{ width:70,height:70,borderRadius:"50%",background:"#1a6b3c",color:"#fff",fontSize:34,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}>✓</div>
        <div style={{ fontSize:20,fontWeight:700,color:"#0d3b26",direction:"rtl",marginBottom:4 }}>تم التسجيل بنجاح!</div>
        <div style={{ fontSize:13,color:"#5a7a6a",direction:"ltr",marginBottom:20 }}>Anmeldung erfolgreich übermittelt!</div>
        {statusMsg && <div style={{ background:"#fff8e1",border:"1px solid #f0c040",borderRadius:8,padding:"8px 14px",fontSize:12,color:"#7a6000",marginBottom:12 }}>{statusMsg}</div>}

        <div style={{ background:"#f0f4ff",borderRadius:12,padding:"14px 16px",marginBottom:18,border:`1px solid ${BLUE}` }}>
          <div style={{ fontWeight:700,color:BLUE,direction:"rtl",marginBottom:8,fontSize:13 }}>📧 سيتم إرسال العقد إلى / Vertrag gesendet an:</div>
          <div style={{ fontSize:13,direction:"rtl" }}>• <strong>{finalData.parent.email}</strong> — العقد كاملاً</div>
          <div style={{ fontSize:13,direction:"rtl",marginTop:4 }}>• <strong>{SCHOOL_EMAIL}</strong> — العقد + بطاقات التعريف</div>
        </div>

        <div style={{ fontWeight:700,color:"#0d3b26",direction:"rtl",marginBottom:10 }}>🎓 أرقام التعريف / Schüler-IDs:</div>
        {finalData.children.map((ch,i)=>(
          <div key={i} style={{ background:"#f0f9f3",borderRadius:10,padding:"12px 16px",marginBottom:10,border:"1.5px solid #c8e8d5" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
              {ch.photoPreview && <img src={ch.photoPreview} alt="" style={{ width:38,height:46,borderRadius:6,objectFit:"cover",border:"2px solid "+BLUE }}/>}
              <div>
                <strong style={{ display:"block" }}>{ch.name}</strong>
                <span style={{ fontSize:11,color:"#5a7a6a" }}>{ch.grade} | {ch.school?.icon} {ch.school?.de}</span>
                {ch.day && <span style={{ fontSize:11,color:BLUE,display:"block" }}>📅 {ch.day} | ⏰ {ch.session}</span>}
              </div>
            </div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {(ch.ids||[]).map((id,j)=>(
                <div key={j} style={{ fontFamily:"monospace",background:j===0?"#e8f0ff":"#eaffea",borderRadius:6,padding:"5px 10px",color:j===0?BLUE:GREEN,fontWeight:700,border:`1px solid ${j===0?BLUE:GREEN}`,fontSize:13 }}>
                  {j===0?"📖":"🕌"} {id}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ fontSize:11,color:"#9aaa9a",marginTop:10,textAlign:"center",direction:"rtl" }}>احتفظ بهذه الأرقام للرجوع إليها مستقبلاً</div>
      </div>
    </div>
  );

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={{ maxWidth:660,margin:"0 auto 18px",textAlign:"center" }}>
        <div style={{ fontSize:42,marginBottom:6 }}>📚</div>
        <div style={{ fontSize:19,fontWeight:700,color:"#fff",direction:"rtl" }}>مدرسة إتقان — Itqan Schule</div>
        <div style={{ fontSize:12,color:"#c0ddc0",direction:"ltr" }}>استمارة طلب الالتحاق / Anmeldeformular {YEAR_FULL}</div>
      </div>

      {/* Stepper */}
      <div style={{ maxWidth:660,margin:"0 auto 16px",display:"flex" }}>
        {STEPS.map(([ar,de],i)=>(
          <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative" }}>
            <div style={{ width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,zIndex:1,border:"2px solid",
              ...(i<step?{background:GOLD,color:"#1a1a1a",borderColor:GOLD}:i===step?{background:"#fff",color:BLUE,borderColor:"#fff"}:{background:"rgba(255,255,255,0.15)",color:"#fff",borderColor:"rgba(255,255,255,0.3)"})
            }}>{i<step?"✓":i+1}</div>
            <div style={{ textAlign:"center",marginTop:5 }}>
              <div style={{ fontSize:9,color:i===step?GOLD:"rgba(255,255,255,0.5)",fontWeight:i===step?700:400,direction:"rtl" }}>{ar}</div>
              <div style={{ fontSize:8,color:i===step?"#d4ac30":"rgba(255,255,255,0.3)",direction:"ltr" }}>{de}</div>
            </div>
            {i<STEPS.length-1 && <div style={{ position:"absolute",top:15,right:"50%",width:"100%",height:2,background:i<step?GOLD:"rgba(255,255,255,0.2)",zIndex:0 }}/>}
          </div>
        ))}
      </div>

      <div style={S.card}>

        {/* STEP 0: Parent */}
        {step===0 && <>
          <SecTitle ar="بيانات ولي الأمر" de="Angaben zum Erziehungsberechtigten"/>
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>
              <span style={{ display:"block",direction:"rtl" }}>الاسم الكامل</span>
              <span style={{ display:"block",fontSize:"0.8em",color:"#5a7a6a",direction:"ltr" }}>Vollständiger Name (Lateinische Buchstaben)</span>
            </label>
            <input style={inp(errors.name||parent.nameErr)} placeholder="Vor- und Nachname"
              value={parent.name} onChange={e=>handleParentName(e.target.value)}/>
            {parent.nameErr && <Err ar="يُرجى الكتابة بالحروف الألمانية فقط" de="Nur lateinische Buchstaben erlaubt"/>}
            {errors.name && !parent.nameErr && <div style={{ color:"#e05555",fontSize:11,marginTop:3 }}>Pflichtfeld / مطلوب</div>}
          </div>
          <Fld ar="البريد الإلكتروني" de="E-Mail-Adresse" err={errors.email}>
            <input style={inp(errors.email)} type="email" placeholder="beispiel@email.de" value={parent.email} onChange={e=>up("email",e.target.value)}/>
          </Fld>
          <Fld ar="العنوان الكامل" de="Vollständige Adresse" err={errors.address}>
            <input style={inp(errors.address)} placeholder="Straße Nr., PLZ Ort" value={parent.address} onChange={e=>up("address",e.target.value)}/>
          </Fld>
          <Fld ar="رقم الجوال / واتساب" de="Handynummer / WhatsApp" err={errors.phone}>
            <input style={inp(errors.phone)} placeholder="+49 1XX XXXXXXXX" value={parent.phone} onChange={e=>up("phone",e.target.value)}/>
          </Fld>
        </>}

        {/* STEP 1: Children */}
        {step===1 && <>
          <SecTitle ar="بيانات الأبناء واختيار المدرسة" de="Kinder & Schulwahl"/>
          {loadingAvail && <div style={{ textAlign:"center",color:BLUE,fontSize:12,marginBottom:12 }}>⏳ جاري تحميل المقاعد المتاحة... / Verfügbarkeit wird geladen...</div>}

          {children.map((ch,i)=>(
            <div key={i} style={{ background:"#f0f9f3",border:"1.5px solid #c8e8d5",borderRadius:14,padding:"16px",marginBottom:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                <span style={{ fontWeight:700,color:"#0d3b26",fontSize:14 }}>
                  <span style={{ direction:"rtl" }}>الطفل {i+1}</span>
                  <span style={{ color:"#7aaa8a",fontSize:11,marginRight:6 }}> / Kind {i+1}</span>
                </span>
                {children.length>1 && <button style={{ background:"#ffe0e0",color:"#c0392b",border:"none",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:12 }} onClick={()=>setChildren(c=>c.filter((_,j)=>j!==i))}>✕ Entfernen</button>}
              </div>

              {/* Name */}
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>
                  <span style={{ display:"block",direction:"rtl" }}>اسم الطفل</span>
                  <span style={{ display:"block",fontSize:"0.8em",color:"#5a7a6a",direction:"ltr" }}>Name des Kindes (Lateinische Buchstaben)</span>
                </label>
                <input style={inp(errors[`cn${i}`]||ch.nameErr)} placeholder="Vor- und Nachname"
                  value={ch.name} onChange={e=>handleChildName(i,e.target.value)}/>
                {ch.nameErr && <Err ar="يُرجى الكتابة بالحروف الألمانية فقط" de="Nur lateinische Buchstaben erlaubt"/>}
              </div>

              {/* DOB */}
              <Fld ar="تاريخ الميلاد" de="Geburtsdatum" err={errors[`cd${i}`]}>
                <input style={inp(errors[`cd${i}`])} type="date" value={ch.dob} onChange={e=>uc(i,"dob",e.target.value)}/>
              </Fld>

              {/* School */}
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>
                  <span style={{ display:"block",direction:"rtl" }}>المدرسة المراد الالتحاق بها</span>
                  <span style={{ display:"block",fontSize:"0.8em",color:"#5a7a6a",direction:"ltr" }}>Schulwahl für dieses Kind</span>
                </label>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {SCHOOLS.map(sc=>(
                    <div key={sc.key} onClick={()=>{
                      uc(i,"school",sc);
                      if(sc.key==="Koran"){ uc(i,"grade",""); uc(i,"gradeCode",""); uc(i,"gradeAr",""); uc(i,"day",""); uc(i,"session",""); }
                    }} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",border:`2px solid ${ch.school?.key===sc.key?sc.color:"#d0e8d8"}`,borderRadius:10,cursor:"pointer",background:ch.school?.key===sc.key?"#f0f4ff":"#f8fdf9",transition:"all 0.15s" }}>
                      <span style={{ fontSize:20 }}>{sc.icon}</span>
                      <span style={{ flex:1 }}>
                        <span style={{ fontWeight:600,display:"block",direction:"rtl",color:"#1a3a1a",fontSize:13 }}>{sc.ar}</span>
                        <span style={{ fontSize:11,color:"#5a7a6a" }}>{sc.de} — {sc.fee}€/Jahr</span>
                      </span>
                      {ch.school?.key===sc.key && <span style={{ width:22,height:22,borderRadius:"50%",background:sc.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12 }}>✓</span>}
                    </div>
                  ))}
                </div>
                {errors[`cs${i}`] && <div style={{ color:"#e05555",fontSize:11,marginTop:4 }}>يرجى اختيار المدرسة / Bitte Schule wählen</div>}
              </div>

              {/* Grade — بعد اختيار المدرسة مباشرةً */}
              {(ch.school?.key==="Arabisch"||ch.school?.key==="Beide") ? (
                <>
                  <Fld ar="الصف الدراسي (مدرسة اللغة العربية)" de="Schulklasse (Arabisch-Schule)" err={errors[`cg${i}`]}>
                    <select style={inp(errors[`cg${i}`])} value={ch.grade} onChange={e=>{
                      const g=GRADES.find(g=>g.de===e.target.value);
                      uc(i,"grade",e.target.value); uc(i,"gradeCode",g?.code||""); uc(i,"gradeAr",g?.ar||"");
                      uc(i,"day",""); uc(i,"session",""); // إعادة ضبط الموعد عند تغيير الصف
                    }}>
                      <option value="">-- Klasse wählen / اختر الصف --</option>
                      {GRADES.map(g=><option key={g.code} value={g.de}>{g.de} / {g.ar}</option>)}
                    </select>
                  </Fld>

                  {/* اختيار الموعد — يظهر بعد اختيار الصف وليس اختبار تحديد المستوى */}
                  {ch.grade && ch.grade !== "Einstufungstest erforderlich" && (
                    <div style={{ marginBottom:14 }}>
                      <label style={S.label}>
                        <span style={{ display:"block",direction:"rtl" }}>وقت الدراسة / Unterrichtszeit</span>
                        <span style={{ display:"block",fontSize:"0.8em",color:"#5a7a6a",direction:"ltr" }}>Tag und Uhrzeit auswählen</span>
                      </label>
                      <SeatPicker
                        grade={ch.grade}
                        availability={availability}
                        selectedDay={ch.day}
                        selectedSession={ch.session}
                        onSelect={(day,sess)=>{ uc(i,"day",day); uc(i,"session",sess); }}
                      />
                      {errors[`ct${i}`] && <div style={{ color:"#e05555",fontSize:11,marginTop:6 }}>
                        <span style={{ direction:"rtl",display:"block" }}>يرجى اختيار يوم ووقت الدراسة</span>
                        <span style={{ direction:"ltr",display:"block" }}>Bitte Tag und Uhrzeit wählen</span>
                      </div>}
                    </div>
                  )}
                  {ch.grade === "Einstufungstest erforderlich" && (
                    <div style={{ background:"#fff8e1",border:"1px solid #f0c040",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#7a5000" }}>
                      <span style={{ direction:"rtl",display:"block",fontWeight:600 }}>📝 سيتم التواصل معك لتحديد موعد اختبار تحديد المستوى</span>
                      <span style={{ direction:"ltr",display:"block",marginTop:2 }}>We will contact you to schedule the placement test.</span>
                    </div>
                  )}
                </>
              ) : ch.school?.key==="Koran" ? (
                <div style={{ marginBottom:14,background:"#eaffea",border:"1px solid #3A7D3A",borderRadius:10,padding:"10px 14px" }}>
                  <div style={{ fontSize:13,fontWeight:600,color:"#3A7D3A",direction:"rtl" }}>🕌 مدرسة القرآن الكريم</div>
                  <div style={{ fontSize:11,color:"#5a9a5a",direction:"ltr",marginTop:3 }}>Koran-Schule — kein Klassenauswahl erforderlich</div>
                </div>
              ) : null}

              {/* Photo */}
              <div>
                <label style={S.label}>
                  <span style={{ display:"block",direction:"rtl" }}>📷 صورة الطفل (لبطاقة التعريف)</span>
                  <span style={{ fontSize:"0.8em",color:"#5a7a6a" }}>Foto des Kindes (für Schülerausweis)</span>
                </label>
                <label style={{ display:"block",cursor:"pointer",width:88,height:106,borderRadius:10,overflow:"hidden",border:"2px dashed #a0ccb0" }}>
                  {ch.photoPreview
                    ? <img src={ch.photoPreview} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                    : <div style={{ width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#e8f5ee",color:"#5a9a6a",fontSize:11,textAlign:"center",gap:4 }}>
                        <span style={{ fontSize:26 }}>📷</span>
                        <span style={{ direction:"rtl" }}>رفع صورة</span>
                        <span>Foto</span>
                      </div>}
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handlePhoto(i,e.target.files[0])}/>
                </label>
              </div>
            </div>
          ))}

          <button style={{ width:"100%",padding:"11px",background:"transparent",border:"2px dashed #4a9a6a",color:"#2d7a4f",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:16 }}
            onClick={()=>setChildren(c=>[...c,emptyChild()])}>
            + إضافة طفل آخر / Weiteres Kind hinzufügen
          </button>

          {/* Photo consent */}
          <div style={{ background:"#fff8e1",border:"1.5px solid #f0c040",borderRadius:12,padding:"14px 16px" }}>
            <div style={{ fontWeight:700,color:"#5a4000",direction:"rtl",marginBottom:4,fontSize:13 }}>📸 موافقة التصوير / Foto-Einwilligung</div>
            <div style={{ fontSize:11,color:"#5a4000",direction:"rtl",lineHeight:1.6,marginBottom:4 }}>بالتسجيل، يوافق ولي الأمر على تصوير الطفل خلال الأنشطة المدرسية لأغراض التوثيق والإعلام.</div>
            <div style={{ fontSize:10,color:"#7a6000",direction:"ltr" }}>By registering, the guardian agrees to the use of photos/videos during school activities.</div>
            <div style={{ marginTop:8,background:"#fff3cc",borderRadius:8,padding:"7px 12px",fontWeight:700,color:"#5a4000",fontSize:12,textAlign:"center" }}>
              ✅ موافقة تلقائية عند التسجيل / Mit der Anmeldung automatisch zugestimmt
            </div>
          </div>
        </>}

        {/* STEP 2: Review */}
        {step===2 && <>
          <SecTitle ar="مراجعة البيانات قبل الإرسال" de="Daten überprüfen"/>
          <RevSec ar="ولي الأمر" de="Erziehungsberechtigte/r">
            <RR ar="الاسم" de="Name" val={parent.name}/>
            <RR ar="الإيميل" de="E-Mail" val={parent.email}/>
            <RR ar="العنوان" de="Adresse" val={parent.address}/>
            <RR ar="الجوال" de="Handy" val={parent.phone}/>
          </RevSec>
          <RevSec ar="الأبناء" de="Kinder">
            {children.map((ch,i)=>(
              <div key={i} style={{ borderTop:i?"1px dashed #b0d8c0":"none",paddingTop:i?10:0,marginTop:i?10:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                  {ch.photoPreview && <img src={ch.photoPreview} alt="" style={{ width:36,height:44,borderRadius:6,objectFit:"cover",border:"2px solid "+BLUE }}/>}
                  <div>
                    <strong>{ch.name}</strong>
                    <div style={{ fontSize:11,color:"#5a7a6a" }}>{ch.grade} | {ch.dob}</div>
                    <div style={{ fontSize:11,color:ch.school?.color||"#555",fontWeight:600 }}>{ch.school?.icon} {ch.school?.de} — {ch.school?.fee}€</div>
                    {ch.day && <div style={{ fontSize:11,color:BLUE }}>📅 {ch.day} | ⏰ {ch.session}</div>}
                  </div>
                </div>
              </div>
            ))}
          </RevSec>
          <div style={{ background:"#f0f4ff",border:`1.5px solid ${BLUE}`,borderRadius:12,padding:"14px 16px",textAlign:"center" }}>
            <div style={{ fontSize:22,marginBottom:8 }}>📧</div>
            <div style={{ fontSize:14,fontWeight:700,color:"#0d3b26",direction:"rtl",marginBottom:4 }}>سيتم إرسال العقد إلى إيميل ولي الأمر</div>
            <div style={{ fontSize:12,color:BLUE,direction:"ltr",fontWeight:600,marginBottom:8 }}>The contract will be sent to the guardian's email</div>
            <div style={{ background:"#fff",borderRadius:8,padding:"8px 14px",border:"1px solid #d0d8f0",fontSize:13,color:"#3a5a7a" }}>
              <strong>{parent.email}</strong>
            </div>
          </div>
        </>}

        {/* Navigation */}
        <div style={{ display:"flex",alignItems:"center",marginTop:20,paddingTop:14,borderTop:"1px solid #e8f0ea" }}>
          {step>0 && <button style={S.backBtn} onClick={prev}>
            <div style={{ direction:"rtl",fontSize:13 }}>السابق ←</div>
            <div style={{ fontSize:10,color:"#7aaa8a" }}>← Zurück</div>
          </button>}
          <div style={{ flex:1 }}/>
          {step<STEPS.length-1
            ? <button style={S.nextBtn} onClick={next}>
                <div style={{ direction:"rtl",fontSize:13 }}>التالي ←</div>
                <div style={{ fontSize:10,color:"#a0c0ff" }}>Weiter →</div>
              </button>
            : <button style={{ ...S.submitBtn,opacity:status==="sending"?0.7:1,cursor:status==="sending"?"wait":"pointer" }}
                onClick={handleSubmit} disabled={status==="sending"}>
                <div style={{ direction:"rtl",fontSize:13 }}>{status==="sending"?"⏳ جاري الإرسال...":"✓ إرسال الطلب"}</div>
                <div style={{ fontSize:10,color:"#5a4000" }}>{status==="sending"?"Wird gesendet...":"Antrag absenden"}</div>
              </button>}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SecTitle = ({ar,de}) => (
  <div style={{ marginBottom:18,paddingBottom:10,borderBottom:"2px solid #e8f5ee" }}>
    <div style={{ fontSize:17,fontWeight:700,color:"#0d3b26",direction:"rtl" }}>{ar}</div>
    <div style={{ fontSize:12,color:"#5a9a6a",direction:"ltr",marginTop:2 }}>{de}</div>
  </div>
);
const Fld = ({ar,de,err,children}) => (
  <div style={{ marginBottom:14 }}>
    <label style={S.label}>
      <span style={{ display:"block",direction:"rtl" }}>{ar}</span>
      <span style={{ display:"block",fontSize:"0.8em",color:"#5a7a6a",direction:"ltr" }}>{de}</span>
    </label>
    {children}
    {err && <div style={{ color:"#e05555",fontSize:11,marginTop:3 }}>Pflichtfeld / مطلوب</div>}
  </div>
);
const Err = ({ar,de}) => (
  <div style={{ color:"#e05555",fontSize:11,marginTop:3 }}>
    <span style={{ direction:"rtl",display:"block" }}>⚠ {ar}</span>
    <span style={{ direction:"ltr",display:"block" }}>{de}</span>
  </div>
);
const RevSec = ({ar,de,children}) => (
  <div style={{ marginBottom:14,background:"#f8fdf9",borderRadius:12,padding:"12px 14px",border:"1px solid #d8eee2" }}>
    <div style={{ fontWeight:700,color:"#0d3b26",marginBottom:8 }}>
      <span style={{ direction:"rtl",display:"block",fontSize:13 }}>{ar}</span>
      <span style={{ direction:"ltr",display:"block",fontSize:10,color:"#5a9a6a" }}>{de}</span>
    </div>
    {children}
  </div>
);
const RR = ({ar,de,val}) => (
  <div style={{ display:"flex",gap:8,marginBottom:5,fontSize:12 }}>
    <span style={{ minWidth:110 }}>
      <span style={{ color:"#5a7a6a",direction:"rtl",display:"block" }}>{ar}</span>
      <span style={{ color:"#9aaa9a",fontSize:10,direction:"ltr" }}>{de}</span>
    </span>
    <span style={{ fontWeight:600,color:"#1a3a1a",flex:1 }}>{val}</span>
  </div>
);
const inp = e => ({ ...S.input,...(e?{border:"1.5px solid #e05555"}:{}) });
const S = {
  page:{ minHeight:"100vh",background:"linear-gradient(135deg,#0d3b26 0%,#1a6b3c 100%)",padding:"20px 14px",fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif" },
  card:{ maxWidth:660,margin:"0 auto",background:"#fff",borderRadius:20,padding:"22px 18px 16px",boxShadow:"0 20px 60px rgba(0,0,0,0.25)" },
  successCard:{ maxWidth:540,margin:"40px auto",background:"#fff",borderRadius:24,padding:"40px 28px",boxShadow:"0 20px 60px rgba(0,0,0,0.25)" },
  label:{ display:"block",marginBottom:5,fontWeight:600,color:"#2d5a3d",fontSize:13 },
  input:{ width:"100%",padding:"9px 12px",border:"1.5px solid #d0e8d8",borderRadius:10,fontSize:14,color:"#1a3a1a",background:"#f8fdf9",boxSizing:"border-box",outline:"none",direction:"ltr" },
  backBtn:{ padding:"10px 18px",background:"#f0f4f0",border:"none",borderRadius:10,color:"#3a6a4a",fontWeight:600,cursor:"pointer" },
  nextBtn:{ padding:"10px 24px",background:`linear-gradient(135deg,${BLUE},#1a3a8a)`,border:"none",borderRadius:12,color:"#fff",fontWeight:700,cursor:"pointer" },
  submitBtn:{ padding:"10px 24px",background:`linear-gradient(135deg,${GOLD},#a07000)`,border:"none",borderRadius:12,color:"#1a1a1a",fontWeight:700 },
};
