# GitLab Storage Limit Solutions

## Current Situation
- **Repository Size:** ~6.23 GiB
- **GitLab Free Tier Limit:** 10 GiB per project
- **Status:** Storage limit reached

## Large Files Identified

### 1. Games Folder (1,244 Flash games)
- **Estimated Size:** ~2-3 GB
- **Location:** `games/*.swf`

### 2. GTA 6 Videos
- **Estimated Size:** ~1-2 GB  
- **Location:** `gta-6-videos/*.mp4`

### 3. Total War 2 Game Files
- **Estimated Size:** ~1-2 GB
- **Location:** `total-war-2/`

## Solutions

### Option 1: Use Git LFS (Large File Storage) ⭐ RECOMMENDED
Git LFS stores large files outside the main repository but keeps references.

**Setup:**
```bash
# Install Git LFS (if not installed)
git lfs install

# Track large file types
git lfs track "*.swf"
git lfs track "*.mp4"
git lfs track "*.exe"
git lfs track "*.dll"

# Add .gitattributes
git add .gitattributes

# Migrate existing files
git lfs migrate import --include="*.swf,*.mp4,*.exe,*.dll" --everything
```

**Note:** GitLab free tier includes 5 GB of LFS storage.

### Option 2: Move Files to External Storage
Host large files on external services and reference them:

**Services:**
- **Supabase Storage** (you already use this) - 1GB free, then paid
- **Cloudflare R2** - Free tier available
- **AWS S3** - Pay as you go
- **Google Drive / OneDrive** - Free with links
- **GitHub Releases** - Free for public repos

**Implementation:**
- Upload files to external storage
- Update JavaScript to load from external URLs
- Keep only HTML/JS/CSS in GitLab

### Option 3: Remove Large Files from Git History
If files were recently added, you can remove them from history:

```bash
# Remove large files from history (DANGEROUS - use with caution)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch games/*.swf" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (will rewrite history)
git push origin --force --all
```

### Option 4: Split into Multiple Projects
- Keep main site in current project
- Create separate projects for:
  - Games (games-project)
  - Videos (videos-project)
  - Large games (large-games-project)

### Option 5: Purchase Additional Storage
- GitLab offers additional storage for purchase
- Navigate to: Settings > Usage Quotas > Storage

## Recommended Approach

**Best Solution:** Use Git LFS for new large files + Move existing files to Supabase Storage

1. **For new files:** Use Git LFS
2. **For existing files:** Upload to Supabase Storage and update code to load from there
3. **Keep repository small:** Only HTML, CSS, JS, and small assets in Git

## Quick Fix: Remove Recent Large Commits

If you just added the large files, you can:

```bash
# Reset to before large files were added
git reset --soft HEAD~3  # Go back 3 commits

# Remove large files from staging
git reset HEAD games/ gta-6-videos/ total-war-2/

# Keep the page files, remove the large media
# Then commit only the HTML/JS/CSS files
```

## Next Steps

1. **Immediate:** Remove large files from current commit
2. **Short-term:** Set up Git LFS or external storage
3. **Long-term:** Implement a CDN or cloud storage solution

Would you like me to:
- Set up Git LFS?
- Move files to Supabase Storage?
- Remove large files from the repository?
- Create a script to upload files to external storage?

