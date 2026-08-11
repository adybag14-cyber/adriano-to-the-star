class RichTextEditor {
  constructor(element) { this.element = element; this.content = ''; }
  bold() { this.wrapSelection('**'); }
  italic() { this.wrapSelection('*'); }
  underline() { this.wrapSelection('<u>', '</u>'); }
  insertLink(url, text) { this.insertText(`[${text}](${url})`); }
  insertImage(url, alt) { this.insertText(`![${alt}](${url})`); }
  setContent(html) { this.content = html; this.render(); }
  getContent() { return this.content; }
  wrapSelection(prefix, suffix=prefix) { this.insertText(prefix + this.getSelection() + suffix); }
  insertText(text) { this.content += text; this.render(); }
  getSelection() { return 'selected'; }
  render() { if(this.element) this.element.innerHTML = this.content; }
}
window.RichTextEditor = RichTextEditor;