#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json,re,subprocess,tempfile,sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def fail(msg): errors.append(msg)
def read(path):
    p=ROOT/path
    if not p.is_file():
        fail(f"missing file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.labels=set(); self.controls=[]; self.label_depth=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="label":
            self.label_depth+=1
            if a.get("for"): self.labels.add(a["for"])
        if tag in ("input","select","textarea") and str(a.get("type","")).lower()!="hidden":
            self.controls.append((a,self.label_depth>0))
        key={"a":"href","script":"src","link":"href","img":"src","source":"src"}.get(tag)
        if key and a.get(key): self.refs.append(a[key])
    def handle_endtag(self,tag):
        if tag=="label" and self.label_depth>0: self.label_depth-=1

def local_ref(page,ref):
    if not ref or ref.startswith(("http:","https:","mailto:","tel:","javascript:","#","data:")): return None
    clean=ref.split("?",1)[0].split("#",1)[0]
    return (page.parent/clean).resolve() if clean else None

def check_html(path,project=False):
    p=ROOT/path; text=read(path)
    parser=Parser(); parser.feed(text)
    if 'name="viewport"' not in text: fail(f"{path}: viewport missing")
    if "Suhail Saeedi" in text or "Suhail Saeidi" in text: fail(f"{path}: creator surname misspelled")
    if project:
        if 'data-theme="light"' not in text: fail(f"{path}: Light must be the initial theme")
        if 'data-theme="dark"' not in text: fail(f"{path}: Dark theme support missing")
        if 'id="themeToggle"' not in text: fail(f"{path}: theme toggle missing")
        if "../../index.html" not in text: fail(f"{path}: portfolio return link missing")
    for a,wrapped in parser.controls:
        cid=a.get("id","")
        named=bool(wrapped or a.get("aria-label") or a.get("aria-labelledby") or a.get("title") or (cid and cid in parser.labels))
        if not named: fail(f"{path}: unlabeled control id={cid or '(none)'}")
    for ref in parser.refs:
        target=local_ref(p,ref)
        if target is not None and not target.exists(): fail(f"{path}: missing local reference {ref}")
    for i,code in enumerate(re.findall(r"<script>([\s\S]*?)</script>",text,re.I)):
        with tempfile.NamedTemporaryFile("w",suffix=".js",delete=False,encoding="utf-8") as tmp:
            tmp.write(code); name=tmp.name
        r=subprocess.run(["node","--check",name],capture_output=True,text=True)
        Path(name).unlink(missing_ok=True)
        if r.returncode: fail(f"{path}: inline JS syntax error #{i+1}: {(r.stderr or r.stdout).strip()}")

for page in ["index.html","project.html","links.html","work-with-me.html","admin.html"]:
    check_html(page)
for page in [
    "projects/001-smart-ordering/index.html",
    "projects/002-network-lab/index.html",
    "projects/003-medical-dictionary/index.html",
    "projects/004-network-speed/index.html",
    "projects/005-smart-inventory/index.html",
]:
    check_html(page,project=True)

raw=read("data/site-data.js").strip()
try:
    payload=re.sub(r"^window\.SUHAIL_LABS_DATA\s*=\s*","",raw)
    payload=re.sub(r";\s*$","",payload)
    data=json.loads(payload)
except Exception as e:
    data={}; fail(f"site-data.js parse failed: {e}")

for project in data.get("projects",[]):
    for key in ("live","download"):
        ref=str(project.get(key,"") or "")
        if ref and not ref.startswith(("http://","https://")) and not (ROOT/ref).exists():
            fail(f"Project {project.get('id')}: missing {key} target {ref}")

p1=read("projects/001-smart-ordering/index.html")
for marker in ["function cancelOrder(","function removeOrderLine(","function removeItem(","Current order"]:
    if marker not in p1: fail(f"Project 001 missing required workflow: {marker}")

p2=read("projects/002-network-lab/index.html")
if "Simulation metrics" not in p2 or "not readings from your real network" not in p2:
    fail("Project 002 must clearly label generated metrics as simulation data")
if ";draw()}" in p2.split("function setTheme(theme)",1)[-1].split("\n",1)[0]:
    fail("Project 002 theme initialization must not draw before canvas setup")

p4=read("projects/004-network-speed/index.html")
for banned in ["downlink*.22","Math.max(...downs)","Math.max(...ups)"]:
    if banned in p4: fail(f"Project 004 contains disallowed measurement shortcut: {banned}")
for marker in ["const download=median(downs)","upload=median(ups)","fetchWithTimeout","No upload value was invented or estimated"]:
    if marker not in p4: fail(f"Project 004 missing measurement-integrity marker: {marker}")

p5=read("projects/005-smart-inventory/index.html")
for marker in ["BarcodeDetector","getUserMedia","localStorage","reportText()","restoreJson","Light"]:
    if marker not in p5: fail(f"Project 005 missing inventory feature marker: {marker}")
if "sample records" not in p5 or "stored only in this browser" not in p5:
    fail("Project 005 must clearly label sample/local inventory data")

for path in ["assets/js/site.js","assets/js/project.js","assets/js/admin.js"]:
    r=subprocess.run(["node","--check",str(ROOT/path)],capture_output=True,text=True)
    if r.returncode: fail(f"{path}: JS syntax failed: {(r.stderr or r.stdout).strip()}")

secret_patterns=[
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b"),
]
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in {".html",".js",".css",".json",".md"}: continue
    if ".git" in path.parts: continue
    text=path.read_text(encoding="utf-8",errors="ignore")
    for pat in secret_patterns:
        if pat.search(text): fail(f"possible secret in {path.relative_to(ROOT)}")

if errors:
    print("SUHAIL LABS QA FAIL")
    for e in errors: print("-",e)
    sys.exit(1)

print("SUHAIL LABS QA PASS")
print(f"projects: {len(data.get('projects',[]))}")
print("responsive/light-dark/accessibility/link/JS/measurement checks: PASS")
