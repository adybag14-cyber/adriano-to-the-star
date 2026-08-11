class MarkdownEditor {
  constructor(element) { this.element = element; this.markdown = ''; this.preview = null; }
  setMarkdown(text) { this.markdown = text; this.updatePreview(); }
  getMarkdown() { return this.markdown; }
  toHTML() { return this.markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); }
  updatePreview() { 
    if(this.preview) this.preview.innerHTML = this.toHTML(); 
  }
  insertHeading(level) { this.insertText('\n' + '#'.repeat(level) + ' '); }
  insertList(items) { this.insertText('\n' + items.map(i => `- ${i}`).join('\n')); }
  insertCode(code, lang='') { this.insertText(`\n\`\`\`${lang}\n${code}\n\`\`\`\n`); }
  insertText(text) { this.markdown += text; this.updatePreview(); }
  render() { if(this.element) this.element.value = this.markdown; }
}
window.MarkdownEditor = MarkdownEditor;