#!/bin/bash
# Fix Music Files for GitLab Pages
# This script ensures MP3 files are committed as regular files, not LFS

echo "🔧 Fixing MP3 files for GitLab Pages..."

# Remove from LFS
git lfs untrack "*.mp3"

# Remove from git cache
git rm --cached audio/*.mp3 2>/dev/null || true

# Add as regular files
git add -f audio/*.mp3

# Update .gitattributes
echo "# MP3 files are NOT in Git LFS for GitLab Pages compatibility" > .gitattributes.tmp
echo "# GitLab Pages doesn't serve LFS files" >> .gitattributes.tmp
echo "# *.mp3 filter=lfs diff=lfs merge=lfs -text" >> .gitattributes.tmp
echo "" >> .gitattributes.tmp
echo "*.wav filter=lfs diff=lfs merge=lfs -text" >> .gitattributes.tmp
echo "*.m4a filter=lfs diff=lfs merge=lfs -text" >> .gitattributes.tmp
echo "" >> .gitattributes.tmp
echo "# Binary files" >> .gitattributes.tmp
echo "*.png binary" >> .gitattributes.tmp
echo "*.jpg binary" >> .gitattributes.tmp
echo "*.jpeg binary" >> .gitattributes.tmp
echo "*.gif binary" >> .gitattributes.tmp
echo "*.ico binary" >> .gitattributes.tmp
echo "*.pdf binary" >> .gitattributes.tmp

mv .gitattributes.tmp .gitattributes
git add .gitattributes

echo "✅ Files ready to commit"
echo "📝 Run: git commit -m 'Fix: Commit MP3 files as regular files for GitLab Pages'"
echo "📤 Then: git push origin main"

