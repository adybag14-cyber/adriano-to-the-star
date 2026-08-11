class AiTrainingPipeline {
  constructor() {
    this.steps = [];
    this.currentStep = 0;
  }
  
  addStep(name, fn) {
    this.steps.push({ name, fn });
    return this;
  }
  
  async run(data) {
    let result = data;
    const logs = [];
    
    for (let i = 0; i < this.steps.length; i++) {
      this.currentStep = i;
      const step = this.steps[i];
      
      try {
        const startTime = Date.now();
        result = await step.fn(result);
        const duration = Date.now() - startTime;
        
        logs.push({
          step: step.name,
          status: 'success',
          duration,
          timestamp: Date.now()
        });
      } catch (error) {
        logs.push({
          step: step.name,
          status: 'failed',
          error: error.message,
          timestamp: Date.now()
        });
        throw error;
      }
    }
    
    return { result, logs };
  }
  
  getProgress() {
    return this.currentStep / this.steps.length;
  }
}

window.AiTrainingPipeline = AiTrainingPipeline;