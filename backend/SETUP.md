# 🚀 Backend Setup Guide

Follow these steps to set up and run the music server:

## ✅ Prerequisites

- Node.js 14+ installed ([Download](https://nodejs.org/))
- Google Drive files must be set to "Anyone with the link can view"

## 📦 Step 1: Install Dependencies

```bash
cd backend
npm install
```

This installs:

- `express` - Web server framework
- `cors` - Enable cross-origin requests
- `axios` - HTTP client for downloads
- `dotenv` - Environment variable management

## ⬇️ Step 2: Download Music Files

```bash
npm run download-music
```

This script will:

1. Create a `music/` folder
2. Download all 3 MP3 files from Google Drive
3. Show progress for each download
4. Verify file sizes

**Expected Output:**

```
🎵 ═══════════════════════════════════════════
   Adriano To The Star - Music Downloader
🎵 ═══════════════════════════════════════════

📥 Downloading Track 1: Cosmic Journey...
   Progress: 100%
✅ Track 1: Cosmic Journey downloaded successfully!
   File size: 5.23 MB

...
```

## ▶️ Step 3: Start the Server

```bash
npm start
```

**Expected Output:**

```
🚀 ═══════════════════════════════════════════
🎵 Music Server running on http://localhost:3000
🚀 ═══════════════════════════════════════════

📡 Endpoints:
   • API Docs:  http://localhost:3000/
   • Health:    http://localhost:3000/health
   • Tracks:    http://localhost:3000/api/tracks
   • Stream:    http://localhost:3000/api/stream/:id
```

## 🧪 Step 4: Test the Server

### Test 1: Health Check

Open in browser: `http://localhost:3000/health`

Expected response:

```json
{
    "status": "healthy",
    "tracksAvailable": 3,
    "tracks": [{ "id": 1, "name": "Track 1: Cosmic Journey", "downloaded": true }]
}
```

### Test 2: Stream Audio

Open in browser: `http://localhost:3000/api/stream/1`

Should start playing/downloading the first track.

### Test 3: Get Track List

Open in browser: `http://localhost:3000/api/tracks`

## 🎵 Step 5: Update Frontend

The frontend (`cosmic-music-player.js`) is already configured to use:

- `http://localhost:3000` when testing locally
- Your production URL when deployed

## 🐛 Troubleshooting

### Downloads fail

1. Check internet connection
2. Verify Google Drive file IDs in `.env`
3. Ensure files are set to "Anyone with the link can view"
4. Try manual download from Google Drive

### Server won't start

```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000    # Windows
lsof -i :3000                   # Mac/Linux

# Kill the process or change PORT in .env
```

### CORS errors in browser

- Server already has CORS enabled for all origins
- If still having issues, check browser console for details

## 🚢 Production Deployment

### Option 1: Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create adriano-music-server

# Deploy
git push heroku main

# Set environment variables
heroku config:set PORT=3000
```

### Option 2: Railway

1. Visit [railway.app](https://railway.app/)
2. Connect your Git repository
3. Deploy automatically
4. Update production URL in `cosmic-music-player.js`

### Option 3: Your Own Server

```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone your-repo
cd backend

# Install dependencies
npm install

# Download music
npm run download-music

# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start server.js --name adriano-music

# Make it start on reboot
pm2 startup
pm2 save
```

## 📝 Notes

- Music files are NOT committed to Git (in `.gitignore`)
- Downloads are cached - won't re-download existing files
- Server supports range requests for audio seeking
- All endpoints are CORS-enabled

## 🆘 Need Help?

Check the main README.md or open an issue on GitLab!
