import os
import re
import json
from collections import defaultdict

# Configuration
IGNORE_DIRS = {'node_modules', '.git', 'dist', 'coverage', 'build', '__pycache__', 'vendor'}
IGNORE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.pdf', '.zip', '.gz', '.pyc'}
TEXT_EXTS = {'.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.json', '.md', '.py', '.java', '.c', '.cpp', '.h', '.sh', '.bat', '.ps1'}

# Patterns to scan for (Line by Line Analysis)
PATTERNS = {
    'security_secrets': re.compile(r'(api_key|apikey|secret|token|password|passwd|pwd)\s*[:=]\s*["\'][a-zA-Z0-9_\-]{20,}["\']', re.IGNORECASE),
    'security_unsafe_eval': re.compile(r'\beval\s*\('),
    'security_unsafe_innerhtml': re.compile(r'\.innerHTML\s*='),
    'security_hardcoded_auth': re.compile(r'Basic\s+[a-zA-Z0-9+/=]{10,}'),
    'quality_todo': re.compile(r'//\s*TODO|#\s*TODO|<!--\s*TODO'),
    'quality_fixme': re.compile(r'//\s*FIXME|#\s*FIXME|<!--\s*FIXME'),
    'quality_console_log': re.compile(r'console\.log\s*\('),
    'quality_alert': re.compile(r'alert\s*\('),
    'syntax_empty_catch': re.compile(r'catch\s*\(\s*\w*\s*\)\s*\{\s*\}'),
    'arch_hardcoded_localhost': re.compile(r'localhost:[0-9]+'),
    'arch_hardcoded_ip': re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'),
}

stats = {
    'total_files': 0,
    'total_lines': 0,
    'file_types': defaultdict(int),
    'findings': defaultdict(list),
    'largest_files': []
}

def analyze_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
        stats['total_files'] += 1
        line_count = len(lines)
        stats['total_lines'] += line_count
        
        # Track file size
        stats['largest_files'].append((file_path, line_count))
        
        # Line-by-line analysis
        for i, line in enumerate(lines):
            for check_name, pattern in PATTERNS.items():
                if pattern.search(line):
                    # Store finding (limit to 10 per check per file to avoid noise)
                    key = f"{check_name}"
                    if len(stats['findings'][key]) < 50: # Global limit for summary
                        stats['findings'][key].append({
                            'file': file_path,
                            'line': i + 1,
                            'content': line.strip()[:100] # Truncate for report
                        })

    except Exception as e:
        # print(f"Error reading {file_path}: {e}")
        pass

def scan_repo(root_dir):
    print(f"Starting Expert Audit on: {root_dir}")
    
    for root, dirs, files in os.walk(root_dir):
        # Filter directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in IGNORE_EXTS:
                continue
                
            stats['file_types'][ext] += 1
            
            if ext in TEXT_EXTS:
                file_path = os.path.join(root, file)
                analyze_file(file_path)

    # Post-process stats
    stats['largest_files'].sort(key=lambda x: x[1], reverse=True)
    stats['largest_files'] = stats['largest_files'][:10] # Top 10

    # Output Report
    print("\n" + "="*50)
    print("EXPERT AUDIT REPORT SUMMARY")
    print("="*50)
    print(f"Total Files Scanned: {stats['total_files']}")
    print(f"Total Lines of Code: {stats['total_lines']}")
    print("-" * 30)
    print("File Type Distribution:")
    for ext, count in sorted(stats['file_types'].items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {ext}: {count}")
    
    print("\n" + "="*50)
    print("CRITICAL FINDINGS (Sample)")
    print("="*50)
    
    for category, findings in stats['findings'].items():
        if findings:
            print(f"\n[ {category.upper()} ] - Found {len(findings)}+ instances")
            for f in findings[:3]: # Show top 3 examples
                print(f"  - {f['file']}:{f['line']} -> {f['content']}")

    print("\n" + "="*50)
    print("LARGEST FILES (Complexity Risk)")
    print("="*50)
    for fpath, lines in stats['largest_files']:
        print(f"  {lines} lines: {fpath}")

if __name__ == "__main__":
    scan_repo(".")
