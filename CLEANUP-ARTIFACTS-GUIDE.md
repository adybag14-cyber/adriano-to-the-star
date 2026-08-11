# How to Clean Up Job Artifacts in GitLab

**Current Storage Usage:** 5.5 GiB / 10 GiB limit  
**Job Artifacts:** 2.47 GiB (44.8% of total)  
**Goal:** Free up ~2.5 GiB by deleting old artifacts

---

## 🔍 Your Current Storage Breakdown

- **Total Usage:** 5.5 GiB
- **Repository:** 3.02 GiB (54.9%)
- **Job Artifacts:** 2.47 GiB (44.8%) ⚠️ **TARGET FOR CLEANUP**
- **LFS:** 15.27 MiB (0.3%)
- **Packages:** 0 B
- **Snippets:** 0 B
- **Wiki:** 0 B

**After cleanup:** Should reduce to ~3 GiB (freeing ~2.5 GiB)

---

## ✅ Solution: Delete Job Artifacts

### **Method 1: Delete Artifacts from Pipelines Page** (Recommended)

1. **Go to Pipelines:**
   ```
   https://gitlab.com/imtherushwar/newstarpage2/-/pipelines
   ```

2. **For each old pipeline:**
   - Click on a pipeline (older ones are better targets)
   - Look for "Artifacts" section or "Download artifacts" link
   - Click "Delete" or trash icon next to artifacts
   - Confirm deletion

3. **Bulk deletion (if available):**
   - Some GitLab versions have bulk delete options
   - Look for checkboxes next to pipelines
   - Select multiple old pipelines
   - Click "Delete artifacts" or similar option

---

### **Method 2: Through CI/CD Settings** (Alternative)

1. **Go to Project Settings:**
   ```
   https://gitlab.com/imtherushwar/newstarpage2/-/settings/ci_cd
   ```

2. **Expand "Artifacts" section:**
   - Look for "Artifact management" or "Cleanup policy"
   - Set expiration policy (already set to 1 day in `.gitlab-ci.yml`)
   - Look for manual cleanup options

3. **Check "CI/CD Variables" if needed:**
   - Some cleanup might require API access

---

### **Method 3: Using GitLab API** (Advanced)

If UI doesn't have bulk delete:

```bash
# Get your personal access token from:
# GitLab → User Settings → Access Tokens
# Scopes needed: api, write_repository

# List all pipelines with artifacts
curl --header "PRIVATE-TOKEN: <your-token>" \
  "https://gitlab.com/api/v4/projects/imtherushwar%2Fnewstarpage2/pipelines"

# Delete artifacts for a specific pipeline
curl --request DELETE \
  --header "PRIVATE-TOKEN: <your-token>" \
  "https://gitlab.com/api/v4/projects/imtherushwar%2Fnewstarpage2/pipelines/<pipeline-id>/artifacts"
```

---

## 🎯 What to Delete

### **Priority 1: Old Failed Pipelines** ✅
- Focus on failed pipelines (the 9 recent failures)
- These artifacts aren't needed if pipelines failed
- Delete artifacts for commits: `64fc1d4`, `7c96c8f`, `0e6b62a`, etc.

### **Priority 2: Successful Pipelines Older Than 7 Days** ✅
- Pipelines older than 1 week are safe to delete
- Current config sets expiration to 1 day, but old artifacts may still exist
- Check pipelines from before recent failures

### **Priority 3: Large Artifact Sets** ✅
- Look for pipelines with large artifact sizes
- Check artifact size in pipeline details
- Focus on ones with large `public/` directories

---

## 📊 Expected Results

### **Before Cleanup:**
- Total: 5.5 GiB
- Job Artifacts: 2.47 GiB

### **After Cleanup:**
- Total: ~3 GiB
- Job Artifacts: ~0 GiB (or minimal)
- **Freed Space:** ~2.5 GiB

### **Benefits:**
- ✅ Pipelines can run again
- ✅ New artifacts can be created
- ✅ Storage usage drops below 50% of limit
- ✅ Room for future growth

---

## 🔄 After Cleanup: Retry Pipelines

Once artifacts are deleted and storage is freed:

1. **Check Storage Usage:**
   - Go back to Settings → Usage Quotas
   - Verify usage dropped to ~3 GiB

2. **Retry Failed Pipelines:**
   - Go to Pipelines page
   - Click on failed pipeline (`64fc1d4f` - most recent)
   - Click "Retry" button
   - Pipeline should succeed now

3. **Push New Commits:**
   - Your local commits (`e46a788`, `57b73db`) can be pushed
   - They will trigger new pipelines
   - Pipelines should succeed automatically

---

## 🛡️ Prevent Future Issues

### **Already Configured:**
- ✅ Artifact expiration: 1 day (in `.gitlab-ci.yml`)
- ✅ Artifact cleanup: Automatic after 1 day
- ✅ SWF file limit: 1000 files (prevents large artifacts)

### **Recommendations:**
1. **Monitor Storage:**
   - Check Usage Quotas monthly
   - Keep total under 7 GiB (70% of limit)

2. **Clean Up Regularly:**
   - If artifacts don't auto-expire, manually clean monthly
   - Focus on old failed pipelines

3. **Optimize Repository Size:**
   - Consider removing large unused files
   - Use `.gitignore` for temporary files
   - Compress large assets if needed

---

## 🚨 Important Notes

1. **Artifact Deletion is Permanent:**
   - Once deleted, artifacts cannot be recovered
   - Make sure you don't need them before deleting

2. **Current Artifacts Are Old:**
   - Since pipelines are failing, old artifacts are from previous successful runs
   - They're safe to delete (expired anyway)

3. **New Artifacts Will Auto-Expire:**
   - Future artifacts will expire after 1 day automatically
   - No manual cleanup needed for new artifacts

---

## ✅ Quick Checklist

- [ ] Go to Pipelines page
- [ ] Identify old pipelines with artifacts
- [ ] Delete artifacts from failed pipelines first
- [ ] Delete artifacts from old successful pipelines (>7 days)
- [ ] Check Usage Quotas - verify storage dropped
- [ ] Retry most recent failed pipeline
- [ ] Verify pipeline succeeds
- [ ] Push pending local commits
- [ ] Monitor storage usage going forward

---

## 📞 If Cleanup Doesn't Work

If you can't delete artifacts through UI:

1. **Check Permissions:**
   - Ensure you have maintainer/owner access
   - Some cleanup operations require elevated permissions

2. **Contact GitLab Support:**
   - If storage is blocking all operations
   - They can help manually clean artifacts

3. **Alternative: Reduce Repository Size:**
   - Remove large unused files from repository
   - Use `git filter-branch` or BFG Repo-Cleaner
   - ⚠️ This is more complex and requires care

---

**Priority:** 🔴 **CRITICAL** - This is blocking all deployments and pipeline execution.

**Expected Outcome:** After cleanup, storage drops to ~3 GiB, pipelines will succeed, and deployments will work again.

