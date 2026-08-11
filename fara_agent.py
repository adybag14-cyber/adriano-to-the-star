import requests
import json
import re
import sys
import subprocess
from urllib.parse import quote_plus

# Configuration
OLLAMA_API_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "fara"

# Tool Definitions
TOOLS = [
    {
        "name": "web_search",
        "description": "Search the web for information. Use this when you need current events or external knowledge.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "calculator",
        "description": "Calculate a math expression.",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {"type": "string", "description": "The math expression to evaluate (e.g., '2 + 2')"}
            },
            "required": ["expression"]
        }
    },
    {
        "name": "run_terminal",
        "description": "Run a terminal command on the user's computer. USE WITH CAUTION.",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "The shell command to execute (e.g., 'dir', 'echo hello')"}
            },
            "required": ["command"]
        }
    }
]

SYSTEM_PROMPT = """You are Fara, a helpful AI assistant with access to tools.
You can use the following tools:
1. web_search(query): Search the web.
2. calculator(expression): Calculate math.
3. run_terminal(command): Execute a shell command. Use this to check files, system status, etc.

To use a tool, you MUST output a JSON object wrapped in <tool_call> tags.
Example: <tool_call>{"name": "web_search", "arguments": {"query": "current weather in London"}}</tool_call>

After you receive a tool result, use it to answer the user's question.
"""

def web_search(query):
    print(f"    🔎 Searching web for: {query}...")
    try:
        # Simple DDG HTML scrape (no API key needed for basic PoC)
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            # Extract first few results (very basic parsing)
            from html.parser import HTMLParser
            
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
                    if tag == 'div' and self.in_result:
                        # This is heuristic, might be flaky
                        pass 
                    if tag == 'a':
                        self.in_title = False
                        self.in_snippet = False

                def handle_data(self, data):
                    if self.in_title:
                        self.current_result['title'] = data.strip()
                    elif self.in_snippet:
                        self.current_result['snippet'] = self.current_result.get('snippet', '') + data.strip()
                        # If we have title and snippet, add to results
                        if 'title' in self.current_result and 'snippet' in self.current_result:
                            self.results.append(f"Title: {self.current_result['title']}\nSnippet: {self.current_result['snippet']}\n")
                            self.current_result = {} # Reset

            parser = DDGParser()
            parser.feed(response.text)
            return "\n".join(parser.results[:3]) if parser.results else "No results found."
        return f"Error: {response.status_code}"
    except Exception as e:
        return f"Search error: {str(e)}"

def calculator(expression):
    print(f"    🧮 Calculating: {expression}...")
    try:
        # Safety: only allow basic math characters
        if not re.match(r'^[0-9+\-*/().\s]+$', expression):
            return "Error: Invalid characters in expression"
        return str(eval(expression))
    except Exception as e:
        return f"Calculation error: {str(e)}"

def run_terminal(command):
    print(f"    💻 Request to run command: {command}")
    
    # SAFETY CHECK: Ask user for permission
    confirmation = input(f"    ⚠️  ALLOW this command? (y/n): ").lower()
    if confirmation != 'y':
        print("    🚫 Command denied by user.")
        return "Error: User denied permission to run this command."

    try:
        # Run command and capture output
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=10)
        output = result.stdout + result.stderr
        return output.strip() if output.strip() else "Command executed (no output)."
    except Exception as e:
        return f"Terminal error: {str(e)}"

def chat():
    print("🤖 Fara 7B Agent (with Tools: Web, Calc, Terminal) - Type 'exit' to quit")
    history = [{"role": "system", "content": SYSTEM_PROMPT}]

    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ['exit', 'quit']:
            break

        history.append({"role": "user", "content": user_input})

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
            # Regex to find <tool_call>...</tool_call>
            tool_calls = re.findall(r'<tool_call>(.*?)</tool_call>', assistant_msg, re.DOTALL)
            
            if tool_calls:
                for call_json in tool_calls:
                    try:
                        # Clean up the JSON string (remove potential markdown code blocks or whitespace)
                        call_json = call_json.strip()
                        if call_json.startswith('```json'):
                            call_json = call_json[7:]
                        if call_json.endswith('```'):
                            call_json = call_json[:-3]
                        call_json = call_json.strip()
                        
                        call_data = json.loads(call_json)
                        tool_name = call_data.get('name')
                        tool_args = call_data.get('arguments', {})
                        
                        tool_result = None
                        if tool_name == 'web_search':
                            tool_result = web_search(tool_args.get('query'))
                        elif tool_name == 'calculator':
                            tool_result = calculator(tool_args.get('expression'))
                        elif tool_name == 'run_terminal':
                            tool_result = run_terminal(tool_args.get('command'))
                        
                        if tool_result:
                            print(f"    ✅ Tool Result: {tool_result[:100]}...")
                            
                            # Feed result back to model
                            tool_msg = f"Tool '{tool_name}' result: {tool_result}"
                            history.append({"role": "user", "content": tool_msg}) # Using user role to feed back result is a common pattern for simple agents
                            
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
                            
                    except json.JSONDecodeError:
                        print("    ⚠️ Failed to parse tool call JSON")
                    except Exception as e:
                        print(f"    ⚠️ Tool execution error: {e}")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    chat()
