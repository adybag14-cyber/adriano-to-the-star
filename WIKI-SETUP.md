# 📚 GitLab Wiki Setup Guide

## Quick Setup

GitLab wikis are enabled by default. To set up your wiki:

### Option 1: Via GitLab Web Interface (Easiest)

1. Go to your GitLab project
2. Click **Wiki** in the left sidebar
3. Click **Create your first page**
4. Start adding content!

### Option 2: Via Git (For Bulk Content)

1. **Clone the wiki repository:**
   ```bash
   git clone https://gitlab.com/adybag14-group/starisdons.wiki.git
   cd starisdons.wiki
   ```

2. **Copy wiki files from this repo:**
   ```bash
   # Copy the wiki-ready files
   cp ../adriano-to-the-star-clean/wiki/*.md .
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add wiki documentation"
   git push origin master
   ```

## Wiki Content Files

I've created wiki-ready markdown files in the `wiki/` directory that you can copy to your GitLab wiki:

- `Home.md` - Main wiki homepage
- `Getting-Started.md` - Quick start guide
- `Features.md` - Feature documentation
- `API-Reference.md` - API documentation
- `Deployment.md` - Deployment guide
- `Contributing.md` - Contribution guidelines

## Automatic Setup Script

Run the setup script to automatically clone and populate your wiki:

```bash
python setup-wiki.py
```

This script will:
1. Clone your wiki repository
2. Copy all wiki files
3. Commit and push them

## Manual Setup

If you prefer to set it up manually:

1. **Enable Wiki** (usually enabled by default):
   - Go to **Settings → General → Visibility, project features, permissions**
   - Ensure "Wiki" is enabled

2. **Create pages via web interface:**
   - Navigate to **Wiki** in your project
   - Click **New Page**
   - Copy content from the `wiki/` directory files

3. **Or use Git:**
   ```bash
   git clone https://gitlab.com/adybag14-group/starisdons.wiki.git
   # Copy files from wiki/ directory
   git add .
   git commit -m "Initial wiki setup"
   git push origin master
   ```

## Wiki Structure

```
Home.md                    # Main landing page
├── Getting-Started.md     # Quick start guide
├── Features/              # Feature documentation
│   ├── Exoplanet-Database.md
│   ├── Stellar-AI.md
│   ├── File-Storage.md
│   └── Broadband-Checker.md
├── Development/           # Development guides
│   ├── Setup.md
│   ├── Deployment.md
│   └── Contributing.md
└── API-Reference.md       # API documentation
```

## Tips

- Use markdown for formatting
- Add images to the wiki repository or link to them
- Use internal links: `[Page Name](Page-Name)`
- Organize with folders: `Folder/Page-Name.md`

