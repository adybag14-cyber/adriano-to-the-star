/* global navigator */

// Stellar AI Enhancements
// Adds: Markdown rendering, code syntax highlighting, chat templates

class StellarAIEnhancements {
    constructor(stellarAIInstance) {
        this.stellarAI = stellarAIInstance;
        this.chatTemplates = this.loadTemplates();
        this.init();
    }

    init() {
        this.enhanceMarkdownRendering();
        this.addCodeHighlighting();
        this.addChatTemplates();
        this.addCopyCodeButton();
    }

    // Enhanced markdown rendering with full support
    enhanceMarkdownRendering() {
        const originalFormatText = this.stellarAI.formatText.bind(this.stellarAI);
        
        this.stellarAI.formatText = (text) => {
            if (!text) return '';
            
            // First escape HTML to prevent XSS
            const escaped = this.stellarAI.escapeHtml(text);
            
            // Enhanced markdown processing
            let formatted = escaped;
            
            // Code blocks (must come before other replacements)
            // eslint-disable-next-line security/detect-unsafe-regex
            formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const language = lang || 'text';
                return `<pre class="code-block"><code class="language-${language}" data-language="${language}">${this.escapeHtml(code.trim())}</code></pre>`;
            });
            
            // Inline code (must come after code blocks)
            formatted = formatted.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');
            
            // Headers
            formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
            formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');
            formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');
            
            // Bold and italic (bold first to avoid conflicts)
            formatted = formatted.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
            formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
            formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
            formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
            
            // Strikethrough
            formatted = formatted.replace(/~~(.*?)~~/g, '<del>$1</del>');
            
            // Links
            formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>');
            
            // Images
            formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image" loading="lazy">');
            
            // Blockquotes
            formatted = formatted.replace(/^> (.+)$/gim, '<blockquote class="markdown-quote">$1</blockquote>');
            
            // Horizontal rules
            formatted = formatted.replace(/^---$/gim, '<hr class="markdown-hr">');
            formatted = formatted.replace(/^\*\*\*$/gim, '<hr class="markdown-hr">');
            
            // Tables (basic support)
            // eslint-disable-next-line security/detect-unsafe-regex
            formatted = formatted.replace(/\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
                const headers = header.split('|').map(h => h.trim()).filter(h => h);
                const headerRow = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
                const rowLines = rows.trim().split('\n');
                const bodyRows = rowLines.map(row => {
                    const cells = row.split('|').map(c => c.trim()).filter(c => c);
                    return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
                }).join('');
                return `<table class="markdown-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
            });
            
            // Lists (ordered and unordered)
            formatted = formatted.replace(/^\d+\. (.+)$/gim, '<li class="markdown-list-item">$1</li>');
            formatted = formatted.replace(/^[-*+] (.+)$/gim, '<li class="markdown-list-item">$1</li>');
            
            // Wrap consecutive <li> in <ul> or <ol>
            // eslint-disable-next-line security/detect-unsafe-regex
            formatted = formatted.replace(/(<li class="markdown-list-item">.*?<\/li>(?:\s*<br>)?)+/g, (match) => {
                const isOrdered = match.match(/^\d+\./);
                const tag = isOrdered ? 'ol' : 'ul';
                return `<${tag} class="markdown-list">${match.replace(/<br>/g, '')}</${tag}>`;
            });
            
            // Line breaks (preserve double newlines as paragraphs)
            formatted = formatted.replace(/\n\n/g, '</p><p class="markdown-paragraph">');
            formatted = formatted.replace(/\n/g, '<br>');
            
            // Wrap in paragraph tags if not already wrapped
            if (!formatted.startsWith('<')) {
                formatted = '<p class="markdown-paragraph">' + formatted;
            }
            if (!formatted.endsWith('>')) {
                formatted = formatted + '</p>';
            }
            
            return formatted;
        };
    }

    // Add syntax highlighting for code blocks using Prism.js
    addCodeHighlighting() {
        // Load Prism.js from CDN if not already loaded
        if (!document.querySelector('link[href*="prism"]') && !window.Prism) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
            document.head.appendChild(link);
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js';
            script.onload = () => {
                // Load common language components
                ['javascript', 'python', 'html', 'css', 'json', 'bash', 'sql', 'markdown'].forEach(lang => {
                    const langScript = document.createElement('script');
                    langScript.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${lang}.min.js`;
                    document.head.appendChild(langScript);
                });
            };
            document.head.appendChild(script);
        }
        
        // Enhanced highlighting function
        const highlightCode = (code, language) => {
            if (!code) return code;
            
            // Use Prism if available, otherwise fallback to basic highlighting
            if (window.Prism && window.Prism.highlight) {
                try {
                    const lang = language || 'text';
                    return window.Prism.highlight(code, window.Prism.languages[lang] || window.Prism.languages.text, lang);
                } catch (e) {
                    console.warn('Prism highlighting failed, using fallback:', e);
                }
            }
            
            // Fallback: Enhanced basic highlighting
            const keywords = {
                'javascript': ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'async', 'await', 'class', 'extends', 'import', 'export', 'default', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'static', 'public', 'private', 'protected'],
                'python': ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'async', 'await', 'lambda', 'yield', 'pass', 'break', 'continue'],
                'html': ['<div', '<span', '<p', '<h1', '<h2', '<h3', '<a', '<img', '<script', '<style', '<body', '<head', '<html', '<meta', '<link', '<title'],
                'css': ['color', 'background', 'margin', 'padding', 'border', 'display', 'flex', 'grid', 'position', 'width', 'height', 'font', 'text', 'align', 'justify', 'center', 'left', 'right']
            };
            
            const langKeywords = keywords[language] || [];
            let highlighted = this.escapeHtml(code);
            
            if (langKeywords.length > 0) {
                langKeywords.forEach(keyword => {
                    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
                    highlighted = highlighted.replace(regex, `<span class="code-keyword">${keyword}</span>`);
                });
            }
            
            // Highlight strings
            // eslint-disable-next-line security/detect-unsafe-regex
            highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="code-string">$&</span>');
            
            // Highlight numbers
            highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="code-number">$&</span>');
            
            // Highlight comments
            if (language === 'javascript' || language === 'python') {
                highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="code-comment">$&</span>');
                highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, '<span class="code-comment">$&</span>');
            }
            if (language === 'python') {
                highlighted = highlighted.replace(/#.*$/gm, '<span class="code-comment">$&</span>');
            }
            
            return highlighted;
        };
        
        // Apply highlighting after messages are rendered
        const originalRender = this.stellarAI.renderMessages.bind(this.stellarAI);
        this.stellarAI.renderMessages = (messages) => {
            originalRender(messages);
            setTimeout(() => {
                document.querySelectorAll('.code-block code').forEach(block => {
                    const code = block.textContent;
                    const language = block.dataset.language || block.className.match(/language-(\w+)/)?.[1] || 'text';
                    block.innerHTML = highlightCode(code, language);
                    block.className = `language-${language}`;
                });
            }, 100);
        };
        
        const originalAppend = this.stellarAI.appendMessage.bind(this.stellarAI);
        this.stellarAI.appendMessage = (message) => {
            originalAppend(message);
            setTimeout(() => {
                document.querySelectorAll('.message:last-child .code-block code').forEach(block => {
                    const code = block.textContent;
                    const language = block.dataset.language || block.className.match(/language-(\w+)/)?.[1] || 'text';
                    block.innerHTML = highlightCode(code, language);
                    block.className = `language-${language}`;
                });
            }, 100);
        };
    }

    // Add copy code button to code blocks
    addCopyCodeButton() {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.code-block').forEach(block => {
                if (block.querySelector('.copy-code-btn')) return;
                
                const btn = document.createElement('button');
                btn.className = 'copy-code-btn';
                btn.textContent = '📋 Copy';
                btn.title = 'Copy code';
                btn.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(186, 148, 79, 0.3); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.25rem 0.5rem; border-radius: 5px; cursor: pointer; font-size: 0.75rem;';
                
                btn.addEventListener('click', () => {
                    const code = block.querySelector('code').textContent;
                    navigator.clipboard.writeText(code).then(() => {
                        btn.textContent = '✅ Copied!';
                        setTimeout(() => {
                            btn.textContent = '📋 Copy';
                        }, 2000);
                    });
                });
                
                block.style.position = 'relative';
                block.appendChild(btn);
            });
        });
        
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            observer.observe(messagesContainer, { childList: true, subtree: true });
        }
    }

    // Chat templates/presets
    loadTemplates() {
        return [
            {
                name: 'Exoplanet Research',
                prompt: 'Help me research exoplanets. I want to know about:\n- Habitable zone planets\n- Gas giants\n- Discovery methods\n- Recent findings'
            },
            {
                name: 'Kepler Mission',
                prompt: 'Tell me about the Kepler Space Telescope mission:\n- What did it discover?\n- How many exoplanets?\n- Key findings'
            },
            {
                name: 'Andromeda Galaxy',
                prompt: 'Explain the Andromeda Galaxy (M31):\n- Distance from Earth\n- Size and composition\n- Future collision with Milky Way'
            },
            {
                name: 'Planet Comparison',
                prompt: 'Compare different types of exoplanets:\n- Earth-like vs Super-Earths\n- Gas giants vs Mini-Neptunes\n- Habitability factors'
            },
            {
                name: 'Space Exploration',
                prompt: 'Discuss space exploration:\n- Current missions\n- Future plans\n- Challenges and opportunities'
            }
        ];
    }

    addChatTemplates() {
        const inputContainer = document.querySelector('.input-container');
        if (!inputContainer) return;

        const templatesHTML = `
            <div id="chat-templates" style="margin-bottom: 1rem;">
                <button id="show-templates-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                    📝 Chat Templates
                </button>
                <div id="templates-dropdown" style="display: none; position: absolute; bottom: 100%; left: 0; right: 0; margin-bottom: 0.5rem; background: rgba(0, 0, 0, 0.95); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; padding: 1rem; max-height: 300px; overflow-y: auto; z-index: 1000;">
                    ${this.chatTemplates.map(template => `
                        <div class="template-item" style="padding: 0.75rem; margin-bottom: 0.5rem; background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" data-prompt="${this.escapeHtml(template.prompt)}">
                            <div style="font-weight: 600; color: #ba944f; margin-bottom: 0.25rem;">${this.escapeHtml(template.name)}</div>
                            <div style="font-size: 0.85rem; opacity: 0.8; white-space: pre-wrap;">${this.escapeHtml(template.prompt.substring(0, 100))}${template.prompt.length > 100 ? '...' : ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        inputContainer.insertAdjacentHTML('afterbegin', templatesHTML);

        const showBtn = document.getElementById('show-templates-btn');
        const dropdown = document.getElementById('templates-dropdown');
        
        if (showBtn && dropdown) {
            showBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });

            document.querySelectorAll('.template-item').forEach(item => {
                item.addEventListener('click', () => {
                    const prompt = item.dataset.prompt;
                    const messageInput = document.getElementById('message-input');
                    if (messageInput) {
                        messageInput.value = prompt;
                        messageInput.focus();
                        dropdown.style.display = 'none';
                    }
                });
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!inputContainer.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize enhancements when Stellar AI is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.stellarAI) {
                window.stellarAIEnhancements = new StellarAIEnhancements(window.stellarAI);
            }
        }, 2000);
    });
}

