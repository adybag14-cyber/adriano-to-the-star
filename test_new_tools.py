import os
import sys
import time
import pyperclip
from fara_computer_agent import read_file, write_file, list_files, get_active_windows, set_clipboard, get_clipboard

def test_tools():
    print("🧪 Testing new Fara tools...")
    
    # Test File Tools
    test_file = "test_fara_tool.txt"
    content = "Hello from Fara Tool Test!"
    
    print(f"\n📝 Testing write_file('{test_file}')...")
    # Mocking ALLOW_ALL_COMMANDS for test or handling input if needed
    # For this test script, we assume we can run it directly or the functions handle it.
    # Note: write_file asks for input if ALLOW_ALL_COMMANDS is False.
    # We will just print the result of the function call.
    # To avoid input prompt blocking, we might need to mock input or set the global var if possible.
    # Since we are importing functions, we can't easily change the global ALLOW_ALL_COMMANDS in the module 
    # without importing it.
    
    import fara_computer_agent
    fara_computer_agent.ALLOW_ALL_COMMANDS = True # Enable unsafe mode for testing
    
    result = write_file(test_file, content)
    print(f"Result: {result}")
    
    print(f"\n📄 Testing read_file('{test_file}')...")
    read_content = read_file(test_file)
    print(f"Content: {read_content}")
    if read_content == content:
        print("✅ File read/write verified.")
    else:
        print("❌ File content mismatch.")
        
    print(f"\n📂 Testing list_files('.')...")
    files = list_files(".")
    if test_file in files:
        print("✅ list_files verified (found test file).")
    else:
        print("❌ list_files failed to find test file.")
        
    # Test Clipboard
    print(f"\n📋 Testing clipboard...")
    clip_text = "Fara Clipboard Test"
    set_clipboard(clip_text)
    current_clip = get_clipboard()
    print(f"Clipboard content: {current_clip}")
    if current_clip == clip_text:
        print("✅ Clipboard verified.")
    else:
        print("❌ Clipboard mismatch.")
        
    # Test Windows
    print(f"\n🪟 Testing get_active_windows()...")
    windows = get_active_windows()
    print(f"Windows found: {len(windows.splitlines())}")
    if len(windows) > 0:
        print("✅ get_active_windows verified.")
    else:
        print("⚠️ No windows found (might be headless or error).")

    # Cleanup
    if os.path.exists(test_file):
        os.remove(test_file)
        print("\n🧹 Cleaned up test file.")

if __name__ == "__main__":
    test_tools()
