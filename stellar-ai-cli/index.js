#!/usr/bin/env node

/**
 * Stellar AI CLI - Terminal Interface
 * Run AI chat locally with tool calling and file system integration
 */

const readline = require('readline'); // Built-in Node.js module
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const mime = require('mime-types');
const { exec } = require('child_process');

// Initialize Puter.js (note: puter is a global from @heyputer/puter.js)
const puterInstance = null;
let puterInitialized = false;
let puter = null;

async function initPuter() {
    try {
        // Try to load Puter.js Node.js SDK
        const { init } = require('@heyputer/puter.js/src/init.cjs');
        
        // Check for saved auth token
        const configPath = path.join(process.cwd(), '.stellar-ai-config.json');
        let config = {};
        if (await fs.pathExists(configPath)) {
            config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        }
        
        // Initialize Puter with auth token if available
        if (config.puterAuthToken) {
            puter = init(config.puterAuthToken);
            puterInitialized = true;
            
            // Verify token is still valid
            if (puter.auth && puter.auth.isSignedIn && puter.auth.isSignedIn()) {
                return true;
            } else {
                // Token might be expired, but still initialized
                console.log(chalk.yellow('⚠️  Saved token may be expired. Use /login to re-authenticate.'));
                return false;
            }
        } else {
            // Initialize without auth (will need to login)
            puter = init();
            puterInitialized = true;
            return false; // Not authenticated
        }
    } catch (_error) {
        console.log(chalk.yellow('⚠️  Puter.js not available, using fallback mode'));
        console.log(chalk.gray('   Install: npm install @heyputer/puter.js'));
        puterInitialized = false;
        return false;
    }
}

class StellarAICLI {
    constructor() {
        this.conversationHistory = [];
        this.currentModel = 'sonnet-4.5';
        this.availableModels = [
            'sonnet-4.5',
            'sonnet-4',
            'opus-4',
            'haiku-4',
            'gpt-4o',
            'gpt-4-turbo',
            'gpt-3.5-turbo',
            'gemini-pro',
            'llama-3.1'
        ];
        this.agents = []; // Multi-agent support
        this.activeTasks = new Map(); // Track parallel agent tasks
        this.tools = this.initializeTools();
        this.rl = null;
        this.configPath = path.join(process.cwd(), '.stellar-ai-config.json');
        this.puterAuthenticated = false;
        this.loginAttempts = 0; // Track login attempts
        this.loadConfig();
    }

    initializeTools() {
        return {
            // File System Tools
            read_file: {
                name: 'read_file',
                description: 'Read the contents of a file. Provide the file path.',
                parameters: {
                    type: 'object',
                    properties: {
                        file_path: {
                            type: 'string',
                            description: 'The path to the file to read'
                        }
                    },
                    required: ['file_path']
                },
                execute: async (params) => {
                    try {
                        const filePath = path.resolve(params.file_path);
                        const content = await fs.readFile(filePath, 'utf8');
                        return {
                            success: true,
                            content: content,
                            size: content.length,
                            path: filePath
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }
            },
            write_file: {
                name: 'write_file',
                description: 'Write content to a file. Creates the file if it doesn\'t exist.',
                parameters: {
                    type: 'object',
                    properties: {
                        file_path: {
                            type: 'string',
                            description: 'The path to the file to write'
                        },
                        content: {
                            type: 'string',
                            description: 'The content to write to the file'
                        }
                    },
                    required: ['file_path', 'content']
                },
                execute: async (params) => {
                    try {
                        const filePath = path.resolve(params.file_path);
                        await fs.ensureDir(path.dirname(filePath));
                        await fs.writeFile(filePath, params.content, 'utf8');
                        return {
                            success: true,
                            message: `File written successfully: ${filePath}`,
                            path: filePath
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }
            },
            list_files: {
                name: 'list_files',
                description: 'List files and directories in a given path.',
                parameters: {
                    type: 'object',
                    properties: {
                        directory_path: {
                            type: 'string',
                            description: 'The directory path to list (defaults to current directory)'
                        },
                        recursive: {
                            type: 'boolean',
                            description: 'Whether to list recursively (default: false)'
                        }
                    },
                    required: []
                },
                execute: async (params) => {
                    try {
                        const dirPath = params.directory_path ? path.resolve(params.directory_path) : process.cwd();
                        // const recursive = params.recursive || false; // Unused
                        
                        if (!await fs.pathExists(dirPath)) {
                            return {
                                success: false,
                                error: 'Directory does not exist'
                            };
                        }

                        const stats = await fs.stat(dirPath);
                        if (!stats.isDirectory()) {
                            return {
                                success: false,
                                error: 'Path is not a directory'
                            };
                        }

                        const items = await fs.readdir(dirPath);
                        const result = [];

                        for (const item of items) {
                            const itemPath = path.join(dirPath, item);
                            const stat = await fs.stat(itemPath);
                            result.push({
                                name: item,
                                path: itemPath,
                                type: stat.isDirectory() ? 'directory' : 'file',
                                size: stat.size,
                                modified: stat.mtime
                            });
                        }

                        return {
                            success: true,
                            items: result,
                            count: result.length,
                            path: dirPath
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }
            },
            analyze_image: {
                name: 'analyze_image',
                description: 'Analyze an image file. Returns image metadata and can extract text if OCR is available.',
                parameters: {
                    type: 'object',
                    properties: {
                        image_path: {
                            type: 'string',
                            description: 'The path to the image file'
                        }
                    },
                    required: ['image_path']
                },
                execute: async (params) => {
                    try {
                        const imagePath = path.resolve(params.image_path);
                        
                        if (!await fs.pathExists(imagePath)) {
                            return {
                                success: false,
                                error: 'Image file does not exist'
                            };
                        }

                        const stats = await fs.stat(imagePath);
                        const mimeType = mime.lookup(imagePath);
                        
                        // Try to get image dimensions if sharp is available
                        let dimensions = null;
                        try {
                            const sharp = require('sharp');
                            const metadata = await sharp(imagePath).metadata();
                            dimensions = {
                                width: metadata.width,
                                height: metadata.height,
                                format: metadata.format
                            };
                        } catch (_e) {
                            // Sharp not available or error
                        }

                        return {
                            success: true,
                            path: imagePath,
                            size: stats.size,
                            mimeType: mimeType,
                            dimensions: dimensions,
                            modified: stats.mtime
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }
            },
            execute_command: {
                name: 'execute_command',
                description: 'Execute a shell command. Use with caution. Only safe commands are allowed.',
                parameters: {
                    type: 'object',
                    properties: {
                        command: {
                            type: 'string',
                            description: 'The shell command to execute'
                        }
                    },
                    required: ['command']
                },
                execute: async (params) => {
                    try {
                        const { execFile } = require('child_process');
                        const { promisify } = require('util');
                        const execFileAsync = promisify(execFile);

                        const enabled = String(process.env.STELLAR_AI_ENABLE_EXECUTE_COMMAND || '').toLowerCase();
                        if (enabled !== 'true' && enabled !== '1' && enabled !== 'yes') {
                            return {
                                success: false,
                                error: 'Command execution is disabled'
                            };
                        }

                        const rawCommand = typeof params.command === 'string' ? params.command.trim() : '';
                        if (!rawCommand) {
                            return {
                                success: false,
                                error: 'Command is required'
                            };
                        }

                        if (rawCommand.length > 256 || rawCommand.includes('\n') || rawCommand.includes('\r') || rawCommand.includes('\0')) {
                            return {
                                success: false,
                                error: 'Invalid command'
                            };
                        }

                        const parts = rawCommand.split(/\s+/).filter(Boolean);
                        const commandName = parts[0] || '';
                        const args = parts.slice(1);

                        if (!/^[a-z0-9][a-z0-9_-]*$/i.test(commandName)) {
                            return {
                                success: false,
                                error: 'Command not allowed'
                            };
                        }

                        const allowedBinaries = new Set(['git', 'node', 'npm', 'npx']);
                        if (!allowedBinaries.has(commandName)) {
                            return {
                                success: false,
                                error: 'Command not allowed'
                            };
                        }

                        const { stdout, stderr } = await execFileAsync(commandName, args, {
                            cwd: process.cwd(),
                            maxBuffer: 1024 * 1024 * 10, // 10MB
                            timeout: 60_000,
                            windowsHide: true
                        });

                        return {
                            success: true,
                            stdout: stdout,
                            stderr: stderr || null
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message,
                            stderr: error.stderr || null
                        };
                    }
                }
            },
            search_files: {
                name: 'search_files',
                description: 'Search for files by name pattern in a directory.',
                parameters: {
                    type: 'object',
                    properties: {
                        pattern: {
                            type: 'string',
                            description: 'The file name pattern to search for (supports wildcards)'
                        },
                        directory_path: {
                            type: 'string',
                            description: 'The directory to search in (defaults to current directory)'
                        }
                    },
                    required: ['pattern']
                },
                execute: async (params) => {
                    try {
                        const dirPath = params.directory_path ? path.resolve(params.directory_path) : process.cwd();
                        const pattern = params.pattern;
                        
                        // Simple glob-like search
                        const items = await fs.readdir(dirPath);
                        const matches = items.filter(item => {
                            // Convert pattern to regex
                            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
                            return regex.test(item);
                        });

                        const results = [];
                        for (const match of matches) {
                            const itemPath = path.join(dirPath, match);
                            const stat = await fs.stat(itemPath);
                            results.push({
                                name: match,
                                path: itemPath,
                                type: stat.isDirectory() ? 'directory' : 'file',
                                size: stat.size
                            });
                        }

                        return {
                            success: true,
                            matches: results,
                            count: results.length,
                            pattern: pattern
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }
            }
        };
    }

    async init() {
        // Enhanced welcome screen
        console.clear();
        console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║                                                           ║'));
        console.log(chalk.cyan.bold('║') + chalk.white.bold('   🌟  STELLAR AI - Terminal Interface  🌟   ') + chalk.cyan.bold('║'));
        console.log(chalk.cyan.bold('║                                                           ║'));
        console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════╝\n'));
        
        console.log(chalk.gray('   Your intelligent cosmic assistant with tool calling'));
        console.log(chalk.gray(`   Current directory: ${chalk.yellow(process.cwd())}\n`));

        // Initialize Puter.js with better UI
        process.stdout.write(chalk.blue('   🔌 Initializing Puter.js'));
        const hasAuth = await initPuter();
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
        
        if (puterInitialized) {
            if (hasAuth && puter && puter.auth) {
                this.puterAuthenticated = puter.auth.isSignedIn();
                if (this.puterAuthenticated) {
                    console.log(chalk.green('   ✅ Puter.js authenticated'));
                } else {
                    console.log(chalk.yellow('   ⚠️  Puter.js not authenticated. Use /login to sign in'));
                }
            } else {
                console.log(chalk.yellow('   ⚠️  Puter.js initialized but not authenticated. Use /login to sign in'));
            }
        } else {
            console.log(chalk.yellow('   ⚠️  Puter.js not available. Install: npm install @heyputer/puter.js'));
            console.log(chalk.gray('      Using fallback mode (limited functionality)'));
        }

        console.log(chalk.cyan('\n   💡 Quick Tips:'));
        console.log(chalk.gray('      • Type a message to chat'));
        console.log(chalk.gray('      • Use /help for commands'));
        console.log(chalk.gray('      • Use /agent task to run parallel tasks'));
        console.log(chalk.gray('      • Include file paths in messages for file operations\n'));

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.cyan('stellar-ai> ')
        });

        this.rl.on('line', async (input) => {
            const trimmed = input.trim();
            
            if (trimmed === '') {
                this.rl.prompt();
                return;
            }

            // Handle commands
            if (trimmed.startsWith('/')) {
                await this.handleCommand(trimmed);
            } else {
                await this.handleMessage(trimmed);
            }
        });

        this.rl.on('close', () => {
            console.log(chalk.yellow('\n👋 Goodbye!'));
            process.exit(0);
        });

        this.rl.prompt();
    }

    async handleCommand(command) {
        const parts = command.split(' ');
        const cmd = parts[0].substring(1).toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'model':
            case 'm':
                if (args.length > 0) {
                    const model = args[0];
                    if (this.availableModels.includes(model)) {
                        this.currentModel = model;
                        this.saveConfig();
                        console.log(chalk.green(`✓ Model changed to: ${model}`));
                    } else {
                        console.log(chalk.red(`✗ Invalid model. Available: ${this.availableModels.join(', ')}`));
                    }
                } else {
                    console.log(chalk.cyan(`Current model: ${this.currentModel}`));
                    console.log(chalk.gray(`Available models: ${this.availableModels.join(', ')}`));
                }
                break;

            case 'clear':
            case 'c':
                this.conversationHistory = [];
                console.log(chalk.green('✓ Conversation history cleared'));
                break;

            case 'history':
            case 'h':
                console.log(chalk.cyan('\n📜 Conversation History:'));
                this.conversationHistory.forEach((msg, i) => {
                    const role = msg.role === 'user' ? chalk.blue('You') : chalk.green('AI');
                    const preview = msg.content.substring(0, 60) + (msg.content.length > 60 ? '...' : '');
                    console.log(chalk.gray(`  ${i + 1}. [${role}] ${preview}`));
                });
                console.log('');
                break;

            case 'tools':
            case 't':
                console.log(chalk.cyan('\n🔧 Available Tools:'));
                Object.keys(this.tools).forEach(toolName => {
                    const tool = this.tools[toolName];
                    console.log(chalk.gray(`  • ${toolName}: ${tool.description}`));
                });
                console.log('');
                break;

            case 'agent':
            case 'a':
                if (args.length > 0 && args[0] === 'add') {
                    // Add a new agent
                    const agentName = args[1] || `agent-${this.agents.length + 1}`;
                    const agentModel = args[2] || this.currentModel;
                    this.agents.push({
                        name: agentName,
                        model: agentModel,
                        history: [],
                        id: Date.now() + Math.random()
                    });
                    console.log(chalk.green(`✓ Agent "${agentName}" added with model ${agentModel}`));
                } else if (args.length > 0 && args[0] === 'list') {
                    console.log(chalk.cyan('\n🤖 Active Agents:'));
                    if (this.agents.length === 0) {
                        console.log(chalk.gray('  No agents active. Use /agent add [name] [model] to add one.'));
                    } else {
                        this.agents.forEach((agent, i) => {
                            const hasTask = this.activeTasks.has(agent.id);
                            const status = hasTask ? chalk.yellow(' [Working]') : chalk.green(' [Idle]');
                            console.log(chalk.gray(`  ${i + 1}. ${agent.name} (${agent.model})${status}`));
                        });
                    }
                    console.log('');
                } else if (args.length > 0 && args[0] === 'remove' || args[0] === 'rm') {
                    const agentName = args[1];
                    const index = this.agents.findIndex(a => a.name === agentName);
                    if (index !== -1) {
                        this.agents.splice(index, 1);
                        console.log(chalk.green(`✓ Agent "${agentName}" removed`));
                    } else {
                        console.log(chalk.red(`✗ Agent "${agentName}" not found`));
                    }
                } else if (args.length > 0 && args[0] === 'task' || args[0] === 't') {
                    // Parallel task execution: /agent task [agent1,agent2,...] [task]
                    if (args.length < 3) {
                        console.log(chalk.yellow('Usage: /agent task [agent1,agent2,...] [task description]'));
                        console.log(chalk.gray('   Example: /agent task researcher,coder "Analyze the codebase and write tests"'));
                    } else {
                        const agentNames = args[1].split(',').map(n => n.trim());
                        const task = args.slice(2).join(' ');
                        await this.executeParallelTask(agentNames, task);
                    }
                } else {
                    console.log(chalk.cyan('\n🤖 Agent Commands:'));
                    console.log(chalk.gray('  /agent add [name] [model]  - Add a new agent'));
                    console.log(chalk.gray('  /agent list                 - List active agents'));
                    console.log(chalk.gray('  /agent remove [name]        - Remove an agent'));
                    console.log(chalk.gray('  /agent task [agents] [task] - Execute task with multiple agents in parallel'));
                    console.log(chalk.gray('    Example: /agent task researcher,coder "Analyze and document"'));
                    console.log('');
                }
                break;

            case 'login':
            case 'l':
                await this.handleLogin();
                break;

            case 'logout':
                await this.handleLogout();
                break;

            case 'auth':
            case 'status':
                this.showAuthStatus();
                break;

            case 'help':
            case '?':
                this.showHelp();
                break;

            case 'exit':
            case 'quit':
            case 'q':
                this.rl.close();
                return;

            default:
                console.log(chalk.red(`✗ Unknown command: ${cmd}`));
                console.log(chalk.yellow('Type /help for available commands'));
        }

        this.rl.prompt();
    }

    async handleLogin() {
        if (!puterInitialized || !puter) {
            console.log(chalk.red('✗ Puter.js is not available. Install: npm install @heyputer/puter.js'));
            return;
        }

        // Check if already authenticated first
        if (puter.auth && puter.auth.isSignedIn && puter.auth.isSignedIn()) {
            console.log(chalk.green('✅ Already authenticated!'));
            await this.saveAuthentication();
            this.puterAuthenticated = true;
            return;
        }

        // Check for saved token
        const config = await this.loadConfigData();
        if (config.puterAuthToken) {
            try {
                const { init } = require('@heyputer/puter.js/src/init.cjs');
                const testPuter = init(config.puterAuthToken);
                if (testPuter.auth && testPuter.auth.isSignedIn && testPuter.auth.isSignedIn()) {
                    console.log(chalk.green('✅ Found valid saved token!'));
                    puter = testPuter;
                    await this.saveAuthentication();
                    this.puterAuthenticated = true;
                    return;
                }
            } catch (_e) {
                // Token invalid, continue with login
            }
        }

        // Track login attempts to prevent infinite retries
        // Use a static counter that persists across login calls
        if (!StellarAICLI.loginAttempts) {
            StellarAICLI.loginAttempts = 0;
        }
        
        if (StellarAICLI.loginAttempts >= 3) {
            console.log(chalk.red('\n✗ Maximum login attempts (3) reached.'));
            console.log(chalk.yellow('   Please copy your token from the Stellar AI web page'));
            console.log(chalk.yellow('   and add it to .stellar-ai-config.json as "puterAuthToken"'));
            console.log(chalk.gray('   Or wait a moment and try /login again\n'));
            // Don't reset here - let user wait or manually reset
            return;
        }

        StellarAICLI.loginAttempts++;
        this.loginAttempts = StellarAICLI.loginAttempts;

        try {
            console.log(chalk.blue('\n🔐 Signing in to Puter.js...'));
            console.log(chalk.gray(`   Attempt ${StellarAICLI.loginAttempts}/3\n`));
            
            if (puter.auth && puter.auth.signIn) {
                // Try to get the auth URL first, then open browser manually
                let authUrl = null;
                
                // Wrap signIn in a try-catch to handle environment-specific errors
                try {
                    // Try to get auth URL if available
                    if (puter.auth.getAuthUrl) {
                        authUrl = puter.auth.getAuthUrl();
                    } else if (puter.auth.signInUrl) {
                        authUrl = puter.auth.signInUrl;
                    }
                    
                    // Open browser manually if we have a URL
                    if (authUrl) {
                        this.openBrowser(authUrl);
                        // Wait a bit for browser to open
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                    await puter.auth.signIn();
                } catch (signInError) {
                    // Handle specific errors like "screen is not defined" in headless environments
                    if (signInError.message && signInError.message.includes('screen')) {
                        // Try to open Puter.com manually
                        console.log(chalk.yellow('⚠️  Opening browser manually...'));
                        this.openBrowser('https://puter.com');
                        console.log(chalk.gray('   Please complete authentication in the browser.'));
                        console.log(chalk.gray('   Waiting for authentication...'));
                        
                        // Poll for authentication status - ONLY ONCE, max 3 attempts
                        const authenticated = await this.pollForAuthentication(3, 2000);
                        if (authenticated) {
                            StellarAICLI.loginAttempts = 0; // Reset on success
                            this.loginAttempts = 0;
                            this.puterAuthenticated = true;
                        }
                        return; // Stop here, don't retry
                    } else {
                        throw signInError;
                    }
                }
                
                // Check if signed in immediately after signIn()
                if (puter.auth.isSignedIn()) {
                    await this.saveAuthentication();
                    this.puterAuthenticated = true;
                    StellarAICLI.loginAttempts = 0; // Reset on success
                    this.loginAttempts = 0;
                    console.log(chalk.green('✅ Successfully signed in to Puter.js!'));
                } else {
                    // Only poll if signIn() didn't throw an error but also didn't authenticate
                    // This should rarely happen, but if it does, poll ONCE
                    console.log(chalk.yellow('⚠️  Waiting for browser authentication...'));
                    const authenticated = await this.pollForAuthentication(3, 2000);
                    if (authenticated) {
                        StellarAICLI.loginAttempts = 0; // Reset on success
                        this.loginAttempts = 0;
                        this.puterAuthenticated = true;
                    }
                }
            } else {
                console.log(chalk.red('✗ Authentication not available. Please check Puter.js installation.'));
            }
        } catch (error) {
            // Provide more helpful error messages
            if (error.message && error.message.includes('screen')) {
                console.error(chalk.red('✗ Login error: Browser authentication not available in this environment'));
                // Try to open browser manually anyway
                console.log(chalk.yellow('\n💡 Opening browser manually...'));
                this.openBrowser('https://puter.com');
                console.log(chalk.gray('   1. Complete authentication in the browser'));
                console.log(chalk.gray('   2. Get your auth token from the Stellar AI web page'));
                console.log(chalk.gray('   3. Add it to .stellar-ai-config.json as "puterAuthToken"'));
            } else {
                console.error(chalk.red(`✗ Login error: ${error.message}`));
            }
        }
    }
    
    openBrowser(url) {
        const platform = process.platform;
        let command;
        
        if (platform === 'win32') {
            command = `start "" "${url}"`;
        } else if (platform === 'darwin') {
            command = `open "${url}"`;
        } else {
            // Linux and others
            command = `xdg-open "${url}"`;
        }
        
        // Security: Command is safe - only opens browser with hardcoded URL pattern
        // eslint-disable-next-line security/detect-child-process
        exec(command, (error) => {
            if (error) {
                console.log(chalk.yellow(`⚠️  Could not open browser automatically. Please visit: ${url}`));
            } else {
                console.log(chalk.green(`✅ Browser opened: ${url}`));
            }
        });
    }
    
    async saveAuthentication() {
        if (puter && puter.auth && puter.auth.isSignedIn()) {
            this.puterAuthenticated = true;
            
            // Save auth token if available
            const config = await this.loadConfigData();
            if (puter.auth.getToken) {
                config.puterAuthToken = puter.auth.getToken();
            }
            await this.saveConfigData(config);
        }
    }
    
    async pollForAuthentication(maxAttempts = 3, interval = 2000) {
        // Poll only 3 times (6 seconds total) - stop if not authenticated
        console.log(chalk.blue('   🔄 Checking authentication status...'));
        console.log(chalk.gray('   Complete the sign-in process in your browser, then return here.'));
        console.log(chalk.gray('   The CLI will check 3 times (6 seconds total).\n'));
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, interval));
            
            // Check if Puter.js is now authenticated
            if (puter && puter.auth && puter.auth.isSignedIn()) {
                await this.saveAuthentication();
                console.log(chalk.green('\n✅ Authentication successful!'));
                console.log(chalk.green('   You are now signed in to Puter.js.'));
                console.log(chalk.gray('   Your authentication token has been saved.'));
                return true;
            }
            
            console.log(chalk.gray(`   Attempt ${attempt}/${maxAttempts}...`));
        }
        
        console.log(chalk.yellow('\n⚠️  Authentication not detected after 3 attempts.'));
        console.log(chalk.gray('   If you completed authentication in the browser:'));
        console.log(chalk.gray('   1. Copy your token from the Stellar AI web page'));
        console.log(chalk.gray('   2. Add it to .stellar-ai-config.json as "puterAuthToken"'));
        console.log(chalk.gray('   3. Or run /login again to retry'));
        return false;
    }

    async handleLogout() {
        if (!puterInitialized || !puter) {
            console.log(chalk.red('✗ Puter.js is not available'));
            return;
        }

        try {
            if (puter.auth && puter.auth.signOut) {
                puter.auth.signOut();
                this.puterAuthenticated = false;
                
                // Remove auth token from config
                const config = await this.loadConfigData();
                delete config.puterAuthToken;
                await this.saveConfigData(config);
                
                console.log(chalk.green('✅ Signed out from Puter.js'));
            } else {
                console.log(chalk.yellow('⚠️  Already signed out'));
            }
        } catch (error) {
            console.error(chalk.red(`✗ Logout error: ${error.message}`));
        }
    }

    showAuthStatus() {
        console.log(chalk.cyan('\n🔐 Authentication Status:'));
        console.log(chalk.gray(`   Puter.js: ${puterInitialized ? chalk.green('✓ Available') : chalk.red('✗ Not available')}`));
        console.log(chalk.gray(`   Authenticated: ${this.puterAuthenticated ? chalk.green('✓ Yes') : chalk.red('✗ No')}`));
        if (!this.puterAuthenticated && puterInitialized) {
            console.log(chalk.yellow('\n   💡 Use /login to sign in to Puter.js'));
        }
        console.log('');
    }

    async loadConfigData() {
        try {
            if (await fs.pathExists(this.configPath)) {
                return JSON.parse(await fs.readFile(this.configPath, 'utf8'));
            }
        } catch (_e) {
            // Ignore errors
        }
        return {};
    }

    async saveConfigData(config) {
        try {
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf8');
        } catch (_e) {
            // Ignore errors
        }
    }

    showHelp() {
        console.log(chalk.cyan('\n📖 Available Commands:'));
        console.log(chalk.gray('  /model [name]     - Change AI model'));
        console.log(chalk.gray('  /login            - Sign in to Puter.js'));
        console.log(chalk.gray('  /logout           - Sign out from Puter.js'));
        console.log(chalk.gray('  /auth              - Show authentication status'));
        console.log(chalk.gray('  /clear             - Clear conversation history'));
        console.log(chalk.gray('  /history           - Show conversation history'));
        console.log(chalk.gray('  /tools             - List available tools'));
        console.log(chalk.gray('  /agent add [name]  - Add a new agent'));
        console.log(chalk.gray('  /agent list        - List active agents'));
        console.log(chalk.gray('  /agent remove [n]  - Remove an agent'));
        console.log(chalk.gray('  /agent task [a] [t] - Run parallel task with agents'));
        console.log(chalk.gray('  /help              - Show this help'));
        console.log(chalk.gray('  /exit              - Exit Stellar AI'));
        console.log(chalk.gray('\n💡 Tip: You can add file paths and image paths to your messages!'));
        console.log(chalk.gray('   Example: "Read the file at ./data.txt"'));
        console.log(chalk.gray('   Example: "Analyze the image at ./photo.jpg"\n'));
    }

    async handleMessage(message) {
        // Check if message contains file paths
        const filePaths = this.extractFilePaths(message);
        
        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: message,
            filePaths: filePaths,
            timestamp: new Date().toISOString()
        });

        // Show interactive processing indicator
        const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let spinnerIndex = 0;
        const spinnerInterval = setInterval(() => {
            process.stdout.write(`\r${chalk.blue(spinner[spinnerIndex])} ${chalk.gray('Processing')} ${chalk.gray('.'.repeat((spinnerIndex % 3) + 1))}   `);
            spinnerIndex = (spinnerIndex + 1) % spinner.length;
        }, 100);

        try {
            // Get AI response with tool calling
            const response = await this.getAIResponse(message, filePaths);
            
            clearInterval(spinnerInterval);
            process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear spinner
            
            // Add AI response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response.text,
                toolsUsed: response.toolsUsed || [],
                timestamp: new Date().toISOString()
            });

            // Enhanced output formatting
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            console.log(chalk.green.bold('🤖 Stellar AI:'));
            console.log(chalk.white(response.text));
            
            if (response.toolsUsed && response.toolsUsed.length > 0) {
                console.log(chalk.gray(`\n🔧 Tools used: ${chalk.yellow(response.toolsUsed.join(', '))}`));
            }
            console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        } catch (error) {
            clearInterval(spinnerInterval);
            process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear spinner
            console.error(chalk.red(`\n✗ Error: ${error.message}`));
            console.log('');
        }

        this.rl.prompt();
    }

    extractFilePaths(message) {
        // Simple regex to find file paths
        const pathPattern = /(?:^|\s)([./]?[^\s]+\.(?:txt|js|json|py|jpg|jpeg|png|gif|pdf|md|html|css|xml|yaml|yml|csv|log|sh|bat|exe|zip|tar|gz))/gi;
        const matches = message.match(pathPattern);
        return matches ? matches.map(m => m.trim()) : [];
    }

    async getAIResponse(message, filePaths = []) {
        // Load file contents if file paths are provided
        const fileContents = {};
        for (const filePath of filePaths) {
            try {
                const resolvedPath = path.resolve(filePath);
                if (await fs.pathExists(resolvedPath)) {
                    const content = await fs.readFile(resolvedPath, 'utf8');
                    fileContents[filePath] = content.substring(0, 10000); // Limit to 10KB per file
                }
            } catch (e) {
                // Ignore errors
            }
        }

        // Prepare messages for AI
        const messages = this.conversationHistory.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Add file contents to the last message if available
        if (Object.keys(fileContents).length > 0) {
            const lastMsg = messages[messages.length - 1];
            lastMsg.content += '\n\nFile contents:\n' + 
                Object.entries(fileContents).map(([path, content]) => 
                    `\n--- ${path} ---\n${content}`
                ).join('\n');
        }

        // Prepare tools for AI
        const tools = Object.values(this.tools).map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }));

        try {
            // Try to use Puter.js API or fallback
            const response = await this.callAIAPI(messages, tools);
            
            // Check if AI wants to use tools
            if (response.tool_calls && response.tool_calls.length > 0) {
                const toolsUsed = [];
                const toolResults = [];

                for (const toolCall of response.tool_calls) {
                    const tool = this.tools[toolCall.function.name];
                    if (tool) {
                        try {
                            const params = JSON.parse(toolCall.function.arguments || '{}');
                            const result = await tool.execute(params);
                            toolResults.push({
                                tool_call_id: toolCall.id,
                                role: 'tool',
                                name: toolCall.function.name,
                                content: JSON.stringify(result)
                            });
                            toolsUsed.push(toolCall.function.name);
                        } catch (error) {
                            toolResults.push({
                                tool_call_id: toolCall.id,
                                role: 'tool',
                                name: toolCall.function.name,
                                content: JSON.stringify({ success: false, error: error.message })
                            });
                        }
                    }
                }

                // Get final response with tool results
                const finalMessages = [...messages, response, ...toolResults];
                const finalResponse = await this.callAIAPI(finalMessages, tools);
                
                return {
                    text: finalResponse.content || finalResponse.message || 'Tool execution completed.',
                    toolsUsed: toolsUsed
                };
            }

            return {
                text: response.content || response.message || response.text || 'I apologize, but I could not generate a response.',
                toolsUsed: []
            };

        } catch (_error) {
            // Fallback response
            return {
                text: this.getFallbackResponse(message),
                toolsUsed: []
            };
        }
    }

    async callAIAPI(messages, tools) {
        // Try Puter.js first if available and authenticated
        if (puterInitialized && puter && this.puterAuthenticated && puter.ai) {
            try {
                // Prepare tools for Puter.js
                const puterTools = Object.values(tools).map(tool => ({
                    type: 'function',
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters
                    }
                }));

                // Prepare messages for Puter.js
                const puterMessages = messages.map(msg => {
                    if (msg.role === 'tool') {
                        // Convert tool results to Puter format
                        return {
                            role: 'tool',
                            tool_call_id: msg.tool_call_id,
                            name: msg.name,
                            content: msg.content
                        };
                    }
                    return {
                        role: msg.role,
                        content: msg.content
                    };
                });

                // Call Puter.js AI with tool calling
                let response;
                if (puter.ai.chat) {
                    response = await puter.ai.chat(puterMessages, {
                        model: this.currentModel,
                        tools: puterTools.length > 0 ? puterTools : undefined
                    });
                } else if (puter.ai.complete) {
                    response = await puter.ai.complete({
                        messages: puterMessages,
                        model: this.currentModel,
                        tools: puterTools.length > 0 ? puterTools : undefined
                    });
                } else {
                    throw new Error('Puter.js AI methods not available');
                }

                // Handle tool calls if present
                if (response.tool_calls && response.tool_calls.length > 0) {
                    const toolsUsed = [];
                    const toolResults = [];

                    for (const toolCall of response.tool_calls) {
                        const tool = this.tools[toolCall.function.name];
                        if (tool) {
                            try {
                                const params = JSON.parse(toolCall.function.arguments || '{}');
                                const result = await tool.execute(params);
                                
                                toolResults.push({
                                    tool_call_id: toolCall.id,
                                    role: 'tool',
                                    name: toolCall.function.name,
                                    content: JSON.stringify(result)
                                });
                                toolsUsed.push(toolCall.function.name);
                            } catch (error) {
                                toolResults.push({
                                    tool_call_id: toolCall.id,
                                    role: 'tool',
                                    name: toolCall.function.name,
                                    content: JSON.stringify({ success: false, error: error.message })
                                });
                            }
                        }
                    }

                    // Get final response with tool results
                    const finalMessages = [...puterMessages, response, ...toolResults];
                    const finalResponse = await puter.ai.chat(finalMessages, {
                        model: this.currentModel
                    });

                    return {
                        content: finalResponse.content || finalResponse.message || finalResponse.text || 'Tool execution completed.',
                        toolsUsed: toolsUsed
                    };
                }

                // Return response without tool calls
                return {
                    content: response.content || response.message || response.text || 'I apologize, but I could not generate a response.',
                    toolsUsed: []
                };

            } catch (error) {
                console.error(chalk.red(`\n⚠️  Puter.js error: ${error.message}`));
                console.log(chalk.gray('   Falling back to local response...\n'));
                // Fall through to fallback
            }
        }

        // Fallback: Try to use tools heuristically
        const lastMessage = messages[messages.length - 1]?.content || '';
        
        // Simple heuristic: if message mentions files, try to use file tools
        if (lastMessage.toLowerCase().includes('read') && lastMessage.toLowerCase().includes('file')) {
            const filePathMatch = lastMessage.match(/(?:^|\s)([^\s]+\.(?:txt|js|json|py|md|html|css))/i);
            if (filePathMatch) {
                const filePath = filePathMatch[1].trim();
                try {
                    const tool = this.tools.read_file;
                    const result = await tool.execute({ file_path: filePath });
                    if (result.success) {
                        return {
                            content: `I read the file "${filePath}". Here's what it contains:\n\n${result.content.substring(0, 500)}${result.content.length > 500 ? '...' : ''}`,
                            toolsUsed: ['read_file']
                        };
                    }
                } catch (e) {
                    // Continue to fallback
                }
            }
        }

        // Final fallback response
        if (!puterInitialized || !this.puterAuthenticated) {
            return {
                content: this.getFallbackResponse(lastMessage) + '\n\n💡 Tip: Use /login to authenticate with Puter.js for full AI capabilities!',
                toolsUsed: []
            };
        }

        return {
            content: this.getFallbackResponse(lastMessage),
            toolsUsed: []
        };
    }

    getFallbackResponse(message) {
        const lower = message.toLowerCase();
        
        if (lower.includes('file') && lower.includes('read')) {
            return 'I can help you read files! Try: "Read the file at ./example.txt" or provide a file path in your message.';
        }
        
        if (lower.includes('image') || lower.includes('photo') || lower.includes('picture')) {
            return 'I can analyze images! Try: "Analyze the image at ./photo.jpg" or provide an image path.';
        }
        
        if (lower.includes('list') && lower.includes('file')) {
            return 'I can list files! Try: "List files in ./directory" or "List files in the current directory".';
        }
        
        return `I understand you said: "${message}". I'm Stellar AI, your cosmic assistant! I can help you with file operations, image analysis, and more. Try using file paths in your messages, or type /tools to see what I can do.`;
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.currentModel = config.model || this.currentModel;
                if (config.history) {
                    this.conversationHistory = config.history;
                }
            }
        } catch (_e) {
            // Ignore errors
        }
    }

    saveConfig() {
        try {
            const config = {
                model: this.currentModel,
                history: this.conversationHistory.slice(-20) // Keep last 20 messages
            };
            
            // Preserve auth token if it exists
            if (fs.existsSync(this.configPath)) {
                try {
                    const existing = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                    if (existing.puterAuthToken) {
                        config.puterAuthToken = existing.puterAuthToken;
                    }
                } catch (e) {
                    // Ignore
                }
            }
            
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch (_e) {
            // Ignore errors
        }
    }

    async executeParallelTask(agentNames, task) {
        // Find agents by name
        const selectedAgents = this.agents.filter(agent => agentNames.includes(agent.name));
        
        if (selectedAgents.length === 0) {
            console.log(chalk.red(`✗ No agents found with names: ${agentNames.join(', ')}`));
            console.log(chalk.yellow('   Use /agent list to see available agents'));
            return;
        }

        console.log(chalk.cyan(`\n🚀 Executing parallel task with ${selectedAgents.length} agent(s)...`));
        console.log(chalk.gray(`   Task: ${task}\n`));

        // Create task promises for parallel execution
        const taskPromises = selectedAgents.map(async (agent) => {
            const taskId = Date.now() + Math.random();
            this.activeTasks.set(agent.id, { taskId, startTime: Date.now(), task });
            
            try {
                console.log(chalk.blue(`   🤖 ${agent.name} (${agent.model}) starting...`));
                
                // Create a message for this agent
                const agentMessage = `As ${agent.name}, ${task}`;
                
                // Get AI response for this agent
                const response = await this.getAIResponseForAgent(agent, agentMessage);
                
                this.activeTasks.delete(agent.id);
                
                console.log(chalk.green(`   ✅ ${agent.name} completed`));
                
                return {
                    agent: agent.name,
                    model: agent.model,
                    response: response.text || response.content,
                    toolsUsed: response.toolsUsed || []
                };
            } catch (error) {
                this.activeTasks.delete(agent.id);
                console.log(chalk.red(`   ✗ ${agent.name} failed: ${error.message}`));
                return {
                    agent: agent.name,
                    model: agent.model,
                    response: `Error: ${error.message}`,
                    toolsUsed: []
                };
            }
        });

        // Execute all tasks in parallel
        const results = await Promise.all(taskPromises);

        // Display results
        console.log(chalk.cyan('\n📊 Task Results:\n'));
        results.forEach((result, _index) => {
            console.log(chalk.yellow(`━━━ ${result.agent} (${result.model}) ━━━`));
            console.log(chalk.white(result.response));
            if (result.toolsUsed.length > 0) {
                console.log(chalk.gray(`\n🔧 Tools used: ${result.toolsUsed.join(', ')}`));
            }
            console.log('');
        });

        console.log(chalk.green(`✅ All ${results.length} agent(s) completed their tasks!\n`));
    }

    async getAIResponseForAgent(agent, message) {
        // Add message to agent's history
        agent.history.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        // Prepare messages for AI (use agent's history)
        const messages = agent.history.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Prepare tools
        const tools = Object.values(this.tools).map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }));

        try {
            // Use Puter.js API with agent's model
            if (puterInitialized && puter && this.puterAuthenticated && puter.ai) {
                const puterTools = tools.map(tool => ({
                    type: 'function',
                    function: {
                        name: tool.function.name,
                        description: tool.function.description,
                        parameters: tool.function.parameters
                    }
                }));

                const puterMessages = messages.map(msg => {
                    if (msg.role === 'tool') {
                        return {
                            role: 'assistant',
                            content: msg.content
                        };
                    }
                    return msg;
                });

                let response;
                if (puter.ai.chat) {
                    response = await puter.ai.chat(puterMessages, { 
                        model: agent.model,
                        tools: puterTools 
                    });
                } else {
                    response = await puter.ai.complete({
                        model: agent.model,
                        messages: puterMessages,
                        tools: puterTools
                    });
                }

                const responseText = response.message?.content || response.content || response.text || '';
                
                // Handle tool calls if present
                if (response.tool_calls && response.tool_calls.length > 0) {
                    const toolsUsed = [];
                    const toolResults = [];

                    for (const toolCall of response.tool_calls) {
                        const tool = this.tools[toolCall.function.name];
                        if (tool) {
                            try {
                                const params = JSON.parse(toolCall.function.arguments || '{}');
                                const result = await tool.execute(params);
                                toolResults.push({
                                    tool_call_id: toolCall.id,
                                    role: 'tool',
                                    name: toolCall.function.name,
                                    content: JSON.stringify(result)
                                });
                                toolsUsed.push(toolCall.function.name);
                            } catch (error) {
                                toolResults.push({
                                    tool_call_id: toolCall.id,
                                    role: 'tool',
                                    name: toolCall.function.name,
                                    content: JSON.stringify({ success: false, error: error.message })
                                });
                            }
                        }
                    }

                    // Get final response with tool results
                    const finalMessages = [...puterMessages, response, ...toolResults];
                    const finalResponse = await puter.ai.chat(finalMessages, { 
                        model: agent.model 
                    });

                    const finalText = finalResponse.message?.content || finalResponse.content || responseText;
                    
                    // Add to agent history
                    agent.history.push({
                        role: 'assistant',
                        content: finalText,
                        toolsUsed: toolsUsed,
                        timestamp: new Date().toISOString()
                    });

                    return {
                        text: finalText,
                        toolsUsed: toolsUsed
                    };
                }

                // Add to agent history
                agent.history.push({
                    role: 'assistant',
                    content: responseText,
                    timestamp: new Date().toISOString()
                });

                return {
                    text: responseText,
                    toolsUsed: []
                };
            }

            // Fallback
            return {
                text: `I understand you want me to: ${message}`,
                toolsUsed: []
            };
        } catch (error) {
            return {
                text: `Error: ${error.message}`,
                toolsUsed: []
            };
        }
    }
}

// Run CLI
if (require.main === module) {
    const cli = new StellarAICLI();
    cli.init().catch(error => {
        console.error(chalk.red(`\n✗ Fatal error: ${error.message}`));
        process.exit(1);
    });
}

module.exports = StellarAICLI;

