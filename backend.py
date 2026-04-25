#!/usr/bin/env python3
"""
Minimal local cohort-matching API for Clinical Doppelganger.

Run:
  python3 backend.py

Endpoints:
  GET  /index.html, /launch.html, /app.js, /styles.css
  GET  /api/health
  POST /api/match
  POST /api/fhir-match

The cohort is reloaded from cohort_data.json on every request, so updating that
file updates matching results without editing the frontend.
"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse
import json
import math
import mimetypes
import os

ROOT = Path(__file__).resolve().parent
COHORT_PATH = ROOT / "cohort_data.json"
PORT = int(os.environ.get("PORT", "8000"))
STATIC_ALLOWLIST = {
    ".html", ".css", ".js", ".json", ".png", ".jpg", ".jpeg", ".gif", ".svg",
    ".ico", ".woff", ".woff2", ".ttf", ".map"
}


def has_text(items, *needles):
    text = " ".join(items or []).lower()
    return any(n in text for n in needles)


def patient_vector(patient):
    conditions = patient.get("conditions") or []
    meds = patient.get("meds") or []
    hba1c = patient.get("latestHbA1c")
    bp = patient.get("latestBP")
    enc = patient.get("encounters") or 0

    has_diabetes = has_text(conditions, "diabet")
    has_htn = has_text(conditions, "hypert", "blood pressure")
    has_lipid = has_text(conditions, "lipid", "cholesterol")
    on_metformin = has_text(meds, "metformin")
    on_ace_arb = has_text(meds, "lisinopril", "enalapril", "ramipril", "losartan", "valsartan")
    on_statin = has_text(meds, "statin", "atorva", "rosuva")
    hba1c = 7.5 if hba1c in (None, "") else float(hba1c)
    bp = 130 if bp in (None, "") else float(bp)

    return [
        1 if has_diabetes else 0,
        1 if has_htn else 0,
        1 if has_lipid else 0,
        1 if on_metformin else 0,
        1 if on_ace_arb else 0,
        1 if on_statin else 0,
        min(hba1c / 12, 1),
        min(bp / 200, 1),
        min(float(enc) / 10, 1),
        min(len(meds) / 8, 1),
        min(len(conditions) / 6, 1),
        1 if not has_diabetes else 0,
        1 if not has_htn else 0,
        1 if not has_lipid else 0,
        1 if not on_metformin else 0,
        1 if not on_ace_arb else 0,
        1 if not on_statin else 0,
    ]


def cohort_vector(case):
    f = case.get("features") or {}
    return patient_vector({
        "conditions": f.get("conditions") or [],
        "meds": f.get("meds") or [],
        "latestHbA1c": f.get("latestHbA1c"),
        "latestBP": f.get("latestBP"),
        "encounters": f.get("encounters") or 0,
    })


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(y * y for y in b))
    return 0 if not mag_a or not mag_b else dot / (mag_a * mag_b)


def load_cohort():
    with COHORT_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def match_patient(patient, top_k=4):
    vec = patient_vector(patient)
    scored = []
    for case in load_cohort():
        score = cosine(vec, cohort_vector(case))
        out = dict(case)
        out["simScore"] = round(score, 4)
        scored.append(out)
    scored.sort(key=lambda c: c["simScore"], reverse=True)
    return scored[:top_k]


def code_text(resource):
    code = resource.get("code") or {}
    if code.get("text"):
        return code["text"]
    coding = code.get("coding") or []
    if coding:
        return coding[0].get("display") or coding[0].get("code") or ""
    return ""


def medication_text(resource):
    med = resource.get("medicationCodeableConcept") or {}
    if med.get("text"):
        return med["text"]
    coding = med.get("coding") or []
    if coding:
        return coding[0].get("display") or coding[0].get("code") or ""
    return ""


def value_quantity(resource):
    value = (resource.get("valueQuantity") or {}).get("value")
    return value if isinstance(value, (int, float)) else None


def parse_fhir_payload(payload):
    pt = payload.get("patient") or {}
    conditions = payload.get("conditions") or []
    meds = payload.get("medications") or []
    observations = payload.get("observations") or []
    encounters = payload.get("encounters") or []

    name_obj = (pt.get("name") or [{}])[0]
    given = " ".join(name_obj.get("given") or [])
    family = name_obj.get("family") or ""
    name = (given + " " + family).strip() or "Unknown Patient"

    cond_names = [code_text(c) for c in conditions]
    cond_names = [c for c in cond_names if c]
    med_names = [medication_text(m) for m in meds]
    med_names = [m for m in med_names if m]

    latest_hba1c = None
    latest_bp = None
    for obs in observations:
        codings = ((obs.get("code") or {}).get("coding") or [])
        codes = {c.get("code") for c in codings}
        if latest_hba1c is None and "4548-4" in codes:
            latest_hba1c = value_quantity(obs)
        if latest_bp is None and "55284-4" in codes:
            for comp in obs.get("component") or []:
                comp_codes = {c.get("code") for c in ((comp.get("code") or {}).get("coding") or [])}
                if "8480-6" in comp_codes:
                    latest_bp = (comp.get("valueQuantity") or {}).get("value")

    return {
        "id": pt.get("id"),
        "name": name,
        "gender": pt.get("gender") or "unknown",
        "dob": pt.get("birthDate") or "",
        "conditions": cond_names,
        "meds": med_names,
        "latestHbA1c": latest_hba1c,
        "latestBP": latest_bp,
        "encounters": len(encounters),
    }


class Handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def write_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def static_path(self):
        path = unquote(urlparse(self.path).path)
        if path == "/":
            path = "/index.html"
        file_path = (ROOT / path.lstrip("/")).resolve()
        if ROOT not in file_path.parents and file_path != ROOT:
            return None
        if file_path.is_dir():
            file_path = file_path / "index.html"
        if not file_path.exists() or file_path.suffix.lower() not in STATIC_ALLOWLIST:
            return None
        return file_path

    def write_static(self, head_only=False):
        file_path = self.static_path()
        if not file_path:
            self.write_json(404, {"error": "Not found"})
            return
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        body = b"" if head_only else file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(file_path.stat().st_size))
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/health":
            self.write_json(200, {
                "ok": True,
                "cohortPath": str(COHORT_PATH.name),
                "mode": "api-and-static",
                "open": f"http://localhost:{PORT}/index.html",
            })
            return
        self.write_static()

    def do_HEAD(self):
        if self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            return
        self.write_static(head_only=True)

    def do_POST(self):
        if self.path not in ("/api/match", "/api/fhir-match"):
            self.write_json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
            patient = parse_fhir_payload(payload) if self.path == "/api/fhir-match" else (payload.get("patient") or {})
            top_k = int(payload.get("topK") or 4)
            matches = match_patient(patient, top_k=top_k)
            self.write_json(200, {
                "source": "backend",
                "inputType": "fhir" if self.path == "/api/fhir-match" else "patient-summary",
                "patient": patient,
                "cohortSize": len(load_cohort()),
                "matched": matches,
            })
        except Exception as exc:
            self.write_json(500, {"error": str(exc)})


if __name__ == "__main__":
    server = ThreadingHTTPServer(("localhost", PORT), Handler)
    print(f"Clinical Doppelganger backend running at http://localhost:{PORT}")
    print(f"Using cohort file: {COHORT_PATH}")
    server.serve_forever()
