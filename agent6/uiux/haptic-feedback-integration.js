class HapticFeedbackIntegration {
  constructor() {}
  async init() {}
  vibrate(ms) { if (navigator.vibrate) navigator.vibrate(Math.max(0, Number(ms||50))); }
}
window.HapticFeedbackIntegration = HapticFeedbackIntegration;
