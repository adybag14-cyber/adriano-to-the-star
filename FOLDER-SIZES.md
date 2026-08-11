# Folder Sizes - What to Remove to Free Up Space

## Current Folder Sizes (on disk):

| Folder | Size | Priority |
|--------|------|----------|
| **gta-6-videos** | **3.31 GB** | 🔴 **REMOVE FIRST** |
| **games** | **3.01 GB** | 🔴 **REMOVE SECOND** |
| audio | 0.12 GB | ⚠️ Keep (small) |
| total-war-2 | 0.05 GB | ⚠️ Keep (small) |
| backend | 0.11 GB | ⚠️ Keep (needed) |

## To Free Up Space Instantly:

**Remove these 2 folders from GitLab:**
1. `gta-6-videos/` - **3.31 GB** ← Remove this first!
2. `games/` - **3.01 GB** ← Remove this second!

**Total freed:** ~6.32 GB

This would bring your repository from **6.23 GB down to under 1 GB** (well under the 10 GB limit).

## How to Remove from GitLab:

Since you can't push (over limit), you need to:

### Option 1: Use GitLab Web Interface (if available)
1. Go to your project on GitLab
2. Navigate to the folders
3. Delete them through the web UI

### Option 2: Contact GitLab Support
Ask them to remove these folders from repository history:
- `games/` folder (3.01 GB)
- `gta-6-videos/` folder (3.31 GB)

### Option 3: Use GitLab API (if you have access)
Delete the folders via API

## After Removal:

Once these folders are removed from GitLab:
1. Your repository will be under 1 GB
2. You can push the fresh repository we created
3. Then set up the separate media project

