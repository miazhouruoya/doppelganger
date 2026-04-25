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
var currentMatchedCohort = [];
var MATCH_API_URL = "/api/match";
var FHIR_MATCH_API_URL = "/api/fhir-match";

function hasSmartLaunchContext() {
  var params = new URLSearchParams(window.location.search);
  if (params.has("code") || params.has("state") || params.has("iss") || params.has("launch")) {
    return true;
  }

  try {
    var stores = [sessionStorage, localStorage];
    for (var s = 0; s < stores.length; s++) {
      for (var i = 0; i < stores[s].length; i++) {
        var key = stores[s].key(i) || "";
        if (/smart|fhir|oauth/i.test(key)) return true;
      }
    }
  } catch (e) {}

  return false;
}

function showFHIRLaunchError(err, onReady) {
  console.error(err);
  $("#demo-banner")
    .html('FHIR launch did not complete. Open this app from <a href="https://launch.smarthealthit.org/" target="_blank">SMART App Launcher</a>, and make sure the launch URL points to this local server.')
    .show();
  $("#fhir-server-label").text("FHIR not connected");
  $("#fhir-status").text(err && err.message ? err.message : "Launch context missing or expired");
  useDemoData(onReady);
}

function useDemoData(onReady) {
  $("#demo-banner").show();
  allPatients = DEMO_PATIENTS;
  buildSidebar(DEMO_PATIENTS);
  renderPatient(DEMO_PATIENTS[0]);
  (onReady || function(){})();
}

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

  var fhirDone = false;
  var smartLaunch = hasSmartLaunchContext();

  var fhirTimeout = setTimeout(function () {
    if (fhirDone) return;
    if (smartLaunch) {
      setLoadMsg("Still waiting for SMART authorization…");
      return;
    }
    fhirDone = true;
    useDemoData(onReady);
  }, smartLaunch ? 15000 : 1200);

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
    .catch(function (err) {
      if (fhirDone) return;
      fhirDone = true;
      clearTimeout(fhirTimeout);
      if (smartLaunch) {
        showFHIRLaunchError(err, onReady);
      } else {
        useDemoData(onReady);
      }
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
  renderAnalytics(fv, cohort);
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
        condBundle = bundleFromWhen(condBundle);
        medBundle = bundleFromWhen(medBundle);
        obsBundle = bundleFromWhen(obsBundle);
        encBundle = bundleFromWhen(encBundle);

        var conditions   = ((condBundle.entry || [])).map(function(e){ return e.resource; });
        var meds         = ((medBundle.entry  || [])).map(function(e){ return e.resource; });
        var observations = ((obsBundle.entry  || [])).map(function(e){ return e.resource; });
        var encounters   = ((encBundle.entry  || [])).map(function(e){ return e.resource; });

        var patientData = buildFHIRPatient(pt, conditions, meds, observations, encounters);
        allPatients = [patientData];
        buildSidebar([patientData]);
        renderPatient(patientData);
        fetchBackendFHIRMatches({
          patient: pt,
          conditions: conditions,
          medications: meds,
          observations: observations,
          encounters: encounters,
          topK: 3
        }).done(function(resp) {
          if (!resp || !resp.matched || !resp.matched.length) return;
          var parsedPatient = resp.patient || patientData;
          $("#demo-banner")
            .html('FHIR data sent to backend · using <strong>' + resp.matched.length + ' matched cases</strong> from ' + resp.cohortSize + ' historical cases in cohort_data.json.')
            .show();
          renderAnalysisForCohort(parsedPatient, buildVector(parsedPatient), resp.matched);
        }).fail(function() {
          $("#demo-banner")
            .html('FHIR patient loaded, but the backend matcher did not answer. Run <strong>python3 backend.py</strong> and open <strong>http://localhost:8000/index.html</strong> so each patient uses backend matching.')
            .show();
        });
        onReady();
      });
    })
    .catch(function (err) {
      console.error(err);
      setLoadMsg("⚠️ " + err.message);
    });
}

function bundleFromWhen(value) {
  return value && value.resourceType === "Bundle" ? value : (value && value[0]) || {};
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

function openGuide(title, body, evt) {
  if (evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  $("#guide-popover-title").text(title);
  $("#guide-popover-body").text(body);
  $("#guide-popover").addClass("show");
}

function closeGuide() {
  $("#guide-popover").removeClass("show");
}

/* ════════════════════════════════════════════
   FEATURE VECTOR
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
      Math.min(encCount/10, 1), Math.min(medCount/8, 1), Math.min(dxCount/6, 1),
      hasDiabetes?0:1, hasHTN?0:1, hasDyslipid?0:1,
      onMetformin?0:1, onACE?0:1, onStatin?0:1
    ]
  };
}

function buildCohortVec(c) {
  if (c.features) {
    return buildVector({
      conditions: c.features.conditions || [],
      meds: c.features.meds || [],
      latestHbA1c: c.features.latestHbA1c,
      latestBP: c.features.latestBP,
      encounters: c.features.encounters || 0
    }).vec;
  }
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

function buildMatchedCohort(fv) {
  var scored = $.map(DEMO_COHORT, function(c) {
    return $.extend({}, c, {simScore: cosine(fv.vec, buildCohortVec(c))});
  }).sort(function(a,b){ return b.simScore - a.simScore; });

  return scored.slice(0, 3);
}

function fetchBackendMatches(patient) {
  return $.ajax({
    url: MATCH_API_URL,
    method: "POST",
    contentType: "application/json",
    dataType: "json",
    timeout: 1800,
    data: JSON.stringify({patient: patient, topK: 3})
  });
}

function fetchBackendFHIRMatches(payload) {
  return $.ajax({
    url: FHIR_MATCH_API_URL,
    method: "POST",
    contentType: "application/json",
    dataType: "json",
    timeout: 2500,
    data: JSON.stringify(payload)
  });
}

function renderAnalysisForCohort(patient, fv, cohort) {
  currentMatchedCohort = cohort;
  renderOverview(patient, fv, cohort);
  renderSurvival(cohort);
  renderAnalytics(fv, cohort);
  renderMatches(cohort);
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

function buildRiskDrivers(fv, cohort) {
  var highRiskShare = cohort.length
    ? $.grep(cohort, function(c){ return c.outcome !== "improved"; }).length / cohort.length
    : 0;
  var drivers = [
    {
      name: "Glycemic control",
      value: fv.hba1c >= 8 ? Math.min(98, Math.round(62 + (fv.hba1c - 8) * 12 + highRiskShare * 18)) : Math.round(32 + highRiskShare * 12),
      note: "HbA1c " + fmt2(fv.hba1c) + "%. Review recent trend, adherence, and medication intensification history."
    },
    {
      name: "Blood pressure",
      value: fv.bp >= 140 ? Math.min(95, Math.round(58 + (fv.bp - 140) * 0.8 + highRiskShare * 16)) : Math.round(30 + highRiskShare * 10),
      note: "SBP " + fmt2(fv.bp) + " mmHg. Check whether elevated readings are persistent or visit-specific."
    },
    {
      name: "Medication burden",
      value: Math.min(90, Math.round(24 + fv.medCount * 10 + highRiskShare * 12)),
      note: fv.medCount + " active meds. Look for complexity, gaps, or competing regimen changes."
    },
    {
      name: "Comorbidity load",
      value: Math.min(88, Math.round(22 + fv.dxCount * 11 + highRiskShare * 10)),
      note: fv.dxCount + " diagnoses represented. Confirm the active problems driving current risk."
    },
    {
      name: "Care pattern",
      value: Math.min(82, Math.round(20 + fv.encCount * 8 + highRiskShare * 10)),
      note: fv.encCount + " encounters on record. Review care gaps, ED visits, or missed follow-up."
    }
  ];

  return drivers.sort(function(a,b){ return b.value - a.value; }).slice(0, 4);
}

function renderRiskDrivers(fv, cohort) {
  var html = $.map(buildRiskDrivers(fv, cohort), function(d) {
    var cls = d.value >= 70 ? "high" : d.value >= 50 ? "watch" : "";
    var tag = d.value >= 70 ? "Review first" : d.value >= 50 ? "Watch closely" : "Lower priority";
    return '<div class="driver-item ' + cls + '">'
         + '<div class="driver-main">'
         + '<div class="driver-name">' + d.name + '</div>'
         + '<div class="driver-note">' + d.note + '</div>'
         + '<div class="driver-tag"><span class="driver-dot"></span>' + tag + '</div>'
         + '</div>'
         + '<div class="driver-meter">'
         + '<div class="driver-track"><div class="driver-fill" style="width:' + d.value + '%"></div></div>'
         + '<div class="driver-score">' + d.value + '</div>'
         + '</div></div>';
  }).join("");
  $("#risk-driver-list").html(html);
}

function renderCohortComparison(fv, cohort) {
  var items = [
    {name:"Diabetes", patient:fv.hasDiabetes, cohortIndex:0},
    {name:"Hypertension", patient:fv.hasHTN, cohortIndex:1},
    {name:"Dyslipidemia", patient:fv.hasDyslipid, cohortIndex:2},
    {name:"Metformin", patient:fv.onMetformin, cohortIndex:3},
    {name:"ACE/ARB", patient:fv.onACE, cohortIndex:4},
    {name:"Statin", patient:fv.onStatin, cohortIndex:5}
  ];

  var rows = $.map(items, function(item) {
    var avg = cohort.length
      ? cohort.reduce(function(sum, c){ return sum + buildCohortVec(c)[item.cohortIndex]; }, 0) / cohort.length
      : 0;
    var pct = Math.round(avg * 100);
    var patientText = item.patient ? "Present" : "Absent";
    var diff = item.patient ? pct < 50 : pct >= 50;
    return $.extend({}, item, {pct:pct, patientText:patientText, diff:diff});
  });
  var biggest = rows.reduce(function(best, row){ return !best || row.pct > best.pct ? row : best; }, null);
  var same = $.map($.grep(rows, function(r){ return !r.diff; }), function(r){ return r.name; });
  var different = $.map($.grep(rows, function(r){ return r.diff; }), function(r){ return r.name; });

  $("#cohort-compare-list").html(
    '<div id="cohort-compare-chart" class="compare-chart"></div>'
    + '<div class="compare-summary-grid">'
    + '<div class="compare-summary"><div class="compare-summary-title">Same as comparison group</div><div>' + (same.length ? same.join(", ") : "None") + '</div></div>'
    + '<div class="compare-summary diff"><div class="compare-summary-title">Different from comparison group</div><div>' + (different.length ? different.join(", ") : "None") + '</div></div>'
    + '</div>'
  );

  if (typeof Highcharts === "undefined") return;
  destroyHC("cohort-compare-chart");
  Highcharts.chart("cohort-compare-chart", {
    chart: {type:"bar", backgroundColor:"transparent", height:300, margin:[10, 32, 32, 120], style:{fontFamily:"'IBM Plex Sans', sans-serif"}},
    title: {text:null},
    credits: {enabled:false},
    legend: {enabled:false},
    xAxis: {
      categories: $.map(rows, function(r){ return r.name + " (" + r.patientText + ")"; }),
      lineColor:"rgba(228,220,207,0.95)",
      tickLength:0,
      labels:{style:{fontSize:"12px", fontWeight:"700", color:"#334155"}}
    },
    yAxis: {
      min:0, max:100,
      title:{text:"Share of similar cohort", style:{fontSize:"11px", color:"#5D6A79"}},
      labels:{format:"{value}%", style:{fontSize:"11px", color:"#5D6A79"}},
      gridLineColor:"rgba(228,220,207,0.55)"
    },
    tooltip: {
      backgroundColor:"#FFFDFA", borderColor:"#E4DCCF", borderRadius:10, shadow:false,
      formatter:function(){
        var r = rows[this.point.index];
        return "<b>" + r.name + "</b><br/>Current patient: " + r.patientText + "<br/>Similar cohort: " + r.pct + "%";
      }
    },
    plotOptions: {
      bar: {
        borderRadius:4,
        pointWidth:22,
        dataLabels: {
          enabled:true,
          format:"{y}%",
          style:{fontSize:"12px", fontWeight:"800", textOutline:"none", color:"#19222D"}
        }
      }
    },
    series: [{
      data: $.map(rows, function(r){
        return {
          y:r.pct,
          color: biggest && r.name === biggest.name ? "rgba(217,119,6,0.82)" : "rgba(15,118,110,0.64)"
        };
      })
    }]
  });
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

  /* Build patient-specific matched cohort */
  var cohort = buildMatchedCohort(fv);
  currentMatchedCohort = cohort;

  renderAnalysisForCohort(patient, fv, cohort);

  fetchBackendMatches(patient)
    .done(function(resp) {
      if (!resp || !resp.matched || !resp.matched.length) return;
      $("#demo-banner")
        .html('Backend matching active · using <strong>' + resp.matched.length + ' matched cases</strong> from ' + resp.cohortSize + ' historical cases in cohort_data.json.')
        .show();
      renderAnalysisForCohort(patient, fv, resp.matched);
    })
    .fail(function() {
      $("#demo-banner")
        .html('Backend matcher offline. Showing browser fallback cohort. Run <span style="font-family:var(--font-mono)">python3 backend.py</span>, then open <strong>http://localhost:8000/index.html</strong> so matching, survival, and analytics update per patient.')
        .show();
    });
}

/* ════════════════════════════════════════════
   TAB 1 — OVERVIEW
════════════════════════════════════════════ */
function renderOverview(patient, fv, cohort) {

  var labItems = [];
  if (patient.latestHbA1c) labItems.push({val:"HbA1c " + fmt2(patient.latestHbA1c) + "%", alert: patient.latestHbA1c >= 8});
  if (patient.latestBP) labItems.push({val:"Systolic BP " + fmt2(patient.latestBP) + " mmHg", alert: patient.latestBP >= 140});

  function sumRows(items, isObj) {
    if (!items.length) return '<div class="sum-row muted">No data found</div>';
    return $.map(items.slice(0,5), function(item){
      if (isObj) return '<div class="sum-row' + (item.alert ? ' vital' : '') + '">' + item.val + '</div>';
      return '<div class="sum-row">' + item + '</div>';
    }).join("");
  }
  $("#top-summary").html(
    '<div class="sum-grid">'
    + '<div class="sum-col"><div class="sum-col-label">Conditions</div>' + sumRows(patient.conditions, false) + '</div>'
    + '<div class="sum-col"><div class="sum-col-label">Medications</div>' + sumRows(patient.meds, false) + '</div>'
    + '<div class="sum-col"><div class="sum-col-label">Vitals &amp; Labs</div>' + (labItems.length ? sumRows(labItems, true) : '<div class="sum-row muted">No labs found</div>') + '</div>'
    + '</div>'
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
  var trustLabel = smdOk ? "Good comparison" : "Use with caution";
  var trustNote = smdOk
    ? "Matched patients are close enough for a first-pass comparison."
    : "Balance is weak. Read outcomes as exploratory and verify patient facts first.";
  $("#psm-info").html(
    '<div class="psm2-banner ' + (smdOk ? "ok" : "warn") + '">'
    + '<div class="psm2-left"><div class="psm2-eyebrow">Can we trust this comparison?</div><div class="psm2-verdict">' + trustLabel + '</div><div class="psm2-note">' + trustNote + '</div></div>'
    + '<div class="psm2-metrics">'
    + '<div class="psm2-metric"><div class="psm2-val">' + psm.matched.length + '</div><div class="psm2-label">Matched cases</div></div>'
    + '<div class="psm2-metric"><div class="psm2-val">' + fmt2(parseFloat(psm.smd)) + '</div><div class="psm2-label">SMD balance</div></div>'
    + '</div></div>'
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
    '<div class="outcome-item improved"><div><span class="outcome-dot"></span><span class="outcome-name">Improved</span></div><div class="outcome-pct">' + pct(imp) + '% of similar patients</div><div class="outcome-ci">95% CI: ' + impCI.lo + '%–' + impCI.hi + '%</div></div>'
    + '<div class="outcome-item hospitalized"><div><span class="outcome-dot"></span><span class="outcome-name">Hospitalized</span></div><div class="outcome-pct">' + pct(hosp) + '% of similar patients</div><div class="outcome-ci">95% CI: ' + hospCI.lo + '%–' + hospCI.hi + '%</div></div>'
    + '<div class="outcome-item deteriorated"><div><span class="outcome-dot"></span><span class="outcome-name">Deteriorated</span></div><div class="outcome-pct">' + pct(det) + '% of similar patients</div><div class="outcome-ci">95% CI: ' + detCI.lo + '%–' + detCI.hi + '%</div></div>'
  );
  $("#stacked-bar").html(
    '<div class="seg improved"     style="flex:'+pct(imp)+'">'+pct(imp)+'%</div>'+
    '<div class="seg hospitalized" style="flex:'+pct(hosp)+'">'+pct(hosp)+'%</div>'+
    '<div class="seg deteriorated" style="flex:'+pct(det)+'">'+pct(det)+'%</div>'
  );
  $("#adj-outcome").html(
    '<div class="adj2-box">'
    + '<div class="adj2-main"><div class="adj2-label">Adjusted likelihood of improvement</div>'
    + '<div class="adj2-score-row"><div class="adj2-big">' + adj.adjusted + '%</div><div class="adj2-delta">↑ +' + (adj.adjusted - adj.raw) + '%<span>vs. raw (' + adj.raw + '%)</span></div></div></div>'
    + '<div class="adj2-explain">Adjustment suggests a slightly <strong>higher likelihood of improvement</strong> compared to unadjusted results.</div>'
    + '<div class="adj2-bars">'
    + '<div class="adj2-bar-row"><span class="adj2-bar-label">Raw (unadjusted)</span><div class="adj2-track"><div class="adj2-fill raw" style="width:' + adj.raw + '%"></div></div><span class="adj2-bar-num raw-num">' + adj.raw + '%</span></div>'
    + '<div class="adj2-bar-row"><span class="adj2-bar-label">Adjusted</span><div class="adj2-track"><div class="adj2-fill adj" style="width:' + adj.adjusted + '%"></div></div><span class="adj2-bar-num adj-num">' + adj.adjusted + '%</span></div>'
    + '<div class="adj2-axis"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>'
    + '</div></div>'
  );
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
      style: {fontFamily:"'IBM Plex Sans', sans-serif"},
      height: 260,
      margin: [64, 18, 48, 58]
    },
    title:   {text: null},
    credits: {enabled: false},
    legend:  {
      enabled: true,
      align: "left",
      verticalAlign: "top",
      layout: "horizontal",
      x: 56,
      y: 6,
      itemMarginTop: 2,
      itemStyle: {fontSize:"11px", fontWeight:"700", color:"#5D6A79"}
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

  /* Transition network — force-directed canvas */
  var markov = buildMarkov(cohort);
  renderForceNetwork(markov);
}


/* ════════════════════════════════════════════
   FORCE NETWORK — canvas-based draggable graph
════════════════════════════════════════════ */
function renderForceNetwork(markov) {
  var nodeWeights = {};
  $.each(markov, function(_, row) {
    var p = parseFloat(row.prob);
    nodeWeights[row.from] = (nodeWeights[row.from] || 0) + p * 0.35;
    nodeWeights[row.to] = (nodeWeights[row.to] || 0) + p;
  });

  function pct(from, to) {
    var found = $.grep(markov, function(row){ return row.from === from && row.to === to; })[0];
    return found ? Math.round(parseFloat(found.prob) * 100) : null;
  }
  function nodePct(name) {
    return Math.round((nodeWeights[name] || 0) * 100);
  }
  function radius(name, base, spread) {
    var vals = $.map(nodeWeights, function(v){ return v; });
    var max = Math.max.apply(null, vals.concat([1]));
    return Math.round(base + ((nodeWeights[name] || 0) / max) * spread);
  }

  var nodes = {
    Stable:        {x:130, y:175, cls:"good",    r:radius("Stable", 42, 16),        icon:"shield", p:nodePct("Stable")},
    Vulnerable:    {x:135, y:335, cls:"risk",    r:radius("Vulnerable", 42, 16),    icon:"user", p:nodePct("Vulnerable")},
    Worsening:     {x:405, y:118, cls:"neutral", r:radius("Worsening", 44, 18),     icon:"trend", p:nodePct("Worsening")},
    Deteriorating: {x:430, y:265, cls:"neutral", r:radius("Deteriorating", 48, 20), icon:"pulse", p:nodePct("Deteriorating")},
    Recovery:      {x:715, y:140, cls:"good",    r:radius("Recovery", 58, 34),      icon:"leaf", p:nodePct("Recovery")},
    Hospitalized:  {x:705, y:350, cls:"danger",  r:radius("Hospitalized", 48, 20),  icon:"bed", p:nodePct("Hospitalized")}
  };
  var edges = [
    {from:"Stable", to:"Worsening", cls:"good", pct:pct("Stable","Worsening"), bend:-46},
    {from:"Stable", to:"Recovery", cls:"good", pct:pct("Stable","Recovery"), bend:0},
    {from:"Vulnerable", to:"Deteriorating", cls:"good", pct:pct("Vulnerable","Deteriorating"), bend:-54},
    {from:"Vulnerable", to:"Recovery", cls:"good", pct:pct("Vulnerable","Recovery"), bend:-26},
    {from:"Vulnerable", to:"Hospitalized", cls:"risk", pct:pct("Vulnerable","Hospitalized"), bend:0},
    {from:"Deteriorating", to:"Hospitalized", cls:"risk", pct:pct("Deteriorating","Hospitalized"), bend:-42},
    {from:"Deteriorating", to:"Recovery", cls:"good", pct:pct("Deteriorating","Recovery"), bend:-18}
  ].filter(function(e){ return e.pct !== null; });

  function colors(cls) {
    if (cls === "good") return {fill:"#e8f8f1", stroke:"#13986f", text:"#12342b", edge:"#24a978"};
    if (cls === "risk") return {fill:"#fff5dd", stroke:"#f08a16", text:"#4c2f04", edge:"#fb8c18"};
    if (cls === "danger") return {fill:"#fde2e3", stroke:"#d63b3b", text:"#511316", edge:"#d63b3b"};
    return {fill:"#f3f5f6", stroke:"#b8c0c8", text:"#19222d", edge:"#aeb6bf"};
  }
  function marker(cls) {
    var c = colors(cls).edge;
    return '<marker id="arrow-' + cls + '" markerWidth="18" markerHeight="18" refX="15" refY="9" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L18,9 L0,18 z" fill="' + c + '"/></marker>';
  }
  function nodeIcon(n) {
    var s = 'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"';
    if (n.icon === "shield") return '<path ' + s + ' d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"/>';
    if (n.icon === "leaf") return '<path ' + s + ' d="M5 19c8 0 13-5 14-14-9 1-14 6-14 14z"/><path ' + s + ' d="M5 19l9-9"/>';
    if (n.icon === "bed") return '<path ' + s + ' d="M4 11h16v7"/><path ' + s + ' d="M4 8v10"/><path ' + s + ' d="M7 11V8h5a3 3 0 0 1 3 3"/>';
    if (n.icon === "user") return '<circle ' + s + ' cx="12" cy="7" r="3"/><path ' + s + ' d="M5 21a7 7 0 0 1 14 0"/>';
    if (n.icon === "pulse") return '<path ' + s + ' d="M3 13h4l2-6 4 12 2-6h6"/>';
    return '<path ' + s + ' d="M5 7l5 5 3-3 6 6"/><path ' + s + ' d="M15 15h4v-4"/>';
  }
  function nodeHtml(name, n) {
    var c = colors(n.cls);
    return '<g class="network-node" data-node="' + name + '" transform="translate(' + n.x + ' ' + n.y + ')">'
      + '<circle class="network-node-bg" r="' + n.r + '" fill="' + c.fill + '" stroke="' + c.stroke + '" stroke-width="2.4"/>'
      + '<g class="network-node-icon" transform="translate(-12 -40)" style="color:' + c.stroke + '"><svg width="24" height="24" viewBox="0 0 24 24">' + nodeIcon(n) + '</svg></g>'
      + '<text class="network-node-name" y="4" text-anchor="middle" font-size="17" font-weight="800" fill="' + c.text + '">' + name + '</text>'
      + '<text class="network-node-p" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="' + c.text + '">P = ' + n.p + '%</text></g>';
  }
  function edgeHtml(e, i) {
    var c = colors(e.cls).edge;
    return '<path class="network-link" data-edge="' + i + '" fill="none" stroke="' + c + '" marker-end="url(#arrow-' + e.cls + ')" opacity=".95"/>'
      + '<text class="network-label" data-label="' + i + '" font-size="14" font-weight="900" fill="' + (e.cls === "risk" ? "#8a4f06" : "#334155") + '">' + e.pct + '%</text>';
  }

  $("#transition-map").html(
    '<div class="network-svg-wrap"><div class="network-help">' + ic("activity",22,"var(--teal-dark)") + '<div><strong>Drag nodes to rearrange the network</strong><span>Click a node or arrow to inspect details</span></div></div>'
    + '<div id="network-detail" class="network-detail">Select a node or arrow to see what it means.</div>'
    + '<svg id="network-svg" class="network-svg" viewBox="0 0 840 480" role="img" aria-label="Likely state transition network">'
    + '<defs>' + marker("good") + marker("risk") + marker("neutral") + '</defs>'
    + '<g id="network-links">' + $.map(edges, edgeHtml).join("") + '</g>'
    + '<g id="network-nodes">' + $.map(nodes, function(n, name){ return nodeHtml(name, n); }).join("") + '</g>'
    + '</svg>'
    + '<div class="network-legend"><div class="network-legend-left">'
    + '<span class="network-legend-item"><span class="network-legend-dot recovery"></span>Recovery path</span>'
    + '<span class="network-legend-item"><span class="network-legend-dot risk"></span>Risk path</span>'
    + '<span class="network-legend-item"><span class="network-legend-dot neutral"></span>Neutral state</span>'
    + '</div><span>Drag nodes · node size = involvement in transitions</span></div></div>'
  );

  var svg = document.getElementById("network-svg");
  function endpoint(a, b, bend) {
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx*dx + dy*dy) || 1;
    var nx = -dy / d, ny = dx / d;
    return {
      sx: a.x + dx / d * (a.r + 6),
      sy: a.y + dy / d * (a.r + 6),
      tx: b.x - dx / d * (b.r + 12),
      ty: b.y - dy / d * (b.r + 12),
      cx: (a.x + b.x) / 2 + nx * (bend || 0),
      cy: (a.y + b.y) / 2 + ny * (bend || 0),
      mx: (a.x + b.x) / 2,
      my: (a.y + b.y) / 2
    };
  }
  function updateNetwork() {
    $.each(nodes, function(name, n) {
      $('#network-svg [data-node="' + name + '"]').attr('transform', 'translate(' + n.x + ' ' + n.y + ')');
    });
    $.each(edges, function(i, e) {
      var a = nodes[e.from], b = nodes[e.to], p = endpoint(a, b, e.bend);
      $('#network-svg [data-edge="' + i + '"]')
        .attr('d', 'M' + p.sx + ',' + p.sy + ' Q' + p.cx + ',' + p.cy + ' ' + p.tx + ',' + p.ty)
        .attr('stroke-width', Math.max(3, e.pct / 6.5));
      var label = $('#network-svg [data-label="' + i + '"]');
      label.attr('x', p.cx + (e.cls === "risk" ? 8 : 0)).attr('y', p.cy - 12);
    });
  }
  function svgPoint(evt) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  var dragging = null;
  $('#network-svg .network-node').on('mousedown', function(evt) {
    var name = $(this).data('node');
    var p = svgPoint(evt);
    dragging = {name:name, dx:p.x - nodes[name].x, dy:p.y - nodes[name].y};
    $(this).addClass('dragging');
    evt.preventDefault();
  });
  $('#network-svg .network-node').on('click', function() {
    var name = $(this).data('node');
    $("#network-detail").html('<strong>' + name + '</strong>: this node represents a clinical state. Larger circles mean this state appears more often in cohort transitions.');
  });
  $('#network-svg .network-link, #network-svg .network-label').on('click', function() {
    var i = $(this).data('edge') !== undefined ? $(this).data('edge') : $(this).data('label');
    var e = edges[i];
    if (!e) return;
    $("#network-detail").html('<strong>' + e.from + ' to ' + e.to + '</strong>: ' + e.pct + '% of observed transitions in similar cases followed this path.');
  });
  $(window).off('mousemove.network mouseup.network').on('mousemove.network', function(evt) {
    if (!dragging) return;
    var p = svgPoint(evt), n = nodes[dragging.name];
    n.x = Math.max(n.r + 20, Math.min(820 - n.r, p.x - dragging.dx));
    n.y = Math.max(n.r + 20, Math.min(460 - n.r, p.y - dragging.dy));
    updateNetwork();
  }).on('mouseup.network', function() {
    $('#network-svg .network-node').removeClass('dragging');
    dragging = null;
  });
  updateNetwork();
}

/* ════════════════════════════════════════════
   TAB 3 — ANALYTICS (Highcharts radar)
════════════════════════════════════════════ */
function renderAnalytics(fv, cohort) {
  renderRiskDrivers(fv, cohort);

  /* Clusters — jQuery .html() */
  var clusters = buildClusters(cohort);
  var topCluster = clusters[0] || {name:"No dominant pattern", pct:"0%", desc:"No matched cases available."};
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
  $("#cluster-list").html(
    '<div class="pattern-takeaway"><strong>Main pattern:</strong> ' + topCluster.name + ' accounts for ' + topCluster.pct + ' of matched cases. ' + topCluster.desc + '</div>'
    + clHtml.join("")
  );
  renderPatternChart(clusters);
  renderCohortComparison(fv, cohort);
}

function renderPatternChart(clusters) {
  if (typeof Highcharts === "undefined") return;
  destroyHC("pattern-chart");
  Highcharts.chart("pattern-chart", {
    chart: {
      type: "bar",
      backgroundColor: "transparent",
      style: {fontFamily:"'IBM Plex Sans', sans-serif"},
      height: 240,
      margin: [8, 12, 34, 155]
    },
    title: {text: null},
    credits: {enabled: false},
    legend: {enabled: false},
    xAxis: {
      categories: $.map(clusters, function(c){ return c.name; }),
      lineColor: "rgba(228,220,207,0.95)",
      tickLength: 0,
      labels: {style:{fontSize:"12px", fontWeight:"600", color:"#334155"}}
    },
    yAxis: {
      min: 0, max: 100,
      title: {text: "Share of matched patients", style:{fontSize:"11px", color:"#5D6A79"}},
      gridLineColor: "rgba(228,220,207,0.55)",
      labels: {format:"{value}%", style:{fontSize:"11px", color:"#5D6A79"}}
    },
    tooltip: {
      backgroundColor: "#FFFDFA",
      borderColor: "#E4DCCF",
      borderRadius: 10,
      shadow: false,
      formatter: function() {
        var c = clusters[this.point.index];
        return "<b>" + c.name + "</b><br/>" + c.pct + " of matches<br/>" + c.desc;
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        pointWidth: 22,
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          format: "{y}%",
          style: {fontSize:"12px", fontWeight:"700", textOutline:"none", color:"#19222D"}
        }
      }
    },
    series: [{
      name: "Share",
      data: $.map(clusters, function(c, i){
        return {
          y: parseInt(c.pct, 10) || 0,
          color: i === 0 ? "rgba(15,118,110,0.78)" : i === 1 ? "rgba(217,119,6,0.72)" : "rgba(185,28,28,0.68)"
        };
      })
    }]
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
    var primaryReason = c.matchReasons && c.matchReasons.length ? c.matchReasons[0] : null;
    var reasonText = primaryReason
      ? '<strong>Why this case matters:</strong> ' + primaryReason.key + ' - ' + primaryReason.note
      : '<strong>Why this case matters:</strong> similar starting profile and follow-up pattern.';

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

    return '<div class="dg-card fade d' + Math.min(i+1,5) + (i === 0 ? ' expanded' : '') + '" id="dgc-' + c.id + '" '
         + 'onclick="toggleCard(\'' + c.id + '\')">'
         + '<div class="dg-header">'
         + '<div class="dg-sim-block">'
         + '<div class="dg-sim-num ' + simCls + '">' + pct + '%</div>'
         + '<div class="dg-sim-label">match</div></div>'
         + '<div class="dg-divider"></div>'
         + '<div class="dg-info">'
         + '<div class="dg-name">Case ' + (i + 1) + ' · ' + c.name + '</div>'
         + '<div class="dg-meta">'
         + '<span>' + ic("user",11,"var(--hint)") + ' ' + c.age + 'y · ' + cap(c.gender) + '</span>'
         + '<span>' + ic("git-branch",11,"var(--hint)") + ' ' + c.timeline.length + ' events</span>'
         + '<span>' + ic("clock",11,"var(--hint)") + ' Day ' + c.daysToEvent + '</span>'
         + '</div>'
         + '<div class="case-reason">' + reasonText + '</div>'
         + '<div class="case-action">Open to review timeline, match reasons, and turning point.</div></div>'
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
    renderMatches(currentMatchedCohort.length ? currentMatchedCohort : buildMatchedCohort(buildVector(currentPatient)));
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

/* ════════════════════════════════════════════
   ONBOARDING TOUR
════════════════════════════════════════════ */
var onboardStep = 0;
var onboardResizeBound = false;

var ONBOARD_STEPS = [
  {kind:"entry"},
  {kind:"modal", wide:false, eyebrow:"What is this?", title:"A patient comparison workspace",
    body:"This app helps you start from one patient chart, find past patients who looked clinically similar, and see what happened next. It is a reference tool for chart review, not a prediction engine.",
    flow:true, button:"How do I load a patient? →"},
  {kind:"connect"},
  {kind:"spot", selector:".topbar", eyebrow:"Your current patient", title:"Eleanor Voss — demo patient loaded",
    body:"Right now you're viewing a simulated patient with Type 2 Diabetes, Hypertension, and Hyperlipidemia. In real use, this pulls directly from the EHR after FHIR launch.", badge:"DEMO MODE", button:"Next →"},
  {kind:"spot", selector:".tab-btn:nth-child(1)", tab:"overview", eyebrow:"Tab 1 of 4", title:"Overview — Is this comparison trustworthy?",
    body:"Start here every time. Check the patient summary, verify the match quality score (SMD), and read similar-case outcomes. If SMD > 0.1, treat results as exploratory only.", iconFlow:true, button:"Next →"},
  {kind:"spot", selector:".tab-btn:nth-child(2)", tab:"survival", eyebrow:"Tab 2 of 4", title:"Survival — When did similar patients decline?",
    body:"The Kaplan-Meier curve shows how long similar patients stayed event-free before hospitalization or deterioration. Large drops early = higher risk signal. The network below shows which clinical states patients moved between most.", line:true, button:"Next →"},
  {kind:"spot", selector:".tab-btn:nth-child(3)", tab:"analytics", eyebrow:"Tab 3 of 4", title:"Analytics — What's driving the risk?",
    body:"Risk drivers highlight which clinical factors in this patient's profile most strongly predicted poor outcomes in the matched cohort. Use these as chart-review prompts, not diagnoses.", button:"Next →"},
  {kind:"spot", selector:".tab-btn:nth-child(4)", tab:"matches", eyebrow:"Tab 4 of 4", title:"Matches — Read the case stories",
    body:"Each card is a real historical patient who looked like yours at baseline. Open a card to see their full clinical timeline, why they matched, and the turning point — the moment things changed.", button:"Next →"},
  {kind:"final"}
];

function maybeStartOnboarding() {
  startOnboarding(0);
}

function replayOnboarding() {
  try { localStorage.removeItem("cdg_onboarded"); } catch (e) {}
  startOnboarding(1);
}

function startOnboarding(step) {
  onboardStep = step || 0;
  ensureOnboardRoot();
  bindOnboardKeys();
  renderOnboarding();
}

function ensureOnboardRoot() {
  if ($("#onboard-root").length) return;
  $("body").append(
    '<div id="onboard-root" class="onboard-root">'
    + '<div class="onboard-backdrop"></div>'
    + '<div id="onboard-spot" class="onboard-spot" style="display:none"></div>'
    + '<button class="onboard-skip" onclick="finishOnboarding()">Skip</button>'
    + '<div id="onboard-stage"></div>'
    + '<div id="onboard-progress" class="onboard-progress"></div>'
    + '</div>'
  );
}

function bindOnboardKeys() {
  if (onboardResizeBound) return;
  onboardResizeBound = true;
  $(document).on("keydown.onboard", function(evt) {
    if (!$("#onboard-root").length) return;
    if (evt.key === "Escape") finishOnboarding();
    if (evt.key === "ArrowRight" || evt.key === " ") {
      evt.preventDefault();
      nextOnboardStep();
    }
  });
  $(window).on("resize.onboard scroll.onboard", function() {
    if ($("#onboard-root").length) renderOnboarding();
  });
}

function finishOnboarding() {
  $("#onboard-root").remove();
}

function nextOnboardStep() {
  if (onboardStep >= ONBOARD_STEPS.length - 1) {
    finishOnboarding();
    return;
  }
  onboardStep += 1;
  renderOnboarding();
}

function renderOnboarding() {
  var step = ONBOARD_STEPS[onboardStep];
  if (!step) return finishOnboarding();
  $("#onboard-root").toggleClass("spotlight", step.kind === "spot");
  $("#onboard-progress").html(onboardProgressHtml());
  $("#onboard-spot").hide();

  if (step.tab) {
    var tabBtn = $(".tab-btn").eq({overview:0,survival:1,analytics:2,matches:3}[step.tab]);
    if (tabBtn.length) switchTab(step.tab, tabBtn[0]);
  }

  if (step.kind === "entry") renderEntryGate();
  else if (step.kind === "modal") renderModalStep(step);
  else if (step.kind === "connect") renderConnectStep();
  else if (step.kind === "spot") renderSpotStep(step);
  else renderFinalStep();
}

function onboardProgressHtml() {
  return $.map(ONBOARD_STEPS, function(_, i) {
    return '<span class="onboard-dot ' + (i < onboardStep ? "done" : i === onboardStep ? "active" : "") + '"></span>';
  }).join("");
}

function renderEntryGate() {
  $("#onboard-stage").html(
    '<div class="onboard-modal">'
    + onboardLogo()
    + '<div class="onboard-title">Welcome. Have you used this app before?</div>'
    + '<div class="onboard-actions">'
    + '<button class="onboard-btn primary" onclick="nextOnboardStep()">No, show me around →</button>'
    + '<button class="onboard-btn ghost" onclick="finishOnboarding()">Yes, skip to app</button>'
    + '</div></div>'
  );
}

function renderModalStep(step) {
  $("#onboard-stage").html(
    '<div class="onboard-modal ' + (step.wide ? "wide" : "") + '">'
    + '<div class="onboard-kicker">' + step.eyebrow + '</div>'
    + '<div class="onboard-title">' + step.title + '</div>'
    + '<div class="onboard-body">' + step.body + '</div>'
    + (step.flow ? onboardFlow() : "")
    + '<div class="onboard-actions"><button class="onboard-btn primary" onclick="nextOnboardStep()">' + step.button + '</button></div>'
    + '</div>'
  );
}

function renderConnectStep() {
  $("#onboard-stage").html(
    '<div class="onboard-modal wide"><div class="onboard-split">'
    + '<div><div class="onboard-kicker">Before you begin</div><div class="onboard-title">Load one sandbox patient</div>'
    + '<div class="onboard-body">Think of the SMART Launcher as a practice EHR. You are entering as the clinician, choosing one sandbox patient, and sending that one chart into this app.</div>'
    + '<ol class="onboard-steps">'
    + '<li>Open <strong>launch.smarthealthit.org</strong>.</li>'
    + '<li>Set <strong>Launch Type</strong> to <strong>Provider EHR Launch</strong>. This means you enter as the doctor.</li>'
    + '<li>Set <strong>FHIR Version</strong> to <strong>R4</strong> and <strong>Simulated Error</strong> to <strong>None</strong>.</li>'
    + '<li>Patient(s), Provider(s), and Encounter can stay blank. Only fill Patient(s) if you want a specific sandbox patient.</li>'
    + '<li>Paste your app address under <strong>App’s Launch URL</strong>:<br><span class="onboard-code">http://localhost:[your-port]/launch.html</span></li>'
    + '<li>Click <strong>Launch</strong>. The sandbox sends one patient chart back to this app.</li>'
    + '</ol><div class="onboard-note">Important: each sandbox launch loads one patient at a time. Pick another patient in the launcher if you want to review a different case.</div>'
    + '<div class="onboard-actions"><button class="onboard-btn primary" onclick="nextOnboardStep()">Continue tour →</button><button class="onboard-btn ghost" onclick="nextOnboardStep()">Got it, I’ll connect later →</button></div></div>'
    + '<div class="smart-mock"><div class="smart-title"><div class="smart-logo">✶</div><div>SMART Launcher</div></div>'
    + '<div class="smart-doctor-note"><strong>You are the doctor.</strong><span>Choose one sandbox patient, then launch this app.</span></div>'
    + '<div class="smart-tabs"><span class="active">App Launch Options</span><span>Client Registration &amp; Validation</span></div>'
    + '<div class="smart-form-grid"><div>'
    + '<div class="smart-field"><div class="smart-label">Launch Type</div><div class="smart-input select"><span>Provider EHR Launch</span></div><div class="smart-helptext">Practitioner opens the app from within an EHR</div></div>'
    + '<div class="smart-two"><div class="smart-field"><div class="smart-label">FHIR Version</div><div class="smart-input select"><span>R4</span></div></div><div class="smart-field"><div class="smart-label">Simulated Error</div><div class="smart-input select"><span>None</span></div></div></div>'
    + '<div class="smart-field"><div class="smart-label">Misc. Options</div><div class="smart-check"></div><span class="smart-check-label">Simulate launch within the EHR UI</span></div>'
    + '</div><div>'
    + '<div class="smart-field muted"><div class="smart-label">Patient(s)</div><div class="smart-input"><span>Patient ID(s)</span></div><div class="smart-helptext">Leave blank unless a specific patient is needed.</div></div>'
    + '<div class="smart-field muted"><div class="smart-label">Provider(s)</div><div class="smart-input"><span>Provider ID(s)</span></div><div class="smart-helptext">Leave blank for normal sandbox login flow.</div></div>'
    + '<div class="smart-field"><div class="smart-label">Encounter</div><div class="smart-input select"><span>Select the most recent encounter if available</span></div></div>'
    + '</div></div>'
    + '<div class="smart-patient-picker"><div class="smart-picker-title">Sandbox patient examples</div><div class="smart-patient-row"><span class="selected">Eleanor Voss</span><span>Raymond Chu</span><span>Sandra Okafor</span></div><div class="smart-helptext">Only the selected patient is loaded into the app.</div></div>'
    + '<div class="smart-launch-row"><div class="smart-label">App’s Launch URL</div><div class="smart-launch-input"><span>http://localhost:8000/launch.html</span><button class="smart-launch">Launch</button></div></div>'
    + '<div class="smart-app"><strong>Redirecting back to Clinical Doppelgänger</strong><br>Eleanor Voss · FHIR patient loaded</div></div>'
    + '</div></div>'
  );
}

function renderSpotStep(step) {
  var target = $(step.selector)[0];
  if (!target) return renderModalStep({eyebrow:step.eyebrow, title:step.title, body:step.body, button:step.button});
  var rect = target.getBoundingClientRect();
  var pad = 8;
  $("#onboard-spot").css({
    display:"block",
    left:(rect.left - pad) + "px",
    top:(rect.top - pad) + "px",
    width:(rect.width + pad * 2) + "px",
    height:(rect.height + pad * 2) + "px"
  });
  var placeAbove = rect.top > window.innerHeight / 2;
  var top = placeAbove ? rect.top - 22 : rect.bottom + 22;
  var left = Math.min(Math.max(16, rect.left), window.innerWidth - 440);
  var extra = "";
  if (step.badge) extra += '<div class="demo-badge">' + step.badge + '</div>';
  if (step.iconFlow) extra += onboardFlow();
  if (step.line) extra += '<svg class="mini-line" viewBox="0 0 210 78"><path d="M8 14 H85 V28 H132 V55 H200"/></svg>';
  $("#onboard-stage").html(
    '<div class="onboard-tip" style="left:' + left + 'px;top:' + (placeAbove ? "auto" : top + "px") + ';bottom:' + (placeAbove ? (window.innerHeight - rect.top + 22) + "px" : "auto") + '">'
    + '<span class="onboard-arrow ' + (placeAbove ? "down" : "up") + '"></span>'
    + '<div class="onboard-kicker">' + step.eyebrow + '</div>'
    + '<div class="onboard-title small">' + step.title + '</div>'
    + '<div class="onboard-body">' + step.body + '</div>'
    + extra
    + '<div class="onboard-actions"><button class="onboard-btn primary" onclick="nextOnboardStep()">' + step.button + '</button></div>'
    + '</div>'
  );
}

function renderFinalStep() {
  $("#onboard-stage").html(
    '<div class="onboard-modal"><div class="checkmark-wrap"></div>'
    + '<div class="onboard-title">You’re all set.</div>'
    + '<div class="onboard-body">You’re currently in demo mode with simulated patient data. To use with real patients, connect via SMART on FHIR from launch.smarthealthit.org. Come back to this tour any time from the sidebar.</div>'
    + '<div class="onboard-actions"><button class="onboard-btn primary" onclick="finishOnboarding()">Start exploring →</button><button class="onboard-btn ghost" onclick="startOnboarding(1)">Replay tour</button></div>'
    + '<div class="onboard-body" style="font-size:12px">This tool shows trajectories, not predictions. Always use alongside clinical judgment.</div>'
    + '</div>'
  );
}

function onboardLogo() {
  return '<div class="onboard-logo-row"><div class="onboard-logo">' + ic("shuffle",20,"var(--teal-dark)") + '</div><div class="onboard-app-name">Clinical Doppelgänger</div></div>';
}

function onboardFlow() {
  return '<div class="onboard-icon-flow"><div class="onboard-flow-node">' + ic("clipboard",18,"var(--teal-dark)") + '<div>EHR</div></div><div class="onboard-flow-arrow">→</div><div class="onboard-flow-node">' + ic("shuffle",18,"var(--teal-dark)") + '<div>Match</div></div><div class="onboard-flow-arrow">→</div><div class="onboard-flow-node">' + ic("activity",18,"var(--teal-dark)") + '<div>Outcome</div></div></div>';
}
