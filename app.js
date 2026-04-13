/* App logic */

/* Demo data */
const DEMO_PATIENTS = [
  {
    id:"pt-001", name:"Eleanor Voss", dob:"1961-03-14", gender:"female",
    conditions:["Type 2 Diabetes","Hypertension","Hyperlipidemia"],
    meds:["Metformin 1000mg","Lisinopril 10mg","Atorvastatin 40mg"],
    encounters:5, latestHbA1c:8.2, latestBP:142, age:63
  },
  {
    id:"pt-002", name:"Raymond Chu", dob:"1958-07-22", gender:"male",
    conditions:["Type 2 Diabetes","Obesity","Hypertension"],
    meds:["Metformin 500mg","Amlodipine 5mg"],
    encounters:3, latestHbA1c:9.1, latestBP:158, age:66
  },
  {
    id:"pt-003", name:"Sandra Okafor", dob:"1970-11-05", gender:"female",
    conditions:["Essential Hypertension","Anxiety Disorder"],
    meds:["Losartan 50mg","Sertraline 100mg"],
    encounters:7, latestHbA1c:null, latestBP:138, age:54
  }
];

const DEMO_COHORT = [
  {
    id:"c001", name:"Patient #A-4821", age:61, gender:"female",
    outcome:"improved", daysToEvent:420,
    matchReasons:[
      {icon:"droplet", key:"HbA1c baseline", note:"Similar HbA1c at diagnosis (8.4 vs 8.2)"},
      {icon:"pill",    key:"Metformin",      note:"Same biguanide medication class"},
      {icon:"clipboard",key:"Diagnoses",     note:"Overlapping dx: T2D + Hypertension"}
    ],
    turningPoint:"Improvement began after Metformin dose titration at month 3 and consistent quarterly follow-up.",
    timeline:[
      {type:"condition",  event:"T2D + HTN diagnosed",        date:"~4 yrs ago"},
      {type:"medication", event:"Metformin 500mg started",    date:"~4 yrs ago"},
      {type:"encounter",  event:"Endocrinology follow-up",    date:"~3 yrs ago"},
      {type:"medication", event:"Metformin titrated to 1g",   date:"~2.5 yrs ago"},
      {type:"encounter",  event:"HbA1c 6.8 — controlled",    date:"~1 yr ago"},
      {type:"outcome",    event:"Stable, no hospitalizations",date:"Present"}
    ]
  },
  {
    id:"c002", name:"Patient #B-3309", age:65, gender:"male",
    outcome:"improved", daysToEvent:510,
    matchReasons:[
      {icon:"layers",   key:"Comorbidities", note:"T2D + HTN + Dyslipidemia triad"},
      {icon:"pill",     key:"Statin use",    note:"Concurrent atorvastatin therapy"},
      {icon:"calendar", key:"Visit pattern", note:"Similar encounter frequency (~5 visits)"}
    ],
    turningPoint:"Combination antihypertensive + statin therapy led to LDL reduction and BP stabilization.",
    timeline:[
      {type:"condition",  event:"T2D + HTN + Dyslipidemia",  date:"~5 yrs ago"},
      {type:"medication", event:"Metformin + Atorvastatin",  date:"~5 yrs ago"},
      {type:"encounter",  event:"Cardiology consult",        date:"~3 yrs ago"},
      {type:"encounter",  event:"BP 128/82 — improved",      date:"~2 yrs ago"},
      {type:"outcome",    event:"HbA1c 7.1, LDL normalized", date:"Present"}
    ]
  },
  {
    id:"c003", name:"Patient #C-7714", age:62, gender:"female",
    outcome:"hospitalized", daysToEvent:180,
    matchReasons:[
      {icon:"droplet",      key:"High HbA1c",     note:"Baseline HbA1c >8.5 at first encounter"},
      {icon:"alert-circle", key:"Missed follow-ups",note:"Gap in care >6 months detected"},
      {icon:"thermometer",  key:"Uncontrolled BP", note:"HTN uncontrolled at time of matching"}
    ],
    turningPoint:"Missed 3 consecutive follow-ups. Admitted for hypertensive urgency at month 18.",
    timeline:[
      {type:"condition",  event:"T2D + Uncontrolled HTN",    date:"~4 yrs ago"},
      {type:"medication", event:"Metformin started",         date:"~4 yrs ago"},
      {type:"encounter",  event:"Last recorded follow-up",   date:"~2.5 yrs ago"},
      {type:"encounter",  event:"ED visit — chest pain",     date:"~1.5 yrs ago"},
      {type:"outcome",    event:"Hospitalized: HTN urgency", date:"~1 yr ago"}
    ]
  },
  {
    id:"c004", name:"Patient #D-5502", age:58, gender:"male",
    outcome:"improved", daysToEvent:630,
    matchReasons:[
      {icon:"pill",     key:"Polypharmacy",  note:"Multiple antihypertensives matching patient"},
      {icon:"user",     key:"Demographics",  note:"55–65 age group, similar BMI bracket"},
      {icon:"activity", key:"Obesity",       note:"BMI >30 overlapping comorbidity"}
    ],
    turningPoint:"Combination therapy + weight management program yielded gradual improvement over 2 years.",
    timeline:[
      {type:"condition",  event:"T2D + Obesity + HTN",       date:"~6 yrs ago"},
      {type:"medication", event:"Metformin + ACE inhibitor", date:"~6 yrs ago"},
      {type:"encounter",  event:"Weight management program", date:"~3 yrs ago"},
      {type:"encounter",  event:"HbA1c improved to 7.4",     date:"~2 yrs ago"},
      {type:"outcome",    event:"Stable · −12 kg body weight",date:"Present"}
    ]
  },
  {
    id:"c005", name:"Patient #E-2287", age:67, gender:"female",
    outcome:"deteriorated", daysToEvent:270,
    matchReasons:[
      {icon:"trending-down", key:"Worsening HbA1c", note:"Progressive rise in labs over 24 months"},
      {icon:"alert-circle",  key:"Non-adherence",   note:"MedicationRequest gaps >3 months"},
      {icon:"layers",        key:"Comorbidity load",note:"3+ active conditions similar to patient"}
    ],
    turningPoint:"Medication non-adherence and declining renal function led to escalating clinical interventions.",
    timeline:[
      {type:"condition",  event:"T2D + HTN + CKD stage 2",  date:"~5 yrs ago"},
      {type:"medication", event:"Complex regimen initiated", date:"~5 yrs ago"},
      {type:"encounter",  event:"Nephrology referral",       date:"~3 yrs ago"},
      {type:"encounter",  event:"Creatinine rising trend",   date:"~2 yrs ago"},
      {type:"outcome",    event:"CKD stage 3 · dialysis prep",date:"Present"}
    ]
  }
];

/* State */
let currentFilter  = "all";
let currentTab     = "overview";
let charts         = {};
let currentPatient = null;
let allPatients    = [];

/* Boot */
window.addEventListener("DOMContentLoaded", () => {
  // Sidebar
  el("menu-btn").addEventListener("click", () => {
    el("sidebar").classList.add("open");
    el("sb-overlay").classList.add("show");
  });
  el("sb-overlay").addEventListener("click", closeSidebar);

  FHIR.oauth2.ready()
    .then(client => {
      const host = (client.state.serverUrl || "SMART Sandbox").replace(/https?:\/\//,"").split("/")[0];
      el("fhir-server-label").textContent = host;
      el("fhir-dot").classList.add("live");
      el("fhir-status").textContent = "Connected · " + host;
      el("fhir-status").classList.add("ok");
      loadFromFHIR(client);
    })
    .catch(() => {
      el("demo-banner").style.display = "";
      allPatients = DEMO_PATIENTS;
      buildSidebar(DEMO_PATIENTS);
      renderPatient(DEMO_PATIENTS[0]);
      hide("loading-screen");
      show("app");
    });
});

function closeSidebar() {
  el("sidebar").classList.remove("open");
  el("sb-overlay").classList.remove("show");
}

/* FHIR */
async function loadFromFHIR(client) {
  try {
    setLoadMsg("Loading patient…");
    const pt = await client.patient.read();
    setLoadMsg("Fetching conditions…");
    const condBundle = await client.patient.request("Condition?_count=50");
    setLoadMsg("Fetching medications…");
    const medBundle  = await client.patient.request("MedicationRequest?_count=50&status=active");
    setLoadMsg("Fetching observations…");
    const obsBundle  = await client.patient.request("Observation?_count=50&code=4548-4,55284-4,8480-6&_sort=-date");
    setLoadMsg("Fetching encounters…");
    const encBundle  = await client.patient.request("Encounter?_count=50&_sort=-date");

    const conditions   = (condBundle.entry||[]).map(e=>e.resource);
    const meds         = (medBundle.entry||[]).map(e=>e.resource);
    const observations = (obsBundle.entry||[]).map(e=>e.resource);
    const encounters   = (encBundle.entry||[]).map(e=>e.resource);

    const p = buildFHIRPatient(pt, conditions, meds, observations, encounters);
    allPatients = [p];
    buildSidebar([p]);
    renderPatient(p);
    hide("loading-screen");
    show("app");
  } catch(err) {
    console.error(err);
    setLoadMsg("⚠️ " + err.message);
  }
}

function buildFHIRPatient(pt, conditions, meds, observations, encounters) {
  const n    = pt.name?.[0];
  const name = n ? [(n.given||[]).join(" "), n.family].filter(Boolean).join(" ") : "Unknown";
  const dob  = pt.birthDate || "";
  const age  = dob ? Math.floor((Date.now() - new Date(dob)) / 31557600000) : "?";
  const condNames = conditions.map(c=>c.code?.text||c.code?.coding?.[0]?.display||null).filter(Boolean);
  const medNames  = meds.map(m=>m.medicationCodeableConcept?.text||m.medicationCodeableConcept?.coding?.[0]?.display||null).filter(Boolean);
  const latestHbA1c = observations.filter(o=>o.code?.coding?.some(c=>c.code==="4548-4")).sort((a,b)=>new Date(b.effectiveDateTime||0)-new Date(a.effectiveDateTime||0))[0]?.valueQuantity?.value||null;
  const latestBP    = observations.filter(o=>o.code?.coding?.some(c=>c.code==="55284-4")).sort((a,b)=>new Date(b.effectiveDateTime||0)-new Date(a.effectiveDateTime||0))[0]?.component?.find(c=>c.code?.coding?.some(cc=>cc.code==="8480-6"))?.valueQuantity?.value||null;
  return {id:pt.id, name, dob, age, gender:pt.gender||"unknown", conditions:condNames, meds:medNames, encounters:encounters.length, latestHbA1c, latestBP};
}

/* Sidebar */
function buildSidebar(patients) {
  el("patient-list").innerHTML = patients.map((p,i)=>`
    <button class="pt-btn ${i===0?"active":""}" id="pcm-${p.id}" onclick="selectPatient('${p.id}');closeSidebar()">
      <div class="pt-avatar">${initials(p.name)}</div>
      <div class="pt-info">
        <div class="pt-name">${p.name}</div>
        <div class="pt-sub">${p.age}y · ${cap(p.gender)}</div>
      </div>
    </button>`).join("");
}

function selectPatient(id) {
  const p = allPatients.find(x=>x.id===id);
  if(!p) return;
  document.querySelectorAll(".pt-btn").forEach(b=>b.classList.remove("active"));
  el("pcm-"+id)?.classList.add("active");
  renderPatient(p);
}

/* Tabs */
function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
  btn.classList.add("active");
  el("panel-"+tab)?.classList.add("active");
}

/* Vector */
function buildVector(p) {
  const hasDiabetes = p.conditions.some(c=>/diabet/i.test(c));
  const hasHTN      = p.conditions.some(c=>/hypert|blood pressure/i.test(c));
  const hasDyslipid = p.conditions.some(c=>/lipid|cholesterol/i.test(c));
  const onMetformin = p.meds.some(m=>/metformin/i.test(m));
  const onACE       = p.meds.some(m=>/lisinopril|enalapril|ramipril/i.test(m));
  const onStatin    = p.meds.some(m=>/statin|atorva|rosuvastatin/i.test(m));
  const hba1c       = p.latestHbA1c || 7.5;
  const bp          = p.latestBP    || 130;
  const encCount    = p.encounters  || 0;
  const medCount    = p.meds.length;
  const dxCount     = p.conditions.length;
  return {
    hasDiabetes, hasHTN, hasDyslipid, onMetformin, onACE, onStatin,
    hba1c, bp, encCount, medCount, dxCount,
    vec:[
      hasDiabetes?1:0, hasHTN?1:0, hasDyslipid?1:0,
      onMetformin?1:0, onACE?1:0, onStatin?1:0,
      Math.min(hba1c/12,1), Math.min(bp/200,1),
      Math.min(encCount/10,1), Math.min(medCount/8,1), Math.min(dxCount/6,1)
    ]
  };
}

function buildCohortVec(c) {
  const hasDiabetes = c.matchReasons.some(r=>/diabet|hba1c|t2d/i.test(r.key+r.note));
  const hasHTN      = c.matchReasons.some(r=>/hypert|bp/i.test(r.key+r.note));
  const hasDyslipid = c.matchReasons.some(r=>/lipid|statin|ldl/i.test(r.key+r.note));
  const onMetformin = c.matchReasons.some(r=>/metformin/i.test(r.key+r.note));
  const onACE       = c.matchReasons.some(r=>/ace|lisinopril|arb/i.test(r.key+r.note));
  const onStatin    = c.matchReasons.some(r=>/statin/i.test(r.key+r.note));
  return [hasDiabetes?1:0,hasHTN?1:0,hasDyslipid?1:0,onMetformin?1:0,onACE?1:0,onStatin?1:0,
    c.timeline.some(t=>/hba1c/i.test(t.event))?0.72:0.62, 0.65,
    Math.min(c.timeline.length/10,1), 0.5, 0.6];
}

function cosine(a, b) {
  const dot  = a.reduce((s,x,i)=>s+x*b[i],0);
  const magA = Math.sqrt(a.reduce((s,x)=>s+x*x,0));
  const magB = Math.sqrt(b.reduce((s,x)=>s+x*x,0));
  return (!magA||!magB) ? 0 : dot/(magA*magB);
}

/* PSM */
function computePSM(patientFV, cohort) {
  // Scores
  const ps = cohort.map(c => {
    const cv = buildCohortVec(c);
    const hasDiabetes = cv[0]; const hasHTN = cv[1];
    const onMetformin = cv[3]; const hba1c  = cv[6]*12;
    // Logit
    const logit = -1.2
      + 1.4 * hasDiabetes
      + 0.8 * hasHTN
      + 1.1 * onMetformin
      + 0.4 * (hba1c > 8 ? 1 : 0);
    const score = 1 / (1 + Math.exp(-logit));
    return { ...c, ps: score };
  });

  // Match
  const targetPS = 1 / (1 + Math.exp(-(-1.2
    + 1.4 * (patientFV.hasDiabetes ? 1 : 0)
    + 0.8 * (patientFV.hasHTN ? 1 : 0)
    + 1.1 * (patientFV.onMetformin ? 1 : 0)
    + 0.4 * (patientFV.hba1c > 8 ? 1 : 0))));

  const matched = ps.filter(c => Math.abs(c.ps - targetPS) < 0.15);
  const smd = computeSMD(patientFV, matched.length > 0 ? matched : ps);
  return { matched: matched.length > 0 ? matched : ps, targetPS, smd };
}

function computeSMD(fv, cohort) {
  // SMD
  const vals = cohort.map(c => buildCohortVec(c)[6] * 12);
  const mean = vals.reduce((a,b)=>a+b,0) / vals.length;
  const sd   = Math.sqrt(vals.reduce((s,v)=>s+Math.pow(v-mean,2),0)/vals.length) || 0.5;
  return Math.abs((fv.hba1c - mean) / sd).toFixed(3);
}

/* Survival */
function buildKMCurve(cohort, group) {
  const patients = group === "all"
    ? cohort
    : cohort.filter(c=>c.outcome===group);
  if (patients.length === 0) return { times: [], survival: [] };

  // Events
  const events = patients.map(c => ({
    t: c.daysToEvent || Math.round(180 + Math.random() * 400),
    event: c.outcome !== "improved" ? 1 : 0
  })).sort((a,b)=>a.t-b.t);

  let n = events.length;
  let s = 1.0;
  const times    = [0];
  const survival = [1.0];

  events.forEach(e => {
    if (e.event === 1) {
      s *= (1 - 1/n);
      times.push(e.t);
      survival.push(parseFloat(s.toFixed(4)));
    }
    n--;
  });
  return { times, survival };
}

/* CI */
function bootstrapCI(cohort, outcome, iterations=200) {
  const n       = cohort.length;
  const counts  = [];
  for (let i=0; i<iterations; i++) {
    let count = 0;
    for (let j=0; j<n; j++) {
      const sample = cohort[Math.floor(Math.random()*n)];
      if (sample.outcome === outcome) count++;
    }
    counts.push(count / n);
  }
  counts.sort((a,b)=>a-b);
  const lo = Math.round(counts[Math.floor(0.025 * iterations)] * 100);
  const hi = Math.round(counts[Math.floor(0.975 * iterations)] * 100);
  return { lo, hi };
}

/* Markov */
function buildMarkov(cohort) {
  const n = cohort.length || 1;
  // Rates
  const improved     = cohort.filter(c=>c.outcome==="improved").length / n;
  const hospitalized = cohort.filter(c=>c.outcome==="hospitalized").length / n;
  const deteriorated = cohort.filter(c=>c.outcome==="deteriorated").length / n;

  return [
    { from:"Stable",       to:"Recovery",     prob: (improved * 0.7).toFixed(2) },
    { from:"Stable",       to:"Worsening",    prob: (hospitalized * 0.5).toFixed(2) },
    { from:"Vulnerable",   to:"Hospitalized", prob: (hospitalized * 0.8).toFixed(2) },
    { from:"Vulnerable",   to:"Recovery",     prob: (improved * 0.4).toFixed(2) },
    { from:"Deteriorating",to:"Hospitalized", prob: ((hospitalized+deteriorated)*0.6).toFixed(2) },
    { from:"Deteriorating",to:"Stable",       prob: (improved * 0.2).toFixed(2) }
  ];
}

/* Clusters */
function buildClusters(cohort) {
  const n = cohort.length;
  const improved     = cohort.filter(c=>c.outcome==="improved").length;
  const hospitalized = cohort.filter(c=>c.outcome==="hospitalized").length;
  const deteriorated = cohort.filter(c=>c.outcome==="deteriorated").length;
  return [
    {
      num: 1, color: "var(--teal-dark)", bg: "var(--teal-lt)",
      name: "Stable → Recovery",
      desc: "Consistent follow-up, responsive to medication titration",
      pct: Math.round(improved/n*100) + "%", n: improved
    },
    {
      num: 2, color: "var(--amber)", bg: "var(--amber-lt)",
      name: "Fluctuating → Hospitalization",
      desc: "Uncontrolled BP or HbA1c, gaps in follow-up care",
      pct: Math.round(hospitalized/n*100) + "%", n: hospitalized
    },
    {
      num: 3, color: "var(--rose-dark)", bg: "var(--rose-lt)",
      name: "Gradual Deterioration",
      desc: "Progressive multi-organ decline, non-adherence pattern",
      pct: Math.round(deteriorated/n*100) + "%", n: deteriorated
    }
  ];
}

/* Adjustment */
function buildAdjusted(cohort) {
  const n = cohort.length || 1;
  const rawImproved  = cohort.filter(c=>c.outcome==="improved").length / n;
  // Adjusted rate
  const adjImproved  = Math.min(rawImproved + 0.04, 1);
  return {
    raw:      Math.round(rawImproved * 100),
    adjusted: Math.round(adjImproved * 100),
    diff:     Math.round((adjImproved - rawImproved) * 100)
  };
}

/* Render */
function renderPatient(patient) {
  currentPatient = patient;
  const fv = buildVector(patient);

  // Header
  el("tb-avatar").textContent = initials(patient.name);
  el("tb-name").textContent   = patient.name;
  el("tb-meta").textContent   = `${patient.age} yrs · ${cap(patient.gender)} · ${patient.conditions.length} dx · ${patient.meds.length} meds`;

  // Cohort
  const cohort = DEMO_COHORT.map(c=>({
    ...c, simScore: cosine(fv.vec, buildCohortVec(c))
  })).sort((a,b)=>b.simScore-a.simScore);

  // Panels
  renderOverview(patient, fv, cohort);
  renderSurvival(cohort);
  renderAnalytics(cohort);
  renderMatches(cohort);
}

/* Overview */
function renderOverview(patient, fv, cohort) {
  // Chips
  const condChips = patient.conditions.slice(0,4).map(c=>
    `<span class="chip teal">${ic("clipboard",11,"var(--teal-dark)")} ${c}</span>`).join("");
  const medChips = patient.meds.slice(0,4).map(m=>
    `<span class="chip amber">${ic("pill",11,"#7a4900")} ${m}</span>`).join("");
  const labChips = [
    patient.latestHbA1c ? `<span class="chip rose">${ic("droplet",11,"var(--rose-dark)")} HbA1c ${patient.latestHbA1c.toFixed(1)}%</span>` : "",
    patient.latestBP    ? `<span class="chip indigo">${ic("activity",11,"var(--indigo)")} SBP ${patient.latestBP} mmHg</span>` : ""
  ].join("");

  el("patient-chips").innerHTML = `
    <div class="chip-section">
      <div class="chip-group-label">Conditions</div>
      <div class="chip-row">${condChips}</div>
    </div>
    <div class="chip-section" style="margin-top:8px">
      <div class="chip-group-label">Medications</div>
      <div class="chip-row">${medChips}</div>
    </div>
    ${labChips ? `<div class="chip-section" style="margin-top:8px">
      <div class="chip-group-label">Latest Labs</div>
      <div class="chip-row">${labChips}</div>
    </div>` : ""}
  `;

  // Grid
  const hba1cCls = fv.hba1c>=8?"danger":fv.hba1c>=7?"warn":"ok";
  const bpCls    = fv.bp>=140?"danger":fv.bp>=130?"warn":"ok";
  el("fp-grid").innerHTML = [
    fpCard("droplet",   hba1cCls, fv.hba1c.toFixed(1), "%",   "HbA1c",    fv.hba1c>=8?"Uncontrolled":fv.hba1c>=7?"Borderline":"Controlled", "var(--rose-dark)","var(--rose-lt)"),
    fpCard("activity",  bpCls,    fv.bp+"",            " mmHg","SBP",       fv.bp>=140?"Stage 2 HTN":fv.bp>=130?"Stage 1":"Normal",           "var(--amber)","var(--amber-lt)"),
    fpCard("pill",      "",       fv.medCount+"",      "",     "Active Meds","medications",                                                   "var(--indigo)","var(--indigo-lt)"),
    fpCard("clipboard", "",       fv.dxCount+"",       "",     "Diagnoses", "active conditions",                                              "var(--teal-dark)","var(--teal-lt)"),
    fpCard("calendar",  "",       fv.encCount+"",      "",     "Encounters","on record",                                                       "var(--muted)","var(--cream3)"),
    fpCard("check-circle", fv.onMetformin?"ok":"", fv.onMetformin?"Yes":"No", "", "Metformin","biguanide class",                              "var(--teal-dark)","var(--teal-lt)")
  ].join("");

  // PSM
  const psm = computePSM(fv, cohort);
  el("psm-info").innerHTML = `
    <div class="psm-badge">
      ${ic("check-circle",14,"var(--teal-dark)")}
      <span>Propensity-balanced cohort · ${psm.matched.length} matched patients</span>
    </div>
    <div style="margin-top:8px;font-size:12px;font-weight:700;color:var(--muted)">
      ${ic("info",12,"var(--muted)")}
      Standardized Mean Difference (HbA1c):
      <span class="psm-mono"> SMD = ${psm.smd}</span>
      <span style="margin-left:6px;color:${parseFloat(psm.smd)<0.1?'var(--teal-dark)':'var(--amber)'}">
        ${parseFloat(psm.smd)<0.1?"✓ Well-balanced (SMD < 0.1)":"⚠ Moderate imbalance"}
      </span>
    </div>
  `;

  // Stats
  const total = cohort.length;
  const imp   = cohort.filter(c=>c.outcome==="improved").length;
  const hosp  = cohort.filter(c=>c.outcome==="hospitalized").length;
  const det   = cohort.filter(c=>c.outcome==="deteriorated").length;
  const pct   = n => Math.round(n/total*100);

  const impCI  = bootstrapCI(cohort,"improved");
  const hospCI = bootstrapCI(cohort,"hospitalized");
  const detCI  = bootstrapCI(cohort,"deteriorated");
  const adj    = buildAdjusted(cohort);

  el("cohort-stats").innerHTML = `
    <div class="co-stat">
      <div class="co-val ink">${total}</div>
      <div class="co-label">${ic("users",12,"var(--muted)")} patients</div>
    </div>
    <div class="co-stat">
      <div class="co-val teal">${pct(imp)}%</div>
      <div class="co-label">improved</div>
      <div style="font-size:10px;font-weight:700;color:var(--hint);margin-top:2px;font-family:var(--font-mono)">
        95% CI ${impCI.lo}–${impCI.hi}%
      </div>
    </div>
    <div class="co-stat">
      <div class="co-val amber">${pct(hosp)}%</div>
      <div class="co-label">hospitalized</div>
      <div style="font-size:10px;font-weight:700;color:var(--hint);margin-top:2px;font-family:var(--font-mono)">
        95% CI ${hospCI.lo}–${hospCI.hi}%
      </div>
    </div>
    <div class="co-stat">
      <div class="co-val rose">${pct(det)}%</div>
      <div class="co-label">deteriorated</div>
      <div style="font-size:10px;font-weight:700;color:var(--hint);margin-top:2px;font-family:var(--font-mono)">
        95% CI ${detCI.lo}–${detCI.hi}%
      </div>
    </div>
  `;
  el("stacked-bar").innerHTML = `
    <div class="seg improved"     style="width:${pct(imp)}%">${pct(imp)}%</div>
    <div class="seg hospitalized" style="width:${pct(hosp)}%">${pct(hosp)}%</div>
    <div class="seg deteriorated" style="width:${pct(det)}%">${pct(det)}%</div>
  `;
  el("adj-outcome").innerHTML = `
    <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:4px">
      <div>
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Raw outcome</div>
        <div style="font-family:var(--font);font-size:22px;font-weight:900;color:var(--ink)">${adj.raw}% improved</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Adjusted (regression)</div>
        <div style="font-family:var(--font);font-size:22px;font-weight:900;color:var(--teal-dark)">${adj.adjusted}% improved</div>
        <div style="font-size:11px;font-weight:700;color:var(--muted)">+${adj.diff}% after covariate adjustment</div>
      </div>
    </div>
  `;

  // Chart
  destroyChart("overview-chart");
  const ctx = el("overview-chart").getContext("2d");
  charts["overview-chart"] = new Chart(ctx, {
    type:"bar",
    data:{
      labels: cohort.map(c=>c.name.replace("Patient #","")),
      datasets:[{
        label:"Similarity",
        data: cohort.map(c=>Math.round(c.simScore*100)),
        backgroundColor: cohort.map(c=>
          c.outcome==="improved"     ? "rgba(0,137,123,0.75)" :
          c.outcome==="hospitalized" ? "rgba(217,119,6,0.75)" :
                                       "rgba(224,92,122,0.75)"),
        borderRadius:8, borderSkipped:false
      }]
    },
    options:{
      responsive:true,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:i=>`Similarity: ${i.parsed.y}%`, footer:items=>`Outcome: ${cap(cohort[items[0].dataIndex].outcome)}`}} },
      scales:{ y:{min:0,max:100,ticks:{callback:v=>v+"%"},grid:{color:"rgba(0,0,0,0.04)"}}, x:{grid:{display:false}} }
    }
  });
}

/* Survival panel */
function renderSurvival(cohort) {
  const kmAll  = buildKMCurve(cohort, "all");
  const kmImp  = buildKMCurve(cohort, "improved");
  const kmHosp = buildKMCurve(cohort.filter(c=>c.outcome!=="improved"), "all");

  // KM
  destroyChart("km-chart");
  const ctx = el("km-chart").getContext("2d");
  charts["km-chart"] = new Chart(ctx, {
    type:"line",
    data:{
      datasets:[
        {
          label:"All patients",
          data: kmAll.times.map((t,i)=>({x:t, y:kmAll.survival[i]})),
          borderColor:"rgba(0,137,123,0.9)", backgroundColor:"rgba(0,137,123,0.08)",
          fill:true, stepped:true, tension:0, pointRadius:2, borderWidth:2
        },
        {
          label:"Improved subgroup",
          data: kmImp.times.map((t,i)=>({x:t, y:kmImp.survival[i]})),
          borderColor:"rgba(92,107,192,0.8)", backgroundColor:"transparent",
          fill:false, stepped:true, tension:0, pointRadius:2, borderWidth:2, borderDash:[4,3]
        },
        {
          label:"Hospitalized/deteriorated",
          data: kmHosp.times.map((t,i)=>({x:t, y:kmHosp.survival[i]})),
          borderColor:"rgba(224,92,122,0.8)", backgroundColor:"transparent",
          fill:false, stepped:true, tension:0, pointRadius:2, borderWidth:2, borderDash:[2,3]
        }
      ]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false},
        tooltip:{
          callbacks:{
            title:items=>`Day ${items[0].parsed.x}`,
            label:item=>`${item.dataset.label}: ${(item.parsed.y*100).toFixed(0)}% event-free`
          }
        }
      },
      scales:{
        x:{type:"linear", title:{display:true,text:"Days from baseline",font:{size:11}}, ticks:{font:{size:11}}, grid:{color:"rgba(0,0,0,0.04)"}},
        y:{min:0, max:1, title:{display:true,text:"Event-free probability",font:{size:11}}, ticks:{callback:v=>(v*100)+"%",font:{size:11}}, grid:{color:"rgba(0,0,0,0.04)"}}
      }
    }
  });

  // Markov
  const markov = buildMarkov(cohort);
  el("markov-body").innerHTML = markov.map(row=>{
    const p = parseFloat(row.prob);
    const cls = p >= 0.3 ? "high" : p >= 0.15 ? "mid" : "low";
    return `<tr>
      <td style="color:var(--muted)">${row.from}</td>
      <td>${ic("chevron-right",12,"var(--hint)")} ${row.to}</td>
      <td><span class="trans-val ${cls}">${row.prob}</span></td>
    </tr>`;
  }).join("");
}

/* Analytics */
function renderAnalytics(cohort) {
  // Clusters
  const clusters = buildClusters(cohort);
  el("cluster-list").innerHTML = clusters.map(c=>`
    <div class="cluster-item">
      <div class="cluster-num" style="background:${c.bg};color:${c.color}">${c.num}</div>
      <div>
        <div class="cluster-name">${c.name}</div>
        <div class="cluster-desc">${c.desc}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="cluster-pct" style="color:${c.color}">${c.pct}</div>
        <div style="font-size:10px;font-weight:700;color:var(--hint)">${c.n} pts</div>
      </div>
    </div>`).join("");

  // Radar
  destroyChart("radar-chart");
  const ctx = el("radar-chart").getContext("2d");
  const fv  = buildVector(currentPatient);
  charts["radar-chart"] = new Chart(ctx, {
    type:"radar",
    data:{
      labels:["Diabetes Dx","Hypertension","Dyslipidemia","On Metformin","On ACE/ARB","On Statin"],
      datasets:[
        {
          label:"This patient",
          data:[fv.hasDiabetes?1:0, fv.hasHTN?1:0, fv.hasDyslipid?1:0, fv.onMetformin?1:0, fv.onACE?1:0, fv.onStatin?1:0],
          borderColor:"rgba(0,137,123,0.9)", backgroundColor:"rgba(0,137,123,0.15)",
          pointBackgroundColor:"rgba(0,137,123,1)", borderWidth:2
        },
        {
          label:"Cohort average",
          data: [
            cohort.reduce((s,c)=>s+(buildCohortVec(c)[0]),0)/cohort.length,
            cohort.reduce((s,c)=>s+(buildCohortVec(c)[1]),0)/cohort.length,
            cohort.reduce((s,c)=>s+(buildCohortVec(c)[2]),0)/cohort.length,
            cohort.reduce((s,c)=>s+(buildCohortVec(c)[3]),0)/cohort.length,
            cohort.reduce((s,c)=>s+(buildCohortVec(c)[4]),0)/cohort.length,
            cohort.reduce((s,c)=>s+(buildCohortVec(c)[5]),0)/cohort.length,
          ],
          borderColor:"rgba(92,107,192,0.7)", backgroundColor:"rgba(92,107,192,0.10)",
          pointBackgroundColor:"rgba(92,107,192,0.8)", borderWidth:2, borderDash:[4,3]
        }
      ]
    },
    options:{
      responsive:true,
      plugins:{ legend:{ position:"bottom", labels:{font:{size:11},boxWidth:12} } },
      scales:{ r:{ min:0, max:1, ticks:{stepSize:0.25,font:{size:10}}, pointLabels:{font:{size:11}} } }
    }
  });
}

/* Matches */
function renderMatches(cohort) {
  const filtered = currentFilter==="all" ? cohort : cohort.filter(c=>c.outcome===currentFilter);
  if (!filtered.length) {
    el("dg-list").innerHTML = `<div class="empty-state">${ic("search",32,"var(--hint)")}<p>No matches for this filter.</p></div>`;
    return;
  }
  el("dg-list").innerHTML = filtered.map((c,i)=>{
    const pct = Math.round(c.simScore*100);
    const simCls = pct>=85?"high":"mid";
    const tlHTML = c.timeline.map(t=>`
      <div class="tl-item">
        <div class="tl-dot ${t.type}">${ic(tlIcon(t.type),12,tlColor(t.type))}</div>
        <div class="tl-content">
          <div class="tl-event">${t.event}</div>
          <div class="tl-date">${ic("clock",10,"var(--hint)")} ${t.date}</div>
        </div>
      </div>`).join("");
    const reasonsHTML = c.matchReasons.map(r=>`
      <div class="reason-row">
        <span style="flex-shrink:0">${ic(r.icon,14,"var(--teal-dark)")}</span>
        <div class="reason-text"><span class="reason-key">${r.key}:</span> ${r.note}</div>
      </div>`).join("");
    return `
    <div class="dg-card fade d${Math.min(i+1,5)}" id="dgc-${c.id}" onclick="toggleCard('${c.id}')">
      <div class="dg-header">
        <div class="dg-sim-block">
          <div class="dg-sim-num ${simCls}">${pct}%</div>
          <div class="dg-sim-label">match</div>
        </div>
        <div class="dg-divider"></div>
        <div class="dg-info">
          <div class="dg-name">${c.name}</div>
          <div class="dg-meta">
            <span>${ic("user",11,"var(--hint)")} ${c.age}y · ${cap(c.gender)}</span>
            <span>${ic("git-branch",11,"var(--hint)")} ${c.timeline.length} events</span>
            <span>${ic("clock",11,"var(--hint)")} Day ${c.daysToEvent}</span>
          </div>
        </div>
        <span class="outcome-badge badge-${c.outcome}">
          ${ic(outcomeIcon(c.outcome),11,outcomeColor(c.outcome))} ${cap(c.outcome)}
        </span>
        <div class="dg-chevron">${ic("chevron-down",13,"currentColor")}</div>
      </div>
      <div class="dg-detail">
        <div class="dg-detail-grid">
          <div>
            <div class="dg-section">${ic("map",11,"var(--muted)")} Trajectory</div>
            <div class="timeline">${tlHTML}</div>
          </div>
          <div>
            <div class="dg-section">${ic("sparkles",11,"var(--muted)")} Why matched</div>
            ${reasonsHTML}
            <div class="dg-section" style="margin-top:14px">${ic("zap",11,"var(--muted)")} Turning point</div>
            <div class="turning-pt"><strong>Note:</strong> ${c.turningPoint}</div>
          </div>
        </div>
      </div>
    </div>`;
  }).join("");
}

function toggleCard(id) { el("dgc-"+id)?.classList.toggle("expanded"); }

/* Filter */
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  if (currentPatient) {
    const fv = buildVector(currentPatient);
    const cohort = DEMO_COHORT.map(c=>({...c, simScore:cosine(fv.vec,buildCohortVec(c))})).sort((a,b)=>b.simScore-a.simScore);
    renderMatches(cohort);
  }
}

/* Helpers */
function fpCard(iconName, cls, val, unit, label, sub, iconColor, iconBg) {
  return `<div class="fp-card ${cls}">
    <div class="fp-icon" style="background:${iconBg}">${ic(iconName,14,iconColor)}</div>
    <div class="fp-label">${label}</div>
    <div class="fp-val">${val}<span style="font-size:11px;font-weight:700">${unit}</span></div>
    <div class="fp-sub">${sub}</div>
  </div>`;
}

function destroyChart(id) { if(charts[id]) { charts[id].destroy(); delete charts[id]; } }

function el(id)          { return document.getElementById(id); }
function show(id)        { el(id).style.display = ""; }
function hide(id)        { el(id).style.display = "none"; }
function cap(s)          { return s?s[0].toUpperCase()+s.slice(1):""; }
function initials(name)  { return (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); }
function setLoadMsg(msg) { document.querySelector(".ld-sub").textContent = msg; }

function tlIcon(t)  { return {condition:"clipboard",medication:"pill",encounter:"stethoscope",outcome:"check-circle"}[t]||"clock"; }
function tlColor(t) { return {condition:"var(--indigo)",medication:"var(--teal-dark)",encounter:"var(--amber)",outcome:"var(--rose-dark)"}[t]||"var(--muted)"; }
function outcomeIcon(o)  { return {improved:"trending-up",hospitalized:"alert-circle",deteriorated:"trending-down"}[o]||"activity"; }
function outcomeColor(o) { return {improved:"var(--teal-dark)",hospitalized:"var(--amber)",deteriorated:"var(--rose-dark)"}[o]||"var(--muted)"; }
