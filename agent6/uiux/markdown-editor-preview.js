class MarkdownEditorPreview {
  constructor() {}
  async init() {}
  render(text) {
    let s = String(text || "");
    s = s.replace(/^######\s?(.*)$/gm, '<h6>$1<\/h6>');
    s = s.replace(/^#####\s?(.*)$/gm, '<h5>$1<\/h5>');
    s = s.replace(/^####\s?(.*)$/gm, '<h4>$1<\/h4>');
    s = s.replace(/^###\s?(.*)$/gm, '<h3>$1<\/h3>');
    s = s.replace(/^##\s?(.*)$/gm, '<h2>$1<\/h2>');
    s = s.replace(/^#\s?(.*)$/gm, '<h1>$1<\/h1>');
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>');
    s = s.replace(/\*(.*?)\*/g, '<em>$1<\/em>');
    s = s.replace(/`([^`]+)`/g, '<code>$1<\/code>');
    s = s.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1<\/a>');
    s = s.replace(/^(?!<h\d>)(.+)$/gm, '<p>$1<\/p>');
    return s;
  }
}
window.MarkdownEditorPreview = MarkdownEditorPreview;
