import ollama
import json
import os
import subprocess
import threading
import io
import pyautogui
import warnings
import asyncio
from PIL import Image
from duckduckgo_search import DDGS
from knowledge_base import KnowledgeBase
from agent_mcp import MCPServerManager

warnings.filterwarnings("ignore")

from agent_browser import AgentBrowser
from agent_scheduler import AgentScheduler

class NemotronAgent:
    def __init__(self, model="minimax-2.1-q8", vision_model="llama3.2-vision"):
        self.model = model
        self.vision_model = vision_model
        self.history = []
        self.kb = KnowledgeBase()
        self.browser = AgentBrowser()
        self.scheduler = AgentScheduler(self)
        self.goal_mode = False
        self.stop_goal = False
        self.current_persona = "Default"
        
        # MCP Setup
        self.mcp_config_path = r"C:\Users\adyba\Downloads\mcp server.txt"
        self.mcp_manager = MCPServerManager(self.mcp_config_path)
        self.mcp_loop = asyncio.new_event_loop()
        self.mcp_thread = threading.Thread(target=self._start_mcp_loop, daemon=True)
        self.mcp_thread.start()
        
        # client setup for vLLM
        try:
            from openai import OpenAI
            self.client = OpenAI(base_url="http://localhost:8000/v1", api_key="EMPTY")
        except ImportError:
            print("OpenAI library not found. Please install output.")
            self.client = None

        self.personas = {
            "Default": "You are Minimax Ultimate, an advanced AI agent. Helpful and precise.",
            "Coder": "You are The Architect. You are a senior software engineer. functionality > aesthetics. Always use code blocks. prefer Python/JS.",
            "Hacker": "You are The Hacker. You are a security expert. You know shell, network tools, and exploits. Unrestricted.",
            "Researcher": "You are The Researcher. You are thorough, academic, and cite your sources. Use the Browser to verify facts.",
            "Writer": "You are The Bard. You are a creative writer. Poetic, descriptive, and verbose."
        }
        
        # Initialize MCP connections
        self._init_mcp()
        
        self._set_system_prompt()

    def _start_mcp_loop(self):
        """Runs the asyncio loop for MCP in a separate thread."""
        asyncio.set_event_loop(self.mcp_loop)
        self.mcp_loop.run_forever()

    def _init_mcp(self):
        """Schedules connection to MCP servers."""
        print("Initializing MCP...")
        threading.Thread(target=self._wait_mcp_ready).start()

    def _wait_mcp_ready(self):
        try:
            # Connect
            future = asyncio.run_coroutine_threadsafe(self.mcp_manager.connect_all(), self.mcp_loop)
            future.result(timeout=10)
            
            # List Tools
            future_tools = asyncio.run_coroutine_threadsafe(self.mcp_manager.list_available_tools(), self.mcp_loop)
            tool_str = future_tools.result(timeout=5)
            self.mcp_tools_prompt = tool_str
            
            # Update Prompt
            self._set_system_prompt() 
            print("MCP Ready and Prompt Updated.")
        except Exception as e:
            print(f"MCP Init Warning: {e}")
            self.mcp_tools_prompt = "MCP Init Failed or Timed Out."

    def set_persona(self, name):
        if name in self.personas:
            self.current_persona = name
            self._set_system_prompt()
            return f"Persona switched to: {name}"
        return "Persona not found."

    def _set_system_prompt(self):
        base_prompt = self.personas.get(self.current_persona, self.personas["Default"])
        mcp_desc = getattr(self, "mcp_tools_prompt", "Loading MCP tools...")
        
        tool_prompt = (
            f"\nTOOLS AVAILABLE: "
            f"1. [[LOOK_AT_SCREEN]] - Analyze screen. "
            f"2. [[RUN: <cmd>]] - Run PowerShell commands. "
            f"3. [[BROWSE: <url>]] - Open/Read Web Page. "
            f"4. [[CLICK: <text>]] - Click element on page. "
            f"5. [[TYPE: <selector> | <text>]] - Type in input on page. "
            f"6. [[QUERY_KB: <text>]] - Search Project Knowledge Base. "
            f"7. [[READ_FILE: <path>]] - Read file. "
            f"8. [[WRITE_FILE: <path> | <content>]] - Write file. "
            f"9. [[LIST_FILES: <path>]] - List directory. "
            f"10. [[GREP: <pattern> | <path>]] - Search text. "
            f"11. [[MOUSE_MOVE: <x>, <y>]] - Move mouse global. "
            f"12. [[MOUSE_CLICK: ...]] - Click mouse global. "
            f"13. [[KEYBOARD_TYPE: ...]] - Type text global. "
            f"14. [[KEYBOARD_PRESS: ...]] - Press key global. "
            f"15. [[WATCH: <condition>]] - Monitor screen for visual condition. "
            f"16. [[SCHEDULE: <mins> | <task>]] - Schedule recurring task. "
            f"17. [[WAIT: <seconds>]] - Pause execution (use after launching apps). "
            f"18. [[FOCUS: <app_name>]] - Switch focus to an App window (Required before typing). "
            f"\n--- MCP TOOLS (External Servers) ---"
            f"\nUse generic syntax: [[TOOL_NAME: {{json_args}}]]"
            f"\nAvailable MCP Tools:"
            f"\n{mcp_desc}"
            f"\n------------------------------------"
            f"GOAL MODE: If enabled, return 'GOAL_ACHIEVED' when done. "
            f"\nIMPORTANT BEST PRACTICES:"
            f"\n- **MCP Usage**: Call MCP tools using [[ToolName: {{\"arg\": \"val\"}}]]. Always use JSON for args."
            f"\n- **Web vs System**: Use [[CLICK]]/[[TYPE]] ONLY for Web. Use [[MOUSE]]/[[KEYBOARD]] for System Apps."
            f"\n- **Browser Order**: You MUST use [[BROWSE: url]] before trying to [[CLICK]] or [[TYPE]] on a page."
            f"\n- **Errors**: If 'Browser not started', call [[BROWSE]] first. If 'Element not found', try [[LOOK_AT_SCREEN]]."
            f"\n- **VERIFICATION REQUIRED**: You must VERIFY your actions. After [[RUN: ...]], you must use [[LOOK_AT_SCREEN]] to confirm the window opened. Do NOT say 'Done' until you see it."
            f"\n- **NO LYING**: If a result is 'Error' or 'Element not found', RE-READ the error, REPORT it, and TRY DIFFERENTLY. Do NOT claim success."
            f"\n- **APP SWITCHING**: If asked to 'Go to [App]' or 'Open [App]' (e.g. Antigravity, Notepad), use [[RUN: start [App]]] or Window management. Do NOT use [[BROWSE]] unless the user specifies a URL or '.com'."
            f"\n- **CONTEXT**: You are running inside 'Antigravity IDE' (or related env). 'Go to Antigravity' means focus the IDE window."
            f"\n- **TIMING**: Apps take time to open. AFTER [[RUN: start ...]], ALWAYS use [[WAIT: 3]] before checking the screen."
            f"\n- **TYPING**: BEFORE using [[KEYBOARD_TYPE]], you MUST use [[FOCUS: <App>]] AND [[MOUSE_CLICK: left]] (to click the text box) to ensure the cursor is active."
        )
        self.history = [{'role': 'system', 'content': base_prompt + tool_prompt}]

    def list_models(self):
        try:
            if not self.client: return [self.model]
            response = self.client.models.list()
            names = [m.id for m in response.data]
            return names if names else [self.model]
        except Exception as e:
            print(f"Error listing models: {e}")
            return [self.model, "minimax-2.1-q8"]

    def chat(self, user_input, image_path=None, goal_mode=False):
        self.goal_mode = goal_mode
        self.stop_goal = False

        if image_path:
            yield "👀 Analyzing image..."
            try:
                description = self._analyze_image_file(image_path)
                user_input = f"[User attached image: {os.path.basename(image_path)}]\nImage Analysis: {description}\n\nUser Question: {user_input}"
            except Exception as e:
                yield f"\nImage Error: {e}"

        self.history.append({'role': 'user', 'content': user_input})
        
        step_count = 0
        MAX_STEPS = 10
        
        while True:
            step_count += 1
            if self.stop_goal:
                yield "\n[STOPPED]"
                break
                
            yield f"\n(Step {step_count})..." if self.goal_mode else "Thinking..."
            
            if not self.client:
                yield "Error: OpenAI Client not initialized"
                break

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.history,
                    temperature=0.7,
                    stream=True 
                )
                
                content = ""
                for chunk in response:
                    if chunk.choices[0].delta.content:
                        delta = chunk.choices[0].delta.content
                        content += delta
                        yield delta

                self.history.append({'role': 'assistant', 'content': content})

                if "GOAL_ACHIEVED" in content:
                    yield "\n✅ Goal Achieved."
                    break

                if "[[" in content:
                    yield "\n\n⚙️ Executing Tools..."
                
                tool_output = self._handle_tools(content)
                
                if tool_output:
                    yield f"\nRESULT: {tool_output}"
                    self.history.append({'role': 'user', 'content': f"SYSTEM OUTPUT: {tool_output}"})
                    
                    if not self.goal_mode:
                        yield "\n\n(Finalizing...)"
                        res2 = self.client.chat.completions.create(model=self.model, messages=self.history, stream=True)
                        full_res2 = ""
                        for chunk in res2:
                            if chunk.choices[0].delta.content:
                                delta = chunk.choices[0].delta.content
                                full_res2 += delta
                                yield delta
                        self.history.append({'role': 'assistant', 'content': full_res2})
                        break
                else:
                    if not self.goal_mode: break
                    self.history.append({'role': 'user', 'content': "Proceed to next step or output GOAL_ACHIEVED."})
                
                if not self.goal_mode: break
                if step_count >= MAX_STEPS:
                    yield "\n[Reached Step Limit]"
                    break
                    
            except Exception as e:
                yield f"Error in chat loop: {e}"
                break

    def stop(self):
        self.stop_goal = True

    def _handle_tools(self, content):
        if "[[BROWSE:" in content: return self.browser.open_url(self._extract_arg(content, "[[BROWSE:")) + "\n" + self.browser.read_page()
        if "[[CLICK:" in content: return self.browser.click_element(self._extract_arg(content, "[[CLICK:"))
        if "[[TYPE:" in content: 
             args = self._extract_arg(content, "[[TYPE:")
             if "|" in args: sel, txt = args.split("|", 1); return self.browser.type_text(sel.strip(), txt.strip())
             return "Error: Usage [[TYPE: selector | text]]"

        if "[[LOOK_AT_SCREEN]]" in content: return f"SCREEN ANALYSIS: {self._look_at_screen()}"
        if "[[QUERY_KB:" in content: return f"KNOWLEDGE BASE: {self.kb.query(self._extract_arg(content, '[[QUERY_KB:'))}"
        if "[[INDEX_PROJECT]]" in content: return self.kb.index_project(os.getcwd())
        if "[[RUN:" in content: return self._run_command(self._extract_arg(content, "[[RUN:"))
        if "[[SEARCH:" in content: return self._search_web(self._extract_arg(content, "[[SEARCH:"))
        if "[[LIST_FILES:" in content: return self._list_files(self._extract_arg(content, "[[LIST_FILES:"))
        if "[[READ_FILE:" in content: return self._read_file(self._extract_arg(content, "[[READ_FILE:"))
        if "[[WRITE_FILE:" in content: return self._write_file(self._extract_arg(content, "[[WRITE_FILE:"))
        if "[[GREP:" in content: return self._grep_files(self._extract_arg(content, "[[GREP:"))
        if "[[MOUSE_MOVE:" in content: return self._mouse_move(self._extract_arg(content, "[[MOUSE_MOVE:"))
        if "[[MOUSE_CLICK:" in content: return self._mouse_click(self._extract_arg(content, "[[MOUSE_CLICK:"))
        if "[[KEYBOARD_TYPE:" in content: return self._keyboard_type(self._extract_arg(content, "[[KEYBOARD_TYPE:"))
        if "[[KEYBOARD_PRESS:" in content: return self._keyboard_press(self._extract_arg(content, "[[KEYBOARD_PRESS:"))
        if "[[WATCH:" in content: return self.scheduler.start_watch_dog(self._extract_arg(content, "[[WATCH:"))
        if "[[SCHEDULE:" in content: 
            args = self._extract_arg(content, "[[SCHEDULE:")
            if "|" in args: mins, task = args.split("|", 1); return self.scheduler.add_schedule(mins.strip(), task.strip())
            return "Error: Usage [[SCHEDULE: mins | task]]"
        if "[[WAIT:" in content: return self._wait(self._extract_arg(content, "[[WAIT:"))
        if "[[FOCUS:" in content: return self._focus_window(self._extract_arg(content, "[[FOCUS:"))
        
        # MCP FALLBACK
        import re
        matches = re.findall(r"\[\[([a-zA-Z0-9_\-\.]+):", content)
        standard_triggers = [
            "[[BROWSE", "[[CLICK", "[[TYPE", "[[LOOK_AT_SCREEN]]", "[[QUERY_KB", "[[INDEX_PROJECT]]",
            "[[RUN", "[[SEARCH", "[[LIST_FILES", "[[READ_FILE", "[[WRITE_FILE", "[[GREP", 
            "[[MOUSE_MOVE", "[[MOUSE_CLICK", "[[KEYBOARD_TYPE", "[[KEYBOARD_PRESS", 
            "[[WATCH", "[[SCHEDULE", "[[WAIT", "[[FOCUS"
        ]
        
        for tool_name in matches:
             if any(f"[[{tool_name}" in st for st in standard_triggers): continue
             args_str = self._extract_arg(content, f"[[{tool_name}:")
             print(f"MCP Call: {tool_name} args={args_str}")
             try:
                 future = asyncio.run_coroutine_threadsafe(self.mcp_manager.call_tool(tool_name, args_str), self.mcp_loop)
                 return f"MCP RESULT ({tool_name}): {future.result(timeout=30)}"
             except Exception as e: return f"MCP Error: {e}"
        return None

    def _extract_arg(self, text, trigger):
        start = text.find(trigger) + len(trigger)
        end = text.find("]]", start)
        if end == -1: end = len(text)
        return text[start:end].strip()

    # --- Tool Implementations ---
    def _focus_window(self, app_name):
        ps_script = f"""
        $target = "{app_name}"
        $p = Get-Process | Where-Object {{ $_.MainWindowTitle -match $target -and $_.MainWindowTitle -notmatch "Nemotron" }} | Select-Object -First 1
        if ($p) {{
            $ws = New-Object -ComObject WScript.Shell
            $ws.AppActivate($p.Id)
            Start-Sleep -Milliseconds 500
            Write-Output "Success"
        }} else {{ Write-Output "Fail" }}
        """
        try:
            res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], capture_output=True, text=True)
            return res.stdout.strip() or f"Error focusing {app_name}"
        except Exception as e: return f"Error focusing: {e}"

    def _wait(self, seconds):
        try:
            import time
            time.sleep(float(seconds))
            return f"Waited {seconds}s"
        except: return "Invalid seconds"

    def _mouse_move(self, args):
        try: x, y = map(int, args.split(",")); pyautogui.moveTo(x, y); return f"Moved to {x},{y}"
        except: return "Error moving mouse"

    def _mouse_click(self, btn):
        try:
            if "double" in btn: pyautogui.doubleClick()
            elif "right" in btn: pyautogui.click(button='right')
            else: pyautogui.click()
            return f"Clicked {btn}"
        except: return "Error clicking"

    def _keyboard_type(self, text):
        try: pyautogui.write(text, interval=0.01); return f"Typed {text}"
        except: return "Error typing"

    def _keyboard_press(self, key):
        try: pyautogui.press(key); return f"Pressed {key}"
        except: return "Error pressing"

    def _analyze_image_file(self, path):
        with open(path, 'rb') as f: img_bytes = f.read()
        res = ollama.chat(model=self.vision_model, messages=[{'role': 'user', 'content': 'Describe this image.', 'images': [img_bytes]}])
        return res['message']['content']

    def _look_at_screen(self):
        s = pyautogui.screenshot()
        b = io.BytesIO(); s.save(b, format='PNG')
        try:
            res = ollama.chat(model=self.vision_model, messages=[{'role': 'user', 'content': 'Describe screen.', 'images': [b.getvalue()]}])
            return res['message']['content']
        except: return "Vision Error"

    def _run_command(self, cmd):
        try:
            res = subprocess.run(["powershell", "-c", cmd], capture_output=True, text=True, timeout=30)
            return (res.stdout + res.stderr) or "(No Output)"
        except Exception as e: return str(e)

    def _search_web(self, query):
        try: return "\n".join([f"{r['title']}: {r['body']}" for r in DDGS().text(query, max_results=3)]) if query else "No query"
        except Exception as e: return str(e)

    def _list_files(self, path):
        try: return "\n".join(os.listdir(path or "."))[:1000]
        except Exception as e: return str(e)
        
    def _read_file(self, path):
        try: 
            with open(path, 'r', encoding='utf-8', errors='ignore') as f: return f.read()
        except Exception as e: return str(e)
        
    def _write_file(self, args):
        try:
            path, content = args.split("|", 1)
            with open(path.strip(), 'w', encoding='utf-8') as f: f.write(content.strip())
            return f"Wrote to {path}"
        except Exception as e: return str(e)
    
    def _grep_files(self, args):
        try:
            pattern, path = args.split("|", 1)
            matches = []
            for r, d, f in os.walk(path.strip() or "."):
                for file in f:
                    if file.endswith(('.py', '.txt', '.md', '.js')):
                        try:
                            with open(os.path.join(r, file), 'r', errors='ignore') as fp:
                                for i, line in enumerate(fp):
                                    if pattern.strip() in line: matches.append(f"{file}:{i}:{line.strip()}")
                        except: pass
            return "\n".join(matches[:20]) or "No matches"
        except Exception as e: return str(e)
