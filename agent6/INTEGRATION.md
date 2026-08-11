# Agent 6 Module Integration Guide

## Overview
Agent 6 provides 300+ production-ready modules across 7 categories. This guide explains how to integrate these modules into your main project.

## Integration Options

### Option 1: Direct Import (Recommended)
Keep modules in `agent6/` directory and import as needed:

```html
<!-- In your main HTML file -->
<script src="agent6/aiml/lead-scoring.js"></script>
<script src="agent6/security/iam-system.js"></script>
<script src="agent6/blockchain/blockchain-wallet.js"></script>
```

### Option 2: Move to Existing Structure
Move modules to your existing directories:
- `agent6/aiml/*` → `ai/`
- `agent6/security/*` → `security/`
- `agent6/blockchain/*` → `blockchain/`
- `agent6/analytics/*` → `analytics/`
- `agent6/performance/*` → `performance/`
- `agent6/ui/*` → `ui/`
- `agent6/uiux/*` → `uiux/`

### Option 3: Module Registry
Create a central module registry:

```javascript
// modules.js
window.ModuleRegistry = {
  // AI/ML
  LeadScoring: window.LeadScoring,
  CustomerLifetimeValue: window.CustomerLifetimeValue,
  
  // Security
  IamSystem: window.IamSystem,
  SiemSystem: window.SiemSystem,
  
  // Blockchain
  BlockchainWallet: window.BlockchainWallet,
  SmartContractMonitoring: window.SmartContractMonitoring,
  
  // Add more mappings...
};
```

## Usage Examples

### Basic Usage
```javascript
// Lead scoring
const leadScorer = new LeadScoring();
const score = leadScorer.score({ activity: 0.8, fit: 0.6, intent: 0.9 });

// IAM system
const iam = new IamSystem();
iam.addPermission('read');
iam.addRole('viewer', ['read']);
const canRead = iam.can('user1', 'read');

// Blockchain wallet
const wallet = new BlockchainWallet();
await wallet.generate();
const signature = await wallet.sign('message');
```

### Advanced Integration
```javascript
// Create a unified API
class Agent6API {
  constructor() {
    this.modules = {
      ai: {
        leadScoring: new LeadScoring(),
        churnPrediction: new CustomerChurnPrediction(),
        recommendation: new RecommendationEngine()
      },
      security: {
        iam: new IamSystem(),
        mfa: new MfaSystem(),
        auditLog: new SecurityAuditLog()
      },
      blockchain: {
        wallet: new BlockchainWallet(),
        explorer: new BlockchainExplorer(),
        nft: new NftMinting()
      }
    };
  }
  
  // Add your custom methods
  async processLead(leadData) {
    const score = this.modules.ai.leadScoring.score(leadData);
    const churnRisk = this.modules.ai.churnPrediction.probability(leadData);
    return { score, churnRisk };
  }
}

// Usage
const agent6 = new Agent6API();
const result = await agent6.processLead(customerData);
```

## Integration Steps

### 1. Choose Integration Method
- **Keep in agent6/**: Easiest, minimal changes
- **Move to existing**: Better organization, requires file moves
- **Module registry**: Most flexible, requires setup

### 2. Update Build System
If using webpack/rollup, add to your config:

```javascript
// webpack.config.js
module.exports = {
  entry: {
    main: './src/index.js',
    agent6: './agent6/index.js' // Optional: create bundle
  }
};
```

### 3. Create Integration Layer
```javascript
// agent6-integration.js
export class Agent6Integration {
  constructor() {
    this.initializeModules();
  }
  
  initializeModules() {
    // Initialize only the modules you need
    this.leadScoring = new LeadScoring();
    this.iamSystem = new IamSystem();
    this.blockchainWallet = new BlockchainWallet();
  }
  
  // Your custom business logic
  async authenticateAndScore(userData) {
    const canAccess = this.iamSystem.can(userData.id, 'access_lead_data');
    if (!canAccess) throw new Error('Access denied');
    
    return this.leadScoring.score(userData);
  }
}
```

### 4. Update Package.json
```json
{
  "scripts": {
    "build:agent6": "webpack --config agent6/webpack.config.js",
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:agent6\""
  }
}
```

## Testing Integration

### 1. Basic Module Test
```javascript
// test-agent6-integration.js
describe('Agent6 Integration', () => {
  test('Lead scoring module works', () => {
    const scorer = new LeadScoring();
    const score = scorer.score({ activity: 0.5, fit: 0.7, intent: 0.8 });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
  
  test('IAM system works', () => {
    const iam = new IamSystem();
    iam.addPermission('test');
    iam.addRole('tester', ['test']);
    iam.addUser('user1', ['tester']);
    expect(iam.can('user1', 'test')).toBe(true);
  });
});
```

### 2. Integration Test
```javascript
// test-integration.js
describe('Full Integration', () => {
  test('Agent6 modules work together', async () => {
    const integration = new Agent6Integration();
    
    // Test your custom integration methods
    const result = await integration.authenticateAndScore({
      id: 'user123',
      activity: 0.8,
      fit: 0.7,
      intent: 0.9
    });
    
    expect(result).toBeGreaterThan(0.7);
  });
});
```

## Performance Considerations

### Lazy Loading
```javascript
// Lazy load modules when needed
class LazyAgent6 {
  async getModule(moduleName) {
    if (!this.modules[moduleName]) {
      await this.loadModule(moduleName);
    }
    return this.modules[moduleName];
  }
  
  async loadModule(moduleName) {
    switch(moduleName) {
      case 'leadScoring':
        await import('./agent6/aiml/lead-scoring.js');
        this.modules.leadScoring = new LeadScoring();
        break;
      // Add more cases...
    }
  }
}
```

### Tree Shaking
Only import modules you actually use:

```javascript
// ❌ Don't do this
import * as Agent6 from 'agent6';

// ✅ Do this instead
import { LeadScoring } from 'agent6/aiml/lead-scoring.js';
import { IamSystem } from 'agent6/security/iam-system.js';
```

## Security Considerations

### 1. Validate Module Usage
```javascript
class SecureAgent6 {
  validateModuleAccess(user, module) {
    const allowedModules = this.getUserAllowedModules(user);
    if (!allowedModules.includes(module)) {
      throw new Error('Module access denied');
    }
  }
  
  getUserAllowedModules(user) {
    // Your security logic here
    return user.permissions.modules || [];
  }
}
```

### 2. Input Validation
```javascript
class ValidatedLeadScoring extends LeadScoring {
  score(lead) {
    this.validateLead(lead);
    return super.score(lead);
  }
  
  validateLead(lead) {
    if (!lead || typeof lead !== 'object') {
      throw new Error('Invalid lead data');
    }
    // Add more validation...
  }
}
```

## Monitoring

### Usage Tracking
```javascript
class MonitoredAgent6 {
  constructor(analytics) {
    this.analytics = analytics;
    this.moduleUsage = new Map();
  }
  
  trackModuleUsage(moduleName, method, duration) {
    this.analytics.track('agent6_module_usage', {
      module: moduleName,
      method: method,
      duration: duration,
      timestamp: Date.now()
    });
  }
}
```

## Troubleshooting

### Common Issues

1. **Module not found**: Check file paths and ensure modules are loaded
2. **Class not defined**: Ensure script tags are in correct order
3. **Performance issues**: Implement lazy loading for large modules
4. **Memory leaks**: Properly dispose of module instances

### Debug Mode
```javascript
class DebugAgent6 {
  constructor(debug = false) {
    this.debug = debug;
    this.logs = [];
  }
  
  log(module, action, data) {
    if (this.debug) {
      console.log(`[Agent6:${module}] ${action}:`, data);
      this.logs.push({ module, action, data, timestamp: Date.now() });
    }
  }
}
```

## Next Steps

1. **Choose integration method** based on your project structure
2. **Set up testing** for integrated modules
3. **Implement monitoring** for production usage
4. **Add security layers** as needed
5. **Optimize performance** with lazy loading/tree shaking

## Support

For integration help:
- Check the live demo at `/agent6/index.html`
- Review module documentation in individual files
- Test with the smoke test page at `/agent6/smoke.html`
- Use the integration examples above as starting points