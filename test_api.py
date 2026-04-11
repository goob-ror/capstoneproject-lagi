import urllib.request
import urllib.parse
import json

BASE = "https://ibundacare.samarindakota.go.id/api"
YEAR = 2026

def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def get(path, token):
    req = urllib.request.Request(f"{BASE}{path}", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw.decode(errors="replace")[:200]}

def check(label, status, body):
    ok = "✓" if status == 200 else "✗"
    preview = str(body)[:120]
    print(f"  {ok} [{status}] {label}: {preview}")

print("=== Login ===")
login = post("/auth/login", {"username": "adminBidan", "password": "password"})
token = login.get("token")
print(f"  Token: {token[:40]}..." if token else f"  FAILED: {login}")

if not token:
    print("Cannot continue without token.")
    exit(1)

print("\n=== Endpoints ===")
endpoints = [
    ("Health",              "/health"),
    ("Dashboard Stats",    "/dashboard/stats"),
    ("Dashboard ANC/Month","/dashboard/anc-per-month"),
    ("Data Ibu",           "/ibu"),
    ("ANC (2026)",          f"/anc?year={YEAR}"),
    ("ANC (2025)",          "/anc?year=2025"),
    ("ANC (no filter)",     "/anc"),
    ("Persalinan",         f"/persalinan?year={YEAR}"),
    ("Nifas",              f"/nifas?year={YEAR}"),
    ("Posyandu",           "/posyandu"),
    ("Kelurahan",          "/kelurahan"),
    ("Komplikasi",         "/komplikasi"),
    ("Rekapitulasi",       "/rekapitulasi"),
    ("Users",              "/users"),
]

for label, path in endpoints:
    status, body = get(path, token)
    check(label, status, body)
