# Quick Setup: New GitLab Project for Media Files

## Step 1: Create New Project on GitLab

1. Go to https://gitlab.com
2. Click **"New project"** or the **"+"** button
3. Choose **"Create blank project"**
4. Fill in:
   - **Project name:** `new-starsiadr-media` (or your preferred name)
   - **Visibility:** Public (needed for GitLab Pages)
   - **Initialize repository with a README:** ❌ Uncheck
5. Click **"Create project"**

## Step 2: Run Setup Script

```powershell
# Run the setup script (update project name if different)
.\setup-media-project.ps1 -NewProjectName "new-starsiadr-media"
```

This will:
- Create local directory for new project
- Copy all large files (games, videos, Total War 2)
- Set up GitLab Pages structure
- Create necessary files

## Step 3: Push to New Project

```powershell
cd c:\Users\adyba\new-starsiadr-media
git add .
git commit -m "Initial commit: Media files for Adriano To The Star"
git push -u origin main
```

## Step 4: Wait for GitLab Pages Deployment

1. Go to your new project on GitLab
2. Navigate to **Settings > Pages**
3. Wait for deployment (usually 1-2 minutes)
4. Note the Pages URL (e.g., `https://new-starsiadr-media.gitlab.io`)

## Step 5: Update Original Project

1. Open `media-config.js` in the original project
2. Update the URL:
   ```javascript
   url: 'https://new-starsiadr-media.gitlab.io', // Your actual URL
   ```
3. Commit and push:
   ```powershell
   cd c:\Users\adyba\adriano-to-the-star
   git add media-config.js games.html gta-6-videos.html total-war-2.html games.js gta-6-videos.js total-war-2.js
   git commit -m "Configure media files to load from external project"
   git push origin main
   ```

## Step 6: Remove Large Files from Original Project

The large files are already removed from Git (we did this earlier). Just commit:

```powershell
cd c:\Users\adyba\adriano-to-the-star
git add .gitignore
git commit -m "Remove large media files from Git (now hosted in separate project)"
git push origin main
```

## Result

- ✅ Original project: Small, fast (only HTML/CSS/JS)
- ✅ New project: Large media files (games, videos, Total War 2)
- ✅ Total storage: 20 GiB (10 GiB + 10 GiB)
- ✅ Both projects use free GitLab Pages hosting
- ✅ Pages automatically load files from external project

## Testing

1. Visit your original site
2. Try loading a game or video
3. Check browser console for any errors
4. Files should load from the new project's GitLab Pages URL

## Troubleshooting

**Files not loading?**
- Check that GitLab Pages is deployed for the new project
- Verify the URL in `media-config.js` matches your new project's Pages URL
- Check browser console for CORS errors (shouldn't happen with GitLab Pages)

**Still getting storage errors?**
- Make sure you committed the removal of large files
- Check GitLab project settings > Usage Quotas > Storage

