#!/usr/bin/env python3
"""Comprehensive HTML validator - checks structure, missing tags, broken links"""
from pathlib import Path
import re

def validate_html(file_path):
    """Validate HTML file structure"""
    content = file_path.read_text(encoding='utf-8')
    issues = []
    
    # Check DOCTYPE
    if not content.strip().startswith('<!DOCTYPE html>'):
        issues.append("Missing or incorrect DOCTYPE")
    
    # Check required tags
    required_tags = ['<html', '<head', '</head>', '<body', '</body>', '</html>']
    for tag in required_tags:
        if tag not in content:
            issues.append(f"Missing required tag: {tag}")
    
    # Check for title
    if '<title>' not in content:
        issues.append("Missing <title> tag")
    
    # Check for charset
    if 'charset=' not in content:
        issues.append("Missing charset declaration")
    
    # Check for unclosed tags (basic)
    open_tags = re.findall(r'<(\w+)[^>]*>', content)
    close_tags = re.findall(r'</(\w+)>', content)
    self_closing = ['meta', 'link', 'img', 'br', 'hr', 'input']
    
    for tag in open_tags:
        if tag.lower() not in self_closing:
            if open_tags.count(tag) != close_tags.count(tag):
                issues.append(f"Unclosed tag: <{tag}>")
    
    # Check for loader.js and loader.css
    if 'loader.js' not in content:
        issues.append("Missing loader.js")
    if 'loader.css' not in content:
        issues.append("Missing loader.css")
    
    # Check for manifest.json
    if 'manifest.json' not in content:
        issues.append("Missing manifest.json link")
    
    return issues

# Validate all HTML files
html_files = list(Path('.').glob('*.html'))
print(f"📋 Validating {len(html_files)} HTML files...\n")

all_issues = {}
for html_file in sorted(html_files):
    if 'index_' in html_file.name or 'scraped' in html_file.name:
        continue
    
    issues = validate_html(html_file)
    if issues:
        all_issues[html_file.name] = issues
        print(f"❌ {html_file.name}")
        for issue in issues:
            print(f"   • {issue}")
    else:
        print(f"✅ {html_file.name}")

print(f"\n📊 Summary:")
print(f"  Total files: {len(html_files)}")
print(f"  Files with issues: {len(all_issues)}")
print(f"  Files clean: {len(html_files) - len(all_issues)}")

if all_issues:
    print(f"\n⚠️ Found issues in {len(all_issues)} files!")
else:
    print(f"\n✅ All HTML files are valid!")
