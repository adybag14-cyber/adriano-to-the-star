from huggingface_hub import snapshot_download, constants
import os

# Enable HF Transfer (if installed) for max speed
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"

repo_id = "unsloth/MiniMax-M2.1-GGUF"
allow_patterns = ["Q8_0/*"]
local_dir = "models/MiniMax-M2.1-Q8"

print(f"Starting download of {repo_id} (Q8_0 quantization)...")
print(f"Target directory: {os.path.abspath(local_dir)}")
print("Using 32 threads for download. This includes multiple large files (~250GB total).")

try:
    try:
        import hf_transfer
        print("Fast transfer (hf_transfer) enabled!")
    except ImportError:
        print("Note: Install 'hf_transfer' (pip install hf_transfer) for even faster speeds.")

    snapshot_download(
        repo_id=repo_id,
        repo_type="model",
        local_dir=local_dir,
        allow_patterns=allow_patterns,
        local_dir_use_symlinks=False,
        resume_download=True,
        max_workers=32  # explicit threading request
    )
    print("\nDownload completed successfully!")
    print(f"Model files located in: {local_dir}/Q8_0/")
except Exception as e:
    print(f"\nAn error occurred: {e}")
    input("Press Enter to exit...")
