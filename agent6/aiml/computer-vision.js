class ComputerVision {
  detectObjects(image) { return [{ label: 'person', confidence: 0.9, box: [10,10,50,50] }]; }
  classifyImage(image) { return [{ label: 'cat', confidence: 0.95 }]; }
  extractText(image) { return 'sample text'; }
  estimatePose(image) { return { keypoints: [{x:100,y:100,score:0.9}] }; }
  segmentImage(image) { return { mask: new Uint8Array(100), labels: ['bg','fg'] }; }
}
window.ComputerVision = ComputerVision;