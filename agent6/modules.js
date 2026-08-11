// Agent 6 Module Loader - Consolidated loading without duplicates

// Performance Modules
const performanceModules = [
  'performance-profiling.js',
  'performance-monitoring-advanced.js',
  'performance-testing.js',
  'performance-budget.js',
  'load-testing.js',
  'auto-scaling-policies.js',
  'resource-allocation.js',
  'capacity-planning.js',
  'network-optimization.js',
  'cache-warming.js',
  'asset-bundling.js',
  'asset-minification.js',
  'tree-shaking.js',
  'dead-code-elimination.js',
  'performance-sla-management.js'
];

// Analytics Modules
const analyticsModules = [
  'data-profiling.js',
  'forecasting-models.js',
  'regression-analysis.js',
  'hypothesis-testing.js',
  'statistical-tests.js',
  'trend-analysis.js',
  'seasonal-analysis.js',
  'nlp-analytics.js',
  'cluster-analysis.js',
  'principal-component-analysis.js',
  'factor-analysis.js',
  'multivariate-analysis.js',
  'decision-trees.js',
  'random-forest-analysis.js',
  'predictive-modeling.js',
  'statistical-analysis-tools.js',
  'data-mining-tools.js',
  'social-media-analytics.js',
  'text-mining.js',
  'correlation-analysis.js',
  'ab-test-analysis.js',
  'anomaly-detection-analytics.js',
  'data-quality-metrics.js',
  'time-series-analysis.js'
];

// Security Modules
const securityModules = [
  'iam-system.js',
  'siem-system.js',
  'mfa-system.js',
  'intrusion-detection-system.js',
  'intrusion-prevention-system.js',
  'firewall-management.js',
  'network-security-monitoring.js',
  'privileged-access-management.js',
  'sso-system.js',
  'security-governance.js',
  'security-metrics-dashboard.js',
  'data-loss-prevention.js',
  'security-policy-enforcement.js',
  'security-awareness-training.js',
  'pci-dss-compliance.js',
  'iso27001-compliance.js',
  'hipaa-compliance-tools.js',
  'ccpa-compliance-tools.js',
  'gdpr-compliance-tools.js',
  'security-token-management.js',
  'security-vulnerability-management.js',
  'security-patch-management.js',
  'security-configuration-management.js',
  'certificate-management.js',
  'security-reporting.js',
  'security-compliance-reporting.js',
  'security-risk-assessment.js',
  'security-risk-scoring.js',
  'security-compliance-dashboard.js',
  'zero-trust-architecture.js',
  'soc2-compliance.js',
  'phishing-detection.js',
  'malware-detection.js',
  'endpoint-security.js',
  'security-orchestration.js',
  'security-automation.js',
  'security-threat-intelligence.js',
  'security-audit-log.js',
  'threat-intelligence.js',
  'vulnerability-scanner.js',
  'incident-response.js',
  'security-analytics.js',
  'access-control-matrix.js'
];

// Blockchain Modules
const blockchainModules = [
  'blockchain-wallet.js',
  'blockchain-explorer.js',
  'zero-knowledge-proofs.js',
  'hash-verification.js',
  'multi-party-computation.js',
  'mining-pool.js',
  'smart-contract-monitoring.js',
  'web3-provider.js',
  'merkle-tree.js',
  'digital-signatures.js',
  'random-number-generator.js',
  'oracle-integration.js',
  'transaction-validation.js',
  'block-validation.js',
  'consensus-algorithm.js',
  'verifiable-credentials.js',
  'decentralized-identity.js',
  'gas-fee-estimation.js',
  'transaction-history.js',
  'network-monitoring.js',
  'node-management.js',
  'escrow-system.js',
  'time-locked-contracts.js',
  'token-swap.js',
  'liquidity-pool-management.js',
  'staking-system.js',
  'cross-chain-bridge.js',
  'metamask-integration.js',
  'wallet-connect.js',
  'hardware-wallet-integration.js',
  'multi-signature-wallet.js',
  'chain-reorganization.js',
  'fork-detection.js',
  'event-oracle.js',
  'yield-farming.js',
  'defi-integration.js',
  'privacy-coins.js',
  'decentralized-storage.js',
  'ipfs-integration.js',
  'nft-minting.js',
  'nft-trading.js',
  'nft-metadata-management.js',
  'nft-marketplace.js',
  'smart-contract-deployment.js',
  'smart-contract-testing.js',
  'cryptocurrency-payment-gateway.js'
];

// AIML Modules
const aimlModules = [
  'experiment-tracking.js',
  'ai-model-deployment.js',
  'feature-store.js',
  'model-registry.js',
  'hyperparameter-tuning.js',
  'ai-model-explainability.js',
  'ai-model-bias-detection.js',
  'automl-platform.js',
  'ai-model-versioning.js',
  'ai-model-ab-testing.js',
  'lead-scoring.js',
  'customer-lifetime-value.js',
  'customer-churn-prediction.js',
  'inventory-optimization.js',
  'price-optimization.js',
  'demand-forecasting.js',
  'route-optimization.js',
  'resource-scheduling-ml.js',
  'fraud-detection-ml.js',
  'predictive-maintenance.js',
  'ai-model-drift-detection.js',
  'ai-model-fairness.js',
  'ai-model-retraining.js',
  'ai-training-pipeline.js',
  'computer-vision.js',
  'natural-language-processing.js',
  'text-to-speech.js',
  'speech-to-text.js',
  'transfer-learning.js',
  'federated-learning.js',
  'neural-architecture-search.js',
  'reinforcement-learning.js',
  'generative-adversarial-networks.js',
  'variational-autoencoders.js',
  'named-entity-recognition.js',
  'text-summarization.js',
  'language-translation.js',
  'question-answering-system.js',
  'chatbot-framework.js',
  'recommendation-engine.js'
];

// UI Modules
const uiModules = [
  'code-editor.js',
  'rich-text-editor.js',
  'markdown-editor.js',
  'video-player.js',
  'audio-player.js',
  'image-viewer.js',
  'breadcrumb.js',
  'drawer.js',
  'tabs.js',
  'accordion.js',
  'carousel.js',
  'modal.js',
  'dropdown.js',
  'pagination.js',
  'slider.js',
  'range-slider.js',
  'tooltip.js',
  'progress-bar.js',
  'rating.js',
  'stepper.js',
  'loading-spinner.js',
  'badge.js',
  'toggle-switch.js',
  'alert.js',
  'spinner.js',
  'calendar.js',
  'tree-view.js',
  'color-picker.js'
];

// UIUX Modules
const uiuxModules = [
  'toast-notification-queue.js',
  'modal-stack-management.js',
  'i18n-framework.js',
  'markdown-editor-preview.js',
  'focus-management-system.js',
  'keyboard-navigation-enhancement.js',
  'screen-reader-optimization.js',
  'advanced-aria-labels-system.js',
  'animated-loading-skeletons.js',
  'micro-interactions-system.js',
  'gesture-based-navigation.js',
  'advanced-search-filters.js',
  'tabbed-interface-system.js',
  'tooltip-rich-content.js',
  'drag-drop-file-upload.js',
  'file-upload-progress.js',
  'collapsible-sidebar-navigation.js',
  'sticky-headers-navigation.js',
  'parallax-scrolling-effects.js',
  'swipeable-card-components.js',
  'pull-to-refresh-mobile.js',
  'infinite-scroll-virtual.js',
  'split-pane-layouts.js',
  'breadcrumb-navigation-history.js',
  'fab-system.js',
  'drag-drop-interface-builder.js',
  'customizable-dashboard-widgets.js',
  'haptic-feedback-integration.js',
  'error-boundary-ui.js',
  'fullscreen-mode-toggle.js',
  'file-preview-system.js',
  'multi-language-support.js',
  'code-editor-syntax-highlighting.js',
  'rich-text-editor-advanced.js',
  'video-editor-integration.js',
  'image-editor-integration.js',
  'audio-player-waveform.js',
  'video-player-custom-controls.js',
  'responsive-image-gallery-lightbox.js',
  'print-friendly-stylesheets.js',
  'empty-state-illustrations.js',
  'number-formatting-localization.js',
  'currency-formatting.js',
  'datetime-localization.js',
  'rtl-support.js',
  'advanced-dark-mode-system.js'
];

// Module loader function
window.Agent6ModuleLoader = {
  loaded: new Set(),
  
  async loadModule(category, filename) {
    const moduleKey = `${category}/${filename}`;
    
    if (this.loaded.has(moduleKey)) {
      console.log(`Module ${moduleKey} already loaded, skipping`);
      return;
    }
    
    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src="./${category}/${filename}"]`);
    if (existingScript) {
      console.log(`Script tag for ${moduleKey} already exists, skipping`);
      this.loaded.add(moduleKey);
      return;
    }
    
    try {
      const script = document.createElement('script');
      script.src = `./${category}/${filename}`;
      script.async = false;
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          this.loaded.add(moduleKey);
          console.log(`✅ Loaded ${moduleKey}`);
          resolve();
        };
        script.onerror = (error) => {
          console.error(`❌ Failed to load ${moduleKey}:`, error);
          reject(error);
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error(`❌ Failed to load ${moduleKey}:`, error);
    }
  },
  
  async loadAll() {
    const allModules = [
      ...performanceModules.map(f => ({ category: 'performance', file: f })),
      ...analyticsModules.map(f => ({ category: 'analytics', file: f })),
      ...securityModules.map(f => ({ category: 'security', file: f })),
      ...blockchainModules.map(f => ({ category: 'blockchain', file: f })),
      ...aimlModules.map(f => ({ category: 'aiml', file: f })),
      ...uiModules.map(f => ({ category: 'ui', file: f })),
      ...uiuxModules.map(f => ({ category: 'uiux', file: f }))
    ];
    
    console.log(`🚀 Loading ${allModules.length} Agent 6 modules...`);
    
    for (const module of allModules) {
      await this.loadModule(module.category, module.file);
    }
    
    console.log('✅ All Agent 6 modules loaded successfully!');
  },
  
  loadCategory(category) {
    const modules = this.getCategoryModules(category);
    console.log(`Loading ${modules.length} ${category} modules...`);
    
    return Promise.all(
      modules.map(filename => this.loadModule(category, filename))
    );
  },
  
  getCategoryModules(category) {
    const categoryMap = {
      performance: performanceModules,
      analytics: analyticsModules,
      security: securityModules,
      blockchain: blockchainModules,
      aiml: aimlModules,
      ui: uiModules,
      uiux: uiuxModules
    };
    return categoryMap[category] || [];
  }
};

// Auto-load on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.Agent6ModuleLoader.loadAll();
  });
} else {
  window.Agent6ModuleLoader.loadAll();
}