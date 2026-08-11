# GitLab Storage Cleanup Guide

## Current Usage
- **Total**: 5.5 GiB / 10 GiB (55% used)
- **Repository**: 3.0 GiB (54.9%)
- **Job Artifacts**: 2.5 GiB (44.8%) ⚠️ **Main Issue**
- **LFS**: 15.3 MiB (0.3%)

## Problem
Job artifacts are taking up 2.5 GiB of space. Old artifacts accumulate and aren't automatically cleaned up.

## Solutions

### 1. Clean Up Old Artifacts (IMMEDIATE - Free up 2.5 GiB)
1. Go to **GitLab Project → Settings → CI/CD → General pipelines**
2. Scroll to **Artifacts**
3. Set **Keep artifacts from most recent successful jobs**: `1`
4. Set **Expire artifacts older than**: `1 day` (or even less)
5. Click **Save changes**
6. Manually delete old artifacts:
   - Go to **CI/CD → Pipelines**
   - Click on old pipelines
   - Click the **X** button to delete artifacts

### 2. Clean Up Old Pipelines (Alternative)
1. Go to **CI/CD → Pipelines**
2. Click **Clear pipelines** or delete old pipelines individually
3. This will also delete associated artifacts

### 3. Reduce Artifact Size (Already Done)
- Updated `.gitlab-ci.yml` to:
  - Set `expire_in: 1 day` (artifacts expire after 1 day)
  - Limit SWF files to first 1000
  - Exclude unnecessary files

### 4. Reduce Repository Size (If Needed)
If repository grows too large:
- Remove large files from history (use `git filter-branch` or BFG Repo-Cleaner)
- Move large files to external storage or Git LFS
- Remove old branches and tags

## Expected Results
After cleanup:
- **Job Artifacts**: Should drop from 2.5 GiB to < 500 MiB
- **Total Storage**: Should drop to ~3.5 GiB / 10 GiB (35% used)
- **Available Space**: ~6.5 GiB free

## Prevention
- The updated CI/CD configuration will:
  - Auto-expire artifacts after 1 day
  - Only keep artifacts from successful builds
  - Limit artifact size

## Next Steps
1. ✅ Update CI/CD config (already done)
2. ⬜ Clean up old artifacts in GitLab UI
3. ⬜ Set artifact retention policies in project settings
4. ⬜ Monitor storage usage

