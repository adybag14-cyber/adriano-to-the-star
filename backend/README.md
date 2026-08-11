# 🎵 Adriano To The Star - Music Server

Backend server to download and serve music files for the Cosmic Music Player.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Google Drive file IDs
```

### 3. Download Music Files

```bash
npm run download-music
```

This will download all MP3 files from Google Drive to the `music/` folder.

### 4. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## 📡 API Endpoints

### GET `/`

API documentation and available endpoints

### GET `/health`

Server health check and track availability status

### GET `/api/tracks`

Get list of all tracks with metadata

```json
{
    "tracks": [
        {
            "id": 1,
            "name": "Track 1: Cosmic Journey",
            "url": "http://localhost:3000/api/stream/1",
            "downloaded": true
        }
    ]
}
```

### GET `/api/stream/:id`

Stream an audio file (supports range requests for seeking)

- Example: `http://localhost:3000/api/stream/1`

### GET `/api/download/:id`

Force download of an audio file

- Example: `http://localhost:3000/api/download/1`

## 🔧 Configuration

### Environment Variables (.env)

```env
PORT=3000
TRACK_1_ID=1UACr_XojAlKpHMuF3FKG8xHHTq18vScO
TRACK_2_ID=1kdxaOGEH1sLHWR_jN_JZnyg8mcbGmKrL
TRACK_3_ID=11VhqPDaANKWgWHIWAl-w5noiyvR9g9Kh
```

## 🎯 Frontend Integration

Update `cosmic-music-player.js` to use the backend:

```javascript
this.tracks = [
    {
        name: 'Track 1: Cosmic Journey',
        url: 'http://localhost:3000/api/stream/1',
    },
    {
        name: 'Track 2: Stellar Voyage',
        url: 'http://localhost:3000/api/stream/2',
    },
    {
        name: 'Track 3: Galactic Odyssey',
        url: 'http://localhost:3000/api/stream/3',
    },
];
```

## 📁 Project Structure

```
backend/
├── server.js              # Express server
├── download-music.js      # Google Drive downloader script
├── package.json           # Dependencies
├── .env                   # Environment variables (create from .env.example)
├── .env.example          # Example environment variables
├── music/                # Downloaded MP3 files (auto-created)
│   ├── track1.mp3
│   ├── track2.mp3
│   └── track3.mp3
└── README.md             # This file
```

## 🛠️ Troubleshooting

### Music files won't download

1. Ensure Google Drive files are set to "Anyone with the link can view"
2. Check the file IDs in `.env` are correct
3. Try manually downloading:
    - Visit: `https://drive.google.com/file/d/FILE_ID/view`
    - Click Download
    - Save to `backend/music/` folder

### CORS errors

The server has CORS enabled for all origins. In production, update the CORS settings in `server.js`.

### Audio won't stream

1. Check server is running: `http://localhost:3000/health`
2. Verify files exist in `music/` folder
3. Try accessing directly: `http://localhost:3000/api/stream/1`

## 🚢 Deployment

### Option 1: Heroku

```bash
heroku create adriano-music-server
git push heroku main
```

### Option 2: DigitalOcean / VPS

```bash
# Install Node.js on server
# Clone repository
# Install dependencies: npm install
# Download music: npm run download-music
# Start with PM2: pm2 start server.js
```

### Option 3: GitLab Pages + Backend

- Host frontend on GitLab Pages
- Deploy backend to Heroku/Railway/Render
- Update frontend URLs to point to deployed backend

## 📄 License

MIT
