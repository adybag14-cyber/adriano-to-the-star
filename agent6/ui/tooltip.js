class Tooltip {
  constructor() { this.tooltips = new Map(); this.delay = 500; this.hideDelay = 200; }
  attach(element, content, options={}) {
    const tooltip = {
      element,
      content,
      position: options.position || 'top',
      delay: options.delay || this.delay,
      hideDelay: options.hideDelay || this.hideDelay,
      showTimer: null,
      hideTimer: null,
      visible: false
    };
    this.tooltips.set(element, tooltip);
    element.addEventListener('mouseenter', () => this.show(tooltip));
    element.addEventListener('mouseleave', () => this.hide(tooltip));
    element.addEventListener('focus', () => this.show(tooltip));
    element.addEventListener('blur', () => this.hide(tooltip));
  }
  show(tooltip) {
    if (tooltip.hideTimer) clearTimeout(tooltip.hideTimer);
    tooltip.showTimer = setTimeout(() => {
      this.render(tooltip);
      tooltip.visible = true;
    }, tooltip.delay);
  }
  hide(tooltip) {
    if (tooltip.showTimer) clearTimeout(tooltip.showTimer);
    tooltip.hideTimer = setTimeout(() => {
      this.remove(tooltip);
      tooltip.visible = false;
    }, tooltip.hideDelay);
  }
  render(tooltip) {
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.textContent = tooltip.content;
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.backgroundColor = '#333';
    tooltipEl.style.color = '#fff';
    tooltipEl.style.padding = '8px 12px';
    tooltipEl.style.borderRadius = '4px';
    tooltipEl.style.fontSize = '14px';
    tooltipEl.style.zIndex = '1000';
    tooltipEl.style.pointerEvents = 'none';
    const rect = tooltip.element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    switch (tooltip.position) {
      case 'top':
        tooltipEl.style.left = (rect.left + scrollLeft + rect.width / 2) + 'px';
        tooltipEl.style.top = (rect.top + scrollTop - 10) + 'px';
        tooltipEl.style.transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        tooltipEl.style.left = (rect.left + scrollLeft + rect.width / 2) + 'px';
        tooltipEl.style.top = (rect.bottom + scrollTop + 10) + 'px';
        tooltipEl.style.transform = 'translate(-50%, 0)';
        break;
      case 'left':
        tooltipEl.style.left = (rect.left + scrollLeft - 10) + 'px';
        tooltipEl.style.top = (rect.top + scrollTop + rect.height / 2) + 'px';
        tooltipEl.style.transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        tooltipEl.style.left = (rect.right + scrollLeft + 10) + 'px';
        tooltipEl.style.top = (rect.top + scrollTop + rect.height / 2) + 'px';
        tooltipEl.style.transform = 'translate(0, -50%)';
        break;
    }
    document.body.appendChild(tooltipEl);
    tooltip.element.tooltipEl = tooltipEl;
  }
  remove(tooltip) {
    if (tooltip.element.tooltipEl) {
      document.body.removeChild(tooltip.element.tooltipEl);
      tooltip.element.tooltipEl = null;
    }
  }
  detach(element) {
    const tooltip = this.tooltips.get(element);
    if (tooltip) {
      this.remove(tooltip);
      this.tooltips.delete(element);
    }
  }
  setGlobalDelay(delay) {
    this.delay = delay;
  }
}
window.Tooltip = Tooltip;