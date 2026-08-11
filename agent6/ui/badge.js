class Badge {
  constructor(element) { this.element = element; this.text = ''; this.type = 'default'; this.pill = false; this.max = 99; }
  setText(text) { this.text = text; this.render(); }
  getText() { return this.text; }
  setType(type) { this.type = type; this.render(); }
  getType() { return this.type; }
  setPill(pill) { this.pill = pill; this.render(); }
  isPill() { return this.pill; }
  setMax(max) { this.max = max; this.render(); }
  getMax() { return this.max; }
  setCount(count) { 
    if (typeof count === 'number') {
      this.text = count > this.max ? `${this.max}+` : count.toString();
    } else {
      this.text = count;
    }
    this.render();
  }
  increment(amount=1) {
    const current = parseInt(this.text) || 0;
    this.setCount(current + amount);
  }
  decrement(amount=1) {
    const current = parseInt(this.text) || 0;
    this.setCount(Math.max(0, current - amount));
  }
  reset() { this.setCount(0); }
  render() {
    if (!this.element) return;
    const pillClass = this.pill ? 'badge-pill' : '';
    this.element.innerHTML = `<span class="badge badge-${this.type} ${pillClass}">${this.text}</span>`;
  }
}
window.Badge = Badge;