class TreeView {
  constructor(element) { this.element = element; this.data = []; this.expanded = new Set(); this.selected = null; }
  setData(data) { this.data = data; this.render(); }
  getData() { return this.data; }
  expand(id) { this.expanded.add(id); this.render(); }
  collapse(id) { this.expanded.delete(id); this.render(); }
  toggle(id) { if (this.expanded.has(id)) this.collapse(id); else this.expand(id); }
  expandAll() { this.getAllIds(this.data).forEach(id => this.expanded.add(id)); this.render(); }
  collapseAll() { this.expanded.clear(); this.render(); }
  select(id) { this.selected = id; this.render(); if (this.selectCallback) this.selectCallback(id); }
  getSelected() { return this.selected; }
  getAllIds(nodes, ids=[]) {
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children) this.getAllIds(node.children, ids);
    });
    return ids;
  }
  onSelect(callback) { this.selectCallback = callback; }
  onExpand(callback) { this.expandCallback = callback; }
  onCollapse(callback) { this.collapseCallback = callback; }
  render() {
    if (!this.element) return;
    this.element.innerHTML = `<div class="tree-view">${this.renderNodes(this.data)}</div>`;
  }
  renderNodes(nodes, level=0) {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = this.expanded.has(node.id);
      const isSelected = this.selected === node.id;
      const indent = 'margin-left: ' + (level * 20) + 'px';
      let html = `<div class="tree-node ${isSelected ? 'selected' : ''}" data-id="${node.id}" style="${indent}">`;
      if (hasChildren) {
        html += `<span class="tree-toggle ${isExpanded ? 'expanded' : 'collapsed'}" onclick="this.parentElement.parentElement.treeView.toggle('${node.id}')">${isExpanded ? '▼' : '▶'}</span>`;
      } else {
        html += '<span class="tree-spacer"></span>';
      }
      html += `<span class="tree-label" onclick="this.parentElement.parentElement.treeView.select('${node.id}')">${node.label}</span>`;
      html += '</div>';
      if (hasChildren && isExpanded) {
        html += this.renderNodes(node.children, level + 1);
      }
      return html;
    }).join('');
  }
}
window.TreeView = TreeView;