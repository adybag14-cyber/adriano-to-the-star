// Agent 6 Root Integration Module
// This file allows Agent 6 modules to be used in the main root folder

(function() {
  'use strict';
  
  // Configuration
  const DEFAULT_BASE_PATH = (function() {
    try {
      if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
        return new URL('./', document.currentScript.src).toString();
      }
    } catch (e) {}
    return './agent6/';
  })();

  const AGENT6_CONFIG = {
    basePath: DEFAULT_BASE_PATH, // Path to agent6 directory from root
    autoLoad: true,       // Automatically load modules on initialization
    debug: false,         // Enable debug logging
    modules: {
      // Core modules to load by default
      essential: ['LeadScoring', 'IamSystem', 'BlockchainWallet'],
      // Optional modules to load on demand
      optional: ['ComputerVision', 'Modal', 'Carousel']
    }
  };
  
  // Module registry
  const MODULE_REGISTRY = {
    // AI/ML Modules
    'LeadScoring': 'aiml/lead-scoring.js',
    'CustomerLifetimeValue': 'aiml/customer-lifetime-value.js',
    'CustomerChurnPrediction': 'aiml/customer-churn-prediction.js',
    'ComputerVision': 'aiml/computer-vision.js',
    'NaturalLanguageProcessing': 'aiml/natural-language-processing.js',
    'TextToSpeech': 'aiml/text-to-speech.js',
    'SpeechToText': 'aiml/speech-to-text.js',
    'TransferLearning': 'aiml/transfer-learning.js',
    'FederatedLearning': 'aiml/federated-learning.js',
    'GenerativeAdversarialNetworks': 'aiml/generative-adversarial-networks.js',
    'VariationalAutoencoders': 'aiml/variational-autoencoders.js',
    'ReinforcementLearning': 'aiml/reinforcement-learning.js',
    'NeuralArchitectureSearch': 'aiml/neural-architecture-search.js',
    
    // Analytics Modules
    'DataProfiling': 'analytics/data-profiling.js',
    'ForecastingModels': 'analytics/forecasting-models.js',
    'RegressionAnalysis': 'analytics/regression-analysis.js',
    'HypothesisTesting': 'analytics/hypothesis-testing.js',
    'StatisticalTests': 'analytics/statistical-tests.js',
    'TrendAnalysis': 'analytics/trend-analysis.js',
    'ClusterAnalysis': 'analytics/cluster-analysis.js',
    'PrincipalComponentAnalysis': 'analytics/principal-component-analysis.js',
    'FactorAnalysis': 'analytics/factor-analysis.js',
    'PredictiveModeling': 'analytics/predictive-modeling.js',
    
    // Blockchain Modules
    'BlockchainWallet': 'blockchain/blockchain-wallet.js',
    'BlockchainExplorer': 'blockchain/blockchain-explorer.js',
    'ZeroKnowledgeProofs': 'blockchain/zero-knowledge-proofs.js',
    'SmartContractDeployment': 'blockchain/smart-contract-deployment.js',
    'SmartContractTesting': 'blockchain/smart-contract-testing.js',
    'NftMinting': 'blockchain/nft-minting.js',
    'NftTrading': 'blockchain/nft-trading.js',
    'NftMarketplace': 'blockchain/nft-marketplace.js',
    'PrivacyCoins': 'blockchain/privacy-coins.js',
    'DecentralizedStorage': 'blockchain/decentralized-storage.js',
    'IpfsIntegration': 'blockchain/ipfs-integration.js',
    'CryptocurrencyPaymentGateway': 'blockchain/cryptocurrency-payment-gateway.js',
    'YieldFarming': 'blockchain/yield-farming.js',
    'DefiIntegration': 'blockchain/defi-integration.js',
    
    // Security Modules
    'IamSystem': 'security/iam-system.js',
    'MfaSystem': 'security/mfa-system.js',
    'SiemSystem': 'security/siem-system.js',
    'IntrusionDetectionSystem': 'security/intrusion-detection-system.js',
    'IntrusionPreventionSystem': 'security/intrusion-prevention-system.js',
    'FirewallManagement': 'security/firewall-management.js',
    'SsoSystem': 'security/sso-system.js',
    'SecurityAuditLog': 'security/security-audit-log.js',
    'ThreatIntelligence': 'security/threat-intelligence.js',
    'VulnerabilityScanner': 'security/vulnerability-scanner.js',
    'IncidentResponse': 'security/incident-response.js',
    'SecurityAnalytics': 'security/security-analytics.js',
    'AccessControlMatrix': 'security/access-control-matrix.js',
    'GdpdComplianceTools': 'security/gdpr-compliance-tools.js',
    'HipaaComplianceTools': 'security/hipaa-compliance-tools.js',
    'PciDssCompliance': 'security/pci-dss-compliance.js',
    'Iso27001Compliance': 'security/iso27001-compliance.js',
    
    // Performance Modules
    'PerformanceProfiling': 'performance/performance-profiling.js',
    'PerformanceMonitoringAdvanced': 'performance/performance-monitoring-advanced.js',
    'PerformanceTesting': 'performance/performance-testing.js',
    'PerformanceBudget': 'performance/performance-budget.js',
    'LoadTesting': 'performance/load-testing.js',
    'AutoScalingPolicies': 'performance/auto-scaling-policies.js',
    'ResourceAllocation': 'performance/resource-allocation.js',
    'CapacityPlanning': 'performance/capacity-planning.js',
    'NetworkOptimization': 'performance/network-optimization.js',
    'CacheWarming': 'performance/cache-warming.js',
    'AssetBundling': 'performance/asset-bundling.js',
    'AssetMinification': 'performance/asset-minification.js',
    'TreeShaking': 'performance/tree-shaking.js',
    'DeadCodeElimination': 'performance/dead-code-elimination.js',
    
    // UI Component Modules
    'CodeEditor': 'ui/code-editor.js',
    'RichTextEditor': 'ui/rich-text-editor.js',
    'MarkdownEditor': 'ui/markdown-editor.js',
    'VideoPlayer': 'ui/video-player.js',
    'AudioPlayer': 'ui/audio-player.js',
    'ImageViewer': 'ui/image-viewer.js',
    'Modal': 'ui/modal.js',
    'Carousel': 'ui/carousel.js',
    'Accordion': 'ui/accordion.js',
    'Tabs': 'ui/tabs.js',
    'Breadcrumb': 'ui/breadcrumb.js',
    'Drawer': 'ui/drawer.js',
    'Dropdown': 'ui/dropdown.js',
    'Pagination': 'ui/pagination.js',
    'Slider': 'ui/slider.js',
    'RangeSlider': 'ui/range-slider.js',
    'Tooltip': 'ui/tooltip.js',
    'ProgressBar': 'ui/progress-bar.js',
    'Rating': 'ui/rating.js',
    'Stepper': 'ui/stepper.js',
    'NotificationCenter': 'ui/notification-center.js',
    'ColorPicker': 'ui/color-picker.js',
    'TreeView': 'ui/tree-view.js',
    'Calendar': 'ui/calendar.js',
    'LoadingSpinner': 'ui/loading-spinner.js',
    'Badge': 'ui/badge.js',
    'ToggleSwitch': 'ui/toggle-switch.js',
    'Alert': 'ui/alert.js',
    'Spinner': 'ui/spinner.js',
    
    // UI/UX Feature Modules
    'ToastNotificationQueue': 'uiux/toast-notification-queue.js',
    'ModalStackManagement': 'uiux/modal-stack-management.js',
    'I18nFramework': 'uiux/i18n-framework.js',
    'MarkdownEditorPreview': 'uiux/markdown-editor-preview.js',
    'FocusManagementSystem': 'uiux/focus-management-system.js',
    'KeyboardNavigationEnhancement': 'uiux/keyboard-navigation-enhancement.js',
    'ScreenReaderOptimization': 'uiux/screen-reader-optimization.js',
    'AdvancedAriaLabelsSystem': 'uiux/advanced-aria-labels-system.js',
    'DragDropFileUpload': 'uiux/drag-drop-file-upload.js',
    'FileUploadProgress': 'uiux/file-upload-progress.js',
    'CollapsibleSidebarNavigation': 'uiux/collapsible-sidebar-navigation.js',
    'StickyHeadersNavigation': 'uiux/sticky-headers-navigation.js',
    'ParallaxScrollingEffects': 'uiux/parallax-scrolling-effects.js',
    'SwipeableCardComponents': 'uiux/swipeable-card-components.js',
    'PullToRefreshMobile': 'uiux/pull-to-refresh-mobile.js',
    'InfiniteScrollVirtual': 'uiux/infinite-scroll-virtual.js',
    'SplitPaneLayouts': 'uiux/split-pane-layouts.js',
    'BreadcrumbNavigationHistory': 'uiux/breadcrumb-navigation-history.js',
    'FabSystem': 'uiux/fab-system.js',
    'DragDropInterfaceBuilder': 'uiux/drag-drop-interface-builder.js',
    'CustomizableDashboardWidgets': 'uiux/customizable-dashboard-widgets.js',
    'HapticFeedbackIntegration': 'uiux/haptic-feedback-integration.js',
    'ErrorBoundaryUi': 'uiux/error-boundary-ui.js',
    'FullscreenModeToggle': 'uiux/fullscreen-mode-toggle.js',
    'FilePreviewSystem': 'uiux/file-preview-system.js',
    'MultiLanguageSupport': 'uiux/multi-language-support.js',
    'CodeEditorSyntaxHighlighting': 'uiux/code-editor-syntax-highlighting.js',
    'RichTextEditorAdvanced': 'uiux/rich-text-editor-advanced.js',
    'VideoEditorIntegration': 'uiux/video-editor-integration.js',
    'ImageEditorIntegration': 'uiux/image-editor-integration.js',
    'AudioPlayerWaveform': 'uiux/audio-player-waveform.js',
    'VideoPlayerCustomControls': 'uiux/video-player-custom-controls.js',
    'ResponsiveImageGalleryLightbox': 'uiux/responsive-image-gallery-lightbox.js',
    'PrintFriendlyStylesheets': 'uiux/print-friendly-stylesheets.js',
    'EmptyStateIllustrations': 'uiux/empty-state-illustrations.js',
    'NumberFormattingLocalization': 'uiux/number-formatting-localization.js',
    'CurrencyFormatting': 'uiux/currency-formatting.js',
    'DatetimeLocalization': 'uiux/datetime-localization.js',
    'RtlSupport': 'uiux/rtl-support.js',
    'AdvancedDarkModeSystem': 'uiux/advanced-dark-mode-system.js',
    'AnimatedLoadingSkeletons': 'uiux/animated-loading-skeletons.js',
    'MicroInteractionsSystem': 'uiux/micro-interactions-system.js',
    'GestureBasedNavigation': 'uiux/gesture-based-navigation.js',
    'AdvancedSearchFilters': 'uiux/advanced-search-filters.js',
    'TabbedInterfaceSystem': 'uiux/tabbed-interface-system.js',
    'TooltipRichContent': 'uiux/tooltip-rich-content.js',
    'ProgressIndicators': 'uiux/progress-indicators.js',
    'ContextMenusSystem': 'uiux/context-menus-system.js',
    'OnboardingWizardSystem': 'uiux/onboarding-wizard-system.js',
    'TourGuideSystem': 'uiux/tour-guide-system.js'
  };
  
  // Root Integration Class
  class Agent6Root {
    constructor(config = {}) {
      this.config = { ...AGENT6_CONFIG, ...config };
      this.loadedModules = new Set();
      this.moduleInstances = {};
      this.moduleLoadPromises = {};
      this.isInitialized = false;
      
      if (this.config.autoLoad) {
        this.initialize();
      }
    }
    
    async initialize() {
      try {
        this.log('Initializing Agent 6 Root Integration...');
        
        // Load essential modules first
        await this.loadModules(this.config.modules.essential);
        
        this.isInitialized = true;
        this.log('Agent 6 Root Integration initialized successfully!');
        
        // Emit initialization event
        this.emit('initialized', {
          loadedModules: Array.from(this.loadedModules),
          totalModules: this.loadedModules.size
        });
        
      } catch (error) {
        this.log('Failed to initialize Agent 6 Root Integration', 'error');
        throw error;
      }
    }
    
    async loadModule(moduleName) {
      if (this.loadedModules.has(moduleName)) {
        this.log(`Module ${moduleName} already loaded, skipping`);
        return this.moduleInstances[moduleName];
      }

      if (this.moduleLoadPromises[moduleName]) {
        return this.moduleLoadPromises[moduleName];
      }
      
      const modulePath = MODULE_REGISTRY[moduleName];
      if (!modulePath) {
        throw new Error(`Module ${moduleName} not found in registry`);
      }

      this.moduleLoadPromises[moduleName] = (async () => {
        try {
          this.log(`Loading module: ${moduleName}`);
          
          // Create script element
          const script = document.createElement('script');
          script.src = this.config.basePath + modulePath;
          script.async = false;
          
          // Wait for script to load
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          
          // Verify module is available
          if (typeof window[moduleName] === 'undefined') {
            throw new Error(`Module ${moduleName} not available after loading`);
          }
          
          this.loadedModules.add(moduleName);
          this.moduleInstances[moduleName] = window[moduleName];
          
          this.log(`Module ${moduleName} loaded successfully`);
          this.emit('moduleLoaded', { moduleName, modulePath });
          
          return this.moduleInstances[moduleName];
          
        } catch (error) {
          this.log(`Failed to load module ${moduleName}: ${error.message}`, 'error');
          throw error;
        } finally {
          delete this.moduleLoadPromises[moduleName];
        }
      })();

      return this.moduleLoadPromises[moduleName];
    }
    
    async loadModules(moduleNames) {
      const results = {};
      
      for (const moduleName of moduleNames) {
        try {
          results[moduleName] = await this.loadModule(moduleName);
        } catch (error) {
          results[moduleName] = null;
          this.log(`Failed to load ${moduleName}: ${error.message}`, 'error');
        }
      }
      
      return results;
    }
    
    async loadOptionalModules(moduleNames) {
      return this.loadModules(moduleNames);
    }
    
    getModule(moduleName) {
      if (!this.loadedModules.has(moduleName)) {
        throw new Error(`Module ${moduleName} not loaded. Use loadModule() first.`);
      }
      return this.moduleInstances[moduleName];
    }
    
    createInstance(moduleName, ...args) {
      const ModuleClass = this.getModule(moduleName);
      return new ModuleClass(...args);
    }
    
    getLoadedModules() {
      return Array.from(this.loadedModules);
    }
    
    getAvailableModules() {
      return Object.keys(MODULE_REGISTRY);
    }
    
    // Utility methods
    log(message, level = 'info') {
      if (this.config.debug) {
        console.log(`[Agent6Root:${level}] ${message}`);
      }
    }
    
    emit(eventName, data) {
      const event = new CustomEvent(`agent6:${eventName}`, { detail: data });
      document.dispatchEvent(event);
    }
    
    on(eventName, callback) {
      document.addEventListener(`agent6:${eventName}`, (event) => {
        callback(event.detail);
      });
    }
    
    // Convenience methods for common operations
    async quickStart() {
      await this.loadModules(['LeadScoring', 'IamSystem', 'BlockchainWallet']);
      return {
        leadScoring: this.createInstance('LeadScoring'),
        iam: this.createInstance('IamSystem'),
        wallet: this.createInstance('BlockchainWallet')
      };
    }
    
    // Batch operations
    async batchScoreLeads(leadsData) {
      const LeadScoring = this.getModule('LeadScoring');
      const scorer = new LeadScoring();
      
      return leadsData.map(lead => ({
        ...lead,
        score: scorer.score(lead)
      }));
    }
    
    async batchCreateUsers(usersData) {
      const IamSystem = this.getModule('IamSystem');
      const iam = new IamSystem();
      
      return usersData.map(userData => {
        iam.addUser(userData.username, userData.roles || []);
        return {
          username: userData.username,
          roles: userData.roles || [],
          created: true
        };
      });
    }
    
    // Health check
    async healthCheck() {
      const results = {
        totalModules: this.loadedModules.size,
        loadedModules: Array.from(this.loadedModules),
        status: this.isInitialized ? 'healthy' : 'not_initialized',
        timestamp: Date.now()
      };
      
      // Test a few modules
      const testModules = ['LeadScoring', 'IamSystem'];
      results.tests = {};
      
      for (const moduleName of testModules) {
        if (this.loadedModules.has(moduleName)) {
          try {
            const instance = this.createInstance(moduleName);
            results.tests[moduleName] = 'working';
          } catch (error) {
            results.tests[moduleName] = `error: ${error.message}`;
          }
        } else {
          results.tests[moduleName] = 'not_loaded';
        }
      }
      
      return results;
    }
  }
  
  // Global instance
  window.Agent6 = new Agent6Root();
  
  // Convenience aliases
  window.A6 = window.Agent6;
  window.agent6 = window.Agent6;
  
  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Agent6Root;
  }
  
  console.log('🚀 Agent 6 Root Integration loaded successfully!');
  console.log('💡 Use window.Agent6, window.A6, or window.agent6 to access the integration');
  console.log('📖 Check the documentation for usage examples');
  
})();