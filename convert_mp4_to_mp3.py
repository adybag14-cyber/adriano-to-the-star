#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert MP4 video file to MP3 audio file
Requires: pip install moviepy
"""

import sys
import os
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def convert_mp4_to_mp3(input_file, output_file):
    """Convert MP4 to MP3 using moviepy"""
    try:
        from moviepy.editor import VideoFileClip
        
        print(f"📹 Loading video: {input_file}")
        video = VideoFileClip(input_file)
        
        print(f"🎵 Extracting audio...")
        audio = video.audio
        
        print(f"💾 Saving MP3: {output_file}")
        audio.write_audiofile(output_file, bitrate="192k", verbose=False, logger=None)
        
        # Clean up
        audio.close()
        video.close()
        
        print(f"✅ Conversion complete: {output_file}")
        return True
        
    except ImportError:
        print("❌ moviepy not installed. Installing...")
        os.system("pip install moviepy")
        print("🔄 Retrying conversion...")
        return convert_mp4_to_mp3(input_file, output_file)
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    input_file = r"C:\Users\adyba\Downloads\Was Ist Dein Lieblingsfach_.mp4"
    output_filename = "was-ist-dein-lieblingsfach.mp3"
    output_file = os.path.join("audio", output_filename)
    
    # Create audio directory if it doesn't exist
    os.makedirs("audio", exist_ok=True)
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    print(f"🎵 Converting: {input_file}")
    print(f"📁 Output: {output_file}")
    print()
    
    success = convert_mp4_to_mp3(input_file, output_file)
    
    if success:
        file_size = os.path.getsize(output_file) / (1024 * 1024)  # MB
        print(f"📊 File size: {file_size:.2f} MB")
        print(f"✅ Ready to add to music player!")
    else:
        print("❌ Conversion failed")
        sys.exit(1)

