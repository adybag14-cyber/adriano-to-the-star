#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitLab Wiki Setup Script
Automatically clones and populates the GitLab wiki with documentation
"""

import os
import subprocess
import shutil
import sys

# Fix Windows encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

WIKI_REPO = "https://gitlab.com/adybag14-group/starisdons.wiki.git"
WIKI_DIR = "wiki"
CLONE_DIR = "starisdons.wiki"

def run_command(cmd, cwd=None):
    """Run a shell command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=True, 
                              capture_output=True, text=True)
        print(f"[OK] {cmd}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {e.stderr}")
        return False

def setup_wiki():
    """Set up GitLab wiki with documentation files"""
    
    print("=" * 60)
    print("GitLab Wiki Setup")
    print("=" * 60)
    print()
    
    # Check if wiki directory exists
    if not os.path.exists(WIKI_DIR):
        print(f"[WARNING] {WIKI_DIR}/ directory not found!")
        print("Creating wiki directory...")
        os.makedirs(WIKI_DIR, exist_ok=True)
        print("Please add wiki files to the wiki/ directory first.")
        return False
    
    # Check if wiki repo is already cloned
    if os.path.exists(CLONE_DIR):
        print(f"Found existing {CLONE_DIR}/ directory")
        print("Removing existing clone to start fresh...")
        try:
            shutil.rmtree(CLONE_DIR)
        except Exception as e:
            print(f"[WARNING] Could not remove existing directory: {e}")
            print("Continuing with existing directory...")
    
    # Clone wiki repository
    if not os.path.exists(CLONE_DIR):
        print(f"\n1. Cloning wiki repository...")
        if not run_command(f"git clone {WIKI_REPO} {CLONE_DIR}"):
            print("\n❌ Failed to clone wiki repository.")
            print("Make sure you have access to the repository.")
            return False
    else:
        print(f"\n1. Using existing wiki clone...")
    
    # Copy wiki files
    print(f"\n2. Copying wiki files from {WIKI_DIR}/...")
    wiki_files = [f for f in os.listdir(WIKI_DIR) if f.endswith('.md')]
    
    if not wiki_files:
        print(f"⚠️  No markdown files found in {WIKI_DIR}/")
        print("Creating sample Home.md...")
        with open(f"{CLONE_DIR}/Home.md", 'w', encoding='utf-8') as f:
            f.write("# Welcome to the Wiki\n\nThis is the main wiki page.\n")
        wiki_files = ['Home.md']
    
    for file in wiki_files:
        src = os.path.join(WIKI_DIR, file)
        dst = os.path.join(CLONE_DIR, file)
        try:
            shutil.copy2(src, dst)
            print(f"  [OK] Copied {file}")
        except Exception as e:
            print(f"  [ERROR] Failed to copy {file}: {e}")
    
    # Commit and push
    print(f"\n3. Committing changes...")
    os.chdir(CLONE_DIR)
    
    if not run_command("git add ."):
        print("[ERROR] Failed to add files")
        return False
    
    if not run_command('git commit -m "Add wiki documentation from setup script"'):
        print("[WARNING] No changes to commit (files may already exist)")
    
    print(f"\n4. Pushing to GitLab...")
    if not run_command("git push origin master"):
        print("\n[WARNING] Failed to push. You may need to:")
        print("   1. Check your GitLab credentials")
        print("   2. Push manually: cd starisdons.wiki && git push origin master")
        return False
    
    os.chdir("..")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Wiki setup complete!")
    print("=" * 60)
    print(f"\nYour wiki is now available at:")
    print(f"https://gitlab.com/adybag14-group/starisdons/-/wikis/home")
    print(f"\nTo update the wiki:")
    print(f"  1. Edit files in {CLONE_DIR}/")
    print(f"  2. cd {CLONE_DIR}")
    print(f"  3. git add . && git commit -m 'Update wiki' && git push")
    
    return True

if __name__ == "__main__":
    try:
        success = setup_wiki()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n[ERROR] Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        sys.exit(1)

