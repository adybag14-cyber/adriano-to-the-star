class AiModelRetraining {
  constructor() {}
  async init() {}
  schedule(modelId, afterMs) { return { modelId:String(modelId), at: Date.now()+Number(afterMs||0) }; }
}
window.AiModelRetraining = AiModelRetraining;
