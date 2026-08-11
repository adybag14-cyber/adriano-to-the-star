import requests
import json
import re
import sys
import subprocess
import base64
import time
import io
import os
from urllib.parse import quote_plus
from html.parser import HTMLParser

# Try to import automation libs
try:
    import pyautogui
    from PIL import Image
    import pyperclip # For clipboard support
except ImportError:
    print("❌ Error: Missing dependencies. Please run: pip install pyautogui Pillow pyperclip")
    # We won't exit here to allow running without pyperclip if needed, but it's better to have it.
    # sys.exit(1) 

# Configuration
OLLAMA_API_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "fara"
SCREENSHOT_SIZE = (1024, 768) # Resize for model efficiency
ALLOW_ALL_COMMANDS = False
MEMORY_FILE = "memory.json"

# Safety: Fail-safe (move mouse to top-left corner to abort)
pyautogui.FAILSAFE = True

# Tool Definitions
TOOLS = [
    {
        "name": "get_screen_content",
        "description": "Capture the current screen content to see what is happening.",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "mouse_move",
        "description": "Move the mouse cursor to specific coordinates.",
        "parameters": {
            "type": "object",
            "properties": {
                "x": {"type": "integer", "description": "X coordinate"},
                "y": {"type": "integer", "description": "Y coordinate"}
            },
            "required": ["x", "y"]
        }
    },
    {
        "name": "mouse_click",
        "description": "Click the left mouse button. Optionally move to coordinates first.",
        "parameters": {
            "type": "object",
            "properties": {
                "x": {"type": "integer", "description": "X coordinate (optional)"},
                "y": {"type": "integer", "description": "Y coordinate (optional)"}
            },
            "required": []
        }
    },
    {
        "name": "type_text",
        "description": "Type text on the keyboard.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "The text to type"}
            },
            "required": ["text"]
        }
    },
    {
        "name": "scroll",
        "description": "Scroll the screen up or down.",
        "parameters": {
            "type": "object",
            "properties": {
                "clicks": {"type": "integer", "description": "Number of clicks (positive for up, negative for down)"}
            },
            "required": ["clicks"]
        }
    },
    {
        "name": "run_terminal",
        "description": "Run a terminal command. USE WITH CAUTION.",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "The shell command to execute"}
            },
            "required": ["command"]
        }
    },
    {
        "name": "web_search",
        "description": "Search the web for information (e.g., current events, docs).",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "save_memory",
        "description": "Save a piece of information to long-term memory.",
        "parameters": {
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "The key/topic (e.g., 'user_name', 'project_path')"},
                "value": {"type": "string", "description": "The information to remember"}
            },
            "required": ["key", "value"]
        }
    },
    {
        "name": "read_memory",
        "description": "Read information from long-term memory.",
        "parameters": {
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "The key/topic to retrieve"}
            },
            "required": ["key"]
        }
    },
    {
        "name": "read_file",
        "description": "Read the content of a text file.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "The absolute path to the file"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "write_file",
        "description": "Write text to a file. Overwrites existing content.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "The absolute path to the file"},
                "content": {"type": "string", "description": "The text content to write"}
            },
            "required": ["path", "content"]
        }
    },
    {
        "name": "list_files",
        "description": "List files and directories in a given path.",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "The directory path"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "get_active_windows",
        "description": "Get a list of currently open window titles.",
        "parameters": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "switch_to_window",
        "description": "Switch focus to a specific window by its title.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "The exact or partial title of the window"}
            },
            "required": ["title"]
        }
    },
    {
        "name": "set_clipboard",
        "description": "Write text to the system clipboard.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "The text to copy"}
            },
            "required": ["text"]
        }
    },
    {
        "name": "get_clipboard",
        "description": "Read the current text content of the clipboard.",
        "parameters": {"type": "object", "properties": {}, "required": []}
    }
]

SYSTEM_PROMPT = """You are a helpful AI assistant with computer vision capabilities.
The user has provided you with a screenshot of their computer screen.
Your task is to analyze this image and help the user navigate the interface.
You CAN see the image. It is provided in the message history.

Tools available (YOU MUST ONLY USE THESE):
1. get_screen_content(): Take a screenshot. Use this OFTEN to see the state.
2. mouse_move(x, y): Move cursor.
3. mouse_click(): Click left button.
4. type_text(text): Type on keyboard.
5. scroll(clicks): Scroll screen.
6. run_terminal(command): Run shell command.
7. web_search(query): Search the internet.
8. save_memory(key, value): Remember something for later.
9. read_memory(key): Recall something you remembered.
10. get_clipboard(): Read text from clipboard.
11. set_clipboard(text): Write text to clipboard.
12. read_file(path): Read a file.
13. write_file(path, content): Write to a file.
14. list_files(path): List directory contents.
15. get_active_windows(): List open windows.
16. switch_to_window(title): Switch to a window.

To use a tool, output a JSON object wrapped in <tool_call> tags.

EXAMPLES:
User: "Open Notepad"
Model: <tool_call>{"name": "run_terminal", "arguments": {"command": "start notepad"}}</tool_call>

User: "Write 'hello' to C:\\test.txt"
Model: <tool_call>{"name": "write_file", "arguments": {"path": "C:\\test.txt", "content": "hello"}}</tool_call>

IMPORTANT:
- The image provided IS the screen. Treat it as your visual input.
- To OPEN applications, ALWAYS use `run_terminal` with the `start` command.
- If you cannot see the screen, call get_screen_content() immediately.
- Once you receive a screenshot, ANALYZE IT. Do NOT call get_screen_content() again immediately.
- The screen resolution is scaled to 1024x768 for your vision.
"""

def get_screen_content():
    print("    📸 Capturing screen...")
    screenshot = pyautogui.screenshot()
    screenshot = screenshot.resize(SCREENSHOT_SIZE)
    
    buffered = io.BytesIO()
    screenshot.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    print(f"    📏 Screenshot size: {len(img_str)} bytes")
    return img_str

def mouse_move(x, y):
    # Scale coordinates back to actual screen size
    screen_w, screen_h = pyautogui.size()
    target_x = int(x * (screen_w / SCREENSHOT_SIZE[0]))
    target_y = int(y * (screen_h / SCREENSHOT_SIZE[1]))
    
    print(f"    🖱️  Moving mouse to: {target_x}, {target_y}")
    pyautogui.moveTo(target_x, target_y, duration=0.5)
    return "Mouse moved."

def mouse_click():
    print("    🖱️  Clicking...")
    pyautogui.click()
    return "Clicked."

def type_text(text):
    print(f"    ⌨️  Typing: {text}")
    pyautogui.write(text, interval=0.05)
    return "Text typed."

def scroll(clicks):
    print(f"    📜 Scrolling: {clicks}")
    pyautogui.scroll(clicks * 100) # Scale scroll amount
    return "Scrolled."

def run_terminal(command):
    print(f"    💻 Request to run command: {command}")
    
    if not ALLOW_ALL_COMMANDS:
        confirmation = input(f"    ⚠️  ALLOW this command? (y/n): ").lower()
        if confirmation != 'y':
            return "Error: User denied permission."
            
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=10)
        output = result.stdout + result.stderr
        return output.strip() if output.strip() else "Command executed."
    except Exception as e:
        return f"Terminal error: {str(e)}"

# --- New Tools ---

def web_search(query):
    print(f"    🔎 Searching web for: {query}...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            class DDGParser(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.results = []
                    self.current_result = {}
                    self.in_result = False
                    self.in_title = False
                    self.in_snippet = False
                    
                def handle_starttag(self, tag, attrs):
                    attrs = dict(attrs)
                    if tag == 'div' and 'result__body' in attrs.get('class', ''):
                        self.in_result = True
                        self.current_result = {}
                    elif self.in_result and tag == 'a' and 'result__a' in attrs.get('class', ''):
                        self.in_title = True
                        self.current_result['link'] = attrs.get('href')
                    elif self.in_result and tag == 'a' and 'result__snippet' in attrs.get('class', ''):
                        self.in_snippet = True

                def handle_endtag(self, tag):
                    if tag == 'a':
                        self.in_title = False
                        self.in_snippet = False

                def handle_data(self, data):
                    if self.in_title:
                        self.current_result['title'] = data.strip()
                    elif self.in_snippet:
                        self.current_result['snippet'] = self.current_result.get('snippet', '') + data.strip()
                        if 'title' in self.current_result and 'snippet' in self.current_result:
                            self.results.append(f"Title: {self.current_result['title']}\nSnippet: {self.current_result['snippet']}\n")
                            self.current_result = {} 

            parser = DDGParser()
            parser.feed(response.text)
            return "\n".join(parser.results[:3]) if parser.results else "No results found."
        return f"Error: {response.status_code}"
    except Exception as e:
        return f"Search error: {str(e)}"

def load_memory():
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_memory(key, value):
    print(f"    💾 Saving memory: {key} = {value}")
    mem = load_memory()
    mem[key] = value
    with open(MEMORY_FILE, 'w') as f:
        json.dump(mem, f, indent=2)
    return f"Saved memory: {key}"

def read_memory(key):
    print(f"    🧠 Reading memory: {key}")
    mem = load_memory()
    return mem.get(key, "Memory not found.")

def get_clipboard():
    print("    📋 Reading clipboard...")
    try:
        return pyperclip.paste()
    except Exception as e:
        return f"Clipboard error: {str(e)}"

def set_clipboard(text):
    print(f"    📋 Setting clipboard: {text}")
    try:
        pyperclip.copy(text)
        return "Clipboard updated."
    except Exception as e:
        return f"Clipboard error: {str(e)}"

def read_file(path):
    print(f"    📄 Reading file: {path}")
    try:
        if not os.path.exists(path):
            return "Error: File not found."
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Read error: {str(e)}"

def write_file(path, content):
    print(f"    💾 Writing file: {path}")
    if not ALLOW_ALL_COMMANDS:
        confirmation = input(f"    ⚠️  ALLOW writing to {path}? (y/n): ").lower()
        if confirmation != 'y':
            return "Error: User denied permission."
    try:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return "File written successfully."
    except Exception as e:
        return f"Write error: {str(e)}"

def list_files(path):
    print(f"    📂 Listing files in: {path}")
    try:
        if not os.path.exists(path):
            return "Error: Path not found."
        items = os.listdir(path)
        return "\n".join(items[:50]) + ("\n... (more)" if len(items) > 50 else "")
    except Exception as e:
        return f"List error: {str(e)}"

def get_active_windows():
    print("    🪟 Getting active windows...")
    try:
        # PowerShell command to get visible windows
        cmd = "powershell \"Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object MainWindowTitle | Format-Table -HideTableHeaders\""
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()
    except Exception as e:
        return f"Window error: {str(e)}"

def switch_to_window(title):
    print(f"    🪟 Switching to window: {title}")
    try:
        # PowerShell script to switch window
        ps_script = f"""
        $wshell = New-Object -ComObject wscript.shell;
        $wshell.AppActivate('{title}')
        """
        cmd = ["powershell", "-Command", ps_script]
        subprocess.run(cmd, check=True)
        return f"Switched to window matching '{title}'."
    except Exception as e:
        return f"Switch error: {str(e)}"

def chat():
    global ALLOW_ALL_COMMANDS
    print("\n🌟🌟🌟 Fara Agent (Qwen 32B) - UPDATED VERSION 🌟🌟🌟")
    print("Type 'exit' to quit")
    print("⚠️  SAFETY: Move mouse to TOP-LEFT corner to force stop script.")
    
    # Ask for unsafe mode
    unsafe_input = input("⚠️  Enable UNSAFE mode (allow all commands without confirmation)? (y/N): ").lower()
    if unsafe_input == 'y':
        ALLOW_ALL_COMMANDS = True
        print("🚨 UNSAFE MODE ENABLED. Commands will run without confirmation.")
    else:
        print("🔒 Safe mode enabled. You will be asked to confirm commands.")
    
    history = [{"role": "system", "content": SYSTEM_PROMPT}]
    last_tool_call = None
    
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ['exit', 'quit']:
            break

        # Attach screenshot to user message if they ask about screen
        current_images = []
        if "screen" in user_input.lower() or "click" in user_input.lower() or "see" in user_input.lower():
             current_images = [get_screen_content()]

        msg_payload = {"role": "user", "content": user_input}
        if current_images:
            print("    📸 Attaching screenshot to message...")
            msg_payload["images"] = current_images
            # Explicitly tell the model there is an image
            msg_payload["content"] += "\n\n[System: A screenshot of the screen has been attached to this message. Please analyze it.]"
            
        history.append(msg_payload)

        # Call Ollama
        try:
            response = requests.post(OLLAMA_API_URL, json={
                "model": MODEL_NAME,
                "messages": history,
                "stream": False
            })
            response.raise_for_status()
            result = response.json()
            assistant_msg = result['message']['content']
            print(f"\nFara: {assistant_msg}")
            
            history.append({"role": "assistant", "content": assistant_msg})

            # Check for tool calls
            tool_calls = re.findall(r'<tool_call>(.*?)</tool_call>', assistant_msg, re.DOTALL)
            
            # Fallback: Check for markdown code blocks if no XML tags found
            if not tool_calls:
                # Look for ```json ... ``` blocks
                tool_calls = re.findall(r'```json\s*(.*?)\s*```', assistant_msg, re.DOTALL)
                if tool_calls:
                    print("    ⚠️  Note: Parsed tool call from Markdown code block.")
            
            if tool_calls:
                for call_json in tool_calls:
                    try:
                        call_data = json.loads(call_json)
                        tool_name = call_data.get('name')
                        tool_args = call_data.get('arguments', {})
                        
                        tool_result = None
                        if tool_name == 'get_screen_content':
                            if last_tool_call == 'get_screen_content':
                                print("    ⚠️  Preventing loop: Model asked for screenshot again immediately.")
                                history.append({
                                    "role": "user", 
                                    "content": "You just took a screenshot. Please analyze the image provided in the previous message. Do not call get_screen_content again."
                                })
                                # Retry getting response without tool execution
                                response = requests.post(OLLAMA_API_URL, json={
                                    "model": MODEL_NAME,
                                    "messages": history,
                                    "stream": False
                                })
                                response.raise_for_status()
                                final_result = response.json()
                                final_msg = final_result['message']['content']
                                print(f"\nFara (after loop prevention): {final_msg}")
                                history.append({"role": "assistant", "content": final_msg})
                                continue

                            last_tool_call = 'get_screen_content'
                            img_data = get_screen_content()
                            history.append({
                                "role": "user", 
                                "content": "Here is the screenshot you requested.",
                                "images": [img_data]
                            })
                            print("    📸 Sent screenshot to model.")
                            
                            response = requests.post(OLLAMA_API_URL, json={
                                "model": MODEL_NAME,
                                "messages": history,
                                "stream": False
                            })
                            response.raise_for_status()
                            final_result = response.json()
                            final_msg = final_result['message']['content']
                            print(f"\nFara (after screenshot): {final_msg}")
                            history.append({"role": "assistant", "content": final_msg})
                            continue

                        # Reset last tool call for other tools
                        last_tool_call = tool_name

                        if tool_name == 'mouse_move':
                            tool_result = mouse_move(tool_args.get('x'), tool_args.get('y'))
                        elif tool_name == 'mouse_click':
                            tool_result = mouse_click()
                        elif tool_name == 'type_text':
                            tool_result = type_text(tool_args.get('text'))
                        elif tool_name == 'scroll':
                            tool_result = scroll(tool_args.get('clicks'))
                        elif tool_name == 'run_terminal':
                            tool_result = run_terminal(tool_args.get('command'))
                        elif tool_name == 'web_search':
                            tool_result = web_search(tool_args.get('query'))
                        elif tool_name == 'save_memory':
                            tool_result = save_memory(tool_args.get('key'), tool_args.get('value'))
                        elif tool_name == 'read_memory':
                            tool_result = read_memory(tool_args.get('key'))
                        elif tool_name == 'get_clipboard':
                            tool_result = get_clipboard()
                        elif tool_name == 'set_clipboard':
                            tool_result = set_clipboard(tool_args.get('text'))
                        elif tool_name == 'read_file':
                            tool_result = read_file(tool_args.get('path'))
                        elif tool_name == 'write_file':
                            tool_result = write_file(tool_args.get('path'), tool_args.get('content'))
                        elif tool_name == 'list_files':
                            tool_result = list_files(tool_args.get('path'))
                        elif tool_name == 'get_active_windows':
                            tool_result = get_active_windows()
                        elif tool_name == 'switch_to_window':
                            tool_result = switch_to_window(tool_args.get('title'))
                        else:
                            tool_result = f"Error: Tool '{tool_name}' not found. Please use only available tools."
                        
                        if tool_result:
                            print(f"    ✅ Tool Result: {str(tool_result)[:100]}...")
                            tool_msg = f"Tool '{tool_name}' result: {tool_result}"
                            history.append({"role": "user", "content": tool_msg})
                            
                            # Get final response
                            response = requests.post(OLLAMA_API_URL, json={
                                "model": MODEL_NAME,
                                "messages": history,
                                "stream": False
                            })
                            response.raise_for_status()
                            final_result = response.json()
                            final_msg = final_result['message']['content']
                            print(f"\nFara (after tool): {final_msg}")
                            history.append({"role": "assistant", "content": final_msg})
                            
                    except Exception as e:
                        print(f"    ⚠️ Tool execution error: {e}")

        except Exception as e:
            print(f"Error: {e}")

def test_once(message):
    print(f"🧪 Testing with message: {message}")
    history = [{"role": "system", "content": SYSTEM_PROMPT}]
    history.append({"role": "user", "content": message})
    
    try:
        response = requests.post(OLLAMA_API_URL, json={
            "model": MODEL_NAME,
            "messages": history,
            "stream": False
        })
        response.raise_for_status()
        result = response.json()
        print(f"🤖 Response: {result['message']['content']}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        test_once("Hello! Are you ready?")
    else:
        chat()
