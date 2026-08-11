# 📚 Enable GitLab Wiki - Complete Guide

This guide will help you enable and populate your GitLab wiki using the existing wiki files in the `wiki/` directory.

## 📋 Prerequisites

- Git installed on your computer
- Access to your GitLab project: `https://gitlab.com/adybag14-group/starisdons`
- GitLab credentials (Personal Access Token or SSH key)

## 🎯 Quick Start (Automated Method)

### Option 1: Use the Setup Script (Recommended)

1. **Run the automated setup script:**
   ```powershell
   python setup-wiki.py
   ```

2. **The script will:**
   - Clone your wiki repository (`starisdons.wiki`)
   - Copy all markdown files from `wiki/` directory
   - Commit and push to GitLab
   - Your wiki will be live immediately!

3. **Access your wiki:**
   - Go to: `https://gitlab.com/adybag14-group/starisdons/-/wikis/home`
   - Or click **Wiki** in your project's left sidebar

---

## 🔧 Manual Setup (Step-by-Step)

If you prefer to set it up manually or the script doesn't work:

### Step 1: Enable Wiki in GitLab (If Not Already Enabled)

1. Go to your GitLab project: `https://gitlab.com/adybag14-group/starisdons`
2. Navigate to **Settings → General → Visibility, project features, permissions**
3. Scroll down to **Wiki** section
4. Ensure **Wiki** is enabled (should be enabled by default)
5. Click **Save changes**

### Step 2: Clone the Wiki Repository

GitLab automatically creates a separate repository for wikis. Clone it:

```powershell
# Navigate to your project directory
cd C:\Users\adyba\Documents\adrianostar-website

# Clone the wiki repository
git clone https://gitlab.com/adybag14-group/starisdons.wiki.git

# Enter the wiki directory
cd starisdons.wiki
```

**Note:** If the clone fails with "repository not found", the wiki hasn't been initialized yet. In that case:
1. Go to your project in GitLab
2. Click **Wiki** in the left sidebar
3. Click **Create your first page** (you can delete it later)
4. This initializes the wiki repository
5. Then retry the clone command above

### Step 3: Copy Wiki Files

Copy all markdown files from your `wiki/` directory to the cloned wiki repository:

```powershell
# From the project root directory
Copy-Item wiki\*.md starisdons.wiki\
```

Or manually copy these files:
- `wiki/Home.md` → `starisdons.wiki/Home.md`
- `wiki/Getting-Started.md` → `starisdons.wiki/Getting-Started.md`
- `wiki/Features.md` → `starisdons.wiki/Features.md`
- `wiki/Deployment.md` → `starisdons.wiki/Deployment.md`

### Step 4: Commit and Push

```powershell
# Make sure you're in the wiki directory
cd starisdons.wiki

# Add all files
git add .

# Commit the changes
git commit -m "Add wiki documentation from local wiki files"

# Push to GitLab
git push origin master
```

**Note:** GitLab wikis use the `master` branch (not `main`).

### Step 5: Verify Wiki is Live

1. Go to: `https://gitlab.com/adybag14-group/starisdons/-/wikis/home`
2. You should see your `Home.md` content
3. Check the sidebar for all your pages

---

## 📁 Wiki Files Structure

Your wiki files are located in the `wiki/` directory:

```
wiki/
├── Home.md              # Main wiki landing page
├── Getting-Started.md   # Quick start guide
├── Features.md          # Feature documentation
└── Deployment.md        # Deployment guide
```

### Wiki Page Hierarchy

GitLab wikis support folders. You can organize pages like this:

```
Home.md
├── Getting-Started.md
├── Features/
│   ├── Exoplanet-Database.md
│   ├── Stellar-AI.md
│   └── Broadband-Checker.md
└── Development/
    ├── Deployment.md
    └── Contributing.md
```

To create a folder structure, name files with slashes:
- `Features/Exoplanet-Database.md`
- `Development/Deployment.md`

---

## 🔄 Updating the Wiki

### Method 1: Via Git (Recommended)

```powershell
# Navigate to wiki directory
cd starisdons.wiki

# Pull latest changes (if working with others)
git pull origin master

# Edit files directly or copy from wiki/ directory
# Then commit and push
git add .
git commit -m "Update wiki documentation"
git push origin master
```

### Method 2: Via GitLab Web Interface

1. Go to your wiki: `https://gitlab.com/adybag14-group/starisdons/-/wikis/home`
2. Click **Edit** on any page
3. Make your changes
4. Click **Save changes**

**Note:** Web interface edits are automatically committed to the wiki repository.

---

## 🎨 Wiki Formatting Tips

### Markdown Syntax

GitLab wikis support standard Markdown:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*

- Bullet point
- Another point

1. Numbered list
2. Second item

[Link text](https://example.com)
![Image alt](image-url.png)
```

### Internal Links

Link to other wiki pages:

```markdown
[Getting Started](Getting-Started)
[Features Documentation](Features)
[Deployment Guide](Deployment)
```

### Code Blocks

```markdown
```javascript
const example = "code";
```
```

### Tables

```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

---

## 🔍 Troubleshooting

### Wiki Repository Not Found

**Error:** `fatal: repository 'starisdons.wiki.git' not found`

**Solution:**
1. Go to your GitLab project
2. Click **Wiki** in the left sidebar
3. Click **Create your first page**
4. This initializes the wiki repository
5. Retry the clone command

### Authentication Failed

**Error:** `fatal: Authentication failed`

**Solution:**
1. Use a Personal Access Token:
   - Go to GitLab → **Settings → Access Tokens**
   - Create a token with `write_repository` scope
   - Use it as password when pushing: `git push origin master`

2. Or configure SSH:
   - Generate SSH key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
   - Add to GitLab: **Settings → SSH Keys**
   - Use SSH URL: `git clone git@gitlab.com:adybag14-group/starisdons.wiki.git`

### Push to Wrong Branch

**Error:** `error: failed to push some refs`

**Solution:**
- GitLab wikis use `master` branch, not `main`
- Always push to: `git push origin master`

### Wiki Not Showing Up

**Solution:**
1. Check wiki is enabled: **Settings → General → Wiki**
2. Wait 1-2 minutes after push (GitLab needs to process)
3. Clear browser cache (Ctrl+F5)
4. Check wiki URL: `https://gitlab.com/adybag14-group/starisdons/-/wikis/home`

### Files Not Appearing

**Solution:**
1. Ensure files are `.md` (markdown) format
2. Check file names don't have special characters
3. Verify files are committed: `git status`
4. Check GitLab wiki repository: `https://gitlab.com/adybag14-group/starisdons.wiki`

---

## 📝 Quick Reference

### Clone Wiki Repository
```powershell
git clone https://gitlab.com/adybag14-group/starisdons.wiki.git
```

### Update Wiki from Local Files
```powershell
cd starisdons.wiki
Copy-Item ..\wiki\*.md .
git add .
git commit -m "Update wiki"
git push origin master
```

### Create New Wiki Page
```powershell
# Create new file
New-Item -Path "New-Page.md" -ItemType File

# Add content, then commit
git add New-Page.md
git commit -m "Add new wiki page"
git push origin master
```

### Delete Wiki Page
```powershell
git rm "Old-Page.md"
git commit -m "Remove old wiki page"
git push origin master
```

---

## ✅ Verification Checklist

- [ ] Wiki is enabled in GitLab project settings
- [ ] Wiki repository cloned successfully
- [ ] All markdown files copied from `wiki/` directory
- [ ] Files committed and pushed to `master` branch
- [ ] Wiki accessible at: `https://gitlab.com/adybag14-group/starisdons/-/wikis/home`
- [ ] All pages visible in wiki sidebar
- [ ] Internal links working correctly

---

## 🚀 Next Steps

After enabling your wiki:

1. **Customize Home Page** - Edit `Home.md` to match your project
2. **Add More Pages** - Create additional documentation as needed
3. **Organize with Folders** - Use folder structure for better organization
4. **Add Images** - Upload images to wiki repository or link to external URLs
5. **Set Permissions** - Configure who can edit the wiki in project settings

---

## 📚 Additional Resources

- [GitLab Wiki Documentation](https://docs.gitlab.com/ee/user/project/wiki/)
- [Markdown Guide](https://docs.gitlab.com/ee/user/markdown.html)
- [GitLab Wiki Best Practices](https://docs.gitlab.com/ee/user/project/wiki/#wiki-best-practices)

---

**Last Updated:** November 2025

**Project:** Adriano To The Star  
**Wiki URL:** `https://gitlab.com/adybag14-group/starisdons/-/wikis/home`

