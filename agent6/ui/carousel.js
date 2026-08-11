class Carousel {
  constructor(element) { this.element = element; this.items = []; this.current = 0; this.autoPlay = false; this.interval = null; }
  addItem(content) { this.items.push(content); this.render(); }
  removeItem(index) { this.items.splice(index, 1); if (this.current >= this.items.length) this.current = Math.max(0, this.items.length - 1); this.render(); }
  next() { this.current = (this.current + 1) % this.items.length; this.render(); }
  previous() { this.current = (this.current - 1 + this.items.length) % this.items.length; this.render(); }
  goTo(index) { this.current = index; this.render(); }
  startAutoPlay(interval=3000) { 
    this.autoPlay = true; 
    this.interval = setInterval(() => this.next(), interval); 
  }
  stopAutoPlay() { 
    this.autoPlay = false; 
    if (this.interval) clearInterval(this.interval); 
  }
  getCurrent() { return this.current; }
  getCurrentItem() { return this.items[this.current]; }
  onSlide(callback) { this.slideCallback = callback; }
  render() {
    if (!this.element) return;
    const content = this.items[this.current] || '';
    this.element.innerHTML = `<div class="carousel-content">${content}</div>`;
  }
}
window.Carousel = Carousel;