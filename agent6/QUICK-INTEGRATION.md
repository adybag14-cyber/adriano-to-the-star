# Agent 6 Quick Integration Guide

## 🚀 One-Line Integration

Add this to your main HTML file:

```html
<script src="agent6/modules.js"></script>
```

## 📋 Usage Examples

### Lead Scoring
```javascript
const scorer = new LeadScoring();
const score = scorer.score({activity: 0.8, fit: 0.6, intent: 0.9});
console.log(`Lead score: ${score.toFixed(2)}`);
```

### IAM System
```javascript
const iam = new IamSystem();
iam.addPermission('read');
iam.addRole('viewer', ['read']);
iam.addUser('user1', ['viewer']);
const canRead = iam.can('user1', 'read'); // true
```

### Blockchain Wallet
```javascript
const wallet = new BlockchainWallet();
await wallet.generate();
const signature = await wallet.sign('message');
const verified = await wallet.verify('message', signature); // true
```

### Computer Vision
```javascript
const cv = new ComputerVision();
const objects = cv.detectObjects(imageData);
console.log(`Found ${objects.length} objects`);
```

## 🎯 Available Modules

| Category | Count | Key Modules |
|----------|--------|-------------|
| **AI/ML** | 50+ | Lead Scoring, NLP, Computer Vision, GANs, VAEs |
| **Analytics** | 30+ | Regression, Clustering, Time Series, A/B Testing |
| **Blockchain** | 30+ | Wallets, Smart Contracts, NFTs, DeFi, Privacy Coins |
| **Security** | 40+ | IAM, SIEM, MFA, Compliance, Threat Intelligence |
| **Performance** | 20+ | Monitoring, Caching, Load Testing, Optimization |
| **UI Components** | 30+ | Editors, Media Players, Forms, Navigation |
| **UI/UX Features** | 50+ | Accessibility, Animations, Gestures, Dark Mode |

## 🔧 Integration Options

### Option 1: Load All Modules
```javascript
await window.Agent6ModuleLoader.loadAll();
```

### Option 2: Load by Category
```javascript
await window.Agent6ModuleLoader.loadCategory('aiml');
await window.Agent6ModuleLoader.loadCategory('security');
```

### Option 3: Load Specific Modules
```javascript
await window.Agent6ModuleLoader.loadModule('aiml', 'lead-scoring.js');
await window.Agent6ModuleLoader.loadModule('security', 'iam-system.js');
```

## 🧪 Testing

Visit these test pages to verify everything works:
- `agent6/index.html` - Beautiful demo page
- `agent6/smoke-clean.html` - Clean smoke test
- `agent6/test-modules.html` - Module loader test

## 📁 File Structure
```
agent6/
├── modules.js              # Smart module loader
├── index.html             # Beautiful demo page
├── smoke-clean.html       # Clean test page
├── test-modules.html      # Module loader test
├── aiml/                  # AI/ML modules (50+)
├── analytics/             # Analytics modules (30+)
├── blockchain/            # Blockchain modules (30+)
├── performance/           # Performance modules (20+)
├── security/              # Security modules (40+)
├── ui/                    # UI component modules (30+)
└── uiux/                  # UI/UX feature modules (50+)
```

## ⚡ Performance Tips

1. **Lazy Loading**: Only load modules you need
2. **Category Loading**: Load entire categories at once
3. **Duplicate Prevention**: Module loader prevents double loading
4. **Tree Shaking**: Use only the modules you import

## 🛡️ Security Features

- No external dependencies
- All modules are self-contained
- No network requests after initial load
- Safe for production use

## 🎨 Styling

Modules are unstyled by default. Add your own CSS:

```css
/* Example styling for UI components */
.modal { background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.button { padding: 12px 24px; border-radius: 6px; background: #667eea; color: white; }
```

## 📞 Support

- All modules tested and working
- No console errors when loaded properly
- ES6 class-based architecture
- Browser-compatible (ES6+)

**Ready to use!** 🚀 Just add the script tag and start using the modules.