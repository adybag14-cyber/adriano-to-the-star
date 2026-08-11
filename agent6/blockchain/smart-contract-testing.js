class SmartContractTesting {
  constructor() { this.tests = []; this.results = []; }
  add(name, testFunction) {
    this.tests.push({ name, test: testFunction, status: 'pending' });
    return this.tests.length - 1;
  }
  async run() {
    this.results = [];
    for (const testCase of this.tests) {
      const start = Date.now();
      try {
        await testCase.test();
        const duration = Date.now() - start;
        this.results.push({
          name: testCase.name,
          ok: true,
          duration,
          error: null
        });
        testCase.status = 'passed';
      } catch (error) {
        const duration = Date.now() - start;
        this.results.push({
          name: testCase.name,
          ok: false,
          duration,
          error: error.message
        });
        testCase.status = 'failed';
      }
    }
    return this.results;
  }
  getResults() {
    return this.results;
  }
  getPassed() {
    return this.results.filter(r => r.ok);
  }
  getFailed() {
    return this.results.filter(r => !r.ok);
  }
  getStats() {
    const passed = this.getPassed().length;
    const failed = this.getFailed().length;
    const total = this.results.length;
    const duration = this.results.reduce((sum, r) => sum + r.duration, 0);
    return { total, passed, failed, duration, passRate: total > 0 ? passed / total : 0 };
  }
  clear() {
    this.tests = [];
    this.results = [];
  }
}
window.SmartContractTesting = SmartContractTesting;