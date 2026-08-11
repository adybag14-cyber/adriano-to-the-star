# 🚀 Stellar AI CLI - Quick Setup Guide

## Installation

1. **Download the CLI:**
   - Click the "Download CLI" button on the Stellar AI page, OR
   - Download from GitLab: https://gitlab.com/imtherushwar/new-starsiadr

2. **Extract the zip file:**
   ```bash
   unzip new-starsiadr-main.zip  # Linux/Mac
   # or use your preferred extraction tool on Windows
   ```

3. **Navigate to CLI folder:**
   ```bash
   cd new-starsiadr-main/stellar-ai-cli
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Run Stellar AI CLI:**
   ```bash
   node index.js
   ```

## Usage

### Basic Commands

- Type a message and press Enter to chat
- `/model [name]` - Change AI model
- `/clear` - Clear conversation history
- `/history` - Show conversation history
- `/tools` - List available tools
- `/help` - Show help menu
- `/exit` - Exit Stellar AI

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

## Available Tools

- **read_file** - Read file contents
- **write_file** - Write content to a file
- **list_files** - List files and directories
- **analyze_image** - Analyze image files
- **search_files** - Search for files by pattern
- **execute_command** - Execute shell commands (with safety checks)

## AI Integration

The CLI uses **Puter.js** automatically! Just authenticate:

1. **Start the CLI:**
   ```bash
   node index.js
   ```

2. **Sign in to Puter.js:**
   ```
   /login
   ```
   A browser window will open. Complete the authentication.

3. **Verify authentication:**
   ```
   /auth
   ```

That's it! Puter.js is now integrated and ready to use with tool calling support.

**Note:** Your authentication token is automatically saved and will be loaded on next startup.

## Configuration

Configuration is saved in `.stellar-ai-config.json`:

```json
{
  "model": "sonnet-4.5",
  "history": [...]
}
```

## Troubleshooting

### "Module not found" errors
```bash
npm install
```

### File operations failing
- Check file permissions
- Use absolute paths if relative paths don't work
- Ensure files exist before reading

### AI not responding
- Check your API key configuration
- Review the `callAIAPI()` method in `index.js`
- Ensure you have internet connection for API calls

## Security Notes

- Dangerous commands (like `rm -rf`) are blocked
- File operations are limited to current directory and subdirectories
- Tool execution is sandboxed

## Support

For issues or questions:
- Check the main README.md
- Review error messages in the terminal
- Visit: https://gitlab.com/imtherushwar/new-starsiadr

---

**Enjoy your cosmic AI assistant! 🌌✨**

