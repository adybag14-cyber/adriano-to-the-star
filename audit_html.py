import os
import re

def audit_html_files(directory):
    html_files = [f for f in os.listdir(directory) if f.endswith('.html')]
    report = {}

    required_tags = ['<!DOCTYPE html>', '<html', '<head', '<body', 'loader.css', 'loader.js', 'navigation.js', 'styles.css']
    
    for file in html_files:
        file_path = os.path.join(directory, file)
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        issues = []
        
        # Check for required tags/scripts
        for tag in required_tags:
            if tag not in content:
                issues.append(f"Missing: {tag}")
        
        # Check for structure
        if content.count('<html') > 1:
            issues.append("Multiple <html> tags found")
        if content.count('<body') > 1:
            issues.append("Multiple <body> tags found")
        if content.count('<head') > 1:
            issues.append("Multiple <head> tags found")
            
        if issues:
            report[file] = issues

    return report

if __name__ == "__main__":
    directory = "."
    results = audit_html_files(directory)
    
    if results:
        print("Audit Results:")
        for file, issues in results.items():
            print(f"\n{file}:")
            for issue in issues:
                print(f"  - {issue}")
    else:
        print("No major issues found in HTML files.")
