# Add New Music Track - Instructions

## Quick Method (Recommended)

Since ffmpeg isn't installed, here's the fastest way:

### Option 1: Online Converter (Easiest)
1. Go to: https://cloudconvert.com/mp4-to-mp3 (or any MP4 to MP3 converter)
2. Upload: `C:\Users\adyba\Downloads\Was Ist Dein Lieblingsfach_.mp4`
3. Convert to MP3
4. Download the MP3 file
5. Save it as: `audio/was-ist-dein-lieblingsfach.mp3`

### Option 2: Install FFmpeg (For Future Use)
1. Download: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
2. Extract to: `C:\ffmpeg`
3. Add to PATH: `C:\ffmpeg\bin`
4. Then run: `python convert_mp4_to_mp3_simple.py`

### Option 3: Use VLC Media Player
1. Open VLC
2. Media → Convert/Save
3. Add the MP4 file
4. Convert/Save
5. Profile: Audio - MP3
6. Save to: `audio/was-ist-dein-lieblingsfach.mp3`

---

## After Converting

Once you have `audio/was-ist-dein-lieblingsfach.mp3`:

1. **Update manifest.json** (I'll do this)
2. **Update cosmic-music-player.js** (I'll do this)
3. **Commit and push to GitLab** (I'll do this)

Just let me know when the MP3 file is in the `audio/` folder!

