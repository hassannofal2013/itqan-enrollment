import { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY = "4mH8vLefPnezHWPnx";
const EMAILJS_SERVICE_ID = "service_w2djxq3";
const SCHOOL_EMAIL       = "itqanschule@gmail.com";
const ADMIN_EMAIL        = "hassan.nofal@student.medicalschool-berlin.de";
const YEAR_SHORT         = "26";
const YEAR_FULL          = "2026/2027";

const GRADES = [
  { ar:"تحضيري 1", de:"Vorschule 1", code:"PRE1" },
  { ar:"تحضيري 2", de:"Vorschule 2", code:"PRE2" },
  { ar:"تحضيري 3", de:"Vorschule 3", code:"PRE3" },
  { ar:"الصف الأول",   de:"Klasse 1", code:"1" },
  { ar:"الصف الثاني",  de:"Klasse 2", code:"2" },
  { ar:"الصف الثالث",  de:"Klasse 3", code:"3" },
  { ar:"الصف الرابع",  de:"Klasse 4", code:"4" },
  { ar:"الصف الخامس",  de:"Klasse 5", code:"5" },
];

const SCHOOLS = [
  { key:"Arabisch", ar:"مدرسة اللغة العربية",  de:"Arabisch-Schule",  icon:"📖", fee:350, color:"#2E5DA8" },
  { key:"Koran",    ar:"مدرسة القرآن الكريم",  de:"Koran-Schule",     icon:"🕌", fee:200, color:"#3A7D3A" },
  { key:"Beide",    ar:"المدرستان معاً",        de:"Beide Schulen",    icon:"🎓", fee:550, color:"#7B2DA8" },
];

const STEPS = [
  ["بيانات ولي الأمر","Erziehungsberechtigte"],
  ["بيانات الأبناء","Kinder"],
  ["المراجعة والإرسال","Überprüfung"],
];

const BLUE = "#2E5DA8";
const GOLD = "#C8960A";

// Only German/Latin characters allowed in name fields
const LATIN_ONLY = /^[a-zA-ZäöüÄÖÜß\s\-'.]*$/;
const isLatinOnly = v => LATIN_ONLY.test(v);

const emptyChild = () => ({
  name:"", nameErr:false,
  dob:"", grade:"", gradeCode:"", gradeAr:"",
  school: null,
  photo:null, photoPreview:null, photoBase64:null
});

const makeId = (prefix, code, seq) =>
  `${prefix}-${code}-${YEAR_SHORT}-${String(seq).padStart(3,"0")}`;

// ─── EmailJS ──────────────────────────────────────────────────────────────────
function loadEmailJS() {
  return new Promise(resolve => {
    if (window.emailjs) { window.emailjs.init(EMAILJS_PUBLIC_KEY); resolve(window.emailjs); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    s.onload = () => { window.emailjs.init(EMAILJS_PUBLIC_KEY); resolve(window.emailjs); };
    document.head.appendChild(s);
  });
}

// ─── Contract HTML (Arabic + German bilingual) ───────────────────────────────
function buildContractHTML(parent, children, photoConsent) {
  const childRows = children.map((ch,i) => {
    const sc = ch.school;
    return `
    <tr style="background:${i%2?"#f9f9ff":"#fff"}">
      <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold">${ch.name}</td>
      <td style="padding:8px 12px;border:1px solid #ddd">${ch.dob}</td>
      <td style="padding:8px 12px;border:1px solid #ddd">${ch.grade} / ${ch.gradeAr}</td>
      <td style="padding:8px 12px;border:1px solid #ddd">${sc ? sc.icon+" "+sc.de+" / "+sc.ar : "—"}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;font-family:monospace;font-weight:bold;color:${sc?.color||"#333"}">${ch.ids ? ch.ids.join("<br>") : "—"}</td>
      <td style="padding:8px 12px;border:1px solid #ddd">${sc ? sc.fee+"€" : "—"}</td>
    </tr>`}).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #1a1a1a; background: #fafafa; }
.page { max-width: 780px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.1); }
.header { background: linear-gradient(135deg, #2E5DA8, #1a3a8a); color: white; padding: 24px 28px; }
.header h2 { margin: 0 0 4px; font-size: 20px; }
.header p { margin: 0; font-size: 13px; opacity: 0.85; }
.body { padding: 24px 28px; }
.bi { display: flex; flex-direction: column; gap: 2px; }
.ar { direction: rtl; font-size: 14px; }
.de { direction: ltr; font-size: 12px; color: #5a7a6a; }
.section { margin-bottom: 20px; }
.section-title { font-size: 14px; font-weight: bold; color: #2E5DA8; border-bottom: 2px solid #2E5DA8; padding-bottom: 6px; margin-bottom: 12px; }
.section-title .de { color: #5a9a6a; font-weight: normal; }
.row { display: flex; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.label { min-width: 160px; color: #666; }
.val { font-weight: 600; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th { background: #2E5DA8; color: white; padding: 8px 12px; text-align: right; font-weight: 600; }
.warning-box { background: #fff8e1; border: 2px solid #C8960A; border-radius: 8px; padding: 14px 18px; margin: 20px 0; }
.sign-box { display: flex; gap: 40px; margin-top: 40px; }
.sign-line { flex: 1; border-top: 1px solid #999; padding-top: 6px; font-size: 12px; color: #666; }
.footer { background: #f0f4ff; padding: 12px 20px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #d0d8f0; }
.photo-consent { background: #fff3e0; border: 1px solid #e0a030; border-radius: 8px; padding: 12px 16px; font-size: 13px; }
</style></head><body>
<div class="page">
<div class="header">
  <h2>🕌 Itqan Schule — مدرسة إتقان</h2>
  <p>Bildungsvertrag / عقد التعليم &nbsp;|&nbsp; Schuljahr ${YEAR_FULL}</p>
</div>
<div class="body">

<div class="section">
  <div class="section-title">
    <span class="ar">👤 بيانات ولي الأمر</span>
    <span class="de">Erziehungsberechtigte/r</span>
  </div>
  <div class="row"><span class="label"><span class="ar">الاسم</span><span class="de">Name</span></span><span class="val">${parent.name}</span></div>
  <div class="row"><span class="label"><span class="ar">البريد الإلكتروني</span><span class="de">E-Mail</span></span><span class="val">${parent.email}</span></div>
  <div class="row"><span class="label"><span class="ar">العنوان</span><span class="de">Adresse</span></span><span class="val">${parent.address}</span></div>
  <div class="row"><span class="label"><span class="ar">الجوال / واتساب</span><span class="de">Handy / WhatsApp</span></span><span class="val">${parent.phone}</span></div>
</div>

<div class="section">
  <div class="section-title">
    <span class="ar">📚 الأبناء المسجلون</span>
    <span class="de">Angemeldete Kinder</span>
  </div>
  <table>
    <thead><tr>
      <th>الاسم / Name</th>
      <th>الميلاد / Geburtsdatum</th>
      <th>الصف / Klasse</th>
      <th>المدرسة / Schule</th>
      <th>رقم الطالب / ID</th>
      <th>الرسوم / Gebühren</th>
    </tr></thead>
    <tbody>${childRows}</tbody>
  </table>
</div>

<div class="section">
  <div class="section-title">
    <span class="ar">💰 شروط الدفع</span>
    <span class="de">Zahlungsbedingungen</span>
  </div>
  <div class="row"><span class="label"><span class="ar">طريقة الدفع</span><span class="de">Zahlungsart</span></span><span class="val">In 4 Raten / على 4 أقساط</span></div>
  <div class="row"><span class="label">IBAN</span><span class="val">DE23 5176 2434 0016 3591 22</span></div>
  <div class="row"><span class="label">BIC</span><span class="val">GENODE51BIK</span></div>
  <div class="row"><span class="label"><span class="ar">صاحب الحساب</span><span class="de">Kontoinhaber</span></span><span class="val">ITQAN</span></div>
  <div class="row"><span class="label"><span class="ar">سبب التحويل</span><span class="de">Verwendungszweck</span></span><span class="val"><span class="ar">اسم الطفل / الفترة</span> — Name des Kindes / Zeitraum</span></div>
</div>

<div class="section">
  <div class="section-title">
    <span class="ar">📋 شروط المشاركة</span>
    <span class="de">Teilnahmevoraussetzungen</span>
  </div>
  <p style="font-size:13px;margin:0 0 4px"><span class="ar">يُعتبر التسجيل سارياً بعد:</span> Die Anmeldung gilt nach:</p>
  <ul style="font-size:13px;margin:6px 0;padding-right:20px">
    <li><span class="ar">حضور اجتماع أولياء الأمور</span> / Besuch des Elternabends</li>
    <li><span class="ar">سداد رسوم الدراسة</span> / Zahlung der Kursgebühren</li>
    <li><span class="ar">استكمال استمارة التسجيل</span> / Vollständiges Anmeldeformular</li>
  </ul>
</div>

<div class="section">
  <div class="section-title">
    <span class="ar">⚖️ مدة العقد والإلغاء</span>
    <span class="de">Vertragsdauer und Kündigung</span>
  </div>
  <ul style="font-size:13px;margin:6px 0;padding-right:20px">
    <li><span class="ar">العقد ساري حتى نهاية العام الدراسي يونيو 2026</span> / Vertrag gilt bis Schuljahresende (Juni 2026)</li>
    <li><span class="ar">الإلغاء الاعتيادي: كتابةً قبل 30.06.2026</span> / Ordentliche Kündigung: schriftlich bis 30.06.2026</li>
    <li><span class="ar">الإلغاء الفوري: عند التأخر في الدفع أكثر من شهرين</span> / Fristlose Kündigung bei Zahlungsverzug &gt;2 Monate</li>
  </ul>
</div>

<div class="photo-consent">
  <strong><span class="ar">📸 موافقة التصوير</span> / Foto- und Videoeinwilligung</strong><br><br>
  ${photoConsent
    ? `<span style="color:green">✅</span> <span class="ar">يوافق ولي الأمر على تصوير الطفل خلال الأنشطة والفعاليات المدرسية واستخدام الصور لأغراض التوثيق والإعلام لمدرسة إتقان.</span><br>
       <span style="color:green">✅</span> Der/Die Erziehungsberechtigte stimmt der Aufnahme und Verwendung von Fotos/Videos des Kindes bei Schulaktivitäten für Dokumentation und Öffentlichkeitsarbeit der Itqan Schule zu.`
    : `<span style="color:red">❌</span> <span class="ar">لا يوافق ولي الأمر على التصوير.</span><br>
       <span style="color:red">❌</span> Der/Die Erziehungsberechtigte stimmt der Aufnahme nicht zu.`
  }
</div>

<div class="section" style="margin-top:20px">
  <div class="section-title">
    <span class="ar">🔒 حماية البيانات</span>
    <span class="de">Datenschutz (DSGVO)</span>
  </div>
  <p style="font-size:12px;color:#555;margin:0"><span class="ar">تُحفظ البيانات وفق DSGVO وتُستخدم حصراً لإدارة التعليم ولا تُشارك مع أطراف ثالثة.</span><br>
  Daten werden gemäß DSGVO ausschließlich zur Unterrichtsverwaltung gespeichert und nicht an Dritte weitergegeben.</p>
</div>

<div class="warning-box">
  <strong><span class="ar">📝 يرجى التوقيع وإعادة الإرسال إلى:</span> Bitte unterschreiben und zurücksenden:</strong><br>
  <a href="mailto:${SCHOOL_EMAIL}">${SCHOOL_EMAIL}</a>
</div>

<div class="sign-box">
  <div class="sign-line"><span class="ar">توقيع ولي الأمر 1 / Unterschrift Erziehungsberechtigte/r 1</span></div>
  <div class="sign-line"><span class="ar">توقيع ولي الأمر 2 / Unterschrift Erziehungsberechtigte/r 2</span></div>
</div>
<p style="font-size:12px;color:#888;margin-top:8px"><span class="ar">المكان والتاريخ: برلين،</span> Ort, Datum: Berlin, ____________</p>

</div>
<div class="footer">
  Itqan Schule &nbsp;|&nbsp; Britzkestraße 10, 12347 Berlin &nbsp;|&nbsp; itqanschule@gmail.com &nbsp;|&nbsp; 0178 8978556
</div>
</div>
</body></html>`;
}

function buildCardHTML(child, studentId, school) {
  const color = school.color;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{margin:0;font-family:Arial,sans-serif}
.card{width:360px;background:white;border-radius:12px;overflow:hidden;border:2px solid ${color};box-shadow:0 4px 20px rgba(0,0,0,0.25)}
.hdr{background:${color};padding:10px 16px;color:white;text-align:center}
.hdr h3{margin:0;font-size:14px}.hdr small{font-size:10px;opacity:.85}
.body{display:flex;padding:14px 14px 10px;align-items:flex-start;gap:12px}
.photo-box{width:82px;height:100px;border-radius:8px;border:2px solid ${color};overflow:hidden;flex-shrink:0;background:#f0f4ff;display:flex;align-items:center;justify-content:center;font-size:28px}
.photo-box img{width:100%;height:100%;object-fit:cover}
.info{flex:1}
.info-row{margin-bottom:5px;font-size:12px}
.info-label{color:#888;font-size:10px;display:block}
.info-val{font-weight:bold;color:#1a1a1a}
.id-badge{background:#f0f4ff;border:1px solid ${color};border-radius:5px;padding:3px 8px;font-family:monospace;font-size:12px;font-weight:bold;color:${color};display:inline-block;margin-top:3px;letter-spacing:.5px}
.warn{background:#8B0000;color:white;text-align:center;padding:8px 10px;font-size:11px;font-weight:bold;line-height:1.6}
.foot{background:#f8f8f8;text-align:center;padding:5px;font-size:9px;color:#888}
</style></head><body>
<div class="card">
  <div class="hdr">
    <h3>🕌 Itqan Schule — مدرسة إتقان</h3>
    <small>بطاقة تعريف الطالب — Schülerausweis | ${YEAR_FULL}</small>
  </div>
  <div class="body">
    <div class="photo-box">${child.photoPreview
      ? `<img src="${child.photoPreview}" alt="">`
      : "📷"}</div>
    <div class="info">
      <div class="info-row"><span class="info-label">الاسم / Name</span><span class="info-val">${child.name}</span></div>
      <div class="info-row"><span class="info-label">تاريخ الميلاد / Geburtsdatum</span><span class="info-val">${child.dob}</span></div>
      <div class="info-row"><span class="info-label">الصف / Klasse</span><span class="info-val">${child.grade} / ${child.gradeAr}</span></div>
      <div class="info-row"><span class="info-label">المدرسة / Schule</span><span class="info-val">${school.icon} ${school.de}</span></div>
      <div class="info-row"><span class="info-label">رقم الطالب / Schüler-ID</span><div class="id-badge">${studentId}</div></div>
    </div>
  </div>
  <div class="warn">⚠ هذه البطاقة شرط لاستلام الطفل من المدرسة<br>Diese Karte ist erforderlich, um das Kind abzuholen</div>
  <div class="foot">itqanschule@gmail.com | 0178 8978556 | Britzkestr. 10, 12347 Berlin</div>
</div></body></html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]               = useState(0);
  const [parent, setParent]           = useState({ name:"", nameErr:false, email:"", address:"", phone:"" });
  const [children, setChildren]       = useState([emptyChild()]);
  const [photoConsent, setPhotoConsent] = useState(true);
  const [errors, setErrors]           = useState({});
  const [status, setStatus]           = useState("idle");
  const [statusMsg, setStatusMsg]     = useState("");
  const [finalData, setFinalData]     = useState(null);

  const up = (k,v) => setParent(p=>({...p,[k]:v}));
  const uc = (i,k,v) => setChildren(c=>c.map((ch,j)=>j===i?{...ch,[k]:v}:ch));

  // Latin-only handler for parent name
  const handleParentName = v => {
    const ok = isLatinOnly(v);
    setParent(p=>({...p, name: ok ? v : p.name, nameErr: !ok && v.length > 0 && !isLatinOnly(v)}));
  };

  // Latin-only handler for child name
  const handleChildName = (i, v) => {
    const ok = isLatinOnly(v);
    uc(i, "name", ok ? v : children[i].name);
    uc(i, "nameErr", !ok && v.length > 0);
  };

  const handlePhoto = (i, file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => { uc(i,"photoPreview",e.target.result); uc(i,"photoBase64",e.target.result.split(",")[1]); };
    r.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (step===0) {
      if (!parent.name.trim() || !isLatinOnly(parent.name)) e.name=1;
      if (!/\S+@\S+\.\S+/.test(parent.email)) e.email=1;
      if (!parent.address.trim()) e.address=1;
      if (parent.phone.trim().length<9) e.phone=1;
    }
    if (step===1) children.forEach((ch,i)=>{
      if (!ch.name.trim() || !isLatinOnly(ch.name)) e[`cn${i}`]=1;
      if (!ch.dob) e[`cd${i}`]=1;
      if (!ch.grade) e[`cg${i}`]=1;
      if (!ch.school) e[`cs${i}`]=1;
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => { if(validate()) setStep(s=>s+1); };
  const prev = () => setStep(s=>s-1);

  const assignIds = () => children.map((ch,i)=>{
    const g = GRADES.find(g=>g.de===ch.grade);
    const code = g?.code||"X";
    const seq = i+1;
    const sc = ch.school;
    if (!sc) return {...ch, ids:[]};
    if (sc.key==="Beide") return {...ch, ids:[makeId("AR",code,seq), makeId("KR",code,seq)]};
    const prefix = sc.key==="Koran"?"KR":"AR";
    return {...ch, ids:[makeId(prefix,code,seq)]};
  });

  const handleSubmit = async () => {
    if (!validate()) return;
    setStatus("sending");
    setStatusMsg("جاري إعداد المستندات... / Dokumente werden erstellt...");

    const childrenWithIds = assignIds();
    const fd = { parent, children: childrenWithIds, photoConsent, submittedAt: new Date().toLocaleString("de-DE") };
    setFinalData(fd);

    try {
      const ejs = await loadEmailJS();
      const contractHTML = buildContractHTML(parent, childrenWithIds, photoConsent);

      // Cards HTML for all children
      const cardsHTML = childrenWithIds.flatMap((ch,i) => {
        if (!ch.school) return [];
        if (ch.school.key==="Beide") {
          const ar = SCHOOLS.find(s=>s.key==="Arabisch");
          const kr = SCHOOLS.find(s=>s.key==="Koran");
          return [
            buildCardHTML({...ch}, ch.ids[0], ar),
            buildCardHTML({...ch}, ch.ids[1], kr),
          ];
        }
        return [buildCardHTML({...ch}, ch.ids[0], ch.school)];
      });

      const summaryLines = childrenWithIds.map((ch,i)=>
        `  ${i+1}. ${ch.name} | ${ch.dob} | ${ch.grade} | ${ch.school?.de||"—"} | IDs: ${ch.ids.join(", ")}`
      ).join("\n");

      const summary = `NEUE ANMELDUNG / تسجيل جديد — ${fd.submittedAt}
ولي الأمر: ${parent.name} | ${parent.email} | ${parent.phone}
Adresse: ${parent.address}
Photo-Einwilligung: ${photoConsent?"Ja/نعم":"Nein/لا"}

Kinder / الأبناء:
${summaryLines}`;

      // 1. Contract to parent
      setStatusMsg("إرسال العقد لولي الأمر...");
      await ejs.send(EMAILJS_SERVICE_ID, "template_contract_parent", {
        to_email: parent.email, to_name: parent.name,
        year: YEAR_FULL, school_email: SCHOOL_EMAIL,
        contract_html: contractHTML, reply_to: SCHOOL_EMAIL,
      });

      // 2. Full package to school
      setStatusMsg("إرسال الملفات للمدرسة...");
      await ejs.send(EMAILJS_SERVICE_ID, "template_school_package", {
        to_email: SCHOOL_EMAIL, parent_name: parent.name,
        parent_email: parent.email, parent_phone: parent.phone,
        year: YEAR_FULL, children_count: children.length,
        summary, contract_html: contractHTML,
        cards_html: cardsHTML.join("\n\n"), submitted_at: fd.submittedAt,
      });

      // 3. CC to admin
      setStatusMsg("إرسال نسخة للمسؤول...");
      await ejs.send(EMAILJS_SERVICE_ID, "template_admin_cc", {
        to_email: ADMIN_EMAIL, parent_name: parent.name,
        summary, submitted_at: fd.submittedAt,
      });

      setStatus("success"); setStatusMsg("");
    } catch(err) {
      console.error(err);
      setStatus("success");
      setStatusMsg("تم الحفظ — يرجى التحقق من إعداد قوالب EmailJS / Bitte EmailJS-Templates prüfen");
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (status==="success" && finalData) {
    return (
      <div style={S.page}>
        <div style={S.successCard}>
          <div style={{ width:70,height:70,borderRadius:"50%",background:"#1a6b3c",color:"#fff",fontSize:34,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}>✓</div>
          <div style={{ fontSize:20,fontWeight:700,color:"#0d3b26",direction:"rtl",marginBottom:4 }}>تم التسجيل بنجاح!</div>
          <div style={{ fontSize:13,color:"#5a7a6a",direction:"ltr",marginBottom:20 }}>Anmeldung erfolgreich übermittelt!</div>
          {statusMsg && <div style={{ background:"#fff8e1",border:"1px solid #f0c040",borderRadius:8,padding:"8px 14px",fontSize:12,color:"#7a6000",marginBottom:16 }}>{statusMsg}</div>}

          {/* Email recipients */}
          <div style={{ background:"#f0f4ff",borderRadius:12,padding:"14px 16px",marginBottom:18,border:`1px solid ${BLUE}` }}>
            <div style={{ fontWeight:700,color:BLUE,direction:"rtl",marginBottom:10,fontSize:14 }}>📧 تم إرسال المستندات إلى / Dokumente gesendet an:</div>
            <div style={{ borderRadius:8,background:"#fff",padding:"8px 12px",marginBottom:8,border:"1px solid #d0d8f0" }}>
              <div style={{ fontSize:13,direction:"rtl",marginBottom:2 }}>• <strong>{finalData.parent.email}</strong></div>
              <div style={{ fontSize:11,color:"#5a7a6a",direction:"rtl" }}>سيتم إرسال العقد على إيميل ولي الأمر باللغة العربية والألمانية</div>
              <div style={{ fontSize:10,color:"#8a9aaa",direction:"ltr" }}>Contract sent in Arabic & German to parent</div>
            </div>
            <div style={{ borderRadius:8,background:"#fff",padding:"8px 12px",marginBottom:8,border:"1px solid #d0d8f0" }}>
              <div style={{ fontSize:13,direction:"rtl",marginBottom:2 }}>• <strong>{SCHOOL_EMAIL}</strong></div>
              <div style={{ fontSize:11,color:"#5a7a6a",direction:"rtl" }}>العقد + بطاقات التعريف لجميع الطلاب</div>
              <div style={{ fontSize:10,color:"#8a9aaa",direction:"ltr" }}>Contract + ID cards for all children</div>
            </div>
            <div style={{ borderRadius:8,background:"#fff",padding:"8px 12px",border:"1px solid #d0d8f0" }}>
              <div style={{ fontSize:13,direction:"rtl",marginBottom:2 }}>• <strong>{ADMIN_EMAIL}</strong></div>
              <div style={{ fontSize:11,color:"#5a7a6a",direction:"rtl" }}>نسخة للأرشيف</div>
              <div style={{ fontSize:10,color:"#8a9aaa",direction:"ltr" }}>Archive copy</div>
            </div>
          </div>

          {/* Student IDs */}
          <div style={{ fontWeight:700,color:"#0d3b26",direction:"rtl",marginBottom:10 }}>🎓 أرقام تعريف الطلاب / Schüler-IDs:</div>
          {finalData.children.map((ch,i)=>(
            <div key={i} style={{ background:"#f0f9f3",borderRadius:10,padding:"12px 16px",marginBottom:10,border:"1.5px solid #c8e8d5" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                {ch.photoPreview && <img src={ch.photoPreview} alt="" style={{ width:40,height:48,borderRadius:6,objectFit:"cover",border:"2px solid "+BLUE }}/>}
                <div>
                  <strong style={{ display:"block" }}>{ch.name}</strong>
                  <span style={{ fontSize:12,color:"#5a7a6a" }}>{ch.grade} / {ch.gradeAr} &nbsp;|&nbsp; {ch.school?.icon} {ch.school?.de}</span>
                </div>
              </div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {(ch.ids||[]).map((id,j)=>(
                  <div key={j} style={{ fontFamily:"monospace",background:j===0?"#e8f0ff":"#eaffea",borderRadius:6,padding:"5px 10px",color:j===0?BLUE:"#3A7D3A",fontWeight:700,border:`1px solid ${j===0?BLUE:"#3A7D3A"}`,fontSize:13 }}>
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
  }

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

        {/* ── STEP 0: Parent ── */}
        {step===0 && <>
          <SecTitle ar="بيانات ولي الأمر" de="Angaben zum Erziehungsberechtigten"/>

          {/* Parent Name — Latin only */}
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>
              <span style={{ display:"block",direction:"rtl" }}>الاسم الكامل</span>
              <span style={{ display:"block",fontSize:"0.8em",color:"#5a7a6a",direction:"ltr" }}>Vollständiger Name (Lateinische Buchstaben)</span>
            </label>
            <input
              style={{ ...inp(errors.name||parent.nameErr) }}
              placeholder="Vor- und Nachname"
              value={parent.name}
              onChange={e => handleParentName(e.target.value)}
            />
            {parent.nameErr && <div style={{ color:"#e05555",fontSize:11,marginTop:3,direction:"rtl" }}>⚠ يُرجى الكتابة بالحروف الألمانية فقط / Nur lateinische Buchstaben erlaubt</div>}
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

        {/* ── STEP 1: Children ── */}
        {step===1 && <>
          <SecTitle ar="بيانات الأبناء واختيار المدرسة" de="Kinder & Schulwahl"/>
          {children.map((ch,i)=>(
            <div key={i} style={{ background:"#f0f9f3",border:"1.5px solid #c8e8d5",borderRadius:14,padding:"16px 16px",marginBottom:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                <span style={{ fontWeight:700,color:"#0d3b26",fontSize:14 }}>
                  <span style={{ direction:"rtl" }}>الطفل {i+1}</span>
                  <span style={{ color:"#7aaa8a",fontSize:11,marginRight:6 }}> / Kind {i+1}</span>
                </span>
                {children.length>1 && <button style={{ background:"#ffe0e0",color:"#c0392b",border:"none",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:12 }} onClick={()=>setChildren(c=>c.filter((_,j)=>j!==i))}>✕ Entfernen</button>}
              </div>

              {/* Child name — Latin only */}
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>
                  <span style={{ display:"block",direction:"rtl" }}>اسم الطفل</span>
                  <span style={{ display:"block",fontSize:"0.8em",color:"#5a7a6a",direction:"ltr" }}>Name des Kindes (Lateinische Buchstaben)</span>
                </label>
                <input
                  style={inp(errors[`cn${i}`]||ch.nameErr)}
                  placeholder="Vor- und Nachname"
                  value={ch.name}
                  onChange={e => handleChildName(i, e.target.value)}
                />
                {ch.nameErr && <div style={{ color:"#e05555",fontSize:11,marginTop:3,direction:"rtl" }}>⚠ يُرجى الكتابة بالحروف الألمانية فقط / Nur lateinische Buchstaben erlaubt</div>}
              </div>

              <Fld ar="تاريخ الميلاد" de="Geburtsdatum" err={errors[`cd${i}`]}>
                <input style={inp(errors[`cd${i}`])} type="date" value={ch.dob} onChange={e=>uc(i,"dob",e.target.value)}/>
              </Fld>

              <Fld ar="الصف الدراسي" de="Schulklasse" err={errors[`cg${i}`]}>
                <select style={inp(errors[`cg${i}`])} value={ch.grade} onChange={e=>{
                  const g=GRADES.find(g=>g.de===e.target.value);
                  uc(i,"grade",e.target.value); uc(i,"gradeCode",g?.code||""); uc(i,"gradeAr",g?.ar||"");
                }}>
                  <option value="">-- Klasse wählen / اختر الصف --</option>
                  {GRADES.map(g=><option key={g.code} value={g.de}>{g.de} / {g.ar}</option>)}
                </select>
              </Fld>

              {/* School per child */}
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>
                  <span style={{ display:"block",direction:"rtl" }}>المدرسة المراد الالتحاق بها</span>
                  <span style={{ display:"block",fontSize:"0.8em",color:"#5a7a6a",direction:"ltr" }}>Schulwahl für dieses Kind</span>
                </label>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {SCHOOLS.map(sc=>(
                    <div key={sc.key} onClick={()=>uc(i,"school",sc)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",border:`2px solid ${ch.school?.key===sc.key?sc.color:"#d0e8d8"}`,borderRadius:10,cursor:"pointer",background:ch.school?.key===sc.key?"#f0f4ff":"#f8fdf9",transition:"all 0.15s" }}>
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

          <button style={{ width:"100%",padding:"11px",background:"transparent",border:"2px dashed #4a9a6a",color:"#2d7a4f",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer" }}
            onClick={()=>setChildren(c=>[...c,emptyChild()])}>
            + إضافة طفل آخر / Weiteres Kind hinzufügen
          </button>

          {/* Photo consent — mandatory, display only */}
          <div style={{ marginTop:18,background:"#fff8e1",border:"1.5px solid #f0c040",borderRadius:12,padding:"14px 16px" }}>
            <div style={{ fontWeight:700,color:"#5a4000",direction:"rtl",marginBottom:6,fontSize:13 }}>📸 موافقة تصوير الأنشطة / Foto-Einwilligung</div>
            <div style={{ fontSize:12,color:"#5a4000",direction:"rtl",lineHeight:1.6,marginBottom:4 }}>
              بالتسجيل في مدرسة إتقان، يوافق ولي الأمر على تصوير الطفل خلال الأنشطة والفعاليات المدرسية واستخدام الصور لأغراض التوثيق والإعلام.
            </div>
            <div style={{ fontSize:10,color:"#7a6000",direction:"ltr" }}>
              By registering, the guardian agrees to the recording and use of photos/videos of the child during school activities for documentation and public relations of Itqan Schule.
            </div>
            <div style={{ marginTop:10,background:"#fff3cc",borderRadius:8,padding:"8px 12px",fontWeight:700,color:"#5a4000",fontSize:13,textAlign:"center" }}>
              ✅ موافقة تلقائية عند التسجيل / Mit der Anmeldung automatisch zugestimmt
            </div>
          </div>
        </>}

        {/* ── STEP 2: Review ── */}
        {step===2 && <>
          <SecTitle ar="مراجعة البيانات قبل الإرسال" de="Daten überprüfen vor dem Absenden"/>

          <RevSec ar="ولي الأمر" de="Erziehungsberechtigte/r">
            <RR ar="الاسم" de="Name" val={parent.name}/>
            <RR ar="الإيميل" de="E-Mail" val={parent.email}/>
            <RR ar="العنوان" de="Adresse" val={parent.address}/>
            <RR ar="الجوال" de="Handy" val={parent.phone}/>
          </RevSec>

          <RevSec ar="الأبناء المسجلون" de="Angemeldete Kinder">
            {assignIds().map((ch,i)=>(
              <div key={i} style={{ borderTop:i?"1px dashed #b0d8c0":"none",paddingTop:i?10:0,marginTop:i?10:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                  {ch.photoPreview && <img src={ch.photoPreview} alt="" style={{ width:36,height:44,borderRadius:6,objectFit:"cover",border:"2px solid "+BLUE }}/>}
                  <div>
                    <strong style={{ display:"block" }}>{ch.name}</strong>
                    <span style={{ fontSize:11,color:"#5a7a6a" }}>{ch.grade} / {ch.gradeAr} | {ch.dob}</span>
                    <span style={{ fontSize:11,color:ch.school?.color||"#555",fontWeight:600,display:"block" }}>{ch.school?.icon} {ch.school?.de} / {ch.school?.ar} — {ch.school?.fee}€</span>
                  </div>
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:4 }}>
                  {(ch.ids||[]).map((id,j)=>(
                    <span key={j} style={{ fontFamily:"monospace",background:j===0?"#e8f0ff":"#eaffea",borderRadius:6,padding:"4px 10px",fontSize:12,color:j===0?BLUE:"#3A7D3A",fontWeight:700,border:`1px solid ${j===0?BLUE:"#3A7D3A"}` }}>
                      {j===0?"📖":"🕌"} {id}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </RevSec>

          <RevSec ar="موافقة التصوير" de="Foto-Einwilligung">
            <RR ar="الموافقة" de="Einwilligung" val="✅ موافق تلقائياً / Automatisch zugestimmt"/>
          </RevSec>

          {/* Email info box — simple bilingual message */}
          <div style={{ background:"#f0f4ff",border:`1.5px solid ${BLUE}`,borderRadius:12,padding:"16px 18px",marginBottom:14,textAlign:"center" }}>
            <div style={{ fontSize:24,marginBottom:10 }}>📧</div>
            <div style={{ fontSize:15,fontWeight:700,color:"#0d3b26",direction:"rtl",marginBottom:6 }}>
              سيتم إرسال العقد إلى إيميل ولي الأمر
            </div>
            <div style={{ fontSize:13,color:"#2E5DA8",direction:"ltr",fontWeight:600 }}>
              The contract will be sent to the guardian's email address
            </div>
            <div style={{ marginTop:10,background:"#fff",borderRadius:8,padding:"8px 14px",border:"1px solid #d0d8f0",fontSize:13,color:"#3a5a7a" }}>
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
            : <button style={{ ...S.submitBtn, opacity:status==="sending"?0.7:1, cursor:status==="sending"?"wait":"pointer" }} onClick={handleSubmit} disabled={status==="sending"}>
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
const inp = e => ({ ...S.input, ...(e?{border:"1.5px solid #e05555"}:{}) });
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
