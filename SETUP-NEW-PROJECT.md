# Setup New GitLab Project for Large Files

## Strategy
- **Original Project:** HTML, CSS, JS, small assets (stays under 10GB)
- **New Project:** Large media files (games, videos, Total War 2) - gets new 10GB limit
- **Linking:** Pages reference files from new project via GitLab Pages URLs

## Steps

### 1. Create New GitLab Project
1. Go to https://gitlab.com
2. Click "New project" or "+" button
3. Create project with name: `new-starsiadr-media` or `adriano-media-files`
4. Make it public (for GitLab Pages access)
5. Don't initialize with README

### 2. Clone and Setup New Project Locally
```bash
# Clone the new empty project
git clone git@gitlab.com:imtherushwar/new-starsiadr-media.git
cd new-starsiadr-media

# Copy large files from original project
# (We'll do this in the script)
```

### 3. Update Original Project to Reference New Project
- Update JavaScript files to load from new project's GitLab Pages URL
- Keep only HTML, CSS, JS, and manifest files in original project

## Benefits
- ✅ Get another 10 GiB storage (20 GiB total)
- ✅ Keep main site fast and small
- ✅ Large files hosted separately
- ✅ Both projects use GitLab Pages (free hosting)

