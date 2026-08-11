# How to Fork/Clone Repository to Another GitLab Account

This guide explains multiple methods to copy your repository to another GitLab account.

## Current Repository Info
- **Repository URL**: `git@gitlab.com:imtherushwar/newstarpage2.git`
- **SSH Key**: `C:/Users/adyba/.ssh/id_ed25519`

---

## Method 1: Fork via GitLab UI (Easiest)

### Steps:
1. **Log into the target GitLab account** (the account you want to fork TO)
2. **Navigate to your repository**: https://gitlab.com/imtherushwar/newstarpage2
3. **Click the "Fork" button** (top right)
4. **Select the target account/namespace** where you want to fork it
5. **Click "Fork project"**

**Note**: This method requires the target account to have access to the source repository (either it's public, or you've shared it with them).

---

## Method 2: Clone and Push to New Repository (Manual)

### Step 1: Create a new repository on the target GitLab account
1. Log into the target GitLab account
2. Click "New project" → "Create blank project"
3. Name it (e.g., `newstarpage2`)
4. **DO NOT** initialize with a README
5. Note the repository URL (e.g., `git@gitlab.com:newaccount/newstarpage2.git`)

### Step 2: Clone your current repository
```bash
# Navigate to a temporary directory
cd C:\Users\adyba

# Clone the repository (using bare clone to preserve all branches/tags)
git clone --bare git@gitlab.com:imtherushwar/newstarpage2.git newstarpage2.git
```

### Step 3: Push to the new repository
```bash
cd newstarpage2.git

# Set up the new remote (replace with your new repository URL)
git remote set-url origin git@gitlab.com:newaccount/newstarpage2.git

# Or add it as a new remote
# git remote add new-origin git@gitlab.com:newaccount/newstarpage2.git

# Push all branches and tags
git push --mirror origin
# Or if you used new-origin:
# git push --mirror new-origin

# Clean up
cd ..
rm -rf newstarpage2.git
```

---

## Method 3: Clone and Push (Non-Bare, Simpler)

### Step 1: Clone your repository locally
```bash
cd C:\Users\adyba
git clone git@gitlab.com:imtherushwar/newstarpage2.git newstarpage2-copy
cd newstarpage2-copy
```

### Step 2: Create new repository on target account
- Same as Method 2, Step 1

### Step 3: Change remote and push
```bash
# Remove old remote
git remote remove origin

# Add new remote (replace with your new repository URL)
git remote add origin git@gitlab.com:newaccount/newstarpage2.git

# Push all branches
git push -u origin main

# Push all other branches (if any)
git push origin --all

# Push all tags
git push origin --tags
```

---

## Method 4: Using GitLab Import/Export (Preserves Issues, MRs, etc.)

### Step 1: Export from current repository
1. Go to: https://gitlab.com/imtherushwar/newstarpage2/-/settings/general
2. Scroll to "Advanced" → "Export project"
3. Click "Export project"
4. Wait for the export to complete (download the `.tar.gz` file)

### Step 2: Import to new account
1. Log into the target GitLab account
2. Go to: https://gitlab.com/-/project/new
3. Click "Import project" → "GitLab export"
4. Upload the downloaded `.tar.gz` file
5. Configure the import settings
6. Click "Import project"

**Note**: This method preserves issues, merge requests, wiki, and other project metadata.

---

## Method 5: Quick Script (Automated)

Create a script to automate the process:

```bash
#!/bin/bash
# Save as: fork-repo.sh

SOURCE_REPO="git@gitlab.com:imtherushwar/newstarpage2.git"
TARGET_REPO="git@gitlab.com:newaccount/newstarpage2.git"  # CHANGE THIS
TEMP_DIR="temp-repo-$(date +%s)"

echo "Cloning source repository..."
git clone --bare "$SOURCE_REPO" "$TEMP_DIR"

cd "$TEMP_DIR"

echo "Changing remote to target repository..."
git remote set-url origin "$TARGET_REPO"

echo "Pushing to target repository..."
git push --mirror origin

cd ..
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo "✅ Repository forked successfully!"
```

**Usage**:
1. Edit `TARGET_REPO` with your new repository URL
2. Run: `bash fork-repo.sh`

---

## Authentication Setup

If the target account uses a different SSH key:

### Option A: Use SSH Config
Edit `C:\Users\adyba\.ssh\config`:
```
Host gitlab-newaccount
    HostName gitlab.com
    User git
    IdentityFile C:/Users/adyba/.ssh/id_ed25519_newaccount
```

Then use: `git@gitlab-newaccount:newaccount/newstarpage2.git`

### Option B: Use HTTPS with Personal Access Token
1. Create a Personal Access Token on the target GitLab account:
   - Go to: Settings → Access Tokens
   - Create token with `write_repository` scope
2. Use HTTPS URL:
   ```bash
   git remote set-url origin https://oauth2:YOUR_TOKEN@gitlab.com/newaccount/newstarpage2.git
   ```

---

## Important Notes

1. **Large Files**: If you're using Git LFS, you may need to:
   ```bash
   git lfs fetch --all
   git lfs push --all origin
   ```

2. **All Branches**: Use `--mirror` or `--all` to ensure all branches are copied

3. **All Tags**: Use `--tags` to copy all tags

4. **History**: All methods preserve full git history

5. **Permissions**: Make sure the target account has permission to create repositories

---

## Recommended Method

- **For simple copy**: Use Method 3 (Clone and Push - Non-Bare)
- **For preserving metadata**: Use Method 4 (GitLab Import/Export)
- **For automation**: Use Method 5 (Script)

---

## Troubleshooting

### SSH Key Issues
```bash
# Test SSH connection
ssh -T git@gitlab.com

# Use specific key
ssh -i C:/Users/adyba/.ssh/id_ed25519 -T git@gitlab.com
```

### Large Repository Issues
If the repository is very large:
```bash
# Shallow clone (less history)
git clone --depth 1 git@gitlab.com:imtherushwar/newstarpage2.git

# Or use Git LFS
git lfs install
```

### Permission Denied
- Ensure SSH key is added to target GitLab account
- Check repository visibility settings
- Verify you have write access to the target namespace

