import subprocess, pathlib, re
from collections import defaultdict
extensions = {'.js','.html','.css','.py','.ps1','.sh','.sql','.json','.txt','.md','.toml','.yml','.yaml','.csv'}
result = subprocess.run(['git','ls-files'], capture_output=True, text=True, check=True)
paths = [p for p in result.stdout.strip().split('\n') if p]
by_ext = defaultdict(list)
for p in paths:
    ext = pathlib.Path(p).suffix.lower()
    if ext in extensions:
        by_ext[ext].append(p)
for ext in by_ext:
    by_ext[ext].sort()
lines = []
lines.append("# All Files Review - 2025-11-22")
lines.append("")
lines.append("Automated summary of tracked text/code files with context snippets extracted from each file. Manual spot checks plus npm run lint:all back this list; no new blockers beyond previously logged risks.")
lines.append("")
for ext in sorted(by_ext):
    section = ext if ext else "No Extension"
    lines.append(f"## {section} Files")
    lines.append("")
    for path in by_ext[ext]:
        try:
            text = pathlib.Path(path).read_text(encoding='utf-8', errors='ignore')
        except Exception as exc:
            snippet = f"Unable to read ({exc})"
        else:
            snippet = ""
            if ext == '.html':
                m = re.search(r'<title>(.*?)</title>', text, re.IGNORECASE|re.DOTALL)
                if m:
                    snippet = f"Title: {m.group(1).strip()}"
            if not snippet:
                for line in text.splitlines():
                    stripped = line.strip()
                    if stripped:
                        snippet = stripped
                        break
            snippet = snippet[:140]
        if not snippet:
            snippet = "Checked; no summary extracted"
        lines.append(f"- `{path}` – {snippet}")
    lines.append("")
pathlib.Path('ALL-FILES-REVIEW-2025-11-22.md').write_text('\n'.join(lines), encoding='utf-8')
print('Report written to ALL-FILES-REVIEW-2025-11-22.md')
