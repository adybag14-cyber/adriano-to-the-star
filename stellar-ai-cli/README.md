# 🌟 Stellar AI CLI

Terminal interface for Stellar AI with tool calling, file system integration, and multi-agent support.

## ✨ Features

- 💬 **Natural AI Conversations** - Chat with advanced AI models
- 🎙️ **LiveKit Voice Agent** - Real-time voice conversations with Gemini Live API
- 🔧 **Tool Calling** - AI can use tools to interact with your file system
- 📁 **File Operations** - Read, write, list, and search files
- 🖼️ **Image Analysis** - Analyze images and extract metadata
- 🤖 **Multi-Agent Support** - Run multiple AI agents simultaneously
- 🎯 **Model Selection** - Switch between different AI models
- 💾 **Persistent History** - Saves conversation history locally

## 🚀 Installation

### Option 1: Download from Website

1. Visit the Stellar AI page on your website
2. Click the "Download CLI" button
3. Extract the downloaded zip file
4. Navigate to the extracted folder

### Option 2: Manual Setup

```bash
# Clone or download the stellar-ai-cli folder
cd stellar-ai-cli

# Install Node.js dependencies (includes Puter.js)
npm install

# Install Python dependencies for LiveKit Voice Agent (optional)
pip install -r requirements.txt
```

## 🔐 Authentication

Stellar AI CLI uses **Puter.js** for AI capabilities. You need to authenticate to use full AI features:

1. **Start the CLI:**
   ```bash
   node index.js
   ```

2. **Sign in to Puter.js:**
   ```
   /login
   ```
   A browser window will open for authentication. Complete the sign-in process.

3. **Check authentication status:**
   ```
   /auth
   ```

4. **Sign out (if needed):**
   ```
   /logout
   ```

**Note:** Your authentication token is saved locally in `.stellar-ai-config.json` and will be automatically loaded on next startup.

## 📖 Usage

### Start Stellar AI CLI

```bash
node index.js
```

Or if installed globally:

```bash
stellar-ai
```

### Basic Commands

- **Type a message** - Just type and press Enter to chat
- **`/login`** - Sign in to Puter.js (required for AI features)
- **`/logout`** - Sign out from Puter.js
- **`/auth`** - Show authentication status
- **`/model [name]`** - Change AI model (e.g., `/model sonnet-4.5`)
- **`/clear`** - Clear conversation history
- **`/history`** - Show conversation history
- **`/tools`** - List available tools
- **`/help`** - Show help menu
- **`/exit`** - Exit Stellar AI

### Using File Paths

You can include file paths in your messages:

```
Read the file at ./data.txt
Analyze the image at ./photo.jpg
List files in ./documents
Search for *.js files in ./src
```

### Multi-Agent Support

```
/agent add researcher sonnet-4.5
/agent add coder gpt-4o
/agent list
```

## 🔧 Available Tools

- **`read_file`** - Read file contents
- **`write_file`** - Write content to a file
- **`list_files`** - List files and directories
- **`analyze_image`** - Analyze image files
- **`search_files`** - Search for files by pattern
- **`execute_command`** - Execute shell commands (with safety checks)

## 🎯 Supported Models

### Text Models (via Puter.js)
- Claude Sonnet 4.5
- Claude Sonnet 4
- Claude Opus 4
- Claude Haiku 4
- GPT-4o
- GPT-4 Turbo
- GPT-3.5 Turbo
- Gemini Pro
- Llama 3.1

### Voice Models (via LiveKit)
- **Gemini 2.5 Flash Native Audio** - Real-time voice conversations with native audio support
  - Voice: Puck (and other Gemini voices)
  - Features: Native audio, thinking mode, affective dialog, proactive audio

## 📝 Examples

### Read a File

```
You: Read the file at ./package.json
AI: [Reads and displays file contents]
```

### Analyze an Image

```
You: Analyze the image at ./screenshot.png
AI: [Provides image metadata and analysis]
```

### List Files

```
You: List files in the current directory
AI: [Lists all files and directories]
```

### Write a File

```
You: Write "Hello World" to ./test.txt
AI: [Creates the file with the content]
```

## ⚙️ Configuration

Configuration is saved in `.stellar-ai-config.json` in your current directory:

```json
{
  "model": "sonnet-4.5",
  "history": [...]
}
```

## 🔒 Security

- Dangerous commands (like `rm -rf`) are blocked
- File operations are limited to the current directory and subdirectories
- Tool execution is sandboxed

## 🐛 Troubleshooting

### "Module not found" errors

```bash
npm install
```

### Puter.js not authenticated

If you see "Puter.js not authenticated" messages:

1. Run `/login` to sign in
2. Complete the browser authentication
3. Check status with `/auth`

### Puter.js API not working

- Ensure you're authenticated: `/auth`
- Try logging out and back in: `/logout` then `/login`
- Check your internet connection
- The CLI will fall back to a limited local response system if Puter.js is unavailable

### File operations failing

- Check file permissions
- Ensure file paths are correct
- Use absolute paths if relative paths don't work

## 🎙️ LiveKit Voice Agent

The CLI includes a LiveKit voice agent powered by Gemini Live API for real-time voice conversations.

### Setup LiveKit Agent

1. **Set up environment variables** (Windows):
   ```powershell
   .\setup_env.ps1
   ```

   Or (Linux/Mac):
   ```bash
   chmod +x setup_env.sh
   source setup_env.sh
   ```

2. **Test the setup**:
   ```bash
   python test_full_setup.py
   ```

3. **Run the voice agent**:
   ```bash
   # Console mode (testing, no server needed)
   python livekit_agent.py console
   
   # Development mode (with hot reload)
   python livekit_agent.py dev
   
   # Production mode
   python livekit_agent.py start
   ```

### Voice Agent Features

- ✅ Real-time voice conversations
- ✅ Native audio support
- ✅ Built-in turn detection
- ✅ Thinking mode (preview model)
- ✅ Affective dialog support
- ✅ Proactive audio

### Requirements

- Python 3.8+
- LiveKit Agents: `pip install "livekit-agents[google]~=1.2"`
- Environment variables set (see `setup_env.ps1` or `setup_env.sh`)

### 🚀 Deploying to Production Server

To keep the LiveKit agent running continuously on your production server, see the deployment guides:

- **Quick Start:** See `QUICK_DEPLOY_AGENT.md` in the project root
- **Full Guide:** See `LIVEKIT_AGENT_DEPLOYMENT.md` in the project root

**Recommended: PM2 (Linux/Mac)**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Alternative: systemd (Linux)**
```bash
sudo cp livekit-agent.service /etc/systemd/system/
sudo systemctl enable livekit-agent.service
sudo systemctl start livekit-agent.service
```

The agent must be running on your production server for the LiveKit voice integration to work on your live website!

## 📚 Advanced Usage

### Custom Tools

You can extend the tool system by modifying `index.js` and adding new tools to the `initializeTools()` method.

### API Integration

To use Puter.js or other AI APIs, modify the `callAIAPI()` method in `index.js` to connect to your preferred AI service.

### LiveKit Agent Customization

Edit `livekit_agent.py` to customize:
- Agent instructions and personality
- Voice selection
- Temperature and other model parameters
- Advanced features (thinking mode, affective dialog, etc.)

## 📄 License

MIT License - Feel free to modify and use!

## 🆘 Support

For issues or questions:
- Check the main Stellar AI documentation
- Review error messages in the terminal
- Ensure all dependencies are installed

---

**Enjoy your cosmic AI assistant! 🌌✨**

