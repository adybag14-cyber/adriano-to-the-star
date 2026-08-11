import ollama
import pyautogui
import subprocess
import os
import sys
import io
import time
import json
import pyperclip
import warnings
from PIL import Image
from duckduckgo_search import DDGS

# Configuration
CHAT_MODEL = "nemotron-3-nano:30b"
VISION_MODEL = "llama3.2-vision"
MEMORY_FILE = "agent_memory.json"
AUTO_RUN_COMMANDS = True

# Suppress warnings from libraries (like duckduckgo_search)
warnings.filterwarnings("ignore")

def load_memory():
    """Loads conversation history from a JSON file."""
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"[Memory] Error loading memory: {e}")
    return []

def save_memory(history):
    """Saves conversation history to a JSON file."""
    try:
        # Keep only the last 50 messages to avoid blowing up context/file size too fast
        # But ensure system prompt matches current session
        to_save = history[-50:] if len(history) > 50 else history
        with open(MEMORY_FILE, 'w') as f:
            json.dump(to_save, f, indent=2)
    except Exception as e:
        print(f"[Memory] Error saving memory: {e}")

def get_screenshot_description():
    """Captures a screenshot and uses the vision model to describe it."""
    print("\n[Eyes] Capturing screen...")
    screenshot = pyautogui.screenshot()
    img_byte_arr = io.BytesIO()
    screenshot.save(img_byte_arr, format='PNG')
    img_blob = img_byte_arr.getvalue()

    print("[Eyes] Analyzing with Vision Model...")
    try:
        response = ollama.chat(
            model=VISION_MODEL,
            messages=[{
                'role': 'user',
                'content': 'Explain this image in detail. Focus on text, code, errors, and UI elements.',
                'images': [img_blob]
            }]
        )
        return response['message']['content']
    except Exception as e:
        return f"Error analyzing screen: {e}"

def run_system_command(command):
    """Executes a shell command."""
    print(f"\n[Hands] Running command: {command}")
    try:
        if command.lower().strip().startswith("powershell"):
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        else:
            result = subprocess.run(["powershell", "-Command", command], capture_output=True, text=True, timeout=30)
            
        output = result.stdout + result.stderr
        if not output: output = "(Command executed with no output)"
        print(f"[Hands] Output:\n{output.strip()}\n")
        return output
    except subprocess.TimeoutExpired:
        return "Error: Command timed out."
    except Exception as e:
        return f"Error executing command: {str(e)}"

def search_web(query):
    """Searches the web using DuckDuckGo."""
    print(f"\n[Internet] Searching for: {query}")
    try:
        results = DDGS().text(query, max_results=3)
        if not results: return "No results found."
        summary = "\n".join([f"- {r['title']}: {r['body']} ({r['href']})" for r in results])
        return summary
    except Exception as e:
        return f"Error searching web: {e}"

def read_file(path):
    """Reads content of a file."""
    print(f"\n[Files] Reading: {path}")
    try:
        if not os.path.exists(path): return "Error: File does not exist."
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {e}"

def write_file(args):
    """Writes content to a file. Format: path | content"""
    try:
        if "|" not in args: return "Error: Usage [[WRITE_FILE: path | content]]"
        path, content = args.split("|", 1)
        path = path.strip()
        content = content.strip()
        
        print(f"\n[Files] Writing to: {path}")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Successfully wrote to {path}"
    except Exception as e:
        return f"Error writing file: {e}"

def list_files(path):
    """Lists files in a directory."""
    print(f"\n[Files] Listing: {path}")
    try:
        path = path.strip()
        if not path or path == ".": path = os.getcwd()
        if not os.path.exists(path): return "Error: Path does not exist."
        
        items = os.listdir(path)
        # Sort: Directories first, then files
        items.sort(key=lambda x: (not os.path.isdir(os.path.join(path, x)), x.lower()))
        
        output = f"Contents of {path}:\n"
        for item in items:
            prefix = "[DIR] " if os.path.isdir(os.path.join(path, item)) else "[FILE]"
            output += f"{prefix} {item}\n"
        return output
    except Exception as e:
        return f"Error listing files: {e}"

def get_clipboard_content():
    """Reads the clipboard."""
    print("\n[Clipboard] Reading clipboard...")
    try:
        return pyperclip.paste()
    except Exception as e:
        return f"Error reading clipboard: {e}"

def main():
    print(f"=== Nemotron Agent (Pro v1.1) Initialized ===")
    print(f"Chat Model: {CHAT_MODEL} | Vision: {VISION_MODEL}")
    print("Features: Memory, Internet, Files (RW+List), Clipboard, Vision, Cmds")
    print("=============================================\n")

    # Load memory or start fresh
    loaded_history = load_memory()
    
    # System prompt definition
    system_prompt = {
        'role': 'system', 
        'content': (
            f"You are an advanced local agent on Windows using {CHAT_MODEL}. "
            f"You have persistent memory of past conversations. "
            f"TOOLS AVAILABLE (Output exactly as shown to use): "
            f"1. [[LOOK_AT_SCREEN]] - See the user's screen. "
            f"2. [[RUN: <command>]] - Run PowerShell commands. "
            f"3. [[SEARCH: <query>]] - Search the internet. "
            f"4. [[LIST_FILES: <path>]] - List files in a folder. Use '.' for current dir. "
            f"5. [[READ_FILE: <path>]] - Read a file. "
            f"6. [[WRITE_FILE: <path> | <content>]] - Write/Create a file. Use absolute paths if possible. "
            f"7. [[CLIPBOARD]] - Read user's clipboard text. "
            f"The user has enabled 'Auto-Run Mode'. "
            f"Do not respond with fake tool outputs. Wait for 'SYSTEM OUTPUT'. "
        )
    }

    # If memory exists, prepend system prompt if not present, otherwise use fresh start
    if loaded_history:
        # Ensure the system prompt is up to date with new tools
        if loaded_history[0]['role'] == 'system':
            loaded_history[0] = system_prompt
        else:
            loaded_history.insert(0, system_prompt)
        history = loaded_history
        print("[Memory] Conversation history loaded.")
    else:
        history = [system_prompt]

    while True:
        try:
            user_input = input("\n>>> ")
            if user_input.lower() in ['exit', 'quit']:
                save_memory(history)
                break

            history.append({'role': 'user', 'content': user_input})

            # Inner loop to handle tool chains
            while True:
                response = ollama.chat(model=CHAT_MODEL, messages=history)
                # Ensure the message is stored as a simple dictionary
                message_data = response['message']
                if not isinstance(message_data, dict):
                    # Attempt to convert to dict if it's an object (pydantic/custom)
                    try:
                        message_data = message_data.model_dump()
                    except AttributeError:
                        message_data = dict(message_data)
                
                msg_content = message_data.get('content', '')
                print(f"\nNemotron: {msg_content}")
                
                history.append(message_data)
                save_memory(history) # Auto-save each turn

                tool_output = None
                
                # Check for tool calls
                if "[[LOOK_AT_SCREEN]]" in msg_content:
                    tool_output = f"SCREEN ANALYSIS: {get_screenshot_description()}"
                
                elif "[[CLIPBOARD]]" in msg_content:
                    tool_output = f"CLIPBOARD CONTENT: {get_clipboard_content()}"
                
                elif "[[SEARCH:" in msg_content:
                    start = msg_content.find("[[SEARCH:") + 9
                    end = msg_content.rfind("]]") # Use rfind to be safer
                    if start != -1 and end != -1:
                        query = msg_content[start:end].strip()
                        tool_output = f"SEARCH RESULTS: {search_web(query)}"

                elif "[[LIST_FILES:" in msg_content:
                    start = msg_content.find("[[LIST_FILES:") + 13
                    end = msg_content.rfind("]]")
                    if start != -1 and end != -1:
                        path = msg_content[start:end].strip()
                        tool_output = f"FILE LIST: {list_files(path)}"

                elif "[[READ_FILE:" in msg_content:
                    start = msg_content.find("[[READ_FILE:") + 12
                    end = msg_content.rfind("]]")
                    if start != -1 and end != -1:
                        path = msg_content[start:end].strip()
                        tool_output = f"FILE CONTENT: {read_file(path)}"

                elif "[[WRITE_FILE:" in msg_content:
                    start = msg_content.find("[[WRITE_FILE:") + 13
                    end = msg_content.rfind("]]")
                    if start != -1 and end != -1:
                        args = msg_content[start:end].strip()
                        tool_output = f"WRITE STATUS: {write_file(args)}"

                elif "[[RUN:" in msg_content:
                    start = msg_content.find("[[RUN:") + 6
                    end = msg_content.rfind("]]")
                    if start != -1 and end != -1:
                        cmd = msg_content[start:end].strip()
                        if AUTO_RUN_COMMANDS:
                            tool_output = f"SYSTEM OUTPUT: {run_system_command(cmd)}"

                # If a tool was used, feed output back to model
                if tool_output:
                    # In true function calling we uses 'tool' role, but for text-based dispatch:
                    history.append({'role': 'user', 'content': f"SYSTEM: {tool_output}"})
                    continue # Loop back to let model respond to the tool output
                
                # If no tool found, break to wait for user input
                break

        except KeyboardInterrupt:
            save_memory(history)
            print("\nExiting...")
            break
        except Exception as e:
            print(f"\nError: {e}")

if __name__ == "__main__":
    main()
