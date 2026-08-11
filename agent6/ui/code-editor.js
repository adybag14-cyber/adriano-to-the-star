class CodeEditor {
  constructor(element) { this.element = element; this.value = ''; this.language = 'javascript'; }
  setValue(code) { this.value = code; this.render(); }
  getValue() { return this.value; }
  setLanguage(lang) { this.language = lang; this.render(); }
  insertText(text) { this.value += text; this.render(); }
  format() { this.value = this.value.trim(); this.render(); }
  render() { 
    if(this.element) this.element.textContent = this.value; 
  }
  onChange(callback) { this.onChangeCallback = callback; }
}
window.CodeEditor = CodeEditor;