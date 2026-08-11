
import asyncio
import json
import os
import shutil
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from contextlib import AsyncExitStack

class MCPServerManager:
    def __init__(self, config_path):
        self.config_path = config_path
        self.exit_stack = AsyncExitStack()
        self.sessions = {} # server_name -> session
        self.tools = {} # tool_name -> {server: name, tool: tool_obj}
        self.connected_servers = []

    async def connect_all(self):
        """Connects to all servers defined in the config."""
        print(f"Loading MCP config from: {self.config_path}")
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
        except Exception as e:
            print(f"Failed to load MCP config: {e}")
            return

        mcp_servers = config.get("mcpServers", {})
        
        for name, server_config in mcp_servers.items():
            if server_config.get("disabled", False):
                continue
                
            cmd = server_config.get("command", "npx")
            args = server_config.get("args", [])
            env = server_config.get("env", {}).copy()
            
            # Merge with system env to ensure npx finds node, etc.
            full_env = os.environ.copy()
            full_env.update(env)

            # Resolve executable path (crucial for npx on Windows)
            executable = shutil.which(cmd)
            if not executable:
                print(f"[{name}] Error: Could not find executable '{cmd}'")
                continue

            print(f"[{name}] Connecting via {cmd} {args}...")
            
            try:
                server_params = StdioServerParameters(
                    command=executable,
                    args=args,
                    env=full_env
                )
                
                # Context manager based connection
                stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
                read, write = stdio_transport
                session = await self.exit_stack.enter_async_context(ClientSession(read, write))
                
                await session.initialize()
                self.sessions[name] = session
                self.connected_servers.append(name)
                print(f"[{name}] Connected!")
                
                # List tools immediately
                result = await session.list_tools()
                for tool in result.tools:
                    # Namespace tools to avoid collisions? 
                    # For now, we'll try direct names, or maybe prefix if needed.
                    # Let's prefix with server name for safety: "server_tool"
                    unique_name = f"{name}_{tool.name}"
                    self.tools[unique_name] = {
                        "server": name,
                        "obj": tool,
                        "raw_name": tool.name
                    }
                    # Also map raw name if unique
                    if tool.name not in self.tools:
                         self.tools[tool.name] = self.tools[unique_name]
                    
            except Exception as e:
                print(f"[{name}] Connection failed: {e}")

    async def list_available_tools(self):
        """Returns a formatted string of available tools for the system prompt."""
        if not self.tools:
            return "No MCP tools connected."
        
        descriptions = []
        seen_tools = set() # Avoid duplicates from the aliasing above
        
        for name, info in self.tools.items():
            tool = info["obj"]
            # We prefer the raw name alias if available and not seen
            if tool.name in seen_tools and name != tool.name: 
                continue # Skip the namespaced version if we already listed the clean one
            
            seen_tools.add(tool.name)
            
            # Create a schema signature
            # Simplified for prompt: ToolName(args) - Description
            schema = [f"{k}: {v.get('type', 'any')}" for k,v in tool.inputSchema.get('properties', {}).items()]
            sig = f"{tool.name}({', '.join(schema)})"
            
            descriptions.append(f"- [[{tool.name}: <json_args>]] : {tool.description or 'No desc'} (Sig: {sig})")
            
        return "\n".join(descriptions)

    async def call_tool(self, tool_name, arguments):
        """Calls a tool on the appropriate server."""
        if tool_name not in self.tools:
            return f"Error: Tool '{tool_name}' not found."
            
        info = self.tools[tool_name]
        server_name = info["server"]
        raw_name = info["raw_name"]
        session = self.sessions.get(server_name)
        
        if not session:
             return f"Error: Session for server '{server_name}' lost."
             
        try:
            # Arguments should be a dict. If string, try parse JSON.
            if isinstance(arguments, str):
                try:
                    arguments = json.loads(arguments)
                except:
                    # If simple string, maybe it's a single arg tool?
                    # We'll assume the model knows to send JSON. 
                    # For fallback, if it sends "query='foo'", that's not valid JSON.
                    return f"Error: Arguments for {tool_name} must be valid JSON object. Received: {arguments}"

            print(f"Calling {server_name}:{raw_name} with {arguments}")
            result = await session.call_tool(raw_name, arguments=arguments)
            
            # Parse result content
            output = []
            for item in result.content:
                if item.type == "text":
                    output.append(item.text)
                elif item.type == "image":
                    output.append(f"[Image Base64 Data]") # Simplify for now
                elif item.type == "resource":
                    output.append(f"[Resource: {item.resource.uri}]")
            
            return "\n".join(output)
            
        except Exception as e:
            return f"Tool execution error: {e}"

    async def cleanup(self):
        await self.exit_stack.aclose()
