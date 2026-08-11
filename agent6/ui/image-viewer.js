class ImageViewer {
  constructor(element) { this.element = element; this.src = ''; this.zoom = 1; this.rotation = 0; }
  load(src) { this.src = src; this.render(); }
  zoomIn(factor=1.2) { this.zoom *= factor; this.render(); }
  zoomOut(factor=1.2) { this.zoom /= factor; this.render(); }
  resetZoom() { this.zoom = 1; this.render(); }
  rotate(degrees=90) { this.rotation = (this.rotation + degrees) % 360; this.render(); }
  flipHorizontal() { this.flipped = !this.flipped; this.render(); }
  flipVertical() { this.flippedY = !this.flippedY; this.render(); }
  getDimensions() { return { width: 800, height: 600 }; }
  render() { 
    if(this.element) {
      this.element.src = this.src;
      this.element.style.transform = `scale(${this.zoom}) rotate(${this.rotation}deg) scaleX(${this.flipped?-1:1}) scaleY(${this.flippedY?-1:1})`;
    }
  }
}
window.ImageViewer = ImageViewer;