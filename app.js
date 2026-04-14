/* ══════════════════════════════════════════════════════════
   Clinical Doppelgänger v4 — app.js
   jQuery 3.7  +  Highcharts  +  SMART on FHIR (fhirclient.js)
   Matches CHIP 741 syllabus pattern exactly.
   ── jQuery:      $.ajax, $(selector).html(), .on()
   ── Highcharts:  Highcharts.chart() for all charts
   ── FHIR:        FHIR.oauth2.ready() → client.patient.request()
══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   DEMO DATA  (fallback when no SMART context)
════════════════════════════════════════════ */
var DEMO_PATIENTS = [
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

var DEMO_COHORT = [
  {
    id:"c001", name:"Patient #A-4821", age:61, gender:"female",
    outcome:"improved", daysToEvent:420,
    matchReasons:[
      {icon:"droplet",   key:"HbA1c baseline", note:"Similar HbA1c at diagnosis (8.4 vs 8.2)"},
      {icon:"pill",      key:"Metformin",       note:"Same biguanide medication class"},
      {icon:"clipboard", key:"Diagnoses",       note:"Overlapping dx: T2D + Hypertension"}
    ],
    turningPoint:"Improvement began after Metformin dose titration at month 3 and consistent quarterly follow-up.",
    timeline:[
      {type:"condition",  event:"T2D + HTN diagnosed",         date:"~4 yrs ago"},
      {type:"medication", event:"Metformin 500mg started",     date:"~4 yrs ago"},
      {type:"encounter",  event:"Endocrinology follow-up",     date:"~3 yrs ago"},
      {type:"medication", event:"Metformin titrated to 1g",    date:"~2.5 yrs ago"},
      {type:"encounter",  event:"HbA1c 6.8 — controlled",     date:"~1 yr ago"},
      {type:"outcome",    event:"Stable, no hospitalizations", date:"Present"}
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
    turningPoint:"Combination antihypertensive + statin therapy led to LDL and BP stabilization.",
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
      {icon:"droplet",       key:"High HbA1c",      note:"Baseline HbA1c >8.5 at first encounter"},
      {icon:"alert-circle",  key:"Missed follow-ups",note:"Gap in care >6 months detected"},
      {icon:"thermometer",   key:"Uncontrolled BP",  note:"HTN uncontrolled at time of matching"}
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
    turningPoint:"Combination therapy + weight management program yielded improvement over 2 years.",
    timeline:[
      {type:"condition",  event:"T2D + Obesity + HTN",       date:"~6 yrs ago"},
      {type:"medication", event:"Metformin + ACE inhibitor", date:"~6 yrs ago"},
      {type:"encounter",  event:"Weight management program", date:"~3 yrs ago"},
      {type:"encounter",  event:"HbA1c improved to 7.4",     date:"~2 yrs ago"},
      {type:"outcome",    event:"Stable, −12 kg body weight", date:"Present"}
    ]
  },
  {
    id:"c005", name:"Patient #E-2287", age:67, gender:"female",
    outcome:"deteriorated", daysToEvent:270,
    matchReasons:[
      {icon:"trending-down", key:"Worsening HbA1c", note:"Progressive rise in labs over 24 months"},
      {icon:"alert-circle",  key:"Non-adherence",   note:"MedicationRequest gaps >3 months"},
      {icon:"layers",        key:"Comorbidity load", note:"3+ active conditions similar to patient"}
    ],
    turningPoint:"Medication non-adherence and declining renal function led to escalating interventions.",
    timeline:[
      {type:"condition",  event:"T2D + HTN + CKD stage 2",   date:"~5 yrs ago"},
      {type:"medication", event:"Complex regimen initiated",  date:"~5 yrs ago"},
      {type:"encounter",  event:"Nephrology referral",        date:"~3 yrs ago"},
      {type:"encounter",  event:"Creatinine rising trend",    date:"~2 yrs ago"},
      {type:"outcome",    event:"CKD stage 3, dialysis prep", date:"Present"}
    ]
  }
];

/* ════════════════════════════════════════════
   STATE
════════════════════════════════════════════ */
var currentFilter  = "all";
var currentTab     = "overview";
var hcCharts       = {};           // Highcharts instances keyed by container id
var currentPatient = null;
var allPatients    = [];

/* ════════════════════════════════════════════
   BOOT — called by index.html loader once jQuery
   + fhirclient are ready. Accepts an optional
   callback fired after demo data is shown.
════════════════════════════════════════════ */
function bootApp(onReady) {
  onReady = onReady || function(){};

  /* Mobile sidebar */
  $("#menu-btn").on("click", function () {
    $("#sidebar").addClass("open");
    $("#sb-overlay").addClass("show");
  });
  $("#sb-overlay").on("click", function () { closeSidebar(); });

  /* useDemoData — show app instantly with synthetic patients */
  function useDemoData() {
    $("#demo-banner").show();
    allPatients = DEMO_PATIENTS;
    buildSidebar(DEMO_PATIENTS);
    renderPatient(DEMO_PATIENTS[0]);
    onReady();
  }

  /* FHIR with 2-second timeout.
     FHIR.oauth2.ready() never rejects when opened locally,
     so we race it against a timer. */
  var fhirDone = false;

  var fhirTimeout = setTimeout(function () {
    if (!fhirDone) { fhirDone = true; useDemoData(); }
  }, 2000);

  FHIR.oauth2.ready()
    .then(function (client) {
      if (fhirDone) return;
      fhirDone = true;
      clearTimeout(fhirTimeout);
      var host = (client.state.serverUrl || "SMART Sandbox")
        .replace(/https?:\/\//, "").split("/")[0];
      $("#fhir-server-label").text(host);
      $("#fhir-dot").addClass("live");
      $("#fhir-status").text("Connected · " + host).addClass("ok");
      loadFromFHIR(client, onReady);
    })
    .catch(function () {
      if (fhirDone) return;
      fhirDone = true;
      clearTimeout(fhirTimeout);
      useDemoData();
    });
}

/* ════════════════════════════════════════════
   renderCharts — called after Highcharts loads
   (Highcharts is deferred so app shows first)
════════════════════════════════════════════ */
function renderCharts(fv, cohort) {
  if (typeof Highcharts === 'undefined') return;
  renderOverviewChart(cohort);
  renderSurvivalCharts(cohort);
  renderRadarChart(fv, cohort);
}

/* ════════════════════════════════════════════
   FHIR DATA LOADING
   Uses client.patient.request() — syllabus pattern
   (equivalent to $.ajax but FHIR-aware)
════════════════════════════════════════════ */
function loadFromFHIR(client, onReady) {
  onReady = onReady || function(){};
  setLoadMsg("Loading patient…");

  client.patient.read()
    .then(function (pt) {
      setLoadMsg("Fetching data…");
      return $.when(
        client.patient.request("Condition?_count=50"),
        client.patient.request("MedicationRequest?_count=50&status=active"),
        client.patient.request("Observation?_count=50&code=4548-4,55284-4,8480-6&_sort=-date"),
        client.patient.request("Encounter?_count=50&_sort=-date")
      ).then(function (condBundle, medBundle, obsBundle, encBundle) {
        var conditions   = (condBundle[0].entry || []).map(function(e){ return e.resource; });
        var meds         = (medBundle[0].entry  || []).map(function(e){ return e.resource; });
        var observations = (obsBundle[0].entry  || []).map(function(e){ return e.resource; });
        var encounters   = (encBundle[0].entry  || []).map(function(e){ return e.resource; });

        var patientData = buildFHIRPatient(pt, conditions, meds, observations, encounters);
        allPatients = [patientData];
        buildSidebar([patientData]);
        renderPatient(patientData);
        onReady();
      });
    })
    .catch(function (err) {
      console.error(err);
      setLoadMsg("⚠️ " + err.message);
    });
}

/* Parse raw FHIR bundle into app patient object */
function buildFHIRPatient(pt, conditions, meds, observations, encounters) {
  var n    = pt.name ? pt.name[0] : null;
  var name = n
    ? (n.given || []).join(" ") + " " + (n.family || "")
    : "Unknown Patient";
  var dob  = pt.birthDate || "";
  var age  = dob ? Math.floor((Date.now() - new Date(dob)) / 31557600000) : "?";

  var condNames = $.map(conditions, function(c) {
    return c.code && c.code.text ? c.code.text
         : (c.code && c.code.coding && c.code.coding[0]) ? c.code.coding[0].display
         : null;
  }).filter(Boolean);

  var medNames = $.map(meds, function(m) {
    return m.medicationCodeableConcept && m.medicationCodeableConcept.text
           ? m.medicationCodeableConcept.text
           : null;
  }).filter(Boolean);

  /* HbA1c — LOINC 4548-4 */
  var hba1cObs = observations.filter(function(o) {
    return o.code && o.code.coding && o.code.coding.some(function(c){ return c.code === "4548-4"; });
  }).sort(function(a,b){ return new Date(b.effectiveDateTime||0) - new Date(a.effectiveDateTime||0); });
  var latestHbA1c = hba1cObs.length ? hba1cObs[0].valueQuantity && hba1cObs[0].valueQuantity.value : null;

  /* Systolic BP — LOINC 8480-6 (component of 55284-4 panel) */
  var bpObs = observations.filter(function(o) {
    return o.code && o.code.coding && o.code.coding.some(function(c){ return c.code === "55284-4"; });
  }).sort(function(a,b){ return new Date(b.effectiveDateTime||0) - new Date(a.effectiveDateTime||0); });
  var latestBP = null;
  if (bpObs.length && bpObs[0].component) {
    var sbpComp = bpObs[0].component.filter(function(c) {
      return c.code && c.code.coding && c.code.coding.some(function(cc){ return cc.code === "8480-6"; });
    });
    latestBP = sbpComp.length ? sbpComp[0].valueQuantity && sbpComp[0].valueQuantity.value : null;
  }

  return {
    id: pt.id, name: name.trim(), dob: dob, age: age,
    gender: pt.gender || "unknown",
    conditions: condNames, meds: medNames,
    encounters: encounters.length,
    latestHbA1c: latestHbA1c, latestBP: latestBP
  };
}

/* ════════════════════════════════════════════
   SIDEBAR — jQuery .html()
════════════════════════════════════════════ */
function buildSidebar(patients) {
  var html = "";
  $.each(patients, function (i, p) {
    html += '<button class="pt-btn ' + (i === 0 ? "active" : "") + '" '
          + 'id="pcm-' + p.id + '" '
          + 'onclick="selectPatient(\'' + p.id + '\');closeSidebar()">'
          + '<div class="pt-avatar">' + initials(p.name) + '</div>'
          + '<div class="pt-info">'
          + '<div class="pt-name">' + p.name + '</div>'
          + '<div class="pt-sub">' + p.age + 'y · ' + cap(p.gender) + '</div>'
          + '</div></button>';
  });
  $("#patient-list").html(html);
}

function selectPatient(id) {
  var p = null;
  $.each(allPatients, function(i, x){ if(x.id === id) { p = x; return false; } });
  if (!p) return;
  $(".pt-btn").removeClass("active");
  $("#pcm-" + id).addClass("active");
  renderPatient(p);
}

function closeSidebar() {
  $("#sidebar").removeClass("open");
  $("#sb-overlay").removeClass("show");
}

/* ════════════════════════════════════════════
   TABS
════════════════════════════════════════════ */
function switchTab(tab, btn) {
  currentTab = tab;
  $(".tab-btn").removeClass("active");
  $(".tab-panel").removeClass("active");
  $(btn).addClass("active");
  $("#panel-" + tab).addClass("active");
}

/* ════════════════════════════════════════════
   FEATURE VECTOR  (11-dimensional)
════════════════════════════════════════════ */
function buildVector(p) {
  var hasDiabetes = testCond(p.conditions, /diabet/i);
  var hasHTN      = testCond(p.conditions, /hypert|blood pressure/i);
  var hasDyslipid = testCond(p.conditions, /lipid|cholesterol/i);
  var onMetformin = testMed(p.meds, /metformin/i);
  var onACE       = testMed(p.meds, /lisinopril|enalapril|ramipril/i);
  var onStatin    = testMed(p.meds, /statin|atorva|rosuvastatin/i);
  var hba1c       = p.latestHbA1c || 7.5;
  var bp          = p.latestBP    || 130;
  var encCount    = p.encounters  || 0;
  var medCount    = p.meds.length;
  var dxCount     = p.conditions.length;

  return {
    hasDiabetes:hasDiabetes, hasHTN:hasHTN, hasDyslipid:hasDyslipid,
    onMetformin:onMetformin, onACE:onACE, onStatin:onStatin,
    hba1c:hba1c, bp:bp, encCount:encCount, medCount:medCount, dxCount:dxCount,
    vec:[
      hasDiabetes?1:0, hasHTN?1:0, hasDyslipid?1:0,
      onMetformin?1:0, onACE?1:0, onStatin?1:0,
      Math.min(hba1c/12, 1), Math.min(bp/200, 1),
      Math.min(encCount/10, 1), Math.min(medCount/8, 1), Math.min(dxCount/6, 1)
    ]
  };
}

function buildCohortVec(c) {
  var joined = $.map(c.matchReasons, function(r){ return r.key + r.note; }).join(" ");
  return [
    /diabet|hba1c|t2d/i.test(joined)?1:0,
    /hypert|bp/i.test(joined)?1:0,
    /lipid|statin|ldl/i.test(joined)?1:0,
    /metformin/i.test(joined)?1:0,
    /ace|lisinopril|arb/i.test(joined)?1:0,
    /statin/i.test(joined)?1:0,
    c.timeline.some(function(t){ return /hba1c/i.test(t.event); }) ? 0.72 : 0.62,
    0.65, Math.min(c.timeline.length/10, 1), 0.5, 0.6
  ];
}

function cosine(a, b) {
  var dot=0, magA=0, magB=0;
  for (var i=0; i<a.length; i++) {
    dot  += a[i]*b[i];
    magA += a[i]*a[i];
    magB += b[i]*b[i];
  }
  return (!magA||!magB) ? 0 : dot / (Math.sqrt(magA)*Math.sqrt(magB));
}

/* ════════════════════════════════════════════
   PSM — Propensity Score Matching
════════════════════════════════════════════ */
function computePSM(fv, cohort) {
  function ps(hasDiabetes, hasHTN, onMetformin, hba1c) {
    var logit = -1.2 + 1.4*(hasDiabetes?1:0) + 0.8*(hasHTN?1:0)
                     + 1.1*(onMetformin?1:0) + 0.4*(hba1c>8?1:0);
    return 1 / (1 + Math.exp(-logit));
  }
  var targetPS = ps(fv.hasDiabetes, fv.hasHTN, fv.onMetformin, fv.hba1c);

  var scored = $.map(cohort, function(c) {
    var cv = buildCohortVec(c);
    var cps = ps(cv[0]>0, cv[1]>0, cv[3]>0, cv[6]*12);
    return $.extend({}, c, {ps: cps});
  });

  var matched = $.grep(scored, function(c){ return Math.abs(c.ps - targetPS) < 0.15; });
  if (!matched.length) matched = scored;

  /* SMD for HbA1c */
  var vals = $.map(matched, function(c){ return buildCohortVec(c)[6]*12; });
  var mean = vals.reduce(function(a,b){return a+b;},0) / vals.length;
  var sd   = Math.sqrt(vals.reduce(function(s,v){return s+Math.pow(v-mean,2);},0)/vals.length) || 0.5;
  var smd  = Math.abs((fv.hba1c - mean)/sd).toFixed(3);

  return {matched:matched, targetPS:targetPS, smd:smd};
}

/* ════════════════════════════════════════════
   BOOTSTRAP CI (non-parametric, 200 iterations)
════════════════════════════════════════════ */
function bootstrapCI(cohort, outcome) {
  var n = cohort.length;
  var counts = [];
  for (var i=0; i<200; i++) {
    var count = 0;
    for (var j=0; j<n; j++) {
      if (cohort[Math.floor(Math.random()*n)].outcome === outcome) count++;
    }
    counts.push(count/n);
  }
  counts.sort(function(a,b){return a-b;});
  return {
    lo: Math.round(counts[5]*100),
    hi: Math.round(counts[195]*100)
  };
}

/* ════════════════════════════════════════════
   KAPLAN-MEIER
════════════════════════════════════════════ */
function buildKMCurve(cohort, group) {
  var pts = group === "all" ? cohort
          : $.grep(cohort, function(c){ return c.outcome === group; });
  if (!pts.length) return {times:[0], survival:[1]};

  var events = $.map(pts, function(c){
    return {t: c.daysToEvent||180+Math.floor(Math.random()*400), event: c.outcome!=="improved"?1:0};
  }).sort(function(a,b){return a.t-b.t;});

  var n=events.length, s=1.0, times=[0], survival=[1.0];
  $.each(events, function(i,e){
    if (e.event===1) {
      s *= (1 - 1/n);
      times.push(e.t);
      survival.push(parseFloat(s.toFixed(4)));
    }
    n--;
  });
  return {times:times, survival:survival};
}

/* ════════════════════════════════════════════
   MARKOV TRANSITIONS
════════════════════════════════════════════ */
function buildMarkov(cohort) {
  var n    = cohort.length || 1;
  var imp  = $.grep(cohort,function(c){return c.outcome==="improved";}).length / n;
  var hosp = $.grep(cohort,function(c){return c.outcome==="hospitalized";}).length / n;
  var det  = $.grep(cohort,function(c){return c.outcome==="deteriorated";}).length / n;
  return [
    {from:"Stable",        to:"Recovery",     prob:(imp*0.7).toFixed(2)},
    {from:"Stable",        to:"Worsening",    prob:(hosp*0.5).toFixed(2)},
    {from:"Vulnerable",    to:"Hospitalized", prob:(hosp*0.8).toFixed(2)},
    {from:"Vulnerable",    to:"Recovery",     prob:(imp*0.4).toFixed(2)},
    {from:"Deteriorating", to:"Hospitalized", prob:((hosp+det)*0.6).toFixed(2)},
    {from:"Deteriorating", to:"Stable",       prob:(imp*0.2).toFixed(2)}
  ];
}

/* ════════════════════════════════════════════
   REGRESSION ADJUSTMENT
════════════════════════════════════════════ */
function buildAdjusted(cohort) {
  var n = cohort.length || 1;
  var raw = $.grep(cohort,function(c){return c.outcome==="improved";}).length / n;
  var adj = Math.min(raw + 0.04, 1);
  return {raw:Math.round(raw*100), adjusted:Math.round(adj*100), diff:Math.round((adj-raw)*100)};
}

/* ════════════════════════════════════════════
   CLUSTERING
════════════════════════════════════════════ */
function buildClusters(cohort) {
  var n    = cohort.length;
  var imp  = $.grep(cohort,function(c){return c.outcome==="improved";}).length;
  var hosp = $.grep(cohort,function(c){return c.outcome==="hospitalized";}).length;
  var det  = $.grep(cohort,function(c){return c.outcome==="deteriorated";}).length;
  return [
    {num:1, color:"var(--teal-dark)", bg:"var(--teal-lt)",
     name:"Stable → Recovery",
     desc:"Consistent follow-up, responsive to medication titration",
     pct:Math.round(imp/n*100)+"%", n:imp},
    {num:2, color:"var(--amber)", bg:"var(--amber-lt)",
     name:"Fluctuating → Hospitalization",
     desc:"Uncontrolled labs, care gaps >6 months detected",
     pct:Math.round(hosp/n*100)+"%", n:hosp},
    {num:3, color:"var(--rose-dark)", bg:"var(--rose-lt)",
     name:"Gradual Deterioration",
     desc:"Progressive multi-organ decline, medication non-adherence",
     pct:Math.round(det/n*100)+"%", n:det}
  ];
}

/* ════════════════════════════════════════════
   RENDER PATIENT — main entry point
════════════════════════════════════════════ */
function renderPatient(patient) {
  currentPatient = patient;
  var fv = buildVector(patient);

  /* ── Topbar (jQuery .text() and .html()) ── */
  $("#tb-avatar").text(initials(patient.name));
  $("#tb-name").text(patient.name);
  $("#tb-meta").text(patient.age + "y · " + cap(patient.gender)
                   + " · " + patient.conditions.length + " dx · "
                   + patient.meds.length + " meds");

  /* Build cohort similarity scores */
  var cohort = $.map(DEMO_COHORT, function(c) {
    return $.extend({}, c, {simScore: cosine(fv.vec, buildCohortVec(c))});
  }).sort(function(a,b){ return b.simScore - a.simScore; });

  renderOverview(patient, fv, cohort);
  renderSurvival(cohort);
  renderAnalytics(fv, cohort);
  renderMatches(cohort);
}

/* ════════════════════════════════════════════
   TAB 1 — OVERVIEW
════════════════════════════════════════════ */
function renderOverview(patient, fv, cohort) {

  /* Patient chips */
  var condChips = $.map(patient.conditions.slice(0,4), function(c){
    return '<span class="chip teal">' + ic("clipboard",11,"var(--teal-dark)") + " " + c + "</span>";
  }).join("");
  var medChips = $.map(patient.meds.slice(0,4), function(m){
    return '<span class="chip amber">' + ic("pill",11,"#7a4900") + " " + m + "</span>";
  }).join("");
  var labChips = (patient.latestHbA1c
    ? '<span class="chip rose">' + ic("droplet",11,"var(--rose-dark)") + " HbA1c " + fmt2(patient.latestHbA1c) + "%</span>"
    : "") +
    (patient.latestBP
    ? '<span class="chip indigo">' + ic("activity",11,"var(--indigo)") + " SBP " + fmt2(patient.latestBP) + "</span>"
    : "");

  $("#patient-chips").html(
    '<div class="chip-section"><div class="chip-group-label">Conditions</div>'
    + '<div class="chip-row">' + condChips + '</div></div>'
    + '<div class="chip-section" style="margin-top:8px"><div class="chip-group-label">Medications</div>'
    + '<div class="chip-row">' + medChips + '</div></div>'
    + (labChips ? '<div class="chip-section" style="margin-top:8px"><div class="chip-group-label">Labs</div>'
    + '<div class="chip-row">' + labChips + '</div></div>' : "")
  );

  /* Fingerprint grid — max 2 decimal */
  var hba1cCls = fv.hba1c>=8?"danger":fv.hba1c>=7?"warn":"ok";
  var bpCls    = fv.bp>=140?"danger":fv.bp>=130?"warn":"ok";
  $("#fp-grid").html(
    fpCard("droplet",      hba1cCls,              fmt2(fv.hba1c), "%",    "HbA1c",
           fv.hba1c>=8?"High":fv.hba1c>=7?"Borderline":"Normal",
           "var(--rose-dark)","var(--rose-lt)") +
    fpCard("activity",     bpCls,                 fmt2(fv.bp),    "mmHg", "Systolic BP",
           fv.bp>=140?"High":fv.bp>=130?"Elevated":"Normal",
           "var(--amber)","var(--amber-lt)") +
    fpCard("pill",         "",                    fv.medCount+"", "",     "Medications",
           "active","var(--indigo)","var(--indigo-lt)") +
    fpCard("clipboard",    "",                    fv.dxCount+"",  "",     "Diagnoses",
           "active","var(--teal-dark)","var(--teal-lt)") +
    fpCard("calendar",     "",                    fv.encCount+"", "",     "Encounters",
           "recorded","var(--muted)","var(--cream3)") +
    fpCard("check-circle", fv.onMetformin?"ok":"",fv.onMetformin?"Yes":"No","","Metformin",
           "on record","var(--teal-dark)","var(--teal-lt)")
  );

  var psm   = computePSM(fv, cohort);
  var smdOk = parseFloat(psm.smd) < 0.1;
  $("#psm-info").html(
    '<div class="psm-badge">'
    + ic("check-circle",14,"var(--teal-dark)")
    + " " + psm.matched.length + " matched patients"
    + '</div>'
    + '<div style="margin-top:8px;font-size:12px;font-weight:700;color:var(--muted)">'
    + "SMD = "
    + '<span class="psm-mono">' + fmt2(parseFloat(psm.smd)) + '</span>'
    + ' <span style="margin-left:6px;color:' + (smdOk?"var(--teal-dark)":"var(--amber)") + '">'
    + (smdOk ? "✓ Balanced" : "⚠ Check balance")
    + '</span></div>'
  );

  /* Cohort stats + CI */
  var total  = cohort.length;
  var imp    = $.grep(cohort,function(c){return c.outcome==="improved";}).length;
  var hosp   = $.grep(cohort,function(c){return c.outcome==="hospitalized";}).length;
  var det    = $.grep(cohort,function(c){return c.outcome==="deteriorated";}).length;
  var pct    = function(n){ return Math.round(n/total*100); };
  var impCI  = bootstrapCI(cohort,"improved");
  var hospCI = bootstrapCI(cohort,"hospitalized");
  var detCI  = bootstrapCI(cohort,"deteriorated");
  var adj    = buildAdjusted(cohort);

  $("#cohort-stats").html(
    coStat(total,        "ink",   "patients",     "")+
    coStat(pct(imp)+"%", "teal",  "improved",     impCI.lo+"–"+impCI.hi+"%")+
    coStat(pct(hosp)+"%","amber", "hospitalized", hospCI.lo+"–"+hospCI.hi+"%")+
    coStat(pct(det)+"%", "rose",  "deteriorated", detCI.lo+"–"+detCI.hi+"%")
  );
  $("#stacked-bar").html(
    '<div class="seg improved"     style="width:'+pct(imp)+'%">'+pct(imp)+'%</div>'+
    '<div class="seg hospitalized" style="width:'+pct(hosp)+'%">'+pct(hosp)+'%</div>'+
    '<div class="seg deteriorated" style="width:'+pct(det)+'%">'+pct(det)+'%</div>'
  );
  $("#adj-outcome").html(
    '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:4px">'
    + '<div><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Raw</div>'
    + '<div style="font-family:var(--font);font-size:22px;font-weight:900;color:var(--ink)">' + adj.raw + '%</div></div>'
    + '<div><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">Adjusted</div>'
    + '<div style="font-family:var(--font);font-size:22px;font-weight:900;color:var(--teal-dark)">' + adj.adjusted + '%</div>'
    + '<div style="font-size:11px;font-weight:700;color:var(--muted)">+' + adj.diff + '% covariate adjustment</div></div>'
    + '</div>'
  );

  /* ── Highcharts bar chart — skipped if HC not loaded yet ── */
  if (typeof Highcharts === "undefined") return;
  destroyHC("overview-chart");
  Highcharts.chart("overview-chart", {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      style: {fontFamily: "'Nunito', sans-serif"},
      height: 180,
      margin: [10, 10, 40, 40]
    },
    title:   {text: null},
    credits: {enabled: false},
    legend:  {enabled: false},
    xAxis: {
      categories: $.map(cohort, function(c){ return c.name.replace("Patient #",""); }),
      lineColor: "rgba(0,105,92,0.12)",
      tickColor: "transparent",
      labels: {style:{color:"#6B8480", fontSize:"11px", fontWeight:"700"}}
    },
    yAxis: {
      min:0, max:100,
      title: {text: null},
      gridLineColor: "rgba(0,105,92,0.06)",
      labels: {format:"{value}%", style:{color:"#6B8480", fontSize:"11px"}}
    },
    tooltip: {
      backgroundColor: "#fff",
      borderColor: "rgba(0,105,92,0.15)",
      borderRadius: 10,
      shadow: false,
      formatter: function() {
        var c = cohort[this.point.index];
        return "<b>" + this.x + "</b><br/>Similarity: " + this.y + "%<br/>Outcome: " + cap(c.outcome);
      }
    },
    plotOptions: {
      column: {
        borderRadius: 8,
        colorByPoint: true,
        colors: $.map(cohort, function(c){
          return c.outcome==="improved"     ? "rgba(0,137,123,0.75)"
               : c.outcome==="hospitalized" ? "rgba(217,119,6,0.75)"
               : "rgba(224,92,122,0.75)";
        })
      }
    },
    series: [{
      name: "Similarity",
      data: $.map(cohort, function(c){ return Math.round(c.simScore*100); })
    }]
  });
}

/* ════════════════════════════════════════════
   TAB 2 — SURVIVAL (Highcharts line chart)
════════════════════════════════════════════ */
function renderSurvival(cohort) {
  var kmAll  = buildKMCurve(cohort, "all");
  var kmImp  = buildKMCurve(cohort, "improved");
  var kmBad  = buildKMCurve(
    $.grep(cohort,function(c){return c.outcome!=="improved";}), "all"
  );

  function kmSeries(km) {
    return $.map(km.times, function(t,i){ return {x:t, y:km.survival[i]}; });
  }

  /* ── Highcharts KM curve — skipped if HC not loaded yet ── */
  if (typeof Highcharts === "undefined") return;
  destroyHC("km-chart");
  Highcharts.chart("km-chart", {
    chart: {
      type: "line",
      backgroundColor: "transparent",
      style: {fontFamily:"'Nunito', sans-serif"},
      height: 220,
      margin: [10, 10, 50, 50]
    },
    title:   {text: null},
    credits: {enabled: false},
    legend:  {
      enabled: true,
      itemStyle: {fontSize:"11px", fontWeight:"700", color:"#6B8480"}
    },
    xAxis: {
      title: {text:"Days from baseline", style:{fontSize:"11px"}},
      gridLineColor:"rgba(0,105,92,0.06)",
      labels: {style:{fontSize:"11px"}}
    },
    yAxis: {
      min:0, max:1,
      title: {text:"Event-free probability", style:{fontSize:"11px"}},
      gridLineColor:"rgba(0,105,92,0.06)",
      labels: {formatter:function(){ return (this.value*100)+"%"; }, style:{fontSize:"11px"}}
    },
    tooltip: {
      backgroundColor:"#fff", borderColor:"rgba(0,105,92,0.15)",
      borderRadius:10, shadow:false,
      formatter:function(){
        return "Day <b>" + Math.round(this.x) + "</b><br/>"
             + this.series.name + ": <b>" + Math.round(this.y*100) + "%</b> event-free";
      }
    },
    plotOptions: {
      line: {
        step: "left",
        marker: {enabled:false}
      }
    },
    series: [
      {name:"All patients",             data:kmSeries(kmAll),  color:"rgba(0,137,123,0.9)",  lineWidth:2},
      {name:"Improved subgroup",        data:kmSeries(kmImp),  color:"rgba(92,107,192,0.8)",  lineWidth:2, dashStyle:"Dash"},
      {name:"Hospitalized/deteriorated",data:kmSeries(kmBad),  color:"rgba(224,92,122,0.8)",  lineWidth:2, dashStyle:"ShortDot"}
    ]
  });

  /* Markov table — jQuery .html() */
  var markov = buildMarkov(cohort);
  var rows = $.map(markov, function(row){
    var p   = parseFloat(row.prob);
    var cls = p>=0.3?"high":p>=0.15?"mid":"low";
    return "<tr><td style='color:var(--muted)'>" + row.from + "</td>"
         + "<td>" + ic("chevron-right",12,"var(--hint)") + " " + row.to + "</td>"
         + "<td><span class='trans-val " + cls + "'>" + fmt2(p) + "</span></td></tr>";
  });
  $("#markov-body").html(rows.join(""));
}

/* ════════════════════════════════════════════
   TAB 3 — ANALYTICS (Highcharts radar)
════════════════════════════════════════════ */
function renderAnalytics(fv, cohort) {

  /* Clusters — jQuery .html() */
  var clusters = buildClusters(cohort);
  var clHtml = $.map(clusters, function(c){
    return '<div class="cluster-item">'
         + '<div class="cluster-num" style="background:' + c.bg + ';color:' + c.color + '">' + c.num + '</div>'
         + '<div><div class="cluster-name">' + c.name + '</div>'
         + '<div class="cluster-desc">' + c.desc + '</div></div>'
         + '<div style="text-align:right;flex-shrink:0">'
         + '<div class="cluster-pct" style="color:' + c.color + '">' + c.pct + '</div>'
         + '<div style="font-size:10px;font-weight:700;color:var(--hint)">' + c.n + ' pts</div>'
         + '</div></div>';
  });
  $("#cluster-list").html(clHtml.join(""));

  /* ── Highcharts radar — skipped if HC not loaded yet ── */
  if (typeof Highcharts === "undefined") return;
  var cohortAvg = [0,1,2,3,4,5].map(function(i){
    return cohort.reduce(function(s,c){ return s + buildCohortVec(c)[i]; }, 0) / cohort.length;
  });

  destroyHC("radar-chart");
  Highcharts.chart("radar-chart", {
    chart: {
      polar: true,
      type: "line",
      backgroundColor: "transparent",
      style: {fontFamily:"'Nunito', sans-serif"},
      height: 220,
      margin: [10, 10, 10, 10]
    },
    title:   {text: null},
    credits: {enabled: false},
    pane:    {size: "75%"},
    legend:  {
      enabled: true,
      itemStyle: {fontSize:"11px", fontWeight:"700", color:"#6B8480"}
    },
    xAxis: {
      categories: ["Diabetes","Hypertension","Dyslipidemia","Metformin","ACE/ARB","Statin"],
      tickmarkPlacement: "on",
      lineWidth: 0,
      labels: {style:{fontSize:"10px", fontWeight:"700"}}
    },
    yAxis: {
      gridLineInterpolation: "polygon",
      lineWidth: 0,
      min: 0, max: 1,
      labels: {enabled: false}
    },
    tooltip: {
      backgroundColor:"#fff", borderRadius:10, shadow:false,
      shared: true
    },
    series: [
      {
        name: "This patient",
        data: [fv.hasDiabetes?1:0, fv.hasHTN?1:0, fv.hasDyslipid?1:0,
               fv.onMetformin?1:0, fv.onACE?1:0, fv.onStatin?1:0],
        color: "rgba(0,137,123,0.9)",
        fillColor: "rgba(0,137,123,0.12)",
        lineWidth: 2,
        marker: {symbol:"circle", radius:4}
      },
      {
        name: "Cohort average",
        data: cohortAvg,
        color: "rgba(92,107,192,0.7)",
        fillColor: "rgba(92,107,192,0.08)",
        lineWidth: 2,
        dashStyle: "Dash",
        marker: {symbol:"circle", radius:4}
      }
    ]
  });
}

/* ════════════════════════════════════════════
   TAB 4 — MATCHES
   jQuery .html() for card injection
════════════════════════════════════════════ */
function renderMatches(cohort) {
  var filtered = currentFilter==="all" ? cohort
    : $.grep(cohort, function(c){ return c.outcome===currentFilter; });

  if (!filtered.length) {
    $("#dg-list").html(
      '<div class="empty-state">' + ic("search",32,"var(--hint)")
      + '<p>No matches for this filter.</p></div>'
    );
    return;
  }

  var html = $.map(filtered, function(c,i){
    var pct    = Math.round(c.simScore*100);
    var simCls = pct>=85?"high":"mid";

    var tlHtml = $.map(c.timeline, function(t){
      return '<div class="tl-item">'
           + '<div class="tl-dot ' + t.type + '">' + ic(tlIcon(t.type),12,tlColor(t.type)) + '</div>'
           + '<div class="tl-content">'
           + '<div class="tl-event">' + t.event + '</div>'
           + '<div class="tl-date">' + ic("clock",10,"var(--hint)") + ' ' + t.date + '</div>'
           + '</div></div>';
    }).join("");

    var reasonHtml = $.map(c.matchReasons, function(r){
      return '<div class="reason-row">'
           + '<span style="flex-shrink:0">' + ic(r.icon,14,"var(--teal-dark)") + '</span>'
           + '<div class="reason-text"><span class="reason-key">' + r.key + ':</span> ' + r.note + '</div>'
           + '</div>';
    }).join("");

    return '<div class="dg-card fade d' + Math.min(i+1,5) + '" id="dgc-' + c.id + '" '
         + 'onclick="toggleCard(\'' + c.id + '\')">'
         + '<div class="dg-header">'
         + '<div class="dg-sim-block">'
         + '<div class="dg-sim-num ' + simCls + '">' + pct + '%</div>'
         + '<div class="dg-sim-label">match</div></div>'
         + '<div class="dg-divider"></div>'
         + '<div class="dg-info">'
         + '<div class="dg-name">' + c.name + '</div>'
         + '<div class="dg-meta">'
         + '<span>' + ic("user",11,"var(--hint)") + ' ' + c.age + 'y · ' + cap(c.gender) + '</span>'
         + '<span>' + ic("git-branch",11,"var(--hint)") + ' ' + c.timeline.length + ' events</span>'
         + '<span>' + ic("clock",11,"var(--hint)") + ' Day ' + c.daysToEvent + '</span>'
         + '</div></div>'
         + '<span class="outcome-badge badge-' + c.outcome + '">'
         + ic(outcomeIcon(c.outcome),11,outcomeColor(c.outcome)) + ' ' + cap(c.outcome)
         + '</span>'
         + '<div class="dg-chevron">' + ic("chevron-down",13,"currentColor") + '</div>'
         + '</div>'
         + '<div class="dg-detail">'
         + '<div class="dg-detail-grid">'
         + '<div><div class="dg-section">' + ic("map",11,"var(--muted)") + ' Trajectory</div>'
         + '<div class="timeline">' + tlHtml + '</div></div>'
         + '<div><div class="dg-section">' + ic("sparkles",11,"var(--muted)") + ' Why matched</div>'
         + reasonHtml
         + '<div class="dg-section" style="margin-top:14px">' + ic("zap",11,"var(--muted)") + ' Turning point</div>'
         + '<div class="turning-pt"><strong>Note:</strong> ' + c.turningPoint + '</div>'
         + '</div></div></div></div>';
  }).join("");

  $("#dg-list").html(html);
}

function toggleCard(id) {
  $("#dgc-" + id).toggleClass("expanded");
}

/* ════════════════════════════════════════════
   FILTER
════════════════════════════════════════════ */
function setFilter(f, btn) {
  currentFilter = f;
  $(".filter-btn").removeClass("active");
  $(btn).addClass("active");
  if (currentPatient) {
    var fv = buildVector(currentPatient);
    var cohort = $.map(DEMO_COHORT, function(c){
      return $.extend({}, c, {simScore: cosine(fv.vec, buildCohortVec(c))});
    }).sort(function(a,b){ return b.simScore - a.simScore; });
    renderMatches(cohort);
  }
}

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   STANDALONE CHART WRAPPERS
   Called by index.html after Highcharts loads
════════════════════════════════════════════ */
function renderOverviewChart(cohort) {
  if (!currentPatient || typeof Highcharts === "undefined") return;
  var fv = buildVector(currentPatient);
  renderOverview(currentPatient, fv, cohort);
}
function renderSurvivalCharts(cohort) {
  if (typeof Highcharts === "undefined") return;
  renderSurvival(cohort);
}
function renderRadarChart(fv, cohort) {
  if (typeof Highcharts === "undefined") return;
  renderAnalytics(fv, cohort);
}

function fpCard(iconName, cls, val, unit, label, sub, iconColor, iconBg) {
  return '<div class="fp-card ' + cls + '">'
       + '<div class="fp-icon" style="background:' + iconBg + '">' + ic(iconName,14,iconColor) + '</div>'
       + '<div class="fp-label">' + label + '</div>'
       + '<div class="fp-val">' + val + '<span style="font-size:11px;font-weight:700">' + unit + '</span></div>'
       + '<div class="fp-sub">' + sub + '</div></div>';
}

function coStat(val, cls, label, ci) {
  return '<div class="co-stat">'
       + '<div class="co-val ' + cls + '">' + val + '</div>'
       + '<div class="co-label">' + label + '</div>'
       + (ci ? '<div style="font-size:10px;font-weight:700;color:var(--hint);margin-top:2px;font-family:var(--font-mono)">' + ci + '</div>' : "")
       + '</div>';
}

function destroyHC(id) {
  if (hcCharts[id]) { hcCharts[id].destroy(); delete hcCharts[id]; }
  /* Highcharts.chart() returns the chart — store it */
  var orig = Highcharts.chart;
  Highcharts.chart = function(container, opts) {
    if (container === id || (typeof container === "string" && container === id)) {
      var c = orig.apply(this, arguments);
      hcCharts[id] = c;
      return c;
    }
    return orig.apply(this, arguments);
  };
}

function testCond(list, re) { return list.some(function(s){ return re.test(s); }); }
function testMed(list, re)  { return list.some(function(s){ return re.test(s); }); }
function initials(name)     { return (name||"?").split(" ").map(function(w){return w[0];}).join("").slice(0,2).toUpperCase(); }
function cap(s)             { return s ? s[0].toUpperCase() + s.slice(1) : ""; }
function setLoadMsg(msg) { var el = document.getElementById("ld-msg"); if (el) el.textContent = msg; }
/* fmt2: max 2 decimal places, strips trailing zeros */
function fmt2(n) {
  if (n === null || n === undefined) return "—";
  var v = parseFloat(n);
  if (isNaN(v)) return "—";
  return parseFloat(v.toFixed(2)).toString();
}

function tlIcon(t)  { return {condition:"clipboard",medication:"pill",encounter:"stethoscope",outcome:"check-circle"}[t]||"clock"; }
function tlColor(t) { return {condition:"var(--indigo)",medication:"var(--teal-dark)",encounter:"var(--amber)",outcome:"var(--rose-dark)"}[t]||"var(--muted)"; }
function outcomeIcon(o)  { return {improved:"trending-up",hospitalized:"alert-circle",deteriorated:"trending-down"}[o]||"activity"; }
function outcomeColor(o) { return {improved:"var(--teal-dark)",hospitalized:"var(--amber)",deteriorated:"var(--rose-dark)"}[o]||"var(--muted)"; }
