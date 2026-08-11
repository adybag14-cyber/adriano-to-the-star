# -*- coding: utf-8 -*-
"""
Simple MP4 to MP3 converter using pydub (lighter than moviepy)
Install: pip install pydub
Note: On Windows, also need: pip install simpleaudio or use ffmpeg
"""

import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def convert_with_pydub(input_file, output_file):
    """Convert using pydub (requires ffmpeg)"""
    try:
        from pydub import AudioSegment
        print("Loading video file...")
        audio = AudioSegment.from_file(input_file, format="mp4")
        print("Saving as MP3...")
        audio.export(output_file, format="mp3", bitrate="192k")
        print(f"Success! Saved to: {output_file}")
        return True
    except ImportError:
        print("pydub not installed. Trying alternative method...")
        return False
    except Exception as e:
        print(f"Error with pydub: {e}")
        return False

def convert_with_ffmpeg_direct(input_file, output_file):
    """Convert using ffmpeg directly via subprocess"""
    try:
        import subprocess
        print("Using ffmpeg directly...")
        cmd = [
            'ffmpeg',
            '-i', input_file,
            '-vn',  # No video
            '-acodec', 'libmp3lame',
            '-ab', '192k',
            '-ar', '44100',
            '-y',  # Overwrite output
            output_file
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"Success! Saved to: {output_file}")
            return True
        else:
            print(f"ffmpeg error: {result.stderr}")
            return False
    except FileNotFoundError:
        print("ffmpeg not found in PATH")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    input_file = r"C:\Users\adyba\Downloads\Was Ist Dein Lieblingsfach_.mp4"
    output_filename = "was-ist-dein-lieblingsfach.mp3"
    output_file = os.path.join("audio", output_filename)
    
    os.makedirs("audio", exist_ok=True)
    
    if not os.path.exists(input_file):
        print(f"File not found: {input_file}")
        sys.exit(1)
    
    print(f"Converting: {os.path.basename(input_file)}")
    print(f"Output: {output_file}")
    print()
    
    # Try ffmpeg first (fastest)
    if convert_with_ffmpeg_direct(input_file, output_file):
        sys.exit(0)
    
    # Try pydub
    if convert_with_pydub(input_file, output_file):
        sys.exit(0)
    
    print("\nNo conversion method available.")
    print("Options:")
    print("1. Install ffmpeg: https://ffmpeg.org/download.html")
    print("2. Install pydub: pip install pydub")
    print("3. Use online converter and save to audio/ folder")
    sys.exit(1)

